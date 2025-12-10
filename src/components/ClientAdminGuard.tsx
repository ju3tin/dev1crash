// components/ClientAdminGuard.tsx
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ClientAdminGuard({ children }: { children: React.ReactNode }) {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!connected || !publicKey) {
      router.replace('/');
      return;
    }

    fetch(`/api/helius/dude451?wallet=${publicKey.toBase58()}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.config?.admin === publicKey.toBase58()) {
          setAllowed(true);
        } else {
          router.replace('/');
        }
      })
      .catch(() => router.replace('/'));
  }, [connected, publicKey, router]);

  if (!allowed) {
    return <div>Checking permissions...</div>;
  }

  return <>{children}</>;
}
