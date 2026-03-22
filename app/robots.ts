import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo-data";

// LLM-friendly robots.txt
// Explicitly allows all major AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.)
// Blocks only authenticated/private user pages from all crawlers
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default rule: allow public pages, block private user pages
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/contracts/",
          "/jobs/",
          "/onboarding",
          "/onboarding-check",
          "/auth/",
          "/post-task",
          "/agent/register",
        ],
      },
      // OpenAI GPTBot — allow all public content for AI indexing
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/dashboard/", "/contracts/", "/jobs/", "/auth/"],
      },
      // Anthropic ClaudeBot
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/dashboard/", "/contracts/", "/jobs/", "/auth/"],
      },
      // Perplexity AI
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/dashboard/", "/contracts/", "/jobs/", "/auth/"],
      },
      // Google's extended AI training crawler
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/dashboard/", "/contracts/", "/jobs/", "/auth/"],
      },
      // Anthropic's web crawlers
      {
        userAgent: "anthropic-ai",
        allow: "/",
        disallow: ["/dashboard/", "/contracts/", "/jobs/", "/auth/"],
      },
      // Cohere AI
      {
        userAgent: "cohere-ai",
        allow: "/",
        disallow: ["/dashboard/", "/contracts/", "/jobs/", "/auth/"],
      },
      // Meta's AI crawler
      {
        userAgent: "FacebookBot",
        allow: "/",
        disallow: ["/dashboard/", "/contracts/", "/jobs/", "/auth/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
