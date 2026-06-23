import { PrismaClient } from './generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

const globalForPrisma = global as unknown as { prisma: InstanceType<typeof PrismaClient> }

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  const adapter = new PrismaLibSql(
    tursoUrl
      ? { url: tursoUrl, authToken: tursoToken }
      : { url: `file:${path.join(process.cwd(), 'dev.db')}` }
  )
  return new PrismaClient({ adapter } as never)
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
