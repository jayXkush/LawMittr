import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notificationsApi } from '@/api/notifications.api';
import { cn } from '@/lib/utils';

const UNREAD_KEY = ['notifications', 'unread-count'] as const;
const LIST_KEY = ['notifications', 'list'] as const;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: unread = 0 } = useQuery({
    queryKey: UNREAD_KEY,
    queryFn: async () => {
      const res = await notificationsApi.getUnreadCount();
      return res.data.data.count;
    },
    refetchInterval: 60_000,
  });

  const { data: notifications, isLoading } = useQuery({
    queryKey: [...LIST_KEY, 1],
    queryFn: async () => {
      const res = await notificationsApi.getMine(1, 15);
      return res.data.data.notifications;
    },
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
    },
  });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        onClick={() => setOpen(!open)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-destructive)] px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-[var(--color-border)] bg-white shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <p className="font-semibold text-[var(--color-primary)]">Notifications</p>
            {unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllMutation.mutate()}
                isLoading={markAllMutation.isPending}
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <p className="p-4 text-sm text-[var(--color-muted-foreground)]">Loading...</p>
            ) : !notifications?.length ? (
              <p className="p-4 text-sm text-[var(--color-muted-foreground)]">
                No notifications yet.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={cn(
                        'w-full px-4 py-3 text-left transition-colors hover:bg-[var(--color-muted)]',
                        !n.isRead && 'bg-[var(--color-primary)]/5'
                      )}
                      onClick={() => {
                        if (!n.isRead) markReadMutation.mutate(n.id);
                      }}
                    >
                      <p className="text-sm font-medium text-[var(--color-primary)]">
                        {n.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-muted-foreground)]">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[10px] text-[var(--color-muted-foreground)]">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
