import { cache } from 'react'

export type TRPCContext = {}

export const createTRPCContext = cache(async (): Promise<TRPCContext> => {
  return {}
})
