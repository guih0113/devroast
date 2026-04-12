## Goal

Implement two UI adjustments:

1. `DiffLine` should use the same visual theme direction as `CodeEditor` (zinc dark shell, border treatment, mono typography density).
2. In `/roast/[id]`, the `CodeEditor` scrollbar must appear on the far-right edge of the whole component, not inside the inner code area.

This behavior should be implemented in `CodeEditor` globally so all usages share consistent behavior, while preserving the current home editor behavior.

## Scope

### In scope

- Update `src/components/ui/code-editor.tsx` layout/scroll ownership so vertical scrollbar renders at the component edge.
- Keep current `CodeEditor` public API unchanged.
- Update `src/components/ui/diff-line.tsx` shell styling to match `CodeEditor` theme.
- Validate behavior in `/roast/[id]`, `/`, and `/components` showcase page.

### Out of scope

- Replacing `@pierre/diffs` renderer behavior.
- Changing `DiffLine` public props or patch generation algorithm.
- Broad visual redesign outside `CodeEditor` and `DiffLine`.

## Current State

- `CodeEditor` currently syncs scroll positions among `Textarea`, `Highlight`, and `LineNumbers`.
- Scrollbar visibility is controlled by global selectors in `src/app/globals.css` (`.code-editor-textarea`, `.code-editor-highlight`, `.code-editor-line-numbers`).
- On `/roast/[id]` (read-only viewer path via `CodeViewer`), scrollbar is perceived as attached to inner code content rather than the outer editor edge.
- `DiffLine` uses a dark style, but not fully aligned with `CodeEditor` shell styling conventions.

## Design

### 1) Architecture

- Keep `CodeEditor` namespace structure (`Root`, `WindowHeader`, `EditorBody`, `LineNumbers`, `Highlight`, `Textarea`).
- Adjust internals so scrollable surface and clipping behavior place the visible vertical scrollbar at the full component edge.
- Keep `DiffLine` component API and logic intact, changing only shell-level class slots for visual alignment.

### 2) Component/Data Flow

- `CodeEditor.Root`: unchanged role as outer frame.
- `CodeEditor.EditorBody`: maintains internal layout while serving as the effective edge-aligned scroll container boundary.
- `CodeEditor.LineNumbers` and `CodeEditor.Highlight`: continue using synchronized `scrollTop` from editor events.
- `CodeEditor.Textarea`: continues as editable layer in interactive mode; hidden in read-only mode.
- `DiffLine`: continues generating unified patch and rendering `PatchDiff`; theme alignment happens at wrapper/slot level.

### 3) Scrollbar Mechanics

- Vertical scrollbar must be visually bound to the far-right boundary of the entire editor block.
- Inner overlays should no longer present competing vertical scrollbar placement.
- Preserve existing horizontal behavior for long code lines.
- Preserve existing sync logic (`handleScroll`) and keyboard behavior.

### 4) Error Handling and Regression Guardrails

- No changes to prop contracts for `CodeEditor` or `DiffLine`.
- Keep `DiffLine` worker fallback (`pre` patch output) intact.
- Preserve language detection and highlighting pipeline.
- Limit CSS/class updates to editor/diff relevant selectors to avoid unrelated regressions.

### 5) Verification Strategy

- `/roast/[id]`: confirm scrollbar appears at outer right edge of the full `CodeEditor` component.
- `/`: confirm home editor behavior remains correct.
- `/components`: confirm `DiffLine` visual shell alignment with `CodeEditor` and no API breakage.
- Run project verification command(s), prioritizing `pnpm lint` and type checks if available.

## Implementation Notes

- Prefer local class and variant updates in component files before introducing new global CSS.
- If global selector adjustments are required, keep them narrowly scoped to editor classes.
- Maintain strict adherence to existing UI component rules (named exports, `tv()`, `VariantProps`, explicit variant destructuring).

## Acceptance Criteria

- `DiffLine` visually matches `CodeEditor` shell theme direction in all current usages.
- In read-only `CodeEditor` on `/roast/[id]`, vertical scrollbar appears at component edge (near language card column), not inner code column.
- Home editor interaction and visual behavior remain unchanged from user perspective.
- No TypeScript/lint regressions introduced by the change.
