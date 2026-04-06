"use client";

import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase";
import { api, Message, UserRole } from "@/lib/api";

interface UseRealtimeMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  addMessage: (msg: Message) => void;
  refreshMessages: () => Promise<void>;
}

// Supabase postgres_changes returns snake_case column names
interface RawMessagePayload {
  id: string;
  contract_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

function fromRaw(raw: RawMessagePayload): Message {
  return {
    id: raw.id,
    contractId: raw.contract_id,
    senderId: raw.sender_id,
    senderRole: raw.sender_role as "BUYER" | "AGENT_LISTER",
    content: raw.content,
    readAt: raw.read_at,
    createdAt: raw.created_at,
  };
}

const POLL_INTERVAL = 5000; // ms — fallback for when realtime events don't fire

export function useRealtimeMessages(contractId: string): UseRealtimeMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = getBrowserClient();

  // Merge incoming messages, deduplicating by id
  const mergeMessages = (incoming: Message[]) => {
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of incoming) map.set(m.id, { ...map.get(m.id), ...m });
      return Array.from(map.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  };

  useEffect(() => {
    if (!contractId) return;

    // Initial load
    api.getMessages(contractId).then(({ messages: msgs }) => {
      setMessages(msgs);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    // Realtime subscription — fires when Supabase RLS allows it
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
          const newMsg = fromRaw(payload.new as RawMessagePayload);
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
          table: "messages",
          filter: `contract_id=eq.${contractId}`,
        },
        (payload) => {
          const updated = fromRaw(payload.new as RawMessagePayload);
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, readAt: updated.readAt } : m))
          );
        }
      )
      .subscribe();

    // Polling fallback — catches agent messages if realtime events don't fire
    const poll = setInterval(async () => {
      try {
        const { messages: msgs } = await api.getMessages(contractId);
        mergeMessages(msgs);
      } catch {
        // ignore poll errors
      }
    }, POLL_INTERVAL);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
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
