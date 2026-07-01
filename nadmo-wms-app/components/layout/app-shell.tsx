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
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar role={profile.role} userName={userName} warehouseName={warehouseName} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          role={profile.role}
          userName={userName}
          warehouseName={warehouseName}
          notificationCount={notificationCount}
        />
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-auto outline-none">
          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
