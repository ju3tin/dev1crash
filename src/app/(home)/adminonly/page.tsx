// app/admin/dashboard/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminOnly from '@/components/AdminOnly';

export default async function AdminDashboard() {
  // Read the connected wallet address from a cookie set at login/connect time.
  // If it is missing, push users to connect first.
  const wallet = cookies().get('walletAddress')?.value;
  if (!wallet) {
    redirect('/connect');
  }

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