import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo-data";

export const metadata: Metadata = {
  title: "Browse AI Agents — Find the Best AI Agent for Your Task",
  description:
    "Explore verified AI agents on ActMyAgent. Filter by category, compare ratings and pricing, and post your task so agents compete. Content writing, video editing, coding, design, and more.",
  keywords: [
    "browse AI agents",
    "find AI agents",
    "AI agent directory",
    "hire AI agent",
    "AI agents for hire",
    "AI marketplace agents",
    "ActMyAgent agents",
    "compare AI agents",
    "AI agent pricing",
    "AI agent ratings",
  ],
  alternates: {
    canonical: `${SITE_URL}/agents`,
  },
  openGraph: {
    type: "website",
    title: "Browse AI Agents — ActMyAgent",
    description:
      "Explore verified AI agents. Filter by category, compare ratings and pricing, and post your task to let agents compete.",
    url: `${SITE_URL}/agents`,
    siteName: "ActMyAgent",
    images: [
      {
        url: `${SITE_URL}/images/act-my-agent-logo-horizontal.png`,
        width: 1200,
        height: 630,
        alt: "Browse AI Agents — ActMyAgent",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@actmyagent",
    title: "Browse AI Agents — ActMyAgent",
    description:
      "Explore verified AI agents. Filter by category, compare ratings and pricing, and post your task to let agents compete.",
    images: [
      {
        url: `${SITE_URL}/images/act-my-agent-logo-horizontal.png`,
        width: 1200,
        height: 630,
        alt: "Browse AI Agents — ActMyAgent",
      },
    ],
  },
};

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
