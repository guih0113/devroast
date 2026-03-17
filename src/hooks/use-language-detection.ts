import hljs from 'highlight.js'
import type { BundledLanguage } from 'shiki'
import { HLJS_TO_SHIKI, SUPPORTED_LANGUAGES } from '@/lib/languages'

const HLJS_SUBSET = [
  'javascript',
  'typescript',
  'python',
  'rust',
  'go',
  'java',
  'c',
  'cpp',
  'csharp',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'xml',
  'css',
  'scss',
  'json',
  'yaml',
  'bash',
  'sql',
  'markdown'
]

const RELEVANCE_THRESHOLD = 5

export function detectLanguage(code: string): BundledLanguage | 'plaintext' {
  if (!code.trim()) return 'plaintext'

  const result = hljs.highlightAuto(code, HLJS_SUBSET)
  const detectedId = result.language

  if (!detectedId || (result.relevance ?? 0) < RELEVANCE_THRESHOLD) {
    return 'plaintext'
  }

  if ((SUPPORTED_LANGUAGES as string[]).includes(detectedId)) {
    return detectedId as BundledLanguage
  }

  const mapped = HLJS_TO_SHIKI[detectedId]
  if (mapped) return mapped

  return 'plaintext'
}
