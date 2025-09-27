"use client";
import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";

interface Organization {
  id: string;
  name: string;
  contractAddress: string;
  paymentToken: string;
}

const EmployerDashboard = () => {
  const { address } = useAccount();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      const fetchOrganization = async () => {
        try {
          const response = await fetch(
            `/api/organization?walletAddress=${address}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch organization");
          }
          const data = await response.json();
          setOrganization(data);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setLoading(false);
        }
      };

      fetchOrganization();
    }
  }, [address]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!organization) {
    return <div>No organization found for this user.</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Organization Details</h2>
      <div className="space-y-2">
        <p>
          <strong>Name:</strong> {organization.name}
        </p>
        <p>
          <strong>Contract Address:</strong> {organization.contractAddress}
        </p>
        <p>
          <strong>Payment Token:</strong> {organization.paymentToken}
        </p>
      </div>
    </div>
  );
};

export default EmployerDashboard;
