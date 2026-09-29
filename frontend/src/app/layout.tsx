import "./globals.css";
import type { ReactNode } from "react";
import { AppProviders } from "@/components/providers/AppProviders";

export const metadata = {
  title: "ECDAT",
  description: "Enterprise Cryptographic Discovery & Analysis Tool",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="font-sans antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="app-canvas">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
