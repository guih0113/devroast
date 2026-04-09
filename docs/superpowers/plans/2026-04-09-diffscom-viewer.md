# Diffs.com Viewer Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the per-line diff UI with the official diffs.com React component while keeping the `DiffLine` component name and file, rendering unified diffs with file headers and line numbers across the app.

**Architecture:** Repurpose `src/components/ui/diff-line.tsx` into a client component that builds a unified patch string from stored diff lines and renders it via diffs.com `PatchDiff`. Update all usage sites to pass the full diff array and metadata once per diff block, not per line. Keep styling consistent with existing Devroast dark UI.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, `@pierre/diffs` (diffs.com).

---

## File Structure & Responsibilities
- `src/components/ui/diff-line.tsx` — Diff viewer wrapper; builds patch string and renders diffs.com `PatchDiff` with unified view and line numbers; handles fallback on worker failure.
- `src/components/roast-display.tsx` — Uses new `DiffLine` API once per diff block, passes filename/language.
- `src/app/components/page.tsx` — Update component showcase diff example to the new API.
- `package.json` — Add `@pierre/diffs` dependency.

---

### Task 1: Add diffs.com dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add dependency**

Add to `dependencies`:

```json
"@pierre/diffs": "^1.1.12"
```

- [ ] **Step 2: Install**

Run:

```bash
pnpm install
```

Expected: `@pierre/diffs` added to `node_modules` and `pnpm-lock.yaml` updated.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add diffs.com viewer dependency"
```

---

### Task 2: Repurpose DiffLine into diffs.com viewer

**Files:**
- Modify: `src/components/ui/diff-line.tsx`

- [ ] **Step 1: Replace component with new API**

Replace the file with:

```tsx
'use client'

import type { ComponentProps } from 'react'
import { PatchDiff, WorkerPoolContextProvider } from '@pierre/diffs/react'
import { tv } from 'tailwind-variants'
import type { SupportedLanguages } from '@pierre/diffs'

type DiffLine = { variant: 'added' | 'removed' | 'context'; code: string }

const diffViewer = tv({
  slots: {
    root: 'overflow-hidden rounded border border-zinc-800 bg-zinc-900',
    fallback: 'px-4 py-3 font-mono text-xs text-zinc-400'
  }
})

type DiffLineProps = Omit<ComponentProps<'div'>, 'children'> & {
  diff: DiffLine[]
  fileName?: string
  language?: SupportedLanguages
}

function countLines(diff: DiffLine[]) {
  return diff.reduce(
    (acc, line) => {
      if (line.variant === 'added') return { oldCount: acc.oldCount, newCount: acc.newCount + 1 }
      if (line.variant === 'removed') return { oldCount: acc.oldCount + 1, newCount: acc.newCount }
      return { oldCount: acc.oldCount + 1, newCount: acc.newCount + 1 }
    },
    { oldCount: 0, newCount: 0 }
  )
}

function toPatch(diff: DiffLine[], fileName: string) {
  const { oldCount, newCount } = countLines(diff)
  const header = [`--- a/${fileName}`, `+++ b/${fileName}`]
  const hunk = `@@ -1,${Math.max(oldCount, 0)} +1,${Math.max(newCount, 0)} @@`
  const body = diff.map((line) => {
    const prefix = line.variant === 'added' ? '+' : line.variant === 'removed' ? '-' : ' '
    return `${prefix}${line.code}`
  })
  return [...header, hunk, ...body].join('\n')
}

export function DiffLine({ diff, fileName = 'submission', language, className, ...props }: DiffLineProps) {
  if (!diff || diff.length === 0) return null

  const { root, fallback } = diffViewer()
  const patch = toPatch(diff, fileName)

  return (
    <div className={root({ className })} {...props}>
      <WorkerPoolContextProvider
        poolOptions={{
          workerFactory: () => new Worker(new URL('@pierre/diffs/worker/worker.js', import.meta.url))
        }}
        highlighterOptions={{
          theme: 'pierre-dark',
          langs: language ? [language] : undefined
        }}
      >
        <PatchDiff
          patch={patch}
          options={{
            diffStyle: 'unified',
            disableLineNumbers: false,
            disableFileHeader: false,
            diffIndicators: 'bars',
            themeType: 'dark',
            overflow: 'scroll'
          }}
        />
      </WorkerPoolContextProvider>

      <noscript>
        <pre className={fallback()}>{patch}</pre>
      </noscript>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/diff-line.tsx
git commit -m "feat: render diffs with diffs.com viewer"
```

---

### Task 3: Update roast display to new DiffLine API

**Files:**
- Modify: `src/components/roast-display.tsx`

- [ ] **Step 1: Replace per-line diff rendering**

Update `RoastDiffSection` to render a single `DiffLine` and pass file metadata:

```tsx
export function RoastDiffSection({
  diff = [],
  fileName,
  language
}: {
  diff?: NonNullable<Roast['diff']>
  fileName?: string
  language?: Roast['lang']
}) {
  if (!diff || diff.length === 0) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <span className="font-bold font-mono text-emerald-500 text-sm">{'// '}</span>
        <span className="font-bold font-mono text-sm text-zinc-100">suggested_fix</span>
      </div>

      <DiffLine diff={diff} fileName={fileName ?? 'submission'} language={language} />
    </div>
  )
}
```

Update the two call sites inside `RoastDisplay` and `RoastViewer` usage path to pass `fileName` and `language`:

```tsx
<RoastDiffSection diff={roast.diff ?? []} fileName={roast.fileName ?? 'submission'} language={roast.lang} />
```

- [ ] **Step 2: Commit**

```bash
git add src/components/roast-display.tsx src/app/roast/[id]/_components/roast-viewer.tsx
git commit -m "refactor: pass diff metadata to DiffLine"
```

---

### Task 4: Update component showcase

**Files:**
- Modify: `src/app/components/page.tsx`

- [ ] **Step 1: Replace diff-line section**

Replace the per-line sample with a single diff block:

```tsx
<Section title="diff-line">
  <Row label="unified">
    <div className="flex w-full max-w-2xl flex-col">
      <DiffLine
        fileName="roast.ts"
        language="typescript"
        diff={[
          { variant: 'removed', code: 'const result = doThing(x, y, z)' },
          { variant: 'added', code: 'const result = doThing(x)' },
          { variant: 'context', code: 'return result' }
        ]}
      />
    </div>
  </Row>
</Section>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/page.tsx
git commit -m "docs: update diff-line showcase"
```

---

### Task 5: Verify manually

**Files:**
- None

- [ ] **Step 1: Run dev server**

```bash
pnpm dev
```

Expected: App boots without errors.

- [ ] **Step 2: Visual checks**

Check:
- `/components` diff section shows unified diff with header and line numbers
- `/roast/[id]` results show unified diff for suggested fix

- [ ] **Step 3: Commit (if any fixes were made)**

```bash
git add -A
git commit -m "fix: adjust diff viewer styling"
```

---

## Self-Review Checklist
- Spec coverage: dependency added, DiffLine repurposed, usage sites updated, unified view with header and line numbers, styling preserved.
- No placeholders: all steps include exact code and commands.
- Type consistency: `DiffLine` props match usage sites and data model.
