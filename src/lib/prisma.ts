import { config as loadEnv } from "dotenv";
import path from "node:path";

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
loadEnv({ path: path.resolve(process.cwd(), envFile) });
import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();

export { prisma };
