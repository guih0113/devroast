import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { LeaderboardFooter } from './_components/leaderboard-footer'
import { LeaderboardFooterSkeleton } from './_components/leaderboard-footer-skeleton'
import { LeaderboardPreview } from './_components/leaderboard-preview'
import { LeaderboardPreviewSkeleton } from './_components/leaderboard-preview-skeleton'
import { RoastForm } from './_components/roast-form'
import { StatsFooter } from './_components/stats-footer'
import { StatsFooterSkeleton } from './_components/stats-footer-skeleton'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  prefetch(trpc.roast.getStats.queryOptions())

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

            <Suspense fallback={<LeaderboardPreviewSkeleton />}>
              <LeaderboardPreview />
            </Suspense>

            <Suspense fallback={<LeaderboardFooterSkeleton />}>
              <LeaderboardFooter />
            </Suspense>
          </div>

          <div className="h-16" />
        </main>
      </div>
    </HydrateClient>
  )
}
