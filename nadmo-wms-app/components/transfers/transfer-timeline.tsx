import { TransferOrder } from '@/types';

interface TransferTimelineProps {
  transfer: TransferOrder;
}

interface TimelineEvent {
  label: string;
  date: string | null | undefined;
  actor?: string | null;
  active: boolean;
}

export function TransferTimeline({ transfer }: TransferTimelineProps) {
  const events: TimelineEvent[] = [
    { label: 'Created', date: transfer.created_at, actor: transfer.creator ? `${transfer.creator.first_name} ${transfer.creator.last_name}` : undefined, active: true },
    { label: 'Approved', date: transfer.approved_at, actor: transfer.approver ? `${transfer.approver.first_name} ${transfer.approver.last_name}` : undefined, active: !!transfer.approved_at },
    { label: 'Dispatched', date: transfer.dispatched_at, actor: transfer.driver_name, active: !!transfer.dispatched_at },
    { label: 'Received', date: transfer.received_at, actor: transfer.receiver ? `${transfer.receiver.first_name} ${transfer.receiver.last_name}` : undefined, active: !!transfer.received_at },
  ];

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="font-medium mb-6">Transfer Timeline</h3>
      <div className="relative">
        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={index} className="relative flex items-start gap-4">
              <div
                className={`w-4 h-4 rounded-full border-2 z-10 mt-0.5 ${
                  event.active
                    ? 'bg-[#006B3F] border-[#006B3F]'
                    : 'bg-white border-border'
                }`}
              />
              <div className="flex-1">
                <div className="font-medium text-sm">{event.label}</div>
                {event.date ? (
                  <>
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleString('en-GB')}
                    </div>
                    {event.actor && (
                      <div className="text-xs text-muted-foreground">by {event.actor}</div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">Pending</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
