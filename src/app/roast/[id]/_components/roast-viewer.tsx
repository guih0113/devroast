'use client'

import { readStreamableValue } from '@ai-sdk/rsc'
import { useEffect, useState } from 'react'
import type { BundledLanguage } from 'shiki'
import { generateRoast } from '@/actions/generate-roast'
import { CodeViewer } from '@/components/code-viewer'
import { RoastAnalysisSection, RoastDiffSection, RoastHero } from '@/components/roast-display'
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
    const normalizedCode = roast.code?.replace(/\r\n?/g, '\n') ?? ''
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-col gap-10 px-20 py-10">
          <div className="flex items-center justify-center gap-4 py-12">
            <Spinner size="lg" className="text-emerald-500" />
            <span className="font-mono text-sm text-zinc-400">$ analyzing code...</span>
          </div>

          <RoastHero roast={roast} isLoading={true} />

          <div className="h-px bg-zinc-800" />

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold font-mono text-emerald-500 text-sm">{'// '}</span>
              <span className="font-bold font-mono text-sm text-zinc-100">your_submission</span>
            </div>
            {normalizedCode ? (
              <CodeViewer code={normalizedCode} language={roast.lang as BundledLanguage} />
            ) : (
              <div className="h-[320px] animate-pulse rounded-lg border border-zinc-800 bg-zinc-900" />
            )}
          </div>

          <div className="h-px bg-zinc-800" />

          <RoastAnalysisSection items={items} isLoading={true} />

          {(roast.diff ?? []).length > 0 && (
            <>
              <div className="h-px bg-zinc-800" />
              <RoastDiffSection diff={roast.diff ?? []} />
            </>
          )}
        </div>
      </div>
    )
  }

  const normalizedCode = roast.code?.replace(/\r\n?/g, '\n') ?? ''
  const diff = roast.diff ?? []

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-col gap-10 px-6 py-10 md:px-20">
        <RoastHero roast={roast} />

        <div className="h-px bg-zinc-800" />

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold font-mono text-emerald-500 text-sm">{'// '}</span>
            <span className="font-bold font-mono text-sm text-zinc-100">your_submission</span>
          </div>
          <CodeViewer code={normalizedCode} language={roast.lang as BundledLanguage} />
        </div>

        {items.length > 0 && (
          <>
            <div className="h-px bg-zinc-800" />
            <RoastAnalysisSection items={items} />
          </>
        )}

        {diff.length > 0 && (
          <>
            <div className="h-px bg-zinc-800" />
            <RoastDiffSection diff={diff} />
          </>
        )}
      </div>
    </div>
  )
}
