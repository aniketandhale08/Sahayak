
"use client";

import { BookOpen, Menu } from 'lucide-react';
import Link from 'next/link';
import { useSidebar } from './ui/sidebar';

export function Header() {
  const { toggleSidebar } = useSidebar();
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-card text-foreground">
        <button onClick={toggleSidebar} className="mr-4 md:hidden">
            <Menu className="h-6 w-6" />
        </button>
      <Link href="/" className="flex items-center justify-center" prefetch={false}>
        <BookOpen className="h-6 w-6 text-secondary" />
        <span className="ml-3 text-xl font-bold font-headline text-foreground">Sahayak</span>
      </Link>
    </header>
  );
}
