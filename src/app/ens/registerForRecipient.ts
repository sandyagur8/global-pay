import { ethers } from 'ethers';
import { config } from './config';

// Correct ENS Registrar Controller ABI for Sepolia
export const ENS_REGISTRAR_ABI_V2 = [
  // Check if name is available
  'function available(string calldata name) external view returns (bool)',
  
  // Get registration cost - returns a struct with base and premium
  'function rentPrice(string calldata name, uint256 duration) external view returns (tuple(uint256 base, uint256 premium))',
  
  // Register domain with struct parameter
  'function register(tuple(string label, address owner, uint256 duration, bytes32 secret, address resolver, bytes[] data, uint8 reverseRecord, bytes32 referrer) registration) external payable',
  
  // Make commitment with struct parameter
  'function makeCommitment(tuple(string label, address owner, uint256 duration, bytes32 secret, address resolver, bytes[] data, uint8 reverseRecord, bytes32 referrer) registration) external pure returns (bytes32)',
  
  // Commit the commitment
  'function commit(bytes32 commitment) external',
  
  // Check commitment timestamp
  'function commitments(bytes32) external view returns (uint256)',
  
  // Minimum commitment age
  'function minCommitmentAge() external view returns (uint256)',
  
  // Maximum commitment age  
  'function maxCommitmentAge() external view returns (uint256)'
];

// ENS Registry ABI for ownership transfer
export const ENS_REGISTRY_ABI = [
  'function setOwner(bytes32 node, address owner) external',
  'function owner(bytes32 node) external view returns (address)'
];

export class ENSRegistrationService {
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;
  private registrarController: ethers.Contract;
  private ensRegistry: ethers.Contract;

  constructor(privateKey: string, rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    
    this.registrarController = new ethers.Contract(
      config.ENS_REGISTRAR_CONTROLLER,
      ENS_REGISTRAR_ABI_V2,
      this.wallet
    );
    
    this.ensRegistry = new ethers.Contract(
      config.ENS_REGISTRY,
      ENS_REGISTRY_ABI,
      this.wallet
    );
  }

  /**
   * Register an ENS domain and transfer ownership to recipient
   * @param recipientAddress - The address to receive ownership of the domain
   * @param domainName - The ENS domain name (without .eth)
   * @param duration - Registration duration in seconds (default: 1 year)
   * @returns Registration details
   */
  async registerDomainForRecipient(
    recipientAddress: string,
    domainName: string,
    duration: number = 31536000 // 1 year default
  ): Promise<{
    domain: string;
    recipient: string;
    registrar: string;
    transactionHash: string;
    transferHash: string;
    cost: string;
    blockNumber?: number;
  }> {
    try {
      // Ensure recipient address is properly checksummed at the start
      // Handle both checksummed and non-checksummed addresses
      const checksummedRecipient = ethers.getAddress(recipientAddress.toLowerCase());
      
      console.log('🚀 Starting ENS Domain Registration for Recipient');
      console.log('================================================');
      console.log(`📋 Domain: ${domainName}.eth`);
      console.log(`👤 Recipient: ${checksummedRecipient}`);
      console.log(`🔑 Registrar: ${this.wallet.address}`);
      console.log(`⏱️  Duration: ${duration / (365 * 24 * 60 * 60)} year(s)`);

      // Step 1: Check if domain is available
      console.log('\n🔍 Step 1: Checking domain availability...');
      const isAvailable = await this.registrarController.available(domainName);
      
      if (!isAvailable) {
        throw new Error(`❌ Domain ${domainName}.eth is not available for registration`);
      }
      
      console.log(`✅ Domain ${domainName}.eth is available!`);

      // Step 2: Get registration cost
      console.log('\n💰 Step 2: Getting registration cost...');
      const priceResult = await this.registrarController.rentPrice(domainName, duration);
      const cost = priceResult.base + priceResult.premium; // Total cost is base + premium
      const costInEth = ethers.formatEther(cost);
      
      console.log(`💵 Registration cost: ${costInEth} ETH (base: ${ethers.formatEther(priceResult.base)}, premium: ${ethers.formatEther(priceResult.premium)})`);

      // Add 20% buffer for gas and price fluctuations
      const totalCostWithBuffer = cost + (cost * BigInt(20) / BigInt(100));
      const totalCostInEth = ethers.formatEther(totalCostWithBuffer);
      
      console.log(`💵 Total cost (with buffer): ${totalCostInEth} ETH`);

      // Check wallet balance
      const balance = await this.provider.getBalance(this.wallet.address);
      const balanceInEth = ethers.formatEther(balance);
      
      if (balance < totalCostWithBuffer) {
        throw new Error(`Insufficient balance. Need ${totalCostInEth} ETH but only have ${balanceInEth} ETH`);
      }

      // Step 3: Generate secret and make commitment
      console.log('\n🔐 Step 3: Generating commitment...');
      const secret = this.generateSecret();
      console.log(`🔑 Secret generated: ${secret}`);
      
      // Create registration struct for makeCommitment
      const registrationStruct = {
        label: domainName,
        owner: this.wallet.address, // Register to our wallet first, then transfer
        duration: duration,
        secret: secret,
        resolver: config.ENS_RESOLVER,
        data: [], // Empty data array
        reverseRecord: 1, // Set reverse record (REVERSE_RECORD_ETHEREUM_BIT)
        referrer: ethers.ZeroHash // No referrer
      };
      
      const commitment = await this.registrarController.makeCommitment(registrationStruct);
      
      console.log(`📝 Commitment hash: ${commitment}`);

      // Step 4: Submit commitment
      console.log('\n📤 Step 4: Submitting commitment...');
      const commitTx = await this.registrarController.commit(commitment);
      console.log(`⏳ Waiting for commitment confirmation...`);
      
      const commitReceipt = await commitTx.wait();
      console.log(`✅ Commitment confirmed in block ${commitReceipt?.blockNumber}`);

      // Step 5: Wait for minimum commitment age
      const minAge = await this.registrarController.minCommitmentAge();
      console.log(`\n⏰ Step 5: Waiting for minimum commitment age (${minAge} seconds)...`);
      
      // Wait for minimum commitment age + 10 seconds buffer
      await this.sleep(Number(minAge) + 10);

      // Step 6: Check if commitment is ready
      console.log('\n🔍 Step 6: Verifying commitment readiness...');
      const isReady = await this.isCommitmentReady(commitment);
      
      if (!isReady) {
        throw new Error('Commitment is not ready yet. Please wait longer.');
      }
      
      console.log('✅ Commitment is ready for reveal!');

      // Step 7: Register the domain (to our wallet first)
      console.log('\n🎯 Step 7: Registering domain...');
      const registerTx = await this.registrarController.register(
        registrationStruct, // Use the same struct as for commitment
        { value: cost }
      );
      
      console.log(`⏳ Waiting for registration confirmation...`);
      const registerReceipt = await registerTx.wait();
      
      console.log('\n🎉 Domain registered successfully!');
      console.log(`📋 Transaction: ${registerTx.hash}`);
      console.log(`🏗️  Block: ${registerReceipt?.blockNumber}`);

      // Step 8: Transfer ownership to recipient
      console.log('\n🔄 Step 8: Transferring ownership to recipient...');
      const namehash = ethers.namehash(`${domainName}.eth`);
      
      const transferTx = await this.ensRegistry.setOwner(namehash, checksummedRecipient);
      console.log(`⏳ Waiting for ownership transfer confirmation...`);
      
      const transferReceipt = await transferTx.wait();
      
      console.log('\n🎉 SUCCESS! Domain registered and transferred!');
      console.log('============================================');
      console.log(`✅ Domain: ${domainName}.eth`);
      console.log(`👤 New Owner: ${checksummedRecipient}`);
      console.log(`📋 Registration Tx: ${registerTx.hash}`);
      console.log(`🔄 Transfer Tx: ${transferTx.hash}`);
      console.log(`💰 Cost: ${costInEth} ETH`);

      // Verify ownership transfer
      const newOwner = await this.ensRegistry.owner(namehash);
      if (newOwner.toLowerCase() !== checksummedRecipient.toLowerCase()) {
        console.warn('⚠️  Warning: Ownership transfer may not have completed properly');
      } else {
        console.log('✅ Ownership transfer verified!');
      }

      return {
        domain: `${domainName}.eth`,
        recipient: checksummedRecipient,
        registrar: this.wallet.address,
        transactionHash: registerTx.hash,
        transferHash: transferTx.hash,
        cost: costInEth,
        blockNumber: registerReceipt?.blockNumber
      };

    } catch (error) {
      console.error('\n❌ Registration failed:', error);
      throw error;
    }
  }

  /**
   * Generate a random secret for the commit-reveal scheme
   */
  private generateSecret(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  /**
   * Check if commitment is ready for reveal (after minimum age)
   */
  private async isCommitmentReady(commitment: string): Promise<boolean> {
    try {
      const commitmentTimestamp = await this.registrarController.commitments(commitment);
      const minAge = await this.registrarController.minCommitmentAge();
      const maxAge = await this.registrarController.maxCommitmentAge();
      
      const now = Math.floor(Date.now() / 1000);
      const commitmentAge = now - Number(commitmentTimestamp);
      
      return commitmentAge >= Number(minAge) && commitmentAge <= Number(maxAge);
    } catch (error) {
      console.error('Error checking commitment readiness:', error);
      return false;
    }
  }

  /**
   * Sleep for specified number of seconds
   */
  private async sleep(seconds: number): Promise<void> {
    console.log(`⏳ Waiting ${seconds} seconds...`);
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  /**
   * Check if a domain is available
   */
  async isAvailable(name: string): Promise<boolean> {
    try {
      return await this.registrarController.available(name);
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  }

  /**
   * Get registration cost
   */
  async getRegistrationCost(name: string, duration: number): Promise<bigint> {
    try {
      const priceResult = await this.registrarController.rentPrice(name, duration);
      return priceResult.base + priceResult.premium; // Return total cost
    } catch (error) {
      console.error('Error getting registration cost:', error);
      throw error;
    }
  }
}

// Convenience function for easy usage
export async function registerENSForRecipient(
  recipientAddress: string,
  domainName: string,
  privateKey?: string,
  duration: number = 31536000
): Promise<{
  domain: string;
  recipient: string;
  registrar: string;
  transactionHash: string;
  transferHash: string;
  cost: string;
  blockNumber?: number;
}> {
  const key = privateKey || config.PRIVATE_KEY;
  if (!key) {
    throw new Error('Private key is required');
  }

  const service = new ENSRegistrationService(key, config.SEPOLIA_RPC_URL);
  return await service.registerDomainForRecipient(recipientAddress, domainName, duration);
}
