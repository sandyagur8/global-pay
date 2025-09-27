'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { CustomConnectButton } from './connect-button';
import { Wallet, AlertCircle } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedUserTypes: ('EMPLOYER' | 'EMPLOYEE')[];
  redirectTo?: string;
}

interface User {
  id: string;
  walletAddress: string;
  userType: 'EMPLOYER' | 'EMPLOYEE';
  hasOnboarded: boolean;
}

export function RouteGuard({ children, allowedUserTypes, redirectTo }: RouteGuardProps) {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      checkUserAccess();
    } else {
      setIsLoading(false);
      setHasAccess(false);
    }
  }, [isConnected, address]);

  const checkUserAccess = async () => {
    if (!address) return;

    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/user/check?address=${address}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setUser(data.user);
          
          // Check if user type is allowed for this route
          if (allowedUserTypes.includes(data.user.userType)) {
            setHasAccess(true);
          } else {
            // Redirect to appropriate page based on user type
            if (redirectTo) {
              router.push(redirectTo);
            } else {
              // Default redirects
              if (data.user.userType === 'EMPLOYER') {
                router.push('/dashboard');
              } else {
                router.push('/streams');
              }
            }
          }
        } else {
          // User doesn't exist, they need to go through signup
          setHasAccess(false);
        }
      }
    } catch (error) {
      console.error('Error checking user access:', error);
      setHasAccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  // Not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <CardContent>
            <Wallet className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to access this page.
            </p>
            <CustomConnectButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  // No access (wrong user type or not signed up)
  if (!hasAccess) {
    const userTypeText = allowedUserTypes.includes('EMPLOYER') ? 'employers' : 'employees';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <CardContent>
            <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600 mb-6">
              This page is only available for {userTypeText}.
              {user ? ' You will be redirected to your dashboard.' : ' Please complete the signup process first.'}
            </p>
            {!user && <CustomConnectButton />}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Has access, render children
  return <>{children}</>;
}
