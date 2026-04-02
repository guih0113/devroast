import { avg, count } from 'drizzle-orm'
import { db } from '@/db'
import { roasts } from '@/db/schema'
import { baseProcedure, createTRPCRouter } from '../init'

export const roastRouter = createTRPCRouter({
  getStats: baseProcedure.query(async () => {
    const [row] = await db.select({ total: count(), avgScore: avg(roasts.score) }).from(roasts)

    return {
      total: row?.total ?? 0,
      avgScore: row?.avgScore ? Number(row.avgScore).toFixed(1) : null
    }
  })
})
