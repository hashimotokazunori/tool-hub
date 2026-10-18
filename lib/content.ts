import { articles } from "@/data/articles";
import { buyingGuides } from "@/data/buying-guides";
import { goodsCategories, toolCategories } from "@/data/categories";
import { products } from "@/data/products";
import { tools } from "@/data/tools";
import { hasToolComponent } from "@/features/tools/keys";
import type { Article, ArticleType, BuyingGuide, Category, Product, Tool } from "@/lib/types";

/** 開発中に下書きも表示する（SHOW_DRAFTS=1）。本番では設定しない */
export const showDrafts = process.env.SHOW_DRAFTS === "1";

export const isToolPublic = (t: Tool) => t.status === "published" && t.componentKey !== null && hasToolComponent(t.componentKey);

export const isProductPublic = (p: Product) =>
  p.status === "published" && p.reviewStatus === "verified" && p.sourceUrls.length > 0 && Boolean(p.affiliateUrl || p.officialUrl) && (p.price === undefined || Boolean(p.priceCheckedAt));

export const isArticlePublic = (a: Article) => a.status === "published" && a.reviewStatus === "verified" && Boolean(a.reviewedAt);

export const isBuyingGuidePublic = (g: BuyingGuide) => g.status === "published" && g.reviewStatus === "verified";

const visible = <T>(list: T[], isPublic: (x: T) => boolean) => list.filter((x) => isPublic(x) || showDrafts);

// ツール（下書きのツールは画面がないので、SHOW_DRAFTS でも一覧には出さない）
export const getPublicTools = () => tools.filter(isToolPublic);
export const getToolBySlug = (slug: string) => getPublicTools().find((t) => t.slug === slug);
export const getToolsByCategory = (categoryId: string) => getPublicTools().filter((t) => t.categoryId === categoryId);
export const getToolCategory = (id: string) => toolCategories.find((c) => c.id === id);
export const getToolCategoryBySlug = (slug: string) => toolCategories.find((c) => c.slug === slug);

// 便利グッズ
export const getPublicProducts = () => visible(products, isProductPublic);
export const getProductBySlug = (slug: string) => getPublicProducts().find((p) => p.slug === slug);
export const getGoodsCategory = (id: string) => goodsCategories.find((c) => c.id === id);
export const getGoodsCategoryBySlug = (slug: string) => goodsCategories.find((c) => c.slug === slug);
export const getBuyingGuides = (categoryId: string) => visible(buyingGuides, isBuyingGuidePublic).filter((g) => g.categoryId === categoryId);
export const getProductsByCategory = (categoryId: string) => getPublicProducts().filter((p) => p.categoryId === categoryId);

// 記事
export const getPublicArticles = (type?: ArticleType) => visible(articles, isArticlePublic).filter((a) => !type || a.type === type);
export const getArticleBySlug = (type: ArticleType, slug: string) => getPublicArticles(type).find((a) => a.slug === slug);

/** ツール・グッズのカテゴリを並び順どおりに */
export const sortCategories = (list: Category[]) => [...list].sort((a, b) => a.order - b.order);

/** 記事やツールから関連するものを集める（公開済みのものだけ） */
export function getRelatedForTool(tool: Tool) {
  const relatedArticles = getPublicArticles().filter((a) => a.toolSlugs.includes(tool.slug));
  const sameCategory = getToolsByCategory(tool.categoryId).filter((t) => t.slug !== tool.slug);
  return { articles: relatedArticles, tools: sameCategory };
}
