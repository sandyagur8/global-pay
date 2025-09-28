import dotenv from "dotenv";
import { createPublicClient, createWalletClient, Hex, http } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

dotenv.config();

// Types for 1inch API responses
type AllowanceResponse = { allowance: string };
type TransactionPayload = { to: Hex; data: Hex; value: bigint };
type TxResponse = { tx: TransactionPayload };
type ApproveTransactionResponse = {
  to: Hex;
  data: Hex;
  value: bigint;
  gasPrice: string;
};

// Configuration interface
interface SwapConfig {
  privateKey: string;
  apiKey: string;
  rpcUrl: string;
  usdcAddress?: string;
  wethAddress?: string;
  slippage?: number;
}

// Default configuration for Base network
const DEFAULT_CONFIG = {
  usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
  wethAddress: "0x4200000000000000000000000000000000000006", // WETH on Base
  slippage: 1, // 1% slippage
  chainId: base.id,
};

/**
 * USDC to WETH Swap Service
 * Handles swapping USDC to WETH and sending to destination wallet
 */
export class USDCToWETHSwapper {
  private config: SwapConfig & typeof DEFAULT_CONFIG;
  private publicClient: any;
  private walletClient: any;
  private account: any;
  private baseUrl: string;

  constructor(config: SwapConfig) {
    // Validate required config
    if (!config.privateKey || !config.apiKey || !config.rpcUrl) {
      throw new Error('Missing required configuration: privateKey, apiKey, or rpcUrl');
    }

    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    this.baseUrl = `https://api.1inch.dev/swap/v6.1/${this.config.chainId}`;

    // Initialize clients
    this.publicClient = createPublicClient({
      chain: base,
      transport: http(this.config.rpcUrl),
    });

    // Auto-fix private key format if needed
    const formattedPrivateKey = this.config.privateKey.startsWith('0x') 
      ? this.config.privateKey 
      : '0x' + this.config.privateKey;
    
    this.account = privateKeyToAccount(formattedPrivateKey as Hex);
    this.walletClient = createWalletClient({
      account: this.account,
      chain: base,
      transport: http(this.config.rpcUrl),
    });
  }

  /**
   * Build query URL for 1inch API
   */
  private buildQueryURL(path: string, params: Record<string, string>): string {
    const url = new URL(this.baseUrl + path);
    url.search = new URLSearchParams(params).toString();
    return url.toString();
  }

  /**
   * Call 1inch API
   */
  private async call1inchAPI<T>(
    endpointPath: string,
    queryParams: Record<string, string>,
  ): Promise<T> {
    const url = this.buildQueryURL(endpointPath, queryParams);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`1inch API returned status ${response.status}: ${body}`);
    }

    return (await response.json()) as T;
  }

  /**
   * Sign and send transaction
   */
  private async signAndSendTransaction(tx: TransactionPayload): Promise<string> {
    const nonce = await this.publicClient.getTransactionCount({
      address: this.account.address,
      blockTag: "pending",
    });

    console.log("📝 Transaction nonce:", nonce.toString());

    try {
      return await this.walletClient.sendTransaction({
        account: this.account,
        to: tx.to,
        data: tx.data,
        value: BigInt(tx.value),
        chain: base,
        nonce,
        kzg: undefined,
      });
    } catch (err) {
      console.error("❌ Transaction signing or broadcasting failed");
      console.error("Transaction data:", tx);
      console.error("Nonce:", nonce.toString());
      throw err;
    }
  }

  /**
   * Check current allowance for USDC
   */
  private async checkAllowance(): Promise<bigint> {
    console.log("🔍 Checking USDC allowance...");

    const allowanceRes = await this.call1inchAPI<AllowanceResponse>(
      "/approve/allowance",
      {
        tokenAddress: this.config.usdcAddress,
        walletAddress: this.account.address.toLowerCase(),
      },
    );

    const allowance = BigInt(allowanceRes.allowance);
    console.log("✅ Current allowance:", allowance.toString());

    return allowance;
  }

  /**
   * Approve USDC spending if needed
   */
  private async approveIfNeeded(requiredAmount: bigint): Promise<void> {
    const allowance = await this.checkAllowance();

    if (allowance >= requiredAmount) {
      console.log("✅ Allowance is sufficient for the swap.");
      return;
    }

    console.log("⚠️  Insufficient allowance. Creating approval transaction...");

    const approveTx = await this.call1inchAPI<ApproveTransactionResponse>(
      "/approve/transaction",
      {
        tokenAddress: this.config.usdcAddress,
        amount: requiredAmount.toString(),
      },
    );

    console.log("📋 Approval transaction details:", approveTx);

    const txHash = await this.signAndSendTransaction({
      to: approveTx.to,
      data: approveTx.data,
      value: approveTx.value,
    });

    console.log("✅ Approval transaction sent. Hash:", txHash);
    console.log("⏳ Waiting 10 seconds for confirmation...");
    await new Promise((res) => setTimeout(res, 10000));
  }

  /**
   * Get swap quote
   */
  async getSwapQuote(usdcAmount: number): Promise<{
    estimatedWETH: string;
    estimatedGas: string;
    priceImpact: string;
  }> {
    try {
      const quoteParams = {
        src: this.config.usdcAddress,
        dst: this.config.wethAddress,
        amount: usdcAmount.toString(),
        from: this.account.address.toLowerCase(),
      };

      console.log("📊 Getting swap quote...");
      const quote = await this.call1inchAPI<any>("/quote", quoteParams);

      return {
        estimatedWETH: quote.dstAmount,
        estimatedGas: quote.estimatedGas,
        priceImpact: quote.priceImpact || "0",
      };
    } catch (error) {
      console.error("❌ Error getting swap quote:", error);
      throw error;
    }
  }

  /**
   * Main function: Convert USDC to WETH and send to destination wallet
   * @param destinationWallet - The wallet address to receive WETH
   * @param usdcAmount - Amount of USDC to swap (in smallest units, e.g., 1000000 = 1 USDC)
   * @param customSlippage - Optional custom slippage (default: 1%)
   * @returns Object with transaction details
   */
  async swapUSDCToWETH(
    destinationWallet: string,
    usdcAmount: number,
    customSlippage?: number
  ): Promise<{
    swapTxHash: string;
    transferTxHash?: string;
    usdcAmount: string;
    estimatedWETH: string;
    actualWETH?: string;
    destinationWallet: string;
    senderWallet: string;
  }> {
    try {
      console.log("🚀 Starting USDC to WETH Swap");
      console.log("================================");
      console.log(`💰 USDC Amount: ${usdcAmount / 1000000} USDC`);
      console.log(`📍 Destination: ${destinationWallet}`);
      console.log(`🔑 Sender: ${this.account.address}`);
      console.log(`📊 Slippage: ${customSlippage || this.config.slippage}%`);

      // Step 1: Get quote
      const quote = await this.getSwapQuote(usdcAmount);
      console.log(`📈 Estimated WETH: ${parseInt(quote.estimatedWETH) / 1e18} WETH`);

      // Step 2: Approve USDC spending if needed
      await this.approveIfNeeded(BigInt(usdcAmount));

      // Step 3: Perform swap to sender's wallet first
      const swapParams = {
        src: this.config.usdcAddress,
        dst: this.config.wethAddress,
        amount: usdcAmount.toString(),
        from: this.account.address.toLowerCase(),
        slippage: (customSlippage || this.config.slippage).toString(),
        disableEstimate: "false",
        allowPartialFill: "false",
      };

      console.log("🔄 Executing swap transaction...");
      const swapTx = await this.call1inchAPI<TxResponse>("/swap", swapParams);

      console.log("📋 Swap transaction details:", swapTx.tx);

      const swapTxHash = await this.signAndSendTransaction(swapTx.tx);
      console.log("✅ Swap transaction sent. Hash:", swapTxHash);

      // Wait for swap confirmation
      console.log("⏳ Waiting 15 seconds for swap confirmation...");
      await new Promise((res) => setTimeout(res, 15000));

      // Step 4: If destination is different from sender, transfer WETH
      let transferTxHash: string | undefined;
      if (destinationWallet.toLowerCase() !== this.account.address.toLowerCase()) {
        console.log("🔄 Transferring WETH to destination wallet...");
        
        // Get WETH balance to transfer
        const wethBalance = await this.getWETHBalance();
        console.log(`💰 WETH balance to transfer: ${Number(wethBalance) / 1e18} WETH`);

        if (wethBalance > 0) {
          transferTxHash = await this.transferWETH(destinationWallet, wethBalance);
          console.log("✅ WETH transfer completed. Hash:", transferTxHash);
        } else {
          console.warn("⚠️  No WETH balance found to transfer");
        }
      }

      console.log("\n🎉 SUCCESS! USDC to WETH swap completed!");
      console.log("==========================================");
      console.log(`✅ Swap Transaction: ${swapTxHash}`);
      if (transferTxHash) {
        console.log(`✅ Transfer Transaction: ${transferTxHash}`);
      }
      console.log(`💰 USDC Swapped: ${usdcAmount / 1000000} USDC`);
      console.log(`📍 Final Destination: ${destinationWallet}`);

      return {
        swapTxHash,
        transferTxHash,
        usdcAmount: usdcAmount.toString(),
        estimatedWETH: quote.estimatedWETH,
        destinationWallet,
        senderWallet: this.account.address,
      };

    } catch (error) {
      console.error("❌ Swap failed:", error);
      throw error;
    }
  }

  /**
   * Get WETH balance of sender wallet
   */
  private async getWETHBalance(): Promise<bigint> {
    try {
      const balance = await this.publicClient.readContract({
        address: this.config.wethAddress as Hex,
        abi: [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
          },
        ],
        functionName: 'balanceOf',
        args: [this.account.address],
      });

      return balance as bigint;
    } catch (error) {
      console.error("Error getting WETH balance:", error);
      return 0n;
    }
  }

  /**
   * Transfer WETH to destination wallet
   */
  private async transferWETH(destinationWallet: string, amount: bigint): Promise<string> {
    try {
      const txHash = await this.walletClient.writeContract({
        address: this.config.wethAddress as Hex,
        abi: [
          {
            name: 'transfer',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
            outputs: [{ name: '', type: 'bool' }],
          },
        ],
        functionName: 'transfer',
        args: [destinationWallet as Hex, amount],
        account: this.account,
        chain: base,
      });

      return txHash;
    } catch (error) {
      console.error("Error transferring WETH:", error);
      throw error;
    }
  }

  /**
   * Get current wallet balances
   */
  async getBalances(): Promise<{
    usdcBalance: string;
    wethBalance: string;
    ethBalance: string;
  }> {
    try {
      // Get USDC balance
      const usdcBalance = await this.publicClient.readContract({
        address: this.config.usdcAddress as Hex,
        abi: [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
          },
        ],
        functionName: 'balanceOf',
        args: [this.account.address],
      });

      // Get WETH balance
      const wethBalance = await this.getWETHBalance();

      // Get ETH balance
      const ethBalance = await this.publicClient.getBalance({
        address: this.account.address,
      });

      return {
        usdcBalance: (Number(usdcBalance) / 1000000).toString(), // USDC has 6 decimals
        wethBalance: (Number(wethBalance) / 1e18).toString(), // WETH has 18 decimals
        ethBalance: (Number(ethBalance) / 1e18).toString(), // ETH has 18 decimals
      };
    } catch (error) {
      console.error("Error getting balances:", error);
      throw error;
    }
  }
}

/**
 * Convenience function to create swapper and perform swap
 * @param destinationWallet - Wallet to receive WETH
 * @param usdcAmount - Amount of USDC to swap (in smallest units)
 * @param privateKey - Private key (optional, uses env if not provided)
 * @param customConfig - Optional custom configuration
 */
export async function swapUSDCToWETHForWallet(
  destinationWallet: string,
  usdcAmount: number,
  privateKey?: string,
  customConfig?: Partial<SwapConfig>
) {
  // Get configuration from environment or parameters
  const config: SwapConfig = {
    privateKey: privateKey || process.env.PRIVATE_KEY!,
    apiKey: process.env.API_KEY!,
    rpcUrl: process.env.RPC_URL!,
    ...customConfig,
  };

  // Validate required environment variables
  if (!config.privateKey || !config.apiKey || !config.rpcUrl) {
    throw new Error('Missing required configuration. Please set PRIVATE_KEY, API_KEY, and RPC_URL in environment or pass them as parameters.');
  }

  const swapper = new USDCToWETHSwapper(config);
  return await swapper.swapUSDCToWETH(destinationWallet, usdcAmount);
}
