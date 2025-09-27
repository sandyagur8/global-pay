import { useWriteContract, useReadContract, useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACTS } from '@/lib/web3';
import { MOCK_USDC_ABI } from '@/lib/abis';

export function useUSDC() {
  const { address } = useAccount();
  const { writeContract, isPending, error } = useWriteContract();

  // Read user's USDC balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.USDC as `0x${string}`,
    abi: MOCK_USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Read USDC decimals
  const { data: decimals } = useReadContract({
    address: CONTRACTS.USDC as `0x${string}`,
    abi: MOCK_USDC_ABI,
    functionName: 'decimals',
  });

  const faucet = async (amount: string) => {
    if (!address) throw new Error('Wallet not connected');

    const amountWei = parseUnits(amount, decimals || 6);
    
    return writeContract({
      address: CONTRACTS.USDC as `0x${string}`,
      abi: MOCK_USDC_ABI,
      functionName: 'faucet',
      args: [amountWei],
    });
  };

  const approve = async (spender: string, amount: string) => {
    if (!address) throw new Error('Wallet not connected');

    const amountWei = parseUnits(amount, decimals || 6);
    
    return writeContract({
      address: CONTRACTS.USDC as `0x${string}`,
      abi: MOCK_USDC_ABI,
      functionName: 'approve',
      args: [spender as `0x${string}`, amountWei],
    });
  };

  const transfer = async (to: string, amount: string) => {
    if (!address) throw new Error('Wallet not connected');

    const amountWei = parseUnits(amount, decimals || 6);
    
    return writeContract({
      address: CONTRACTS.USDC as `0x${string}`,
      abi: MOCK_USDC_ABI,
      functionName: 'transfer',
      args: [to as `0x${string}`, amountWei],
    });
  };

  const formatBalance = (rawBalance?: bigint) => {
    if (!rawBalance || !decimals) return '0';
    return formatUnits(rawBalance, decimals);
  };

  return {
    // Write functions
    faucet,
    approve,
    transfer,
    
    // Read data
    balance,
    decimals,
    formattedBalance: formatBalance(balance),
    
    // Utils
    refetchBalance,
    formatBalance,
    
    // State
    isPending,
    error,
  };
}
