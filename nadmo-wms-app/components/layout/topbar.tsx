'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Menu,
  User,
  LogOut,
  LayoutDashboard,
  Package,
  Truck,
  ClipboardList,
  Users,
  Settings,
  Map,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { NadmoLogo } from '@/components/ui/nadmo-logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { UserRole } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { canViewAuditLog, canManageUsers } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface TopbarProps {
  role: UserRole;
  userName: string;
  warehouseName?: string;
  notificationCount?: number;
}

type DrawerNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: (role: UserRole) => boolean;
};

// The drawer is the full menu (bottom tab bar is quick-access to the top 4).
// Grouped like the desktop sidebar so it's always populated and complete.
const drawerSections: { heading: string; items: DrawerNavItem[] }[] = [
  {
    heading: 'Operations',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      { label: 'Inventory', href: '/inventory', icon: Package },
      { label: 'Transfers', href: '/transfers', icon: Truck },
      { label: 'Map', href: '/map', icon: Map },
    ],
  },
  {
    heading: 'Oversight',
    items: [
      { label: 'Alerts', href: '/alerts', icon: Bell },
      { label: 'Audit Log', href: '/audit', icon: ClipboardList, permission: canViewAuditLog },
    ],
  },
  {
    heading: 'Administration',
    items: [
      { label: 'Users', href: '/users', icon: Users, permission: canManageUsers },
      { label: 'Settings', href: '/settings', icon: Settings, permission: canManageUsers },
    ],
  },
];

export function Topbar({ role, userName, warehouseName, notificationCount = 0 }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [scrolled, setScrolled] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  // Compact-on-scroll: shrink topbar height after 40px of scroll.
  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main) return;

    function onScroll() {
      setScrolled(main!.scrollTop > 40);
    }
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => main.removeEventListener('scroll', onScroll);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const visibleSections = drawerSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || item.permission(role)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <header
      className={cn(
        'border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 pt-safe pl-safe pr-safe transition-[min-height] duration-200',
        scrolled ? 'min-h-12' : 'min-h-16'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Mobile hamburger — full navigation drawer */}
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Open navigation" className="lg:hidden" />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0 w-72 pt-safe">
            <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <NadmoLogo className="h-8 w-8 shrink-0" />
                <SheetTitle className="font-display font-bold text-sm tracking-tight text-foreground">
                  NADMO&#8202;<span className="text-primary">WMS</span>
                </SheetTitle>
              </div>
            </SheetHeader>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scroll-momentum">
              {visibleSections.map((section) => (
                <div key={section.heading} className="space-y-1">
                  <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-faint">
                    {section.heading}
                  </div>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === '/'
                        ? pathname === '/'
                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setNavOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                          isActive
                            ? 'bg-accent text-ink'
                            : 'text-ink-subtle hover:bg-accent/60 hover:text-ink'
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                        )}
                        <Icon
                          className={cn(
                            'size-4 shrink-0 transition-colors',
                            isActive ? 'text-primary' : 'text-ink-faint group-hover:text-ink-subtle'
                          )}
                        />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Account footer */}
            <div className="border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] space-y-2">
              <div className="rounded-lg bg-accent/50 p-3">
                <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-ink-faint">
                  Signed in
                </div>
                <div className="mt-0.5 truncate text-sm font-medium text-ink">{userName}</div>
                {warehouseName && (
                  <div className="mt-0.5 truncate text-xs text-ink-subtle">{warehouseName}</div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setNavOpen(false);
                    router.push('/profile');
                  }}
                >
                  <User className="size-4" />
                  Profile
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 text-critical hover:text-critical"
                  onClick={handleSignOut}
                >
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo — visible on mobile and desktop */}
        <div className="flex items-center gap-2">
          <NadmoLogo className={cn('shrink-0 transition-all duration-200', scrolled ? 'h-6 w-6' : 'h-7 w-7')} />
          <h1 className={cn(
            'font-display font-bold tracking-tight transition-all duration-200 lg:hidden',
            scrolled ? 'text-xs' : 'text-sm'
          )}>
            NADMO<span className="text-primary">WMS</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />

        {/* Notification center — desktop (mobile uses the bottom tab bar's Alerts) */}
        <NotificationCenter unreadCount={notificationCount} className="hidden lg:block" />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md pl-1.5 pr-2 py-1 outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/40">
            <div className={cn(
              'rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold transition-all duration-200',
              scrolled ? 'size-7 text-xs' : 'size-8 text-sm'
            )}>
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
