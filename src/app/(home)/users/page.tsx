'use client';
import React, { useEffect, useState } from 'react';

interface User {
  _id: string;
  username: string;
  walletAddress?: string;
  balances: {
    SOL: number;
    CHIPPY: number;
    DEMO: number;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/user2'); // Your API endpoint
        if (!res.ok) throw new Error('Failed to fetch users');
        const data: User[] = await res.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">All Users</h1>
      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th style={{color: "black"}} className="border px-4 py-2">ID</th>
            <th style={{color: "black"}} className="border px-4 py-2">Wallet</th>
            <th style={{color: "black"}} className="border px-4 py-2">SOL</th>
            <th style={{color: "black"}} className="border px-4 py-2">CHIPPY</th>
            <th style={{color: "black"}} className="border px-4 py-2">DEMO</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td style={{color: "white"}} className="border px-4 py-2">{user._id}</td>
              <td style={{color: "white"}} className="border px-4 py-2">{user.walletAddress || '-'}</td>
              <td style={{color: "white"}} className="border px-4 py-2">{user.balances.SOL}</td>
              <td style={{color: "white"}} className="border px-4 py-2">{user.balances.CHIPPY}</td>
              <td style={{color: "white"}} className="border px-4 py-2">{user.balances.DEMO}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
