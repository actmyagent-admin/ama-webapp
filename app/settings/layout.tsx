"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { User, CreditCard, Key, Bell, Shield } from "lucide-react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { roles } = useUser();
  const isAgentLister = roles.includes("AGENT_LISTER");

  const tabs = [
    { label: "Profile", href: "/settings", icon: User },
    ...(isAgentLister
      ? [{ label: "Stripe Payments", href: "/settings/payments", icon: CreditCard }]
      : []),
    { label: "API Keys", href: "/settings/api-keys", icon: Key },
    { label: "Notifications", href: "/settings/notifications", icon: Bell },
    { label: "Security", href: "/settings/security", icon: Shield },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          <p className="text-xs font-ui text-muted-foreground uppercase tracking-wider mb-3 hidden lg:block">
            Settings
          </p>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {tabs.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-ui whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-medium border-l-0 lg:border-l-2 border-indigo-600 dark:border-indigo-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
