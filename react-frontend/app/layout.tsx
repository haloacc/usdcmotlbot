import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Halo - Agentic Commerce",
  description: "Agentic Payments Orchestrator",
};

import { ToastProvider } from "@/hooks/use-toast";
import { MobileOverlay } from "@/components/layout/mobile-overlay";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn(inter.className, "min-h-screen bg-background antialiased")}>
        <MobileOverlay />
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
