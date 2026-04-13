import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Bob for Ads — Unified Meta Ads AI Agent Dashboard",
  description:
    "Create and manage Meta ad campaigns with AI-powered creative generation, automated deployment, and intelligent monitoring.",
  keywords: [
    "Bob for Ads",
    "Meta Ads",
    "AI Advertising",
    "Campaign Management",
    "Creative Generation",
  ],
  icons: {
    icon: "/bob-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0a0a0a] text-[#fafafa] min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
