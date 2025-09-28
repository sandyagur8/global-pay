import { NextRequest, NextResponse } from "next/server";
import { upsertUser, createOrganisation } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import { ethers } from "ethers6";

export async function POST(req: NextRequest) {
  const { walletAddress, userType, organizationName, contractAddress, orgID } = await req.json();

  if (!walletAddress || !userType) {
    return NextResponse.json({ error: "Wallet address and user type are required" }, { status: 400 });
  }

  try {

    const spentKey = ethers.Wallet.createRandom();
    const viewKey = ethers.Wallet.createRandom();

    const userData: Partial<Prisma.UserCreateInput> = {
      userType,
      publicSpenderKey: spentKey.signingKey.publicKey,
      privateSpenderKey: spentKey.signingKey.privateKey,
      publicViewerKey: viewKey.signingKey.publicKey,
      privateViewerKey: viewKey.signingKey.privateKey,
      preferedChainId: null,
      preferedToken: null,
    };

    const user = await upsertUser(walletAddress, userData);

    if (userType === 'EMPLOYER' && contractAddress && orgID) {
      await createOrganisation(organizationName || null, walletAddress, contractAddress, BigInt(orgID));
    }

    // Return the user data so the frontend can redirect properly
    return NextResponse.json({
      id: user.id,
      walletAddress: user.walletAddress,
      userType: user.userType,
      hasOnboarded: true
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
