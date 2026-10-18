import type { MetadataRoute } from "next";
import { goodsCategories, toolCategories } from "@/data/categories";
import { getBuyingGuides, getProductsByCategory, getPublicArticles, getPublicProducts, getPublicTools, getToolsByCategory, isArticlePublic, isProductPublic } from "@/lib/content";
import { site } from "@/data/site";
import { absoluteUrl } from "@/lib/seo";

/** 公開済みのページだけを載せる（下書き・中身のないカテゴリは載せない） */
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, lastModified?: string): MetadataRoute.Sitemap[number] => ({ url: absoluteUrl(path), ...(lastModified ? { lastModified } : {}) });
  return [
    page("/"),
    page("/tools/"),
    page("/goods/"),
    page("/guides/"),
    page("/solutions/"),
    page("/about/"),
    page("/disclosure/"),
    page("/privacy/"),
    ...(site.operator.contact ? [page("/contact/")] : []),
    ...toolCategories.filter((c) => getToolsByCategory(c.id).length > 0).map((c) => page(`/tools/category/${c.slug}/`)),
    ...getPublicTools().map((t) => page(`/tools/${t.slug}/`, t.updatedAt)),
    ...goodsCategories.filter((c) => getProductsByCategory(c.id).length > 0 || getBuyingGuides(c.id).length > 0).map((c) => page(`/goods/category/${c.slug}/`)),
    ...getPublicProducts().filter(isProductPublic).map((p) => page(`/goods/items/${p.slug}/`, p.updatedAt)),
    ...getPublicArticles().filter(isArticlePublic).map((a) => page(`/${a.type === "guide" ? "guides" : "solutions"}/${a.slug}/`, a.reviewedAt)),
  ];
}
