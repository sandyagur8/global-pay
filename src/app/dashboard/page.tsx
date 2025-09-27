'use client';

import { useState } from 'react';
import { CustomConnectButton } from '@/components/connect-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  DollarSign, 
  Users, 
  Calendar,
  ArrowUpRight,
  Settings,
  Wallet,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAccount } from 'wagmi';

// Mock data for demonstration
const mockStreams = [
  {
    id: '1',
    employeeAddress: '0x742d35Cc6634C0532925a3b8D4C9db96',
    employeeName: 'alice.eth',
    amount: '3000',
    interval: 'monthly',
    status: 'active',
    nextPayment: '2024-10-15',
    totalPaid: '9000'
  },
  {
    id: '2',
    employeeAddress: '0x8ba1f109551bD432803012645Hac136c',
    employeeName: 'bob.eth',
    amount: '2500',
    interval: 'monthly',
    status: 'needs_funding',
    nextPayment: '2024-10-12',
    totalPaid: '7500'
  },
  {
    id: '3',
    employeeAddress: '0x1234567890abcdef1234567890abcdef',
    employeeName: '0x1234...cdef',
    amount: '4000',
    interval: 'monthly',
    status: 'active',
    nextPayment: '2024-10-20',
    totalPaid: '12000'
  }
];

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <CardContent>
            <Wallet className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to access the employer dashboard.
            </p>
            <CustomConnectButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalMonthlyPayroll = mockStreams.reduce((sum, stream) => sum + parseInt(stream.amount), 0);
  const activeStreams = mockStreams.filter(stream => stream.status === 'active').length;
  const needsFunding = mockStreams.filter(stream => stream.status === 'needs_funding').length;

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
              <Link href="/streams">
                <Button variant="ghost">My Streams</Button>
              </Link>
              <CustomConnectButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Employer Dashboard</h1>
          <p className="text-gray-600">Manage your global payroll and payment streams</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Payroll</p>
                    <p className="text-2xl font-bold text-gray-900">${totalMonthlyPayroll.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
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
                    <p className="text-sm font-medium text-gray-600">Active Streams</p>
                    <p className="text-2xl font-bold text-gray-900">{activeStreams}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
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
                    <p className="text-sm font-medium text-gray-600">Team Members</p>
                    <p className="text-2xl font-bold text-gray-900">{mockStreams.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Needs Funding</p>
                    <p className="text-2xl font-bold text-gray-900">{needsFunding}</p>
                  </div>
                  <ArrowUpRight className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Payment Streams */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Payment Streams
              </CardTitle>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Stream
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Payment Stream</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="employee">Employee Address/ENS</Label>
                      <Input 
                        id="employee" 
                        placeholder="alice.eth or 0x742d35Cc..." 
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Salary Amount (USDC)</Label>
                      <Input 
                        id="amount" 
                        type="number" 
                        placeholder="3000" 
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="interval">Payment Interval</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select interval" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">Create Stream</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockStreams.map((stream, index) => (
                <motion.div
                  key={stream.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {stream.employeeName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{stream.employeeName}</p>
                      <p className="text-sm text-gray-500">{stream.employeeAddress.slice(0, 10)}...</p>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">${stream.amount} USDC</p>
                    <p className="text-sm text-gray-500">{stream.interval}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      stream.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {stream.status === 'active' ? 'Active' : 'Needs Funding'}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Next: {stream.nextPayment}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {stream.status === 'needs_funding' && (
                      <Dialog open={isFundModalOpen} onOpenChange={setIsFundModalOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            onClick={() => setSelectedStream(stream.id)}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Fund
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Fund Payment Stream</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-600">Funding for</p>
                              <p className="font-medium">{stream.employeeName}</p>
                              <p className="text-sm text-gray-500">${stream.amount} USDC / {stream.interval}</p>
                            </div>
                            <div>
                              <Label htmlFor="fundAmount">Amount to Fund (USDC)</Label>
                              <Input 
                                id="fundAmount" 
                                type="number" 
                                placeholder="6000" 
                                className="mt-1"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Recommended: ${parseInt(stream.amount) * 2} (2 months)
                              </p>
                            </div>
                            <div>
                              <Label htmlFor="payWith">Pay With</Label>
                              <Select>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select token" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="usdc">USDC (Direct)</SelectItem>
                                  <SelectItem value="eth">ETH (via 1inch)</SelectItem>
                                  <SelectItem value="btc">BTC (via 1inch)</SelectItem>
                                  <SelectItem value="dai">DAI (via 1inch)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button className="w-full">Fund Stream</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
