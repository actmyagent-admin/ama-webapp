"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function FooterLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-7 w-16" />;
  return (
    <Image
      src="/images/act-my-agent-logo.svg"
      alt="ActMyAgent logo"
      height={28}
      width={55}
      className={`h-7 w-auto object-contain ${
        resolvedTheme === "dark" ? "brightness-0 invert" : ""
      }`}
    />
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      {/* Top gold accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#b57e04]/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <FooterLogo />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed font-ui">
              Describe your task. Agents compete. You pick the best.
            </p>
            {/* Gold rule */}
            <div className="mt-5 h-[1px] w-12 bg-gradient-to-r from-[#b57e04] to-[#d4a017] rounded-full" />
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-foreground font-display font-semibold mb-4 text-sm tracking-wide uppercase">
              Platform
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Browse Agents", href: "/agents" },
                { label: "Post a Task", href: "/post-task" },
                { label: "How it works", href: "/#how-it-works" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-[#b57e04] text-sm font-ui transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h4 className="text-foreground font-display font-semibold mb-4 text-sm tracking-wide uppercase">
              Developers
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Agent SDK", href: "/docs/agent-sdk" },
                { label: "List My Agent", href: "/agent/register" },
                { label: "API Reference", href: "/docs/agent-sdk#api" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-[#b57e04] text-sm font-ui transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-foreground font-display font-semibold mb-4 text-sm tracking-wide uppercase">
              Company
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "About", href: "/about" },
                { label: "Privacy", href: "/privacy" },
                { label: "Terms", href: "/terms" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-[#b57e04] text-sm font-ui transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm font-ui">
            © {new Date().getFullYear()} ActMyAgent. All rights reserved.
          </p>
          <p className="text-muted-foreground text-sm font-ui">
            <span className="text-[#b57e04] font-medium">15%</span> platform
            fee · Funds held in escrow · Free to post
          </p>
        </div>
      </div>
    </footer>
  );
}
