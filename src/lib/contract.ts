import { getPublicClient, getWalletClient } from 'wagmi/actions';
import { config } from './web3';
import { OrganizationFactoryABI, MockUSDCABI, OrganizationABI } from './abis';
import { CONTRACTS } from './web3';
import { Abi, decodeEventLog, parseAbiItem } from 'viem';

export async function getContract(address: `0x${string}`, abi: Abi) {
  const publicClient = getPublicClient(config);
  const walletClient = await getWalletClient(config);

  if (!publicClient || !walletClient) {
    return null;
  }

  return {
    address,
    abi,
    public: publicClient,
    wallet: walletClient,
  };
}

export async function createOrganization(organizationName: string, paymentToken: `0x${string}`) {
    const factoryContract = await getContract(CONTRACTS.FACTORY as `0x${string}`, OrganizationFactoryABI as Abi);
    if (!factoryContract) return;

    const { request } = await factoryContract.public.simulateContract({
        address: factoryContract.address,
        abi: factoryContract.abi,
        functionName: 'createOrganization',
        args: [organizationName, paymentToken],
        account: factoryContract.wallet.account.address,
    });

    const hash = await factoryContract.wallet.writeContract(request);
    const receipt = await factoryContract.public.waitForTransactionReceipt({ hash });

    const log = receipt.logs.find(
        (l) => l.address.toLowerCase() === factoryContract.address.toLowerCase()
    );

    if (!log) {
        throw new Error("OrganizationCreated event log not found");
    }

    const event = parseAbiItem('event OrganizationCreated(address indexed owner, address indexed organizationContract, string name)');
    const decodedLog = decodeEventLog({
        abi: [event],
        data: log.data,
        topics: log.topics,
    });

    return (decodedLog.args as { organizationContract: `0x${string}` }).organizationContract;
}

export async function approveUSDC(spender: `0x${string}`, amount: bigint) {
    const usdcContract = await getContract(CONTRACTS.USDC as `0x${string}`, MockUSDCABI as Abi);
    if (!usdcContract) return;

    const { request } = await usdcContract.public.simulateContract({
        address: usdcContract.address,
        abi: usdcContract.abi,
        functionName: 'approve',
        args: [spender, amount],
        account: usdcContract.wallet.account.address,
    });

    const hash = await usdcContract.wallet.writeContract(request);
    return hash;
}

export async function depositFunds(organizationAddress: `0x${string}`, amount: bigint) {
    const organizationContract = await getContract(organizationAddress, OrganizationABI as Abi);
    if (!organizationContract) return;

    const { request } = await organizationContract.public.simulateContract({
        address: organizationContract.address,
        abi: organizationContract.abi,
        functionName: 'depositFunds',
        args: [amount],
        account: organizationContract.wallet.account.address,
    });

    const hash = await organizationContract.wallet.writeContract(request);
    return hash;
}
