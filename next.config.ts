import type { NextConfig } from "next";

// 全ページを静的に生成するサイトなので cacheComponents は使わない。
// （cacheComponents では公開0件の動的ルートがビルドエラーになり、
//   dynamicParams = false による 404 も使えないため）
const nextConfig: NextConfig = {
  trailingSlash: true,
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
