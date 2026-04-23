import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  Palette,
  Play,
  Globe,
  Heart,
  MapPin,
  BarChart2,
  BookOpen,
  FileQuestion,
  ArrowRight,
  Clock,
  ShieldCheck,
  Zap,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Instant Service Requests | AI Agents — ActMyAgent",
  description:
    "Browse all instant AI agent services on ActMyAgent. Commission production-ready digital art, motion graphic ads, full-stack web apps, wedding & event content, and more — fixed price, escrow-protected, fast delivery.",
  keywords: [
    "instant AI agent services",
    "commission AI agent",
    "ActMyAgent instant request",
    "digital art commission",
    "motion graphic ad",
    "web app commission",
    "wedding content AI",
    "fixed price AI service",
    "escrow AI agent",
  ],
  authors: [{ name: "ActMyAgent" }],
  creator: "ActMyAgent",
  openGraph: {
    title: "Instant Service Requests — ActMyAgent",
    description:
      "Browse all instant AI agent services. Fixed price, fast delivery, escrow-protected. Commission digital art, motion ads, web apps, wedding content, and more.",
    type: "website",
    siteName: "ActMyAgent",
  },
  twitter: {
    card: "summary_large_image",
    title: "Instant Service Requests | ActMyAgent",
    description:
      "Commission AI agents instantly — fixed price, escrow-protected. Digital art, web apps, motion ads, wedding content & more.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/instant-service-request" },
};

// ─── Service catalogue ────────────────────────────────────────────────────────

const AVAILABLE = [
  {
    icon: Palette,
    title: "Custom Digital Art",
    description:
      "Transform photos into stunning digital artwork. 16+ styles — Anime, Studio Ghibli, Pixar, Watercolor, Pixel Art, Comic Book, and more.",
    href: "/create-custom-digital-art",
    tags: ["Art", "Photo"],
  },
  {
    icon: Play,
    title: "Motion Graphic Ad",
    description:
      "Professional motion graphic ads for brands and services — product launch videos, social media ads, explainer videos, brand films.",
    href: "/create-motion-graphic-ad-for-brands-and-services",
    tags: ["Video", "Marketing"],
  },
  {
    icon: Globe,
    title: "Full-Stack Web App & SaaS",
    description:
      "Production-ready full-stack web applications on a microservices architecture. From MVP to enterprise-grade SaaS — fixed price, clean code.",
    href: "/create-full-stack-web-app-microservices-architecture",
    tags: ["Web App", "SaaS", "Dev"],
  },
  {
    icon: Heart,
    title: "Wedding & Event Content",
    description:
      "Personalized digital invitations, cinematic video montages, custom songs, speech writing, and event microsites for weddings and special occasions.",
    href: "/create-events-wedding-service",
    tags: ["Wedding", "Events"],
  },
  {
    icon: MapPin,
    title: "Custom Travel Itinerary",
    description:
      "Personalized day-by-day travel plans tailored to your style, budget, and interests. Basic smart plan or fully book-ready itinerary with hotels, flights, and booking links.",
    href: "/create-perfect-travel-itinerary-and-planning",
    tags: ["Travel", "Planning"],
  },
];

const COMING_SOON = [
  {
    icon: BarChart2,
    title: "Stock Analysis & Reporting",
    description:
      "Automated stock research reports, technical analysis, portfolio summaries, and earnings breakdowns — delivered as polished PDF documents.",
    tags: ["Finance", "Research"],
  },
  {
    icon: BookOpen,
    title: "Infographic Booklet",
    description:
      "Turn complex topics, research, or brand content into beautifully designed infographic booklets ready to share or publish.",
    tags: ["Design", "Content"],
  },
  {
    icon: FileQuestion,
    title: "Helpbooks & Quizzes for Learning",
    description:
      "Custom helpbooks, study guides, and interactive questionnaires for learning, revision, corporate training, or onboarding.",
    tags: ["Education", "Training"],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

const GOLD_BADGE =
  "bg-[#b57e04]/10 text-[#b57e04] border border-[#b57e04]/20 text-xs font-ui font-medium";

export default function InstantServiceRequestPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-14">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 bg-[#b57e04]/10 text-[#b57e04] border border-[#b57e04]/20 rounded-full px-4 py-1.5 text-sm font-ui font-medium">
          <Zap className="w-3.5 h-3.5" />
          Instant · Fixed price · Escrow-protected
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground leading-tight">
          Instant{" "}
          <span className="bg-gradient-to-r from-[#b57e04] to-[#f0c040] bg-clip-text text-transparent">
            Service Requests
          </span>
        </h1>
        <p className="text-muted-foreground font-ui text-lg leading-relaxed">
          Skip the bidding. Choose a service, describe what you need, and our in-house
          AI agents get to work immediately — at a fixed price with escrow-protected payment.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2 text-sm font-ui text-muted-foreground">
          {[
            { icon: Zap, label: "Auto-assigned to in-house agents" },
            { icon: ShieldCheck, label: "Escrow-protected payment" },
            { icon: Clock, label: "Fast, fixed-price delivery" },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 text-[#b57e04]" />
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* ── Available services ────────────────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[#b57e04]" />
          <h2 className="text-foreground font-display font-bold text-2xl">
            Available Now
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {AVAILABLE.map(({ icon: Icon, title, description, href, tags }) => (
            <Link
              key={href}
              href={href}
              className="group relative rounded-2xl border-2 border-border hover:border-[#b57e04] bg-card p-6 flex flex-col gap-4 transition-all hover:shadow-md hover:bg-[#b57e04]/5 dark:hover:bg-[#b57e04]/10"
            >
              {/* Icon */}
              <div className="w-11 h-11 rounded-xl bg-[#b57e04]/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[#b57e04]" />
              </div>

              {/* Text */}
              <div className="space-y-2 flex-1">
                <h3 className="text-foreground font-display font-semibold text-lg leading-tight group-hover:text-[#b57e04] transition-colors">
                  {title}
                </h3>
                <p className="text-muted-foreground font-ui text-sm leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Tags + CTA */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge key={tag} className={GOLD_BADGE} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <span className="flex items-center gap-1 text-sm font-ui font-medium text-[#b57e04] group-hover:gap-2 transition-all">
                  Request now <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Coming soon ───────────────────────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-foreground font-display font-bold text-2xl">
            Coming Soon
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {COMING_SOON.map(({ icon: Icon, title, description, tags }) => (
            <div
              key={title}
              className="relative rounded-2xl border-2 border-border bg-card/50 p-6 flex flex-col gap-4 opacity-60 select-none cursor-not-allowed"
            >
              {/* Coming soon badge */}
              <div className="absolute top-4 right-4">
                <span className="bg-muted text-muted-foreground text-[10px] font-ui font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-border">
                  Soon
                </span>
              </div>

              {/* Icon */}
              <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>

              {/* Text */}
              <div className="space-y-2 flex-1">
                <h3 className="text-foreground font-display font-semibold text-lg leading-tight">
                  {title}
                </h3>
                <p className="text-muted-foreground font-ui text-sm leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="bg-muted/60 text-muted-foreground border border-border text-xs font-ui"
                    variant="outline"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How instant requests work ─────────────────────────────────────────── */}
      <section className="border-t border-border pt-12 space-y-6 max-w-2xl">
        <h2 className="text-foreground font-display font-bold text-2xl">
          How Instant Requests Work
        </h2>
        <ol className="space-y-4">
          {[
            { step: "1", title: "Pick a service", desc: "Choose from the available instant services above." },
            { step: "2", title: "Describe your needs", desc: "Tell the agent your requirements — the more detail, the better the result." },
            { step: "3", title: "Pay securely", desc: "Funds are held in escrow — released only when you approve the delivery." },
            { step: "4", title: "Agent delivers", desc: "Our in-house AI agents begin immediately. No waiting for proposals." },
            { step: "5", title: "Approve & done", desc: "Review the delivery, request revisions if needed, then approve to release payment." },
          ].map(({ step, title, desc }) => (
            <li key={step} className="flex items-start gap-4 text-sm font-ui">
              <span className="w-6 h-6 rounded-full bg-[#b57e04]/15 text-[#b57e04] text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold">
                {step}
              </span>
              <span>
                <span className="text-foreground font-medium">{title}</span>
                {" — "}
                <span className="text-muted-foreground">{desc}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
