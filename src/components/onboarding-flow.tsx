'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Building2, 
  Users, 
  ArrowRight, 
  CheckCircle,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';

interface OnboardingFlowProps {
  isOpen: boolean;
  onComplete: (userType: 'employer' | 'employee', organizationName?: string) => void;
}

export function OnboardingFlow({ isOpen, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<'employer' | 'employee' | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();

  const handleUserTypeSelection = (type: 'employer' | 'employee') => {
    setUserType(type);
    setStep(2);
  };

  const handleComplete = async () => {
    if (!userType) return;
    
    setIsLoading(true);
    try {
      await onComplete(userType, userType === 'employer' ? organizationName : undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    if (userType === 'employer') {
      return organizationName.trim().length > 0;
    }
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to Global Pay! 🎉
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
          </div>

          {/* Step 1: User Type Selection */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">How will you use Global Pay?</h3>
                <p className="text-gray-600">Choose your role to get started with the right features</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employer Option */}
                <Card 
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                    userType === 'employer' ? 'ring-2 ring-blue-600 bg-blue-50' : ''
                  }`}
                  onClick={() => handleUserTypeSelection('employer')}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">I'm an Employer</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      I want to pay my team and manage payroll streams
                    </p>
                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Create organization</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Manage employees</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Set up payment streams</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Employee Option */}
                <Card 
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                    userType === 'employee' ? 'ring-2 ring-green-600 bg-green-50' : ''
                  }`}
                  onClick={() => handleUserTypeSelection('employee')}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserCheck className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">I'm an Employee</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      I want to receive payments and track my earnings
                    </p>
                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>View payment streams</span>
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

          {/* Step 2: Additional Information */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {userType === 'employer' ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Set up your Organization</h3>
                    <p className="text-gray-600">Give your organization a name to get started</p>
                  </div>

                  <div className="space-y-4 max-w-md mx-auto">
                    <div>
                      <Label htmlFor="orgName">Organization Name</Label>
                      <Input
                        id="orgName"
                        placeholder="e.g., Acme Corp, My Startup"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Your organization contract will be deployed</li>
                        <li>• You can start adding employees</li>
                        <li>• Set up payment streams for your team</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">You're all set!</h3>
                    <p className="text-gray-600">Your employee account is ready to receive payments</p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg max-w-md mx-auto">
                    <h4 className="font-medium text-green-900 mb-2">What you can do:</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• View incoming payment streams</li>
                      <li>• Track your earnings in real-time</li>
                      <li>• Withdraw available funds anytime</li>
                      <li>• Share your wallet address: <code className="bg-green-100 px-1 rounded text-xs">{address?.slice(0, 10)}...</code></li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleComplete}
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
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
