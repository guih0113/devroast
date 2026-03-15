import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

// -- Enums -------------------------------------------------------------------

export const severityEnum = pgEnum('severity', ['critical', 'warning', 'good'])

// -- Tables ------------------------------------------------------------------

export const roasts = pgTable(
  'roasts',
  {
    id: uuid().primaryKey().defaultRandom(),
    code: text().notNull(),
    codeHash: varchar({ length: 64 }).notNull(),
    lang: varchar({ length: 64 }).notNull(),
    fileName: varchar({ length: 255 }),
    score: numeric({ precision: 4, scale: 2 }).notNull(),
    roastQuote: text().notNull(),
    issuesFound: integer().notNull().default(0),
    errors: integer().notNull().default(0),
    roastMode: boolean().notNull().default(false),
    diff: jsonb()
      .$type<Array<{ variant: 'added' | 'removed' | 'context'; code: string }>>()
      .notNull()
      .default([]),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    index('roasts_score_idx').on(t.score),
    index('roasts_code_hash_idx').on(t.codeHash),
    index('roasts_created_at_idx').on(t.createdAt)
  ]
)

export const analysisItems = pgTable('analysis_items', {
  id: uuid().primaryKey().defaultRandom(),
  roastId: uuid()
    .notNull()
    .references(() => roasts.id, { onDelete: 'cascade' }),
  severity: severityEnum().notNull(),
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  position: integer().notNull().default(0)
})

// -- Types -------------------------------------------------------------------

export type Roast = typeof roasts.$inferSelect
export type NewRoast = typeof roasts.$inferInsert

export type AnalysisItem = typeof analysisItems.$inferSelect
export type NewAnalysisItem = typeof analysisItems.$inferInsert
