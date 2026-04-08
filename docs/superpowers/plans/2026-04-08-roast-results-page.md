# Roast Results Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use only `/roast/[id]` as the roast results page, matching the Pencil Screen 2 layout (including `$ share_roast` button layout) and removing `/results` entirely.

**Architecture:** Split the current monolithic `RoastDisplay` into composable sections (Hero / Analysis / Diff) so the `/roast/[id]` page can place `your_submission` between the hero and analysis. Centralize the read-only code viewer into a shared component so it can be reused outside of the deleted `/results` route.

**Tech Stack:** Next.js App Router (RSC + Client Components), TypeScript, Tailwind CSS v4, `tailwind-variants`, `@ai-sdk/rsc`.

---

## File Map (Responsibilities)

- Create: `src/components/code-viewer.tsx` — shared, read-only viewer based on `CodeEditor`.
- Modify: `src/components/roast-display.tsx` — export section components (`RoastHero`, `RoastAnalysisSection`, `RoastDiffSection`) used by `/roast/[id]`.
- Modify: `src/app/roast/[id]/_components/roast-viewer.tsx` — page layout composer; inserts `your_submission` between hero and analysis; adds `$ share_roast` button layout.
- Modify: `src/app/leaderboard/_components/leaderboard-table.tsx` — links go to `/roast/${id}`.
- Modify: `src/app/_components/leaderboard-code-row.tsx` — import shared `CodeViewer`.
- Delete: `src/app/results/page.tsx` — remove route (404).
- Delete: `src/app/results/_components/code-viewer.tsx` — moved to shared location.
- Optional: Delete `src/app/results/` directory if empty after deletions.

---

### Task 1: Introduce Shared CodeViewer

**Files:**
- Create: `src/components/code-viewer.tsx`
- Modify: `src/app/_components/leaderboard-code-row.tsx`
- Modify: `src/app/results/page.tsx` (temporarily, until deletion in Task 4)
- Delete (later): `src/app/results/_components/code-viewer.tsx`

- [ ] **Step 1: Add shared CodeViewer component**

Create `src/components/code-viewer.tsx`:

```tsx
'use client'

import type { BundledLanguage } from 'shiki'
import { CodeEditor } from '@/components/ui/code-editor'

interface CodeViewerProps {
  code: string
  language: BundledLanguage
}

export function CodeViewer({ code, language }: CodeViewerProps) {
  return (
    <CodeEditor.Root defaultValue={code} language={language} readOnly>
      <CodeEditor.WindowHeader />
      <CodeEditor.EditorBody>
        <CodeEditor.LineNumbers />
        <CodeEditor.Highlight />
        <CodeEditor.Textarea />
      </CodeEditor.EditorBody>
    </CodeEditor.Root>
  )
}
```

- [ ] **Step 2: Update leaderboard code row to import the shared CodeViewer**

Update `src/app/_components/leaderboard-code-row.tsx` import:

```tsx
import { CodeViewer } from '@/components/code-viewer'
```

- [ ] **Step 3: Verify TypeScript compiles for affected imports**

Run: `pnpm -s check`

Expected: no TS errors referencing `@/app/results/_components/code-viewer`.

- [ ] **Step 4: Commit**

```bash
git add src/components/code-viewer.tsx src/app/_components/leaderboard-code-row.tsx
git commit -m "refactor: extract shared code viewer"
```

---

### Task 2: Split RoastDisplay into Composable Sections (Hero / Analysis / Diff)

**Files:**
- Modify: `src/components/roast-display.tsx`
- Test/Verify: `src/app/roast/[id]/_components/roast-viewer.tsx` (imports updated in Task 3)

- [ ] **Step 1: Write a minimal render check (manual) to ensure ordering can be controlled**

There is no test harness in this repo for React components. We’ll verify by running the app and visually confirming the new order.

Run later: `pnpm dev`
Expected: `/roast/[id]` shows `your_submission` before `detailed_analysis`.

- [ ] **Step 2: Refactor `RoastDisplay` exports**

In `src/components/roast-display.tsx`, keep the existing skeleton helper functions, but change exports to:

- `export function RoastHero(...)`
- `export function RoastAnalysisSection(...)`
- `export function RoastDiffSection(...)`

And keep a compatibility wrapper:

- `export function RoastDisplay(...)` that renders Hero + Analysis + Diff in the old order (temporary; can be removed later once callers are updated).

Hero requirements:

- Keep existing score ring / quote / fileName / verdict label / meta.
- Add `$ share_roast` **layout only** at the bottom of the hero stack.
  - Use existing `Button` component, `variant="ghost"`, `size="sm"`.
  - Use label exactly: `$ share_roast`.
  - Make it a no-op: `type="button" disabled`.

Analysis/Diff requirements:

- Move the existing sections (headings + content) into their own components.
- Keep existing skeleton behavior when `isLoading` is true.

- [ ] **Step 3: Run formatting/lint checks**

Run: `pnpm -s check`
Expected: no Biome issues.

- [ ] **Step 4: Commit**

```bash
git add src/components/roast-display.tsx
git commit -m "refactor: split roast display into sections"
```

---

### Task 3: Update /roast/[id] Layout to Match Pencil Order

**Files:**
- Modify: `src/app/roast/[id]/_components/roast-viewer.tsx`

- [ ] **Step 1: Update imports to use new RoastDisplay sections and shared CodeViewer**

In `src/app/roast/[id]/_components/roast-viewer.tsx`:

- Replace `import { RoastDisplay } from '@/components/roast-display'` with the section imports.
- Add `import { CodeViewer } from '@/components/code-viewer'`.

- [ ] **Step 2: Compose the layout in the Pencil order**

For both generating and non-generating states, render:

1. Hero
2. Divider
3. `your_submission` + CodeViewer (read-only)
4. Divider
5. Analysis section
6. Divider
7. Diff section (only when diff exists)

Use the same heading styles currently used in `/results` and in `RoastDisplay`.

Also: normalize newlines for the `CodeViewer` to avoid hydration mismatch, matching the pattern used in `LeaderboardCodeRow`:

```ts
const normalizedCode = roast.code.replace(/\r\n?/g, '\n')
```

- [ ] **Step 3: Manual verification in dev**

Run: `pnpm dev`

Open a completed roast URL: `/roast/<uuid>`

Expected (visual):

- Hero contains `$ share_roast` button layout.
- `your_submission` is above `detailed_analysis`.
- Diff section appears at the bottom when diff exists.

- [ ] **Step 4: Commit**

```bash
git add src/app/roast/[id]/_components/roast-viewer.tsx
git commit -m "ui: match roast results layout on /roast/[id]"
```

---

### Task 4: Remove /results Route Entirely (404)

**Files:**
- Delete: `src/app/results/page.tsx`
- Delete: `src/app/results/_components/code-viewer.tsx`
- Modify: `src/app/leaderboard/_components/leaderboard-table.tsx`
- Optional: Delete: `src/app/results` directory if empty

- [ ] **Step 1: Update leaderboard table links to /roast/[id]**

In `src/app/leaderboard/_components/leaderboard-table.tsx`:

```tsx
<Link key={entry.id} href={`/roast/${entry.id}`} className="group">
```

- [ ] **Step 2: Delete the /results route and its route-local CodeViewer**

Delete:

- `src/app/results/page.tsx`
- `src/app/results/_components/code-viewer.tsx`

- [ ] **Step 3: Verify there are no remaining references to /results**

Run: `pnpm -s check`

Expected: no TS/module errors referencing `src/app/results/...`.

- [ ] **Step 4: Commit**

```bash
git add src/app/leaderboard/_components/leaderboard-table.tsx
git rm src/app/results/page.tsx src/app/results/_components/code-viewer.tsx
git commit -m "chore: remove /results route and link leaderboard to /roast"
```

---

### Task 5: Pencil Diff Check (Layout Alignment)

**Files:**
- No code changes required unless misalignments are found

- [ ] **Step 1: Compare against Pencil Screen 2**

Checklist from `devroast.pen` Screen 2 (`8pCh0`):

- Share row exists under hero meta and uses `$ share_roast` label
- Section ordering: `your_submission` → `detailed_analysis` → `suggested_fix`
- Dividers between major sections

- [ ] **Step 2: Fix any layout mismatches**

If mismatches are found, adjust Tailwind classes in:

- `src/components/roast-display.tsx`
- `src/app/roast/[id]/_components/roast-viewer.tsx`

- [ ] **Step 3: Final verification**

Run: `pnpm -s check`

Expected: PASS

- [ ] **Step 4: Commit (only if fixes were needed)**

```bash
git add src/components/roast-display.tsx src/app/roast/[id]/_components/roast-viewer.tsx
git commit -m "ui: align roast results layout with pencil"
```
