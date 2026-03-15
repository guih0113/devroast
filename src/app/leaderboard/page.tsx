import { asc, avg, count, sql } from 'drizzle-orm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LeaderboardRow } from '@/components/ui/leaderboard-row'

export const dynamic = 'force-dynamic'

import { db } from '@/db'
import { roasts } from '@/db/schema'

async function getLeaderboardData() {
  // Aggregate stats
  const [stats] = await db.select({ total: count(), avgScore: avg(roasts.score) }).from(roasts)

  // Top 50 worst scores, with a roast count (how many times same codeHash was submitted)
  const rows = await db
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

  return { stats, rows }
}

export default async function LeaderboardPage() {
  const { stats, rows } = await getLeaderboardData()

  const totalRoasts = stats?.total ?? 0
  const avgScore = stats?.avgScore ? Number(stats.avgScore).toFixed(1) : null

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <main className="flex flex-col gap-8 px-10 pt-16 pb-20">
        {/* Header */}
        <div className="mx-auto flex w-full max-w-[960px] flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold font-mono text-emerald-500 text-sm">{'// '}</span>
            <h1 className="font-bold font-mono text-sm text-zinc-100">shame_leaderboard</h1>
          </div>
          <p className="font-mono text-xs text-zinc-600">
            {'// the worst code on the internet, ranked by shame'}
          </p>

          {/* Aggregate stats */}
          <div className="flex items-center gap-6 pt-1">
            <span className="font-mono text-xs text-zinc-600">
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

        {/* Table */}
        <div className="mx-auto flex w-full max-w-[960px] flex-col">
          <div className="flex flex-col border border-[#2A2A2A]">
            {/* Header */}
            <div className="flex items-center gap-6 border-[#2A2A2A] border-b px-5 py-3">
              <span className="w-10 shrink-0 font-mono text-xs text-zinc-600">#</span>
              <span className="w-14 shrink-0 font-mono text-xs text-zinc-600">score</span>
              <span className="flex-1 font-mono text-xs text-zinc-600">code</span>
              <span className="w-16 shrink-0 text-right font-mono text-xs text-zinc-600">
                roasts
              </span>
              <span className="w-24 shrink-0 text-right font-mono text-xs text-zinc-600">lang</span>
            </div>

            {rows.length === 0 ? (
              <div className="px-5 py-12 text-center font-mono text-xs text-zinc-600">
                {'// no submissions yet — be the first to get roasted'}
              </div>
            ) : (
              rows.map((entry, idx) => (
                <Link key={entry.id} href={`/results?id=${entry.id}`} className="group">
                  <div className="flex items-center gap-6 border-[#2A2A2A] border-b px-5 py-4 transition-colors group-hover:bg-[#141414]">
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

        {/* Back button */}
        <div className="mx-auto flex w-full max-w-[960px] justify-center pt-4">
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
