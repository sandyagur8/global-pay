'use client';

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { SignupFlow } from "@/components/signup-flow";
import EmployeeDashboard from "@/components/EmployeeDashboard";
import EmployerDashboard from "@/components/EmployerDashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface User {
  id: string;
  walletAddress: string;
  userType: 'EMPLOYEE' | 'EMPLOYER';
  hasOnboarded: boolean;
}

export default function DashboardPage() {
  const { address } = useAccount();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignupFlow, setShowSignupFlow] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      if (address) {
        setLoading(true);
        try {
          const response = await fetch(`/api/user/get?walletAddress=${address}`);
          if (response.status === 404) {
            setShowSignupFlow(true);
            setUser(null);
          } else {
            const data = await response.json();
            setUser(data);
            setShowSignupFlow(false);
          }
        } catch (error) {
          console.error("Error checking user:", error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
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
  }) => {
    if (!address) return;

    try {
      const response = await fetch('/api/user/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          ...userData,
        }),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUser(newUser);
        setShowSignupFlow(false);
      } else {
        console.error("Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!address) {
    return <div>Please connect your wallet.</div>;
  }

  if (showSignupFlow) {
    return <SignupFlow isOpen={showSignupFlow} onComplete={handleSignupComplete} />;
  }

  if (user) {
    return user.userType === 'EMPLOYER' ? <EmployerDashboard /> : <EmployeeDashboard />;
  }

  return <div>Something went wrong.</div>;
}