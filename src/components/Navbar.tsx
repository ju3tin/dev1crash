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
    <nav className="bg-black/50 backdrop-blur-md p-4 sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex gap-6">
          <Link href="/" className="text-xl font-bold text-white hover:text-purple-400">
            CRASH GAME
          </Link>
          <Link href="/game" className="text-white hover:text-purple-400">Game</Link>
          <Link href="/admin" className="text-white hover:text-purple-400">Admin</Link>
          <Link href="/history" className="text-white hover:text-purple-400">History</Link>
          <Link href="/faq" className="text-white hover:text-purple-400">FAQ</Link>
        </div>
        {mounted && <WalletMultiButton />}
      </div>
    </nav>
  );
}