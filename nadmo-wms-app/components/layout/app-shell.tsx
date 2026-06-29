import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { UserRole } from '@/types';

interface AppShellProps {
  children: React.ReactNode;
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    role: UserRole;
  };
  warehouseName?: string;
  notificationCount?: number;
}

export function AppShell({ children, profile, warehouseName, notificationCount }: AppShellProps) {
  const userName = `${profile.first_name} ${profile.last_name}`;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar role={profile.role} userName={userName} warehouseName={warehouseName} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          role={profile.role}
          userName={userName}
          warehouseName={warehouseName}
          notificationCount={notificationCount}
        />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
