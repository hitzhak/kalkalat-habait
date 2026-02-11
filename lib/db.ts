import { PrismaClient } from '@prisma/client';

// Prisma Client Singleton Pattern (מתאים ל-Next.js)
// מונע יצירת מספר instances בפיתוח (Hot Reload)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Debug logging for production troubleshooting
if (process.env.NODE_ENV === 'production') {
  console.log('[Prisma] Initializing Prisma Client...');
  console.log('[Prisma] DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('[Prisma] DIRECT_URL exists:', !!process.env.DIRECT_URL);
  if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    const hasPooler = dbUrl.includes('pooler.supabase.com');
    const hasPgbouncer = dbUrl.includes('pgbouncer=true');
    console.log('[Prisma] Using Pooler:', hasPooler);
    console.log('[Prisma] PgBouncer enabled:', hasPgbouncer);
    // Log first 50 chars of URL (without password) for debugging
    const urlPreview = dbUrl.replace(/:[^:@]+@/, ':****@');
    console.log('[Prisma] DATABASE_URL preview:', urlPreview.substring(0, 80));
  } else {
    console.error('[Prisma] ERROR: DATABASE_URL is missing!');
  }
}

let prismaInstance: PrismaClient;

try {
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

  if (process.env.NODE_ENV === 'production') {
    console.log('[Prisma] Prisma Client initialized successfully');
  }
} catch (error) {
  console.error('[Prisma] ERROR initializing Prisma Client:', error);
  throw error;
}

export const prisma = prismaInstance;

// Export db as alias for prisma (for consistency)
export const db = prisma;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
