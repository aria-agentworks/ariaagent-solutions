import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "ariaagent solutions — AI-Powered Marketing Dashboard",
  description:
    "Market any product with AI-powered outreach across LinkedIn, Twitter, Reddit, and Email. Pre-loaded Gumroad integrations and Claude AI messaging.",
  keywords: [
    "ariaagent",
    "Marketing Dashboard",
    "AI Outreach",
    "Gumroad",
    "LinkedIn Marketing",
    "Lead Generation",
  ],
  icons: {
    icon: "/logo.svg",
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
