"use client";

import { useEffect, useRef, useState } from "react";
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

  // Each hook instance gets a stable unique suffix so that two ChatPanel
  // instances on the same page (mobile + desktop) don't share the same
  // Phoenix channel topic. Sharing a topic causes the Supabase Realtime
  // server to reject the second join, leaving one panel unable to receive
  // INSERT events.
  const instanceId = useRef(Math.random().toString(36).slice(2, 8));

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

      // Auth is kept in sync automatically via onAuthStateChange in getBrowserClient().
      // Bail out if the component unmounted while we were fetching.
      if (!refreshOnError) return;

      // Log the auth state at subscription time so we can confirm the JWT
      // is present when the phx_join is sent.
      supabase.auth.getSession().then(({ data }) => {
        const uid = data.session?.user?.id ?? "none";
        const hasToken = !!data.session?.access_token;
        console.log(`[Realtime] subscribing contractId=${contractId} auth.uid=${uid} hasToken=${hasToken}`);
      });

      channel = supabase
        .channel(`messages:${contractId}:${instanceId.current}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "Message",
          },
          (payload) => {
            console.log(`[Realtime] INSERT full payload:`, JSON.stringify(payload.new));
            const raw = payload.new as RawMessagePayload;
            console.log(`[Realtime] INSERT received contractId=${raw.contractId} id=${raw.id} — expecting=${contractId} match=${raw.contractId === contractId}`);
            // client-side filter — camelCase column names can't be used in Realtime filter syntax
            if (raw.contractId !== contractId) return;
            const newMsg = fromRaw(raw);
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) {
                console.log(`[Realtime] INSERT id=${newMsg.id} skipped (duplicate)`);
                return prev;
              }
              console.log(`[Realtime] INSERT id=${newMsg.id} added to state`);
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
            console.log(`[Realtime] UPDATE received id=${raw.id} contractId=${raw.contractId}`);
            if (raw.contractId !== contractId) return;
            const updated = fromRaw(raw);
            setMessages((prev) =>
              prev.map((m) => (m.id === updated.id ? { ...m, readAt: updated.readAt } : m))
            );
          }
        )
        .subscribe((status, err) => {
          console.log(`[Realtime] channel=messages:${contractId}:${instanceId.current} status=${status}`, err ?? "");
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
