import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Retry wrapper for database operations (handles Supabase cold starts / transient errors).
 * Retries up to `maxRetries` times with exponential back-off.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 500
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      const isRetryable =
        error instanceof Error &&
        (error.message.includes('connection')
          || error.message.includes('timeout')
          || error.message.includes('ECONNREFUSED')
          || error.message.includes('ECONNRESET')
          || error.message.includes('Can\'t reach database server')
          || error.message.includes('Connection pool timeout'));

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential back-off: 500ms, 1000ms, 2000ms …
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
