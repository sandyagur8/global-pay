import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { rootstockTestnet, hardhat } from 'wagmi/chains';

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

import deployedAddresses from '../../deployed-addresses.json';

// Contract addresses from deployment
export const CONTRACTS = {
    FACTORY: deployedAddresses.OrganizationFactory,
    USDC: deployedAddresses.MockUSDC,
} as const;

