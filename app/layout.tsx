import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { NavLinks } from "@/components/NavLinks";
import { site } from "@/data/site";
import "./globals.css";

// 英数字は Inter、日本語は Noto Sans JP（どちらも可変ウェイト）
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const noto = Noto_Sans_JP({ subsets: ["latin"], variable: "--font-noto", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { template: `%s | ${site.name}`, default: `${site.name}｜無料Webツールと便利グッズの選び方` },
  description: site.description,
  openGraph: { siteName: site.name, locale: site.locale, type: "website" },
  // Google Search Console の所有権確認
  verification: { google: "dmfHrw8nkN4c9Zjad-isZ4BnPD-d7Mn47HT1nr9mpz8" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0c13" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${inter.variable} ${noto.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-panel focus:px-3 focus:py-2">
          本文へ移動
        </a>
        <Header />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 pt-6 pr-[max(1rem,env(safe-area-inset-right))] pb-10 pl-[max(1rem,env(safe-area-inset-left))] sm:pt-8">
          {children}
        </main>
        <Footer />
        <NavLinks variant="bar" />
        <Analytics />
      </body>
    </html>
  );
}
