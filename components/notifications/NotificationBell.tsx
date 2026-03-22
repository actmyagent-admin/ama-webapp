"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationBell() {
  const { unreadCount, notifications, clearAll } = useUnreadCount();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors focus:outline-none"
          aria-label="Notifications"
        >
          <Bell className="w-[18px] h-[18px] text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-gradient-to-br from-[#b57e04] to-[#d4a017] text-white text-[10px] font-bold leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 shadow-xl bg-popover border-border">
        <div className="flex items-center justify-between px-3 py-2.5">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unreadCount > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        <DropdownMenuSeparator className="bg-border" />

        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <Bell className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No new notifications</p>
          </div>
        ) : (
          <>
            {notifications.slice(0, 5).map((n) => (
              <DropdownMenuItem key={n.id} asChild>
                <Link
                  href={`/contracts/${n.contractId}`}
                  className="flex flex-col items-start gap-1 px-3 py-2.5 cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="w-2 h-2 rounded-full bg-[#b57e04] flex-shrink-0" />
                    <span className="text-xs font-medium text-foreground">
                      {n.senderRole === "BUYER" ? "Buyer" : "Agent"} sent you a message
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground flex-shrink-0">
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-4 line-clamp-2 leading-relaxed">
                    {n.content}
                  </p>
                </Link>
              </DropdownMenuItem>
            ))}

            {notifications.length > 5 && (
              <>
                <DropdownMenuSeparator className="bg-border" />
                <div className="px-3 py-2 text-center">
                  <span className="text-xs text-muted-foreground">
                    +{notifications.length - 5} more
                  </span>
                </div>
              </>
            )}

            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/buyer"
                className="justify-center text-xs text-[#b57e04] hover:text-[#d4a017] font-medium cursor-pointer"
              >
                View all contracts
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
