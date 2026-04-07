import { Suspense } from 'react'
import { AnalysisCard } from '@/components/ui/analysis-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DiffLine } from '@/components/ui/diff-line'
import { LeaderboardRow } from '@/components/ui/leaderboard-row'
import { ScoreRing } from '@/components/ui/score-ring'
import { Toggle } from '@/components/ui/toggle'
import { CodeEditorReadOnlyShowcase, CodeEditorShowcase } from './code-editor-showcase'

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

const _SAMPLE_CODE = `function roast(code) {
  const score = analyze(code)
  return score
}`

export default function ComponentsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-20 py-16">
      <div className="flex max-w-4xl flex-col gap-16">
        <div className="flex flex-col gap-2">
          <h1 className="font-bold font-mono text-2xl text-zinc-100">component_library</h1>
          <p className="font-sans text-sm text-zinc-500">
            {'// visual reference for all ui components and their variants'}
          </p>
        </div>

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

        <Section title="badge">
          <Row label="variant">
            <Badge variant="critical" label="critical" />
            <Badge variant="warning" label="warning" />
            <Badge variant="good" label="good" />
          </Row>
        </Section>

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

        <Section title="code-editor">
          <Row label="default (auto-detect language)">
            <div className="w-full max-w-2xl">
              <Suspense fallback={<div className="h-48 animate-pulse rounded bg-zinc-800" />}>
                <CodeEditorShowcase />
              </Suspense>
            </div>
          </Row>
        </Section>

        <Section title="analysis-card">
          <Row label="severity">
            <AnalysisCard.Root>
              <AnalysisCard.Badge variant="critical" />
              <AnalysisCard.Title>Nested callbacks exceed depth 4</AnalysisCard.Title>
              <AnalysisCard.Description>
                Deeply nested callbacks make the code hard to read and maintain. Consider extracting
                logic into named functions or using async/await.
              </AnalysisCard.Description>
            </AnalysisCard.Root>
            <AnalysisCard.Root>
              <AnalysisCard.Badge variant="warning" />
              <AnalysisCard.Title>Magic number used in condition</AnalysisCard.Title>
              <AnalysisCard.Description>
                The value 86400 appears without explanation. Extract it into a named constant like
                SECONDS_PER_DAY to clarify intent.
              </AnalysisCard.Description>
            </AnalysisCard.Root>
            <AnalysisCard.Root>
              <AnalysisCard.Badge variant="good" />
              <AnalysisCard.Title>Pure function with no side effects</AnalysisCard.Title>
              <AnalysisCard.Description>
                This function is deterministic and has no external dependencies. It is trivially
                testable and easy to reason about.
              </AnalysisCard.Description>
            </AnalysisCard.Root>
          </Row>
        </Section>

        <Section title="code-editor (read-only)">
          <Row label="with fixed language">
            <div className="w-full max-w-lg">
              <Suspense fallback={<div className="h-48 animate-pulse rounded bg-zinc-800" />}>
                <CodeEditorReadOnlyShowcase />
              </Suspense>
            </div>
          </Row>
        </Section>

        <Section title="diff-line">
          <Row label="variant">
            <div className="flex w-full max-w-lg flex-col border border-zinc-800">
              <DiffLine variant="removed" code="const result = doThing(x, y, z)" />
              <DiffLine variant="added" code="const result = doThing(x)" />
              <DiffLine variant="context" code="return result" />
            </div>
          </Row>
        </Section>

        <Section title="leaderboard-row">
          <Row label="score levels">
            <div className="flex w-full max-w-2xl flex-col border border-zinc-800">
              <LeaderboardRow.Root>
                <LeaderboardRow.Rank rank={1} />
                <LeaderboardRow.Score score={1.2} />
                <LeaderboardRow.CodePreview>
                  {"function authenticate(user, pass) { if (user == 'admin' && pass == 'admin') {"}
                </LeaderboardRow.CodePreview>
                <LeaderboardRow.Lang>javascript</LeaderboardRow.Lang>
              </LeaderboardRow.Root>
              <LeaderboardRow.Root>
                <LeaderboardRow.Rank rank={2} />
                <LeaderboardRow.Score score={5.5} />
                <LeaderboardRow.CodePreview>
                  {
                    'export async function fetchData(url) { const res = await fetch(url); return res.json()'
                  }
                </LeaderboardRow.CodePreview>
                <LeaderboardRow.Lang>typescript</LeaderboardRow.Lang>
              </LeaderboardRow.Root>
              <LeaderboardRow.Root>
                <LeaderboardRow.Rank rank={3} />
                <LeaderboardRow.Score score={8.9} />
                <LeaderboardRow.CodePreview>
                  {'const sum = (a: number, b: number): number => a + b'}
                </LeaderboardRow.CodePreview>
                <LeaderboardRow.Lang>typescript</LeaderboardRow.Lang>
              </LeaderboardRow.Root>
            </div>
          </Row>
        </Section>

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
