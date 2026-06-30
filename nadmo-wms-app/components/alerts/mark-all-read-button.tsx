'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export function MarkAllReadButton({ unread }: { unread: number }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  if (unread === 0) return null;

  async function handleClick() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) {
        toast.error('Could not update notifications');
        return;
      }
      toast.success('All notifications marked as read');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      <CheckCheck className="mr-2 h-4 w-4" />
      {loading ? 'Marking…' : 'Mark all read'}
    </Button>
  );
}
