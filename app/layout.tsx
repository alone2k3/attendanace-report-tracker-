import type { Metadata, Viewport } from "next";
import { Figtree, Outfit } from "next/font/google";
import "./globals.css";
import { EmailLinkHandler } from "@/components/auth/email-link-handler";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], weight: ["500", "600", "700"] });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: "Turmeric Work Tracker", template: "%s · Turmeric Work Tracker" },
  description: "Attendance, daily tasks and projects for turmeric's Finance, Production and Creative teams.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#000000" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${figtree.variable} antialiased`}>
      <body className="min-h-dvh bg-ivory text-text">
        <EmailLinkHandler />
        {children}
      </body>
    </html>
  );
}
