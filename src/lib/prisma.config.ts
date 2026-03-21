/**
 * Prisma Client Singleton
 *
 * Use this for:
 * - Type-safe CRUD operations
 * - Simple queries and filters
 * - Relations and joins
 * - 80% of your database operations
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
loadEnv({ path: path.resolve(process.cwd(), envFile) });

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("MONGODB_URI"),
  },
});
