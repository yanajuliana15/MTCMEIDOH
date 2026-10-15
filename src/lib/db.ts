import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL belum di-set. Set di Vercel dashboard → Settings → Environment Variables.'
    )
  }

  // Jika URL Neon, pakai Neon serverless adapter
  if (databaseUrl.includes('neon.tech')) {
    // PrismaNeon v6 expects config object, bukan Pool instance
    const adapter = new PrismaNeon({ connectionString: databaseUrl })
    return new PrismaClient({ adapter })
  }

  // Fallback: PostgreSQL standar
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}