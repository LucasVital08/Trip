import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { BRAND } from "@/config/brand";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name}. — Viagens compartilhadas por todo o Brasil`,
    template: `%s · ${BRAND.name}.`,
  },
  description: BRAND.description,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${dmSans.variable} ${fraunces.variable} min-h-dvh antialiased`}>
        {children}
      </body>
    </html>
  );
}
