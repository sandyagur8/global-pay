'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

export default function Dashboard() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      checkUserTypeAndRedirect();
    } else {
      // If not connected, redirect to home
      router.push('/');
    }
  }, [isConnected, address, router]);

  const checkUserTypeAndRedirect = async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/user/check?address=${address}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          // Redirect based on user type
          if (data.user.userType === 'EMPLOYER') {
            router.push('/dashboard/organization');
          } else {
            router.push('/streams');
          }
        } else {
          // User doesn't exist, redirect to home for signup
          router.push('/');
        }
      } else {
        // API error, redirect to home
        router.push('/');
      }
    } catch (error) {
      console.error('Error checking user type:', error);
      router.push('/');
    } finally {
      setIsChecking(false);
    }
  };

  // Show loading while checking and redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}