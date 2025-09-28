import { SWAP_CONFIG, validateSwapConfig, shouldEnableSwap } from './swap-config';

// Import the swap functionality from the 1inch directory
import { swapUSDCToWETHForWallet } from '@/app/1inch/usdcToWethSwap';

/**
 * Service for handling USDC to WETH swaps after employee addition
 */
export class EmployeeSwapService {
  
  /**
   * Perform USDC to WETH swap for an employee after they are added
   * @param employeeWallet - The employee's wallet address to receive WETH
   * @param usdcAmount - Amount of USDC to swap (optional, uses default if not provided)
   * @returns Swap result or null if swap is disabled
   */
  static async swapForEmployee(
    employeeWallet: string,
    usdcAmount?: number
  ): Promise<{
    success: boolean;
    swapTxHash?: string;
    transferTxHash?: string;
    usdcAmount: string;
    estimatedWETH: string;
    error?: string;
  } | null> {
    
    console.log('🔍 Checking if swap should be enabled...');
    console.log(`Network setting: ${SWAP_CONFIG.NETWORK}`);
    
    // Check if swap is enabled based on network setting
    if (!shouldEnableSwap()) {
      console.log('⏭️ Swap disabled - network is not set to "base", continuing with other logic');
      return null;
    }
    
    console.log('✅ Swap enabled - proceeding with 1inch swap');
    
    try {
      // Validate configuration
      validateSwapConfig();
      
      const swapAmount = usdcAmount || SWAP_CONFIG.DEFAULT_USDC_AMOUNT;
      
      console.log('🚀 Starting USDC to WETH swap for employee');
      console.log('==========================================');
      console.log(`👤 Employee wallet: ${employeeWallet}`);
      console.log(`💰 USDC amount: ${swapAmount / 1000000} USDC`);
      console.log(`🔑 Sender: Will use hardcoded private key`);
      
      // Perform the swap using the hardcoded configuration
      const result = await swapUSDCToWETHForWallet(
        employeeWallet,
        swapAmount,
        SWAP_CONFIG.PRIVATE_KEY, // Use hardcoded private key
        {
          apiKey: SWAP_CONFIG.API_KEY,
          rpcUrl: SWAP_CONFIG.RPC_URL,
          slippage: SWAP_CONFIG.SLIPPAGE,
        }
      );
      
      console.log('🎉 Swap completed successfully!');
      console.log('==============================');
      console.log(`✅ Swap Transaction: ${result.swapTxHash}`);
      
      if (result.transferTxHash) {
        console.log(`✅ Transfer Transaction: ${result.transferTxHash}`);
      }
      
      console.log(`💰 USDC Swapped: ${parseInt(result.usdcAmount) / 1000000} USDC`);
      console.log(`💎 Estimated WETH: ${parseInt(result.estimatedWETH) / 1e18} WETH`);
      console.log(`📍 Final Destination: ${result.destinationWallet}`);
      
      return {
        success: true,
        swapTxHash: result.swapTxHash,
        transferTxHash: result.transferTxHash,
        usdcAmount: result.usdcAmount,
        estimatedWETH: result.estimatedWETH,
      };
      
    } catch (error) {
      console.error('❌ Swap failed:', error);
      
      return {
        success: false,
        usdcAmount: (usdcAmount || SWAP_CONFIG.DEFAULT_USDC_AMOUNT).toString(),
        estimatedWETH: '0',
        error: error instanceof Error ? error.message : 'Unknown swap error',
      };
    }
  }
  
  /**
   * Get current swap configuration for display purposes
   */
  static getSwapConfig() {
    return {
      network: SWAP_CONFIG.NETWORK,
      enabled: shouldEnableSwap(),
      defaultAmount: SWAP_CONFIG.DEFAULT_USDC_AMOUNT / 1000000, // Convert to readable USDC
      slippage: SWAP_CONFIG.SLIPPAGE,
    };
  }
}

/**
 * Convenience function for quick employee swap
 * @param employeeWallet - Employee wallet address
 * @param usdcAmount - Optional USDC amount
 */
export async function performEmployeeSwap(
  employeeWallet: string,
  usdcAmount?: number
) {
  return await EmployeeSwapService.swapForEmployee(employeeWallet, usdcAmount);
}
