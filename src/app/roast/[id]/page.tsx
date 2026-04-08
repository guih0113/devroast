import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCaller } from '@/trpc/server'
import { RoastViewer } from './_components/roast-viewer'

type Props = {
  params: Promise<{ id: string }>
}

export default async function RoastPage({ params }: Props) {
  const { id } = await params

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    notFound()
  }

  const trpc = await getCaller()
  const { data: result, dbOffline } = await trpc.roast.getResult({ id })

  if (!result) {
    if (dbOffline) {
      return (
        <div className="min-h-screen bg-zinc-950">
          <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-10">
            <span className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-mono text-[11px] text-amber-300">
              DB offline - please try again later
            </span>
            <Link href="/">
              <button type="button" className="font-mono text-sm text-zinc-400 hover:text-zinc-300">
                ← back to home
              </button>
            </Link>
          </main>
        </div>
      )
    }
    notFound()
  }

  const { roast, items } = result

  return (
    <div className="min-h-screen bg-zinc-950">
      <main>
        <div className="flex items-center gap-2 px-20 pt-10 font-mono text-xs text-zinc-600">
          <Link href="/" className="transition-colors hover:text-zinc-400">
            {'#'} devroast
          </Link>
          <span>/</span>
          <span className="text-zinc-400">roast</span>
          <span>/</span>
          <span className="text-zinc-500">{roast.fileName ?? 'submission'}</span>
        </div>
        <RoastViewer roast={roast} items={items} />
      </main>
    </div>
  )
}
