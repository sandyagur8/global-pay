export const config = {
  // Network configuration - hardcoded values
  PRIVATE_KEY: '5234730d85c756889efeebbee4d9d8325413b9bf9bf9655fb6b71905b96f0ed2',
  INFURA_API_KEY: '7d057f5911fc425089e1875e10c12554',
  ALCHEMY_API_KEY: '',
  
  // Domain configuration - will be dynamic based on organization name
  DOMAIN_NAME: 'hkbkjdclncklndc', // default fallback
  REGISTRATION_DURATION: 31536000, // 1 year
  
  // Sepolia ENS Contract Addresses (official testnet addresses)
  ENS_REGISTRY: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  ENS_REGISTRAR_CONTROLLER: '0xfb3cE5D01e0f33f41DbB39035dB9745962F1f968',
  ENS_BASE_REGISTRAR: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
  ENS_RESOLVER: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD',
  
  // Network settings
  SEPOLIA_RPC_URL: `https://sepolia.infura.io/v3/7d057f5911fc425089e1875e10c12554`,
    
  CHAIN_ID: 11155111, // Sepolia chain ID
};

// Validation
export function validateConfig() {
  // All values are now hardcoded, so validation is minimal
  if (!config.PRIVATE_KEY || !config.INFURA_API_KEY) {
    throw new Error('Configuration error: Missing required hardcoded values');
  }
}

