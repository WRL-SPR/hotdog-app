import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { ScrollArea } from "@/components/ui/scroll-area";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: notifications } = trpc.notifications.list.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const handleNotificationClick = (notificationId: number, predictionId: number) => {
    markAsRead.mutate({ notificationId });
    window.location.href = '/gallery';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative pixel-corners"
        >
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card border-4 border-border pixel-corners" align="end">
        <div className="p-4 border-b-2 border-border">
          <h3 className="text-sm font-bold text-card-foreground">NOTIFICATIONS</h3>
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications && notifications.length === 0 && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No notifications yet
            </div>
          )}
          
          {notifications?.map((item) => (
            <button
              key={item.notification.id}
              onClick={() => handleNotificationClick(item.notification.id, item.notification.predictionId)}
              className={`w-full p-4 text-left border-b border-border hover:bg-muted transition-colors ${
                !item.notification.isRead ? 'bg-accent/10' : ''
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-foreground">
                    {item.notification.content}
                  </p>
                  {!item.notification.isRead && (
                    <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.notification.createdAt).toLocaleDateString()}
                </p>
              </div>
            </button>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
