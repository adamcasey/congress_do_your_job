/**
 * Prisma Client Singleton
 *
 * Use this for:
 * - Type-safe CRUD operations
 * - Simple queries and filters
 * - Relations and joins
 * - 80% of your database operations
 */

import 'dotenv/config'

import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('MONGODB_URI'),
  },
})
