"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  User,
  BookOpen,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SkillFileButton } from "@/components/layout/SkillFileButton";

function LogoImage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-8 w-20" />;
  // On dark bg the SVG text is black — invert only brightness, keep hue
  return (
    <Image
      src="/images/act-my-agent-logo.svg"
      alt="ActMyAgent logo"
      height={36}
      width={70}
      className={`h-9 w-auto object-contain transition-all ${
        resolvedTheme === "dark" ? "brightness-0 invert" : ""
      }`}
      priority
    />
  );
}

export function Navbar() {
  const { user, roles, isLoading, signOut } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const dashboardHref =
    roles.includes("AGENT_LISTER") && !roles.includes("BUYER")
      ? "/dashboard/agent"
      : "/dashboard/buyer";
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "?";

  const navLinkClass = (href: string) =>
    `relative text-sm font-ui font-medium transition-colors duration-200 after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:rounded-full after:bg-[#b57e04] after:transition-all after:duration-300 ${
      pathname === href
        ? "text-[#b57e04] after:w-full"
        : "text-muted-foreground hover:text-foreground after:w-0 hover:after:w-full"
    }`;

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border bg-background/95 backdrop-blur-md shadow-sm"
          : "border-b border-transparent bg-background/80 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ── Logo ────────────────────────────────────────── */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <LogoImage />
          </Link>

          {/* ── Centre nav (desktop) ─────────────────────── */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/agents" className={navLinkClass("/agents")}>
              Browse Agents
            </Link>
            <Link
              href="/docs/agent-sdk"
              className={navLinkClass("/docs/agent-sdk")}
            >
              Agent SDK
            </Link>
            <SkillFileButton className="flex items-center gap-1.5 text-sm font-ui font-medium text-muted-foreground hover:text-foreground transition-colors duration-200" />
          </div>

          {/* ── Right controls ──────────────────────────── */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <>
                <Link href="/post-task" className="hidden sm:block">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium shadow-sm transition-all duration-200"
                  >
                    Post a Task
                  </Button>
                </Link>

                <NotificationBell />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 hover:opacity-80 transition-opacity focus:outline-none">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-[#b57e04] to-[#d4a017] text-white text-xs font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-popover border-border text-popover-foreground w-52 shadow-xl"
                  >
                    <div className="px-3 py-2.5">
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                      {roles.length > 0 && (
                        <p className="text-xs font-medium text-[#b57e04] capitalize mt-0.5">
                          {roles
                            .map((r) =>
                              r === "AGENT_LISTER" ? "Agent Lister" : "Buyer",
                            )
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem asChild>
                      <Link
                        href={dashboardHref}
                        className="flex items-center gap-2 cursor-pointer font-ui"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {!roles.includes("BUYER") && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/agent/register"
                          className="flex items-center gap-2 cursor-pointer font-ui"
                        >
                          <User className="w-4 h-4" />
                          List My Agent
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link
                        href="/docs/agent-sdk"
                        className="flex items-center gap-2 cursor-pointer font-ui"
                      >
                        <BookOpen className="w-4 h-4" />
                        SDK Docs
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive font-ui"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground font-ui"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#b57e04] to-[#d4a017] hover:from-[#9a6a03] hover:to-[#b57e04] text-white font-ui font-medium shadow-sm"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile drawer trigger (renders its own hamburger button) */}
            <MobileDrawer />
          </div>
        </div>
      </div>

      {/* Animated gold underline for active page (desktop) */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#b57e04]/30 to-transparent" />
    </nav>
  );
}
