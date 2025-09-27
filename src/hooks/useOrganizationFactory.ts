import { useWriteContract, useReadContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACTS } from '@/lib/web3';
import { ORGANIZATION_FACTORY_ABI } from '@/lib/abis';

// Factory contract address
const FACTORY_CONTRACT_ADDRESS = CONTRACTS.FACTORY;

export function useOrganizationFactory() {
  const { address } = useAccount();
  const { writeContract, isPending, error } = useWriteContract();

  // Read user's organization
  const { data: organizationAddress } = useReadContract({
    address: FACTORY_CONTRACT_ADDRESS as `0x${string}`,
    abi: ORGANIZATION_FACTORY_ABI,
    functionName: 'getOrganizationByOwner',
    args: address ? [address] : undefined,
  });

  // Read default payment token
  const { data: defaultPaymentToken } = useReadContract({
    address: FACTORY_CONTRACT_ADDRESS as `0x${string}`,
    abi: ORGANIZATION_FACTORY_ABI,
    functionName: 'defaultPaymentToken',
  });

  const createOrganization = async (
    organizationName: string,
    paymentToken?: string
  ) => {
    if (!address) throw new Error('Wallet not connected');

    const tokenAddress = paymentToken || '0x0000000000000000000000000000000000000000'; // Use default

    return writeContract({
      address: FACTORY_CONTRACT_ADDRESS as `0x${string}`,
      abi: ORGANIZATION_FACTORY_ABI,
      functionName: 'createOrganization',
      args: [organizationName, tokenAddress as `0x${string}`],
    });
  };

  return {
    createOrganization,
    organizationAddress,
    defaultPaymentToken,
    isPending,
    error,
  };
}
