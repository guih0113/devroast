'use client'

import { Collapsible } from '@base-ui-components/react/collapsible'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import type { BundledLanguage } from 'shiki'
import { CodeViewer } from '@/app/results/_components/code-viewer'

interface LeaderboardCodeRowProps {
  rank: number
  score: number
  code: string
  lang: BundledLanguage
}

function getScoreLevel(score: number): 'critical' | 'warning' | 'good' {
  if (score <= 4) return 'critical'
  if (score <= 7) return 'warning'
  return 'good'
}

const scoreColors = {
  critical: 'text-red-500',
  warning: 'text-amber-500',
  good: 'text-emerald-500'
}

export function LeaderboardCodeRow({ rank, score, code, lang }: LeaderboardCodeRowProps) {
  const [open, setOpen] = useState(false)
  const level = getScoreLevel(score)
  const scoreColor = scoreColors[level]

  // Normalize newlines to avoid hydration mismatches caused by CRLF parsing differences.
  const normalizedCode = code.replace(/\r\n?/g, '\n')

  // Get first 2-3 lines for preview
  const codeLines = normalizedCode.split('\n')
  const previewLines = codeLines.slice(0, 3)
  const codePreview = previewLines.join('\n') + (codeLines.length > 3 ? '\n...' : '')

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      className="border-zinc-800 border-b last:border-b-0"
    >
      <Collapsible.Trigger className="group w-full cursor-pointer px-5 py-4 text-left transition-colors hover:bg-zinc-900/50">
        <div className="flex items-center gap-6">
          {/* Rank */}
          <span className="w-10 shrink-0 font-mono text-sm text-zinc-500">#{rank}</span>

          {/* Score */}
          <span className={`w-14 shrink-0 font-bold font-mono text-sm ${scoreColor}`}>
            {score.toFixed(1)}
          </span>

          {/* Code Preview */}
          <div className="flex-1 overflow-hidden">
            <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-100 leading-relaxed">
              {codePreview}
            </pre>
          </div>

          {/* Language */}
          <span className="w-24 shrink-0 text-right font-mono text-xs text-zinc-600">{lang}</span>
        </div>
      </Collapsible.Trigger>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <Collapsible.Panel className="border-zinc-800 border-t p-4">
              <CodeViewer code={normalizedCode} language={lang} />
            </Collapsible.Panel>
          </motion.div>
        )}
      </AnimatePresence>
    </Collapsible.Root>
  )
}
