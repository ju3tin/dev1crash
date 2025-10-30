'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from "next/image";
import LoginButton from '@/components/login-buton';
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { NavItems } from '@/config';
import { Menu } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsOpen(false)
    // ✅ Action 1: log, API call, state update, etc.
    console.log("Button clicked!");
    // maybe call an API here or update state

    // ✅ Action 2: navigate to another page
    router.push("/login2");
  };
  const navItems = NavItems();
  const [isOpen, setIsOpen] = useState(false);
  const handleWalletConnect = (address: string) => {
    console.log("Connected wallet address:", address);
  };
  return (
    <header className="sticky top-0 z-50 flex items-center h-16 px-4 border-b bg-white dark:bg-black shadow-md md:px-6 justify-between">
      <Link
        href="#"
        className="flex items-center gap-2 text-lg font-semibold md:text-base"
        prefetch={false}
      >
        {/* Logo Image */}
        <span className="w-8 h-8 border bg-accent rounded-full overflow-hidden">
          <Image src="/images/logo1.png" alt="Profile" width={32} height={32} className="object-cover" />
        </span>
      </Link>

      {/* Centered Image */}
      <Link href="#">
        <span className="flex items-center justify-center h-24">
          <Image src="/image07.png" alt="Profile" width={200} height={100} className="object-contain" />
        </span>
      </Link>

      <div className="ml-4 flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button onClick={() => setIsOpen(true)} className="block sm:hidden">
          <Menu size={24} />
        </button>

        {/* Mobile Navigation Sheet */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="right" className="block md:hidden">
            <div className="pt-4 overflow-y-auto h-fit w-full flex flex-col gap-1">
              {navItems.map((navItem, idx) => (
                <Link
                  key={idx}
                  href={navItem.href}
                  onClick={() => setIsOpen(false)}
                  className={`h-full relative flex items-center whitespace-nowrap rounded-md ${
                    navItem.active
                      ? 'font-base text-sm bg-neutral-200 shadow-sm text-neutral-700 dark:bg-neutral-800 dark:text-white'
                      : 'hover:bg-neutral-200 hover:text-neutral-700 text-neutral-500 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
                  }`}
                >
                  <div className="relative font-base text-sm py-1.5 px-2 flex flex-row items-center space-x-2 rounded-md duration-100">
                    {navItem.icon}
                    <span>{navItem.name}</span>
                  </div>
                </Link>
              ))}
             <LoginButton />
             <button
      onClick={handleClick}
      className="px-4 py-2 bg-purple-500 text-white rounded"
    >
      Do Two Things
    </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}