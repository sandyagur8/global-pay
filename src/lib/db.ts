import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Checks if a user with the given wallet address exists in the database.
 * @param walletAddress The wallet address to check.
 * @returns A boolean indicating whether the user exists.
 */
export async function checkUserExists(walletAddress: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: {
      walletAddress,
    },
  });
  return !!user;
}

/**
 * Creates a new user or updates an existing user with the given wallet address.
 * @param walletAddress The wallet address of the user to create or update.
 * @returns The created or updated user.
 */
export async function upsertUser(walletAddress: string) {
  return await prisma.user.upsert({
    where: {
      walletAddress,
    },
    update: {},
    create: {
      walletAddress,
    },
  });
}
