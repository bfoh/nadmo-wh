import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { BottomTabBar } from './bottom-tab-bar';
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
    <div className="min-h-dvh bg-background flex border-t-[3px] border-t-ghana-gold">
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
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-auto outline-none scroll-momentum px-safe"
        >
          {/* pb-20 on mobile clears the bottom tab bar (56px bar + safe-area);
              lg:pb-0 removes it on desktop where sidebar is visible. */}
          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
            {children}
          </div>
        </main>
      </div>

      <BottomTabBar notificationCount={notificationCount ?? 0} />
    </div>
  );
}
