import type { BundledLanguage } from 'shiki'

// ---------------------------------------------------------------------------
// Supported languages shown in the editor picker
// ---------------------------------------------------------------------------

export const SUPPORTED_LANGUAGES: BundledLanguage[] = [
  'javascript',
  'typescript',
  'tsx',
  'jsx',
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
  'html',
  'css',
  'scss',
  'json',
  'yaml',
  'shellscript',
  'sql',
  'markdown'
]

// ---------------------------------------------------------------------------
// Human-readable labels for the picker
// ---------------------------------------------------------------------------

export const LANGUAGE_LABELS: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  tsx: 'TSX',
  jsx: 'JSX',
  python: 'Python',
  rust: 'Rust',
  go: 'Go',
  java: 'Java',
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  php: 'PHP',
  ruby: 'Ruby',
  swift: 'Swift',
  kotlin: 'Kotlin',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  json: 'JSON',
  yaml: 'YAML',
  shellscript: 'Shell',
  sql: 'SQL',
  markdown: 'Markdown',
  plaintext: 'Plain Text'
}

// ---------------------------------------------------------------------------
// highlight.js language ID → Shiki BundledLanguage mapping
// Only includes IDs that differ between the two libraries.
// IDs that are identical (e.g. 'javascript', 'typescript') are handled by
// the identity fallback in use-language-detection.ts.
// ---------------------------------------------------------------------------

export const HLJS_TO_SHIKI: Record<string, BundledLanguage> = {
  // shell / bash
  shell: 'shellscript',
  bash: 'shellscript',
  sh: 'shellscript',
  zsh: 'shellscript',

  // C-family
  'c++': 'cpp',
  'c#': 'csharp',
  cs: 'csharp',

  // web
  xml: 'html',
  xhtml: 'html',

  // data
  yml: 'yaml',

  // JS variants
  mjs: 'javascript',
  cjs: 'javascript',

  // misc
  'objective-c': 'swift', // closest visual match in our set
  perl: 'ruby' // closest visual match in our set
}
