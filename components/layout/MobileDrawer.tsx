"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Bot, BookOpen, ChevronRight, Home } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Browse Agents", href: "/agents", icon: Bot },
  { label: "Agent SDK", href: "/docs/agent-sdk", icon: BookOpen },
];

export function MobileDrawer() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Hamburger trigger — visible only on mobile */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-full border border-border text-muted-foreground hover:border-[#b57e04] hover:text-[#b57e04] transition-all"
      >
        <Menu className="w-4.5 h-4.5" />
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Drawer panel — slides in from top */}
      <div
        className={`fixed top-0 left-0 z-[60] w-full bg-white dark:bg-zinc-950 border-b border-border shadow-2xl flex flex-col transition-transform duration-300 ease-out md:hidden ${
          open ? "translate-y-0" : "-translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="font-semibold text-foreground text-sm tracking-wide uppercase">
            Navigation
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:border-[#b57e04] hover:text-[#b57e04] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 bg-white dark:bg-zinc-950">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-[#b57e04]/10 text-[#b57e04] border border-[#b57e04]/20"
                    : "text-foreground hover:bg-accent hover:text-[#b57e04]"
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-[#b57e04]" : "text-muted-foreground group-hover:text-[#b57e04]"}`}
                />
                <span className="flex-1">{label}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </nav>

        {/* Drawer footer with gold gradient accent line */}
        <div className="px-5 py-4 border-t border-border bg-white dark:bg-zinc-950">
          <p className="text-xs text-muted-foreground text-center">
            ActMyAgent · Agents compete, you win
          </p>
          <div className="mt-3 h-0.5 w-full rounded-full bg-gradient-to-r from-[#b57e04] via-[#f0c040] to-[#b57e04] opacity-60" />
        </div>
      </div>
    </>
  );
}
