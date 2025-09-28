import { ethers } from 'ethers';
import { config } from './config';

// ENS Registrar Controller ABI (simplified for registration)
export const ENS_REGISTRAR_ABI = [
  // Check if name is available
  'function available(string calldata name) external view returns (bool)',
  
  // Get registration cost
  'function rentPrice(string calldata name, uint256 duration) external view returns (uint256)',
  
  // Register domain
  'function register(string calldata name, address owner, uint256 duration, bytes32 secret, address resolver, bytes[] calldata data, bool reverseRecord, uint32 fuses, uint64 wrapperExpiry) external payable',
  
  // Commit to register (for commit-reveal scheme)
  'function makeCommitment(string calldata name, address owner, uint256 duration, bytes32 secret, address resolver, bytes[] calldata data, bool reverseRecord, uint32 fuses, uint64 wrapperExpiry) external pure returns (bytes32)',
  
  // Commit the commitment
  'function commit(bytes32 commitment) external',
  
  // Check commitment timestamp
  'function commitments(bytes32) external view returns (uint256)',
  
  // Minimum commitment age
  'function minCommitmentAge() external view returns (uint256)',
  
  // Maximum commitment age  
  'function maxCommitmentAge() external view returns (uint256)'
];

// ENS Base Registrar ABI (for checking ownership)
export const ENS_BASE_REGISTRAR_ABI = [
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function nameExpires(uint256 id) external view returns (uint256)',
  'function available(uint256 id) external view returns (bool)'
];

export class ENSService {
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;
  private registrarController: ethers.Contract;
  private baseRegistrar: ethers.Contract;

  constructor(privateKey: string, rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    
    this.registrarController = new ethers.Contract(
      config.ENS_REGISTRAR_CONTROLLER,
      ENS_REGISTRAR_ABI,
      this.wallet
    );
    
    this.baseRegistrar = new ethers.Contract(
      config.ENS_BASE_REGISTRAR,
      ENS_BASE_REGISTRAR_ABI,
      this.provider
    );
  }

  /**
   * Check if a domain name is available for registration
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
   * Get the cost to register a domain for specified duration
   */
  async getRegistrationCost(name: string, duration: number): Promise<bigint> {
    try {
      return await this.registrarController.rentPrice(name, duration);
    } catch (error) {
      console.error('Error getting registration cost:', error);
      throw error;
    }
  }

  /**
   * Generate a random secret for the commit-reveal scheme
   */
  generateSecret(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  /**
   * Make a commitment for domain registration
   */
  async makeCommitment(
    name: string,
    owner: string,
    duration: number,
    secret: string,
    resolver: string = config.ENS_RESOLVER,
    reverseRecord: boolean = true
  ): Promise<string> {
    try {
      const commitment = await this.registrarController.makeCommitment(
        name,
        owner,
        duration,
        secret,
        resolver,
        [], // data
        reverseRecord,
        0, // fuses
        0  // wrapperExpiry
      );
      return commitment;
    } catch (error) {
      console.error('Error making commitment:', error);
      throw error;
    }
  }

  /**
   * Submit commitment to the blockchain
   */
  async submitCommitment(commitment: string): Promise<ethers.TransactionResponse> {
    try {
      const tx = await this.registrarController.commit(commitment);
      console.log(`📝 Commitment submitted: ${tx.hash}`);
      return tx;
    } catch (error) {
      console.error('Error submitting commitment:', error);
      throw error;
    }
  }

  /**
   * Check if commitment is ready for reveal (after minimum age)
   */
  async isCommitmentReady(commitment: string): Promise<boolean> {
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
   * Register the domain (reveal phase)
   */
  async registerDomain(
    name: string,
    owner: string,
    duration: number,
    secret: string,
    cost: bigint,
    resolver: string = config.ENS_RESOLVER,
    reverseRecord: boolean = true
  ): Promise<ethers.TransactionResponse> {
    try {
      const tx = await this.registrarController.register(
        name,
        owner,
        duration,
        secret,
        resolver,
        [], // data
        reverseRecord,
        0, // fuses
        0, // wrapperExpiry
        { value: cost }
      );
      
      console.log(`🎉 Registration transaction submitted: ${tx.hash}`);
      return tx;
    } catch (error) {
      console.error('Error registering domain:', error);
      throw error;
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  /**
   * Get minimum commitment age in seconds
   */
  async getMinCommitmentAge(): Promise<number> {
    return Number(await this.registrarController.minCommitmentAge());
  }
}

