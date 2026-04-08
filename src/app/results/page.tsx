import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { BundledLanguage } from 'shiki'
import { RoastDisplay } from '@/components/roast-display'
import { getVerdict } from '@/lib/score'
import { getCaller } from '@/trpc/server'
import { CodeViewer } from './_components/code-viewer'

type Props = {
  searchParams: Promise<{ id?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { id } = await searchParams
  if (!id) return { title: 'devroast' }

  const trpc = await getCaller()
  const { data: result } = await trpc.roast.getResult({ id })
  const roast = result?.roast ?? null

  if (!roast) return { title: 'devroast' }

  const score = Number(roast.score)
  const verdict = getVerdict(score)
  const title = `${roast.fileName ?? 'submission'} — ${score.toFixed(1)}/10 (${verdict.label})`
  const description = roast.roastQuote ?? undefined
  const ogUrl = `/og?id=${id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630 }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogUrl]
    }
  }
}

export default async function ResultsPage({ searchParams }: Props) {
  const { id } = await searchParams

  if (!id) notFound()

  const trpc = await getCaller()
  const { data: result, dbOffline } = await trpc.roast.getResult({ id })

  if (!result) notFound()

  const { roast, items } = result

  return (
    <div className="min-h-screen bg-zinc-950">
      <main className="flex flex-col gap-10 px-20 py-10">
        <div className="flex items-center gap-2 font-mono text-xs text-zinc-600">
          <Link href="/" className="transition-colors hover:text-zinc-400">
            {'#'} devroast
          </Link>
          <span>/</span>
          <span className="text-zinc-400">results</span>
          <span>/</span>
          <span>{roast.fileName ?? 'submission'}</span>
        </div>

        <RoastDisplay roast={roast} items={items} />

        <div className="h-px bg-zinc-800" />

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold font-mono text-emerald-500 text-sm">{'// '}</span>
            <span className="font-bold font-mono text-sm text-zinc-100">your_submission</span>
          </div>
          <CodeViewer code={roast.code} language={roast.lang as BundledLanguage} />
        </div>

        {dbOffline && (
          <div className="flex justify-center">
            <span className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-mono text-[11px] text-amber-300">
              DB offline
            </span>
          </div>
        )}
      </main>
    </div>
  )
}
