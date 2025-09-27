'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter, usePathname } from 'next/navigation';
import { SignupFlow } from './signup-flow';
import { toast } from 'sonner';

interface AuthWrapperProps {
  children: React.ReactNode;
}

interface User {
  id: string;
  walletAddress: string;
  userType: 'EMPLOYER' | 'EMPLOYEE';
  hasOnboarded: boolean;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);

  // Check user status when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      checkUserStatus();
    } else {
      setUser(null);
      setShowSignup(false);
    }
  }, [isConnected, address]);

  const checkUserStatus = async () => {
    if (!address) return;

    try {
      setIsCheckingUser(true);
      
      // Check if user exists in our database
      const response = await fetch(`/api/user/check?address=${address}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.exists && data.user) {
          // User exists, set user data
          setUser(data.user);
          setShowSignup(false);
          
          // Redirect to appropriate dashboard if on landing page
          if (pathname === '/') {
            if (data.user.userType === 'EMPLOYER') {
              router.push('/dashboard/organization');
            } else {
              router.push('/streams');
            }
          }
        } else {
          // New user, show signup flow
          setShowSignup(true);
        }
      } else {
        // Assume new user if API fails
        setShowSignup(true);
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      // On error, show signup flow to be safe
      setShowSignup(true);
    } finally {
      setIsCheckingUser(false);
    }
  };

  const handleSignupComplete = async (userData: {
    userType: 'EMPLOYER' | 'EMPLOYEE';
    organizationName?: string;
    displayName?: string;
  }) => {
    if (!address) return;

    try {
      setIsLoading(true);
      
      // Create user account
      const response = await fetch('/api/user/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          userType: userData.userType,
          organizationName: userData.organizationName,
          displayName: userData.displayName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setShowSignup(false);
        
        if (userData.userType === 'EMPLOYER') {
          toast.success(`Welcome! Your organization "${userData.organizationName}" is ready.`);
          // Redirect to employer dashboard
          router.push('/dashboard/organization');
        } else {
          toast.success('Welcome! Your profile is set up and ready to receive payments.');
          // Redirect to employee dashboard
          router.push('/streams');
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking user status
  if (isCheckingUser && isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your account...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <SignupFlow
        isOpen={showSignup}
        onComplete={handleSignupComplete}
      />
    </>
  );
}