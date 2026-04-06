import { count } from 'drizzle-orm'
import Link from 'next/link'
import { db } from '@/db'
import { withDatabaseStatus } from '@/db/error-handler'
import { roasts } from '@/db/schema'

async function getTotalCount() {
  return withDatabaseStatus(
    async () => {
      const [row] = await db.select({ total: count() }).from(roasts)
      return row?.total ?? 0
    },
    0,
    { log: false }
  )
}

export async function LeaderboardFooter() {
  const totalCount = await getTotalCount()

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
