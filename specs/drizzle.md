# Drizzle ORM — Implementation Spec

## Overview

This document specifies the full database + AI layer for **devroast** using:

- **Drizzle ORM** — schema, migrations, and queries
- **PostgreSQL 16** — running locally via Docker Compose
- **Vercel AI SDK** (`ai`) — structured object generation for the roast result
- **Anonymous submissions** — no user accounts; each roast is a standalone public record

Source of truth for data shapes: the Pencil design file (`devroast.pen`) — 4 screens analysed.

---

## Screen Inventory (from Pencil)

| Screen | Node ID | What it drives in the DB |
|---|---|---|
| Screen 1 — Code Input | `9qwc9` | `submissions` write: `code`, `lang`, `roastMode` |
| Screen 2 — Roast Results | `8pCh0` | `submissions` read: `score`, `roastQuote`, `issuesFound`, `errors`, `fileName`; `analysis_cards`; `diff_lines` |
| Screen 3 — Shame Leaderboard | `5iseT` | `submissions` read: `rank`, `score`, `code` preview, `lang`, `roastMode`, `createdAt`, roast count |
| Screen 4 — OG Image | `4J5QT` | `submissions` read: `score`, `lang`, line count, `roastQuote`, verdict label |

### Key design observations

**Screen 1 — Code Input**
- Footer: `2,847 codes roasted · avg score: 4.2/10` → `COUNT(*) + AVG(score)` aggregate, no extra table.
- "roast code" toggle → `roastMode: boolean` captured per submission.

**Screen 2 — Roast Results**
- Score hero: `score`, coloured verdict badge, `roastQuote`, `issuesFound`, `errors`, `fileName`, `createdAt`.
- Verdict label is derived from `score` at render time — **never stored**:
  - `score <= 3` → `needs_serious_help` (red)
  - `score <= 5` → `pretty_bad` (amber)
  - `score <= 7` → `could_be_worse` (amber)
  - `score > 7`  → `not_terrible` (green)
- Analysis cards: 2×2 grid; `position` controls display order.
- Diff block header shows `fileName`.

**Screen 3 — Shame Leaderboard**
- Entry card: rank, `score`, `lang`, `roastMode`, `createdAt`, 3-line code preview, "N times" roast count.
- Roast count = `COUNT(*) WHERE code_hash = ?` — requires `codeHash` on `submissions`.

**Screen 4 — OG Image**
- `score`, `lang`, line count (computed from `code.split('\n').length`), `roastQuote`.
- Generated server-side via `@vercel/og`; reads directly from `submissions`.

### Anonymous submissions

There are **no user accounts**. Every roast is a public, anonymous record. No `userId`,
session token, or auth layer is needed at the DB level. IP address is intentionally **not**
stored (privacy). The submission `id` (UUID) is the only claim a browser holds — passed as
`/results?id=<uuid>` immediately after the POST.

---

## Package Installation

```bash
# ORM + driver
pnpm add drizzle-orm postgres

# Vercel AI SDK + OpenAI provider
pnpm add ai @ai-sdk/openai

# Drizzle CLI (dev only)
pnpm add -D drizzle-kit
```

| Package | Role |
|---|---|
| `drizzle-orm` | ORM runtime — schema, queries, relations |
| `postgres` | `postgres.js` driver — ESM-native, no libpq dependency |
| `drizzle-kit` | CLI — `generate`, `migrate`, `push`, `studio` |
| `ai` | Vercel AI SDK core — `generateObject`, streaming helpers |
| `@ai-sdk/openai` | OpenAI provider for the AI SDK |

---

## Environment Variables

**`.env.local`** (never committed — add to `.gitignore`):

```env
DATABASE_URL=postgresql://devroast:devroast@localhost:5432/devroast
OPENAI_API_KEY=sk-...
```

**`.env.example`** (committed as documentation):

```env
DATABASE_URL=postgresql://devroast:devroast@localhost:5432/devroast
OPENAI_API_KEY=your_openai_api_key_here
```

---

## Infrastructure — Docker Compose

**`docker-compose.yml`** at repo root:

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: devroast
      POSTGRES_PASSWORD: devroast
      POSTGRES_DB: devroast
    ports:
      - '5432:5432'
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U devroast -d devroast']
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pg_data:
```

### Docker commands

```bash
# Start Postgres in the background
docker compose up -d

# Wait for healthy status
docker compose ps

# Stop (data preserved in volume)
docker compose stop

# Restart
docker compose start

# Destroy container + wipe all data
docker compose down -v
```

---

## Drizzle Kit Config

**`drizzle.config.ts`** at repo root:

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect:   'postgresql',
  schema:    './src/db/schema.ts',
  out:       './src/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict:  true,
})
```

### Drizzle Kit commands

| Command | What it does |
|---|---|
| `pnpm drizzle-kit generate` | Diff schema against last snapshot → write new SQL migration file to `src/db/migrations/` |
| `pnpm drizzle-kit migrate` | Apply all pending migration files to the DB |
| `pnpm drizzle-kit push` | Directly push schema changes to DB **without** generating a migration file (dev/prototyping only) |
| `pnpm drizzle-kit studio` | Open the Drizzle Studio GUI at `https://local.drizzle.studio` |
| `pnpm drizzle-kit check` | Validate migration history for consistency |

> **Rule:** use `generate` + `migrate` for everything that will be committed.
> Use `push` only for rapid local prototyping — never in CI.

### `package.json` scripts

```json
{
  "scripts": {
    "dev":          "next dev",
    "build":        "next build",
    "start":        "next start",
    "lint":         "biome lint ./src",
    "format":       "biome format ./src --write",
    "check":        "biome check ./src",
    "db:up":        "docker compose up -d",
    "db:down":      "docker compose down",
    "db:reset":     "docker compose down -v && docker compose up -d",
    "db:generate":  "drizzle-kit generate",
    "db:migrate":   "drizzle-kit migrate",
    "db:push":      "drizzle-kit push",
    "db:studio":    "drizzle-kit studio"
  }
}
```

---

## Project Structure (additions)

```
src/
├── db/
│   ├── index.ts            # db client singleton (postgres.js + drizzle)
│   ├── schema.ts           # all tables, enums, relations, indexes
│   └── migrations/         # SQL files generated by drizzle-kit generate
│       └── 0000_init.sql   # first migration (auto-generated)
├── lib/
│   └── score.ts            # getVerdict(score) helper — pure function, no DB
└── app/
    └── api/
        └── roast/
            └── route.ts    # POST /api/roast — AI call + DB insert
drizzle.config.ts           # drizzle-kit config
docker-compose.yml          # local Postgres
.env.example                # committed env template
.env.local                  # real secrets — gitignored
```

---

## DB Client (`src/db/index.ts`)

```ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// postgres.js connection — reused across requests in the same process
const client = postgres(process.env.DATABASE_URL!)

export const db = drizzle(client, { schema })
```

**Notes:**
- `postgres.js` is ESM-native and has no native binary dependency.
- In Next.js App Router, this module is evaluated once per worker process — the connection
  pool is reused automatically.
- `DATABASE_URL` must be present at startup; a missing value crashes immediately (fail-fast).

---

## Enums

```ts
// src/db/schema.ts
import { pgEnum, pgTable, uuid, text, varchar, integer, boolean, numeric, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Maps to badge.tsx + analysis-card.tsx variant prop
export const severityEnum = pgEnum('severity', ['critical', 'warning', 'good'])

// Maps to diff-line.tsx variant prop
export const diffVariantEnum = pgEnum('diff_variant', ['added', 'removed', 'context'])
```

---

## Tables

### `submissions`

One row = one roast session. Fully anonymous — no user identity stored.

```ts
export const submissions = pgTable('submissions', {
  id:          uuid('id').primaryKey().defaultRandom(),
  code:        text('code').notNull(),
  codeHash:    varchar('code_hash', { length: 64 }).notNull(), // SHA-256 hex of code.trim()
  lang:        varchar('lang', { length: 64 }).notNull(),      // shiki BundledLanguage id
  fileName:    varchar('file_name', { length: 255 }),          // nullable — inferred by AI or user
  score:       numeric('score', { precision: 4, scale: 2 }).notNull(), // 0.00–10.00
  roastQuote:  text('roast_quote').notNull(),                  // AI one-liner
  issuesFound: integer('issues_found').notNull().default(0),
  errors:      integer('errors').notNull().default(0),
  roastMode:   boolean('roast_mode').notNull().default(false), // toggle at submit time
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

**Column notes:**
- `score`: `numeric` avoids float drift; critical for consistent leaderboard ordering.
- `codeHash`: SHA-256 of `code.trim()` — groups re-submissions of identical code for the
  "N times roasted" counter on the leaderboard.
- `fileName`: optional; the AI infers it from the code (e.g. `calculateTotal_main.js`).
- No `userId`, `sessionId`, or IP address — submissions are entirely anonymous.

---

### `analysis_cards`

One-to-many with `submissions`. Each row is one card in the `// detailed_analysis` section.

```ts
export const analysisCards = pgTable('analysis_cards', {
  id:           uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id')
                  .notNull()
                  .references(() => submissions.id, { onDelete: 'cascade' }),
  severity:     severityEnum('severity').notNull(),
  title:        varchar('title', { length: 255 }).notNull(),
  description:  text('description').notNull(),
  position:     integer('position').notNull().default(0), // AI-returned order
})
```

---

### `diff_lines`

One-to-many with `submissions`. Each row is one line in the `// suggested_fix` diff block.

```ts
export const diffLines = pgTable('diff_lines', {
  id:           uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id')
                  .notNull()
                  .references(() => submissions.id, { onDelete: 'cascade' }),
  variant:      diffVariantEnum('variant').notNull(),
  code:         text('code').notNull(),       // raw line text, no +/-/space prefix
  lineNumber:   integer('line_number').notNull(),
})
```

---

## Relations

```ts
export const submissionsRelations = relations(submissions, ({ many }) => ({
  analysisCards: many(analysisCards),
  diffLines:     many(diffLines),
}))

export const analysisCardsRelations = relations(analysisCards, ({ one }) => ({
  submission: one(submissions, {
    fields:     [analysisCards.submissionId],
    references: [submissions.id],
  }),
}))

export const diffLinesRelations = relations(diffLines, ({ one }) => ({
  submission: one(submissions, {
    fields:     [diffLines.submissionId],
    references: [submissions.id],
  }),
}))
```

---

## Indexes

```ts
// Leaderboard: ORDER BY score ASC
export const submissionsScoreIdx = index('submissions_score_idx')
  .on(submissions.score)

// Feed / recent: ORDER BY created_at DESC
export const submissionsCreatedAtIdx = index('submissions_created_at_idx')
  .on(submissions.createdAt)

// Roast-count grouping: WHERE code_hash = ?
export const submissionsCodeHashIdx = index('submissions_code_hash_idx')
  .on(submissions.codeHash)

// Cards per submission
export const analysisCardsSubmissionIdx = index('analysis_cards_submission_id_idx')
  .on(analysisCards.submissionId)

// Diff lines per submission, ordered
export const diffLinesSubmissionIdx = index('diff_lines_submission_id_line_number_idx')
  .on(diffLines.submissionId, diffLines.lineNumber)
```

---

## Vercel AI SDK — Roast Generation

### AI response schema (`zod`)

The AI SDK's `generateObject` enforces a typed response. Install `zod` (already a transitive
dep of `ai`, but add it explicitly):

```bash
pnpm add zod
```

```ts
// src/app/api/roast/route.ts
import { z } from 'zod'

const RoastSchema = z.object({
  score:       z.number().min(0).max(10),
  roastQuote:  z.string(),
  fileName:    z.string().optional(),
  issuesFound: z.number().int().min(0),
  errors:      z.number().int().min(0),
  cards: z.array(z.object({
    severity:    z.enum(['critical', 'warning', 'good']),
    title:       z.string(),
    description: z.string(),
  })).min(1).max(8),
  diffLines: z.array(z.object({
    variant: z.enum(['added', 'removed', 'context']),
    code:    z.string(),
  })).min(1),
})

export type RoastResult = z.infer<typeof RoastSchema>
```

### System prompt

```ts
const SYSTEM_PROMPT = `
You are a brutally honest senior software engineer doing a code review.
You never sugarcoat. You find every problem.

Given a code snippet, return a JSON object with:
- score: float 0–10 (0 = catastrophic, 10 = flawless)
- roastQuote: one savage sentence summarising the state of the code
- fileName: inferred filename based on content (e.g. "calculateTotal.js"), or null
- issuesFound: total count of issues identified
- errors: count of critical errors only
- cards: array of analysis cards, each with severity (critical/warning/good), title, description
- diffLines: a full git-style diff showing the suggested rewrite, each line with variant (added/removed/context) and code text (no +/-/space prefix)

Be accurate. Be mean if roastMode is true. Return at least one "good" card if the code has anything right.
`.trim()
```

### Route handler (`src/app/api/roast/route.ts`)

```ts
import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createHash } from 'crypto'
import { db } from '@/db'
import { submissions, analysisCards, diffLines } from '@/db/schema'
import { RoastSchema } from './schema'  // or inline

export async function POST(req: NextRequest) {
  const { code, lang, roastMode } = await req.json()

  // 1. Call the AI
  const { object } = await generateObject({
    model:  openai('gpt-4o-mini'),
    schema: RoastSchema,
    system: SYSTEM_PROMPT,
    prompt: `roastMode: ${roastMode}\nlang: ${lang}\n\n\`\`\`${lang}\n${code}\n\`\`\``,
  })

  // 2. Compute code hash
  const codeHash = createHash('sha256').update(code.trim()).digest('hex')

  // 3. Persist everything in one transaction
  const [submission] = await db.transaction(async (tx) => {
    const [sub] = await tx
      .insert(submissions)
      .values({
        code,
        codeHash,
        lang,
        fileName:    object.fileName ?? null,
        score:       String(object.score),
        roastQuote:  object.roastQuote,
        issuesFound: object.issuesFound,
        errors:      object.errors,
        roastMode,
      })
      .returning({ id: submissions.id })

    await tx.insert(analysisCards).values(
      object.cards.map((card, i) => ({
        submissionId: sub.id,
        severity:     card.severity,
        title:        card.title,
        description:  card.description,
        position:     i,
      }))
    )

    await tx.insert(diffLines).values(
      object.diffLines.map((line, i) => ({
        submissionId: sub.id,
        variant:      line.variant,
        code:         line.code,
        lineNumber:   i,
      }))
    )

    return [sub]
  })

  // 4. Return the new submission id — client redirects to /results?id=<uuid>
  return NextResponse.json({ id: submission.id })
}
```

**Notes:**
- `generateObject` guarantees the response matches `RoastSchema` — no manual parsing needed.
- `gpt-4o-mini` is the default model (cheap + fast). Swap for `gpt-4o` via env var for
  higher quality if needed.
- The entire DB write is one transaction — if any insert fails, nothing is persisted.
- No user identity is attached at any step.

---

## Query Patterns

### Results page (`/results?id=<uuid>`)

```ts
import { eq, asc } from 'drizzle-orm'

const submission = await db.query.submissions.findFirst({
  where: eq(submissions.id, id),
  with: {
    analysisCards: { orderBy: asc(analysisCards.position) },
    diffLines:     { orderBy: asc(diffLines.lineNumber) },
  },
})
```

### Leaderboard (`/leaderboard`)

```ts
import { asc, sql } from 'drizzle-orm'

const entries = await db
  .select({
    id:         submissions.id,
    score:      submissions.score,
    code:       submissions.code,
    lang:       submissions.lang,
    roastMode:  submissions.roastMode,
    createdAt:  submissions.createdAt,
    roastCount: sql<number>`(
      SELECT COUNT(*) FROM submissions s2
      WHERE s2.code_hash = ${submissions.codeHash}
    )`.as('roast_count'),
  })
  .from(submissions)
  .orderBy(asc(submissions.score))
  .limit(50)
```

### Aggregate stats (footer + leaderboard header)

```ts
import { count, sql } from 'drizzle-orm'

const [stats] = await db
  .select({
    total:    count(),
    avgScore: sql<string>`ROUND(AVG(score)::numeric, 1)`.as('avg_score'),
  })
  .from(submissions)
```

---

## Score Helper (`src/lib/score.ts`)

```ts
export type Verdict = {
  label: string
  color: 'accent-red' | 'accent-amber' | 'accent-green'
}

export function getVerdict(score: number): Verdict {
  if (score <= 3) return { label: 'needs_serious_help', color: 'accent-red'   }
  if (score <= 5) return { label: 'pretty_bad',         color: 'accent-amber' }
  if (score <= 7) return { label: 'could_be_worse',     color: 'accent-amber' }
  return           { label: 'not_terrible',             color: 'accent-green' }
}
```

Used on Screen 2 (score hero badge) and Screen 4 (OG image verdict row).

---

## Implementation To-Do List

### 1. Infrastructure

- [ ] Create `docker-compose.yml` at repo root (with healthcheck)
- [ ] Add `.env.local` to `.gitignore`
- [ ] Create `.env.example` with `DATABASE_URL` and `OPENAI_API_KEY` placeholders
- [ ] Start Postgres: `pnpm db:up`
- [ ] Verify Postgres is healthy: `docker compose ps`

### 2. Package Installation

- [ ] `pnpm add drizzle-orm postgres ai @ai-sdk/openai zod`
- [ ] `pnpm add -D drizzle-kit`

### 3. Drizzle Config + DB Client

- [ ] Create `drizzle.config.ts` at repo root
- [ ] Create `src/db/index.ts` — `postgres.js` client + `drizzle()` singleton
- [ ] Add `db:*` scripts to `package.json`

### 4. Schema

- [ ] Create `src/db/schema.ts`
- [ ] Define `severityEnum` and `diffVariantEnum`
- [ ] Define `submissions` table (all columns including `codeHash`)
- [ ] Define `analysis_cards` table with cascade FK
- [ ] Define `diff_lines` table with cascade FK
- [ ] Define all relations
- [ ] Define all indexes

### 5. Migrations

- [ ] Run `pnpm db:generate` → inspect generated SQL in `src/db/migrations/`
- [ ] Run `pnpm db:migrate` → apply to local Postgres
- [ ] Verify with `pnpm db:studio` (open Drizzle Studio, check tables exist)
- [ ] Alternatively verify via: `docker compose exec db psql -U devroast -d devroast -c '\dt'`

### 6. AI Route

- [ ] Create `src/app/api/roast/route.ts`
- [ ] Define `RoastSchema` (zod) — `score`, `roastQuote`, `fileName`, `issuesFound`,
  `errors`, `cards[]`, `diffLines[]`
- [ ] Write `SYSTEM_PROMPT` — brutal, honest, roastMode-aware
- [ ] Implement `POST /api/roast`:
  1. Parse `{ code, lang, roastMode }` from request body
  2. Call `generateObject({ model: openai('gpt-4o-mini'), schema: RoastSchema, ... })`
  3. Compute `codeHash = sha256(code.trim())`
  4. Insert `submissions` + `analysis_cards` + `diff_lines` in one transaction
  5. Return `{ id: submission.id }`

### 7. Score Helper

- [ ] Create `src/lib/score.ts` with `getVerdict(score: number): Verdict`

### 8. Page Integration

- [ ] **Home (`src/app/page.tsx`)**
  - [ ] Wire "roast my code" button to `POST /api/roast` with `{ code, lang, roastMode }`
  - [ ] On success, redirect to `/results?id=<uuid>`
  - [ ] Replace hardcoded footer stats with `getSubmissionStats()` (async, from DB)
  - [ ] Replace hardcoded `PREVIEW_ENTRIES` leaderboard with DB query (top 3 by score ASC)

- [ ] **Results (`src/app/results/page.tsx`)**
  - [ ] Read `?id` from `searchParams`
  - [ ] Fetch submission + cards + diff lines from DB via `db.query.submissions.findFirst`
  - [ ] Replace all hardcoded data with live DB values
  - [ ] Use `getVerdict(score)` for the badge label and colour

- [ ] **Leaderboard (`src/app/leaderboard/page.tsx`)** ← create this file
  - [ ] Fetch top 50 submissions ordered by `score ASC` with roast count subquery
  - [ ] Fetch aggregate stats (total count + avg score)
  - [ ] Render using existing `LeaderboardRow.*` components

- [ ] **OG Image (`src/app/og/route.tsx`)** ← create this file
  - [ ] Install `@vercel/og` if not already present (`pnpm add @vercel/og`)
  - [ ] Accept `?id=<uuid>` param, fetch submission from DB
  - [ ] Render `score`, `lang`, line count, `roastQuote`, verdict from `getVerdict(score)`
  - [ ] Match Screen 4 layout from Pencil (`1200×630`, dark bg, amber score, mono font)
