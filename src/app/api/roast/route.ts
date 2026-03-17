import { createHash } from 'node:crypto'
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { isDatabaseConnectionError } from '@/db/error-handler'
import { analysisItems, roasts } from '@/db/schema'

const RoastSchema = z.object({
  score: z.number().min(0).max(10),
  roastQuote: z.string(),
  fileName: z.string().optional(),
  issuesFound: z.number().int().min(0),
  errors: z.number().int().min(0),
  cards: z
    .array(
      z.object({
        severity: z.enum(['critical', 'warning', 'good']),
        title: z.string(),
        description: z.string()
      })
    )
    .min(1)
    .max(8),
  diffLines: z
    .array(
      z.object({
        variant: z.enum(['added', 'removed', 'context']),
        code: z.string()
      })
    )
    .min(1)
})

const SYSTEM_PROMPT = `
You are a brutally honest senior software engineer doing a code review.
You never sugarcoat. You find every problem.

Given a code snippet, return a JSON object with:
- score: float 0–10 (0 = catastrophic, 10 = flawless)
- roastQuote: one savage sentence summarising the state of the code
- fileName: inferred filename based on the code content (e.g. "calculateTotal.js"), or omit if unclear
- issuesFound: total count of issues identified
- errors: count of critical errors only
- cards: array of analysis cards, each with severity (critical/warning/good), title, description
- diffLines: a full git-style diff showing the suggested rewrite; each line has variant (added/removed/context) and code text — do NOT include the +/-/space prefix in the code field

Be accurate. Be mean if roastMode is true. Always include at least one "good" card if the code has anything right at all.
`.trim()

export async function POST(req: NextRequest) {
  const { code, lang, roastMode } = await req.json()

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return NextResponse.json({ error: 'code is required' }, { status: 400 })
  }

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: RoastSchema,
    system: SYSTEM_PROMPT,
    prompt: `roastMode: ${Boolean(roastMode)}\nlang: ${lang ?? 'unknown'}\n\n\`\`\`${lang ?? ''}\n${code}\n\`\`\``
  })

  const codeHash = createHash('sha256').update(code.trim()).digest('hex')

  try {
    const [roast] = await db.transaction(async (tx) => {
      const [r] = await tx
        .insert(roasts)
        .values({
          code,
          codeHash,
          lang: lang ?? 'unknown',
          fileName: object.fileName ?? null,
          score: String(object.score),
          roastQuote: object.roastQuote,
          issuesFound: object.issuesFound,
          errors: object.errors,
          roastMode: Boolean(roastMode),
          diff: object.diffLines
        })
        .returning({ id: roasts.id })

      await tx.insert(analysisItems).values(
        object.cards.map((card, i) => ({
          roastId: r.id,
          severity: card.severity,
          title: card.title,
          description: card.description,
          position: i
        }))
      )

      return [r]
    })

    return NextResponse.json({ id: roast.id })
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      console.error('Database connection error:', error)
      return NextResponse.json({ error: 'database_unavailable' }, { status: 503 })
    }

    throw error
  }
}
