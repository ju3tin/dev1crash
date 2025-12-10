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

  // Get the base URL for the API call
  const headersList = headers();
  const host = headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const baseUrl = `${protocol}://${host}`;

  // Call your exact API with absolute URL
  const res = await fetch(
    `${baseUrl}/api/helius/dude451?wallet=${walletAddress}`,
    {
      method: 'GET',
      headers: {
        cookie: headersList.get('cookie') || '',
      },
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