'use client';

import type { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

/**
 * HQ dashboard shell: "My Warehouse" (operational view of the HQ warehouse)
 * and "National" (nationwide oversight). The two views are server-rendered
 * and passed in as nodes.
 */
export function DashboardTabs({
  myWarehouse,
  national,
}: {
  myWarehouse: ReactNode;
  national: ReactNode;
}) {
  return (
    <Tabs defaultValue="mine" className="space-y-4">
      <TabsList>
        <TabsTrigger value="mine">My Warehouse</TabsTrigger>
        <TabsTrigger value="national">National</TabsTrigger>
      </TabsList>
      <TabsContent value="mine" className="space-y-6">
        {myWarehouse}
      </TabsContent>
      <TabsContent value="national" className="space-y-6">
        {national}
      </TabsContent>
    </Tabs>
  );
}
