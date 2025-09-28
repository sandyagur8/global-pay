import { ethers } from 'ethers';
import { config, validateConfig } from './config';
import { ENSService } from './ensUtils';

async function checkDomainStatus() {
  try {
    // Validate configuration
    validateConfig();
    
    console.log('🔍 Checking ENS Domain Status on Sepolia Testnet');
    console.log('===============================================');
    
    // Initialize ENS service
    const ensService = new ENSService(config.PRIVATE_KEY, config.SEPOLIA_RPC_URL);
    
    const domainName = config.DOMAIN_NAME;
    console.log(`📋 Domain: ${domainName}.eth`);
    
    // Check availability
    console.log('\\n🔍 Checking availability...');
    const isAvailable = await ensService.isAvailable(domainName);
    console.log(`Available: ${isAvailable ? '✅ Yes' : '❌ No'}`);
    
    if (isAvailable) {
      // Get registration cost
      console.log('\\n💰 Getting registration cost...');
      try {
        const cost = await ensService.getRegistrationCost(domainName, config.REGISTRATION_DURATION);
        const costInEth = ethers.formatEther(cost);
        console.log(`Registration cost: ${costInEth} ETH`);
        console.log(`Duration: ${config.REGISTRATION_DURATION / (365 * 24 * 60 * 60)} year(s)`);
      } catch (error) {
        console.log('❌ Could not get registration cost');
      }
    }
    
    // Check wallet balance
    console.log('\\n💰 Wallet information...');
    const balance = await ensService.getBalance();
    const walletAddress = new ethers.Wallet(config.PRIVATE_KEY).address;
    console.log(`Wallet: ${walletAddress}`);
    console.log(`Balance: ${balance} ETH`);
    
    // Get commitment timing info
    console.log('\\n⏰ Commitment timing...');
    const minAge = await ensService.getMinCommitmentAge();
    console.log(`Minimum commitment age: ${minAge} seconds (${Math.floor(minAge / 60)} minutes)`);
    
    console.log('\\n✅ Domain check completed!');
    
  } catch (error) {
    console.error('\\n❌ Error checking domain:', error);
    throw error;
  }
}

// Run the check if this file is executed directly
if (require.main === module) {
  checkDomainStatus()
    .then(() => {
      console.log('\\n✨ Check completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\\n💥 Check failed:', error.message);
      process.exit(1);
    });
}

export { checkDomainStatus };

