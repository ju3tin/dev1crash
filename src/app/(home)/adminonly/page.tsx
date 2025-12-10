// app/admin/dashboard/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminOnly from '@/components/AdminOnly';



export default async function AdminDashboard() {
  // If we have stored the connected wallet in a cookie, use it; otherwise send
  // the user to connect first. This keeps the page server-only (no client hooks).
  const wallet =
    cookies().get('wallet')?.value || cookies().get('walletAddress')?.value;
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