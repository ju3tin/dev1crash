import { usePathname } from 'next/navigation';
import Image from "next/image";
import { NavItem } from '@/types/nav';
import { Bell, Briefcase, Home, Settings, User, WalletCards, BookOpenCheck, Fish,
  Bookmark,
  List,
  Mail,
  MoreHorizontal,
  Users,
  Gamepad2,
  BadgeInfo,
  Info, } from 'lucide-react';

export const NavItems = (isAdmin: boolean) => {
  const pathname = usePathname() || '';

  function isNavItemActive(pathname: string, nav: string) {
    return pathname.includes(nav);
  }

  const navItems: NavItem[] = [
    {
      name: 'Home',
      href: '/',
      icon: <Image src="/images/home.svg" alt="Chippy" width={20} height={20} />,
      active: pathname === '/',
      position: 'top',
    },
    {
      name: 'Whitepaper',
      href: '/whitepaper',
      icon: <Image src="/images/whitepaper1.svg" alt="Chippy" width={20} height={20} />,
      active: isNavItemActive(pathname, '/whitepaper'),
      position: 'top',
    },
    {
      name: 'About',
      href: '/about',
      icon: <Image src="/images/info.svg" alt="Chippy" width={20} height={20} />,
      active: isNavItemActive(pathname, '/about'),
      position: 'top',
    },
    {
      name: 'Free Chippy Friday',
      href: '/chippyfriday',
      icon: <Image src="/images/logo1.png" alt="Chippy" width={20} height={20} />,
      active: isNavItemActive(pathname, '/chippyfriday'),
      position: 'top',
    },
    {
      name: 'Stake Chippy',
      href: '/stake',
      icon: <Image src="/images/token.svg" alt="Buy Chippy" width={20} height={20} />,
      active: isNavItemActive(pathname, '/stable'),
      position: 'top',
    },
    {
      name: 'Solana Information',
      href: '/solana',
      icon: <Image src="/images/solanalogo.svg" alt="Solana Logo" height={20} width={20} />,
      active: isNavItemActive(pathname, '/solana'),
      position: 'top',
    },
    {
      name: 'Leaderboard',
      href: '/leaderboard',
      icon: <Image src="/images/leaderboard.svg" alt="Solana Logo" height={20} width={20} />,
      active: isNavItemActive(pathname, '/leaderboard'),
      position: 'top',
    },
  ];

  // Conditionally add Admin menu item if isAdmin is true
  if (isAdmin) {
    navItems.push({
      name: 'Admin',
      href: '/adminconfig',
      icon: <Image src="/images/admin2.svg" alt="Admin" height={20} width={20} />,
      active: isNavItemActive(pathname, '/adminconfig'),
      position: 'top',
      adminOnly: true,
    });
  }

  navItems.push({
    name: 'Settings',
    href: '/settings',
    icon: <Settings size={20} />,
    active: isNavItemActive(pathname, '/settings'),
    position: 'bottom',
  });

  return navItems;
};
