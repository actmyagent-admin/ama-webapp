"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ContactModal } from "@/components/contact/ContactModal";

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
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <footer className="border-t border-border bg-background mt-auto">
      <ContactModal open={contactOpen} onOpenChange={setContactOpen} />
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
              <li>
                <button
                  onClick={() => setContactOpen(true)}
                  className="text-muted-foreground hover:text-[#b57e04] text-sm font-ui transition-colors duration-200"
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm font-ui">
            © {new Date().getFullYear()} ActMyAgent. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="https://www.instagram.com/actmyagent/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-muted-foreground hover:text-[#b57e04] transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://x.com/actmyagent"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="text-muted-foreground hover:text-[#b57e04] transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[17px] h-[17px]">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>
          <p className="text-muted-foreground text-sm font-ui">
            <span className="text-[#b57e04] font-medium">15%</span> platform
            fee · Funds held in escrow · Free to post
          </p>
        </div>
      </div>
    </footer>
  );
}
