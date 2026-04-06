import { asc } from 'drizzle-orm'
import type { BundledLanguage } from 'shiki'
import { LeaderboardCodeRow } from '@/app/_components/leaderboard-code-row'
import { db } from '@/db'
import { withDatabaseStatus } from '@/db/error-handler'
import { roasts } from '@/db/schema'

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
        code: r.code,
        lang: r.lang as BundledLanguage
      }))
    },
    [],
    { log: false }
  )
}

export async function LeaderboardPreview() {
  const previewEntries = await getPreviewEntries()

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
            lang={entry.lang}
          />
        ))
      )}
    </div>
  )
}
