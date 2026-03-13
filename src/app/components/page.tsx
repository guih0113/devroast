import { AnalysisCard } from '@/components/ui/analysis-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/ui/code-block'
import { DiffLine } from '@/components/ui/diff-line'
import { LeaderboardRow } from '@/components/ui/leaderboard-row'
import { ScoreRing } from '@/components/ui/score-ring'
import { Toggle } from '@/components/ui/toggle'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <span className="font-bold font-mono text-emerald-500 text-sm">{'// '}</span>
        <span className="font-bold font-mono text-sm text-zinc-100">{title}</span>
      </div>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-xs text-zinc-500">{label}</span>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  )
}

const SAMPLE_CODE = `function roast(code) {
  const score = analyze(code)
  return score
}`

export default function ComponentsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] px-20 py-16">
      <div className="flex max-w-4xl flex-col gap-16">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="font-bold font-mono text-2xl text-zinc-100">component_library</h1>
          <p className="font-sans text-sm text-zinc-500">
            {'// visual reference for all ui components and their variants'}
          </p>
        </div>

        {/* Button */}
        <Section title="button">
          <Row label="variant">
            <Button variant="primary">$ primary</Button>
            <Button variant="secondary">$ secondary</Button>
            <Button variant="ghost">$ ghost</Button>
            <Button variant="danger">$ danger</Button>
          </Row>
          <Row label="size">
            <Button size="sm">$ small</Button>
            <Button size="md">$ medium</Button>
            <Button size="lg">$ large</Button>
          </Row>
          <Row label="disabled">
            <Button variant="primary" disabled>
              $ primary
            </Button>
            <Button variant="secondary" disabled>
              $ secondary
            </Button>
            <Button variant="ghost" disabled>
              $ ghost
            </Button>
            <Button variant="danger" disabled>
              $ danger
            </Button>
          </Row>
        </Section>

        {/* Badge */}
        <Section title="badge">
          <Row label="variant">
            <Badge variant="critical" label="critical" />
            <Badge variant="warning" label="warning" />
            <Badge variant="good" label="good" />
          </Row>
        </Section>

        {/* Toggle */}
        <Section title="toggle">
          <Row label="checked">
            <Toggle checked={false} label="off state" />
            <Toggle checked={true} label="on state" />
          </Row>
          <Row label="no label">
            <Toggle checked={false} />
            <Toggle checked={true} />
          </Row>
        </Section>

        {/* Analysis Card */}
        <Section title="analysis-card">
          <Row label="severity">
            <AnalysisCard
              severity="critical"
              title="Nested callbacks exceed depth 4"
              description="Deeply nested callbacks make the code hard to read and maintain. Consider extracting logic into named functions or using async/await."
            />
            <AnalysisCard
              severity="warning"
              title="Magic number used in condition"
              description="The value 86400 appears without explanation. Extract it into a named constant like SECONDS_PER_DAY to clarify intent."
            />
            <AnalysisCard
              severity="good"
              title="Pure function with no side effects"
              description="This function is deterministic and has no external dependencies. It is trivially testable and easy to reason about."
            />
          </Row>
        </Section>

        {/* Code Block */}
        <Section title="code-block">
          <Row label="with filename">
            <CodeBlock
              code={SAMPLE_CODE}
              lang="javascript"
              fileName="roast.js"
              className="w-full max-w-lg"
            />
          </Row>
          <Row label="no filename">
            <CodeBlock code={SAMPLE_CODE} lang="javascript" className="w-full max-w-lg" />
          </Row>
        </Section>

        {/* Diff Line */}
        <Section title="diff-line">
          <Row label="variant">
            <div className="flex w-full max-w-lg flex-col border border-[#2A2A2A]">
              <DiffLine variant="removed" code="const result = doThing(x, y, z)" />
              <DiffLine variant="added" code="const result = doThing(x)" />
              <DiffLine variant="context" code="return result" />
            </div>
          </Row>
        </Section>

        {/* Leaderboard Row */}
        <Section title="leaderboard-row">
          <Row label="score levels">
            <div className="flex w-full max-w-2xl flex-col border border-[#2A2A2A]">
              <LeaderboardRow
                rank={1}
                score={1.2}
                codePreview="function authenticate(user, pass) { if (user == 'admin' && pass == 'admin') {"
                lang="javascript"
              />
              <LeaderboardRow
                rank={2}
                score={5.5}
                codePreview="export async function fetchData(url) { const res = await fetch(url); return res.json()"
                lang="typescript"
              />
              <LeaderboardRow
                rank={3}
                score={8.9}
                codePreview="const sum = (a: number, b: number): number => a + b"
                lang="typescript"
              />
            </div>
          </Row>
        </Section>

        {/* Score Ring */}
        <Section title="score-ring">
          <Row label="scores">
            <ScoreRing score={2.3} />
            <ScoreRing score={5.0} />
            <ScoreRing score={8.7} />
          </Row>
        </Section>
      </div>
    </div>
  )
}
