import { swapUSDCToWETHForWallet, USDCToWETHSwapper } from './usdcToWethSwap';
import dotenv from 'dotenv';

dotenv.config();

async function testSwapFunction() {
  try {
    console.log('🧪 Testing USDC to WETH Swap Function');
    console.log('====================================');

    // Example parameters
    const destinationWallet = '0x742d35cc6634c0532925a3b8d0c9e3e0e8b9c5b1'; // Replace with actual destination
    const usdcAmount = 100000; // 0.1 USDC (USDC has 6 decimals)

    console.log(`📍 Destination Wallet: ${destinationWallet}`);
    console.log(`💰 USDC Amount: ${usdcAmount / 1000000} USDC`);
    console.log(`🔑 Sender: ${process.env.WALLET_ADDRESS || 'From private key'}`);

    // Method 1: Using the convenience function
    console.log('\n🚀 Method 1: Using convenience function');
    console.log('=====================================');

    const result1 = await swapUSDCToWETHForWallet(
      destinationWallet,
      usdcAmount
    );

    console.log('✅ Swap completed successfully!');
    console.log('Result:', result1);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testSwapClass() {
  try {
    console.log('\n🧪 Testing USDC to WETH Swap Class');
    console.log('==================================');

    // Method 2: Using the class directly
    const swapper = new USDCToWETHSwapper({
      privateKey: process.env.PRIVATE_KEY!,
      apiKey: process.env.API_KEY!,
      rpcUrl: process.env.RPC_URL!,
      slippage: 1.5, // Custom 1.5% slippage
    });

    // Check current balances
    console.log('\n💰 Current Balances:');
    const balances = await swapper.getBalances();
    console.log(`USDC: ${balances.usdcBalance}`);
    console.log(`WETH: ${balances.wethBalance}`);
    console.log(`ETH: ${balances.ethBalance}`);

    // Get swap quote first
    const usdcAmount = 50000; // 0.05 USDC
    const destinationWallet = '0x742d35cc6634c0532925a3b8d0c9e3e0e8b9c5b1';

    console.log('\n📊 Getting swap quote...');
    const quote = await swapper.getSwapQuote(usdcAmount);
    console.log(`Estimated WETH: ${parseInt(quote.estimatedWETH) / 1e18}`);
    console.log(`Estimated Gas: ${quote.estimatedGas}`);
    console.log(`Price Impact: ${quote.priceImpact}%`);

    // Perform the swap
    console.log('\n🔄 Performing swap...');
    const result = await swapper.swapUSDCToWETH(
      destinationWallet,
      usdcAmount,
      1.5 // Custom slippage
    );

    console.log('✅ Swap completed successfully!');
    console.log('Result:', result);

  } catch (error) {
    console.error('❌ Class test failed:', error);
  }
}

async function main() {
  // Check required environment variables
  const requiredEnvVars = ['PRIVATE_KEY', 'API_KEY', 'RPC_URL'];
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      console.error(`❌ Missing required environment variable: ${key}`);
      console.log('\n📝 Please add the following to your .env file:');
      console.log('PRIVATE_KEY=your_private_key_here');
      console.log('API_KEY=your_1inch_api_key_here');
      console.log('RPC_URL=your_base_rpc_url_here');
      process.exit(1);
    }
  }

  console.log('🎯 All environment variables found!');
  
  // Run tests
  await testSwapFunction();
  await testSwapClass();
}

// Run the test
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unhandled error in main:', error);
    process.exit(1);
  });
}

export { testSwapFunction, testSwapClass };
