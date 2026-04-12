# CodeEditor Scrollbar and Diff Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `CodeEditor` vertical scrollbar rendering to the outer right edge of the component (globally) and align `DiffLine` shell styling with the `CodeEditor` theme.

**Architecture:** Keep the public `CodeEditor` and `DiffLine` APIs unchanged. Rework only internal layout/scroll container ownership in `CodeEditor` and shell-level variants/classes in `DiffLine`. Preserve existing diff rendering via `@pierre/diffs` and existing editor behavior (typing, highlight sync, read-only mode).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS v4, tailwind-variants, Biome

---

### Task 1: Move CodeEditor Scrollbar Ownership to the Component Edge

**Files:**
- Modify: `src/components/ui/code-editor.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Capture failing behavior (baseline repro)**

Run: `pnpm dev`

Manual repro checklist (must currently fail expected layout):
1. Open `/roast/<existing-id>` with code content.
2. Scroll the submission code block.
3. Observe scrollbar appears in the inner code column, not at the far-right edge of the full editor shell.

Expected (before fix): fails target behavior.

- [ ] **Step 2: Update `EditorBody`/layer classes so edge-aligned scrolling is possible**

Update the relevant variants in `src/components/ui/code-editor.tsx` to ensure the outer editor body owns visual scrolling while preserving overlay sync behavior.

```tsx
const editorBodyVariants = tv({
  base: 'relative flex w-full bg-zinc-900',
  variants: {
    readOnly: {
      true: 'h-auto max-h-[500px] overflow-y-auto overflow-x-hidden',
      false: 'h-[320px] overflow-hidden'
    }
  },
  defaultVariants: {
    readOnly: false
  }
})

const lineNumbersVariants = tv({
  base: 'code-editor-line-numbers h-full shrink-0 overflow-hidden border-r border-zinc-800 bg-zinc-900 px-4 py-4 font-mono text-sm leading-[1.5] text-zinc-600',
  variants: {},
  defaultVariants: {}
})

const highlightVariants = tv({
  base: 'code-editor-highlight whitespace-pre-wrap break-words px-4 py-4 font-mono text-sm leading-[1.5]',
  variants: {
    readOnly: {
      true: 'pointer-events-auto min-w-0 flex-1 overflow-x-auto overflow-y-hidden',
      false: 'pointer-events-none absolute inset-0 overflow-auto'
    }
  },
  defaultVariants: {
    readOnly: false
  }
})
```

- [ ] **Step 3: Add read-only scroll synchronization from `EditorBody` to content layers**

Extend context and handlers in `src/components/ui/code-editor.tsx` so read-only vertical scroll from `EditorBody` stays synchronized with line numbers/highlight, while keeping current editable behavior.

```tsx
interface CodeEditorContextValue {
  // ...existing fields
  editorBodyRef: React.RefObject<HTMLDivElement | null>
  handleReadOnlyScroll: () => void
}

const editorBodyRef = useRef<HTMLDivElement>(null)

const handleReadOnlyScroll = () => {
  if (!editorBodyRef.current || !highlightRef.current || !lineNumbersRef.current) return

  const scrollTop = editorBodyRef.current.scrollTop
  lineNumbersRef.current.scrollTop = scrollTop
  highlightRef.current.scrollTop = scrollTop

  editorBodyRef.current.classList.add('scrolling')
  if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
  scrollTimerRef.current = setTimeout(() => {
    editorBodyRef.current?.classList.remove('scrolling')
  }, 1000)
}
```

Wire `editorBodyRef` and `handleReadOnlyScroll` into provider value and `EditorBody` element:

```tsx
<div
  ref={editorBodyRef}
  onScroll={readOnly ? handleReadOnlyScroll : undefined}
  className={editorBodyVariants({ readOnly, className })}
  {...props}
>
  {children}
</div>
```

- [ ] **Step 4: Update scrollbar selectors to include read-only scroll host**

Adjust `src/app/globals.css` selectors so the same hover/focus/scrolling scrollbar behavior also applies when `EditorBody` is the visible scroll owner.

```css
.code-editor-textarea,
.code-editor-highlight,
.code-editor-line-numbers,
.code-editor-body {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color 0.3s ease;
}

.code-editor-body:hover,
.code-editor-body.scrolling,
.code-editor-textarea:hover,
.code-editor-textarea:focus,
.code-editor-textarea.scrolling,
.code-editor-highlight:hover,
.code-editor-line-numbers:hover {
  scrollbar-color: #52525b #18181b;
}
```

Also add `.code-editor-body` in matching `::-webkit-scrollbar`, `::-webkit-scrollbar-track`, and `::-webkit-scrollbar-thumb` selector groups.

- [ ] **Step 5: Verify Task 1 behavior**

Run: `pnpm check`

Expected: exits successfully with no new Biome errors in changed files.

Manual verify:
1. `/roast/<id>` read-only submission editor shows vertical scrollbar on far-right edge of full editor.
2. `/` editable home editor still behaves as before.

- [ ] **Step 6: Commit Task 1**

```bash
git add src/components/ui/code-editor.tsx src/app/globals.css
git commit -m "fix: align code editor scrollbar to outer edge"
```

### Task 2: Align DiffLine Shell Theme with CodeEditor

**Files:**
- Modify: `src/components/ui/diff-line.tsx`

- [ ] **Step 1: Capture failing visual baseline**

Run: `pnpm dev`

Manual baseline:
1. Open `/components` and inspect `diff-line` showcase.
2. Compare `DiffLine` shell to `code-editor (read-only)` shell.
3. Confirm differences in shell treatment (background/border/header rhythm) before changes.

- [ ] **Step 2: Update `DiffLine` slot classes to mirror CodeEditor shell language**

Modify `src/components/ui/diff-line.tsx` variant slots to align root framing and fallback styling to code-editor-like theme.

```tsx
const diffLine = tv({
  slots: {
    root: 'overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 font-mono text-xs text-zinc-100',
    viewer: 'block bg-zinc-900',
    fallback: 'whitespace-pre-wrap border-zinc-800 border-t bg-zinc-900 px-4 py-4 text-xs text-zinc-300'
  },
  variants: {
    tone: {
      default: {
        root: ''
      }
    }
  },
  defaultVariants: {
    tone: 'default'
  }
})
```

- [ ] **Step 3: Verify Task 2 behavior**

Run: `pnpm check`

Expected: exits successfully with no new Biome errors in changed files.

Manual verify:
1. `/components` `diff-line` shell aligns visually with `code-editor` theme.
2. `/roast/<id>` suggested diff remains functional (worker render + fallback still work).

- [ ] **Step 4: Commit Task 2**

```bash
git add src/components/ui/diff-line.tsx
git commit -m "style: align diff-line shell with code-editor theme"
```

### Task 3: End-to-End Verification and Final Commit

**Files:**
- Modify: `src/components/ui/code-editor.tsx` (if minor follow-up fixes needed)
- Modify: `src/app/globals.css` (if minor follow-up fixes needed)
- Modify: `src/components/ui/diff-line.tsx` (if minor follow-up fixes needed)

- [ ] **Step 1: Run full validation commands**

Run:

```bash
pnpm lint && pnpm check && pnpm build
```

Expected:
- `pnpm lint`: no lint errors in `src`
- `pnpm check`: no formatting/lint diagnostics requiring fixes
- `pnpm build`: successful production build

- [ ] **Step 2: Run final manual UX verification**

Manual checklist:
1. `/` home editor: typing, paste, highlight updates, and scrollbar appearance are unchanged.
2. `/roast/<id>` submission code editor: scrollbar is at far-right editor boundary (near language card column).
3. `/roast/<id>` suggested fix: `DiffLine` theme matches code-editor shell direction.
4. `/components`: both `code-editor` and `diff-line` showcases look consistent.

- [ ] **Step 3: Commit any final adjustments**

```bash
git add src/components/ui/code-editor.tsx src/app/globals.css src/components/ui/diff-line.tsx
git commit -m "fix: unify code editor scrollbar placement and diff theme"
```
