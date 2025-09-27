'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Building2,
  User,
  ArrowRight,
  CheckCircle,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useENSProfile } from '@/hooks/useENS';
import { createOrganization } from '@/lib/contract';
import { CONTRACTS } from '@/lib/web3';

interface SignupFlowProps {
  isOpen: boolean;
  onComplete: (userData: {
    userType: 'EMPLOYER' | 'EMPLOYEE';
    organizationName?: string;
    displayName?: string;
    contractAddress?: `0x${string}`;
  }) => void;
}

export function SignupFlow({ isOpen, onComplete }: SignupFlowProps) {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<'EMPLOYER' | 'EMPLOYEE' | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();
  const { displayName, ensName } = useENSProfile(address);

  const handleUserTypeSelection = (type: 'EMPLOYER' | 'EMPLOYEE') => {
    setUserType(type);
    if (type === 'EMPLOYEE') {
      // For employees, we can complete immediately
      handleComplete(type);
    } else {
      // For employers, go to organization setup
      setStep(2);
    }
  };

  const handleComplete = async (selectedUserType?: 'EMPLOYER' | 'EMPLOYEE') => {
    const finalUserType = selectedUserType || userType;
    if (!finalUserType) return;

    setIsLoading(true);
    try {
      let contractAddress: `0x${string}` | undefined;
      if (finalUserType === 'EMPLOYER' && organizationName) {
        contractAddress = await createOrganization(organizationName, CONTRACTS.USDC as `0x${string}`);
      }

      await onComplete({
        userType: finalUserType,
        organizationName: finalUserType === 'EMPLOYER' ? organizationName : undefined,
        displayName: ensName || displayName || undefined,
        contractAddress,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    if (userType === 'EMPLOYER') {
      return organizationName.trim().length > 0;
    }
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to Global Pay! 👋
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: User Type Selection */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Are you an organization owner?</h3>
                <p className="text-gray-600">This helps us set up the right experience for you</p>
                {displayName && (
                  <p className="text-sm text-blue-600 mt-2">
                    Setting up for: <span className="font-medium">{displayName}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Organization Owner */}
                <Card
                  className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 hover:border-blue-500"
                  onClick={() => handleUserTypeSelection('EMPLOYER')}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Yes, I own an organization</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      I want to pay my team and manage payroll
                    </p>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Create organization</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Add employees</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Process payroll</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Employee/Freelancer */}
                <Card
                  className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 hover:border-green-500"
                  onClick={() => handleUserTypeSelection('EMPLOYEE')}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserCheck className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">No, I'm an employee/freelancer</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      I want to receive payments from organizations
                    </p>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Receive payments</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Track earnings</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Withdraw funds</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Step 2: Organization Setup (Only for Employers) */}
          {step === 2 && userType === 'EMPLOYER' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Set up your Organization</h3>
                <p className="text-gray-600">What's the name of your organization?</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    placeholder="e.g., Acme Corp, My Startup"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="mt-1"
                    autoFocus
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your organization will be set up</li>
                    <li>• You can start adding employees</li>
                    <li>• Begin processing payroll immediately</li>
                  </ul>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => handleComplete()}
                    disabled={!canProceed() || isLoading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isLoading ? (
                      'Setting up...'
                    ) : (
                      <>
                        Complete Setup
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
