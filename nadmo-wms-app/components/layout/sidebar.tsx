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

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Inventory', href: '/inventory', icon: Package },
  { label: 'Transfers', href: '/transfers', icon: Truck },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'Audit Log', href: '/audit', icon: ClipboardList, permission: canViewAuditLog },
  { label: 'Map', href: '/map', icon: Map },
  { label: 'Users', href: '/users', icon: Users, permission: canManageUsers },
  { label: 'Settings', href: '/settings', icon: Settings, permission: canManageUsers },
];

export function Sidebar({ role, userName, warehouseName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r bg-sidebar">
      <div className="h-16 px-4 lg:px-6 border-b flex items-center">
        <div className="flex items-center gap-2">
          <NadmoLogo className="h-8 w-8 shrink-0" />
          <div>
            <h1 className="font-bold text-sm leading-tight text-sidebar-foreground">NADMO-WMS</h1>
            <p className="text-[10px] text-sidebar-foreground/70">Warehouse Command</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          if (item.permission && !item.permission(role)) return null;

          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="text-xs text-sidebar-foreground/70 mb-1">Logged in as</div>
        <div className="text-sm font-medium text-sidebar-foreground truncate">{userName}</div>
        {warehouseName && (
          <div className="text-xs text-sidebar-foreground/60 truncate">{warehouseName}</div>
        )}
      </div>
    </aside>
  );
}
