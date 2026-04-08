# Roast Results Page Unification Design

**Date:** 2026-04-08
**Status:** Draft

---

## Goal

Make `/roast/[id]` the single canonical **roast results** page.

This includes:

- Removing `/results?id=...` entirely (simple 404).
- Ensuring leaderboard clicks and post-submit navigation both land on `/roast/[id]`.
- Updating `/roast/[id]` layout to match `devroast.pen` Screen 2 (Roast Results), including:
  - `$ share_roast` button **layout only** (no share functionality)
  - Section order: `your_submission` → `detailed_analysis` → `suggested_fix`

---

## Non-Goals

- Implementing share functionality (copy link, social share, etc.).
- Preserving compatibility for old `/results?id=...` links (this project is not in production).
- Adding OG image generation / `/og` route work as part of this change.

---

## Current Problem

We currently have two URLs that represent “view a roast result”:

- `/roast/[id]` (used after creating a roast)
- `/results?id=...` (used by leaderboard)

This creates duplicated responsibility and inconsistent UX:

- The leaderboard sends users to a different page than the one used after submission.
- The layout differs between pages because `/results` renders `your_submission` but `/roast/[id]` does not.
- The core display component (`src/components/roast-display.tsx`) renders the analysis and diff internally, preventing the section order from matching the Pencil design.

---

## Design Source of Truth

- Pencil file: `devroast.pen`
- Screen: `Screen 2 - Roast Results` (node `8pCh0`)

Key layout requirements from Pencil:

- The `$ share_roast` UI appears in the score hero area (`shareRow` → `shareBtn` → `$ share_roast`).
- `your_submission` section appears before `detailed_analysis`.

---

## Proposed Architecture

### Routing

- Keep: `/roast/[id]` as the only roast results page.
- Delete: `/results` route and its components.
- Update leaderboard links to point to `/roast/[id]`.

### UI Composition

Refactor `src/components/roast-display.tsx` into composable sections so `/roast/[id]` can control the order:

- `RoastHero` (score ring, file path, verdict label, roast quote, meta, share button layout)
- `RoastAnalysisSection` (`detailed_analysis` heading + cards grid + skeleton)
- `RoastDiffSection` (`suggested_fix` heading + diff block)

Then `/roast/[id]` composes:

1. `RoastHero`
2. Divider
3. `your_submission` heading + read-only code viewer
4. Divider
5. `RoastAnalysisSection`
6. Divider
7. `RoastDiffSection` (only when diff exists)

### Shared Code Viewer

`CodeViewer` currently lives under the `/results` route (`src/app/results/_components/code-viewer.tsx`), but it’s also imported elsewhere.

Move it to a shared location so it can be used by:

- `/roast/[id]` page for `your_submission`
- leaderboard preview (collapsible code rows)

Proposed path:

- Create: `src/components/code-viewer.tsx`
- Update imports to use this shared component

---

## UX / Behavior

- `$ share_roast` button is present but disabled or no-op (layout only).
- Section headings match existing UI language and the Pencil concept:
  - `your_submission`
  - `detailed_analysis`
  - `suggested_fix`
- The existing streaming/generation behavior in `RoastViewer` remains the same; only the layout composition changes.

---

## File Plan (Expected Changes)

- Delete: `src/app/results/page.tsx`
- Delete: `src/app/results/_components/code-viewer.tsx`
- Modify: `src/app/leaderboard/_components/leaderboard-table.tsx` (link to `/roast/${id}`)
- Modify: `src/components/roast-display.tsx` (split into composable sections + share button layout)
- Modify: `src/app/roast/[id]/_components/roast-viewer.tsx` (compose sections + insert `your_submission` between hero and analysis)
- Create: `src/components/code-viewer.tsx` (shared read-only code viewer)
- Modify: `src/app/_components/leaderboard-code-row.tsx` (import shared CodeViewer)

---

## Risks / Edge Cases

- Deleting `/results` will break any existing links, but this is acceptable for a non-production app.
- Ensure no remaining imports reference `src/app/results/...`.
