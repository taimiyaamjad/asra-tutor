'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/home', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/login', label: 'Login' },
];

export function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 items-center">
        <div className="mr-4 flex">
          <Link href="/home" className="flex items-center space-x-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <span className="font-bold">Asra</span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center space-x-6">
          {navItems
            .filter(item => item.href !== '/login') // Don't show login as a nav link
            .map(item => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === item.href ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
                <Button asChild>
                    <Link href="/login">Get Started</Link>
                </Button>
            </nav>
        </div>
      </div>
    </header>
  );
}
