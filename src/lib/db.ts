import { PrismaClient } from '@prisma/client'

// On Vercel/serverless, each function invocation may create a new Node.js
// instance. Without global caching, every request would create a new
// PrismaClient, quickly exhausting the Neon connection pool.
// By caching on globalThis (which persists across warm invocations),
// we reuse the same PrismaClient instance, keeping connections stable.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error'],
  })

// Always cache on globalThis (both dev and production) to prevent
// connection pool exhaustion on serverless platforms like Vercel.
globalForPrisma.prisma = db
