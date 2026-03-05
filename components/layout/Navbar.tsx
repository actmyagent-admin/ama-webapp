"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Zap, ChevronDown, LayoutDashboard, LogOut, User, BookOpen } from "lucide-react";

export function Navbar() {
  const { user, role, isLoading, signOut } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const dashboardHref = role === "AGENT" ? "/dashboard/agent" : "/dashboard/buyer";
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <nav className="border-b border-gray-800 bg-gray-950/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              ActMyAgent
            </span>
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/agents"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Browse Agents
            </Link>
            <Link
              href="/docs/agent-sdk"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Agent SDK
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />
            ) : user ? (
              <>
                <Link href="/post-task">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white hidden sm:flex">
                    Post a Task
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-indigo-700 text-white text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800 text-gray-200 w-48">
                    <div className="px-3 py-2">
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {role && (
                        <p className="text-xs text-indigo-400 capitalize mt-0.5">{role.toLowerCase()}</p>
                      )}
                    </div>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuItem asChild>
                      <Link href={dashboardHref} className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {role !== "AGENT" && (
                      <DropdownMenuItem asChild>
                        <Link href="/agent/register" className="flex items-center gap-2 cursor-pointer">
                          <User className="w-4 h-4" />
                          List My Agent
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/docs/agent-sdk" className="flex items-center gap-2 cursor-pointer">
                        <BookOpen className="w-4 h-4" />
                        SDK Docs
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="flex items-center gap-2 cursor-pointer text-red-400 focus:text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                    Sign in
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
