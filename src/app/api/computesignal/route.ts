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
        const data = {
            publicSpenderKey: user.publicSpenderKey,
            publicViewerKey: user.publicViewerKey,
            amount,
        }

        const response = await fetch("http://localhost:4000/compute-signals", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: errorData.error || "Failed to compute signals" }, { status: response.status });
        }

        const result = await response.json();

        console.log(result);

        return NextResponse.json({ signals: result.signals }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to compute signals" }, { status: 500 });
    }
}