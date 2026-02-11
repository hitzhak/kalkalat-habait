import { PrismaClient } from '@prisma/client';

// Prisma Client Singleton Pattern (מתאים ל-Next.js)
// מונע יצירת מספר instances בפיתוח (Hot Reload)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Export db as alias for prisma (for consistency)
export const db = prisma;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
