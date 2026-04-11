'use server'

import { groq } from '@ai-sdk/groq'
import { createStreamableValue } from '@ai-sdk/rsc'
import { generateObject, generateText } from 'ai'
import { eq } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { z } from 'zod'
import { db } from '@/db'
import { analysisItems, roasts } from '@/db/schema'
import { getRoastSystemPrompt } from '@/lib/prompts'

// Note: Groq structured outputs require all properties to be listed in `required`.
// Use `.nullable()` instead of `.optional()` to keep the key required while
// allowing `null` when unavailable.
const RoastSchema = z
  .object({
    score: z.number().min(0).max(10),
    roastQuote: z.string(),
    fileName: z.string().nullable(),
    issuesFound: z.number().int().min(0),
    errors: z.number().int().min(0),
    cards: z
      .array(
        z
          .object({
            severity: z.enum(['critical', 'warning', 'good']),
            title: z.string().max(80),
            description: z.string().max(160)
          })
          .strict()
      )
      .min(1)
      .max(3),
    diffLines: z
      .array(
        z
          .object({
            variant: z.enum(['added', 'removed', 'context']),
            code: z.string()
          })
          .strict()
      )
      .max(30)
      .nullable()
  })
  .required()
  .strict()

const EmergencyRoastSchema = z
  .object({
    score: z.number().min(0).max(10),
    roastQuote: z.string().max(140),
    fileName: z.string().nullable(),
    issuesFound: z.number().int().min(0),
    errors: z.number().int().min(0),
    cards: z
      .array(
        z
          .object({
            severity: z.enum(['critical', 'warning', 'good']),
            title: z.string().max(60),
            description: z.string().max(120)
          })
          .strict()
      )
      .min(1)
      .max(1),
    diffLines: z.null()
  })
  .required()
  .strict()

const GENERATION_ATTEMPTS = [
  {
    maxOutputTokens: 1300,
    compactMode: false
  },
  {
    maxOutputTokens: 900,
    compactMode: true
  }
] as const

function isVerboseLanguage(lang: string): boolean {
  const normalized = lang.trim().toLowerCase()
  return ['c++', 'cpp', 'c', 'java', 'c#', 'csharp', 'rust'].includes(normalized)
}

function extractFirstCompleteJsonObject(text: string): string | null {
  const source = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  const start = source.indexOf('{')

  if (start === -1) {
    return null
  }

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < source.length; i++) {
    const char = source[i]

    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }

      if (char === '\\') {
        escaped = true
        continue
      }

      if (char === '"') {
        inString = false
      }

      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') {
      depth++
      continue
    }

    if (char === '}') {
      depth--
      if (depth === 0) {
        return source.slice(start, i + 1)
      }
    }
  }

  return null
}

async function generateRoastWithTextFallback(
  input: { code: string; lang: string; roastMode: boolean },
  attempt: { maxOutputTokens: number; compactMode: boolean }
) {
  const result = await generateText({
    model: groq('openai/gpt-oss-20b'),
    system: getRoastSystemPrompt(input.roastMode),
    temperature: 0,
    maxRetries: 0,
    maxOutputTokens: attempt.maxOutputTokens,
    prompt: `${buildRoastPrompt(input, attempt.compactMode)}\n\nReturn only one minified valid JSON object.`
  })

  const jsonText = extractFirstCompleteJsonObject(result.text)
  if (!jsonText) {
    throw new Error(
      `Text fallback returned incomplete JSON output (finishReason: ${result.finishReason})`
    )
  }

  const parsed = JSON.parse(jsonText)
  return RoastSchema.parse(parsed)
}

async function generateEmergencyRoastObject(input: {
  code: string
  lang: string
  roastMode: boolean
}) {
  const result = await generateObject({
    model: groq('openai/gpt-oss-20b'),
    schema: EmergencyRoastSchema,
    system: getRoastSystemPrompt(input.roastMode),
    temperature: 0,
    maxRetries: 0,
    maxOutputTokens: 450,
    prompt: `Return only compact valid JSON for the provided code review.

Hard constraints:
- cards must contain exactly 1 item.
- diffLines must be null.
- roastQuote must be <= 120 characters.

Input language: ${input.lang}

Code:
${input.code}`
  })

  return RoastSchema.parse(result.object)
}

function createSafeFallbackRoast(input: {
  code: string
  lang: string
  roastMode: boolean
}): z.infer<typeof RoastSchema> {
  return {
    score: 4,
    roastQuote: input.roastMode
      ? 'This code fought the parser and won. Trim complexity before the next roast.'
      : 'Could not fully structure the review output; returning a compact safe analysis.',
    fileName: null,
    issuesFound: 1,
    errors: 0,
    cards: [
      {
        severity: 'warning',
        title: 'Compact fallback result',
        description: `The ${input.lang} submission produced truncated model output, so a safe compact result was returned.`
      }
    ],
    diffLines: null
  }
}

function buildRoastPrompt(input: { code: string; lang: string }, compactMode: boolean) {
  const languageCompactConstraints = isVerboseLanguage(input.lang)
    ? `
Language-specific compact mode:
- use concise wording to avoid truncation.
- cards must contain at most 2 items.
- diffLines must contain at most 6 items, or null.`
    : ''

  const fixRules = `
Fix policy:
- If score is below 7, diffLines must not be null.
- For score below 7, include actionable fix lines that address the highest-impact issues first.
- For score 7 or above, diffLines can be null unless meaningful improvements are available.`

  const compactConstraints = compactMode
    ? `\nFallback mode: produce compact output to guarantee valid JSON.
- roastQuote must be <= 120 characters.
- cards must contain at most 2 items.
- each card description must be <= 120 characters.
- diffLines must contain at most 8 items, or null.`
    : ''

  return `
Return only JSON that matches the schema. Keep output concise.${languageCompactConstraints}${compactConstraints}
${fixRules}

Input language: ${input.lang}

Code:
${input.code}
  `.trim()
}

export async function generateRoast(input: {
  id: string
  code: string
  lang: string
  roastMode: boolean
}) {
  const [existing] = await db
    .select({
      status: roasts.status,
      score: roasts.score,
      roastQuote: roasts.roastQuote,
      diff: roasts.diff
    })
    .from(roasts)
    .where(eq(roasts.id, input.id))
    .limit(1)

  const hasStoredData =
    Boolean(existing?.score) ||
    Boolean(existing?.roastQuote) ||
    (Array.isArray(existing?.diff) && existing.diff.length > 0)

  if (!existing || existing.status !== 'pending' || hasStoredData) {
    const stream = createStreamableValue()
    stream.done()
    return stream.value
  }

  const stream = createStreamableValue()

  ;(async () => {
    try {
      // Groq structured outputs do not support streaming. Generate the full
      // object in one request, then publish it through the streamable value.
      let finalObject: z.infer<typeof RoastSchema> | null = null
      let lastError: unknown = null

      for (const [attemptIndex, attempt] of GENERATION_ATTEMPTS.entries()) {
        try {
          const compactMode = attempt.compactMode || isVerboseLanguage(input.lang)
          const result = await generateObject({
            model: groq('openai/gpt-oss-20b'),
            schema: RoastSchema,
            system: getRoastSystemPrompt(input.roastMode),
            temperature: 0,
            maxRetries: 0,
            maxOutputTokens: attempt.maxOutputTokens,
            prompt: buildRoastPrompt(input, compactMode)
          })

          finalObject = result.object
          break
        } catch (attemptError) {
          lastError = attemptError
          console.error(`Roast generation attempt ${attemptIndex + 1} failed:`, attemptError)
        }
      }

      if (!finalObject) {
        try {
          finalObject = await generateEmergencyRoastObject(input)
        } catch (attemptError) {
          lastError = attemptError
          console.error('Roast emergency structured attempt failed:', attemptError)
        }
      }

      if (!finalObject) {
        for (const [attemptIndex, attempt] of GENERATION_ATTEMPTS.entries()) {
          try {
            finalObject = await generateRoastWithTextFallback(input, {
              ...attempt,
              compactMode: attempt.compactMode || isVerboseLanguage(input.lang)
            })
            break
          } catch (attemptError) {
            lastError = attemptError
            console.error(`Roast text fallback attempt ${attemptIndex + 1} failed:`, attemptError)
          }
        }
      }

      if (!finalObject) {
        console.error(
          'Roast generation exhausted all attempts, returning safe fallback:',
          lastError
        )
        finalObject = createSafeFallbackRoast(input)
      }

      await db.transaction(async (tx) => {
        await tx
          .update(roasts)
          .set({
            status: 'complete',
            score: String(finalObject.score),
            roastQuote: finalObject.roastQuote,
            fileName: finalObject.fileName,
            issuesFound: finalObject.issuesFound,
            errors: finalObject.errors,
            diff: finalObject.diffLines ?? []
          })
          .where(eq(roasts.id, input.id))

        if (finalObject.cards.length > 0) {
          await tx.insert(analysisItems).values(
            finalObject.cards.map((card, i) => ({
              roastId: input.id,
              severity: card.severity,
              title: card.title,
              description: card.description,
              position: i
            }))
          )
        }
      })

      updateTag(`roast:${input.id}:complete`)
      updateTag(`roast:${input.id}:failed`)
      stream.update(finalObject)
      stream.done()
    } catch (error) {
      console.error('Error generating roast:', error)

      // Mark as failed in database
      await db.update(roasts).set({ status: 'failed' }).where(eq(roasts.id, input.id))
      updateTag(`roast:${input.id}:complete`)
      updateTag(`roast:${input.id}:failed`)

      stream.error(error)
    }
  })()

  return stream.value
}
