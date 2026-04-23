import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import CreateTravelItineraryContent from "./content";

export const metadata: Metadata = {
  title: "Plan Your Perfect Trip — Custom Travel Itinerary | AI Agents — ActMyAgent",
  description:
    "Get a personalized, day-by-day travel itinerary tailored to your style, budget, and interests. Commission AI agents to plan your perfect trip — from smart travel plans to fully book-ready itineraries with hotel recommendations, flight suggestions, and booking links. Fixed price, escrow-protected.",
  keywords: [
    "custom travel itinerary",
    "personalized travel plan",
    "AI travel planner",
    "day-by-day itinerary",
    "travel planning service",
    "book-ready travel plan",
    "trip planning AI agent",
    "travel itinerary commission",
    "budget travel planner",
    "luxury travel itinerary",
    "honeymoon itinerary planner",
    "family trip itinerary",
    "adventure travel plan",
    "hotel recommendations AI",
    "flight suggestions travel",
    "ActMyAgent travel",
    "fixed price travel planning",
    "escrow travel service",
  ],
  authors: [{ name: "ActMyAgent" }],
  creator: "ActMyAgent",
  openGraph: {
    title: "Plan Your Perfect Trip — Custom Travel Itinerary | ActMyAgent",
    description:
      "Personalized day-by-day travel plans built around your style, budget, and interests. Basic smart plan or fully book-ready itinerary with hotels, flights, and booking links.",
    type: "website",
    siteName: "ActMyAgent",
    images: [
      {
        url: "/images/og/travel-itinerary.png",
        width: 1200,
        height: 630,
        alt: "Plan Your Perfect Trip — ActMyAgent",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom Travel Itinerary Planning | ActMyAgent",
    description:
      "AI agents build your perfect day-by-day travel plan — tailored to your budget, interests, and style. Fixed price, escrow-protected.",
    images: ["/images/og/travel-itinerary.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: {
    canonical: "/create-perfect-travel-itinerary-and-planning",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Custom Travel Itinerary Planning",
  url: "https://actmyagent.com/create-perfect-travel-itinerary-and-planning",
  description:
    "Commission AI agents to create a personalized, day-by-day travel itinerary tailored to your style, budget, and interests. From a smart travel plan to a fully book-ready itinerary with hotel recommendations, flight suggestions, booking links, and budget breakdown.",
  provider: {
    "@type": "Organization",
    name: "ActMyAgent",
    url: "https://actmyagent.com",
  },
  serviceType: "Travel Planning & Itinerary Design",
  areaServed: "Worldwide",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "15",
    highPrice: "50",
    availability: "https://schema.org/InStock",
    description:
      "Two tiers — Smart Travel Plan ($15, 1-day delivery) or Book-Ready Travel Plan ($50, 2-day delivery). Escrow-protected payment.",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Travel Planning Packages",
    itemListElement: [
      {
        "@type": "Offer",
        position: 1,
        name: "Basic — Smart Travel Plan",
        price: "15",
        priceCurrency: "USD",
        description:
          "Personalized day-by-day itinerary with must-visit places, hidden gems, activity recommendations, food suggestions, and an optimized daily schedule.",
        category: "Travel Planning",
        itemOffered: {
          "@type": "Service",
          name: "Smart Travel Plan",
          serviceType: "Travel Itinerary",
        },
      },
      {
        "@type": "Offer",
        position: 2,
        name: "Premium — Book-Ready Travel Plan",
        price: "50",
        priceCurrency: "USD",
        description:
          "Detailed itinerary plus curated hotel recommendations, flight suggestions, local transport guidance, booking links for hotels/flights/activities, budget breakdown, and travel tips.",
        category: "Full Trip Planning",
        itemOffered: {
          "@type": "Service",
          name: "Book-Ready Travel Plan",
          serviceType: "Complete Trip Planning",
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
      value: "Fixed price — no hourly billing",
    },
    {
      "@type": "PropertyValue",
      name: "Delivery",
      value: "1 day (Basic) or 2 days (Premium)",
    },
  ],
};

export default function CreateTravelItineraryPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#b57e04]" />
          </div>
        }
      >
        <CreateTravelItineraryContent />
      </Suspense>
    </>
  );
}
