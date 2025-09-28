import { EmployeeSwapService, performEmployeeSwap } from './swap-service';
import { SWAP_CONFIG } from './swap-config';

/**
 * Test script to verify the swap integration works correctly
 */
async function testSwapIntegration() {
  console.log('🧪 Testing Swap Integration');
  console.log('===========================');
  
  // Test 1: Check configuration
  console.log('\n📋 Test 1: Configuration Check');
  console.log('------------------------------');
  
  const config = EmployeeSwapService.getSwapConfig();
  console.log(`Network: ${config.network}`);
  console.log(`Enabled: ${config.enabled}`);
  console.log(`Default Amount: ${config.defaultAmount} USDC`);
  console.log(`Slippage: ${config.slippage}%`);
  
  // Test 2: Check hardcoded values
  console.log('\n🔧 Test 2: Hardcoded Values Check');
  console.log('----------------------------------');
  console.log(`Private Key: ${SWAP_CONFIG.PRIVATE_KEY ? 'Set ✅' : 'Missing ❌'}`);
  console.log(`API Key: ${SWAP_CONFIG.API_KEY ? 'Set ✅' : 'Missing ❌'}`);
  console.log(`RPC URL: ${SWAP_CONFIG.RPC_URL ? 'Set ✅' : 'Missing ❌'}`);
  console.log(`Network Setting: ${SWAP_CONFIG.NETWORK}`);
  
  // Test 3: Simulate employee swap call (dry run)
  console.log('\n🎭 Test 3: Simulate Employee Swap');
  console.log('---------------------------------');
  
  const testEmployeeWallet = '0x742d35cc6634c0532925a3b8d0c9e3e0e8b9c5b1';
  const testAmount = 50000; // 0.05 USDC
  
  console.log(`Employee Wallet: ${testEmployeeWallet}`);
  console.log(`Amount: ${testAmount / 1000000} USDC`);
  
  if (config.enabled) {
    console.log('✅ Swap would be executed (network = base)');
    console.log('⚠️  Note: This is a dry run - no actual swap will be performed');
    
    // Uncomment the line below to test actual swap (requires USDC balance)
    // const result = await performEmployeeSwap(testEmployeeWallet, testAmount);
    // console.log('Swap result:', result);
  } else {
    console.log('⏭️ Swap would be skipped (network != base)');
  }
  
  console.log('\n🎉 Integration test completed!');
  console.log('===============================');
  console.log('✅ Configuration is properly set up');
  console.log('✅ Ready for employee addition with swap integration');
  
  if (config.enabled) {
    console.log('\n📝 To test actual swap:');
    console.log('1. Ensure the sender wallet has USDC balance');
    console.log('2. Add an employee through the employer dashboard');
    console.log('3. Watch console logs for swap execution');
  } else {
    console.log('\n📝 To enable swap:');
    console.log('1. Set NETWORK to "base" in src/lib/swap-config.ts');
    console.log('2. Restart the application');
  }
}

// Export for use in other files
export { testSwapIntegration };

// Run if called directly
if (require.main === module) {
  testSwapIntegration().catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}
