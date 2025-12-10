// components/AdminOnly.tsx
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import type React from 'react';

type AdminOnlyProps = {
  children: React.ReactNode;
  walletAddress: string;        // you must pass the connected wallet
  redirectTo?: string;          // default: /login
};

export default async function AdminOnly({
  children,
  walletAddress,
  redirectTo = '/login',
}: AdminOnlyProps) {
  if (!walletAddress) {
    redirect(redirectTo);
  }

  // Call your exact API
  const res = await fetch(
    `/api/helius/dude451?wallet=${walletAddress}`,
    {
      method: 'GET',
      headers: headers(), // forwards cookies if needed
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    redirect(redirectTo);
  }

  const data = await res.json();

  if (!data.isAdmin) {
    redirect(redirectTo);
  }

  // User IS admin → render protected content
  return <>{children}</>;
}