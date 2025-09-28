import { ethers } from 'ethers';
import { config, validateConfig } from './config';
import { ENSService } from './ensUtils';

async function sleep(seconds: number): Promise<void> {
  console.log(`⏳ Waiting ${seconds} seconds...`);
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function registerENSDomain() {
  try {
    // Validate configuration
    validateConfig();
    
    console.log('🚀 Starting ENS Domain Registration on Sepolia Testnet');
    console.log('================================================');
    
    // Initialize ENS service
    const ensService = new ENSService(config.PRIVATE_KEY, config.SEPOLIA_RPC_URL);
    
    // Check wallet balance
    const balance = await ensService.getBalance();
    console.log(`💰 Wallet Balance: ${balance} ETH`);
    
    if (parseFloat(balance) < 0.01) {
      throw new Error('Insufficient balance. You need at least 0.01 ETH for registration + gas fees');
    }
    
    const domainName = config.DOMAIN_NAME;
    const duration = config.REGISTRATION_DURATION;
    const owner = new ethers.Wallet(config.PRIVATE_KEY).address;
    
    console.log(`📋 Domain: ${domainName}.eth`);
    console.log(`👤 Owner: ${owner}`);
    console.log(`⏱️  Duration: ${duration / (365 * 24 * 60 * 60)} year(s)`);
    
    // Step 1: Check if domain is available
    console.log('\\n🔍 Step 1: Checking domain availability...');
    const isAvailable = await ensService.isAvailable(domainName);
    
    if (!isAvailable) {
      throw new Error(`❌ Domain ${domainName}.eth is not available for registration`);
    }
    
    console.log(`✅ Domain ${domainName}.eth is available!`);
    
    // Step 2: Get registration cost
    console.log('\\n💰 Step 2: Getting registration cost...');
    const cost = await ensService.getRegistrationCost(domainName, duration);
    const costInEth = ethers.formatEther(cost);
    
    console.log(`💵 Registration cost: ${costInEth} ETH`);
    
    // Add 20% buffer for gas and price fluctuations
    const totalCostWithBuffer = cost + (cost * BigInt(20) / BigInt(100));
    const totalCostInEth = ethers.formatEther(totalCostWithBuffer);
    
    console.log(`💵 Total cost (with buffer): ${totalCostInEth} ETH`);
    
    if (parseFloat(balance) < parseFloat(totalCostInEth)) {
      throw new Error(`Insufficient balance. Need ${totalCostInEth} ETH but only have ${balance} ETH`);
    }
    
    // Step 3: Generate secret and make commitment
    console.log('\\n🔐 Step 3: Generating commitment...');
    const secret = ensService.generateSecret();
    console.log(`🔑 Secret generated: ${secret}`);
    
    const commitment = await ensService.makeCommitment(
      domainName,
      owner,
      duration,
      secret
    );
    
    console.log(`📝 Commitment hash: ${commitment}`);
    
    // Step 4: Submit commitment
    console.log('\\n📤 Step 4: Submitting commitment...');
    const commitTx = await ensService.submitCommitment(commitment);
    console.log(`⏳ Waiting for commitment confirmation...`);
    
    const commitReceipt = await commitTx.wait();
    console.log(`✅ Commitment confirmed in block ${commitReceipt?.blockNumber}`);
    
    // Step 5: Wait for minimum commitment age
    const minAge = await ensService.getMinCommitmentAge();
    console.log(`\\n⏰ Step 5: Waiting for minimum commitment age (${minAge} seconds)...`);
    
    // Wait for minimum commitment age + 10 seconds buffer
    await sleep(minAge + 10);
    
    // Step 6: Check if commitment is ready
    console.log('\\n🔍 Step 6: Verifying commitment readiness...');
    const isReady = await ensService.isCommitmentReady(commitment);
    
    if (!isReady) {
      throw new Error('Commitment is not ready yet. Please wait longer.');
    }
    
    console.log('✅ Commitment is ready for reveal!');
    
    // Step 7: Register the domain
    console.log('\\n🎯 Step 7: Registering domain...');
    const registerTx = await ensService.registerDomain(
      domainName,
      owner,
      duration,
      secret,
      cost
    );
    
    console.log(`⏳ Waiting for registration confirmation...`);
    const registerReceipt = await registerTx.wait();
    
    console.log('\\n🎉 SUCCESS! Domain registered successfully!');
    console.log('==========================================');
    console.log(`✅ Domain: ${domainName}.eth`);
    console.log(`📋 Transaction: ${registerTx.hash}`);
    console.log(`🏗️  Block: ${registerReceipt?.blockNumber}`);
    console.log(`💰 Cost: ${costInEth} ETH`);
    console.log(`👤 Owner: ${owner}`);
    
    // Save registration details
    const registrationDetails = {
      domain: `${domainName}.eth`,
      owner,
      transactionHash: registerTx.hash,
      blockNumber: registerReceipt?.blockNumber,
      cost: costInEth,
      duration: duration,
      timestamp: new Date().toISOString(),
      secret // Save for future reference
    };
    
    console.log('\\n📄 Registration Details:');
    console.log(JSON.stringify(registrationDetails, null, 2));
    
    return registrationDetails;
    
  } catch (error) {
    console.error('\\n❌ Registration failed:', error);
    throw error;
  }
}

// Run the registration if this file is executed directly
if (require.main === module) {
  registerENSDomain()
    .then(() => {
      console.log('\\n✨ Registration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\\n💥 Registration failed:', error.message);
      process.exit(1);
    });
}

export { registerENSDomain };

