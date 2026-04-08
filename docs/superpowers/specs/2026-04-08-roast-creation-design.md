# Roast Creation Feature Design

**Date:** 2026-04-08
**Status:** Approved
**Implementation approach:** Server-side streaming with RSC

---

## Overview

This feature enables users to paste code snippets and receive AI-powered analysis with progressive UI updates. The system supports two modes: sarcastic "roast mode" and professional constructive feedback.

## Goals

1. Allow users to submit code and see AI analysis with real-time streaming updates
2. Support roast mode toggle (sarcastic vs professional tone)
3. Generate suggested fixes as part of the analysis
4. Provide shareable, bookmarkable URLs for roast results
5. Migrate AI provider from OpenAI to Google Gemini

## Non-Goals

- Share roast functionality (future feature)
- User authentication or roast history tracking
- Code editing within the roast view

---

## Architecture

### Flow

1. **Submission:** User pastes code in `RoastForm` on homepage, toggles roast mode, clicks "$ roast my code"
2. **DB Record Creation:** tRPC mutation creates pending roast record in database with `status: 'pending'`, returns UUID
3. **Redirect:** Client redirects to `/roast/[id]` with the returned UUID
4. **Loading:** `/roast/[id]` page displays neutral loading UI ("$ analyzing code...")
5. **Generation:** Server Action initiates AI streaming via Vercel AI SDK with Gemini
6. **Streaming:** Results stream progressively (score → quote → cards → diff), UI updates in real-time
7. **Persistence:** Once complete, database record updates to `status: 'complete'` with full results
8. **Permanence:** URL `/roast/[id]` now permanently displays the saved roast

### Key Components

- `src/app/roast/[id]/page.tsx` — New dynamic route for roast display + generation
- `src/app/roast/[id]/_components/roast-viewer.tsx` — Client component handling streaming state
- `src/components/roast-display.tsx` — Shared component for rendering roast results (used by both `/roast/[id]` and `/results`)
- `src/actions/generate-roast.ts` — Server Action for AI generation with streaming
- `src/app/_components/roast-form.tsx` — Updated to use tRPC mutation for creating pending record + redirect

---

## AI Provider Migration (OpenAI → Gemini)

### Installation

```bash
pnpm add @ai-sdk/google
```

### Environment Variables

Add to `.env.local` and `.env.example`:
```
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

### Model Configuration

- **Import:** Replace `import { openai } from '@ai-sdk/openai'` with `import { google } from '@ai-sdk/google'`
- **Model:** Use `google('gemini-1.5-flash')` or `google('gemini-2.0-flash-exp')`

### System Prompt

Update system prompt to adjust tone based on `roastMode`:

```
You are a senior software engineer conducting a code review.

${roastMode 
  ? 'Be brutally sarcastic and savage in your roastQuote and card descriptions. Channel maximum snark.'
  : 'Be professional, constructive, and helpful in tone. Focus on teaching and improvement.'}

Given a code snippet, return a JSON object with:
- score: float 0–10 (0 = catastrophic, 10 = flawless)
- roastQuote: one ${roastMode ? 'savage' : 'insightful'} sentence summarizing the code quality
- fileName: inferred filename based on code content (e.g. "calculateTotal.js"), or omit if unclear
- issuesFound: total count of issues identified
- errors: count of critical errors only
- cards: array of analysis cards, each with severity (critical/warning/good), title, description
- diffLines: optional array of suggested fixes in git-style diff format; each line has variant (added/removed/context) and code text — do NOT include the +/-/space prefix in the code field. Include a diff when improvements are possible, omit when code is already excellent.

Always include at least one "good" card if the code has any redeeming qualities.
```

### Schema Updates

- Keep `diffLines` optional (only required when code needs improvements)
- Schema remains same as current `RoastSchema` in `src/trpc/routers/roast.ts`

---

## Database Schema Updates

### Add Status Field to Roasts Table

Update `src/db/schema.ts` to include a status field:

```tsx
export const roastStatusEnum = pgEnum('roast_status', ['pending', 'complete', 'failed'])

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
      .default([]),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  // ... indexes
)
```

**Key changes:**
- Add `roastStatusEnum` with values: `'pending'`, `'complete'`, `'failed'`
- Add `status` field to roasts table (defaults to `'pending'`)
- Make `score`, `roastQuote` nullable (only populated after generation completes)

**Migration required:** Generate and run Drizzle migration to add status field.

---

## URL State Management & Routing

### RoastForm Changes

On submit, call tRPC mutation to create pending record:

```tsx
async function handleRoast() {
  if (!code.trim() || loading || isOverLimit) return
  setLoading(true)
  
  try {
    const { id } = await createPendingRoast({ code, lang, roastMode })
    router.push(`/roast/${id}`)
  } catch (err) {
    console.error(err)
    setLoading(false)
  }
}
```

**tRPC mutation signature:**
```tsx
createPendingRoast: baseProcedure
  .input(
    z.object({
      code: z.string().min(1),
      lang: z.string(),
      roastMode: z.boolean()
    })
  )
  .mutation(async ({ input }) => {
    const codeHash = createHash('sha256').update(input.code.trim()).digest('hex')
    
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
  })
```

### `/roast/[id]` Page Logic

1. Extract `[id]` param from URL
2. Query database for roast record via tRPC `roast.getResult({ id })`
3. **If status is 'pending':**
   - Trigger Server Action for AI generation
   - Show streaming UI with progressive updates
   - Server Action updates DB record to `status: 'complete'` when done
4. **If status is 'complete':**
   - Display final results immediately (no loading state)
5. **If status is 'failed':**
   - Show error message with retry button
   - Retry calls Server Action again
6. **If record doesn't exist:**
   - Redirect to `/` with "Roast not found" message

---

## Server Action for AI Streaming

### File Structure

**File:** `src/actions/generate-roast.ts`

**Signature:**
```tsx
'use server'

import { streamObject } from 'ai'
import { createStreamableValue } from 'ai/rsc'
import { google } from '@ai-sdk/google'

export async function generateRoast(input: {
  id: string
  code: string
  lang: string
  roastMode: boolean
}) {
  const stream = createStreamableValue()
  
  // Start streaming in background
  ;(async () => {
    try {
      const { partialObjectStream, object } = await streamObject({
        model: google('gemini-1.5-flash'),
        schema: RoastSchema,
        system: SYSTEM_PROMPT(input.roastMode),
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
      await db.insert(analysisItems).values(
        finalObject.cards.map((card, i) => ({
          roastId: input.id,
          severity: card.severity,
          title: card.title,
          description: card.description,
          position: i
        }))
      )
    } catch (error) {
      // Mark as failed in database
      await db
        .update(roasts)
        .set({ status: 'failed' })
        .where(eq(roasts.id, input.id))
      
      stream.error(error)
    }
  })()
  
  return stream.value
}
```

### Error Handling

- **AI generation fails:** Mark DB record as `status: 'failed'`, stream error to client
- **Database update fails:** Log error, attempt retry on next page load
- **Partial stream interrupted:** Mark as `'failed'`, offer retry button that calls Server Action again

### Database Transaction

After streaming completes, update the existing pending record:

```tsx
// Update roast record
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
await db.insert(analysisItems).values(
  finalObject.cards.map((card, i) => ({
    roastId: input.id,
    severity: card.severity,
    title: card.title,
    description: card.description,
    position: i
  }))
)
```

---

## `/roast/[id]` Page Structure

### Component Hierarchy

```
page.tsx (Server Component)
└─ RoastViewer (Client Component)
   ├─ Loading state (neutral spinner + "$ analyzing code...")
   ├─ Progressive display as stream arrives:
   │  ├─ ScoreRing (appears first when data.score exists)
   │  ├─ Roast quote (appears when data.roastQuote exists)
   │  ├─ Analysis cards (array grows as items stream in)
   │  └─ Diff (appears when data.diffLines exists)
   └─ Error state (if generation fails)
```

### Loading UI

**Neutral loading state:**
- Rotating emerald ring spinner
- Text: `"$ analyzing code..."`
- If >10s: Show `"Still analyzing..."`
- Skeleton placeholders for score ring, cards, diff sections

**No roast-mode-specific messaging** — loading state is always neutral regardless of mode setting.

### States

1. **Pending status (fresh submission):**
   - Query DB returns roast with `status: 'pending'`
   - Trigger Server Action with roast data (code, lang, roastMode)
   - Show loading → streaming → final result
   - DB updates to `status: 'complete'`
2. **Complete status (direct link to finished roast):**
   - Query DB returns roast with `status: 'complete'`
   - Show final result immediately (no loading state)
3. **Failed status:**
   - Query DB returns roast with `status: 'failed'`
   - Show error message with retry button
   - Retry triggers Server Action again
4. **Record not found:**
   - DB query returns null
   - Redirect to `/` with "Roast not found" message

---

## Streaming UI Updates

### Client-Side Implementation

**In `RoastViewer` component:**

```tsx
'use client'

import { readStreamableValue } from 'ai/rsc'
import { useState, useEffect } from 'react'
import { generateRoast } from '@/actions/generate-roast'

export function RoastViewer({ roast, items }) {
  const [data, setData] = useState<Partial<RoastResult>>(
    roast.status === 'complete' ? roast : {}
  )
  const [isGenerating, setIsGenerating] = useState(roast.status === 'pending')
  const [error, setError] = useState<string | null>(
    roast.status === 'failed' ? 'Generation failed' : null
  )
  
  useEffect(() => {
    if (roast.status !== 'pending') {
      return // Already complete or failed
    }
    
    ;(async () => {
      try {
        const stream = await generateRoast({
          id: roast.id,
          code: roast.code,
          lang: roast.lang,
          roastMode: roast.roastMode
        })
        
        for await (const partial of readStreamableValue(stream)) {
          setData(partial)
        }
        
        setIsGenerating(false)
      } catch (err) {
        setError(err.message)
        setIsGenerating(false)
      }
    })()
  }, [roast])
  
  async function handleRetry() {
    setError(null)
    setIsGenerating(true)
    // Trigger generation again...
  }
  
  // Render logic...
}
```

### Progressive Rendering Strategy

**Appearance order:**
1. **Score (first)** → Fade in `<ScoreRing>` when `data.score` exists
2. **Quote (second)** → Show blockquote when `data.roastQuote` exists
3. **Metadata** → Display fileName, issuesFound, errors when available
4. **Cards (streaming)** → Map over `data.cards` array (grows as items arrive)
5. **Diff (last)** → Render diff section when `data.diffLines` exists

**Implementation pattern:**
```tsx
{data.score !== undefined ? (
  <div className="animate-fadeIn">
    <ScoreRing score={data.score} />
  </div>
) : (
  <div className="animate-pulse">
    <ScoreRingSkeleton />
  </div>
)}
```

### Skeleton States

Each section has a skeleton loader:
- **ScoreRing skeleton:** Pulsing gray circle
- **Quote skeleton:** Pulsing gray bars (3 lines)
- **Cards skeleton:** Grid of pulsing gray rectangles
- **Diff skeleton:** Pulsing gray code block

Skeletons fade out → real content fades in as data arrives.

---

## Code Reuse & Component Extraction

### Shared Component: `RoastDisplay`

**File:** `src/components/roast-display.tsx`

**Purpose:** Reusable component for rendering roast results, used by both `/roast/[id]` (streaming) and `/results` (static).

**Props:**
```tsx
interface RoastDisplayProps {
  roast?: Partial<Roast>
  items?: AnalysisItem[]
  isLoading?: boolean
  isStreaming?: boolean
}
```

**Features:**
- Renders ScoreRing, quote, breadcrumb, analysis cards, diff, metadata
- Supports skeleton states when `isLoading={true}`
- Handles partial data during streaming
- Gracefully handles missing fields (e.g., no diff)

### Update Existing Pages

**`/results/page.tsx`:**
- Keep existing DB fetch logic
- Replace inline JSX with `<RoastDisplay roast={roast} items={items} />`

**`/roast/[id]/page.tsx`:**
- Use `<RoastDisplay>` with streaming data
- Pass `isLoading={isGenerating}` and `isStreaming={true}`

### Deprecation Plan

**tRPC router changes:**
- Update `roast.create` mutation to create pending records (rename to `roast.createPending`)
- Keep `roast.getResult` query (actively used by `/roast/[id]` and `/results`)
- Update `roast.getResult` to return status field
- Add index on `status` field for querying pending roasts

**Database schema changes:** See "Database Schema Updates" section above.

---

## Testing Considerations

### Test Cases

1. **Fresh generation flow:**
   - Submit code via `RoastForm` → tRPC creates pending record → redirect to `/roast/[id]`
   - Verify loading state appears
   - Verify progressive updates (score → quote → cards → diff)
   - Verify DB record updates to `status: 'complete'`

2. **Direct link to existing roast:**
   - Navigate to `/roast/[id]` for completed roast (`status: 'complete'`)
   - Verify immediate display (no loading state)
   - Verify all data renders correctly

3. **Pending roast link (edge case):**
   - User shares link to `/roast/[id]` before generation completes
   - Verify loading state appears for second user
   - Verify generation triggers only once (idempotency check)

4. **Invalid ID:**
   - Navigate to `/roast/invalid-uuid`
   - Verify redirect to `/` with error

5. **Roast mode toggle:**
   - Submit with roastMode=true → verify sarcastic tone
   - Submit with roastMode=false → verify professional tone

6. **Error states:**
   - AI generation fails → verify DB marked as `'failed'`, retry button works
   - Database update fails → verify error logged, retry available
   - Stream interrupted → verify status marked `'failed'`, retry works

7. **Edge cases:**
   - Empty code submission → verify validation error before DB insert
   - Code over character limit → verify error before submission
   - Retry on failed roast → verify Server Action called again, status updates

### Manual Verification

- Test both roast modes produce distinct tones
- Verify diff generation works for various code types
- Confirm progressive loading feels smooth (no jarring layout shifts)
- Check mobile responsiveness of streaming UI

---

## Implementation Checklist

- [ ] Add `roast_status` enum to database schema
- [ ] Add `status` field to roasts table (migration required)
- [ ] Make `score`, `roastQuote` nullable in schema
- [ ] Install `@ai-sdk/google` package
- [ ] Add `GOOGLE_GENERATIVE_AI_API_KEY` to env files
- [ ] Create/update `roast.createPending` tRPC mutation
- [ ] Update `roast.getResult` to include status field
- [ ] Create `src/actions/generate-roast.ts` Server Action
- [ ] Create `/roast/[id]/page.tsx` dynamic route
- [ ] Create `RoastViewer` client component with streaming logic
- [ ] Extract `RoastDisplay` shared component
- [ ] Update `RoastForm` to use `createPending` mutation + redirect
- [ ] Update `/results/page.tsx` to use `RoastDisplay`
- [ ] Update system prompt with roastMode-specific instructions
- [ ] Create skeleton components for loading states
- [ ] Add error handling and retry logic
- [ ] Add idempotency check to prevent duplicate generations
- [ ] Test all flows (pending, complete, failed, not found)
- [ ] Test retry mechanism on failed roasts

---

## Future Enhancements

- Share roast functionality (social media cards, copy link)
- User authentication + roast history
- Code editing within roast view
- Comparison view (before/after diff side-by-side)
- Export roast as PDF/image
