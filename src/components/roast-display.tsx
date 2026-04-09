import { AnalysisCard } from '@/components/ui/analysis-card'
import { Button } from '@/components/ui/button'
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

export function RoastHero({
  roast,
  isLoading = false
}: Pick<RoastDisplayProps, 'roast' | 'isLoading'>) {
  const score = roast.score ? Number(roast.score) : undefined
  const verdict = score !== undefined ? getVerdict(score) : null
  const lineCount = roast.code ? roast.code.replace(/\r\n?/g, '\n').split('\n').length : null
  const verdictTextClass =
    verdict?.color === 'accent-red'
      ? 'text-red-500'
      : verdict?.color === 'accent-amber'
        ? 'text-amber-500'
        : verdict?.color === 'accent-green'
          ? 'text-emerald-500'
          : 'text-zinc-500'

  const verdictDotClass =
    verdict?.color === 'accent-red'
      ? 'bg-red-500'
      : verdict?.color === 'accent-amber'
        ? 'bg-amber-500'
        : verdict?.color === 'accent-green'
          ? 'bg-emerald-500'
          : 'bg-zinc-500'

  return (
    <div className="flex flex-col items-start gap-10 md:flex-row md:items-center md:gap-12">
      {score !== undefined ? <ScoreRing score={score} /> : <ScoreRingSkeleton />}

      <div className="flex flex-col gap-4">
        {verdict && (
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${verdictDotClass}`} />
            <span className={`font-medium font-mono text-xs ${verdictTextClass}`}>
              verdict: {verdict.label}
            </span>
          </div>
        )}

        {roast.roastQuote ? (
          <blockquote className="max-w-xl font-bold font-mono text-xl text-zinc-100 leading-snug">
            &ldquo;{roast.roastQuote}&rdquo;
          </blockquote>
        ) : isLoading ? (
          <QuoteSkeleton />
        ) : null}

        {(roast.lang || lineCount !== null) && (
          <div className="flex items-center gap-4 font-mono text-xs text-zinc-600">
            {roast.lang && <span>lang: {roast.lang}</span>}
            {roast.lang && lineCount !== null && <span>·</span>}
            {lineCount !== null && <span>{lineCount} lines</span>}
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          type="button"
          disabled
          className="border border-zinc-800 px-4 py-2 text-zinc-100 hover:bg-zinc-900"
        >
          $ share_roast
        </Button>
      </div>
    </div>
  )
}

export function RoastAnalysisSection({
  items = [],
  isLoading = false
}: Pick<RoastDisplayProps, 'items' | 'isLoading'>) {
  const itemRows: (typeof items)[] = []
  for (let i = 0; i < items.length; i += 2) {
    itemRows.push(items.slice(i, i + 2))
  }

  if (items.length === 0 && !isLoading) return null

  return (
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
  )
}

export function RoastDiffSection({
  diff = [],
  fileName,
  language,
  isLoading = false
}: {
  diff?: NonNullable<Roast['diff']>
  fileName?: string
  language?: Roast['lang']
  isLoading?: boolean
}) {
  if ((!diff || diff.length === 0) && !isLoading) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <span className="font-bold font-mono text-emerald-500 text-sm">{'// '}</span>
        <span className="font-bold font-mono text-sm text-zinc-100">suggested_fix</span>
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900" />
      ) : (
        <DiffLine diff={diff} fileName={fileName ?? 'submission'} language={language} />
      )}
    </div>
  )
}

export function RoastDisplay({ roast, items = [], isLoading = false }: RoastDisplayProps) {
  return (
    <div className="flex flex-col gap-10">
      <RoastHero roast={roast} isLoading={isLoading} />
      {(items.length > 0 || isLoading) && (
        <>
          <div className="h-px bg-zinc-800" />
          <RoastAnalysisSection items={items} isLoading={isLoading} />
        </>
      )}

      {(roast.diff ?? []).length > 0 && (
        <>
          <div className="h-px bg-zinc-800" />
          <RoastDiffSection
            diff={roast.diff ?? []}
            fileName={roast.fileName ?? 'submission'}
            language={roast.lang}
          />
        </>
      )}
    </div>
  )
}
