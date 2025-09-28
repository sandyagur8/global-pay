export const runtime = "nodejs";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeSignals } from "@/lib/server-utils";

export async function POST(req: NextRequest) {

    const { walletAddress, amount } = await req.json();

    const wasmPath = join(process.cwd(), "zk/transaction_verify.wasm");
    const zkeyPath = join(process.cwd(), "zk/circuit_final_8inputs.zkey");

    console.log("WASM exists:", existsSync(wasmPath));
    console.log("ZKEY exists:", existsSync(zkeyPath));

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
        const result = await computeSignals(
            user.publicSpenderKey,
            user.publicViewerKey,
            amount
        );

        console.log(result);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to compute signals" }, { status: 500 });
    }
}