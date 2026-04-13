import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Panic Product Builder — Find Panic Threads, Build & Sell Solution Guides",
  description:
    "Execute the Panic Product Playbook: find Reddit panic threads, generate AI-powered solution guides, and sell them on Gumroad. Your complete dashboard for building $37 digital products.",
  keywords: [
    "Panic Product Builder",
    "Digital Products",
    "Reddit Marketing",
    "Gumroad",
    "AI Content Generation",
    "Passive Income",
  ],
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
