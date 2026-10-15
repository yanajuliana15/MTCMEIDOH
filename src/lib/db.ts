import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'

// Untuk Neon (serverless PostgreSQL di Vercel):
// - Pakai @neondatabase/serverless + @prisma/adapter-neon
// - Connection pool via WebSocket (lebih hemat koneksi di serverless)
// - Untuk dev lokal: bisa pakai connection string biasa juga

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || ''

  // Deteksi Neon: connection string mengandung "neon.tech" atau pakai pattern pgsslmode
  if (databaseUrl.includes('neon.tech') || databaseUrl.includes('neon')) {
    // Setup Neon serverless driver (WebSocket)
    if (typeof WebSocket !== 'undefined') {
      // Browser environment — pakai native WebSocket
    } else {
      // Node environment — pakai ws untuk WebSocket
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const ws = require('ws')
        neonConfig.webSocketConstructor = ws
      } catch {
        // ws tidak tersedia, fallback ke HTTP
      }
    }
    const pool = new Pool({ connectionString: databaseUrl })
    const adapter = new PrismaNeon(pool)
    return new PrismaClient({ adapter })
  }

  // Fallback: koneksi PostgreSQL biasa (dev lokal atau non-Neon)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
