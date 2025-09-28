import { swapUSDCToWETHForWallet } from './usdcToWethSwap';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Simple example showing how to use the USDC to WETH swap function
 */
async function simpleSwapExample() {
  try {
    console.log('🚀 Simple USDC to WETH Swap Example');
    console.log('==================================');

    // Configuration
    const destinationWallet = '0x742d35cc6634c0532925a3b8d0c9e3e0e8b9c5b1'; // Replace with actual destination
    const usdcAmount = 100000; // 0.1 USDC (USDC has 6 decimals: 100000 = 0.1 USDC)

    console.log(`📍 Destination: ${destinationWallet}`);
    console.log(`💰 Amount: ${usdcAmount / 1000000} USDC`);
    console.log(`🔑 Sender: Will use private key from .env`);

    // Perform the swap
    const result = await swapUSDCToWETHForWallet(
      destinationWallet,
      usdcAmount
    );

    // Display results
    console.log('\n🎉 Swap Completed Successfully!');
    console.log('==============================');
    console.log(`✅ Swap Transaction: ${result.swapTxHash}`);
    
    if (result.transferTxHash) {
      console.log(`✅ Transfer Transaction: ${result.transferTxHash}`);
    }
    
    console.log(`💰 USDC Swapped: ${parseInt(result.usdcAmount) / 1000000} USDC`);
    console.log(`💎 Estimated WETH: ${parseInt(result.estimatedWETH) / 1e18} WETH`);
    console.log(`📍 Final Destination: ${result.destinationWallet}`);
    console.log(`🔑 Sender: ${result.senderWallet}`);

    return result;

  } catch (error) {
    console.error('❌ Swap failed:', error);
    throw error;
  }
}

// Export for use in other files
export { simpleSwapExample };

// Run if called directly
if (require.main === module) {
  // Check environment variables
  if (!process.env.PRIVATE_KEY || !process.env.API_KEY || !process.env.RPC_URL) {
    console.error('❌ Missing required environment variables!');
    console.log('\n📝 Please add these to your .env file:');
    console.log('PRIVATE_KEY=your_private_key_here');
    console.log('API_KEY=your_1inch_api_key_here');
    console.log('RPC_URL=https://mainnet.base.org');
    process.exit(1);
  }

  simpleSwapExample().catch((error) => {
    console.error('❌ Example failed:', error);
    process.exit(1);
  });
}
