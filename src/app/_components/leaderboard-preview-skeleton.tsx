export function LeaderboardPreviewSkeleton() {
  return (
    <div className="flex flex-col border border-zinc-800">
      <div className="flex items-center gap-6 border-zinc-800 border-b px-5 py-3">
        <span className="w-10 shrink-0 font-mono text-xs text-zinc-600">#</span>
        <span className="w-14 shrink-0 font-mono text-xs text-zinc-600">score</span>
        <span className="flex-1 font-mono text-xs text-zinc-600">code</span>
        <span className="w-24 shrink-0 text-right font-mono text-xs text-zinc-600">lang</span>
      </div>

      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-6 border-zinc-800 border-b px-5 py-4">
          <span className="w-10 shrink-0">
            <span className="inline-block h-4 w-6 animate-pulse rounded bg-zinc-800" />
          </span>
          <span className="w-14 shrink-0">
            <span className="inline-block h-4 w-8 animate-pulse rounded bg-zinc-800" />
          </span>
          <span className="flex-1">
            <span className="inline-block h-3 w-full max-w-md animate-pulse rounded bg-zinc-800" />
          </span>
          <span className="w-24 shrink-0 text-right">
            <span className="inline-block h-3 w-16 animate-pulse rounded bg-zinc-800" />
          </span>
        </div>
      ))}
    </div>
  )
}
