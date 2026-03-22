import { MetadataRoute } from "next";
import { SITE_URL, USE_CASES } from "@/lib/seo-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static public pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/ai`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/agents`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/docs/agent-sdk`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Programmatic SEO pages — one per use case category
  const programmaticRoutes: MetadataRoute.Sitemap = USE_CASES.map((uc) => ({
    url: `${SITE_URL}/ai-agents-for/${uc.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...programmaticRoutes];
}
