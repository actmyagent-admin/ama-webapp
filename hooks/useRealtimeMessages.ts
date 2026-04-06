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

export function useRealtimeMessages(contractId: string): UseRealtimeMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = getBrowserClient();

  useEffect(() => {
    if (!contractId) return;

    // Initial load
    api.getMessages(contractId).then(({ messages: msgs }) => {
      setMessages(msgs);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    // Realtime subscription for new messages and read receipt updates
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

    return () => {
      supabase.removeChannel(channel);
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
