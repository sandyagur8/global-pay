'use client';

import { useState } from 'react';
import { CustomConnectButton } from '@/components/connect-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  Calendar,
  TrendingUp,
  Wallet,
  Download,
  Clock,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAccount } from 'wagmi';

// Mock data for demonstration
const mockEmployeeStreams = [
  {
    id: '1',
    employerName: 'TechCorp Inc.',
    employerAddress: '0x742d35Cc6634C0532925a3b8D4C9db96',
    salaryAmount: '3000',
    interval: 'monthly',
    totalVested: '2100',
    totalWithdrawn: '1500',
    availableToWithdraw: '600',
    nextPayment: '2024-10-15',
    startDate: '2024-01-01',
    isActive: true
  },
  {
    id: '2',
    employerName: 'StartupXYZ',
    employerAddress: '0x8ba1f109551bD432803012645Hac136c',
    salaryAmount: '2000',
    interval: 'monthly',
    totalVested: '1400',
    totalWithdrawn: '1000',
    availableToWithdraw: '400',
    nextPayment: '2024-10-12',
    startDate: '2024-03-01',
    isActive: true
  }
];

export default function Streams() {
  const { address, isConnected } = useAccount();
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <CardContent>
            <Wallet className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to view your payment streams.
            </p>
            <CustomConnectButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAvailable = mockEmployeeStreams.reduce((sum, stream) => sum + parseFloat(stream.availableToWithdraw), 0);
  const totalMonthlyIncome = mockEmployeeStreams.reduce((sum, stream) => sum + parseInt(stream.salaryAmount), 0);
  const totalEarned = mockEmployeeStreams.reduce((sum, stream) => sum + parseFloat(stream.totalVested), 0);

  const handleWithdraw = async (streamId: string) => {
    setWithdrawing(streamId);
    // Simulate withdrawal process
    setTimeout(() => {
      setWithdrawing(null);
      // Here you would call the smart contract withdraw function
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Global Pay</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <CustomConnectButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Payment Streams</h1>
          <p className="text-gray-600">Track your incoming payments and withdraw your earnings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Available to Withdraw</p>
                    <p className="text-3xl font-bold">${totalAvailable.toFixed(2)}</p>
                  </div>
                  <Download className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Income</p>
                    <p className="text-2xl font-bold text-gray-900">${totalMonthlyIncome.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Earned</p>
                    <p className="text-2xl font-bold text-gray-900">${totalEarned.toFixed(2)}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Payment Streams */}
        <div className="space-y-6">
          {mockEmployeeStreams.map((stream, index) => (
            <motion.div
              key={stream.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {stream.employerName.charAt(0)}
                        </div>
                        {stream.employerName}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {stream.employerAddress.slice(0, 10)}...{stream.employerAddress.slice(-8)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">${stream.salaryAmount}</p>
                      <p className="text-sm text-gray-500">per {stream.interval}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Available</p>
                      <p className="text-xl font-bold text-green-600">${stream.availableToWithdraw}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Total Vested</p>
                      <p className="text-xl font-bold text-blue-600">${stream.totalVested}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Withdrawn</p>
                      <p className="text-xl font-bold text-gray-600">${stream.totalWithdrawn}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Next Payment</p>
                      <p className="text-lg font-semibold text-gray-900 flex items-center justify-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(stream.nextPayment).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Vesting Progress</span>
                      <span>{((parseFloat(stream.totalVested) / parseInt(stream.salaryAmount)) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((parseFloat(stream.totalVested) / parseInt(stream.salaryAmount)) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        stream.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {stream.isActive ? 'Active' : 'Paused'}
                      </div>
                      <span className="text-sm text-gray-500">
                        Since {new Date(stream.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleWithdraw(stream.id)}
                        disabled={parseFloat(stream.availableToWithdraw) === 0 || withdrawing === stream.id}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                      >
                        {withdrawing === stream.id ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Withdrawing...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Withdraw ${stream.availableToWithdraw}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {mockEmployeeStreams.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payment Streams</h3>
              <p className="text-gray-600 mb-6">
                You don't have any active payment streams yet. Ask your employer to set up a stream for you.
              </p>
              <Button variant="outline">
                Learn More
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
