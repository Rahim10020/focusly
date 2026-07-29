/**
 * @fileoverview Notifications page for the Focusly application.
 * Displays user notifications including friend requests, task alerts,
 * and other system notifications with read/unread filtering.
 * @module app/notifications/page
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useAuth";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useNotificationsContext } from "@/components/providers/NotificationsProvider";
import { ROUTES } from "@/constants";
import { MyLoader } from "@/components/shared/MyLoader";

export default function NotificationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationsContext();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!session && status !== "loading") {
      router.push(ROUTES.SIGN_IN);
    }
  }, [session, status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MyLoader label="Loading notifications" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return "👥";
      case "friend_request_accepted":
        return "🤝";
      case "task_completed":
        return "✅";
      case "task_overdue":
        return "⚠️";
      case "achievement":
        return "🏆";
      case "info":
        return "📌";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "friend_request":
        return "border-info/20 bg-info/5";
      case "friend_request_accepted":
        return "border-success/20 bg-success/5";
      case "task_completed":
        return "border-success/20 bg-success/5";
      case "task_overdue":
        return "border-error/20 bg-error/5";
      case "achievement":
        return "border-warning/20 bg-warning/5";
      case "info":
        return "border-info/20 bg-info/5";
      default:
        return "border-border";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <p className="text-muted-foreground text-lg">
          Stay updated with friend requests, tasks, and achievements
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-error text-lg">⚠️</span>
            <p className="text-error text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === "all" ? "primary" : "outline"}
          onClick={() => setFilter("all")}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === "unread" ? "primary" : "outline"}
          onClick={() => setFilter("unread")}
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground mt-8">
              <div className="text-6xl mb-4">🔔</div>
              <p className="text-sm">
                {filter === "unread"
                  ? "All caught up! No unread notifications."
                  : "You have no notifications yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all ${
                    notification.read
                      ? "border-border bg-card opacity-60"
                      : `${getNotificationColor(notification.type)} border-2`
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs"
                            >
                              Mark read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-xs text-error hover:text-error-light"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
