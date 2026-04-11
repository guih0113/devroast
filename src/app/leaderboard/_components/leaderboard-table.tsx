import Link from 'next/link'
import { LeaderboardRow } from '@/components/ui/leaderboard-row'
import { ITEMS_PER_PAGE } from '@/trpc/routers/leaderboard'

type LeaderboardTableRow = {
  id: string
  score: string | null
  code: string
  lang: string
  roastCount: number
}

type Props = {
  currentPage: number
  rows: LeaderboardTableRow[]
  dbOffline: boolean
}

export function LeaderboardTable({ currentPage, rows, dbOffline }: Props) {
  const startRank = (currentPage - 1) * ITEMS_PER_PAGE + 1

  return (
    <>
      <div className="mx-auto flex w-full max-w-4xl flex-col">
        <div className="flex flex-col border border-zinc-800">
          <div className="flex items-center gap-6 border-zinc-800 border-b px-5 py-3">
            <span className="w-10 shrink-0 font-mono text-xs text-zinc-600">#</span>
            <span className="w-14 shrink-0 font-mono text-xs text-zinc-600">score</span>
            <span className="flex-1 font-mono text-xs text-zinc-600">code</span>
            <span className="w-16 shrink-0 text-right font-mono text-xs text-zinc-600">roasts</span>
            <span className="w-24 shrink-0 text-right font-mono text-xs text-zinc-600">lang</span>
          </div>

          {rows.length === 0 ? (
            <div className="px-5 py-12 text-center font-mono text-xs text-zinc-600">
              {'// no submissions yet — be the first to get roasted'}
            </div>
          ) : (
            rows.map((entry, idx) => (
              <Link key={entry.id} href={`/roast/${entry.id}`} className="group">
                <div className="flex items-center gap-6 border-zinc-800 border-b px-5 py-4 transition-colors group-hover:bg-zinc-900">
                  <LeaderboardRow.Rank rank={startRank + idx} />
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
    </>
  )
}
