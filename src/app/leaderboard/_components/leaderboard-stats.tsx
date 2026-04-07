import { getCaller } from '@/trpc/server'

export async function LeaderboardStats() {
  const trpc = await getCaller()
  const { data } = await trpc.leaderboard.getStats()

  const totalRoasts = data?.total ?? 0
  const avgScore = data?.avgScore ? Number(data.avgScore).toFixed(1) : null

  return (
    <div className="flex items-center gap-6 pt-1">
      <span className="font-mono text-xs text-zinc-600" suppressHydrationWarning>
        {totalRoasts.toLocaleString()} total roasts
      </span>
      {avgScore && (
        <>
          <span className="font-mono text-xs text-zinc-600">·</span>
          <span className="font-mono text-xs text-zinc-600">avg score: {avgScore}/10</span>
        </>
      )}
    </div>
  )
}
