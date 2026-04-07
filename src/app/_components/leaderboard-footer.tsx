import Link from 'next/link'
import { getCaller } from '@/trpc/server'

export async function LeaderboardFooter() {
  const trpc = await getCaller()
  const totalCount = await trpc.leaderboard.getTotalCount()

  return (
    <div className="flex items-center justify-center py-2">
      {totalCount.data > 0 ? (
        <span className="font-mono text-xs text-zinc-600" suppressHydrationWarning>
          showing top 3 of {totalCount.data.toLocaleString()} ·{' '}
          <Link
            href="/leaderboard"
            className="text-zinc-600 underline-offset-2 transition-colors hover:text-zinc-200 hover:underline"
          >
            view full leaderboard &gt;&gt;
          </Link>
        </span>
      ) : (
        <span className="font-mono text-xs text-zinc-600">
          {'// submit your code above to get started ↑'}
        </span>
      )}
    </div>
  )
}
