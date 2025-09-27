import { useWriteContract, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { ORGANIZATION_ABI } from '@/lib/abis';

// Organization contract functions

export function useOrganization(contractAddress?: string) {
  const { writeContract, isPending, error } = useWriteContract();

  // Read organization stats
  const { data: organizationStats } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ORGANIZATION_ABI,
    functionName: 'getOrganizationStats',
  });

  // Read all employees
  const { data: allEmployees } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ORGANIZATION_ABI,
    functionName: 'getAllEmployees',
  });

  const addEmployee = async (
    employeeAddress: string,
    salaryPerSecond: string,
    name: string = ''
  ) => {
    if (!contractAddress) throw new Error('Organization contract not found');

    return writeContract({
      address: contractAddress as `0x${string}`,
      abi: ORGANIZATION_ABI,
      functionName: 'addEmployee',
      args: [
        employeeAddress as `0x${string}`,
        BigInt(salaryPerSecond),
        name,
      ],
    });
  };

  const removeEmployee = async (employeeAddress: string) => {
    if (!contractAddress) throw new Error('Organization contract not found');

    return writeContract({
      address: contractAddress as `0x${string}`,
      abi: ORGANIZATION_ABI,
      functionName: 'removeEmployee',
      args: [employeeAddress as `0x${string}`],
    });
  };

  const updateSalary = async (
    employeeAddress: string,
    newSalaryPerSecond: string
  ) => {
    if (!contractAddress) throw new Error('Organization contract not found');

    return writeContract({
      address: contractAddress as `0x${string}`,
      abi: ORGANIZATION_ABI,
      functionName: 'updateSalary',
      args: [
        employeeAddress as `0x${string}`,
        BigInt(newSalaryPerSecond),
      ],
    });
  };

  const depositFunds = async (amount: string) => {
    if (!contractAddress) throw new Error('Organization contract not found');

    return writeContract({
      address: contractAddress as `0x${string}`,
      abi: ORGANIZATION_ABI,
      functionName: 'depositFunds',
      args: [BigInt(amount)],
    });
  };

  const withdrawPayment = async () => {
    if (!contractAddress) throw new Error('Organization contract not found');

    return writeContract({
      address: contractAddress as `0x${string}`,
      abi: ORGANIZATION_ABI,
      functionName: 'withdrawPayment',
      args: [],
    });
  };

  // Helper function to get employee details
  const getEmployee = (employeeAddress: string) => {
    return useReadContract({
      address: contractAddress as `0x${string}`,
      abi: ORGANIZATION_ABI,
      functionName: 'getEmployee',
      args: [employeeAddress as `0x${string}`],
    });
  };

  // Helper function to get pending payment
  const getPendingPayment = (employeeAddress: string) => {
    return useReadContract({
      address: contractAddress as `0x${string}`,
      abi: ORGANIZATION_ABI,
      functionName: 'getPendingPayment',
      args: [employeeAddress as `0x${string}`],
    });
  };

  return {
    // Write functions
    addEmployee,
    removeEmployee,
    updateSalary,
    depositFunds,
    withdrawPayment,
    
    // Read functions
    getEmployee,
    getPendingPayment,
    
    // Data
    organizationStats,
    allEmployees,
    
    // State
    isPending,
    error,
  };
}
