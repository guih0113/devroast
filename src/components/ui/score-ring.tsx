import { twMerge } from 'tailwind-merge'

const SIZE = 180
const STROKE = 4
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type ScoreRingProps = {
  score: number
  maxScore?: number
  className?: string
}

export function ScoreRing({ score, maxScore = 10, className }: ScoreRingProps) {
  const pct = Math.min(Math.max(score / maxScore, 0), 1)
  const dashArray = CIRCUMFERENCE
  const dashOffset = CIRCUMFERENCE * (1 - pct)

  return (
    <div
      className={twMerge('relative inline-flex items-center justify-center', className)}
      style={{ width: SIZE, height: SIZE }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#2A2A2A"
          strokeWidth={STROKE}
        />

        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="url(#score-gradient)"
          strokeWidth={STROKE}
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          strokeLinecap="butt"
        />
      </svg>

      <div className="relative flex flex-col items-center gap-0.5 leading-none">
        <span className="font-bold font-mono text-5xl text-zinc-100 leading-none">
          {score.toFixed(1)}
        </span>
        <span className="font-mono text-sm text-zinc-600 leading-none">/10</span>
      </div>
    </div>
  )
}
