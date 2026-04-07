'use client'

import NumberFlow from '@number-flow/react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTRPC } from '@/trpc/client'

export function StatsFooter() {
  const trpc = useTRPC()
  const { data } = useQuery(trpc.roast.getStats.queryOptions())
  const [animate, setAnimate] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Start animation after mount to ensure we see the transition from 0
  useEffect(() => {
    setHydrated(true)
    const timer = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(timer)
  }, [])

  // Avoid hydration mismatch: server render has no query cache, client might.
  // We intentionally hide the cached values until after mount.
  const total = hydrated ? (data?.total ?? 0) : 0
  const avgScore = hydrated && data?.avgScore ? Number(data.avgScore) : null

  // Show 0 initially, then animate to real values
  const displayTotal = animate ? total : 0
  const displayAvg = animate ? avgScore : 0

  return (
    <div className="flex items-center justify-center gap-6 py-2">
      <span className="font-mono text-xs text-zinc-600">
        {total > 0 ? (
          <>
            <NumberFlow value={displayTotal} /> codes roasted
          </>
        ) : (
          'be the first to get roasted'
        )}
      </span>
      {avgScore !== null && (
        <>
          <span className="font-mono text-xs text-zinc-600">·</span>
          <span className="font-mono text-xs text-zinc-600">
            avg score:{' '}
            <NumberFlow
              value={displayAvg ?? 0}
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            />
            /10
          </span>
        </>
      )}
    </div>
  )
}
