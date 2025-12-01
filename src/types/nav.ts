// types/nav.ts
export interface NavItem {
    name: string;
    href: string;
    icon: React.ReactNode;
    active: boolean;
    position: 'top' | 'bottom';
    adminOnly?: boolean; // <— NEW
  }
  