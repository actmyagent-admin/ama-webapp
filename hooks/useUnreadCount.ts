"use client";

import { useEffect, useState, useCallback } from "react";
import { getBrowserClient } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";

export interface UnreadNotification {
  id: string;
  contractId: string;
  content: string;
  senderRole: "BUYER" | "AGENT_LISTER";
  createdAt: string;
}

interface UseUnreadCountReturn {
  unreadCount: number;
  notifications: UnreadNotification[];
  clearForContract: (contractId: string) => void;
  clearAll: () => void;
}

export function useUnreadCount(): UseUnreadCountReturn {
  const [notifications, setNotifications] = useState<UnreadNotification[]>([]);
  const { user } = useUser();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const supabase = getBrowserClient();

    // Subscribe to all message inserts on contracts the user is part of.
    // Supabase RLS ensures only messages from the user's own contracts arrive.
    const channel = supabase
      .channel("notifications:messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          // Supabase postgres_changes returns snake_case column names
          const raw = payload.new as {
            id: string;
            contract_id: string;
            sender_id: string;
            sender_role: string;
            content: string;
            read_at: string | null;
            created_at: string;
          };

          // Only notify for messages sent by others that aren't already read
          if (raw.sender_id !== user.id && !raw.read_at) {
            setNotifications((prev) => {
              if (prev.some((n) => n.id === raw.id)) return prev;
              return [
                {
                  id: raw.id,
                  contractId: raw.contract_id,
                  content: raw.content,
                  senderRole: raw.sender_role as "BUYER" | "AGENT_LISTER",
                  createdAt: raw.created_at,
                },
                ...prev,
              ].slice(0, 20); // cap at 20
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const clearForContract = useCallback((contractId: string) => {
    setNotifications((prev) => prev.filter((n) => n.contractId !== contractId));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    unreadCount: notifications.length,
    notifications,
    clearForContract,
    clearAll,
  };
}
