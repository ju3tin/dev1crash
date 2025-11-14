'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav>
        {mounted && <WalletMultiButton />}
    </nav>
  );
}