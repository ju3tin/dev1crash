'use client';

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { NavItems } from "@/config";
import { SidebarMenu } from "@/components/ui/sidebar";
import { checkAdmin } from "@/lib/checkAdmin";
import Link from "next/link";

export default function Sidebar() {
  const [isAdmin, setIsAdmin] = useState(false);

  // Example: You get the wallet public key from your wallet provider
  const wallet = useWallet();
  const walletAddress = wallet?.publicKey?.toString();

  useEffect(() => {
    async function verifyAdmin() {
      if (!walletAddress) {
        setIsAdmin(false);
        return;
      }

      const result = await checkAdmin(walletAddress);
      setIsAdmin(Boolean(result?.isAdmin));
    }
    verifyAdmin();
  }, [walletAddress]);

  const items = NavItems(isAdmin);

  return (
    <SidebarMenu>
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href}>{item.name}</Link>
        </li>
      ))}
    </SidebarMenu>
  );
}
