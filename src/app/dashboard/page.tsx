'use client';

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { SignupFlow } from "@/components/signup-flow";

export default function DashboardPage() {
  const { address } = useAccount();
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignupFlow, setShowSignupFlow] = useState(false);

  useEffect(() => {
    async function checkUser() {
      if (address) {
        setLoading(true);
        try {
          const response = await fetch(`/api/user/exists?walletAddress=${address}`);
          const data = await response.json();
          setUserExists(data.exists);
          if (!data.exists) {
            setShowSignupFlow(true);
          }
        } catch (error) {
          console.error("Error checking user:", error);
          setUserExists(false);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setUserExists(null);
        setShowSignupFlow(false);
      }
    }

    checkUser();
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
        setUserExists(true);
        setShowSignupFlow(false);
      } else {
        console.error("Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!address) {
    return <div>Please connect your wallet.</div>;
  }

  if (showSignupFlow) {
    return <SignupFlow isOpen={showSignupFlow} onComplete={handleSignupComplete} />;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Wallet Address: {address}</p>
      {userExists ? (
        <p>Welcome back!</p>
      ) : (
        <p>User with this wallet address does not exist.</p>
      )}
    </div>
  );
}