'use client'

import type { SupportedLanguages } from '@pierre/diffs'
import { PatchDiff, WorkerPoolContextProvider } from '@pierre/diffs/react'
import type { ComponentProps } from 'react'
import { useEffect, useState } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

const diffLine = tv({
  slots: {
    root: 'overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 font-mono text-xs text-zinc-100',
    viewer: 'block',
    fallback: 'whitespace-pre-wrap px-4 py-3 text-xs text-zinc-500'
  },
  variants: {
    tone: {
      default: {
        root: ''
      }
    }
  },
  defaultVariants: {
    tone: 'default'
  }
})

type DiffEntry = { variant: 'added' | 'removed' | 'context'; code: string }

type DiffLineProps = Omit<ComponentProps<'div'>, 'children'> &
  VariantProps<typeof diffLine> & {
    diff: DiffEntry[]
    fileName?: string
    language?: SupportedLanguages
  }

function buildUnifiedPatch(diff: DiffEntry[], fileName: string) {
  let oldCount = 0
  let newCount = 0

  const lines = diff.map((line) => {
    if (line.variant !== 'added') {
      oldCount += 1
    }
    if (line.variant !== 'removed') {
      newCount += 1
    }

    const prefix = line.variant === 'added' ? '+' : line.variant === 'removed' ? '-' : ' '
    return `${prefix}${line.code}`
  })

  return [
    `--- a/${fileName}`,
    `+++ b/${fileName}`,
    `@@ -1,${oldCount} +1,${newCount} @@`,
    ...lines
  ].join('\n')
}

export function DiffLine({
  diff,
  fileName = 'submission',
  language,
  className,
  tone,
  ...props
}: DiffLineProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!diff || diff.length === 0) return null

  const patch = buildUnifiedPatch(diff, fileName)
  const { root, viewer, fallback } = diffLine({ tone })

  if (!isMounted || typeof Worker === 'undefined') {
    return (
      <div className={root({ className })} {...props}>
        <pre className={fallback()}>{patch}</pre>
      </div>
    )
  }

  return (
    <div className={root({ className })} {...props}>
      <WorkerPoolContextProvider
        poolOptions={{
          workerFactory: () =>
            new Worker(new URL('@pierre/diffs/worker/worker.js', import.meta.url))
        }}
        highlighterOptions={{
          theme: 'pierre-dark',
          langs: language ? [language] : undefined
        }}
      >
        <PatchDiff
          patch={patch}
          options={{
            diffStyle: 'unified',
            disableFileHeader: false,
            disableLineNumbers: false
          }}
          className={viewer()}
        />
      </WorkerPoolContextProvider>
    </div>
  )
}
