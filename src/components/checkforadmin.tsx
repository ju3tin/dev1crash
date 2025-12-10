'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { checkAdmin } from '@/lib/checkAdmin';

interface CheckForAdminProps {
  children?: ReactNode;
  fallback?: ReactNode;
  onAdminStatusChange?: (isAdmin: boolean) => void;
  showLoading?: boolean;
  showError?: boolean;
}

/**
 * Component that checks if the connected wallet is an admin
 * Can be used as a wrapper to conditionally render content or as a provider
 */
export default function CheckForAdmin({
  children,
  fallback,
  onAdminStatusChange,
  showLoading = true,
  showError = true,
}: CheckForAdminProps) {
  const { connected, publicKey } = useWallet();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAdmin = async () => {
      setLoading(true);
      setError(null);

      if (!connected || !publicKey) {
        setIsAdmin(false);
        setLoading(false);
        onAdminStatusChange?.(false);
        return;
      }

      try {
        const walletAddress = publicKey.toBase58();
        const result = await checkAdmin(walletAddress);

        if (result.success) {
          setIsAdmin(result.isAdmin);
          onAdminStatusChange?.(result.isAdmin);
        } else {
          setIsAdmin(false);
          setError(result.error || 'Failed to verify admin status');
          onAdminStatusChange?.(false);
        }
      } catch (err: any) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
        setError(err.message || 'An error occurred while checking admin status');
        onAdminStatusChange?.(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, [connected, publicKey, onAdminStatusChange]);

  // Show loading state
  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-gray-400">Checking admin status...</div>
      </div>
    );
  }

  // Show error state
  if (error && showError) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  // If not connected
  if (!connected) {
    return (
      fallback || (
        <div className="flex items-center justify-center p-4">
          <div className="text-yellow-400">Please connect your wallet</div>
        </div>
      )
    );
  }

  // If not admin, show fallback or unauthorized message
  if (!isAdmin) {
    return (
      fallback || (
        <div className="flex items-center justify-center p-4">
          <div className="text-red-400">Unauthorized: Admin access required</div>
        </div>
      )
    );
  }

  // If admin, render children
  return <>{children}</>;
}

/**
 * Hook version for more flexible usage
 */
export function useAdminCheck() {
  const { connected, publicKey } = useWallet();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAdmin = async () => {
      setLoading(true);
      setError(null);

      if (!connected || !publicKey) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const walletAddress = publicKey.toBase58();
        const result = await checkAdmin(walletAddress);

        if (result.success) {
          setIsAdmin(result.isAdmin);
        } else {
          setIsAdmin(false);
          setError(result.error || 'Failed to verify admin status');
        }
      } catch (err: any) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
        setError(err.message || 'An error occurred while checking admin status');
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, [connected, publicKey]);

  return { isAdmin, loading, error, connected };
}

