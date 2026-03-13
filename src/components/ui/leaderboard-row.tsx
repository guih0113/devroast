import { tv } from 'tailwind-variants'

const leaderboardRow = tv({
  slots: {
    root: 'flex items-center gap-6 border-b border-[#2A2A2A] px-5 py-4',
    rank: 'font-mono text-sm text-zinc-500 w-10 shrink-0',
    score: 'font-mono text-sm font-bold w-14 shrink-0',
    codePreview: 'font-mono text-xs text-zinc-500 flex-1 truncate',
    lang: 'font-mono text-xs text-zinc-600 w-24 shrink-0 text-right'
  },
  variants: {
    scoreLevel: {
      critical: { score: 'font-mono text-sm font-bold w-14 shrink-0 text-red-500' },
      warning: { score: 'font-mono text-sm font-bold w-14 shrink-0 text-amber-500' },
      good: { score: 'font-mono text-sm font-bold w-14 shrink-0 text-emerald-500' }
    }
  },
  defaultVariants: {
    scoreLevel: 'critical'
  }
})

type LeaderboardRowProps = {
  rank: number
  score: number
  codePreview: string
  lang: string
  className?: string
}

function getScoreLevel(score: number): 'critical' | 'warning' | 'good' {
  if (score <= 4) return 'critical'
  if (score <= 7) return 'warning'
  return 'good'
}

export function LeaderboardRow({ rank, score, codePreview, lang, className }: LeaderboardRowProps) {
  const scoreLevel = getScoreLevel(score)
  const {
    root,
    rank: rankClass,
    score: scoreClass,
    codePreview: codeClass,
    lang: langClass
  } = leaderboardRow({ scoreLevel })

  return (
    <div className={root({ className })}>
      <span className={rankClass()}>#{rank}</span>
      <span className={scoreClass()}>{score.toFixed(1)}</span>
      <span className={codeClass()}>{codePreview}</span>
      <span className={langClass()}>{lang}</span>
    </div>
  )
}
