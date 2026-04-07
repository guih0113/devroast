import { createTRPCRouter } from '../init'
import { leaderboardRouter } from './leaderboard'
import { roastRouter } from './roast'

export const appRouter = createTRPCRouter({
  leaderboard: leaderboardRouter,
  roast: roastRouter
})

export type AppRouter = typeof appRouter
