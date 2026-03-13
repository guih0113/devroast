import type { ComponentProps } from 'react'
import { tv } from 'tailwind-variants'

const styles = tv({
  slots: {
    root: 'flex items-center gap-6 border-b border-[#2A2A2A] px-5 py-4',
    rank: 'w-10 shrink-0 font-mono text-sm text-zinc-500',
    codePreview: 'flex-1 truncate font-mono text-xs text-zinc-500',
    lang: 'w-24 shrink-0 text-right font-mono text-xs text-zinc-600'
  },
  variants: {
    scoreLevel: {
      critical: { root: '' },
      warning: { root: '' },
      good: { root: '' }
    }
  }
})

const scoreStyles = tv({
  base: 'w-14 shrink-0 font-mono text-sm font-bold',
  variants: {
    level: {
      critical: 'text-red-500',
      warning: 'text-amber-500',
      good: 'text-emerald-500'
    }
  },
  defaultVariants: {
    level: 'critical'
  }
})

function getScoreLevel(score: number): 'critical' | 'warning' | 'good' {
  if (score <= 4) return 'critical'
  if (score <= 7) return 'warning'
  return 'good'
}

function Root({ className, children, ...props }: ComponentProps<'div'>) {
  const { root } = styles()
  return (
    <div className={root({ className })} {...props}>
      {children}
    </div>
  )
}

function Rank({ rank, ...props }: { rank: number } & ComponentProps<'span'>) {
  const { rank: rankClass } = styles()
  return (
    <span className={rankClass()} {...props}>
      #{rank}
    </span>
  )
}

function Score({ score, ...props }: { score: number } & ComponentProps<'span'>) {
  const level = getScoreLevel(score)
  return (
    <span className={scoreStyles({ level })} {...props}>
      {score.toFixed(1)}
    </span>
  )
}

function CodePreview({ children, ...props }: ComponentProps<'span'>) {
  const { codePreview } = styles()
  return (
    <span className={codePreview()} {...props}>
      {children}
    </span>
  )
}

function Lang({ children, ...props }: ComponentProps<'span'>) {
  const { lang } = styles()
  return (
    <span className={lang()} {...props}>
      {children}
    </span>
  )
}

export const LeaderboardRow = {
  Root,
  Rank,
  Score,
  CodePreview,
  Lang
}
