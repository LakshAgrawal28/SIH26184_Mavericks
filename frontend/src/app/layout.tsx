import "./globals.css";
import type { ReactNode } from "react";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const grotesk = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-grotesk",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata = {
  title: "ECDAT",
  description: "Enterprise Cryptographic Discovery & Analysis Tool",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn(grotesk.variable, plexMono.variable, "font-sans")}>
      <body>{children}</body>
    </html>
  );
}
