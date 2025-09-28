"use client";
import { addEmployee } from "@/lib/contract";
import { performEmployeeSwap, EmployeeSwapService } from "@/lib/swap-service";
import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Users, 
  DollarSign, 
  Plus, 
  Send,
  Wallet,
  TrendingUp,
  Clock,
  UserPlus,
  Settings,
  Eye
} from "lucide-react";
import { motion } from "framer-motion";

interface Organization {
  id: string;
  name: string;
  contractAddress: string;
  paymentToken: string;
}

interface Employee {
  id: string;
  walletAddress: string;
}

const EmployerDashboard = () => {
  const { address, isConnected, chain } = useAccount();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [swapConfig] = useState(() => EmployeeSwapService.getSwapConfig());

  useEffect(() => {
    setLoading(true);
    setError(null);
    setOrganization(null);

    if (address && isConnected) {
      let isCancelled = false;

      const fetchOrganization = async () => {
        try {
          const response = await fetch(
            `/api/organization?walletAddress=${address}&t=${Date.now()}`,
            { method: "GET", headers: { "Cache-Control": "no-cache" } }
          );

          if (isCancelled) return;

          if (!response.ok) throw new Error("Failed to fetch organization");

          const data = await response.json();
          if (!isCancelled) setOrganization(data);
        } catch (err) {
          if (!isCancelled) setError((err as Error).message);
        } finally {
          if (!isCancelled) setLoading(false);
        }
      };

      const fetchEmployees = async () => {
        try {
          const response = await fetch("/api/employees", {
            method: "GET",
            headers: { "Cache-Control": "no-cache" },
          });

          if (!response.ok) throw new Error("Failed to fetch employees");

          const data = await response.json();
          if (!isCancelled) setEmployees(data);
        } catch (err) {
          if (!isCancelled) setError((err as Error).message);
        }
      };

      fetchOrganization();
      fetchEmployees();

      return () => {
        isCancelled = true;
      };
    } else {
      setLoading(false);
    }
  }, [address, isConnected]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee) {
      alert("Please select an employee");
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const res = await fetch("/api/computesignal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: selectedEmployee,
        amount: amount
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      alert(`Error: ${errorData.error || "Failed to add employee"}`);
      return;
    }

    const data = await res.json();
    console.log("Signals computed:", data.signals);
    const signals = data.signals;

    const emp = await addEmployee(
      organization!.contractAddress,
      [BigInt(signals[0] as string), BigInt(signals[1] as string)],
      [BigInt(signals[2] as string), BigInt(signals[3] as string)]
    );

    console.log(`✅ Employee added successfully: ${emp}`);

    // After successful employee addition, check if we should perform swap
    console.log('🔄 Checking swap configuration...');
    
    try {
      const swapResult = await performEmployeeSwap(
        selectedEmployee, // Employee wallet address
        Number(amount) * 1000000 // Convert amount to USDC units (6 decimals)
      );
      
      if (swapResult === null) {
        console.log('⏭️ Swap skipped - network not set to base, continuing with other logic');
        alert(`Employee added successfully: ${emp}\n\nSwap skipped (network not set to base)`);
      } else if (swapResult.success) {
        console.log('🎉 Swap completed successfully!');
        alert(`Employee added successfully: ${emp}\n\n✅ USDC to WETH swap completed!\nSwap Tx: ${swapResult.swapTxHash}\nAmount: ${parseInt(swapResult.usdcAmount) / 1000000} USDC → ${parseInt(swapResult.estimatedWETH) / 1e18} WETH`);
      } else {
        console.error('❌ Swap failed:', swapResult.error);
        alert(`Employee added successfully: ${emp}\n\n⚠️ Swap failed: ${swapResult.error}`);
      }
    } catch (swapError) {
      console.error('❌ Unexpected swap error:', swapError);
      alert(`Employee added successfully: ${emp}\n\n⚠️ Swap error: ${swapError instanceof Error ? swapError.message : 'Unknown error'}`);
    }

    console.log("Employee addition and swap process completed for:", selectedEmployee);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Organization Found</h3>
            <p className="text-gray-600 mb-4">We couldn't find an organization associated with your wallet.</p>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employer Dashboard</h1>
              <p className="text-gray-600">Manage your organization and payroll</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                <Wallet className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-mono text-gray-800">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                </span>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Organization Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Organization Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Organization Name</Label>
                  <p className="text-lg font-semibold text-gray-900">{organization.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Contract Address</Label>
                  <p className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {organization.contractAddress.slice(0, 10)}...{organization.contractAddress.slice(-8)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Payment Token</Label>
                  <p className="text-lg font-semibold text-gray-900">{organization.paymentToken}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Swap Configuration Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <Card className={swapConfig.enabled ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                1inch Swap Configuration
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  swapConfig.enabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {swapConfig.enabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Network</Label>
                  <p className="text-lg font-semibold text-gray-900">{swapConfig.network}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <p className={`text-lg font-semibold ${swapConfig.enabled ? 'text-green-600' : 'text-yellow-600'}`}>
                    {swapConfig.enabled ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Default Amount</Label>
                  <p className="text-lg font-semibold text-gray-900">{swapConfig.defaultAmount} USDC</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Slippage</Label>
                  <p className="text-lg font-semibold text-gray-900">{swapConfig.slippage}%</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <p className="text-sm text-gray-600">
                  {swapConfig.enabled 
                    ? '✅ When employees are added, USDC will be automatically swapped to WETH and sent to their wallet.'
                    : '⚠️ Swap is disabled. Set network to "base" in swap-config.ts to enable automatic USDC→WETH swaps.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Employees</p>
                    <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Paid</p>
                    <p className="text-2xl font-bold text-gray-900">$0.00</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">$0.00</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Employee Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Employee Management
                </span>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No employees added yet</p>
                  <p className="text-sm text-gray-500 mb-4">Add employees to start managing payroll</p>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Your First Employee
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {employees.map((employee, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Employee #{idx + 1}</p>
                          <p className="text-sm font-mono text-gray-600">
                            {employee.walletAddress.slice(0, 10)}...{employee.walletAddress.slice(-8)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button size="sm">
                          <Send className="h-4 w-4 mr-2" />
                          Pay
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Form */}
        {employees.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Send className="h-5 w-5 mr-2" />
                  Send Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddEmployee} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="employee">Select Employee</Label>
                      <select
                        id="employee"
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        required
                      >
                        <option value="">Choose an employee</option>
                        {employees.map((emp, idx) => (
                          <option key={idx} value={emp.walletAddress}>
                            Employee #{idx + 1} ({emp.walletAddress.slice(0, 10)}...)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="amount">Payment Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Send className="h-4 w-4 mr-2" />
                      Send Payment
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EmployerDashboard;
