'use client';

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { SignupFlow } from "@/components/signup-flow";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface User {
  id: string;
  walletAddress: string;
  userType: 'EMPLOYEE' | 'EMPLOYER';
  hasOnboarded: boolean;
}

export default function DashboardPage() {
  const { address } = useAccount();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignupFlow, setShowSignupFlow] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      if (address) {
        console.log('🔍 Checking user for address:', address);
        setLoading(true);
        try {
          const response = await fetch(`/api/user/get?walletAddress=${address}`);
          console.log('📡 API Response status:', response.status);
          
          if (response.status === 404) {
            console.log('👤 User not found, showing signup flow');
            setShowSignupFlow(true);
            setUser(null);
          } else if (response.ok) {
            const data = await response.json();
            console.log('✅ User found:', data);
            // Redirect to appropriate dashboard based on user type
            if (data.userType === 'EMPLOYER') {
              console.log('🏢 Redirecting to employer dashboard');
              router.push('/dashboard/employer');
              return;
            } else if (data.userType === 'EMPLOYEE') {
              console.log('👤 Redirecting to employee dashboard');
              router.push('/dashboard/employee');
              return;
            }
            setUser(data);
            setShowSignupFlow(false);
          } else {
            console.error('❌ API Error:', response.status);
            // If there's an API error, show signup flow as fallback
            setShowSignupFlow(true);
            setUser(null);
          }
        } catch (error) {
          console.error("Error checking user:", error);
          // On network error, show signup flow as fallback
          setShowSignupFlow(true);
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        console.log('🔌 No wallet address, waiting for connection');
        setLoading(false);
        setUser(null);
        setShowSignupFlow(false);
      }
    }

    fetchUser();
  }, [address]);

  const handleSignupComplete = async (userData: {
    userType: 'EMPLOYER' | 'EMPLOYEE';
    organizationName?: string;
    displayName?: string;
    contractAddress?: `0x${string}`;
    orgID?: bigint;
  }) => {
    console.log('🎯 handleSignupComplete called with:', userData);
    
    if (!address) {
      console.error('❌ No wallet address available');
      return;
    }

    try {
      const requestBody = {
        walletAddress: address,
        ...userData,
        orgID: userData.orgID ? userData.orgID.toString() : undefined,
      };
      
      console.log('📤 Sending API request:', requestBody);
      
      const response = await fetch('/api/user/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        const newUser = await response.json();
        console.log('🎉 User created successfully:', newUser);
        
        // Redirect to appropriate dashboard based on user type
        if (newUser.userType === 'EMPLOYER') {
          console.log('🏢 Redirecting new employer to employer dashboard');
          router.push('/dashboard/employer');
        } else if (newUser.userType === 'EMPLOYEE') {
          console.log('👤 Redirecting new employee to employee dashboard');
          router.push('/dashboard/employee');
        }
      } else {
        console.error("Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  console.log('🎯 Dashboard render state:', { loading, address: !!address, showSignupFlow, user: !!user, userType: user?.userType });

  if (loading) {
    console.log('⏳ Showing loading spinner');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!address) {
    console.log('🔌 No wallet connected');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Wallet Not Connected</h2>
          <p className="text-gray-600">Please connect your wallet to access the dashboard.</p>
        </div>
      </div>
    );
  }

  if (showSignupFlow) {
    console.log('📝 Showing signup flow');
    return <SignupFlow isOpen={true} onComplete={handleSignupComplete} />;
  }

  // This should not be reached as users are redirected to specific dashboards
  if (user) {
    console.log('⚠️ User found but not redirected - this should not happen');
    if (user.userType === 'EMPLOYER') {
      router.push('/dashboard/employer');
    } else {
      router.push('/dashboard/employee');
    }
    return null;
  }

  console.log('❓ Fallback state - something went wrong');
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-4">We couldn't load your dashboard. Please try refreshing the page.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}