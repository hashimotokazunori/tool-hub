import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // 本番のURLが決まるまでは検索エンジンに登録させない
  const production = Boolean(process.env.NEXT_PUBLIC_SITE_URL) && process.env.SHOW_DRAFTS !== "1";
  return production ? { rules: { userAgent: "*", allow: "/" }, sitemap: absoluteUrl("/sitemap.xml") } : { rules: { userAgent: "*", disallow: "/" } };
}
