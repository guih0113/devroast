'use client'

import { readStreamableValue } from '@ai-sdk/rsc'
import { useEffect, useState } from 'react'
import { generateRoast } from '@/actions/generate-roast'
import { RoastDisplay } from '@/components/roast-display'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { AnalysisItem, Roast } from '@/db/schema'

interface StreamCard {
  severity: 'critical' | 'warning' | 'good'
  title: string
  description: string
}

interface RoastViewerProps {
  roast: Roast
  items: AnalysisItem[]
}

export function RoastViewer({ roast: initialRoast, items: initialItems }: RoastViewerProps) {
  const [roast, setRoast] = useState<Partial<Roast>>(initialRoast)
  const [items, setItems] = useState<AnalysisItem[]>(initialItems)
  const [isGenerating, setIsGenerating] = useState(initialRoast.status === 'pending')
  const [error, setError] = useState<string | null>(
    initialRoast.status === 'failed' ? 'Generation failed. Please try again.' : null
  )

  async function startGeneration() {
    setError(null)
    setIsGenerating(true)

    try {
      const stream = await generateRoast({
        id: initialRoast.id,
        code: initialRoast.code,
        lang: initialRoast.lang,
        roastMode: initialRoast.roastMode
      })

      for await (const partial of readStreamableValue(stream)) {
        if (partial) {
          setRoast((prev) => ({ ...prev, ...partial }))

          // Update items as they stream in
          if (partial.cards) {
            setItems(
              partial.cards.map((card: StreamCard, i: number) => ({
                id: `temp-${i}`,
                roastId: initialRoast.id,
                severity: card.severity,
                title: card.title,
                description: card.description,
                position: i
              }))
            )
          }
        }
      }

      setIsGenerating(false)

      // Reload page to get final DB state with proper IDs
      window.location.reload()
    } catch (err) {
      console.error('Error generating roast:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (initialRoast.status === 'pending') {
      startGeneration()
    }
  }, [initialRoast.status])

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <span className="font-mono text-red-400 text-sm">{error}</span>
          <Button variant="primary" size="md" onClick={startGeneration}>
            $ retry
          </Button>
        </div>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-col gap-10 px-20 py-10">
          <div className="flex items-center justify-center gap-4 py-12">
            <Spinner size="lg" className="text-emerald-500" />
            <span className="font-mono text-sm text-zinc-400">$ analyzing code...</span>
          </div>

          <RoastDisplay roast={roast} items={items} isLoading={true} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-col gap-10 px-20 py-10">
        <RoastDisplay roast={roast} items={items} />
      </div>
    </div>
  )
}
