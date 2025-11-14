import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { useProgram } from '@/lib/anchor7';
import SideNav from '@/components/side-nav1'; 
import ContextProvider from '@/components/context-provider';
import Head from 'next/head'
import { Analytics } from "@vercel/analytics/react";
import Header from './header';
import { WalletProvider } from "@/wallet-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Solana Staking App",
  description: "Stake your Solana tokens and earn rewards",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <ContextProvider>
        <Head>
          <title>Solana Staking App</title>
          <meta name="description" content="Stake your Solana tokens and earn rewards" />
        </Head>
        <Header />
        <div className="flex">
        <SideNav />
        <ErrorBoundary>
          <WalletProvider>{children}</WalletProvider>
        </ErrorBoundary>
        <Analytics />
        </div>
        </ContextProvider>


      </body>
    </html>
  )
}
