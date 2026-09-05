import "./globals.css";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import { cn } from "@/lib/utils";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-newsreader",
  adjustFontFallback: false,
});

export const metadata = {
  title: "ECDAT — Cryptographic Discovery",
  description: "Enterprise Cryptographic Discovery & Analysis Tool",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={cn(plexSans.variable, plexMono.variable, newsreader.variable, "font-sans")}
    >
      <body>
        <div className="app-strip">
          <span>ECDAT // cryptographic discovery ledger</span>
          <span>Official use · briefing copy</span>
        </div>
        {children}
      </body>
    </html>
  );
}
