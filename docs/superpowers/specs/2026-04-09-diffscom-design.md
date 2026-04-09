# Diffs.com Viewer Integration Design

## Overview
Replace the current per-line diff UI with the official diffs.com React component, while keeping the public component name and file name as `DiffLine`. The new `DiffLine` renders a unified diff with file headers and line numbers, styled to match the existing Devroast dark UI. All usages of `DiffLine` will be updated to pass the full diff array and metadata.

## Goals
- Use the official diffs.com React component to render unified diffs.
- Preserve the `DiffLine` filename and export name.
- Show file header and line numbers for the diff block.
- Keep the UI aligned with existing Devroast styling.
- Update all existing usages to the new `DiffLine` API.

## Non-Goals
- Add a side-by-side toggle or view switching.
- Rework diff generation or storage format in the database.
- Add new endpoints or API layers.

## Architecture
- **Component surface**: `src/components/ui/diff-line.tsx` remains the only exported component. It becomes a client component and wraps the diffs.com viewer.
- **Diff renderer**: Use the official diffs.com React component (from docs) with a unified patch string and render options for headers and line numbers.
- **Provider**: `DiffLine` wraps its content with `WorkerPoolContextProvider` (as required by diffs.com) to avoid a global provider change.
- **Call sites**: Replace per-line rendering with a single `DiffLine` block at each usage.

## Data Flow
1. Source data remains `Roast.diff` (array of `{ variant, code }`).
2. `DiffLine` accepts:
   - `diff`: the diff array
   - `fileName`: string (defaults to `submission`)
   - `language`: optional string for syntax highlighting
   - `className`: optional, to integrate with existing layouts
3. `DiffLine` builds a unified patch string:
   - Header:
     - `--- a/<fileName>`
     - `+++ b/<fileName>`
   - Single synthetic hunk:
     - `@@ -1,<oldCount> +1,<newCount> @@`
   - Each diff line prefixed by variant:
     - `added` -> `+`
     - `removed` -> `-`
     - `context` -> ` `
   - `oldCount` and `newCount` computed by scanning the diff array.
4. The unified patch string is passed into the diffs.com component configured for:
   - unified view
   - line numbers
   - file header
   - dark theme styling consistent with the app

## UI and Styling
- Preserve existing container styles around diffs (border, background, spacing).
- Ensure the diff typography remains mono and aligned with the app (`font-mono`).
- Any diffs.com theming options will be tuned to match the existing `zinc` and `emerald` palette.

## Error Handling
- If `diff` is empty or missing, render nothing.
- If `fileName` is missing, default to `submission`.
- If the diffs.com worker pool fails or is unavailable, fall back to a minimal inline render of the unified patch string (mono text block) so the UI never goes blank.

## Testing
- Visual verification in `src/app/components/page.tsx` showcase.
- Visual verification in `/roast/[id]` results (with data present).
- No automated tests required for this change.

## Impacted Files
- `src/components/ui/diff-line.tsx` (repurpose component API and implementation)
- `src/components/roast-display.tsx` (use new `DiffLine` API)
- `src/app/components/page.tsx` (showcase updates)
- Potentially any other usage sites of `DiffLine`
