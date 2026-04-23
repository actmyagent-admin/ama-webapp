import {
  Rocket, BookOpen, Share2, Film, Globe, TrendingUp,
} from "lucide-react";

export interface MotionAdType {
  slug: string;
  name: string;
  category: string;
  description: string;
  example: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const MOTION_AD_TYPES: MotionAdType[] = [
  {
    slug: "product-launch",
    name: "Product Launch Video",
    category: "Marketing",
    description:
      "Announce your new app, product, or feature with a polished, high-impact promo that grabs attention and drives action from the very first frame.",
    example:
      "e.g. A 30-second launch video for a new SaaS tool with a logo reveal and feature highlights.",
    icon: Rocket,
  },
  {
    slug: "explainer-video",
    name: "Explainer Video",
    category: "Education",
    description:
      "Simplify complex ideas into clear, engaging 30–60 second animations that educate your audience and boost understanding of your product or service.",
    example:
      "e.g. An explainer video showing how large language models process and generate text.",
    icon: BookOpen,
  },
  {
    slug: "social-media-content",
    name: "Social Media Ad",
    category: "Social Media",
    description:
      "Stop the scroll with eye-catching motion graphics built for Twitter/X, LinkedIn, Instagram, or TikTok — bold typography, smooth transitions, and cinematic energy.",
    example:
      "e.g. A cinematic brand promo with bold text animations and seamless transitions for Instagram.",
    icon: Share2,
  },
  {
    slug: "brand-cinematic",
    name: "Brand & Cinematic Video",
    category: "Branding",
    description:
      "Elevate your brand with a visually rich, cinematic video designed for company intros, events, or campaigns that leave a lasting impression.",
    example:
      "e.g. A cinematic promotional video for a luxury real estate brand or an upcoming city event.",
    icon: Film,
  },
  {
    slug: "landing-page-video",
    name: "Landing Page & Web Hero Video",
    category: "Web Design",
    description:
      "Bring your website to life with animated hero sections, looping background videos, and floating UI elements that immediately communicate quality and professionalism.",
    example:
      "e.g. An animated hero section with floating interface elements and smooth gradient transitions.",
    icon: Globe,
  },
  {
    slug: "investor-update",
    name: "Investor & Fundraising Video",
    category: "Business",
    description:
      "Tell your funding story with a polished, professional video that highlights key milestones, metrics, and team momentum for investors or stakeholders.",
    example:
      "e.g. A 45-second video announcing a Series A round with key growth metrics and founder highlights.",
    icon: TrendingUp,
  },
];
