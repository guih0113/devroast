import { asc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { BundledLanguage } from 'shiki'
import { AnalysisCard } from '@/components/ui/analysis-card'
import { CodeBlock } from '@/components/ui/code-block'
import { DiffLine } from '@/components/ui/diff-line'
import { ScoreRing } from '@/components/ui/score-ring'
import { db } from '@/db'
import { analysisItems, roasts } from '@/db/schema'
import { getVerdict } from '@/lib/score'

type Props = {
  searchParams: Promise<{ id?: string }>
}

async function getResult(id: string) {
  const [roast] = await db.select().from(roasts).where(eq(roasts.id, id)).limit(1)

  if (!roast) return null

  const items = await db
    .select()
    .from(analysisItems)
    .where(eq(analysisItems.roastId, id))
    .orderBy(asc(analysisItems.position))

  return { roast, items }
}

export default async function ResultsPage({ searchParams }: Props) {
  const { id } = await searchParams

  if (!id) notFound()

  const result = await getResult(id)

  if (!result) notFound()

  const { roast, items } = result
  const score = Number(roast.score)
  const verdict = getVerdict(score)
  const diff = roast.diff ?? []

  // Pair analysis items into rows of 2
  const itemRows: (typeof items)[] = []
  for (let i = 0; i < items.length; i += 2) {
    itemRows.push(items.slice(i, i + 2))
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Results Content */}
      <main className="flex flex-col gap-10 px-20 py-10">
        {/* Score Hero */}
        <div className="flex items-center gap-12">
          <ScoreRing score={score} />

          <div className="flex flex-col gap-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-600">
              <Link href="/" className="transition-colors hover:text-zinc-400">
                {'#'} devroast
              </Link>
              <span>/</span>
              <span className="text-zinc-400">results</span>
              <span>/</span>
              <span>{roast.fileName ?? 'submission'}</span>
            </div>

            {/* Verdict */}
            <div className="font-mono text-xs text-zinc-500">{verdict.label}</div>

            {/* Roast quote */}
            <blockquote className="max-w-xl font-bold font-mono text-xl text-zinc-100 leading-snug">
              &ldquo;{roast.roastQuote}&rdquo;
            </blockquote>

            {/* Meta */}
            <div className="flex items-center gap-4 font-mono text-xs text-zinc-600">
              <span>
                {'>'} {roast.issuesFound} issues found
              </span>
              <span>·</span>
              <span>
                {roast.errors} error{roast.errors !== 1 ? 's' : ''}
              </span>
              <span>·</span>
              <span>$ {new Date(roast.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#2A2A2A]" />

        {/* Submitted Code Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold font-mono text-emerald-500 text-sm">{'// '}</span>
            <span className="font-bold font-mono text-sm text-zinc-100">your_submission</span>
          </div>
          <CodeBlock
            code={roast.code}
            lang={roast.lang as BundledLanguage}
            fileName={roast.fileName ?? undefined}
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-[#2A2A2A]" />

        {/* Detailed Analysis Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="font-bold font-mono text-emerald-500 text-sm">{'// '}</span>
            <span className="font-bold font-mono text-sm text-zinc-100">detailed_analysis</span>
          </div>

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
        </div>

        {/* Divider */}
        <div className="h-px bg-[#2A2A2A]" />

        {/* Suggested Fix / Diff Section */}
        {diff.length > 0 && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <span className="font-bold font-mono text-emerald-500 text-sm">{'// '}</span>
              <span className="font-bold font-mono text-sm text-zinc-100">suggested_fix</span>
            </div>

            <div className="flex flex-col border border-[#2A2A2A] bg-[#111111]">
              {diff.map((line, i) => (
                <DiffLine key={i} variant={line.variant} code={line.code} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
