// lib/nav-items.tsx
import { NavItem } from '@/types/nav';
import { usePathname } from 'next/navigation';
import Image from "next/image";
import { Settings } from 'lucide-react';

export function useNavItems(isAdmin: boolean): NavItem[] {
  const pathname = usePathname() ?? '';

  const isActive = (path: string) => pathname.includes(path);

  const items: NavItem[] = [
    {
      name: 'Home',
      href: '/',
      icon: <Image src="/images/home.svg" alt="Home" width={20} height={20} />,
      active: pathname === '/',
      position: 'top',
    },
    {
      name: 'Whitepaper',
      href: '/whitepaper',
      icon: <Image src="/images/whitepaper1.svg" alt="Whitepaper" width={20} height={20} />,
      active: isActive('/whitepaper'),
      position: 'top',
    },
    {
      name: 'About',
      href: '/about',
      icon: <Image src="/images/info.svg" alt="About" width={20} height={20} />,
      active: isActive('/about'),
      position: 'top',
    },
    {
      name: 'Free Chippy Friday',
      href: '/chippyfriday',
      icon: <Image src="/images/logo1.png" alt="Free Chippy Friday" width={20} height={20} />,
      active: isActive('/chippyfriday'),
      position: 'top',
    },
    {
      name: 'Stake Chippy',
      href: '/stake',
      icon: <Image src="/images/token.svg" alt="Stake Chippy" width={20} height={20} />,
      active: isActive('/stake'),
      position: 'top',
    },
    {
      name: 'Solana Information',
      href: '/solana',
      icon: <Image src="/images/solanalogo.svg" alt="Solana Information" width={20} height={20} />,
      active: isActive('/solana'),
      position: 'top',
    },
    {
      name: 'Leaderboards',
      href: '/leaderboard',
      icon: <Image src="/images/leaderboard.svg" alt="Leaderboards" width={20} height={20} />,
      active: isActive('/leaderboard'),
      position: 'top',
    },
    {
      name: 'Admin',
      href: '/adminconfig',
      icon: <Image src="/images/admin2.svg" alt="Admin" width={20} height={20} />,
      active: isActive('/adminconfig'),
      position: 'top',
      adminOnly: true, // <— tells system to hide unless admin
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: <Settings size={20} />,
      active: isActive('/settings'),
      position: 'bottom',
    },
  ];

  // filter admin-only items if user isn't admin
  return items.filter(item => !item.adminOnly || isAdmin);
}
