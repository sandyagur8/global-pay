import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { rootstock, rootstockTestnet, hardhat } from 'wagmi/chains';

// Define local Hardhat network configuration
const hardhatConfig = {
  ...hardhat,
  id: 1337,
  name: 'Hardhat Local',
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
};

// Define Rootstock Testnet configuration
const rootstockTestnetConfig = {
  ...rootstockTestnet,
  rpcUrls: {
    default: {
      http: ['https://public-node.testnet.rsk.co'],
    },
    public: {
      http: ['https://public-node.testnet.rsk.co'],
    },
  },
};

export const config = getDefaultConfig({
  appName: 'Global Pay',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [hardhatConfig, rootstockTestnetConfig],
  ssr: true,
});

// Contract addresses from deployment
export const CONTRACTS = {
  FACTORY: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  USDC: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
} as const;

// Network configuration
export const NETWORK_CONFIG = {
  chainId: 31, // Rootstock Testnet
  rpcUrl: 'https://public-node.testnet.rsk.co',
  blockExplorer: 'https://explorer.testnet.rsk.co',
} as const;
