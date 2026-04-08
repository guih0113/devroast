# Roast Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement AI-powered code analysis with streaming results, roast mode toggle, and persistent state management.

**Architecture:** User submits code → tRPC creates pending DB record → Server Action streams AI analysis → Progressive UI updates → DB updates to complete status.

**Tech Stack:** Next.js 15 App Router, tRPC, Google Gemini AI, Vercel AI SDK, Drizzle ORM, PostgreSQL

---

## File Structure

### New Files
- `src/db/migrations/0001_add_roast_status.sql` — Database migration for status field
- `src/actions/generate-roast.ts` — Server Action for AI streaming
- `src/app/roast/[id]/page.tsx` — Dynamic route for roast display
- `src/app/roast/[id]/_components/roast-viewer.tsx` — Client component for streaming
- `src/components/roast-display.tsx` — Shared roast display component
- `src/components/ui/spinner.tsx` — Loading spinner component
- `src/lib/prompts.ts` — AI system prompts

### Modified Files
- `src/db/schema.ts` — Add status enum and field
- `src/trpc/routers/roast.ts` — Update mutation to create pending records
- `src/app/_components/roast-form.tsx` — Update to use new mutation
- `src/app/results/page.tsx` — Refactor to use RoastDisplay component
- `.env.example` — Add Gemini API key
- `package.json` — Add @ai-sdk/google

---

## Task 1: Install Dependencies and Environment Setup

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Create: `.env.local` (if not exists)

- [ ] **Step 1: Install @ai-sdk/google package**

Run:
```bash
pnpm add @ai-sdk/google
```

Expected: Package added to dependencies in package.json

- [ ] **Step 2: Add Gemini API key to .env.example**

Add this line to `.env.example`:
```
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
```

- [ ] **Step 3: Add Gemini API key to .env.local**

Add this line to `.env.local`:
```
GOOGLE_GENERATIVE_AI_API_KEY=your_actual_google_api_key
```

Replace `your_actual_google_api_key` with your real API key from Google AI Studio.

- [ ] **Step 4: Verify environment variable loads**

Run:
```bash
pnpm dev
```

Check console for no errors. Stop the dev server (Ctrl+C).

- [ ] **Step 5: Commit dependency changes**

```bash
git add package.json pnpm-lock.yaml .env.example
git commit -m "chore: add @ai-sdk/google dependency and env variable"
```

---

## Task 2: Database Schema Migration

**Files:**
- Modify: `src/db/schema.ts:15-42`
- Create: Database migration file (auto-generated)

- [ ] **Step 1: Add status enum to schema**

In `src/db/schema.ts`, add this after line 15 (after `severityEnum`):

```tsx
export const roastStatusEnum = pgEnum('roast_status', ['pending', 'complete', 'failed'])
```

- [ ] **Step 2: Update roasts table schema**

In `src/db/schema.ts`, modify the `roasts` table definition (around line 17-41):

```tsx
export const roasts = pgTable(
  'roasts',
  {
    id: uuid().primaryKey().defaultRandom(),
    code: text().notNull(),
    codeHash: varchar({ length: 64 }).notNull(),
    lang: varchar({ length: 64 }).notNull(),
    fileName: varchar({ length: 255 }),
    score: numeric({ precision: 4, scale: 2 }),
    roastQuote: text(),
    issuesFound: integer().default(0),
    errors: integer().default(0),
    roastMode: boolean().notNull().default(false),
    status: roastStatusEnum().notNull().default('pending'),
    diff: jsonb()
      .$type<Array<{ variant: 'added' | 'removed' | 'context'; code: string }>>()
      .notNull()
      .default([]),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    index('roasts_score_idx').on(t.score),
    index('roasts_code_hash_idx').on(t.codeHash),
    index('roasts_created_at_idx').on(t.createdAt),
    index('roasts_status_idx').on(t.status)
  ]
)
```

Key changes:
- Made `score` and `roastQuote` nullable (removed `.notNull()`)
- Added `status` field with default `'pending'`
- Added index on `status` field

- [ ] **Step 3: Generate migration**

Run:
```bash
pnpm db:generate
```

Expected: New migration file created in `drizzle/` directory with status enum and field additions.

- [ ] **Step 4: Apply migration**

Run:
```bash
pnpm db:push
```

Expected: Database schema updated successfully.

- [ ] **Step 5: Verify migration in DB studio**

Run:
```bash
pnpm db:studio
```

Open browser to Drizzle Studio, check `roasts` table has `status` field with enum type.

- [ ] **Step 6: Commit schema changes**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat: add status field to roasts table for state management"
```

---

## Task 3: Create AI Prompt Utilities

**Files:**
- Create: `src/lib/prompts.ts`

- [ ] **Step 1: Create prompts utility file**

Create `src/lib/prompts.ts` with this content:

```tsx
export function getRoastSystemPrompt(roastMode: boolean): string {
  const tone = roastMode
    ? 'Be brutally sarcastic and savage in your roastQuote and card descriptions. Channel maximum snark. Make it hurt (but keep it professional).'
    : 'Be professional, constructive, and helpful in tone. Focus on teaching and improvement. Be encouraging where appropriate.'

  return `You are a senior software engineer conducting a code review.

${tone}

Given a code snippet, return a JSON object with:
- score: float 0–10 (0 = catastrophic, 10 = flawless)
- roastQuote: one ${roastMode ? 'savage' : 'insightful'} sentence summarizing the code quality
- fileName: inferred filename based on code content (e.g. "calculateTotal.js"), or omit if unclear
- issuesFound: total count of issues identified
- errors: count of critical errors only
- cards: array of analysis cards, each with severity (critical/warning/good), title, description
- diffLines: optional array of suggested fixes in git-style diff format; each line has variant (added/removed/context) and code text — do NOT include the +/-/space prefix in the code field. Include a diff when improvements are possible, omit when code is already excellent.

Always include at least one "good" card if the code has any redeeming qualities.`.trim()
}
```

- [ ] **Step 2: Verify file compiles**

Run:
```bash
pnpm run build
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit prompts utility**

```bash
git add src/lib/prompts.ts
git commit -m "feat: add AI system prompt utility with roast mode support"
```

---

## Task 4: Update tRPC Router with createPending Mutation

**Files:**
- Modify: `src/trpc/routers/roast.ts:97-161`

- [ ] **Step 1: Add createPending mutation**

In `src/trpc/routers/roast.ts`, add this new mutation after the `getResult` query (around line 95, before the `create` mutation):

```tsx
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
```

- [ ] **Step 2: Update getResult to include status**

The current `getResult` query already returns the full roast object which will now include the `status` field from the schema. No changes needed here.

- [ ] **Step 3: Add deprecation comment to create mutation**

Add a comment above the existing `create` mutation (around line 97):

```tsx
  // @deprecated - Use createPending + generateRoast Server Action instead
  create: baseProcedure
```

- [ ] **Step 4: Verify TypeScript compiles**

Run:
```bash
pnpm run build
```

Expected: No TypeScript errors.

- [ ] **Step 5: Commit tRPC router changes**

```bash
git add src/trpc/routers/roast.ts
git commit -m "feat: add createPending mutation for roast state management"
```

---

## Task 5: Create Server Action for AI Streaming

**Files:**
- Create: `src/actions/generate-roast.ts`

- [ ] **Step 1: Create Server Action file with imports**

Create `src/actions/generate-roast.ts` with these imports:

```tsx
'use server'

import { google } from '@ai-sdk/google'
import { eq } from 'drizzle-orm'
import { streamObject } from 'ai'
import { createStreamableValue } from 'ai/rsc'
import { z } from 'zod'
import { db } from '@/db'
import { analysisItems, roasts } from '@/db/schema'
import { getRoastSystemPrompt } from '@/lib/prompts'
```

- [ ] **Step 2: Add RoastSchema definition**

Add the schema after imports:

```tsx
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
```

- [ ] **Step 3: Create generateRoast function**

Add the main function:

```tsx
export async function generateRoast(input: {
  id: string
  code: string
  lang: string
  roastMode: boolean
}) {
  const stream = createStreamableValue()

  ;(async () => {
    try {
      const { partialObjectStream, object } = await streamObject({
        model: google('gemini-1.5-flash'),
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
```

- [ ] **Step 4: Verify TypeScript compiles**

Run:
```bash
pnpm run build
```

Expected: No TypeScript errors.

- [ ] **Step 5: Commit Server Action**

```bash
git add src/actions/generate-roast.ts
git commit -m "feat: add Server Action for AI streaming with Gemini"
```

---

## Task 6: Create Spinner UI Component

**Files:**
- Create: `src/components/ui/spinner.tsx`

- [ ] **Step 1: Create spinner component**

Create `src/components/ui/spinner.tsx`:

```tsx
import type { ComponentProps } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

const spinner = tv({
  base: [
    'inline-block animate-spin rounded-full border-2 border-solid border-current',
    'border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]'
  ],
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12'
    }
  },
  defaultVariants: {
    size: 'md'
  }
})

type SpinnerProps = ComponentProps<'div'> & VariantProps<typeof spinner>

export function Spinner({ size, className, ...props }: SpinnerProps) {
  return (
    <div role="status" aria-label="Loading" className={spinner({ size, className })} {...props} />
  )
}
```

- [ ] **Step 2: Verify component compiles**

Run:
```bash
pnpm run build
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit spinner component**

```bash
git add src/components/ui/spinner.tsx
git commit -m "feat: add spinner UI component for loading states"
```

---

## Task 7: Create Shared RoastDisplay Component

**Files:**
- Create: `src/components/roast-display.tsx`

- [ ] **Step 1: Create RoastDisplay component with imports**

Create `src/components/roast-display.tsx`:

```tsx
import type { BundledLanguage } from 'shiki'
import { AnalysisCard } from '@/components/ui/analysis-card'
import { DiffLine } from '@/components/ui/diff-line'
import { ScoreRing } from '@/components/ui/score-ring'
import { getVerdict } from '@/lib/score'
import type { AnalysisItem, Roast } from '@/db/schema'
```

- [ ] **Step 2: Add skeleton components**

```tsx
function ScoreRingSkeleton() {
  return (
    <div className="flex h-48 w-48 items-center justify-center">
      <div className="h-40 w-40 animate-pulse rounded-full bg-zinc-800" />
    </div>
  )
}

function QuoteSkeleton() {
  return (
    <div className="max-w-xl space-y-3">
      <div className="h-6 w-3/4 animate-pulse rounded bg-zinc-800" />
      <div className="h-6 w-full animate-pulse rounded bg-zinc-800" />
      <div className="h-6 w-2/3 animate-pulse rounded bg-zinc-800" />
    </div>
  )
}

function CardsSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {[1, 2].map((row) => (
        <div key={row} className="grid grid-cols-2 gap-5">
          {[1, 2].map((col) => (
            <div key={col} className="h-32 animate-pulse rounded-lg bg-zinc-800" />
          ))}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Add RoastDisplay component**

```tsx
interface RoastDisplayProps {
  roast: Partial<Roast>
  items?: AnalysisItem[]
  isLoading?: boolean
  code?: string
  language?: BundledLanguage
}

export function RoastDisplay({ roast, items = [], isLoading = false }: RoastDisplayProps) {
  const score = roast.score ? Number(roast.score) : undefined
  const verdict = score !== undefined ? getVerdict(score) : null
  const diff = roast.diff ?? []

  const itemRows: (typeof items)[] = []
  for (let i = 0; i < items.length; i += 2) {
    itemRows.push(items.slice(i, i + 2))
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Score and Quote Section */}
      <div className="flex items-center gap-12">
        {score !== undefined ? (
          <ScoreRing score={score} />
        ) : (
          <ScoreRingSkeleton />
        )}

        <div className="flex flex-col gap-4">
          {roast.fileName && (
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-600">
              <span className="text-zinc-400">results</span>
              <span>/</span>
              <span>{roast.fileName}</span>
            </div>
          )}

          {verdict && <div className="font-mono text-xs text-zinc-500">{verdict.label}</div>}

          {roast.roastQuote ? (
            <blockquote className="max-w-xl font-bold font-mono text-xl text-zinc-100 leading-snug">
              &ldquo;{roast.roastQuote}&rdquo;
            </blockquote>
          ) : isLoading ? (
            <QuoteSkeleton />
          ) : null}

          {(roast.issuesFound !== undefined || roast.errors !== undefined || roast.createdAt) && (
            <div className="flex items-center gap-4 font-mono text-xs text-zinc-600">
              {roast.issuesFound !== undefined && (
                <>
                  <span>{'>'} {roast.issuesFound} issues found</span>
                  <span>·</span>
                </>
              )}
              {roast.errors !== undefined && (
                <>
                  <span>
                    {roast.errors} error{roast.errors !== 1 ? 's' : ''}
                  </span>
                  <span>·</span>
                </>
              )}
              {roast.createdAt && (
                <span suppressHydrationWarning>
                  $ {new Date(roast.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Analysis Cards Section */}
      {(items.length > 0 || isLoading) && (
        <>
          <div className="h-px bg-zinc-800" />

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <span className="font-bold font-mono text-emerald-500 text-sm">{'// '}</span>
              <span className="font-bold font-mono text-sm text-zinc-100">detailed_analysis</span>
            </div>

            {items.length > 0 ? (
              <div className="flex flex-col gap-5">
                {itemRows.map((row, rowIdx) => (
                  <div key={rowIdx} className="grid grid-cols-2 gap-5">
                    {row.map((item) => (
                      <AnalysisCard.Root key={item.id}>
                        <AnalysisCard.Badge variant={item.severity} />
                        <AnalysisCard.Title>{item.title}</AnalysisCard.Title>
                        <AnalysisCard.Description>{item.description}</AnalysisCard.Description>
                      </AnalysisCard.Root>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <CardsSkeleton />
            )}
          </div>
        </>
      )}

      {/* Diff Section */}
      {diff.length > 0 && (
        <>
          <div className="h-px bg-zinc-800" />

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <span className="font-bold font-mono text-emerald-500 text-sm">{'// '}</span>
              <span className="font-bold font-mono text-sm text-zinc-100">suggested_fix</span>
            </div>

            <div className="flex flex-col border border-zinc-800 bg-zinc-900">
              {diff.map((line, i) => (
                <DiffLine key={i} variant={line.variant} code={line.code} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify component compiles**

Run:
```bash
pnpm run build
```

Expected: No TypeScript errors.

- [ ] **Step 5: Commit RoastDisplay component**

```bash
git add src/components/roast-display.tsx
git commit -m "feat: add shared RoastDisplay component with skeleton states"
```

---

## Task 8: Create RoastViewer Client Component

**Files:**
- Create: `src/app/roast/[id]/_components/roast-viewer.tsx`

- [ ] **Step 1: Create roast viewer directory**

Run:
```bash
mkdir -p src/app/roast/[id]/_components
```

- [ ] **Step 2: Create RoastViewer component**

Create `src/app/roast/[id]/_components/roast-viewer.tsx`:

```tsx
'use client'

import { readStreamableValue } from 'ai/rsc'
import { useEffect, useState } from 'react'
import { generateRoast } from '@/actions/generate-roast'
import { RoastDisplay } from '@/components/roast-display'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { AnalysisItem, Roast } from '@/db/schema'

interface RoastViewerProps {
  roast: Roast
  items: AnalysisItem[]
}

export function RoastViewer({ roast: initialRoast, items: initialItems }: RoastViewerProps) {
  const [roast, setRoast] = useState<Partial<Roast>>(initialRoast)
  const [items, setItems] = useState<AnalysisItem[]>(initialItems)
  const [isGenerating, setIsGenerating] = useState(initialRoast.status === 'pending')
  const [error, setError] = useState<string | null>(
    initialRoast.status === 'failed' ? 'Generation failed. Please try again.' : null
  )

  async function startGeneration() {
    setError(null)
    setIsGenerating(true)

    try {
      const stream = await generateRoast({
        id: initialRoast.id,
        code: initialRoast.code,
        lang: initialRoast.lang,
        roastMode: initialRoast.roastMode
      })

      for await (const partial of readStreamableValue(stream)) {
        if (partial) {
          setRoast((prev) => ({ ...prev, ...partial }))

          // Update items as they stream in
          if (partial.cards) {
            setItems(
              partial.cards.map((card, i) => ({
                id: `temp-${i}`,
                roastId: initialRoast.id,
                severity: card.severity,
                title: card.title,
                description: card.description,
                position: i
              }))
            )
          }
        }
      }

      setIsGenerating(false)

      // Reload page to get final DB state with proper IDs
      window.location.reload()
    } catch (err) {
      console.error('Error generating roast:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (initialRoast.status === 'pending') {
      startGeneration()
    }
  }, [initialRoast.status])

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <span className="font-mono text-sm text-red-400">{error}</span>
          <Button variant="primary" size="md" onClick={startGeneration}>
            $ retry
          </Button>
        </div>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-col gap-10 px-20 py-10">
          <div className="flex items-center justify-center gap-4 py-12">
            <Spinner size="lg" className="text-emerald-500" />
            <span className="font-mono text-sm text-zinc-400">$ analyzing code...</span>
          </div>

          <RoastDisplay roast={roast} items={items} isLoading={true} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-col gap-10 px-20 py-10">
        <RoastDisplay roast={roast} items={items} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify component compiles**

Run:
```bash
pnpm run build
```

Expected: No TypeScript errors.

- [ ] **Step 4: Commit RoastViewer component**

```bash
git add src/app/roast/[id]/_components/roast-viewer.tsx
git commit -m "feat: add RoastViewer client component with streaming support"
```

---

## Task 9: Create Dynamic Roast Page Route

**Files:**
- Create: `src/app/roast/[id]/page.tsx`

- [ ] **Step 1: Create roast page**

Create `src/app/roast/[id]/page.tsx`:

```tsx
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { RoastViewer } from './_components/roast-viewer'
import { getCaller } from '@/trpc/server'

type Props = {
  params: Promise<{ id: string }>
}

export default async function RoastPage({ params }: Props) {
  const { id } = await params

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    notFound()
  }

  const trpc = await getCaller()
  const { data: result, dbOffline } = await trpc.roast.getResult({ id })

  if (!result) {
    if (dbOffline) {
      return (
        <div className="min-h-screen bg-zinc-950">
          <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-10">
            <span className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-mono text-[11px] text-amber-300">
              DB offline - please try again later
            </span>
            <Link href="/">
              <button className="font-mono text-sm text-zinc-400 hover:text-zinc-300">
                ← back to home
              </button>
            </Link>
          </main>
        </div>
      )
    }
    notFound()
  }

  const { roast, items } = result

  return (
    <div className="min-h-screen bg-zinc-950">
      <main>
        <div className="flex items-center gap-2 px-20 pt-10 font-mono text-xs text-zinc-600">
          <Link href="/" className="transition-colors hover:text-zinc-400">
            {'#'} devroast
          </Link>
          <span>/</span>
          <span className="text-zinc-400">roast</span>
          <span>/</span>
          <span className="text-zinc-500">{roast.fileName ?? 'submission'}</span>
        </div>
        <RoastViewer roast={roast} items={items} />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify page compiles**

Run:
```bash
pnpm run build
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit roast page**

```bash
git add src/app/roast/[id]/page.tsx
git commit -m "feat: add dynamic roast page with status-based rendering"
```

---

## Task 10: Update RoastForm to Use New Mutation

**Files:**
- Modify: `src/app/_components/roast-form.tsx:31-49`

- [ ] **Step 1: Update mutation call**

In `src/app/_components/roast-form.tsx`, replace the `useMutation` line (around line 32):

```tsx
const { mutateAsync } = useMutation(trpc.roast.createPending.mutationOptions())
```

- [ ] **Step 2: Update handleRoast function**

Replace the `handleRoast` function (around lines 39-49):

```tsx
async function handleRoast() {
  if (!code.trim() || loading || isOverLimit) return
  setLoading(true)
  try {
    const res = await mutateAsync({ code, lang: 'javascript', roastMode })
    router.push(`/roast/${res.id}`)
  } catch (err) {
    console.error(err)
    setLoading(false)
  }
}
```

- [ ] **Step 3: Verify form compiles**

Run:
```bash
pnpm run build
```

Expected: No TypeScript errors.

- [ ] **Step 4: Test form submission**

Run:
```bash
pnpm dev
```

1. Open http://localhost:3000
2. Click "$ roast my code" button
3. Verify redirect to `/roast/[uuid]` route
4. Stop dev server

- [ ] **Step 5: Commit form update**

```bash
git add src/app/_components/roast-form.tsx
git commit -m "feat: update RoastForm to use createPending mutation"
```

---

## Task 11: Refactor Results Page to Use RoastDisplay

**Files:**
- Modify: `src/app/results/page.tsx:49-168`

- [ ] **Step 1: Update imports**

In `src/app/results/page.tsx`, replace the imports (lines 5-10):

```tsx
import { RoastDisplay } from '@/components/roast-display'
import { CodeViewer } from './_components/code-viewer'
import { getCaller } from '@/trpc/server'
```

- [ ] **Step 2: Simplify ResultsPage component**

Replace the component body (lines 49-168) with:

```tsx
export default async function ResultsPage({ searchParams }: Props) {
  const { id } = await searchParams

  if (!id) notFound()

  const trpc = await getCaller()
  const { data: result, dbOffline } = await trpc.roast.getResult({ id })

  if (!result) notFound()

  const { roast, items } = result

  return (
    <div className="min-h-screen bg-zinc-950">
      <main className="flex flex-col gap-10 px-20 py-10">
        <div className="flex items-center gap-2 font-mono text-xs text-zinc-600">
          <Link href="/" className="transition-colors hover:text-zinc-400">
            {'#'} devroast
          </Link>
          <span>/</span>
          <span className="text-zinc-400">results</span>
          <span>/</span>
          <span>{roast.fileName ?? 'submission'}</span>
        </div>

        <RoastDisplay roast={roast} items={items} />

        <div className="h-px bg-zinc-800" />

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold font-mono text-emerald-500 text-sm">{'// '}</span>
            <span className="font-bold font-mono text-sm text-zinc-100">your_submission</span>
          </div>
          <CodeViewer code={roast.code} language={roast.lang as BundledLanguage} />
        </div>

        {dbOffline && (
          <div className="flex justify-center">
            <span className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-mono text-[11px] text-amber-300">
              DB offline
            </span>
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Add missing Link import**

Add `Link` to the imports at the top:

```tsx
import Link from 'next/link'
```

- [ ] **Step 4: Verify results page compiles**

Run:
```bash
pnpm run build
```

Expected: No TypeScript errors.

- [ ] **Step 5: Commit results page refactor**

```bash
git add src/app/results/page.tsx
git commit -m "refactor: use RoastDisplay component in results page"
```

---

## Task 12: Integration Testing

**Files:**
- Test: Full application flow

- [ ] **Step 1: Start development server**

Run:
```bash
pnpm db:up
pnpm dev
```

- [ ] **Step 2: Test fresh roast creation (roast mode ON)**

1. Open http://localhost:3000
2. Ensure roast mode toggle is ON
3. Paste sample code in editor
4. Click "$ roast my code"
5. Verify redirect to `/roast/[id]`
6. Verify loading spinner appears with "$ analyzing code..."
7. Verify progressive updates: score → quote → cards → diff
8. Verify sarcastic tone in quote and descriptions
9. Verify final results display correctly

- [ ] **Step 3: Test fresh roast creation (roast mode OFF)**

1. Navigate back to home
2. Turn OFF roast mode toggle
3. Paste different code
4. Click "$ roast my code"
5. Verify redirect and loading state
6. Verify professional/constructive tone in results
7. Verify all sections render properly

- [ ] **Step 4: Test direct link to completed roast**

1. Copy URL from previous roast (e.g., `/roast/abc-123-def`)
2. Open in new incognito tab
3. Verify immediate display (no loading state)
4. Verify all data displays correctly

- [ ] **Step 5: Test invalid roast ID**

1. Navigate to `/roast/invalid-id`
2. Verify 404 page appears

- [ ] **Step 6: Test code character limit**

1. Navigate to home
2. Paste code >2000 characters
3. Verify character counter shows red
4. Verify button is disabled
5. Verify cannot submit

- [ ] **Step 7: Test results page backward compatibility**

1. Use an existing roast ID created before this change (if any)
2. Navigate to `/results?id=[old-id]`
3. Verify page still displays correctly

- [ ] **Step 8: Check database records**

Run:
```bash
pnpm db:studio
```

1. Open roasts table
2. Verify new records have `status: 'complete'`
3. Verify all fields populated correctly
4. Check analysisItems table has corresponding records

- [ ] **Step 9: Stop servers**

```bash
# Stop dev server (Ctrl+C)
pnpm db:down
```

- [ ] **Step 10: Document test results**

Create a test summary in terminal output noting any issues found.

---

## Task 13: Final Build and Commit

**Files:**
- All modified files

- [ ] **Step 1: Run production build**

Run:
```bash
pnpm run build
```

Expected: Build completes successfully with no errors.

- [ ] **Step 2: Check for any uncommitted changes**

Run:
```bash
git status
```

Expected: All files should be committed. If any remain:

```bash
git add .
git commit -m "chore: final cleanup and adjustments"
```

- [ ] **Step 3: Review commit history**

Run:
```bash
git log --oneline -15
```

Expected: See all commits from this implementation plan with clear, descriptive messages.

- [ ] **Step 4: Create summary commit (optional)**

If you want to mark the completion:

```bash
git commit --allow-empty -m "feat: complete roast creation with AI streaming

- Add Google Gemini AI integration
- Implement server-side streaming with progressive UI
- Add pending/complete/failed status management
- Support roast mode toggle (sarcastic vs professional)
- Create shared RoastDisplay component
- Add retry mechanism for failed generations"
```

- [ ] **Step 5: Document any known issues**

Create notes about any edge cases or limitations discovered during testing.

---

## Post-Implementation Checklist

- [ ] All tests passing
- [ ] Production build succeeds
- [ ] Database migration applied
- [ ] Environment variables documented
- [ ] Both roast modes tested (sarcastic & professional)
- [ ] Error states tested (failed generation, invalid ID)
- [ ] Direct links work for completed roasts
- [ ] Progressive streaming displays smoothly
- [ ] Character limit enforced
- [ ] All commits have clear messages

---

## Known Limitations & Future Work

1. **Idempotency:** Currently, if multiple users open the same pending roast link, generation may trigger multiple times. Add a lock mechanism or "processing" status.

2. **Retry button position:** On failed status, user must reload page to see retry. Consider adding retry button that appears without reload.

3. **Streaming progress indicator:** Could add percentage or step indicator (e.g., "analyzing structure... generating suggestions...")

4. **Cancel generation:** No way to cancel in-progress generation. Consider adding cancel button with cleanup.

5. **Rate limiting:** No rate limiting on roast creation. Add per-IP or session limits.

6. **Diff rendering:** Large diffs may be hard to read. Consider side-by-side view or collapsible sections.
