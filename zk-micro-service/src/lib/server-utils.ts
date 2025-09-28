import * as circomlib from "circomlibjs";
import * as snarkjs from "snarkjs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";

export const computeSignals = async (publicSpenderKey: string, publicViewerKey: string, amount: string) => {

    const wasmPath = join(process.cwd(), "zk/transaction_verify.wasm");
    const zkeyPath = join(process.cwd(), "zk/circuit_final_8inputs.zkey");

    const viewingKeyX = BigInt(publicViewerKey.slice(0, 66)).toString();
    const viewingKeyY = BigInt("0x" + publicViewerKey.slice(66)).toString();
    const spendingKeyX = BigInt(publicSpenderKey.slice(0, 66)).toString();
    const spendingKeyY = BigInt("0x" + publicSpenderKey.slice(66)).toString();

    const now = Math.floor(Date.now() / 1000).toString();
    const oneMonthLater = (Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60).toString();

    const secretNonce = "0x" + randomBytes(16).toString("hex");
    const paymentType = "2"; // Recurring payment type

    const hashInputs = [
        BigInt(amount), BigInt(secretNonce),
        BigInt(viewingKeyX), BigInt(viewingKeyY),
        BigInt(spendingKeyX), BigInt(spendingKeyY),
        BigInt(paymentType), BigInt(now), BigInt(oneMonthLater)
    ];

    const poseidon = await circomlib.buildPoseidon();
    const result = poseidon(hashInputs);
    const commitment = poseidon.F.toString(result);
    console.log("✅ ZKP Commitment calculated:", commitment);
    try {
        console.log("Starting fullProve...");
        const { proof, publicSignals } = await snarkjs.groth16.fullProve({
            amount: amount,
            secretNonce: secretNonce,
            pubViewKeyX: viewingKeyX,
            pubViewKeyY: viewingKeyY,
            pubSpendKeyX: spendingKeyX,
            pubSpendKeyY: spendingKeyY,
            paymentType: paymentType,
            startDate: now,
            endDate: oneMonthLater,
            commitment: commitment
        }, wasmPath, zkeyPath);

        console.log("Finished fullProve!");


        console.log("🎉 ZK PROOF GENERATED!");
        console.log("Public signals:", publicSignals);

        return publicSignals;
    } catch (err) {
        console.error("💥 fullProve error:", err);
        throw err;
    }


}