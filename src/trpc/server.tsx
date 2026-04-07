import 'server-only'

import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { cache } from 'react'
import { createTRPCContext } from './context'
import { makeQueryClient } from './query-client'
import { appRouter } from './routers/_app'

export const getQueryClient = cache(makeQueryClient)

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient
})

export async function getCaller() {
  const ctx = await createTRPCContext()
  return appRouter.createCaller(ctx)
}

// Helper components
export function HydrateClient({ children }: { children: React.ReactNode }) {
  return <HydrationBoundary state={dehydrate(getQueryClient())}>{children}</HydrationBoundary>
}

export function prefetch(queryOptions: unknown) {
  const queryClient = getQueryClient()
  void queryClient.prefetchQuery(queryOptions as never)
}
