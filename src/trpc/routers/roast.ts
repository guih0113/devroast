import { createHash } from 'node:crypto'
import { openai } from '@ai-sdk/openai'
import { TRPCError } from '@trpc/server'
import { generateObject } from 'ai'
import { asc, avg, count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { isDatabaseConnectionError } from '@/db/error-handler'
import { analysisItems, roasts } from '@/db/schema'
import { baseProcedure, createTRPCRouter } from '../init'

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

export const roastRouter = createTRPCRouter({
  getStats: baseProcedure.query(async () => {
    try {
      const [row] = await db.select({ total: count(), avgScore: avg(roasts.score) }).from(roasts)

      return {
        total: row?.total ?? 0,
        avgScore: row?.avgScore ? Number(row.avgScore).toFixed(1) : null
      }
    } catch (error) {
      if (isDatabaseConnectionError(error)) {
        return { total: 0, avgScore: null }
      }
      throw error
    }
  }),

  getResult: baseProcedure
    .input(
      z.object({
        id: z.string().uuid()
      })
    )
    .query(async ({ input }) => {
      try {
        const [roast] = await db.select().from(roasts).where(eq(roasts.id, input.id)).limit(1)
        if (!roast) return { data: null, dbOffline: false }

        const items = await db
          .select()
          .from(analysisItems)
          .where(eq(analysisItems.roastId, input.id))
          .orderBy(asc(analysisItems.position))

        return { data: { roast, items }, dbOffline: false }
      } catch (error) {
        if (isDatabaseConnectionError(error)) {
          return { data: null, dbOffline: true }
        }
        throw error
      }
    }),

  createPending: baseProcedure
    .input(
      z.object({
        code: z.string().min(1).max(5000),
        lang: z.string(),
        roastMode: z.boolean()
      })
    )
    .mutation(async ({ input }) => {
      const codeHash = createHash('sha256').update(input.code.trim()).digest('hex')

      try {
        const [roast] = await db
          .insert(roasts)
          .values({
            code: input.code,
            codeHash,
            lang: input.lang,
            roastMode: input.roastMode,
            status: 'pending'
          })
          .returning({ id: roasts.id })

        return { id: roast.id }
      } catch (error) {
        if (isDatabaseConnectionError(error)) {
          throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'database_unavailable' })
        }
        throw error
      }
    }),

  // @deprecated - Use createPending + generateRoast Server Action instead
  create: baseProcedure
    .input(
      z.object({
        code: z.string().min(1),
        lang: z.string().optional(),
        roastMode: z.boolean().optional()
      })
    )
    .mutation(async ({ input }) => {
      const code = input.code
      const lang = input.lang ?? 'unknown'
      const roastMode = Boolean(input.roastMode)

      if (!code || typeof code !== 'string' || code.trim().length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'code is required' })
      }

      const { object } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: RoastSchema,
        system: SYSTEM_PROMPT,
        prompt: `roastMode: ${roastMode}\nlang: ${lang}\n\n\`\`\`${lang}\n${code}\n\`\`\``
      })

      const codeHash = createHash('sha256').update(code.trim()).digest('hex')

      try {
        const [roast] = await db.transaction(async (tx) => {
          const [r] = await tx
            .insert(roasts)
            .values({
              code,
              codeHash,
              lang,
              fileName: object.fileName ?? null,
              score: String(object.score),
              roastQuote: object.roastQuote,
              issuesFound: object.issuesFound,
              errors: object.errors,
              roastMode,
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

        return { id: roast.id }
      } catch (error) {
        if (isDatabaseConnectionError(error)) {
          throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'database_unavailable' })
        }
        throw error
      }
    })
})
