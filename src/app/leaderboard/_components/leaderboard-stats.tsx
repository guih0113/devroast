type LeaderboardStatsProps = {
  totalRoasts: number
  avgScore: string | null
}

export function LeaderboardStats({ totalRoasts, avgScore }: LeaderboardStatsProps) {
  return (
    <div className="flex items-center gap-6 pt-1">
      <span className="font-mono text-xs text-zinc-600" suppressHydrationWarning>
        {totalRoasts.toLocaleString()} total roasts
      </span>
      {avgScore !== null && (
        <>
          <span className="font-mono text-xs text-zinc-600">·</span>
          <span className="font-mono text-xs text-zinc-600">avg score: {avgScore}/10</span>
        </>
      )}
    </div>
  )
}
