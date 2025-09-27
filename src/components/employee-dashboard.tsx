'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Building2,
  ArrowDownLeft,
  Wallet,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useUSDC } from '@/hooks/useUSDC';
import { formatUnits } from 'viem';

interface EmploymentInfo {
  organizationAddress: string;
  organizationName: string;
  salaryPerSecond: string;
  startDate: Date;
  isActive: boolean;
  pendingPayment: string;
  totalEarned: string;
}

export function EmployeeDashboard() {
  const { address } = useAccount();
  const [employmentInfo, setEmploymentInfo] = useState<EmploymentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock employment data - in real app, this would come from scanning blockchain events
  // or from a database that tracks employee-organization relationships
  const mockEmploymentInfo: EmploymentInfo = {
    organizationAddress: '0x1234567890123456789012345678901234567890',
    organizationName: 'Acme Corporation',
    salaryPerSecond: '1157407', // ~$100k/year in USDC wei per second
    startDate: new Date('2024-01-01'),
    isActive: true,
    pendingPayment: '2500000000', // 2500 USDC in wei
    totalEarned: '8333000000', // 8333 USDC in wei
  };

  const {
    withdrawPayment,
    getPendingPayment,
    getEmployee,
    isPending: orgPending
  } = useOrganization(employmentInfo?.organizationAddress);

  const {
    balance: usdcBalance,
    formattedBalance,
    refetchBalance
  } = useUSDC();

  useEffect(() => {
    // In a real app, you'd check if the user is employed by any organization
    // For demo purposes, we'll use mock data
    setTimeout(() => {
      setEmploymentInfo(mockEmploymentInfo);
      setLoading(false);
    }, 1000);
  }, [address]);

  const handleWithdrawPayment = async () => {
    if (!employmentInfo) return;

    try {
      await withdrawPayment();
      toast.success('Payment withdrawn successfully!');
      
      // Refresh balances
      refetchBalance();
      
      // In a real app, you'd refresh the pending payment amount
      setEmploymentInfo(prev => prev ? {
        ...prev,
        pendingPayment: '0',
        totalEarned: (BigInt(prev.totalEarned) + BigInt(prev.pendingPayment)).toString()
      } : null);
    } catch (error) {
      console.error('Error withdrawing payment:', error);
      toast.error('Failed to withdraw payment');
    }
  };

  const calculateAnnualSalary = (salaryPerSecond: string) => {
    const perSecond = parseFloat(salaryPerSecond);
    const perYear = perSecond * 365 * 24 * 60 * 60;
    return (perYear / 1e6).toLocaleString(); // Convert from USDC wei to USDC
  };

  const calculateMonthlyProgress = () => {
    if (!employmentInfo) return 0;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    
    return (daysPassed / daysInMonth) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employment information...</p>
        </div>
      </div>
    );
  }

  if (!employmentInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-2xl mx-auto text-center py-16">
          <AlertCircle className="h-24 w-24 text-gray-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-4">No Employment Found</h1>
          <p className="text-gray-600 mb-8">
            You are not currently employed by any organization on Global Pay.
            Contact your employer to get added to their payroll system.
          </p>
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">How to get started:</h3>
            <ul className="text-blue-700 text-left space-y-1">
              <li>• Ask your employer to create an organization on Global Pay</li>
              <li>• Provide them with your wallet address: <code className="bg-blue-100 px-2 py-1 rounded">{address}</code></li>
              <li>• Once added, you'll see your payment streams here</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Payment Dashboard</h1>
            <p className="text-gray-600">Track your earnings and withdraw payments</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-3 py-1">
              <Building2 className="h-4 w-4 mr-1" />
              {employmentInfo.organizationName}
            </Badge>
            <Badge variant={employmentInfo.isActive ? "default" : "secondary"} className="px-3 py-1">
              {employmentInfo.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-lg backdrop-blur-md bg-white/70">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Annual Salary</p>
                  <p className="text-2xl font-bold text-gray-800">
                    ${calculateAnnualSalary(employmentInfo.salaryPerSecond)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg backdrop-blur-md bg-white/70">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Payment</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatUnits(BigInt(employmentInfo.pendingPayment), 6)} USDC
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg backdrop-blur-md bg-white/70">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earned</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatUnits(BigInt(employmentInfo.totalEarned), 6)} USDC
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg backdrop-blur-md bg-white/70">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Wallet Balance</p>
                  <p className="text-2xl font-bold text-gray-800">{formattedBalance} USDC</p>
                </div>
                <Wallet className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Withdraw Payment */}
          <Card className="shadow-lg backdrop-blur-md bg-white/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownLeft className="h-5 w-5" />
                Withdraw Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-green-800">Available to Withdraw</span>
                  <span className="text-2xl font-bold text-green-800">
                    {formatUnits(BigInt(employmentInfo.pendingPayment), 6)} USDC
                  </span>
                </div>
                <p className="text-sm text-green-700">
                  This amount has been earned and is ready for withdrawal
                </p>
              </div>
              
              <Button
                onClick={handleWithdrawPayment}
                disabled={orgPending || employmentInfo.pendingPayment === '0'}
                className="w-full py-3 text-lg bg-green-600 hover:bg-green-700"
              >
                {orgPending ? 'Processing...' : 'Withdraw Payment'}
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                Payments are processed instantly on the blockchain
              </p>
            </CardContent>
          </Card>

          {/* Monthly Progress */}
          <Card className="shadow-lg backdrop-blur-md bg-white/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Days worked this month</span>
                  <span>{new Date().getDate()} / {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}</span>
                </div>
                <Progress value={calculateMonthlyProgress()} className="h-3" />
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">This Month's Earnings</h4>
                <p className="text-2xl font-bold text-blue-800">
                  {formatUnits(BigInt(employmentInfo.pendingPayment), 6)} USDC
                </p>
                <p className="text-sm text-blue-700">
                  Earning ~{formatUnits(BigInt(employmentInfo.salaryPerSecond) * BigInt(86400), 6)} USDC per day
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employment Details */}
        <Card className="shadow-lg backdrop-blur-md bg-white/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Employment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Organization</label>
                  <p className="text-lg font-semibold text-gray-800">{employmentInfo.organizationName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Start Date</label>
                  <p className="text-lg font-semibold text-gray-800">
                    {employmentInfo.startDate.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-lg font-semibold text-green-800">Active Employee</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Organization Contract</label>
                  <p className="text-sm font-mono text-gray-800 bg-gray-100 p-2 rounded">
                    {employmentInfo.organizationAddress}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Your Address</label>
                  <p className="text-sm font-mono text-gray-800 bg-gray-100 p-2 rounded">
                    {address}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
