import type { NextConfig } from "next";

// 全ページを静的に生成するサイトなので cacheComponents は使わない。
// （cacheComponents では公開0件の動的ルートがビルドエラーになり、
//   dynamicParams = false による 404 も使えないため）
// STATIC_EXPORT=1 のときは全ページを out/ に書き出す（Cloudflare に置く用）
const nextConfig: NextConfig = {
  ...(process.env.STATIC_EXPORT === "1" ? { output: "export" as const } : {}),
  trailingSlash: true,
  // Vercel では中身を出さず、すべて Cloudflare の本番URL（toolhiroba.com）へ移す（301）。検索の評価も引き継ぐ
  ...(process.env.VERCEL === "1"
    ? {
        async redirects() {
          return [{ source: "/:path*", destination: "https://toolhiroba.com/:path*", permanent: true }];
        },
      }
    : {}),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
