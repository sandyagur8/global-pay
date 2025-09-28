import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { rootstockTestnet, hardhat } from 'wagmi/chains';


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

import deployedAddresses from '../../deployed-addresses.json';

// Contract addresses from deployment
export const CONTRACTS = {
    VERIFIER: deployedAddresses.Groth16Verifier,
    FACTORY: deployedAddresses.OrganisationFactory,
    MOCK_ERC20: deployedAddresses.MockERC20,
} as const;

