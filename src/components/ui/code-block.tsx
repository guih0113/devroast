import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import type { BundledLanguage } from 'shiki'
import { codeToHast } from 'shiki'
import { twMerge } from 'tailwind-merge'

type CodeBlockProps = {
  code: string
  lang: BundledLanguage
  fileName?: string
  className?: string
}

export async function CodeBlock({ code, lang, fileName, className }: CodeBlockProps) {
  const hast = await codeToHast(code, { lang, theme: 'vesper' })

  const rendered = toJsxRuntime(hast, { Fragment, jsx, jsxs })

  return (
    <div className={twMerge('flex flex-col border border-zinc-800 bg-zinc-900', className)}>
      <div className="flex h-10 items-center gap-3 border-zinc-800 border-b px-4">
        <span className="size-2.5 rounded-full bg-red-500" />
        <span className="size-2.5 rounded-full bg-amber-500" />
        <span className="size-2.5 rounded-full bg-emerald-500" />
        <span className="flex-1" />
        {fileName && <span className="font-mono text-xs text-zinc-500">{fileName}</span>}
      </div>

      <div className="code-block-body overflow-x-auto">{rendered}</div>
    </div>
  )
}
