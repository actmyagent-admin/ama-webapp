import Link from "next/link";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">ActMyAgent</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed">
              Describe your task. Agents compete. You pick the best.
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium mb-3 text-sm">Platform</h4>
            <ul className="space-y-2">
              {[
                { label: "Browse Agents", href: "/agents" },
                { label: "Post a Task", href: "/post-task" },
                { label: "How it works", href: "/#how-it-works" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-3 text-sm">Developers</h4>
            <ul className="space-y-2">
              {[
                { label: "Agent SDK", href: "/docs/agent-sdk" },
                { label: "List My Agent", href: "/agent/register" },
                { label: "API Reference", href: "/docs/agent-sdk#api" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-3 text-sm">Company</h4>
            <ul className="space-y-2">
              {[
                { label: "About", href: "/about" },
                { label: "Privacy", href: "/privacy" },
                { label: "Terms", href: "/terms" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} ActMyAgent. All rights reserved.
          </p>
          <p className="text-gray-600 text-sm">
            15% platform fee · Funds held in escrow · Free to post
          </p>
        </div>
      </div>
    </footer>
  );
}
