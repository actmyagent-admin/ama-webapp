import {
  Code2,
  Server,
  Shield,
  Database,
  Cpu,
  Paintbrush,
  Monitor,
  Video,
  Camera,
  Mic,
  Music,
  Box,
  BarChart2,
  Pen,
  Layers,
  Palette,
  Zap,
  Film,
  BookOpen,
  Gem,
  Shirt,
  Home,
  Building,
  Building2,
  Headphones,
  Volume2,
  Target,
  Package,
  FileText,
  Pencil,
  FileCheck,
  Globe,
  List,
  Search,
  TrendingUp,
  Share2,
  Mail,
  Users,
  ShoppingBag,
  Calculator,
  BarChart,
  Briefcase,
  PieChart,
  Scale,
  UserPlus,
  Calendar,
  MapPin,
  GraduationCap,
  Activity,
  ShieldAlert,
  Heart,
  type LucideIcon,
} from "lucide-react";

export interface CategoryMeta {
  slug: string;
  label: string;
  /** Emoji used as a visual vector/icon alongside the Lucide icon */
  emoji: string;
  icon: LucideIcon;
  /** Tailwind text-color class for the icon */
  iconColor: string;
  /** Full badge/pill Tailwind classes (bg + text + border, light + dark) */
  badgeClass: string;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  // ── Tech & Engineering ────────────────────────────────────────────────────
  development: {
    slug: "development",
    label: "Development",
    emoji: "💻",
    icon: Code2,
    iconColor: "text-emerald-500",
    badgeClass:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  },
  devops: {
    slug: "devops",
    label: "DevOps & Infrastructure",
    emoji: "⚙️",
    icon: Server,
    iconColor: "text-slate-500",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-700",
  },
  "qa-testing": {
    slug: "qa-testing",
    label: "QA & Testing",
    emoji: "🧪",
    icon: ShieldAlert,
    iconColor: "text-lime-600",
    badgeClass:
      "bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800",
  },
  cybersecurity: {
    slug: "cybersecurity",
    label: "Cybersecurity",
    emoji: "🔐",
    icon: Shield,
    iconColor: "text-red-500",
    badgeClass:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  },
  database: {
    slug: "database",
    label: "Database Administration",
    emoji: "🗄️",
    icon: Database,
    iconColor: "text-cyan-600",
    badgeClass:
      "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
  },
  "api-integration": {
    slug: "api-integration",
    label: "API Integration",
    emoji: "🔌",
    icon: Cpu,
    iconColor: "text-indigo-500",
    badgeClass:
      "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
  },

  // ── Creative & Media ──────────────────────────────────────────────────────
  design: {
    slug: "design",
    label: "Design",
    emoji: "🎨",
    icon: Paintbrush,
    iconColor: "text-pink-500",
    badgeClass:
      "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800",
  },
  "ui-ux": {
    slug: "ui-ux",
    label: "UI/UX Design",
    emoji: "🖥️",
    icon: Monitor,
    iconColor: "text-violet-500",
    badgeClass:
      "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
  },
  video: {
    slug: "video",
    label: "Video Editing",
    emoji: "🎬",
    icon: Video,
    iconColor: "text-purple-500",
    badgeClass:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  },
  "photo-editing": {
    slug: "photo-editing",
    label: "Photo Editing",
    emoji: "📷",
    icon: Camera,
    iconColor: "text-rose-500",
    badgeClass:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
  },
  podcast: {
    slug: "podcast",
    label: "Podcast Production",
    emoji: "🎙️",
    icon: Mic,
    iconColor: "text-amber-500",
    badgeClass:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  },
  "music-audio": {
    slug: "music-audio",
    label: "Music & Audio Production",
    emoji: "🎵",
    icon: Music,
    iconColor: "text-fuchsia-500",
    badgeClass:
      "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 dark:border-fuchsia-800",
  },
  "3d-animation": {
    slug: "3d-animation",
    label: "3D Modeling & Animation",
    emoji: "🧊",
    icon: Box,
    iconColor: "text-orange-500",
    badgeClass:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  },
  presentation: {
    slug: "presentation",
    label: "Presentation Design",
    emoji: "📊",
    icon: BarChart2,
    iconColor: "text-sky-500",
    badgeClass:
      "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800",
  },

  // ── Arts & Visual Creation ────────────────────────────────────────────────
  illustration: {
    slug: "illustration",
    label: "Illustration & Digital Art",
    emoji: "✏️",
    icon: Pen,
    iconColor: "text-pink-600",
    badgeClass:
      "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800",
  },
  "logo-branding": {
    slug: "logo-branding",
    label: "Logo & Brand Identity",
    emoji: "🏷️",
    icon: Layers,
    iconColor: "text-rose-600",
    badgeClass:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
  },
  "graphic-design": {
    slug: "graphic-design",
    label: "Graphic Design",
    emoji: "🖼️",
    icon: Palette,
    iconColor: "text-orange-400",
    badgeClass:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  },
  "motion-graphics": {
    slug: "motion-graphics",
    label: "Motion Graphics & VFX",
    emoji: "✨",
    icon: Zap,
    iconColor: "text-yellow-500",
    badgeClass:
      "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  },
  "2d-animation": {
    slug: "2d-animation",
    label: "2D Animation",
    emoji: "🎞️",
    icon: Film,
    iconColor: "text-purple-400",
    badgeClass:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  },
  "comic-storyboard": {
    slug: "comic-storyboard",
    label: "Comic & Storyboard Art",
    emoji: "📚",
    icon: BookOpen,
    iconColor: "text-indigo-500",
    badgeClass:
      "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
  },
  "nft-art": {
    slug: "nft-art",
    label: "NFT & Generative Art",
    emoji: "💎",
    icon: Gem,
    iconColor: "text-violet-500",
    badgeClass:
      "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
  },
  "fashion-design": {
    slug: "fashion-design",
    label: "Fashion & Textile Design",
    emoji: "👗",
    icon: Shirt,
    iconColor: "text-pink-400",
    badgeClass:
      "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800",
  },
  "interior-design": {
    slug: "interior-design",
    label: "Interior & Space Design",
    emoji: "🏠",
    icon: Home,
    iconColor: "text-amber-600",
    badgeClass:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  },
  "architecture-viz": {
    slug: "architecture-viz",
    label: "Architecture Visualization",
    emoji: "🏛️",
    icon: Building,
    iconColor: "text-slate-500",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-700",
  },

  // ── Music & Audio Arts ────────────────────────────────────────────────────
  "music-composition": {
    slug: "music-composition",
    label: "Music Composition",
    emoji: "🎼",
    icon: Music,
    iconColor: "text-blue-500",
    badgeClass:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  },
  songwriting: {
    slug: "songwriting",
    label: "Songwriting & Lyrics",
    emoji: "🎤",
    icon: Mic,
    iconColor: "text-purple-600",
    badgeClass:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  },
  "beat-making": {
    slug: "beat-making",
    label: "Beat Making & Mixing",
    emoji: "🥁",
    icon: Headphones,
    iconColor: "text-orange-600",
    badgeClass:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  },
  "sound-design": {
    slug: "sound-design",
    label: "Sound Design",
    emoji: "🔊",
    icon: Volume2,
    iconColor: "text-cyan-500",
    badgeClass:
      "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
  },
  "voice-over": {
    slug: "voice-over",
    label: "Voice Over",
    emoji: "🎧",
    icon: Headphones,
    iconColor: "text-teal-500",
    badgeClass:
      "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800",
  },

  // ── Game & Interactive ────────────────────────────────────────────────────
  "game-design": {
    slug: "game-design",
    label: "Game Design",
    emoji: "🎮",
    icon: Target,
    iconColor: "text-green-500",
    badgeClass:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  },
  "game-assets": {
    slug: "game-assets",
    label: "Game Asset Creation",
    emoji: "🧩",
    icon: Package,
    iconColor: "text-emerald-600",
    badgeClass:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  },

  // ── Writing & Content ─────────────────────────────────────────────────────
  copywriting: {
    slug: "copywriting",
    label: "Copywriting",
    emoji: "✍️",
    icon: FileText,
    iconColor: "text-blue-500",
    badgeClass:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  },
  "content-creation": {
    slug: "content-creation",
    label: "Content Creation",
    emoji: "📝",
    icon: Pencil,
    iconColor: "text-sky-500",
    badgeClass:
      "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800",
  },
  "technical-writing": {
    slug: "technical-writing",
    label: "Technical Writing",
    emoji: "📋",
    icon: FileCheck,
    iconColor: "text-slate-500",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-700",
  },
  translation: {
    slug: "translation",
    label: "Translation & Localization",
    emoji: "🌍",
    icon: Globe,
    iconColor: "text-teal-600",
    badgeClass:
      "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800",
  },
  transcription: {
    slug: "transcription",
    label: "Transcription",
    emoji: "📝",
    icon: List,
    iconColor: "text-gray-500",
    badgeClass:
      "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700",
  },
  proofreading: {
    slug: "proofreading",
    label: "Proofreading & Editing",
    emoji: "✅",
    icon: FileCheck,
    iconColor: "text-green-600",
    badgeClass:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  },

  // ── Marketing & Growth ────────────────────────────────────────────────────
  marketing: {
    slug: "marketing",
    label: "Marketing",
    emoji: "📈",
    icon: TrendingUp,
    iconColor: "text-orange-500",
    badgeClass:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  },
  "social-media": {
    slug: "social-media",
    label: "Social Media Management",
    emoji: "📱",
    icon: Share2,
    iconColor: "text-blue-400",
    badgeClass:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  },
  seo: {
    slug: "seo",
    label: "SEO Optimization",
    emoji: "🔍",
    icon: Search,
    iconColor: "text-green-500",
    badgeClass:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  },
  "email-marketing": {
    slug: "email-marketing",
    label: "Email Marketing",
    emoji: "📧",
    icon: Mail,
    iconColor: "text-indigo-500",
    badgeClass:
      "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
  },
  "paid-ads": {
    slug: "paid-ads",
    label: "Paid Advertising",
    emoji: "🎯",
    icon: Target,
    iconColor: "text-red-500",
    badgeClass:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  },
  "sales-leads": {
    slug: "sales-leads",
    label: "Sales & Lead Generation",
    emoji: "👥",
    icon: Users,
    iconColor: "text-orange-600",
    badgeClass:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  },
  ecommerce: {
    slug: "ecommerce",
    label: "E-commerce Management",
    emoji: "🛒",
    icon: ShoppingBag,
    iconColor: "text-amber-500",
    badgeClass:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  },

  // ── Finance & Business ────────────────────────────────────────────────────
  accounting: {
    slug: "accounting",
    label: "Accounting & Bookkeeping",
    emoji: "🧮",
    icon: Calculator,
    iconColor: "text-slate-600",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-700",
  },
  tax: {
    slug: "tax",
    label: "Tax Advisory",
    emoji: "💰",
    icon: FileText,
    iconColor: "text-green-700",
    badgeClass:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  },
  "financial-analysis": {
    slug: "financial-analysis",
    label: "Financial Analysis",
    emoji: "📊",
    icon: BarChart,
    iconColor: "text-blue-600",
    badgeClass:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  },
  "business-planning": {
    slug: "business-planning",
    label: "Business Planning",
    emoji: "💼",
    icon: Briefcase,
    iconColor: "text-amber-600",
    badgeClass:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  },
  "market-research": {
    slug: "market-research",
    label: "Market Research",
    emoji: "📉",
    icon: PieChart,
    iconColor: "text-purple-500",
    badgeClass:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  },

  // ── Legal, Compliance & HR ────────────────────────────────────────────────
  legal: {
    slug: "legal",
    label: "Legal",
    emoji: "⚖️",
    icon: Scale,
    iconColor: "text-yellow-600",
    badgeClass:
      "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  },
  compliance: {
    slug: "compliance",
    label: "Compliance Management",
    emoji: "📋",
    icon: Shield,
    iconColor: "text-blue-700",
    badgeClass:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  },
  "contract-review": {
    slug: "contract-review",
    label: "Contract Review",
    emoji: "📄",
    icon: FileCheck,
    iconColor: "text-green-700",
    badgeClass:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  },
  "hr-recruitment": {
    slug: "hr-recruitment",
    label: "HR & Recruitment",
    emoji: "👤",
    icon: UserPlus,
    iconColor: "text-violet-500",
    badgeClass:
      "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
  },

  // ── Operations & Support ──────────────────────────────────────────────────
  "customer-support": {
    slug: "customer-support",
    label: "Customer Support",
    emoji: "🎧",
    icon: Headphones,
    iconColor: "text-blue-500",
    badgeClass:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  },
  "project-management": {
    slug: "project-management",
    label: "Project Management",
    emoji: "📌",
    icon: Calendar,
    iconColor: "text-orange-500",
    badgeClass:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  },
  data: {
    slug: "data",
    label: "Data Research",
    emoji: "🔬",
    icon: Database,
    iconColor: "text-cyan-500",
    badgeClass:
      "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
  },
  "data-analysis": {
    slug: "data-analysis",
    label: "Data Analysis & Reporting",
    emoji: "📊",
    icon: BarChart2,
    iconColor: "text-sky-600",
    badgeClass:
      "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800",
  },
  "product-management": {
    slug: "product-management",
    label: "Product Management",
    emoji: "📦",
    icon: Package,
    iconColor: "text-amber-500",
    badgeClass:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  },
  "event-planning": {
    slug: "event-planning",
    label: "Event Planning",
    emoji: "📅",
    icon: Calendar,
    iconColor: "text-pink-500",
    badgeClass:
      "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800",
  },
  travel: {
    slug: "travel",
    label: "Travel Planning",
    emoji: "🗺️",
    icon: MapPin,
    iconColor: "text-teal-500",
    badgeClass:
      "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800",
  },

  // ── Education & Research ──────────────────────────────────────────────────
  education: {
    slug: "education",
    label: "Educational Content",
    emoji: "🎓",
    icon: GraduationCap,
    iconColor: "text-blue-600",
    badgeClass:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  },
  "academic-research": {
    slug: "academic-research",
    label: "Academic Research",
    emoji: "🔬",
    icon: Search,
    iconColor: "text-green-600",
    badgeClass:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  },
  "medical-research": {
    slug: "medical-research",
    label: "Medical & Health Research",
    emoji: "🏥",
    icon: Activity,
    iconColor: "text-red-500",
    badgeClass:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  },
  "real-estate": {
    slug: "real-estate",
    label: "Real Estate Research",
    emoji: "🏡",
    icon: Building2,
    iconColor: "text-slate-600",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-700",
  },

  // ── New Categories ────────────────────────────────────────────────────────
  "web-app-saas": {
    slug: "web-app-saas",
    label: "Web App & SaaS",
    emoji: "🌐",
    icon: Globe,
    iconColor: "text-emerald-600",
    badgeClass:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  },
  "event-wedding": {
    slug: "event-wedding",
    label: "Event & Wedding Content",
    emoji: "💍",
    icon: Heart,
    iconColor: "text-rose-500",
    badgeClass:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
  },
};

/**
 * The 10 most broadly applicable categories shown on the homepage.
 * Ordered to match a typical user's mental model.
 */
export const FEATURED_CATEGORY_SLUGS = [
  "development",
  "design",
  "marketing",
  "video",
  "copywriting",
  "social-media",
  "data",
  "ui-ux",
  "seo",
  "customer-support",
  "web-app-saas",
  "event-wedding",
];

/** Fallback for unknown slugs */
export const FALLBACK_BADGE_CLASS =
  "bg-muted text-muted-foreground border-border";

export function getCategoryMeta(slug: string): CategoryMeta | undefined {
  return CATEGORY_META[slug?.toLowerCase()];
}
