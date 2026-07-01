'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Truck,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomTabBarProps {
  notificationCount?: number;
}

type TabItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
};

export function BottomTabBar({ notificationCount = 0 }: BottomTabBarProps) {
  const pathname = usePathname();

  const tabs: TabItem[] = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Inventory', href: '/inventory', icon: Package },
    { label: 'Transfers', href: '/transfers', icon: Truck },
    { label: 'Alerts', href: '/alerts', icon: Bell, badge: notificationCount },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md pb-safe lg:hidden"
    >
      <div className="grid grid-cols-4 h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === '/'
              ? pathname === '/'
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-ink-faint active:text-ink-muted'
              )}
            >
              {/* Active top accent line */}
              {isActive && (
                <span className="absolute inset-x-3 top-0 h-0.5 bg-primary" />
              )}

              <span className="relative">
                <Icon
                  className={cn(
                    'size-5',
                    isActive ? 'text-primary' : 'text-ink-faint'
                  )}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {/* Alert badge */}
                {tab.badge != null && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-3.5 h-3.5 px-0.5 bg-critical text-white text-[9px] font-bold leading-none rounded-full flex items-center justify-center nums">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </span>

              <span className="leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
