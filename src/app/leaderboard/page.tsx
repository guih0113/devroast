import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { ITEMS_PER_PAGE } from '@/trpc/routers/leaderboard'
import { getCaller } from '@/trpc/server'
import { LeaderboardStats } from './_components/leaderboard-stats'
import { LeaderboardTable } from './_components/leaderboard-table'

type Props = {
  searchParams: Promise<{ page?: string }>
}

function PaginationWrapper({
  currentPage,
  totalRoasts
}: {
  currentPage: number
  totalRoasts: number
}) {
  const totalPages = Math.ceil(totalRoasts / ITEMS_PER_PAGE)

  if (totalPages <= 1) return null

  return (
    <div className="mx-auto flex w-full max-w-4xl justify-center pt-6">
      <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/leaderboard" />
    </div>
  )
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const params = await searchParams
  const currentPage = Math.max(1, Number(params.page) || 1)
  const trpc = await getCaller()
  const { data: pageData, dbOffline: pageDbOffline } = await trpc.leaderboard.getPage({
    page: currentPage
  })

  const totalRoasts = pageData.stats.total ?? 0
  const avgScore = pageData.stats.avgScore ? Number(pageData.stats.avgScore).toFixed(1) : null

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

          <LeaderboardStats totalRoasts={totalRoasts} avgScore={avgScore} />
        </div>

        <LeaderboardTable
          currentPage={currentPage}
          rows={pageData.rows}
          dbOffline={pageDbOffline}
        />

        <PaginationWrapper currentPage={currentPage} totalRoasts={totalRoasts} />

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
