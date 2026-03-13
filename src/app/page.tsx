import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LeaderboardRow } from '@/components/ui/leaderboard-row'
import { Toggle } from '@/components/ui/toggle'

const SAMPLE_CODE = `function calculateTotal(items) {
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

const PREVIEW_ENTRIES = [
  {
    rank: 1,
    score: 1.2,
    codePreview: "eval(prompt('Enter code:'));\ndataset.with.malware;\n// trust the user bro",
    lang: 'javascript'
  },
  {
    rank: 2,
    score: 1.8,
    codePreview:
      'if (a == true) { return true; }\nelse if (a == false) { return false; }\nelse { return false; }',
    lang: 'typescript'
  },
  {
    rank: 3,
    score: 2.1,
    codePreview: '$obj2r = $obj5 * @NUMS $6&1\n// TODO: add authentication',
    lang: 'sql'
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Main Content */}
      <main className="flex flex-col gap-8 px-10 pt-20">
        {/* Hero */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="font-bold font-mono text-4xl text-emerald-500">$</span>
              <h1 className="font-bold font-mono text-4xl text-zinc-100">
                paste your code. get roasted.
              </h1>
            </div>
            <p className="font-mono text-sm text-zinc-500">
              {"// drop your code below and we'll rate it — brutally honest or full roast mode"}
            </p>
          </div>
        </div>

        {/* Code Editor */}
        <div className="mx-auto flex w-full max-w-[780px] flex-col">
          {/* Code input box */}
          <div className="flex flex-col border border-[#2A2A2A] bg-[#111111]">
            {/* Window header */}
            <div className="flex h-10 items-center gap-3 border-[#2A2A2A] border-b px-4">
              <span className="size-[10px] rounded-full bg-red-500" />
              <span className="size-[10px] rounded-full bg-amber-500" />
              <span className="size-[10px] rounded-full bg-emerald-500" />
            </div>

            {/* Textarea */}
            <div className="flex" style={{ height: 360 }}>
              {/* Line numbers */}
              <div className="flex flex-col gap-0 border-[#2A2A2A] border-r bg-[#0F0F0F] px-3 py-3">
                {SAMPLE_CODE.split('\n').map((_, i) => (
                  <span
                    key={i}
                    className="min-w-[20px] text-right font-mono text-xs text-zinc-600 leading-5"
                  >
                    {i + 1}
                  </span>
                ))}
              </div>

              {/* Code area */}
              <textarea
                className="flex-1 resize-none bg-transparent px-4 py-3 font-mono text-xs text-zinc-300 leading-5 outline-none placeholder:text-zinc-600"
                defaultValue={SAMPLE_CODE}
                spellCheck={false}
                aria-label="Paste your code here"
              />
            </div>
          </div>

          {/* Actions bar */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Toggle defaultChecked={true} label="roast code" />
              <span className="font-mono text-xs text-zinc-600">
                {'// maximum villainy enabled'}
              </span>
            </div>
            <Button variant="primary" size="md">
              $ roast my code
            </Button>
          </div>
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-center gap-6 py-2">
          <span className="font-mono text-xs text-zinc-600">2,847 codes roasted</span>
          <span className="font-mono text-xs text-zinc-600">·</span>
          <span className="font-mono text-xs text-zinc-600">avg score: 4.2/10</span>
        </div>

        {/* Spacer */}
        <div className="h-8" />

        {/* Leaderboard Preview */}
        <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6">
          {/* Title row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-bold font-mono text-emerald-500 text-sm">{'// '}</span>
              <span className="font-bold font-mono text-sm text-zinc-100">shame_leaderboard</span>
            </div>
            <Link href="/leaderboard">
              <Button variant="ghost" size="sm">
                $ show all →
              </Button>
            </Link>
          </div>

          <p className="font-mono text-xs text-zinc-600">
            {'// the worst code on the internet, ranked by shame'}
          </p>

          {/* Table */}
          <div className="flex flex-col border border-[#2A2A2A]">
            {/* Header */}
            <div className="flex items-center gap-6 border-[#2A2A2A] border-b px-5 py-3">
              <span className="w-10 shrink-0 font-mono text-xs text-zinc-600">#</span>
              <span className="w-14 shrink-0 font-mono text-xs text-zinc-600">score</span>
              <span className="flex-1 font-mono text-xs text-zinc-600">code</span>
              <span className="w-24 shrink-0 text-right font-mono text-xs text-zinc-600">lang</span>
            </div>

            {PREVIEW_ENTRIES.map((entry) => (
              <LeaderboardRow
                key={entry.rank}
                rank={entry.rank}
                score={entry.score}
                codePreview={entry.codePreview}
                lang={entry.lang}
              />
            ))}
          </div>

          {/* Fade hint */}
          <div className="flex items-center justify-center py-2">
            <span className="font-mono text-xs text-zinc-600">
              {'// showing 3 of 2,847 · visit full leaderboard ↓'}
            </span>
          </div>
        </div>

        <div className="h-16" />
      </main>
    </div>
  )
}
