import { tv } from 'tailwind-variants'
import { Badge } from './badge'

const analysisCard = tv({
  base: 'flex flex-col gap-3 border border-[#2A2A2A] p-5'
})

type Severity = 'critical' | 'warning' | 'good'

type AnalysisCardProps = {
  severity: Severity
  title: string
  description: string
  className?: string
}

export function AnalysisCard({ severity, title, description, className }: AnalysisCardProps) {
  return (
    <div className={analysisCard({ className })}>
      <Badge variant={severity} label={severity} />
      <p className="font-mono text-sm text-zinc-100">{title}</p>
      <p className="font-mono text-xs text-zinc-500 leading-relaxed">{description}</p>
    </div>
  )
}
