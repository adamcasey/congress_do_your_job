/**
 * Unified Database Export
 *
 * Import this file in your application code:
 *
 * ```typescript
 * import { prisma, getDb, getCollection } from '@/lib/db';
 * ```
 *
 * Decision Guide:
 * - Use `prisma` for 80% of operations (type-safe CRUD)
 * - Use `getDb()` or `getCollection()` for complex analytics, aggregations, or geospatial queries
 *
 * See PRISMA_VS_MONGODB.md for detailed guidance
 */

export { prisma, default as prismaClient } from './prisma';
export { getDb, getCollection, clientPromise } from './mongodb';
