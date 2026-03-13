import type { BundledLanguage } from 'shiki'
import { codeToHtml } from 'shiki'
import { twMerge } from 'tailwind-merge'

type CodeBlockProps = {
  code: string
  lang: BundledLanguage
  fileName?: string
  className?: string
}

export async function CodeBlock({ code, lang, fileName, className }: CodeBlockProps) {
  const raw = await codeToHtml(code, {
    lang,
    theme: 'vesper'
  })
  // Strip shiki's injected inline background/color so our bg-[#111111] surface shows through
  const html = raw.replace(/ style="[^"]*"/i, '')

  return (
    <div className={twMerge('flex flex-col border border-[#2A2A2A] bg-[#111111]', className)}>
      {/* macOS-style window header */}
      <div className="flex h-10 items-center gap-3 border-[#2A2A2A] border-b px-4">
        <span className="size-[10px] rounded-full bg-red-500" />
        <span className="size-[10px] rounded-full bg-amber-500" />
        <span className="size-[10px] rounded-full bg-emerald-500" />
        <span className="flex-1" />
        {fileName && <span className="font-mono text-xs text-zinc-500">{fileName}</span>}
      </div>

      {/* Code body — shiki output injected here */}
      <div
        className="code-block-body overflow-x-auto"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted server-side shiki output
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
