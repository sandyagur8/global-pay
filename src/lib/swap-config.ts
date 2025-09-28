// Hardcoded configuration for 1inch swap functionality
export const SWAP_CONFIG = {
  // Hardcoded private key and API credentials
  PRIVATE_KEY: '5234730d85c756889efeebbee4d9d8325413b9bf9bf9655fb6b71905b96f0ed2',
  API_KEY: 'v3NhKwodxctgyf37jmModaiwElhEUW06',
  RPC_URL: 'https://mainnet.base.org',
  
  // Network setting - change this to control swap behavior
  NETWORK: 'base', // Set to 'base' to enable 1inch swap, anything else to skip
  
  // Token addresses on Base network
  USDC_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  WETH_ADDRESS: '0x4200000000000000000000000000000000000006',
  
  // Swap settings
  DEFAULT_USDC_AMOUNT: 100000, // 0.1 USDC (USDC has 6 decimals)
  SLIPPAGE: 1, // 1% slippage
  
  // Chain ID for Base
  CHAIN_ID: 8453,
} as const;

// Validation function
export function validateSwapConfig() {
  const errors: string[] = [];
  
  if (!SWAP_CONFIG.PRIVATE_KEY) {
    errors.push('PRIVATE_KEY is required');
  }
  
  if (!SWAP_CONFIG.API_KEY) {
    errors.push('API_KEY is required');
  }
  
  if (!SWAP_CONFIG.RPC_URL) {
    errors.push('RPC_URL is required');
  }
  
  if (errors.length > 0) {
    throw new Error(`Swap configuration errors:\n${errors.join('\n')}`);
  }
}

// Check if swap should be enabled
export function shouldEnableSwap(): boolean {
  return false;
}
