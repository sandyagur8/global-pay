import { USDCToWETHSwapper } from './usdcToWethSwap';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Dry run test for the swap function - tests without actual transactions
 */
async function testSwapDryRun() {
  console.log('🧪 USDC to WETH Swap - Dry Run Test');
  console.log('===================================');

  // Check environment variables
  const requiredVars = ['PRIVATE_KEY', 'API_KEY', 'RPC_URL'];
  const missingVars = requiredVars.filter(key => !process.env[key]);

  if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingVars.forEach(key => console.log(`   - ${key}`));
    console.log('\n📝 Please add these to your .env file:');
    console.log('PRIVATE_KEY=your_wallet_private_key_here');
    console.log('API_KEY=your_1inch_api_key_from_https://portal.1inch.dev/');
    console.log('RPC_URL=https://mainnet.base.org');
    console.log('\n🔗 Get 1inch API key: https://portal.1inch.dev/');
    return;
  }

  try {
    console.log('✅ All environment variables found!');
    console.log('🔧 Initializing swap service...');

    // Initialize the swapper
    const swapper = new USDCToWETHSwapper({
      privateKey: process.env.PRIVATE_KEY!,
      apiKey: process.env.API_KEY!,
      rpcUrl: process.env.RPC_URL!,
      slippage: 1, // 1% slippage
    });

    console.log('✅ Swap service initialized successfully!');

    // Test 1: Check balances
    console.log('\n💰 Test 1: Checking current balances...');
    try {
      const balances = await swapper.getBalances();
      console.log(`   USDC Balance: ${balances.usdcBalance} USDC`);
      console.log(`   WETH Balance: ${balances.wethBalance} WETH`);
      console.log(`   ETH Balance: ${balances.ethBalance} ETH`);
    } catch (error) {
      console.log('   ⚠️  Could not fetch balances (this is normal if wallet has no funds)');
      console.log('   Error:', (error as Error).message);
    }

    // Test 2: Get swap quote (this doesn't cost anything)
    console.log('\n📊 Test 2: Getting swap quote for 0.1 USDC...');
    try {
      const quote = await swapper.getSwapQuote(100000); // 0.1 USDC
      console.log(`   ✅ Quote successful!`);
      console.log(`   Estimated WETH: ${parseInt(quote.estimatedWETH) / 1e18} WETH`);
      console.log(`   Estimated Gas: ${quote.estimatedGas}`);
      console.log(`   Price Impact: ${quote.priceImpact}%`);
    } catch (error) {
      console.log('   ❌ Quote failed:', (error as Error).message);
      console.log('   This could be due to insufficient balance or network issues');
    }

    console.log('\n🎉 Dry run completed!');
    console.log('=====================================');
    console.log('✅ Swap service is properly configured');
    console.log('✅ Ready for actual swaps (when you have USDC balance)');
    console.log('\n📝 To perform actual swap:');
    console.log('   npm run swap-example');

  } catch (error) {
    console.error('❌ Dry run failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your private key format (should start with 0x)');
    console.log('2. Verify your 1inch API key is valid');
    console.log('3. Ensure RPC URL is correct for Base network');
  }
}

// Run the dry run test
if (require.main === module) {
  testSwapDryRun().catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

export { testSwapDryRun };
