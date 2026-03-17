import type { BundledLanguage } from 'shiki'

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

export const HLJS_TO_SHIKI: Record<string, BundledLanguage> = {
  shell: 'shellscript',
  bash: 'shellscript',
  sh: 'shellscript',
  zsh: 'shellscript',

  'c++': 'cpp',
  'c#': 'csharp',
  cs: 'csharp',

  xml: 'html',
  xhtml: 'html',

  yml: 'yaml',

  mjs: 'javascript',
  cjs: 'javascript',

  'objective-c': 'swift',
  perl: 'ruby'
}
