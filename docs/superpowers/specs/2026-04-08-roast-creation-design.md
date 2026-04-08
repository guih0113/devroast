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
2. **Redirect:** Client generates UUID via `crypto.randomUUID()`, stores code/lang/roastMode in sessionStorage, redirects to `/roast/[id]`
3. **Loading:** `/roast/[id]` page displays neutral loading UI ("$ analyzing code...")
4. **Generation:** Server Action initiates AI streaming via Vercel AI SDK with Gemini
5. **Streaming:** Results stream progressively (score → quote → cards → diff), UI updates in real-time
6. **Persistence:** Once complete, data saves to database, sessionStorage clears
7. **Permanence:** URL `/roast/[id]` now permanently displays the saved roast

### Key Components

- `src/app/roast/[id]/page.tsx` — New dynamic route for roast display + generation
- `src/app/roast/[id]/_components/roast-viewer.tsx` — Client component handling streaming state
- `src/components/roast-display.tsx` — Shared component for rendering roast results (used by both `/roast/[id]` and `/results`)
- `src/actions/generate-roast.ts` — Server Action for AI generation with streaming
- `src/app/_components/roast-form.tsx` — Updated to use sessionStorage + redirect instead of tRPC mutation

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

## URL State Management & Routing

### RoastForm Changes

On submit:
```tsx
const id = crypto.randomUUID()
sessionStorage.setItem(`roast-${id}`, JSON.stringify({ code, lang, roastMode }))
router.push(`/roast/${id}`)
```

### `/roast/[id]` Page Logic

1. Extract `[id]` param from URL
2. Client component checks `sessionStorage.getItem(`roast-${id}`)`
3. **If found (fresh submission):**
   - Start AI generation via Server Action
   - Show streaming UI with progressive updates
   - After completion, save to DB and clear sessionStorage
4. **If not found (direct link):**
   - Query database for existing roast with this ID via tRPC `roast.getResult`
   - If exists: Display final results
   - If doesn't exist: Redirect to `/` with error message
5. URL `/roast/[id]` permanently shows the saved roast after generation completes

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
    const { partialObjectStream } = await streamObject({
      model: google('gemini-1.5-flash'),
      schema: RoastSchema,
      system: SYSTEM_PROMPT(input.roastMode),
      prompt: `lang: ${input.lang}\n\n\`\`\`${input.lang}\n${input.code}\n\`\`\``
    })
    
    for await (const partial of partialObjectStream) {
      stream.update(partial)
    }
    
    stream.done()
    
    // Save to database after streaming completes
    await saveToDatabase({ id: input.id, result: finalObject, code, lang, roastMode })
  })()
  
  return stream.value
}
```

### Error Handling

- **AI generation fails:** Return error state via stream, allow retry button in UI
- **Database save fails:** Log error, still show results to user (can attempt save retry)
- **Partial stream interrupted:** Show what's available, mark as incomplete, offer retry

### Database Transaction

After streaming completes, use same transaction logic as current `roast.create`:
```tsx
await db.transaction(async (tx) => {
  const [roast] = await tx.insert(roasts).values({...}).returning({ id: roasts.id })
  await tx.insert(analysisItems).values(cards.map((card, i) => ({...})))
})
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

1. **Fresh submission (sessionStorage found):**
   - Show loading → streaming → final result
   - Clear sessionStorage after save
2. **Direct link (no sessionStorage):**
   - Query DB via tRPC `roast.getResult({ id })`
   - If found: Show final result immediately
   - If not found: Redirect to `/` with "Roast not found" message
3. **Error state:**
   - Show error message with retry button
   - Preserve code in sessionStorage for retry

---

## Streaming UI Updates

### Client-Side Implementation

**In `RoastViewer` component:**

```tsx
'use client'

import { readStreamableValue } from 'ai/rsc'
import { useState, useEffect } from 'react'
import { generateRoast } from '@/actions/generate-roast'

export function RoastViewer({ id, sessionData }) {
  const [data, setData] = useState<Partial<RoastResult>>({})
  const [isGenerating, setIsGenerating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!sessionData) {
      // No sessionStorage, will fetch from DB instead
      setIsGenerating(false)
      return
    }
    
    ;(async () => {
      try {
        const stream = await generateRoast({
          id,
          code: sessionData.code,
          lang: sessionData.lang,
          roastMode: sessionData.roastMode
        })
        
        for await (const partial of readStreamableValue(stream)) {
          setData(partial)
        }
        
        setIsGenerating(false)
        // Clear sessionStorage after successful completion
        sessionStorage.removeItem(`roast-${id}`)
      } catch (err) {
        setError(err.message)
        setIsGenerating(false)
      }
    })()
  }, [id, sessionData])
  
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
- Keep `roast.create` mutation (backward compatibility)
- Add comment: `@deprecated Use Server Action generateRoast instead`
- Keep `roast.getResult` query (actively used by `/roast/[id]` and `/results`)
- Remove deprecated `roast.create` in future cleanup PR

**No database schema changes needed** — existing schema supports all fields.

---

## Testing Considerations

### Test Cases

1. **Fresh generation flow:**
   - Submit code via `RoastForm` → sessionStorage created → redirect to `/roast/[id]`
   - Verify loading state appears
   - Verify progressive updates (score → quote → cards → diff)
   - Verify sessionStorage cleared after completion
   - Verify DB record created

2. **Direct link to existing roast:**
   - Navigate to `/roast/[id]` for saved roast
   - Verify immediate display (no loading state)
   - Verify all data renders correctly

3. **Invalid ID:**
   - Navigate to `/roast/invalid-uuid`
   - Verify redirect to `/` with error

4. **Roast mode toggle:**
   - Submit with roastMode=true → verify sarcastic tone
   - Submit with roastMode=false → verify professional tone

5. **Error states:**
   - AI generation fails → verify error message + retry button
   - Database save fails → verify results still shown, error logged
   - Stream interrupted → verify partial results shown, retry available

6. **Edge cases:**
   - Empty code submission → verify validation error
   - Code over character limit → verify error before submission
   - Missing sessionStorage on `/roast/[id]` → verify fallback to DB query

### Manual Verification

- Test both roast modes produce distinct tones
- Verify diff generation works for various code types
- Confirm progressive loading feels smooth (no jarring layout shifts)
- Check mobile responsiveness of streaming UI

---

## Implementation Checklist

- [ ] Install `@ai-sdk/google` package
- [ ] Add `GOOGLE_GENERATIVE_AI_API_KEY` to env files
- [ ] Create `src/actions/generate-roast.ts` Server Action
- [ ] Create `/roast/[id]/page.tsx` dynamic route
- [ ] Create `RoastViewer` client component with streaming logic
- [ ] Extract `RoastDisplay` shared component
- [ ] Update `RoastForm` to use sessionStorage + redirect
- [ ] Update `/results/page.tsx` to use `RoastDisplay`
- [ ] Update system prompt with roastMode-specific instructions
- [ ] Create skeleton components for loading states
- [ ] Add error handling and retry logic
- [ ] Test all flows (fresh generation, direct links, errors)
- [ ] Update existing tRPC mutations (deprecation comments)

---

## Future Enhancements

- Share roast functionality (social media cards, copy link)
- User authentication + roast history
- Code editing within roast view
- Comparison view (before/after diff side-by-side)
- Export roast as PDF/image
