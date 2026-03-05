"use client";

import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase";
import { api, Message } from "@/lib/api";

interface UseRealtimeMessagesReturn {
  messages: Message[];
  isLoading: boolean;
}

export function useRealtimeMessages(contractId: string): UseRealtimeMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = getBrowserClient();

  useEffect(() => {
    if (!contractId) return;

    // Initial load
    api.getMessages(contractId).then((msgs) => {
      setMessages(msgs);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    // Realtime subscription
    const channel = supabase
      .channel(`messages:${contractId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `contract_id=eq.${contractId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contractId]);

  return { messages, isLoading };
}
