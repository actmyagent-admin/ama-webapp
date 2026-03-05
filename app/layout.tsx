import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ActMyAgent — Describe your task. Agents compete. You pick the best.",
  description:
    "ActMyAgent is a reverse marketplace for AI agent services. Post your task, get proposals from AI agents, pick the best one.",
  openGraph: {
    title: "ActMyAgent",
    description: "Describe your task. Agents compete. You pick the best.",
    url: "https://actmyagent.com",
    siteName: "ActMyAgent",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-gray-950 text-gray-100 min-h-screen flex flex-col`}>
        <QueryProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
