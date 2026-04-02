# tRPC — Implementation Spec

## Overview

tRPC provides end-to-end typesafe APIs without code generation. This spec defines how to integrate
tRPC v11 with Next.js App Router, supporting both Server Components (direct caller) and Client
Components (React Query hooks).

## Goals

- Type-safe API layer between client and server
- SSR support with query prefetching in Server Components
- Client-side data fetching with TanStack React Query
- Seamless hydration from server to client

## Package Installation

```bash
pnpm add @trpc/server @trpc/client @trpc/tanstack-react-query @tanstack/react-query zod server-only
```

| Package | Role |
|---------|------|
| `@trpc/server` | Router, procedures, context |
| `@trpc/client` | Client creation, links |
| `@trpc/tanstack-react-query` | React Query integration |
| `@tanstack/react-query` | Data fetching, caching |
| `zod` | Input validation (already installed) |
| `server-only` | Prevents server code from being imported on client |

## Project Structure

```
src/
├── trpc/
│   ├── init.ts              # initTRPC, context, base procedure
│   ├── routers/
│   │   ├── _app.ts          # Root router, exports AppRouter type
│   │   └── roast.ts         # Roast procedures (submit, getById, list)
│   ├── query-client.ts      # QueryClient factory
│   ├── client.tsx           # Client provider + useTRPC hook
│   └── server.ts            # Server-side caller + prefetch helpers
└── app/
    ├── layout.tsx           # Wrap with TRPCReactProvider
    └── api/trpc/[trpc]/
        └── route.ts         # HTTP handler (GET + POST)
```

## Files

### `src/trpc/init.ts`

```ts
import { initTRPC } from '@trpc/server'
import { cache } from 'react'

export const createTRPCContext = cache(async () => {
  return {}
})

const t = initTRPC.create()

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const baseProcedure = t.procedure
```

### `src/trpc/routers/_app.ts`

```ts
import { createTRPCRouter } from '../init'
import { roastRouter } from './roast'

export const appRouter = createTRPCRouter({
  roast: roastRouter,
})

export type AppRouter = typeof appRouter
```

### `src/trpc/routers/roast.ts`

```ts
import { z } from 'zod'
import { baseProcedure, createTRPCRouter } from '../init'

export const roastRouter = createTRPCRouter({
  submit: baseProcedure
    .input(z.object({
      code: z.string().min(1),
      lang: z.string(),
      roastMode: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      // AI call + DB insert (move from app/api/roast/route.ts)
      return { id: 'uuid' }
    }),

  getById: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      // Fetch from DB
      return { /* roast data */ }
    }),

  getStats: baseProcedure.query(async () => {
    // Aggregate stats for footer
    return { total: 0, avgScore: '0.0' }
  }),

  leaderboard: baseProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(50) }))
    .query(async ({ input }) => {
      // Top N worst scores
      return []
    }),
})
```

### `src/trpc/query-client.ts`

```ts
import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  })
}
```

### `src/trpc/client.tsx`

```tsx
'use client'

import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCContext } from '@trpc/tanstack-react-query'
import { useState } from 'react'
import { makeQueryClient } from './query-client'
import type { AppRouter } from './routers/_app'

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()

let browserQueryClient: QueryClient

function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

function getUrl() {
  if (typeof window !== 'undefined') return '/api/trpc'
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api/trpc`
  return 'http://localhost:3000/api/trpc'
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: getUrl() })],
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}
```

### `src/trpc/server.ts`

```ts
import 'server-only'

import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { cache } from 'react'
import { createTRPCContext } from './init'
import { makeQueryClient } from './query-client'
import { appRouter } from './routers/_app'

export const getQueryClient = cache(makeQueryClient)

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
})

// Direct caller for server-only data (not hydrated to client)
export const caller = appRouter.createCaller(createTRPCContext)

// Helper components
export function HydrateClient({ children }: { children: React.ReactNode }) {
  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      {children}
    </HydrationBoundary>
  )
}

export function prefetch<T>(queryOptions: T) {
  const queryClient = getQueryClient()
  void queryClient.prefetchQuery(queryOptions as any)
}
```

### `src/app/api/trpc/[trpc]/route.ts`

```ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createTRPCContext } from '@/trpc/init'
import { appRouter } from '@/trpc/routers/_app'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  })

export { handler as GET, handler as POST }
```

## Usage Patterns

### Server Component (prefetch + hydrate)

```tsx
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { ClientComponent } from './client-component'

export default async function Page() {
  prefetch(trpc.roast.getStats.queryOptions())

  return (
    <HydrateClient>
      <ClientComponent />
    </HydrateClient>
  )
}
```

### Client Component (consume prefetched data)

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/trpc/client'

export function ClientComponent() {
  const trpc = useTRPC()
  const { data } = useQuery(trpc.roast.getStats.queryOptions())

  return <div>{data?.total} codes roasted</div>
}
```

### Server Component (direct caller, no hydration)

```tsx
import { caller } from '@/trpc/server'

export default async function Page() {
  const stats = await caller.roast.getStats()
  return <div>{stats.total} codes roasted</div>
}
```

### Client Component (mutation)

```tsx
'use client'

import { useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/trpc/client'

export function RoastForm() {
  const trpc = useTRPC()
  const mutation = useMutation(trpc.roast.submit.mutationOptions())

  const handleSubmit = () => {
    mutation.mutate({ code: '...', lang: 'javascript', roastMode: true })
  }

  return <button onClick={handleSubmit}>Roast</button>
}
```

## Migration from `/api/roast`

1. Move AI + DB logic from `app/api/roast/route.ts` → `trpc/routers/roast.ts`
2. Delete `app/api/roast/route.ts`
3. Update `roast-form.tsx` to use `useMutation(trpc.roast.submit.mutationOptions())`
4. Update pages to use `caller` or `prefetch` for data fetching

## To-Do List

### 1. Setup

- [ ] Install packages: `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`, `@tanstack/react-query`, `server-only`
- [ ] Create `src/trpc/init.ts`
- [ ] Create `src/trpc/query-client.ts`
- [ ] Create `src/trpc/client.tsx`
- [ ] Create `src/trpc/server.ts`
- [ ] Create `src/app/api/trpc/[trpc]/route.ts`

### 2. Routers

- [ ] Create `src/trpc/routers/_app.ts`
- [ ] Create `src/trpc/routers/roast.ts` with procedures:
  - [ ] `submit` — mutation (AI call + DB insert)
  - [ ] `getById` — query (single roast with cards + diff)
  - [ ] `getStats` — query (total count + avg score)
  - [ ] `leaderboard` — query (top N by score ASC)

### 3. Integration

- [ ] Wrap `app/layout.tsx` with `TRPCReactProvider`
- [ ] Migrate `app/api/roast/route.ts` logic to `roast.submit`
- [ ] Update `roast-form.tsx` to use tRPC mutation
- [ ] Update `results/page.tsx` to use `caller.roast.getById`
- [ ] Update home page footer stats to use tRPC
- [ ] Update leaderboard preview to use tRPC

### 4. Cleanup

- [ ] Delete `app/api/roast/route.ts`
- [ ] Remove direct DB imports from page files
