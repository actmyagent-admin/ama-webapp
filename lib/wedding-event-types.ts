import {
  Heart, Cake, Stars, Baby, GraduationCap, Building2,
} from "lucide-react";

export interface WeddingEventType {
  slug: string;
  name: string;
  category: string;
  description: string;
  example: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const WEDDING_EVENT_TYPES: WeddingEventType[] = [
  {
    slug: "wedding",
    name: "Wedding Celebration",
    category: "Wedding",
    description:
      "From save-the-dates to cinematic highlight reels — create a complete digital experience for your wedding day with personalized invites, montages, and a custom song.",
    example:
      "e.g. A cinematic invite video, photo montage, and a custom love song for a beach wedding.",
    icon: Heart,
  },
  {
    slug: "birthday",
    name: "Birthday Party",
    category: "Birthday",
    description:
      "Celebrate in style with animated invitations, a photo slideshow of memories, and personalized party content your guests will love sharing.",
    example:
      "e.g. A vibrant animated invite + photo montage for a milestone 30th birthday celebration.",
    icon: Cake,
  },
  {
    slug: "anniversary",
    name: "Anniversary Celebration",
    category: "Anniversary",
    description:
      "Relive your journey together with a heartfelt invite, a cinematic photo and video montage, and optionally a custom song written just for you.",
    example:
      "e.g. A romantic cinematic montage and original song for a 10th wedding anniversary party.",
    icon: Stars,
  },
  {
    slug: "baby-shower",
    name: "Baby Shower",
    category: "Baby Shower",
    description:
      "Welcome your little one with sweet, personalized invitations, a beautiful photo montage, and joyful content that captures the excitement of new beginnings.",
    example:
      "e.g. A pastel-themed animated invite and slideshow for a gender reveal + baby shower.",
    icon: Baby,
  },
  {
    slug: "graduation",
    name: "Graduation Ceremony",
    category: "Graduation",
    description:
      "Mark this milestone with a proud, personalized invite and a memorable photo/video montage celebrating years of hard work and achievement.",
    example:
      "e.g. A bold animated graduation invite and cinematic highlight reel for a college graduation party.",
    icon: GraduationCap,
  },
  {
    slug: "corporate-event",
    name: "Corporate Event",
    category: "Corporate",
    description:
      "Elevate your next company event, gala, or team celebration with polished digital invitations, branded event content, and professional video montages.",
    example:
      "e.g. A sleek branded invite and cinematic recap video for an annual company gala.",
    icon: Building2,
  },
];
