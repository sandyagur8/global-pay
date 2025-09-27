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
 * Creates a new organisation and links it to a user.
 * @param orgName The name of the organisation (optional).
 * @param ownerWalletAddress The wallet address of the owner.
 * @param contractAddress The address of the deployed Organisation contract.
 * @param orgID The organisation ID from the contract.
 * @returns The created organisation.
 */
export async function createOrganisation(orgName: string | null, ownerWalletAddress: string, contractAddress: string, orgID: bigint) {
  return await prisma.organisation.create({
    data: {
      name: orgName,
      orgID,
      owner: {
        connect: {
          walletAddress: ownerWalletAddress,
        },
      },
      contractAddress,
    },
  });
}
