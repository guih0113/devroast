# App Directory Standards

This document defines the patterns for all pages and routes in `src/app`.

---

## Server-Side Rendering (SSR) Standards

### Rule: All public-facing pages MUST use SSR for SEO and indexing

Pages that need to be indexed by search engines or crawled by social media bots must be Server Components with dynamic rendering enabled.

### Implementation

1. **Export `dynamic = 'force-dynamic'`** at the top of the page file:
   ```tsx
   export const dynamic = 'force-dynamic'
   ```

2. **Use async Server Components** for data fetching:
   ```tsx
   export default async function LeaderboardPage() {
     const data = await fetchData()
     return <div>...</div>
   }
   ```

3. **Fetch data directly in the component** — no client-side fetching for initial data:
   ```tsx
   async function getData() {
     return withDatabaseStatus(
       async () => {
         const rows = await db.select().from(table)
         return rows
       },
       [],
       { log: false }
     )
   }

   export default async function Page() {
     const { data } = await getData()
     // render with data
   }
   ```

### Why this matters

- ✅ **Search engines** receive fully-rendered HTML with content
- ✅ **Social media crawlers** can generate preview cards
- ✅ **No loading states** that could confuse crawlers
- ✅ **Fresh data** on every request for up-to-date indexing

### Pages that MUST use SSR

- `/` (home) — for search engine discovery
- `/leaderboard` — for indexing leaderboard entries
- `/roast/[id]` — for sharing roast results on social media

### Pages that can use client-side rendering

- Admin pages
- User dashboards (behind authentication)
- Internal tools

---

## Reference Examples

### ✅ Correct: SSR-enabled page

```tsx
// src/app/leaderboard/page.tsx
import { db } from '@/db'
import { roasts } from '@/db/schema'

export const dynamic = 'force-dynamic'

async function getLeaderboardData() {
  const rows = await db.select().from(roasts).limit(50)
  return rows
}

export default async function LeaderboardPage() {
  const data = await getLeaderboardData()
  
  return (
    <div>
      {data.map(entry => (
        <div key={entry.id}>{entry.code}</div>
      ))}
    </div>
  )
}
```

### ❌ Wrong: Client-side only rendering

```tsx
// DON'T DO THIS for public pages
'use client'

export default function LeaderboardPage() {
  const [data, setData] = useState([])
  
  useEffect(() => {
    fetch('/api/leaderboard').then(/* ... */)
  }, [])
  
  return <div>{/* ... */}</div>
}
```

---

## Performance Optimization with Promise.all

### Rule: Execute independent database queries in parallel

When fetching multiple independent datasets, use `Promise.all()` to run queries in parallel instead of sequentially. This significantly improves page load performance.

### Implementation

**❌ Sequential (slower):**
```tsx
async function getData() {
  const stats = await db.select({ total: count() }).from(roasts)
  const rows = await db.select().from(roasts).limit(50)
  
  return { stats, rows }
}
```

**✅ Parallel (faster):**
```tsx
async function getData() {
  // Execute both queries simultaneously
  const [statsResult, rows] = await Promise.all([
    db.select({ total: count() }).from(roasts),
    db.select().from(roasts).limit(50)
  ])
  
  const [stats] = statsResult
  return { stats, rows }
}
```

### Benefits

- ⚡ **Faster page loads** — queries run simultaneously instead of waiting for each other
- 🔄 **Better database utilization** — parallel execution reduces total wait time
- 📊 **Improved UX** — users see content faster

### When to use Promise.all

Use `Promise.all()` when:
- Queries are **independent** (one doesn't depend on the other's results)
- Queries access **different tables** or **different data ranges**
- Within `withDatabaseStatus` callback for error handling

### Example: Leaderboard page with parallel queries

```tsx
async function getLeaderboardData() {
  return withDatabaseStatus(
    async () => {
      // Both queries run in parallel
      const [statsResult, rows] = await Promise.all([
        db.select({ total: count(), avgScore: avg(roasts.score) }).from(roasts),
        db
          .select({ id: roasts.id, score: roasts.score, code: roasts.code })
          .from(roasts)
          .orderBy(asc(roasts.score))
          .limit(50)
      ])

      const [stats] = statsResult
      return { stats, rows }
    },
    { stats: { total: 0, avgScore: null }, rows: [] },
    { log: false }
  )
}
```

---

## Suspense and Streaming

### Rule: Use Suspense boundaries for data-fetching components

Wrap async Server Components in `<Suspense>` with skeleton fallbacks to enable streaming and show loading states.

### Implementation

**Structure:**
```tsx
import { Suspense } from 'react'

export default async function Page() {
  return (
    <div>
      {/* Static content renders immediately */}
      <header>My Page</header>
      
      {/* Dynamic content streams in when ready */}
      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardPreview />
      </Suspense>
      
      <Suspense fallback={<StatsSkeleton />}>
        <StatsFooter />
      </Suspense>
    </div>
  )
}
```

**Async Server Component:**
```tsx
// _components/leaderboard-preview.tsx
async function getPreviewEntries() {
  const rows = await db.select().from(roasts).limit(3)
  return rows
}

export async function LeaderboardPreview() {
  const entries = await getPreviewEntries()
  
  return (
    <div>
      {entries.map(entry => (
        <div key={entry.id}>{entry.code}</div>
      ))}
    </div>
  )
}
```

**Skeleton Component:**
```tsx
// _components/leaderboard-preview-skeleton.tsx
export function LeaderboardPreviewSkeleton() {
  return (
    <div className="flex flex-col border border-zinc-800">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-6 px-5 py-4">
          <span className="inline-block h-4 w-8 animate-pulse rounded bg-zinc-800" />
          <span className="inline-block h-3 w-full animate-pulse rounded bg-zinc-800" />
        </div>
      ))}
    </div>
  )
}
```

### Benefits

- 🚀 **Progressive rendering** — show content as soon as it's ready
- 💫 **Better perceived performance** — skeleton UI prevents layout shifts
- 🎯 **Independent loading** — multiple Suspense boundaries can resolve independently
- ⚡ **Streaming SSR** — HTML streams to the client progressively

### Best Practices

1. **Skeleton must match layout** — prevent layout shift when real content loads
2. **Keep Suspense boundaries small** — wrap only the async parts, not static content
3. **Multiple boundaries** — allow different sections to stream independently
4. **Combine with Promise.all** — parallel queries + streaming = optimal performance

---

## Additional Notes

- Client Components (`'use client'`) are still allowed for interactive features within SSR pages
- Use `suppressHydrationWarning` for dynamic content that differs between server and client (timestamps, counts)
- All pages should handle database offline states gracefully with the `withDatabaseStatus` helper
