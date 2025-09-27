// src/app/api/user/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { upsertUser, createOrganization } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  const { walletAddress, userType, organizationName } = await req.json();

  if (!walletAddress || !userType) {
    return NextResponse.json({ error: "Wallet address and user type are required" }, { status: 400 });
  }

  try {
    const userData: Partial<Prisma.UserCreateInput> = {
      userType,
      hasOnboarded: true,
    };

    await upsertUser(walletAddress, userData);

    console.log(walletAddress, userType, organizationName);

    if (userType === 'EMPLOYER' && organizationName) {
      //   // Generate a random address for the contract address to avoid unique constraint errors
      const contractAddress = "0x0000000000000000000000000000000000000000";
      const paymentToken = "0x0000000000000000000000000000000000000000"; // Dummy payment token
      await createOrganization(organizationName, walletAddress, contractAddress, paymentToken);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
