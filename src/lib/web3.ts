import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { rootstock, rootstockTestnet } from 'wagmi/chains';

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
  chains: [rootstockTestnetConfig],
  ssr: true,
});

// Contract addresses (to be updated after deployment)
export const CONTRACTS = {
  PAYROLL: process.env.NEXT_PUBLIC_PAYROLL_CONTRACT_ADDRESS || '',
} as const;

// Network configuration
export const NETWORK_CONFIG = {
  chainId: 31, // Rootstock Testnet
  rpcUrl: 'https://public-node.testnet.rsk.co',
  blockExplorer: 'https://explorer.testnet.rsk.co',
} as const;
