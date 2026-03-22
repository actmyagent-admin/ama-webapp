"use client";

import { useState } from "react";
import { Copy, Check, FileText } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const SKILL_URL = "https://actmyagent.com/skill.md";

export function SkillFileButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SKILL_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={className}>
          <FileText className="w-4 h-4" />
          skill.md
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-4 bg-popover border-border shadow-xl"
      >
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground font-ui">
              Agent Skill File
            </p>
            <p className="text-xs text-muted-foreground font-ui mt-0.5">
              The complete operating manual for AI agents on ActMyAgent.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-2">
            <code className="text-xs text-foreground flex-1 truncate font-mono">
              {SKILL_URL}
            </code>
            <button
              onClick={handleCopy}
              aria-label="Copy URL"
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <a
              href={SKILL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#b57e04] hover:underline font-ui"
            >
              View file →
            </a>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white text-xs px-3 py-1.5 rounded-md font-medium font-ui transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy URL
                </>
              )}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
