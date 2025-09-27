'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Wallet, 
  Settings,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useOrganizationFactory } from '@/hooks/useOrganizationFactory';
import { useOrganization } from '@/hooks/useOrganization';
import { useUSDC } from '@/hooks/useUSDC';
import { CONTRACTS } from '@/lib/web3';

interface Employee {
  address: string;
  name: string;
  salaryPerSecond: string;
  startDate: Date;
  isActive: boolean;
  pendingPayment: string;
}

export function EmployerDashboard() {
  const { address } = useAccount();
  const [organizationAddress, setOrganizationAddress] = useState<string>('');
  const [organizationName, setOrganizationName] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Form states
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeAddress, setNewEmployeeAddress] = useState('');
  const [newEmployeeSalary, setNewEmployeeSalary] = useState('');
  const [fundingAmount, setFundingAmount] = useState('');
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isFundingOpen, setIsFundingOpen] = useState(false);

  // Hooks
  const { 
    createOrganization, 
    getOrganizationByOwner, 
    isPending: factoryPending 
  } = useOrganizationFactory();
  
  const {
    addEmployee,
    removeEmployee,
    depositFunds,
    getOrganizationStats,
    getAllEmployees,
    isPending: orgPending
  } = useOrganization(organizationAddress);

  const {
    faucet,
    approve,
    balance: usdcBalance,
    formattedBalance,
    isPending: usdcPending
  } = useUSDC();

  // Organization stats
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalFunds: '0',
    totalPaidOut: '0'
  });

  // Check if user has an organization
  useEffect(() => {
    const checkOrganization = async () => {
      if (!address) return;
      
      try {
        const orgAddress = await getOrganizationByOwner(address);
        if (orgAddress && orgAddress !== '0x0000000000000000000000000000000000000000') {
          setOrganizationAddress(orgAddress);
          // Load organization data
          loadOrganizationData(orgAddress);
        }
      } catch (error) {
        console.error('Error checking organization:', error);
      }
    };

    checkOrganization();
  }, [address, getOrganizationByOwner]);

  const loadOrganizationData = async (orgAddress: string) => {
    try {
      // Load stats
      const orgStats = await getOrganizationStats();
      if (orgStats) {
        setStats({
          totalEmployees: Number(orgStats[0]),
          totalFunds: orgStats[1].toString(),
          totalPaidOut: orgStats[2].toString()
        });
      }

      // Load employees
      const employeeAddresses = await getAllEmployees();
      if (employeeAddresses) {
        // Load employee details (this would need individual calls in real implementation)
        setEmployees([]); // Placeholder
      }
    } catch (error) {
      console.error('Error loading organization data:', error);
    }
  };

  const handleCreateOrganization = async () => {
    if (!organizationName.trim()) {
      toast.error('Please enter an organization name');
      return;
    }

    try {
      await createOrganization(organizationName, CONTRACTS.USDC);
      toast.success('Organization created successfully!');
      // The organization address will be updated via the effect hook
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization');
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployeeName.trim() || !newEmployeeAddress.trim() || !newEmployeeSalary.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      // Convert annual salary to per-second rate
      const annualSalary = parseFloat(newEmployeeSalary);
      const salaryPerSecond = Math.floor((annualSalary * 1e6) / (365 * 24 * 60 * 60)); // Convert to USDC wei per second

      await addEmployee(newEmployeeAddress, salaryPerSecond.toString(), newEmployeeName);
      
      toast.success('Employee added successfully!');
      setIsAddEmployeeOpen(false);
      setNewEmployeeName('');
      setNewEmployeeAddress('');
      setNewEmployeeSalary('');
      
      // Reload data
      loadOrganizationData(organizationAddress);
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Failed to add employee');
    }
  };

  const handleFundOrganization = async () => {
    if (!fundingAmount.trim()) {
      toast.error('Please enter a funding amount');
      return;
    }

    try {
      // First approve the organization to spend USDC
      await approve(organizationAddress, fundingAmount);
      toast.success('Approval successful! Now depositing funds...');
      
      // Then deposit the funds
      setTimeout(async () => {
        try {
          await depositFunds(fundingAmount);
          toast.success('Funds deposited successfully!');
          setIsFundingOpen(false);
          setFundingAmount('');
          loadOrganizationData(organizationAddress);
        } catch (error) {
          console.error('Error depositing funds:', error);
          toast.error('Failed to deposit funds');
        }
      }, 2000);
    } catch (error) {
      console.error('Error approving funds:', error);
      toast.error('Failed to approve funds');
    }
  };

  const handleGetTestTokens = async () => {
    try {
      await faucet('1000'); // Get 1000 USDC from faucet
      toast.success('Test tokens received!');
    } catch (error) {
      console.error('Error getting test tokens:', error);
      toast.error('Failed to get test tokens');
    }
  };

  // If no organization exists, show creation form
  if (!organizationAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg backdrop-blur-md bg-white/70">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-800">
                Create Your Organization
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Deploy your organization's smart contract to start managing payroll
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="Acme Corporation"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="bg-white/80"
                />
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">What happens next:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• A smart contract will be deployed for your organization</li>
                  <li>• You'll be able to add employees and set their salaries</li>
                  <li>• Employees can withdraw their earned payments anytime</li>
                  <li>• All transactions are transparent and on-chain</li>
                </ul>
              </div>

              <Button
                onClick={handleCreateOrganization}
                disabled={factoryPending || !organizationName.trim()}
                className="w-full py-3 text-lg bg-blue-600 hover:bg-blue-700"
              >
                {factoryPending ? 'Deploying Contract...' : 'Create Organization'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Organization Dashboard</h1>
            <p className="text-gray-600">Manage your team's payroll and payments</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleGetTestTokens}
              disabled={usdcPending}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Wallet className="h-4 w-4" />
              Get Test USDC
            </Button>
            <Badge variant="secondary" className="px-3 py-1">
              Balance: {formattedBalance} USDC
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-lg backdrop-blur-md bg-white/70">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalEmployees}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg backdrop-blur-md bg-white/70">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Treasury Balance</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalFunds} USDC</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg backdrop-blur-md bg-white/70">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Paid Out</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalPaidOut} USDC</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg backdrop-blur-md bg-white/70">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Streams</p>
                  <p className="text-2xl font-bold text-gray-800">{employees.filter(e => e.isActive).length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="employees">Employee Management</TabsTrigger>
            <TabsTrigger value="treasury">Treasury</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-6">
            <Card className="shadow-lg backdrop-blur-md bg-white/70">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Employees</CardTitle>
                <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Employee</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="empName">Employee Name</Label>
                        <Input
                          id="empName"
                          placeholder="John Doe"
                          value={newEmployeeName}
                          onChange={(e) => setNewEmployeeName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="empAddress">Wallet Address</Label>
                        <Input
                          id="empAddress"
                          placeholder="0x..."
                          value={newEmployeeAddress}
                          onChange={(e) => setNewEmployeeAddress(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="empSalary">Annual Salary (USDC)</Label>
                        <Input
                          id="empSalary"
                          placeholder="50000"
                          type="number"
                          value={newEmployeeSalary}
                          onChange={(e) => setNewEmployeeSalary(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleAddEmployee}
                        disabled={orgPending}
                        className="w-full"
                      >
                        {orgPending ? 'Adding Employee...' : 'Add Employee'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {employees.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No employees added yet. Click "Add Employee" to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {employees.map((employee, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{employee.name}</h4>
                          <p className="text-sm text-gray-600">{employee.address}</p>
                          <p className="text-sm text-gray-600">
                            Salary: {employee.salaryPerSecond} USDC/year
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={employee.isActive ? "default" : "secondary"}>
                            {employee.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeEmployee(employee.address)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="treasury" className="space-y-6">
            <Card className="shadow-lg backdrop-blur-md bg-white/70">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Treasury Management</CardTitle>
                <Dialog open={isFundingOpen} onOpenChange={setIsFundingOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4" />
                      Fund Organization
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Fund Organization</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fundAmount">Amount (USDC)</Label>
                        <Input
                          id="fundAmount"
                          placeholder="1000"
                          type="number"
                          value={fundingAmount}
                          onChange={(e) => setFundingAmount(e.target.value)}
                        />
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          This will transfer USDC from your wallet to the organization treasury.
                          Employees can then withdraw their earned payments.
                        </p>
                      </div>
                      <Button
                        onClick={handleFundOrganization}
                        disabled={usdcPending || orgPending}
                        className="w-full"
                      >
                        {(usdcPending || orgPending) ? 'Processing...' : 'Fund Organization'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ArrowDownLeft className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800">Total Deposits</span>
                      </div>
                      <p className="text-2xl font-bold text-green-800">{stats.totalFunds} USDC</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-800">Total Withdrawals</span>
                      </div>
                      <p className="text-2xl font-bold text-red-800">{stats.totalPaidOut} USDC</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="shadow-lg backdrop-blur-md bg-white/70">
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Organization Contract Address</Label>
                    <Input value={organizationAddress} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Payment Token</Label>
                    <Input value={CONTRACTS.USDC} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Owner Address</Label>
                    <Input value={address || ''} readOnly className="bg-gray-50" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
