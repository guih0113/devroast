import 'server-only'

import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { cache } from 'react'
import { createTRPCContext } from './init'
import { makeQueryClient } from './query-client'
import { appRouter } from './routers/_app'

export const getQueryClient = cache(makeQueryClient)

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient
})

// Direct caller for server-only data (not hydrated to client)
export const caller = appRouter.createCaller(createTRPCContext)

// Helper components
export function HydrateClient({ children }: { children: React.ReactNode }) {
  return <HydrationBoundary state={dehydrate(getQueryClient())}>{children}</HydrationBoundary>
}

export function prefetch<T>(queryOptions: T) {
  const queryClient = getQueryClient()
  void queryClient.prefetchQuery(queryOptions as any)
}
