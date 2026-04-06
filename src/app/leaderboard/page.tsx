import { asc, avg, count, sql } from 'drizzle-orm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LeaderboardRow } from '@/components/ui/leaderboard-row'

export const dynamic = 'force-dynamic'

import { db } from '@/db'
import { withDatabaseStatus } from '@/db/error-handler'
import { roasts } from '@/db/schema'

async function getLeaderboardData() {
  return withDatabaseStatus(
    async () => {
      // Execute both queries in parallel for better performance
      const [statsResult, rows] = await Promise.all([
        db.select({ total: count(), avgScore: avg(roasts.score) }).from(roasts),
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
          .limit(50)
      ])

      const [stats] = statsResult

      return { stats, rows }
    },
    { stats: { total: 0, avgScore: null }, rows: [] },
    { log: false }
  )
}

export default async function LeaderboardPage() {
  const { data, dbOffline } = await getLeaderboardData()

  const totalRoasts = data.stats?.total ?? 0
  const avgScore = data.stats?.avgScore ? Number(data.stats.avgScore).toFixed(1) : null

  return (
    <div className="min-h-screen bg-zinc-950">
      <main className="flex flex-col gap-8 px-10 pt-16 pb-20">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold font-mono text-emerald-500 text-sm">{'// '}</span>
            <h1 className="font-bold font-mono text-sm text-zinc-100">shame_leaderboard</h1>
          </div>
          <p className="font-mono text-xs text-zinc-600">
            {'// the worst code on the internet, ranked by shame'}
          </p>

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
        </div>

        <div className="mx-auto flex w-full max-w-4xl flex-col">
          <div className="flex flex-col border border-zinc-800">
            <div className="flex items-center gap-6 border-zinc-800 border-b px-5 py-3">
              <span className="w-10 shrink-0 font-mono text-xs text-zinc-600">#</span>
              <span className="w-14 shrink-0 font-mono text-xs text-zinc-600">score</span>
              <span className="flex-1 font-mono text-xs text-zinc-600">code</span>
              <span className="w-16 shrink-0 text-right font-mono text-xs text-zinc-600">
                roasts
              </span>
              <span className="w-24 shrink-0 text-right font-mono text-xs text-zinc-600">lang</span>
            </div>

            {data.rows.length === 0 ? (
              <div className="px-5 py-12 text-center font-mono text-xs text-zinc-600">
                {'// no submissions yet — be the first to get roasted'}
              </div>
            ) : (
              data.rows.map((entry, idx) => (
                <Link key={entry.id} href={`/results?id=${entry.id}`} className="group">
                  <div className="flex items-center gap-6 border-zinc-800 border-b px-5 py-4 transition-colors group-hover:bg-zinc-900">
                    <LeaderboardRow.Rank rank={idx + 1} />
                    <LeaderboardRow.Score score={Number(entry.score)} />
                    <LeaderboardRow.CodePreview>
                      {entry.code.slice(0, 120)}
                    </LeaderboardRow.CodePreview>
                    <span className="w-16 shrink-0 text-right font-mono text-xs text-zinc-600">
                      ×{entry.roastCount}
                    </span>
                    <LeaderboardRow.Lang>{entry.lang}</LeaderboardRow.Lang>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {dbOffline && (
          <div className="mx-auto flex w-full max-w-4xl justify-center pt-4">
            <span className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-mono text-[11px] text-amber-300">
              DB offline
            </span>
          </div>
        )}

        <div className="mx-auto flex w-full max-w-4xl justify-center pt-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              ← back to roaster
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
