"use client";

import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase";
import { api, Message } from "@/lib/api";

interface UseRealtimeMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  addMessage: (msg: Message) => void;
  refreshMessages: () => Promise<void>;
}

// Supabase postgres_changes returns columns exactly as they are in the DB (camelCase for Prisma schemas)
interface RawMessagePayload {
  id: string;
  contractId: string;
  senderId: string;
  senderRole: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

function fromRaw(raw: RawMessagePayload): Message {
  return {
    id: raw.id,
    contractId: raw.contractId,
    senderId: raw.senderId,
    senderRole: raw.senderRole as "BUYER" | "AGENT_LISTER",
    content: raw.content,
    readAt: raw.readAt,
    createdAt: raw.createdAt,
  };
}

export function useRealtimeMessages(contractId: string): UseRealtimeMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = getBrowserClient();

  useEffect(() => {
    if (!contractId) return;

    let refreshOnError = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function setup() {
      // Initial load
      try {
        const { messages: msgs } = await api.getMessages(contractId);
        setMessages(msgs);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }

      // Supabase Realtime evaluates RLS using auth.uid() on the realtime connection.
      // setAuth MUST be called before .subscribe() — doing it after is a race condition
      // that causes the channel to subscribe unauthenticated, failing the RLS policy.
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) supabase.realtime.setAuth(token);

      // Bail out if the effect was cleaned up while we were awaiting
      if (!refreshOnError) return;

      channel = supabase
        .channel(`messages:${contractId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "Message",
          },
          (payload) => {
            const raw = payload.new as RawMessagePayload;
            // client-side filter — camelCase column names can't be used in Realtime filter syntax
            if (raw.contractId !== contractId) return;
            const newMsg = fromRaw(raw);
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "Message",
          },
          (payload) => {
            const raw = payload.new as RawMessagePayload;
            if (raw.contractId !== contractId) return;
            const updated = fromRaw(raw);
            setMessages((prev) =>
              prev.map((m) => (m.id === updated.id ? { ...m, readAt: updated.readAt } : m))
            );
          }
        )
        .subscribe((status, err) => {
          console.log(`[Realtime] channel=messages:${contractId} status=${status}`, err ?? "");
          if ((status === "CHANNEL_ERROR" || status === "TIMED_OUT") && refreshOnError) {
            // Realtime unavailable — fall back to polling every 5 s
            console.warn("[Realtime] falling back to HTTP polling");
            const poll = setInterval(() => {
              api.getMessages(contractId).then(({ messages: msgs }) => {
                setMessages(msgs);
              }).catch(() => {});
            }, 5000);
            (channel as unknown as { _pollInterval?: ReturnType<typeof setInterval> })._pollInterval = poll;
          }
        });
    }

    setup();

    return () => {
      refreshOnError = false;
      if (channel) {
        const poll = (channel as unknown as { _pollInterval?: ReturnType<typeof setInterval> })._pollInterval;
        if (poll) clearInterval(poll);
        supabase.removeChannel(channel);
      }
    };
  }, [contractId]);

  const addMessage = (msg: Message) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  };

  const refreshMessages = async () => {
    try {
      const { messages: msgs } = await api.getMessages(contractId);
      setMessages(msgs);
    } catch {
      // ignore — best-effort refresh
    }
  };

  return { messages, isLoading, addMessage, refreshMessages };
}
