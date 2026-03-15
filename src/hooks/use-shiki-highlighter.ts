import { useCallback, useEffect, useRef, useState } from 'react'
import type { BundledLanguage } from 'shiki'
import type { HighlighterCore } from 'shiki/core'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

// ---------------------------------------------------------------------------
// Module-level singleton — one Shiki instance shared across all editor mounts
// ---------------------------------------------------------------------------

let highlighterPromise: Promise<HighlighterCore> | null = null

function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [import('shiki/themes/github-dark.mjs')],
      langs: [], // loaded lazily per language
      engine: createJavaScriptRegexEngine()
    })
  }
  return highlighterPromise
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

type UseShikiHighlighterReturn = {
  highlighterRef: React.RefObject<HighlighterCore | null>
  highlighterReady: boolean
  highlight: (code: string, lang: BundledLanguage | 'plaintext') => Promise<string>
  scheduleHighlight: (
    code: string,
    lang: BundledLanguage | 'plaintext',
    onResult: (html: string) => void
  ) => void
}

export function useShikiHighlighter(): UseShikiHighlighterReturn {
  const highlighterRef = useRef<HighlighterCore | null>(null)
  const [highlighterReady, setHighlighterReady] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getHighlighter().then((hl) => {
      highlighterRef.current = hl
      setHighlighterReady(true)
    })
  }, [])

  const highlight = useCallback(
    async (code: string, lang: BundledLanguage | 'plaintext'): Promise<string> => {
      const hl = highlighterRef.current
      if (!hl) return ''

      try {
        if (lang !== 'plaintext') {
          const loaded = hl.getLoadedLanguages()
          if (!loaded.includes(lang)) {
            await hl.loadLanguage(
              (await import(`shiki/langs/${lang}.mjs`)) as Parameters<typeof hl.loadLanguage>[0]
            )
          }
        }

        const raw = hl.codeToHtml(code, {
          lang: lang === 'plaintext' ? 'text' : lang,
          theme: 'github-dark'
        })
        // Strip Shiki's injected inline background so our dark surface shows through
        return raw.replace(/ style="[^"]*"/, '')
      } catch {
        // Hard fallback: escape and render as plain text
        return `<pre><code>${code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</code></pre>`
      }
    },
    []
  )

  const scheduleHighlight = useCallback(
    (code: string, lang: BundledLanguage | 'plaintext', onResult: (html: string) => void): void => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        highlight(code, lang).then(onResult)
      }, 150)
    },
    [highlight]
  )

  return { highlighterRef, highlighterReady, highlight, scheduleHighlight }
}
