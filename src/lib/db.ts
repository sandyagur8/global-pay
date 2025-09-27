import { PrismaClient, Prisma } from '../generated/prisma';

export const prisma = new PrismaClient();

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
 * @param userData The user data to create or update.
 * @returns The created or updated user.
 */
export async function upsertUser(walletAddress: string, userData: Partial<Prisma.UserCreateInput>) {
  return await prisma.user.upsert({
    where: {
      walletAddress,
    },
    update: userData,
    create: {
      walletAddress,
      ...userData,
    },
  });
}

/**
 * Creates a new organization and links it to a user.
 * @param orgName The name of the organization.
 * @param ownerWalletAddress The wallet address of the owner.
 * @param contractAddress The address of the deployed Organization contract.
 * @param paymentToken The address of the payment token (USDC).
 * @returns The created organization.
 */
export async function createOrganization(orgName: string, ownerWalletAddress: string, contractAddress: string, paymentToken: string) {
  return await prisma.organization.create({
    data: {
      name: orgName,
      owner: {
        connect: {
          walletAddress: ownerWalletAddress,
        },
      },
      contractAddress,
      paymentToken,
    },
  });
}
