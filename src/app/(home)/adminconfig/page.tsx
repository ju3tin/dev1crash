'use client';

import AdminConfigForm from "@/components/AdminConfigForm";
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // ← Correct import for App Router

export default function AdminConfigPage() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true); // Show loading while checking

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!connected || !publicKey) {
        router.replace('/'); // ← Redirect if not connected
        return;
      }

      try {
        const walletAddress = publicKey.toBase58();
        const response = await fetch(`/api/helius/dude451?wallet=${walletAddress}`);

        if (!response.ok) {
          router.replace('/');
          return;
        }

        const data = await response.json();

        // Check if the connected wallet matches the admin address
        const isWalletAdmin = data.success && data.config?.admin === walletAddress;

        if (!isWalletAdmin) {
          router.replace('/'); // ← This actually redirects
        } else {
          setIsLoading(false); // Only render page if admin
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.replace('/');
      }
    };

    checkAdminStatus();
  }, [connected, publicKey, router]);

  // Show loading spinner while checking
  if (isLoading) {
    return (
      <div style={{ padding: "30px", textAlign: "center" }}>
        <p>Checking admin access...</p>
      </div>
    );
  }

  // Only render the admin form if user is confirmed admin
  return (
    <div style={{ padding: "30px" }}>
      <h1>Admin Config</h1>
      <AdminConfigForm />
    </div>
  );
}