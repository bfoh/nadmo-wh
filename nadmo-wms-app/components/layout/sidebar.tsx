'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Truck,
  Bell,
  ClipboardList,
  Users,
  Settings,
  Map,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NadmoLogo } from '@/components/ui/nadmo-logo';
import { UserRole } from '@/types';
import { canViewAuditLog, canManageUsers } from '@/lib/auth';

interface SidebarProps {
  role: UserRole;
  userName: string;
  warehouseName?: string;
}

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: (role: UserRole) => boolean;
};

type NavSection = { heading: string; items: NavItem[] };

// Grouped so the sidebar reads as a command structure, not a flat list.
const navSections: NavSection[] = [
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

export function Sidebar({ role, userName, warehouseName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-sidebar-border bg-sidebar">
      <div className="h-16 px-5 flex items-center gap-2.5">
        <NadmoLogo className="h-9 w-9 shrink-0" />
        <div className="min-w-0">
          <h1 className="font-display font-bold text-sm leading-none tracking-tight text-sidebar-foreground">
            NADMO&#8202;<span className="text-primary">WMS</span>
          </h1>
          <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            Warehouse Command
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => {
          const items = section.items.filter(
            (item) => !item.permission || item.permission(role)
          );
          if (items.length === 0) return null;

          return (
            <div key={section.heading} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-faint">
                {section.heading}
              </div>
              {items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-sidebar-accent text-ink'
                        : 'text-ink-subtle hover:bg-sidebar-accent/60 hover:text-ink'
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
          );
        })}
      </nav>

      <div className="m-3 rounded-lg bg-sidebar-accent/50 p-3">
        <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-ink-faint">
          Signed in
        </div>
        <div className="mt-0.5 truncate text-sm font-medium text-ink">{userName}</div>
        {warehouseName && (
          <div className="mt-0.5 truncate text-xs text-ink-subtle">{warehouseName}</div>
        )}
      </div>
    </aside>
  );
}
