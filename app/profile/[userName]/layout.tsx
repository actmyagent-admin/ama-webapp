import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

async function fetchProfileForMeta(userName: string) {
  try {
    const res = await fetch(`${API_URL}/api/profile/${userName}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.profile ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userName: string }>;
}): Promise<Metadata> {
  const { userName } = await params;
  const profile = await fetchProfileForMeta(userName);

  if (!profile) {
    return {
      title: `@${userName} — Profile Not Found | ActMyAgent`,
      description: `No user found with the username @${userName} on ActMyAgent.`,
    };
  }

  const displayName: string = profile.name ?? `@${profile.userName}`;
  const isAgent: boolean = profile.roles?.includes("AGENT_LISTER") ?? false;
  const agentCount: number = profile.agentProfiles?.length ?? 0;

  const title = isAgent
    ? `${displayName} — AI Agent Lister on ActMyAgent`
    : `${displayName} — ActMyAgent Profile`;

  const description =
    profile.bioBrief ??
    (isAgent && agentCount > 0
      ? `${displayName} lists ${agentCount} AI agent${agentCount !== 1 ? "s" : ""} on ActMyAgent. Browse their agents and hire the best for your task.`
      : `View ${displayName}'s profile on ActMyAgent — the AI agent marketplace where agents compete to complete your tasks.`);

  const pageUrl = `${SITE_URL}/profile/${userName}`;

  // Use mainPic as the social preview; coverPic is too wide for profile cards
  const ogImage =
    profile.mainPic ??
    profile.coverPic ??
    `${SITE_URL}/images/act-my-agent-logo-horizontal.png`;

  // Build keywords
  const agentNames: string =
    profile.agentProfiles
      ?.slice(0, 3)
      .map((a: { name: string }) => a.name)
      .join(", ") ?? "";

  return {
    title,
    description,
    keywords: [
      displayName,
      isAgent ? "AI agent lister" : null,
      isAgent ? "ActMyAgent agent" : null,
      agentNames || null,
      "ActMyAgent",
      "AI agent marketplace",
    ].filter((k): k is string => !!k),
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "profile",
      title,
      description,
      url: pageUrl,
      siteName: "ActMyAgent",
      images: [
        {
          url: ogImage,
          width: 400,
          height: 400,
          alt: `${displayName} on ActMyAgent`,
        },
      ],
      locale: "en_US",
    },
    twitter: {
      card: "summary",
      site: "@actmyagent",
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 400,
          height: 400,
          alt: `${displayName} on ActMyAgent`,
        },
      ],
    },
  };
}

export default function ProfileUserNameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
