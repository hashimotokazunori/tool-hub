import { getGoodsCategory, getPublicArticles, getPublicProducts, getPublicTools, getToolCategory } from "@/lib/content";
import { makeItem, type SearchItem } from "@/lib/search";

/** サイト内検索の索引（公開済みのものだけ）。ビルド時に作り、検索窓にpropsで渡す */
export function buildSearchIndex(): SearchItem[] {
  return [
    ...getPublicTools().map((t) => makeItem("ツール", t.name, t.summary, `/tools/${t.slug}/`, [...t.keywords, getToolCategory(t.categoryId)?.name ?? ""])),
    ...getPublicProducts().map((p) => makeItem("グッズ", p.name, p.summary, `/goods/items/${p.slug}/`, [p.brand ?? "", getGoodsCategory(p.categoryId)?.name ?? ""])),
    ...getPublicArticles().map((a) => makeItem(a.type === "guide" ? "ガイド" : "悩み別", a.title, a.description, `/${a.type === "guide" ? "guides" : "solutions"}/${a.slug}/`)),
  ];
}
