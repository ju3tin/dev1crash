// app/admin/dashboard/page.tsx
'use client';
import AdminOnly from '@/components/AdminOnly';
//import { getWallet } from '@/lib/wallet'; // your way of getting the wallet (server or client)

export default async function AdminDashboard() {
  const wallet = '14RxG3uBSHkzpiEE3muBMxg2dEQXw2rSvzJvJatWuQ2r'; // ← your logic: session, cookie, middleware, etc.

  return (
    <AdminOnly walletAddress={wallet} redirectTo="/connect">
      <div className="p-10">
        <h1 className="text-4xl font-bold mb-6">Secret Admin Dashboard</h1>
        <p>Only true degens can see this</p>
        {/* your admin UI */}
      </div>
    </AdminOnly>
  );
}