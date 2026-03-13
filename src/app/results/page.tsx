import Link from 'next/link'
import { AnalysisCard } from '@/components/ui/analysis-card'
import { CodeBlock } from '@/components/ui/code-block'
import { DiffLine } from '@/components/ui/diff-line'
import { ScoreRing } from '@/components/ui/score-ring'

const SUBMITTED_CODE = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }

  if (total > 100) {
    console.log("discount applied");
    total = total * 0.9;
  }

  // TODO: handle tax calculation
  // TODO: handle currency conversion
  return total;
}`

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Navbar */}
      <nav className="flex h-14 items-center justify-between border-[#2A2A2A] border-b bg-[#0A0A0A] px-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold font-mono text-emerald-500 text-xl">{'>'}</span>
          <span className="font-medium font-mono text-lg text-zinc-100">devroast</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/leaderboard"
            className="font-mono text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            leaderboard
          </Link>
        </div>
      </nav>

      {/* Results Content */}
      <main className="flex flex-col gap-10 px-20 py-10">
        {/* Score Hero */}
        <div className="flex items-center gap-12">
          <ScoreRing score={3.5} />

          <div className="flex flex-col gap-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-600">
              <Link href="/" className="transition-colors hover:text-zinc-400">
                {'#'} devroast
              </Link>
              <span>/</span>
              <span className="text-zinc-400">results</span>
              <span>/</span>
              <span>calculateTotal_main.js</span>
            </div>

            {/* Roast quote */}
            <blockquote className="max-w-xl font-bold font-mono text-xl text-zinc-100 leading-snug">
              &ldquo;This code looks like it was written during a power outage... in 2005.&rdquo;
            </blockquote>

            {/* Meta */}
            <div className="flex items-center gap-4 font-mono text-xs text-zinc-600">
              <span>{'>'} 15 issues found</span>
              <span>·</span>
              <span>1 error</span>
              <span>·</span>
              <span>$ 4/10/4422</span>
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
          <CodeBlock code={SUBMITTED_CODE} lang="javascript" fileName="calculateTotal_main.js" />
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
            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-5">
              <AnalysisCard.Root>
                <AnalysisCard.Badge variant="critical" />
                <AnalysisCard.Title>Using var instead of const/let</AnalysisCard.Title>
                <AnalysisCard.Description>
                  Using var creates function-scoped variables which leads to hoisting bugs,
                  unintended mutations, and hard-to-trace state. Switch to const by default, let
                  when reassignment is needed.
                </AnalysisCard.Description>
              </AnalysisCard.Root>
              <AnalysisCard.Root>
                <AnalysisCard.Badge variant="warning" />
                <AnalysisCard.Title>Iterator loop pattern</AnalysisCard.Title>
                <AnalysisCard.Description>
                  Old-style for loops with index tracking are verbose and error-prone. Use
                  Array.forEach, map, or for...of for cleaner, intent-revealing iteration.
                </AnalysisCard.Description>
              </AnalysisCard.Root>
            </div>
            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-5">
              <AnalysisCard.Root>
                <AnalysisCard.Badge variant="good" />
                <AnalysisCard.Title>Clear naming conventions</AnalysisCard.Title>
                <AnalysisCard.Description>
                  Function and variable names are descriptive and clearly communicate their purpose.
                  Good naming is the cheapest form of documentation.
                </AnalysisCard.Description>
              </AnalysisCard.Root>
              <AnalysisCard.Root>
                <AnalysisCard.Badge variant="warning" />
                <AnalysisCard.Title>No input visibility</AnalysisCard.Title>
                <AnalysisCard.Description>
                  The function silently ignores invalid inputs — null, undefined, or non-arrays will
                  cause cryptic runtime errors. Add guard clauses or TypeScript types.
                </AnalysisCard.Description>
              </AnalysisCard.Root>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#2A2A2A]" />

        {/* Suggested Fix / Diff Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="font-bold font-mono text-emerald-500 text-sm">{'// '}</span>
            <span className="font-bold font-mono text-sm text-zinc-100">suggested_fix</span>
          </div>

          <div className="flex flex-col border border-[#2A2A2A] bg-[#111111]">
            <DiffLine variant="removed" code="function calculateTotal(items) {" />
            <DiffLine variant="added" code="function calculateTotal(items: Item[]): number {" />
            <DiffLine variant="context" code="  let total = 0;" />
            <DiffLine variant="removed" code="  for (let i = 0; i < items.length; i++) {" />
            <DiffLine variant="removed" code="    total = total + items[i].price;" />
            <DiffLine variant="removed" code="  }" />
            <DiffLine
              variant="added"
              code="  const total = items.reduce((sum, item) => sum + item.price, 0)"
            />
            <DiffLine variant="context" code="" />
            <DiffLine variant="removed" code="  if (total > 100) {" />
            <DiffLine variant="removed" code='    console.log("discount applied");' />
            <DiffLine variant="removed" code="    total = total * 0.9;" />
            <DiffLine variant="removed" code="  }" />
            <DiffLine
              variant="added"
              code="  const discounted = total > 100 ? total * 0.9 : total"
            />
            <DiffLine variant="context" code="" />
            <DiffLine variant="removed" code="  return total;" />
            <DiffLine variant="added" code="  return discounted" />
            <DiffLine variant="context" code="}" />
          </div>
        </div>
      </main>
    </div>
  )
}
