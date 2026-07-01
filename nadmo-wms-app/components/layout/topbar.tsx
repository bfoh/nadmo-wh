'use client';

import Link from 'next/link';
import { Bell, Menu, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NadmoLogo } from '@/components/ui/nadmo-logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Sidebar } from './sidebar';
import { UserRole } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface TopbarProps {
  role: UserRole;
  userName: string;
  warehouseName?: string;
  notificationCount?: number;
}

export function Topbar({ role, userName, warehouseName, notificationCount = 0 }: TopbarProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger className="lg:hidden">
            <Button variant="ghost" size="icon" aria-label="Open navigation">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar role={role} userName={userName} warehouseName={warehouseName} />
          </SheetContent>
        </Sheet>

        <div className="lg:hidden flex items-center gap-2">
          <NadmoLogo className="h-7 w-7" />
          <h1 className="font-display font-bold text-sm tracking-tight">
            NADMO<span className="text-primary">WMS</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />

        <Link href="/alerts" aria-label={`Alerts${notificationCount ? `, ${notificationCount} unread` : ''}`}>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-critical text-white text-[10px] font-semibold leading-none rounded-full flex items-center justify-center nums">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md pl-1.5 pr-2 py-1 outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/40">
            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline text-sm font-medium text-ink">
              {userName.split(' ')[0]}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="px-2.5 py-2">
              <div className="text-sm font-semibold text-ink">{userName}</div>
              {warehouseName && (
                <div className="text-xs text-ink-subtle">{warehouseName}</div>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
              <User className="size-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-critical focus:text-critical"
            >
              <LogOut className="size-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
