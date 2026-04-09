'use server'

import { groq } from '@ai-sdk/groq'
import { createStreamableValue } from '@ai-sdk/rsc'
import { generateObject } from 'ai'
import { eq } from 'drizzle-orm'
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
            title: z.string(),
            description: z.string()
          })
          .strict()
      )
      .min(1)
      .max(8),
    diffLines: z
      .array(
        z
          .object({
            variant: z.enum(['added', 'removed', 'context']),
            code: z.string()
          })
          .strict()
      )
      .nullable()
  })
  .strict()

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

  let didFinish = false

  ;(async () => {
    try {
      // Groq structured outputs do not support streaming. Generate the full
      // object in one request, then publish it through the streamable value.
      const result = await generateObject({
        model: groq('openai/gpt-oss-20b'),
        schema: RoastSchema,
        system: getRoastSystemPrompt(input.roastMode),
        prompt: `lang: ${input.lang}\n\n\`\`\`${input.lang}\n${input.code}\n\`\`\``
      })

      const finalObject = result.object

      stream.update(finalObject)
      stream.done()
      didFinish = true

      // Update database record to 'complete' status with results
      await db
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

      // Insert analysis items
      if (finalObject.cards.length > 0) {
        await db.insert(analysisItems).values(
          finalObject.cards.map((card, i) => ({
            roastId: input.id,
            severity: card.severity,
            title: card.title,
            description: card.description,
            position: i
          }))
        )
      }
    } catch (error) {
      console.error('Error generating roast:', error)

      // Mark as failed in database
      await db.update(roasts).set({ status: 'failed' }).where(eq(roasts.id, input.id))

      stream.error(error)
      if (!didFinish) {
        stream.done()
      }
    }
  })()

  return stream.value
}
