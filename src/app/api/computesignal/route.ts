import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {

    const { walletAddress, amount } = await req.json();


    if (!walletAddress || !amount) {
        return NextResponse.json({ error: "Wallet address and amount are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { walletAddress },
    });

    if (!user || !user.publicSpenderKey || !user.publicViewerKey) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    try {
        console.log(user.publicSpenderKey, user.publicViewerKey, amount);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to compute signals" }, { status: 500 });
    }
}