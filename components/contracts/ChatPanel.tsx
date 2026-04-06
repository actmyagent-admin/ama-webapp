"use client";

import { useState, useRef, useEffect } from "react";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { api } from "@/lib/api";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, Loader2, CheckCheck } from "lucide-react";

interface ChatPanelProps {
  contractId: string;
}

export function ChatPanel({ contractId }: ChatPanelProps) {
  const { messages, isLoading, addMessage } = useRealtimeMessages(contractId);
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const markedReadRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-mark incoming messages as read
  useEffect(() => {
    if (!user || messages.length === 0) return;
    messages
      .filter((msg) => msg.senderId !== user.id && !msg.readAt && !markedReadRef.current.has(msg.id))
      .forEach((msg) => {
        markedReadRef.current.add(msg.id);
        api.markMessageRead(msg.id).catch(() => {
          markedReadRef.current.delete(msg.id);
        });
      });
  }, [messages, user]);

  const handleSend = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    const text = content.trim();
    setContent("");
    try {
      const { message } = await api.sendMessage(contractId, text);
      // Optimistically add to local state — realtime will dedup if it also fires
      addMessage(message);
    } catch {
      setContent(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-foreground font-semibold text-sm font-ui">Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`flex gap-2 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
                <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                <Skeleton className={`h-12 rounded-xl ${i % 2 === 0 ? "w-2/3" : "w-1/2"}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm font-ui">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="w-7 h-7 flex-shrink-0 mt-1">
                  <AvatarFallback
                    className={`text-xs text-white font-medium ${
                      isMe
                        ? "bg-gradient-to-br from-[#b57e04] to-[#d4a017]"
                        : "bg-muted-foreground/50"
                    }`}
                  >
                    {msg.senderRole === "BUYER" ? "B" : "A"}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${isMe ? "items-end" : ""} max-w-[75%]`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      className={`text-xs py-0 border ${
                        msg.senderRole === "BUYER"
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                      }`}
                    >
                      {msg.senderRole === "BUYER" ? "Client" : "Agent"}
                    </Badge>
                    <span className="text-muted-foreground text-xs font-ui">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed font-ui ${
                      isMe
                        ? "bg-gradient-to-r from-[#b57e04] to-[#d4a017] text-white rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm border border-border"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {/* Read receipt */}
                  {isMe && (
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCheck
                        className={`w-3.5 h-3.5 ${
                          msg.readAt ? "text-[#b57e04]" : "text-muted-foreground/50"
                        }`}
                      />
                      <span className="text-[10px] text-muted-foreground font-ui">
                        {msg.readAt ? "Read" : "Delivered"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message… (⌘+Enter to send)"
            className="resize-none min-h-[44px] max-h-32 text-sm font-ui"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!content.trim() || sending}
            size="sm"
            className="bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white self-end flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
