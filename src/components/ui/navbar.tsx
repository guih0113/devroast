import Link from 'next/link'

export function Navbar() {
  return (
    <nav className="flex h-14 items-center justify-between border-zinc-800 border-b bg-zinc-950 px-10">
      <div className="flex items-center gap-2">
        <span className="font-bold font-mono text-emerald-500 text-xl">{'>'}</span>
        <Link href="/" className="font-medium font-mono text-lg text-zinc-100">devroast</Link>
      </div>
      <div className="flex items-center gap-6">
        <Link
          href="/leaderboard"
          className="font-mono text-sm text-zinc-400 transition-colors hover:text-zinc-100"
        >
          leaderboard
        </Link>
      </div>
    </nav>
  )
}
