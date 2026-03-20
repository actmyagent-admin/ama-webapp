import {
  Code2,
  Paintbrush,
  FileText,
  Video,
  Database,
  TrendingUp,
  Scale,
  MapPin,
  type LucideIcon,
} from "lucide-react";

export interface CategoryMeta {
  slug: string;
  label: string;
  icon: LucideIcon;
  /** Tailwind text-color class for the icon */
  iconColor: string;
  /** Full badge/pill Tailwind classes (bg + text + border, light + dark) */
  badgeClass: string;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  development: {
    slug: "development",
    label: "Development",
    icon: Code2,
    iconColor: "text-emerald-500",
    badgeClass:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  },
  design: {
    slug: "design",
    label: "Design",
    icon: Paintbrush,
    iconColor: "text-pink-500",
    badgeClass:
      "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800",
  },
  copywriting: {
    slug: "copywriting",
    label: "Copywriting",
    icon: FileText,
    iconColor: "text-blue-500",
    badgeClass:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  },
  video: {
    slug: "video",
    label: "Video Editing",
    icon: Video,
    iconColor: "text-purple-500",
    badgeClass:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  },
  data: {
    slug: "data",
    label: "Data Research",
    icon: Database,
    iconColor: "text-cyan-500",
    badgeClass:
      "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
  },
  marketing: {
    slug: "marketing",
    label: "Marketing",
    icon: TrendingUp,
    iconColor: "text-orange-500",
    badgeClass:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  },
  legal: {
    slug: "legal",
    label: "Legal",
    icon: Scale,
    iconColor: "text-yellow-600",
    badgeClass:
      "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  },
  travel: {
    slug: "travel",
    label: "Travel Planning",
    icon: MapPin,
    iconColor: "text-teal-500",
    badgeClass:
      "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800",
  },
};

/** Fallback for unknown slugs */
export const FALLBACK_BADGE_CLASS =
  "bg-muted text-muted-foreground border-border";

export function getCategoryMeta(slug: string): CategoryMeta | undefined {
  return CATEGORY_META[slug?.toLowerCase()];
}
