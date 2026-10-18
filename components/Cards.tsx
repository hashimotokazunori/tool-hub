import Link from "next/link";
import { priceLabel, productLink } from "@/lib/affiliate";
import type { Article, Product, Tool } from "@/lib/types";
import { ui } from "./styles";

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link href={`/tools/${tool.slug}/`} className={ui.card}>
      <b className="text-[15px]">{tool.name}</b>
      <span className="text-xs text-muted">{tool.summary}</span>
    </Link>
  );
}

export function ArticleCard({ article }: { article: Article }) {
  const base = article.type === "guide" ? "guides" : "solutions";
  return (
    <Link href={`/${base}/${article.slug}/`} className={ui.card}>
      <b className="text-[15px]">{article.title}</b>
      <span className="text-xs text-muted">{article.description}</span>
      {article.status !== "published" && <span className="mt-1 w-fit rounded bg-warn px-1.5 text-[11px] font-bold text-white">下書き（非公開）</span>}
    </Link>
  );
}

/** 商品カード。PR表記と価格の確認日を必ず出す */
export function ProductCard({ product }: { product: Product }) {
  const link = productLink(product);
  const price = priceLabel(product);
  return (
    <article className={`${ui.panel} relative flex flex-col gap-2 p-4`}>
      {link?.sponsored && <span className="absolute top-3 right-3 rounded border border-muted px-1.5 text-[11px] font-bold text-muted">PR</span>}
      <Link href={`/goods/items/${product.slug}/`} className="pr-10 font-bold text-ink">
        {product.name}
      </Link>
      {product.brand && <span className="text-xs text-muted">{product.brand}</span>}
      <p className="text-sm">{product.summary}</p>
      {price && <p className="text-sm font-semibold">{price}</p>}
      {link && (
        <a href={link.href} rel={link.rel} target="_blank" className={ui.buttonPrimary}>
          {link.label}
        </a>
      )}
    </article>
  );
}
