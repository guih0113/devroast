'use server'

import { google } from '@ai-sdk/google'
import { createStreamableValue } from '@ai-sdk/rsc'
import { streamObject } from 'ai'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { analysisItems, roasts } from '@/db/schema'
import { getRoastSystemPrompt } from '@/lib/prompts'

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
    .optional()
})

export async function generateRoast(input: {
  id: string
  code: string
  lang: string
  roastMode: boolean
}) {
  const stream = createStreamableValue()

  ;(async () => {
    try {
      const { partialObjectStream, object } = streamObject({
        model: google('gemini-2.0-flash'),
        schema: RoastSchema,
        system: getRoastSystemPrompt(input.roastMode),
        prompt: `lang: ${input.lang}\n\n\`\`\`${input.lang}\n${input.code}\n\`\`\``
      })

      for await (const partial of partialObjectStream) {
        stream.update(partial)
      }

      const finalObject = await object
      stream.done()

      // Update database record to 'complete' status with results
      await db
        .update(roasts)
        .set({
          status: 'complete',
          score: String(finalObject.score),
          roastQuote: finalObject.roastQuote,
          fileName: finalObject.fileName ?? null,
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
    }
  })()

  return stream.value
}
