import { WalletProvider } from '@solana/wallet-adapter-react'; // or your wallet context provider
import { ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import React, { useMemo } from 'react';

export default function App({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;

  // Configure the network connection
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Configure wallets
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}