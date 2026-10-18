import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // 本番（URL を設定済み、または Vercel の本番環境）だけ検索エンジンに登録させる。プレビューや手元では止める
  const production = (Boolean(process.env.NEXT_PUBLIC_SITE_URL) || process.env.VERCEL_ENV === "production") && process.env.SHOW_DRAFTS !== "1";
  return production ? { rules: { userAgent: "*", allow: "/" }, sitemap: absoluteUrl("/sitemap.xml") } : { rules: { userAgent: "*", disallow: "/" } };
}
