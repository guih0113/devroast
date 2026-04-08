import { createHighlighter } from 'shiki'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function stripPreBackground(html: string) {
  // Shiki emits: <pre class="shiki ..." style="background-color:#24292e;color:...">
  // We remove only the background-color declaration (keep other inline styles).
  return html.replace(/(<pre\b[^>]*\bstyle=")([^"]*)("[^>]*>)/i, (_m, start, style, end) => {
    const nextStyle = style
      .split(';')
      .map((s: string) => s.trim())
      .filter(Boolean)
      .filter((decl: string) => !/^background-color\s*:/i.test(decl))
      .join(';')

    return `${start}${nextStyle}${nextStyle ? ';' : ''}${end}`
  })
}

const highlighter = await createHighlighter({ themes: ['github-dark'], langs: ['javascript'] })
const html = highlighter.codeToHtml("console.log('hi')\n", {
  lang: 'javascript',
  theme: 'github-dark'
})

assert(html.includes('#24292e'), 'Expected Shiki output to include #24292e background color')

const stripped = stripPreBackground(html)
assert(!stripped.includes('#24292e'), 'Expected stripped output to remove #24292e background color')

process.stdout.write('ok\n')
