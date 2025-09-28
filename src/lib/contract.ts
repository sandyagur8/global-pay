import { getPublicClient, getWalletClient } from 'wagmi/actions';
import { config } from './web3';
import { OrganisationFactoryABI, MockERC20ABI, OrganisationABI } from './abis';
import { CONTRACTS } from './web3';
import { Abi, decodeEventLog, parseAbiItem } from 'viem';


export async function getContract(address: `0x${string}`, abi: Abi) {
    const publicClient = getPublicClient(config, { chainId: 1337 });
    const walletClient = await getWalletClient(config, { chainId: 1337 });

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

export async function deployOrganisation() {
    const factoryContract = await getContract(CONTRACTS.FACTORY as `0x${string}`, OrganisationFactoryABI as Abi);
    if (!factoryContract) return;

    const { request } = await factoryContract.public.simulateContract({
        address: factoryContract.address,
        abi: factoryContract.abi,
        functionName: 'deployOrganisation',
        args: [],
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

    const event = parseAbiItem('event OrganisationDeployed(uint256 indexed orgID, address indexed organisationAddress, address indexed owner, uint256 timestamp)');
    const decodedLog = decodeEventLog({
        abi: [event],
        data: log.data,
        topics: log.topics,
    });

    return {
        orgID: (decodedLog.args as { orgID: bigint }).orgID,
        organisationAddress: (decodedLog.args as { organisationAddress: `0x${string}` }).organisationAddress
    };
}

export async function approveERC20(spender: `0x${string}`, amount: bigint) {
    const erc20Contract = await getContract(CONTRACTS.MOCK_ERC20 as `0x${string}`, MockERC20ABI as Abi);
    if (!erc20Contract) return;

    const { request } = await erc20Contract.public.simulateContract({
        address: erc20Contract.address,
        abi: erc20Contract.abi,
        functionName: 'approve',
        args: [spender, amount],
        account: erc20Contract.wallet.account.address,
    });

    const hash = await erc20Contract.wallet.writeContract(request);
    return hash;
}

export async function dispatchPayment(
    organisationAddress: `0x${string}`,
    employeeId: bigint,
    token: `0x${string}`,
    amount: bigint,
    pA: [bigint, bigint],
    pB: [[bigint, bigint], [bigint, bigint]],
    pC: [bigint, bigint],
    pubSignals: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
    stealthAddress: `0x${string}`
) {
    const organisationContract = await getContract(organisationAddress, OrganisationABI as Abi);
    if (!organisationContract) return;

    const { request } = await organisationContract.public.simulateContract({
        address: organisationContract.address,
        abi: organisationContract.abi,
        functionName: 'dispatchPayment',
        args: [employeeId, token, amount, pA, pB, pC, pubSignals, stealthAddress],
        account: organisationContract.wallet.account.address,
    });

    const hash = await organisationContract.wallet.writeContract(request);
    return hash;
}

export async function addEmployee(
    organisationAddress: `0x${string}`,
    publicViewerKey: [bigint, bigint],
    publicSpenderKey: [bigint, bigint],
) {
    const organisationContract = await getContract(organisationAddress, OrganisationABI as Abi);
    if (!organisationContract) return;

    const { request } = await organisationContract.public.simulateContract({
        address: organisationContract.address,
        abi: organisationContract.abi,
        functionName: 'addEmployee',
        args: [publicViewerKey, publicSpenderKey],
        account: organisationContract.wallet.account.address,
    });

    const hash = await organisationContract.wallet.writeContract(request);
    return hash;
}

export async function getEmployee(organisationAddress: `0x${string}`, employeeId: bigint) {
    const organisationContract = await getContract(organisationAddress, OrganisationABI as Abi);
    if (!organisationContract) return;

    const result = await organisationContract.public.readContract({
        address: organisationContract.address,
        abi: organisationContract.abi,
        functionName: 'getEmployee',
        args: [employeeId],
    });

    return result;
}

export async function getOrganisation(orgID: bigint) {
    const factoryContract = await getContract(CONTRACTS.FACTORY as `0x${string}`, OrganisationFactoryABI as Abi);
    if (!factoryContract) return;

    const result = await factoryContract.public.readContract({
        address: factoryContract.address,
        abi: factoryContract.abi,
        functionName: 'getOrganisation',
        args: [orgID],
    });

    return result;
}
