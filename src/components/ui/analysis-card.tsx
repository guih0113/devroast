import type { ComponentProps } from 'react'
import { tv } from 'tailwind-variants'
import { Badge } from './badge'

const analysisCard = tv({
  base: 'flex flex-col gap-3 border border-[#2A2A2A] p-5'
})

type Severity = 'critical' | 'warning' | 'good'

function Root({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div className={analysisCard({ className })} {...props}>
      {children}
    </div>
  )
}

function AnalysisCardBadge({ variant }: { variant: Severity }) {
  return <Badge variant={variant} label={variant} />
}

function Title({ children, ...props }: ComponentProps<'p'>) {
  return (
    <p className="font-mono text-sm text-zinc-100" {...props}>
      {children}
    </p>
  )
}

function Description({ children, ...props }: ComponentProps<'p'>) {
  return (
    <p className="font-mono text-xs text-zinc-500 leading-relaxed" {...props}>
      {children}
    </p>
  )
}

export const AnalysisCard = {
  Root,
  Badge: AnalysisCardBadge,
  Title,
  Description
}
