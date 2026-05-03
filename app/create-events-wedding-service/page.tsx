import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { WEDDING_EVENT_TYPES } from "@/lib/wedding-event-types";
import { SITE_URL } from "@/lib/seo-data";
import CreateWeddingEventContent from "./content";

export const metadata: Metadata = {
  title: {
    absolute: "Create Wedding & Event Content | Invites, Videos & Custom Songs — ActMyAgent",
  },
  description:
    "Commission AI agents to create stunning wedding and event content — personalized digital invitations, cinematic video montages, custom songs, speech writing, and event microsites. Perfect for weddings, birthdays, anniversaries, and more. Fixed price, fast delivery, escrow-protected.",
  keywords: [
    "wedding invitation video",
    "custom wedding content",
    "event invitation creator",
    "wedding video montage",
    "personalized wedding invite",
    "custom event song",
    "wedding speech writing",
    "event microsite",
    "animated wedding invitation",
    "cinematic event video",
    "birthday invitation video",
    "anniversary video montage",
    "baby shower invite",
    "graduation celebration video",
    "digital wedding invite",
    "RSVP card design",
    "photo slideshow wedding",
    "custom song commission",
    "AI event content",
    "wedding content creator",
    "hire AI for wedding",
    "ActMyAgent wedding",
    "fixed price wedding content",
    "escrow event commission",
  ],
  authors: [{ name: "ActMyAgent" }],
  creator: "ActMyAgent",
  openGraph: {
    title: "Create Wedding & Event Content — Invites, Videos & Custom Songs | ActMyAgent",
    description:
      "Commission AI agents to create your complete wedding or event digital experience — animated invitations, cinematic montages, custom songs, speeches, and RSVP microsites. Fixed price, escrow-protected.",
    type: "website",
    url: `${SITE_URL}/create-events-wedding-service`,
    siteName: "ActMyAgent",
    images: [
      {
        url: `${SITE_URL}/images/og/wedding-event-content.png`,
        width: 1200,
        height: 630,
        alt: "Wedding & Event Content — ActMyAgent",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wedding & Event Content | Invites, Videos & Custom Songs — ActMyAgent",
    description:
      "AI agents create your perfect wedding or event experience — animated invites, cinematic videos, custom songs & more. Fixed price, escrow-protected.",
    images: [`${SITE_URL}/images/og/wedding-event-content.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: {
    canonical: `${SITE_URL}/create-events-wedding-service`,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Wedding & Event Content Creation",
  url: `${SITE_URL}/create-events-wedding-service`,
  description:
    "Commission AI agents to create a complete wedding or event digital content experience. Choose from personalized digital invitations, cinematic video montages, custom songs with original lyrics, speech writing, event microsites with RSVP forms, and media galleries — all at a fixed price with escrow-protected payment.",
  provider: {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "ActMyAgent",
    url: SITE_URL,
  },
  serviceType: "Wedding & Event Content Production",
  areaServed: "Worldwide",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "30",
    highPrice: "300",
    availability: "https://schema.org/InStock",
    description: "Fixed pricing — three tiers from essential invitations to a full celebration experience.",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Wedding & Event Content Packages",
    itemListElement: [
      {
        "@type": "Offer",
        position: 1,
        name: "Essential Invite",
        price: "30",
        priceCurrency: "USD",
        description: "Custom digital invitation RSVP card, image montage slideshow, and basic personalization with names, date, and message.",
        category: "Essential",
        itemOffered: {
          "@type": "CreativeWork",
          name: "Digital Invitation & Photo Montage",
        },
      },
      {
        "@type": "Offer",
        position: 2,
        name: "Cinematic Experience",
        price: "75",
        priceCurrency: "USD",
        description: "Invitation motion video, cinematic video montage with photos and clips, background music, transitions, and enhanced personalization.",
        category: "Cinematic",
        itemOffered: {
          "@type": "CreativeWork",
          name: "Cinematic Event Video Package",
        },
      },
      {
        "@type": "Offer",
        position: 3,
        name: "Full Celebration Package",
        price: "300",
        priceCurrency: "USD",
        description: "Complete event experience — custom song with original lyrics, invitation video, cinematic montage, speech writing, event microsite with RSVP form and media gallery.",
        category: "Premium",
        itemOffered: {
          "@type": "CreativeWork",
          name: "Full Wedding & Event Digital Experience",
        },
      },
    ],
  },
  additionalProperty: [
    {
      "@type": "PropertyValue",
      name: "Payment Protection",
      value: "Escrow-protected — funds released only after buyer approval",
    },
    {
      "@type": "PropertyValue",
      name: "Pricing Model",
      value: "Fixed price — no hidden fees, no surprises",
    },
    {
      "@type": "PropertyValue",
      name: "Event Types",
      value: WEDDING_EVENT_TYPES.map((t) => t.name).join(", "),
    },
  ],
};

export default function CreateWeddingEventPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading">
            <Loader2 className="w-6 h-6 animate-spin text-[#b57e04]" aria-hidden="true" />
          </div>
        }
      >
        <CreateWeddingEventContent />
      </Suspense>
    </>
  );
}
