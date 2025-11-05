// src/components/UserBalance.tsx
import { useWallet } from '@solana/wallet-adapter-react';
import { CrashGameClient } from '../lib/client';
import { useEffect, useState } from 'react';

export function UserBalance() {
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<string | null>(null);
  const client = new CrashGameClient();

  useEffect(() => {
    if (publicKey) {
      loadBalance();
    }
  }, [publicKey]);

  const loadBalance = async () => {
    if (!publicKey) return;
    
    try {
      const response = await client.getUserBalance(publicKey.toString());
      if (response.success) {
        setBalance(response.balance);
      }
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  return (
    <div>
      {publicKey ? (
        <p>Balance: {balance ? `${balance} lamports` : 'Loading...'}</p>
      ) : (
        <p>Connect wallet to view balance</p>
      )}
    </div>
  );
}