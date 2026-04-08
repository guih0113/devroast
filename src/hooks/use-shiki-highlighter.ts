'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { BundledLanguage, ShikiTransformer } from 'shiki'
import { createHighlighter } from 'shiki'
import { SUPPORTED_LANGUAGES } from '@/lib/languages'

let highlighterInstance: Awaited<ReturnType<typeof createHighlighter>> | null = null
let highlighterPromise: Promise<Awaited<ReturnType<typeof createHighlighter>>> | null = null

async function getHighlighter() {
  if (highlighterInstance) return highlighterInstance

  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: [...SUPPORTED_LANGUAGES]
    }).then((instance) => {
      highlighterInstance = instance
      return instance
    })
  }

  return highlighterPromise
}

function createStripPreBackgroundTransformer(): ShikiTransformer {
  return {
    name: 'strip-pre-background',
    pre(node) {
      if (!node.properties) return

      const style = node.properties.style
      if (typeof style !== 'string') return

      const nextStyle = style
        .split(';')
        .map((s: string) => s.trim())
        .filter(Boolean)
        .filter((decl: string) => !/^background-color\s*:/i.test(decl))
        .join(';')

      node.properties.style = nextStyle ? `${nextStyle};` : ''
    }
  }
}

export function useShikiHighlighter() {
  const [isReady, setIsReady] = useState(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleCallbackRef = useRef<number | null>(null)

  useEffect(() => {
    getHighlighter().then(() => setIsReady(true))
  }, [])

  const highlight = useCallback(async (code: string, lang: BundledLanguage): Promise<string> => {
    const highlighter = await getHighlighter()

    return highlighter.codeToHtml(code, {
      lang: lang as Parameters<typeof highlighter.codeToHtml>[1]['lang'],
      theme: 'github-dark',
      transformers: [createStripPreBackgroundTransformer()]
    })
  }, [])

  const scheduleHighlight = useCallback(
    (code: string, lang: BundledLanguage, callback: (html: string) => void, delay = 50) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      if (idleCallbackRef.current !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleCallbackRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        const run = () => {
          highlight(code, lang).then(callback)
        }

        if ('requestIdleCallback' in window) {
          idleCallbackRef.current = window.requestIdleCallback(run, { timeout: 200 })
        } else {
          run()
        }
      }, delay)
    },
    [highlight]
  )

  return { highlight, scheduleHighlight, isReady }
}
