import "./globals.css";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "ECDAT",
  description: "Enterprise Cryptographic Discovery & Analysis Tool",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn(inter.variable, "font-sans")}>
      <body>{children}</body>
    </html>
  );
}
