import type { Metadata, Viewport } from "next";
import { Archivo, Kalam } from "next/font/google";
import { cookies } from "next/headers";
import { Header } from "@/components/header/header";
import { ThemedToaster } from "@/components/theme/themed-toaster";
import { RevealObserver } from "@/components/motion/reveal-observer";
import { parseThemePref, THEME_COOKIE } from "@/lib/theme";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const kalam = Kalam({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-kalam",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Stoop — buy and sell with your neighbors",
    template: "%s · Stoop",
  },
  description:
    "A local marketplace for secondhand finds. Browse what's for sale near you, message sellers in real time, and pick up down the block.",
  openGraph: { siteName: "Stoop", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#101216" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = parseThemePref((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html lang="en" data-theme={theme} className={`${archivo.variable} ${kalam.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-on-ink"
        >
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <ThemedToaster />
        <RevealObserver />
      </body>
    </html>
  );
}
