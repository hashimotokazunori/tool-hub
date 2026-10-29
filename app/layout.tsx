import { CommandPalette } from "@/components/CommandPalette";
import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { NavLinks } from "@/components/NavLinks";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ServiceWorker } from "@/components/ServiceWorker";
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
  // iPhone の「ホーム画面に追加」用（Android などは app/manifest.ts）
  appleWebApp: { capable: true, title: site.name, statusBarStyle: "default" },
  icons: { apple: "/apple-touch-icon.png" },
  // Google Search Console の所有権確認
  // Search Console の所有権の確認（Vercel の URL 用・workers.dev 用・toolhiroba.com 用）
  verification: { google: ["dmfHrw8nkN4c9Zjad-isZ4BnPD-d7Mn47HT1nr9mpz8", "euVRaQrtYufc_Pr6EKtRM5W3x3nHnPXpBQ6ZEDgfgNM", "zp0yn1BtCnKHXZFO7p6FKpLp8t2NH640edKOClzeeec"], other: { "msvalidate.01": "A2CB0C28D230878F409EEF1D1E83D7C1" } },
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
      <head>
        {/* Google AdSense（審査と自動広告用）。広告の表示位置は AdSense の管理画面で決める */}
        {site.adsenseClient && <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${site.adsenseClient}`} crossOrigin="anonymous" />}
      </head>
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
        {/* 運営者の端末（/nocount.html で設定）は数えない。それ以外は今までどおり Cloudflare の計測を読み込む */}
        {site.cloudflareBeacon ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{if(localStorage.getItem("no_count")==="1")return}catch(e){}var s=document.createElement("script");s.defer=true;s.src="https://static.cloudflareinsights.com/beacon.min.js";s.setAttribute("data-cf-beacon",${JSON.stringify(JSON.stringify({ token: site.cloudflareBeacon }))});document.body.appendChild(s)})();`,
            }}
          />
        ) : (
          <Analytics />
        )}
        {/* Google アナリティクス。運営者の端末（/nocount.html で設定）は数えない */}
        {site.ga4Id && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{if(localStorage.getItem("no_count")==="1")return}catch(e){}var id=${JSON.stringify(site.ga4Id)};var s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id="+id;document.head.appendChild(s);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag("js",new Date());gtag("config",id)})();`,
            }}
          />
        )}
        {/* Ctrl+K か「/」でツールを呼び出す窓 */}
        <CommandPalette />
        <ServiceWorker />
        <InstallPrompt />
      </body>
    </html>
  );
}
