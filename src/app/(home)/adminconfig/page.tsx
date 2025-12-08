import AdminConfigForm from "@/components/AdminConfigForm";
import { useWallet } from '@solana/wallet-adapter-react';
import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/router';



export default function AdminConfigPage() {

  const { connected, publicKey } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  //const router = useRouter();


  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!connected || !publicKey) {
        setIsAdmin(false);
        return;
      }

      try {
        const walletAddress = publicKey.toBase58();
        const response = await fetch(`/api/helius/dude451?wallet=${walletAddress}`);
        const data = await response.json();

        if (data.success && data.config && data.config.admin) {
          // Check if wallet matches admin address
          const isWalletAdmin = walletAddress === data.config.admin;
          setIsAdmin(isWalletAdmin);
        } else {
          setIsAdmin(false);
      //    router.push('/');  // Redirect to login if not logged in
          return null;  // Don't render the page until the redirect happens
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [connected, publicKey]);


  return (
    <div style={{ padding: "30px" }}>
      <AdminConfigForm />
    </div>
  );
}