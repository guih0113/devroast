import { asc } from 'drizzle-orm'
import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { LeaderboardRow } from '@/components/ui/leaderboard-row'
import { db } from '@/db'
import { withDatabaseStatus } from '@/db/error-handler'
import { roasts } from '@/db/schema'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { RoastForm } from './_components/roast-form'
import { StatsFooter } from './_components/stats-footer'
import { StatsFooterSkeleton } from './_components/stats-footer-skeleton'

export const dynamic = 'force-dynamic'

async function getPreviewEntries() {
  return withDatabaseStatus(
    async () => {
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
    },
    [],
    { log: false }
  )
}

export default async function HomePage() {
  prefetch(trpc.roast.getStats.queryOptions())
  const previewEntries = await getPreviewEntries()
  const dbOffline = previewEntries.dbOffline

  return (
    <HydrateClient>
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

          <Suspense fallback={<StatsFooterSkeleton />}>
            <StatsFooter />
          </Suspense>

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
                <span className="w-24 shrink-0 text-right font-mono text-xs text-zinc-600">
                  lang
                </span>
              </div>

              {previewEntries.data.length === 0 ? (
                <div className="px-5 py-8 text-center font-mono text-xs text-zinc-600">
                  {'// no roasts yet — be the first'}
                </div>
              ) : (
                previewEntries.data.map((entry) => (
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
                {previewEntries.data.length > 0
                  ? '// visit full leaderboard ↓'
                  : '// submit your code above to get started ↑'}
              </span>
            </div>

            {dbOffline && (
              <div className="flex items-center justify-center">
                <span className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-mono text-[11px] text-amber-300">
                  DB offline
                </span>
              </div>
            )}
          </div>

          <div className="h-16" />
        </main>
      </div>
    </HydrateClient>
  )
}
