"use client";
import { addEmployee } from "@/lib/contract";
import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";

interface Organization {
  id: string;
  name: string;
  contractAddress: string;
  paymentToken: string;
}

interface Employee {
  id: string;
  walletAddress: string;
}

const EmployerDashboard = () => {
  const { address, isConnected, chain } = useAccount();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    setOrganization(null);

    if (address && isConnected) {
      let isCancelled = false;

      const fetchOrganization = async () => {
        try {
          const response = await fetch(
            `/api/organization?walletAddress=${address}&t=${Date.now()}`,
            { method: "GET", headers: { "Cache-Control": "no-cache" } }
          );

          if (isCancelled) return;

          if (!response.ok) throw new Error("Failed to fetch organization");

          const data = await response.json();
          if (!isCancelled) setOrganization(data);
        } catch (err) {
          if (!isCancelled) setError((err as Error).message);
        } finally {
          if (!isCancelled) setLoading(false);
        }
      };

      const fetchEmployees = async () => {
        try {
          const response = await fetch("/api/employees", {
            method: "GET",
            headers: { "Cache-Control": "no-cache" },
          });

          if (!response.ok) throw new Error("Failed to fetch employees");

          const data = await response.json();
          if (!isCancelled) setEmployees(data);
        } catch (err) {
          if (!isCancelled) setError((err as Error).message);
        }
      };

      fetchOrganization();
      fetchEmployees();

      return () => {
        isCancelled = true;
      };
    } else {
      setLoading(false);
    }
  }, [address, isConnected]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee) {
      alert("Please select an employee");
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const res = await fetch("/api/computesignal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: selectedEmployee,
        amount: amount
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      alert(`Error: ${errorData.error || "Failed to add employee"}`);
      return;
    }

    const data = await res.json();
    console.log("Signals computed:", data.signals);
    const signals = data.signals;

    const emp = await addEmployee(
      organization!.contractAddress,
      [BigInt(signals[0] as string), BigInt(signals[1] as string)],
      [BigInt(signals[2] as string), BigInt(signals[3] as string)]
    );

    alert(`Employee added:${emp}`);

    console.log("Add employee placeholder - selected:", selectedEmployee);
    // TODO: actual implementation
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!organization) return <div>No organization found for this user.</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Organization Details</h2>
      <div className="space-y-2 mb-6">
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

      <h3 className="text-xl font-semibold mb-2">Add Employee</h3>
      {employees.length === 0 ? (
        <p>No employees available.</p>
      ) : (
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <select
            className="border p-2 rounded w-full"
            value={selectedEmployee}
            onChange={(e) => {
              console.log(e.target.value)
              setSelectedEmployee(e.target.value)
            }
            }
            required
          >
            <option value="">Select Employee</option>
            {employees.map((emp, idx) => (
              <option key={idx} value={emp.walletAddress}>
                {emp.walletAddress}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Enter amount"
            className="border p-2 rounded w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Add Employee
          </button>
        </form>
      )}
    </div>
  );
};

export default EmployerDashboard;
