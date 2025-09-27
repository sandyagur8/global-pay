import { useEnsName, useEnsAvatar, useEnsAddress } from 'wagmi';
import { normalize } from 'viem/ens';

export function useENSName(address?: `0x${string}`) {
  const { data: ensName, isLoading, error } = useEnsName({
    address,
    chainId: 1, // ENS is on Ethereum mainnet
  });

  return {
    ensName,
    isLoading,
    error,
  };
}

export function useENSAvatar(ensName?: string) {
  const { data: ensAvatar, isLoading, error } = useEnsAvatar({
    name: ensName ? normalize(ensName) : undefined,
    chainId: 1,
  });

  return {
    ensAvatar,
    isLoading,
    error,
  };
}

export function useENSAddress(ensName?: string) {
  const { data: address, isLoading, error } = useEnsAddress({
    name: ensName ? normalize(ensName) : undefined,
    chainId: 1,
  });

  return {
    address,
    isLoading,
    error,
  };
}

export function useENSProfile(addressOrName?: string) {
  const isAddress = addressOrName?.startsWith('0x');
  const address = isAddress ? (addressOrName as `0x${string}`) : undefined;
  const ensName = !isAddress ? addressOrName : undefined;

  const { ensName: resolvedName } = useENSName(address);
  const { ensAvatar } = useENSAvatar(resolvedName || ensName);
  const { address: resolvedAddress } = useENSAddress(ensName);

  const displayName = resolvedName || ensName || address;
  const resolvedAddr = resolvedAddress || address;

  return {
    displayName,
    ensName: resolvedName || ensName,
    address: resolvedAddr,
    avatar: ensAvatar,
  };
}
