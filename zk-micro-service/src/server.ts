import express, { Request, Response } from "express";
import { computeSignals } from "./lib/server-utils";

const app = express();
app.use(express.json());

interface ComputeSignalsBody {
    walletAddress: string;
    amount: string;
    publicSpenderKey: string;
    publicViewerKey: string;
}

app.post("/compute-signals", async (req: Request<{}, {}, ComputeSignalsBody>, res: Response) => {
    const { publicSpenderKey, publicViewerKey, amount } = req.body;

    if (!publicViewerKey || !publicSpenderKey || !amount) {
        return res.status(400).json({ error: "Wallet address and amount are required" });
    }

    try {
        await computeSignals(publicSpenderKey, publicViewerKey, amount);
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to compute signals" });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
