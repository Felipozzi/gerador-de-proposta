import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient, LibsqlClient } from '@libsql/client'

const globalForPrisma = global as unknown as { prisma?: PrismaClient }

function createLibsqlClientIfConfigured(): LibsqlClient | null {
  const url = process.env.DATABASE_URL
  const token = process.env.TURSO_AUTH_TOKEN
  if (!url) return null
  return createClient({ url, authToken: token as string })
}

const libsql = createLibsqlClientIfConfigured()
const adapter = libsql ? new PrismaLibSql(libsql) : undefined

export const db =
  globalForPrisma.prisma ??
  new PrismaClient(adapter ? ({ adapter } as any) : undefined)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
