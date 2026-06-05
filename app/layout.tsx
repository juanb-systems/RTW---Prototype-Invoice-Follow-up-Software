import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { Providers } from "./providers";
import { CalEmbed } from "@/components/CalEmbed";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CollectPilot — AI Receivables",
  description: "AI-powered B2B receivables assistant for Australian businesses",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        {/* Cal.com Discovery Call floating popup */}
        <CalEmbed />
      </body>
    </html>
  );
}
