'use client';

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import EmployerDashboard from "@/components/EmployerDashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface User {
  id: string;
  walletAddress: string;
  userType: 'EMPLOYEE' | 'EMPLOYER';
  hasOnboarded: boolean;
}

export default function EmployerDashboardPage() {
  const { address } = useAccount();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      if (!address) {
        console.log('🔌 No wallet connected, redirecting to main dashboard');
        router.push('/dashboard');
        return;
      }

      console.log('🔍 Checking employer access for:', address);
      setLoading(true);
      
      try {
        const response = await fetch(`/api/user/get?walletAddress=${address}`);
        
        if (response.status === 404) {
          console.log('👤 User not found, redirecting to onboarding');
          router.push('/dashboard');
          return;
        }
        
        if (response.ok) {
          const userData = await response.json();
          console.log('✅ User found:', userData);
          
          if (userData.userType !== 'EMPLOYER') {
            console.log('🚫 User is not an employer, redirecting to employee dashboard');
            router.push('/dashboard/employee');
            return;
          }
          
          setUser(userData);
        } else {
          console.error('❌ API Error:', response.status);
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Error checking user:", error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    checkUser();
  }, [address, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || user.userType !== 'EMPLOYER') {
    return null; // Will redirect via useEffect
  }

  return <EmployerDashboard />;
}
