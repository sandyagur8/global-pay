// src/app/api/user/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { upsertUser, createOrganization } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  const { walletAddress, paymentToken, userType, organizationName, contractAddress } = await req.json();

  if (!walletAddress || !userType) {
    return NextResponse.json({ error: "Wallet address and user type are required" }, { status: 400 });
  }

  try {
    const userData: Partial<Prisma.UserCreateInput> = {
      userType,
      hasOnboarded: true,
    };

    await upsertUser(walletAddress, userData);

    if (userType === 'EMPLOYER' && organizationName && contractAddress) {
      await createOrganization(organizationName, walletAddress, contractAddress, paymentToken);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
