// src/app/api/user/exists/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkUserExists } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const walletAddress = searchParams.get("walletAddress");

  if (!walletAddress) {
    return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
  }

  try {
    const exists = await checkUserExists(walletAddress);
    return NextResponse.json({ exists });
  } catch (error) {
    console.error("Error checking user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
