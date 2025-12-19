import { prisma } from '@/src/lib/db';

export async function cleanDatabase() {
  // Delete in order to respect foreign key constraints
  // Each operation is independent (no transaction needed for standalone MongoDB)
  try {
    await prisma.petitionSignature.deleteMany({});
  } catch (e) {
    // Ignore errors if collection doesn't exist yet
  }

  try {
    await prisma.petition.deleteMany({});
  } catch (e) {
    // Ignore errors if collection doesn't exist yet
  }

  try {
    await prisma.digestEdition.deleteMany({});
  } catch (e) {
    // Ignore errors if collection doesn't exist yet
  }

  try {
    await prisma.scorecard.deleteMany({});
  } catch (e) {
    // Ignore errors if collection doesn't exist yet
  }

  try {
    await prisma.user.deleteMany({});
  } catch (e) {
    // Ignore errors if collection doesn't exist yet
  }

  try {
    await prisma.electedOfficial.deleteMany({});
  } catch (e) {
    // Ignore errors if collection doesn't exist yet
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
