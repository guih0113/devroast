import { AnalysisCard } from '@/components/ui/analysis-card'
import { DiffLine } from '@/components/ui/diff-line'
import { ScoreRing } from '@/components/ui/score-ring'
import type { AnalysisItem, Roast } from '@/db/schema'
import { getVerdict } from '@/lib/score'

function ScoreRingSkeleton() {
  return (
    <div className="flex h-48 w-48 items-center justify-center">
      <div className="h-40 w-40 animate-pulse rounded-full bg-zinc-800" />
    </div>
  )
}

function QuoteSkeleton() {
  return (
    <div className="max-w-xl space-y-3">
      <div className="h-6 w-3/4 animate-pulse rounded bg-zinc-800" />
      <div className="h-6 w-full animate-pulse rounded bg-zinc-800" />
      <div className="h-6 w-2/3 animate-pulse rounded bg-zinc-800" />
    </div>
  )
}

function CardsSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {[1, 2].map((row) => (
        <div key={row} className="grid grid-cols-2 gap-5">
          {[1, 2].map((col) => (
            <div key={col} className="h-32 animate-pulse rounded-lg bg-zinc-800" />
          ))}
        </div>
      ))}
    </div>
  )
}

interface RoastDisplayProps {
  roast: Partial<Roast>
  items?: AnalysisItem[]
  isLoading?: boolean
}

export function RoastDisplay({ roast, items = [], isLoading = false }: RoastDisplayProps) {
  const score = roast.score ? Number(roast.score) : undefined
  const verdict = score !== undefined ? getVerdict(score) : null
  const diff = roast.diff ?? []

  const itemRows: (typeof items)[] = []
  for (let i = 0; i < items.length; i += 2) {
    itemRows.push(items.slice(i, i + 2))
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Score and Quote Section */}
      <div className="flex items-center gap-12">
        {score !== undefined ? <ScoreRing score={score} /> : <ScoreRingSkeleton />}

        <div className="flex flex-col gap-4">
          {roast.fileName && (
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-600">
              <span className="text-zinc-400">results</span>
              <span>/</span>
              <span>{roast.fileName}</span>
            </div>
          )}

          {verdict && <div className="font-mono text-xs text-zinc-500">{verdict.label}</div>}

          {roast.roastQuote ? (
            <blockquote className="max-w-xl font-bold font-mono text-xl text-zinc-100 leading-snug">
              &ldquo;{roast.roastQuote}&rdquo;
            </blockquote>
          ) : isLoading ? (
            <QuoteSkeleton />
          ) : null}

          {(roast.issuesFound !== undefined || roast.errors !== undefined || roast.createdAt) && (
            <div className="flex items-center gap-4 font-mono text-xs text-zinc-600">
              {roast.issuesFound !== undefined && (
                <>
                  <span>
                    {'>'} {roast.issuesFound} issues found
                  </span>
                  <span>·</span>
                </>
              )}
              {roast.errors !== undefined && (
                <>
                  <span>
                    {roast.errors} error{roast.errors !== 1 ? 's' : ''}
                  </span>
                  <span>·</span>
                </>
              )}
              {roast.createdAt && (
                <span suppressHydrationWarning>
                  $ {new Date(roast.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Analysis Cards Section */}
      {(items.length > 0 || isLoading) && (
        <>
          <div className="h-px bg-zinc-800" />

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <span className="font-bold font-mono text-emerald-500 text-sm">{'// '}</span>
              <span className="font-bold font-mono text-sm text-zinc-100">detailed_analysis</span>
            </div>

            {items.length > 0 ? (
              <div className="flex flex-col gap-5">
                {itemRows.map((row, rowIdx) => (
                  <div key={rowIdx} className="grid grid-cols-2 gap-5">
                    {row.map((item) => (
                      <AnalysisCard.Root key={item.id}>
                        <AnalysisCard.Badge variant={item.severity} />
                        <AnalysisCard.Title>{item.title}</AnalysisCard.Title>
                        <AnalysisCard.Description>{item.description}</AnalysisCard.Description>
                      </AnalysisCard.Root>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <CardsSkeleton />
            )}
          </div>
        </>
      )}

      {/* Diff Section */}
      {diff.length > 0 && (
        <>
          <div className="h-px bg-zinc-800" />

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <span className="font-bold font-mono text-emerald-500 text-sm">{'// '}</span>
              <span className="font-bold font-mono text-sm text-zinc-100">suggested_fix</span>
            </div>

            <div className="flex flex-col border border-zinc-800 bg-zinc-900">
              {diff.map((line, i) => (
                <DiffLine key={i} variant={line.variant} code={line.code} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
