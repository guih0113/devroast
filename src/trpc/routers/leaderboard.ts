import { asc, avg, count, sql } from 'drizzle-orm'
import { cacheLife } from 'next/cache'
import { z } from 'zod'
import { db } from '@/db'
import { isDatabaseConnectionError } from '@/db/error-handler'
import { roasts } from '@/db/schema'
import { baseProcedure, createTRPCRouter } from '../init'

export const ITEMS_PER_PAGE = 20
const LEADERBOARD_REVALIDATE_SECONDS = 60 * 60

type LeaderboardStats = {
  total: number
  avgScore: string | null
}

type LeaderboardRow = {
  id: string
  score: string
  code: string
  lang: string
  fileName: string | null
  roastCount: number
}

async function queryStats(): Promise<LeaderboardStats> {
  const [row] = await db.select({ total: count(), avgScore: avg(roasts.score) }).from(roasts)
  return {
    total: row?.total ?? 0,
    avgScore: row?.avgScore ? Number(row.avgScore).toFixed(1) : null
  }
}

async function getStatsCached() {
  'use cache'
  cacheLife({ revalidate: LEADERBOARD_REVALIDATE_SECONDS, expire: LEADERBOARD_REVALIDATE_SECONDS })
  return queryStats()
}

async function queryPage(
  page: number
): Promise<{ stats: LeaderboardStats; rows: LeaderboardRow[] }> {
  const offset = (page - 1) * ITEMS_PER_PAGE

  const [stats, rows] = await Promise.all([
    queryStats(),
    db
      .select({
        id: roasts.id,
        score: roasts.score,
        code: roasts.code,
        lang: roasts.lang,
        fileName: roasts.fileName,
        roastCount: sql<number>`(
          select count(*)::int from roasts r2
          where r2.code_hash = ${roasts.codeHash}
        )`
      })
      .from(roasts)
      .orderBy(asc(roasts.score))
      .limit(ITEMS_PER_PAGE)
      .offset(offset)
  ])

  return { stats, rows }
}

async function getPageCached(page: number) {
  'use cache'
  cacheLife({ revalidate: LEADERBOARD_REVALIDATE_SECONDS, expire: LEADERBOARD_REVALIDATE_SECONDS })
  return queryPage(page)
}

async function queryPreview(): Promise<
  Array<{ rank: number; score: number; code: string; lang: string }>
> {
  const rows = await db
    .select({
      id: roasts.id,
      score: roasts.score,
      code: roasts.code,
      lang: roasts.lang
    })
    .from(roasts)
    .orderBy(asc(roasts.score))
    .limit(3)

  return rows.map((r, i) => ({
    rank: i + 1,
    score: Number(r.score),
    code: r.code,
    lang: r.lang
  }))
}

async function getPreviewCached() {
  'use cache'
  cacheLife({ revalidate: LEADERBOARD_REVALIDATE_SECONDS, expire: LEADERBOARD_REVALIDATE_SECONDS })
  return queryPreview()
}

async function queryTotalCount(): Promise<number> {
  const [row] = await db.select({ total: count() }).from(roasts)
  return row?.total ?? 0
}

async function getTotalCountCached() {
  'use cache'
  cacheLife({ revalidate: LEADERBOARD_REVALIDATE_SECONDS, expire: LEADERBOARD_REVALIDATE_SECONDS })
  return queryTotalCount()
}

export const leaderboardRouter = createTRPCRouter({
  getStats: baseProcedure.query(async () => {
    try {
      const stats = await getStatsCached()
      return { data: stats, dbOffline: false }
    } catch (error) {
      if (isDatabaseConnectionError(error)) {
        return { data: { total: 0, avgScore: null }, dbOffline: true }
      }
      throw error
    }
  }),

  getTotalCount: baseProcedure.query(async () => {
    try {
      const total = await getTotalCountCached()
      return { data: total, dbOffline: false }
    } catch (error) {
      if (isDatabaseConnectionError(error)) {
        return { data: 0, dbOffline: true }
      }
      throw error
    }
  }),

  getPreview: baseProcedure.query(async () => {
    try {
      const entries = await getPreviewCached()
      return { data: entries, dbOffline: false }
    } catch (error) {
      if (isDatabaseConnectionError(error)) {
        return { data: [], dbOffline: true }
      }
      throw error
    }
  }),

  getPage: baseProcedure
    .input(
      z.object({
        page: z.number().int().min(1)
      })
    )
    .query(async ({ input }) => {
      try {
        const { stats, rows } = await getPageCached(input.page)
        return { data: { stats, rows }, dbOffline: false }
      } catch (error) {
        if (isDatabaseConnectionError(error)) {
          return { data: { stats: { total: 0, avgScore: null }, rows: [] }, dbOffline: true }
        }
        throw error
      }
    })
})
