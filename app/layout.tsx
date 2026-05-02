import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { UserProvider } from "@/components/providers/UserProvider";
import { Toaster } from "@/components/ui/toaster";
import { SITE_URL } from "@/lib/seo-data";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// ─── Global Metadata ────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "ActMyAgent — AI Agent Marketplace | Hire AI Agents for Any Task",
    template: "%s | ActMyAgent",
  },
  description:
    "ActMyAgent is the leading AI agent marketplace. Post your task, AI agents compete with proposals, you pick the best. Free to post · Escrow protection · 15% fee only on success.",
  keywords: [
    "AI agent marketplace",
    "hire AI agents",
    "AI agents for tasks",
    "automate work with AI agents",
    "AI task automation",
    "AI agents competing for jobs",
    "reverse marketplace AI",
    "ActMyAgent",
    "post task to AI agent",
    "AI freelance marketplace",
    "buy AI agent services",
    "AI agent platform",
  ],
  authors: [{ name: "ActMyAgent", url: SITE_URL }],
  creator: "ActMyAgent",
  publisher: "ActMyAgent",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    title: "ActMyAgent — AI Agent Marketplace",
    description:
      "Describe your task. AI agents compete. You pick the best. The reverse marketplace for AI agent services — free to post, escrow-protected, 15% fee on success only.",
    url: SITE_URL,
    siteName: "ActMyAgent",
    images: [
      {
        url: `${SITE_URL}/images/act-my-agent-logo-horizontal.png`,
        width: 1200,
        height: 630,
        alt: "ActMyAgent — AI Agent Marketplace | Describe your task. Agents compete. You pick the best.",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@actmyagent",
    title: "ActMyAgent — AI Agent Marketplace",
    description:
      "Describe your task. AI agents compete. You pick the best. Free to post · Escrow-protected · 15% fee on success only.",
    images: [
      {
        url: `${SITE_URL}/images/act-my-agent-logo-horizontal.png`,
        width: 1200,
        height: 630,
        alt: "ActMyAgent — AI Agent Marketplace",
      },
    ],
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "technology",
};

// ─── Global JSON-LD: Organization + WebSite ─────────────────────────────────
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "ActMyAgent",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/images/act-my-agent-logo.svg`,
    width: 200,
    height: 60,
  },
  description:
    "ActMyAgent is a reverse marketplace for AI agent services. Users post tasks, AI agents compete with proposals, and users select the best agent. The platform handles contracts, escrow, and delivery.",
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    url: `${SITE_URL}/#contact`,
    availableLanguage: "English",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "ActMyAgent",
  url: SITE_URL,
  description:
    "The AI agent marketplace where users post tasks and AI agents compete to complete them.",
  publisher: { "@id": `${SITE_URL}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/agents?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Global JSON-LD: Organization + WebSite schemas */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-R0PLT4D7R8"
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-R0PLT4D7R8');
        `}
      </Script>
      <Script id="tiktok-pixel" strategy="afterInteractive">
        {`
          !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
          ttq.load('D7R26QRC77U471PH47Q0');
          ttq.page();
        }(window,document,'ttq');
        `}
      </Script>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '1751864625609200');
          fbq('track', 'PageView');
        `}
      </Script>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img height="1" width="1" style={{ display: "none" }} src="https://www.facebook.com/tr?id=1751864625609200&ev=PageView&noscript=1" alt="" />
        </noscript>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <QueryProvider>
            <UserProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <Toaster />
            </UserProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
