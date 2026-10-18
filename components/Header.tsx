import Link from "next/link";
import { site } from "@/data/site";
import { getGoodsCategory, getPublicArticles, getPublicProducts, getPublicTools, getToolCategory } from "@/lib/content";
import { makeItem, type SearchItem } from "@/lib/search";
import { GlobalSearch } from "./GlobalSearch";
import { NavLinks } from "./NavLinks";

/** 検索の索引（公開済みのものだけ） */
function searchIndex(): SearchItem[] {
  return [
    ...getPublicTools().map((t) => makeItem("ツール", t.name, t.summary, `/tools/${t.slug}/`, [...t.keywords, getToolCategory(t.categoryId)?.name ?? ""])),
    ...getPublicProducts().map((p) => makeItem("グッズ", p.name, p.summary, `/goods/items/${p.slug}/`, [p.brand ?? "", getGoodsCategory(p.categoryId)?.name ?? ""])),
    ...getPublicArticles().map((a) => makeItem(a.type === "guide" ? "ガイド" : "悩み別", a.title, a.description, `/${a.type === "guide" ? "guides" : "solutions"}/${a.slug}/`)),
  ];
}

export function Header() {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex items-baseline gap-3 text-ink no-underline">
          <span className="font-display text-2xl">{site.name}</span>
          <span className="hidden text-xs text-muted sm:inline">{site.tagline}</span>
        </Link>
        <NavLinks />
      </div>
      <GlobalSearch items={searchIndex()} />
    </header>
  );
}
