export class DatabaseConnectionError extends Error {
  constructor(message = 'Database connection failed') {
    super(message)
    this.name = 'DatabaseConnectionError'
  }
}

export function isDatabaseConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const err = error as { code?: string; message?: string; name?: string; cause?: unknown }

  const connectionErrorCodes = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET']

  if (err.name === 'DrizzleQueryError' && err.cause) {
    return isDatabaseConnectionError(err.cause)
  }

  if (err.name === 'AggregateError' && 'errors' in err) {
    const aggregateErr = err as { errors?: unknown[] }
    if (Array.isArray(aggregateErr.errors)) {
      return aggregateErr.errors.some((e) => isDatabaseConnectionError(e))
    }
  }

  return Boolean(
    connectionErrorCodes.includes(err.code || '') ||
      err.message?.includes('connect ECONNREFUSED') ||
      err.message?.includes('Connection terminated') ||
      err.message?.includes('Connection refused') ||
      err.message?.includes('Failed query')
  )
}

type DatabaseHandlingOptions = {
  log?: boolean
}

export async function withDatabaseErrorHandling<T>(
  fn: () => Promise<T>,
  fallback: T,
  options: DatabaseHandlingOptions = {}
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      if (options.log !== false) {
        console.error('Database connection error:', error)
      }
      return fallback
    }
    throw error
  }
}

export async function withDatabaseStatus<T>(
  fn: () => Promise<T>,
  fallback: T,
  options: DatabaseHandlingOptions = {}
): Promise<{ data: T; dbOffline: boolean }> {
  try {
    return { data: await fn(), dbOffline: false }
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      if (options.log !== false) {
        console.error('Database connection error:', error)
      }
      return { data: fallback, dbOffline: true }
    }
    throw error
  }
}
