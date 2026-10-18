import type { Metadata, Viewport } from "next";
import { Zen_Kaku_Gothic_New } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { site } from "@/data/site";
import "./globals.css";

const zen = Zen_Kaku_Gothic_New({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-zen", display: "swap" });

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
    { media: "(prefers-color-scheme: light)", color: "#edf5f2" },
    { media: "(prefers-color-scheme: dark)", color: "#121816" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${zen.variable} antialiased`}>
      <body className="min-h-dvh">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 pt-5 pb-28 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] md:pb-10">
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
