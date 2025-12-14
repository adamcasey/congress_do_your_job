/**
 * Prisma Client Singleton
 *
 * Use this for:
 * - Type-safe CRUD operations
 * - Simple queries and filters
 * - Relations and joins
 * - 80% of your database operations
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config'

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined;
// };

// export const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
//   });

// if (process.env.NODE_ENV !== 'production') {
//   globalForPrisma.prisma = prisma;
// }

// export default prisma;

import { defineConfig, env } from 'prisma/config'

console.log("MONGODB_URI: ", env('MONGODB_URI'))

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('MONGODB_URI'),
  },
})
