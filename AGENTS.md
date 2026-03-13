# devroast — AGENTS.md

## What this is

A web app where users paste code and receive a brutally honest AI quality score, roast quote,
analysis cards, and a suggested diff fix. Routes: `/` (home), `/results`, `/leaderboard`.

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5, strict mode |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"`) |
| Variant system | `tailwind-variants` (`tv()`) |
| Class merging | `tailwind-merge` (`twMerge`) — only outside `tv()` calls |
| Headless UI | `@base-ui-components/react` |
| Syntax highlight | `shiki` (server-side, async RSC) |
| Linter/Formatter | Biome (2 spaces, single quotes, no semicolons) |
| Package manager | pnpm |

## Project structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout — JetBrains Mono font + <Navbar />
│   ├── page.tsx            # Home — code editor, toggle, leaderboard preview
│   ├── globals.css         # Tailwind v4 @import, @theme font override, Shiki styles
│   ├── results/page.tsx    # Results — ScoreRing, CodeBlock, AnalysisCard, DiffLine
│   └── components/page.tsx # Live component showcase (all variants)
└── components/ui/          # All UI primitives (see rules below)
```

Path alias: `@/*` → `src/*`

## UI component rules

Full rules live in `src/components/ui/AGENTS.md`. Key points:

1. **Named exports only** — never `export default`.
2. **Composition pattern** for multi-part components — exported as a namespace object:
   ```ts
   export const AnalysisCard = { Root, Badge, Title, Description }
   // used as <AnalysisCard.Root>, <AnalysisCard.Title>, etc.
   ```
3. **`tv()` for all variants** — `base` array + `variants` object + `defaultVariants` always set.
   Pass `className` directly into `tv()` for merging; do not wrap with `twMerge`.
4. **Props** extend `ComponentProps<'element'>` + `VariantProps<typeof tv_instance>`.
   Destructure variant props explicitly; spread the rest via `...props`.
5. **One component per file**, kebab-case filename. No business logic in UI components.
6. `'use client'` only when browser APIs or interactivity are required (e.g. `toggle.tsx`).
7. Async Server Components are allowed (e.g. `code-block.tsx` awaits Shiki).

## Patterns to follow

- All data is currently hardcoded in page files — no API layer or state management yet.
- `twMerge` is used only in `score-ring.tsx` and `code-block.tsx` (components without `tv()`).
- Compound namespace components (`AnalysisCard`, `LeaderboardRow`) keep sub-functions
  module-private (no `export` on individual pieces, only on the final object).
