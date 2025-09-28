'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Building2,
  ArrowRight,
  CheckCircle,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useENSProfile } from '@/hooks/useENS';
import { deployOrganisation } from '@/lib/contract';
import { registerENSForRecipient } from '@/app/ens/registerForRecipient';
import { LoadingModal } from '@/components/ui/loading-modal';

interface SignupFlowProps {
  isOpen: boolean;
  onComplete: (userData: {
    userType: 'EMPLOYER' | 'EMPLOYEE';
    organizationName?: string;
    displayName?: string;
    contractAddress?: `0x${string}`;
    orgID?: bigint;
  }) => void;
}

export function SignupFlow({ isOpen, onComplete }: SignupFlowProps) {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<'EMPLOYER' | 'EMPLOYEE' | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingSteps] = useState([
    "Deploying organization contract",
    "Generating ENS commitment", 
    "Submitting commitment to blockchain",
    "Waiting for commitment confirmation",
    "Registering ENS domain",
    "Transferring domain ownership",
    "Finalizing setup"
  ]);
  const { address } = useAccount();
  const { displayName, ensName } = useENSProfile(address);

  const handleUserTypeSelection = (type: 'EMPLOYER' | 'EMPLOYEE') => {
    console.log('👤 User selected type:', type);
    setUserType(type);
    if (type === 'EMPLOYEE') {
      // For employees, we can complete immediately
      console.log('🏃‍♂️ Employee selected, completing signup immediately');
      handleComplete(type);
    } else {
      // For employers, go to organization setup
      console.log('🏢 Employer selected, going to step 2');
      setStep(2);
    }
  };

  const handleComplete = async (selectedUserType?: 'EMPLOYER' | 'EMPLOYEE') => {
    const finalUserType = selectedUserType || userType;
    console.log('🎯 handleComplete called with:', { selectedUserType, userType, finalUserType });
    
    if (!finalUserType) {
      console.error('❌ No user type provided');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let contractAddress: `0x${string}` | undefined;
      let orgID: bigint | undefined;

      if (finalUserType === 'EMPLOYEE') {
        console.log('👤 Processing employee signup - no contract deployment needed');
      }

      if (finalUserType === 'EMPLOYER' && organizationName && address) {
        // Step 1: Deploy organization contract
        setLoadingStep(0);
        console.log('Deploying organisation contract...');
        const result = await deployOrganisation();

        console.log(result)

        if (result) {
          contractAddress = result.organisationAddress;
          orgID = result.orgID;
          console.log(`Organisation deployed: ${contractAddress} with ID: ${orgID}`);
          
          // Step 2-7: Register ENS domain for the organization
          setLoadingStep(1);
          console.log('Registering ENS domain for organization...');
          try {
            // Clean organization name to be a valid domain name
            const domainName = organizationName
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric characters
              .substring(0, 20); // Limit length
            
            console.log(`Registering ENS domain: ${domainName}.eth for address: ${address}`);
            
            // Simulate step progression for ENS registration
            const stepDelays = [2000, 3000, 15000, 2000, 10000, 3000]; // Realistic delays for each step
            
            for (let i = 2; i <= 6; i++) {
              setLoadingStep(i);
              await new Promise(resolve => setTimeout(resolve, stepDelays[i - 2]));
            }
            
            const ensResult = await registerENSForRecipient(
              address, // Organization owner's wallet address
              domainName, // Organization name as domain
              undefined, // Use default private key from config
              31536000 // 1 year duration
            );
            
            console.log('ENS registration successful:', ensResult);
            setLoadingStep(6); // Final step
          } catch (ensError) {
            console.warn('ENS registration failed, but continuing with organization setup:', ensError);
            // Don't throw error here - ENS registration failure shouldn't block organization creation
            setLoadingStep(6); // Move to final step even if ENS fails
          }
        } else {
          throw new Error('Failed to deploy organisation contract');
        }
      }

      const userData = {
        userType: finalUserType,
        organizationName: finalUserType === 'EMPLOYER' ? organizationName : undefined,
        displayName: ensName || displayName || undefined,
        contractAddress,
        orgID,
      };
      
      console.log('📤 Calling onComplete with userData:', userData);
      await onComplete(userData);
    } catch (err) {
      console.error('Error during signup:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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

  console.log('🎭 SignupFlow render:', { isOpen, isLoading, step, userType });

  return (
    <>
      {/* Loading Modal for ENS Registration */}
      <LoadingModal
        isOpen={isLoading}
        title="Setting Up Your Organization"
        description="We're deploying your smart contract and registering your ENS domain. This may take a few minutes."
        steps={loadingSteps}
        currentStep={loadingStep}
      />

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
                    <h4 className="text-lg font-semibold mb-2">No, I&apos;m an employee/freelancer</h4>
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
                <p className="text-gray-600">What&apos;s the name of your organization?</p>
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

                {error && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your organisation contract will be deployed</li>
                    <li>• An ENS domain will be registered for your organization</li>
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
                      'Setting up Organization & ENS...'
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
    </>
  );
}
