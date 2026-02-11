/**
 * @fileoverview Dashboard notifications component
 */

'use client';

import { useNotificationsContext } from '@/components/providers/NotificationsProvider';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface DashboardNotificationsProps {
  maxDisplay?: number;
}

export function DashboardNotifications({ maxDisplay = 5 }: DashboardNotificationsProps) {
  const { notifications, markAsRead } = useNotificationsContext();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Notifications</CardTitle>
          <button
            onClick={() => notifications.forEach(n => markAsRead(n.id))}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Mark all read
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {notifications.slice(0, maxDisplay).map((notification: Notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border ${notification.read ? 'border-border bg-card' : 'border-primary/20 bg-primary/5'
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
          {notifications.length > maxDisplay && (
            <p className="text-xs text-muted-foreground text-center">
              And {notifications.length - maxDisplay} more...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
