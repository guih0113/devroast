import type { BundledLanguage } from 'shiki'
import { LeaderboardCodeRow } from '@/app/_components/leaderboard-code-row'
import { getCaller } from '@/trpc/server'

export async function LeaderboardPreview() {
  const trpc = await getCaller()
  const previewEntries = await trpc.leaderboard.getPreview()

  return (
    <div className="flex flex-col border border-zinc-800">
      <div className="flex items-center gap-6 border-zinc-800 border-b px-5 py-3">
        <span className="w-10 shrink-0 font-mono text-xs text-zinc-600">#</span>
        <span className="w-14 shrink-0 font-mono text-xs text-zinc-600">score</span>
        <span className="flex-1 font-mono text-xs text-zinc-600">code</span>
        <span className="w-24 shrink-0 text-right font-mono text-xs text-zinc-600">lang</span>
      </div>

      {previewEntries.data.length === 0 ? (
        <div className="px-5 py-8 text-center font-mono text-xs text-zinc-600">
          {'// no roasts yet — be the first'}
        </div>
      ) : (
        previewEntries.data.map((entry) => (
          <LeaderboardCodeRow
            key={entry.rank}
            rank={entry.rank}
            score={entry.score}
            code={entry.code}
            lang={entry.lang as BundledLanguage}
          />
        ))
      )}
    </div>
  )
}
