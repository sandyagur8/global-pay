import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Wallet } from "ethers6";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function createWallet() {
  const wallet = Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey
  };
}