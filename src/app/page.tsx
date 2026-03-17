import { asc, avg, count } from 'drizzle-orm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LeaderboardRow } from '@/components/ui/leaderboard-row'
import { db } from '@/db'
import { roasts } from '@/db/schema'
import { RoastForm } from './_components/roast-form'

export const dynamic = 'force-dynamic'

async function getStats() {
  const [row] = await db.select({ total: count(), avgScore: avg(roasts.score) }).from(roasts)
  return {
    total: row?.total ?? 0,
    avgScore: row?.avgScore ? Number(row.avgScore).toFixed(1) : null
  }
}

async function getPreviewEntries() {
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
    codePreview: r.code.slice(0, 120),
    lang: r.lang
  }))
}

export default async function HomePage() {
  const [stats, previewEntries] = await Promise.all([getStats(), getPreviewEntries()])

  const footerTotal =
    stats.total > 0
      ? `${stats.total.toLocaleString()} codes roasted`
      : 'be the first to get roasted'
  const footerAvg = stats.avgScore ? `avg score: ${stats.avgScore}/10` : null

  return (
    <div className="min-h-screen bg-zinc-950">
      <main className="flex flex-col gap-8 px-10 pt-20">
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="font-bold font-mono text-4xl text-emerald-500">$</span>
              <h1 className="font-bold font-mono text-4xl text-zinc-100">
                paste your code. get roasted.
              </h1>
            </div>
            <p className="font-mono text-sm text-zinc-500">
              {"// drop your code below and we'll rate it — brutally honest or full roast mode"}
            </p>
          </div>
        </div>

        <RoastForm />

        <div className="flex items-center justify-center gap-6 py-2">
          <span className="font-mono text-xs text-zinc-600">{footerTotal}</span>
          {footerAvg && (
            <>
              <span className="font-mono text-xs text-zinc-600">·</span>
              <span className="font-mono text-xs text-zinc-600">{footerAvg}</span>
            </>
          )}
        </div>

        <div className="h-8" />

        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-bold font-mono text-emerald-500 text-sm">{'// '}</span>
              <span className="font-bold font-mono text-sm text-zinc-100">shame_leaderboard</span>
            </div>
            <Link href="/leaderboard">
              <Button variant="ghost" size="sm">
                $ show all →
              </Button>
            </Link>
          </div>

          <p className="font-mono text-xs text-zinc-600">
            {'// the worst code on the internet, ranked by shame'}
          </p>

          <div className="flex flex-col border border-zinc-800">
            <div className="flex items-center gap-6 border-zinc-800 border-b px-5 py-3">
              <span className="w-10 shrink-0 font-mono text-xs text-zinc-600">#</span>
              <span className="w-14 shrink-0 font-mono text-xs text-zinc-600">score</span>
              <span className="flex-1 font-mono text-xs text-zinc-600">code</span>
              <span className="w-24 shrink-0 text-right font-mono text-xs text-zinc-600">lang</span>
            </div>

            {previewEntries.length === 0 ? (
              <div className="px-5 py-8 text-center font-mono text-xs text-zinc-600">
                {'// no roasts yet — be the first'}
              </div>
            ) : (
              previewEntries.map((entry) => (
                <LeaderboardRow.Root key={entry.rank}>
                  <LeaderboardRow.Rank rank={entry.rank} />
                  <LeaderboardRow.Score score={entry.score} />
                  <LeaderboardRow.CodePreview>{entry.codePreview}</LeaderboardRow.CodePreview>
                  <LeaderboardRow.Lang>{entry.lang}</LeaderboardRow.Lang>
                </LeaderboardRow.Root>
              ))
            )}
          </div>

          <div className="flex items-center justify-center py-2">
            <span className="font-mono text-xs text-zinc-600">
              {previewEntries.length > 0
                ? `// showing ${previewEntries.length} of ${stats.total.toLocaleString()} · visit full leaderboard ↓`
                : '// submit your code above to get started ↑'}
            </span>
          </div>
        </div>

        <div className="h-16" />
      </main>
    </div>
  )
}
