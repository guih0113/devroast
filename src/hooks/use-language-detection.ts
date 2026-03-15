import hljs from 'highlight.js'
import type { BundledLanguage } from 'shiki'
import { HLJS_TO_SHIKI, SUPPORTED_LANGUAGES } from '@/lib/languages'

// Subset of hljs language names that correspond to our supported set.
// Restricting the auto-detection pool improves both accuracy and speed.
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
  'xml', // → html
  'css',
  'scss',
  'json',
  'yaml',
  'bash', // → shellscript
  'sql',
  'markdown'
]

// Minimum relevance score from hljs.highlightAuto() required to trust the
// detected language. Below this threshold we fall back to 'plaintext'.
const RELEVANCE_THRESHOLD = 5

export function detectLanguage(code: string): BundledLanguage | 'plaintext' {
  if (!code.trim()) return 'plaintext'

  const result = hljs.highlightAuto(code, HLJS_SUBSET)
  const detectedId = result.language

  if (!detectedId || (result.relevance ?? 0) < RELEVANCE_THRESHOLD) {
    return 'plaintext'
  }

  // Direct match in our supported set (e.g. 'javascript', 'typescript', …)
  if ((SUPPORTED_LANGUAGES as string[]).includes(detectedId)) {
    return detectedId as BundledLanguage
  }

  // Mapped match (e.g. 'bash' → 'shellscript', 'xml' → 'html', …)
  const mapped = HLJS_TO_SHIKI[detectedId]
  if (mapped) return mapped

  return 'plaintext'
}
