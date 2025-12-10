// components/AdminGuard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
//import { useAuth } from '@/hooks/useAuth'; // Your auth hook/context

interface AdminGuardwireProps {
  children: React.ReactNode;
  fallback?: React.ReactNode; // Optional loading/fallback UI
}

export default function AdminGuard() {
//  const { user, isLoading } = useAuth(); // Replace with your actual auth logic
const { user, isLoading } = {user: null, isLoading: false} as { user: any, isLoading: boolean }; // Replace with your actual auth logic

const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      router.replace('/login'); // or '/unauthorized', '/home', etc.
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    //return <>{fallback}</> || <div>Loading...</div>;
  }

  if (!user || !user.isAdmin) {
    return null; // Redirect is handled in useEffect
  }

 // return <>{children}</>;
}