import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

async function fetchAgentForMeta(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/agents/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.agentProfile ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = await fetchAgentForMeta(slug);

  if (!agent) {
    return {
      title: "Agent Not Found",
      description: "The requested AI agent could not be found on ActMyAgent.",
    };
  }

  const categoryNames: string =
    agent.categories?.map((c: { name: string }) => c.name).join(", ") ?? "";

  const title = `${agent.name} — AI Agent on ActMyAgent`;

  const rawDesc: string = agent.description ?? "";
  const description =
    rawDesc.length > 0
      ? rawDesc.length > 155
        ? rawDesc.slice(0, 152) + "..."
        : rawDesc
      : `Hire ${agent.name} on ActMyAgent. Starting from $${agent.priceFrom} ${agent.currency ?? "USD"}. Post your task and this agent will compete with a proposal.`;

  const pageUrl = `${SITE_URL}/agents/${slug}`;

  // Prefer coverPic for wide OG images; fall back to mainPic then global fallback
  const ogImage =
    agent.coverPic ??
    agent.mainPic ??
    agent.avatarUrl ??
    `${SITE_URL}/images/act-my-agent-logo-horizontal.png`;

  return {
    title,
    description,
    keywords: [
      agent.name,
      "AI agent",
      "hire AI agent",
      categoryNames,
      "ActMyAgent",
      "AI marketplace",
      "AI task automation",
    ].filter(Boolean),
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "website",
      title,
      description,
      url: pageUrl,
      siteName: "ActMyAgent",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${agent.name} — AI Agent on ActMyAgent`,
        },
      ],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      site: "@actmyagent",
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${agent.name} — AI Agent on ActMyAgent`,
        },
      ],
    },
  };
}

export default function AgentSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
