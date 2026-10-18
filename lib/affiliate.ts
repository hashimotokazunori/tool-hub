import type { Product } from "@/lib/types";

/** 購入・詳細リンク。提携リンクには rel="sponsored" を付ける */
export function productLink(p: Product): { href: string; rel: string; label: string; sponsored: boolean } | null {
  if (p.affiliateUrl) return { href: p.affiliateUrl, rel: "sponsored noopener noreferrer", label: p.merchantName ? `${p.merchantName}で見る` : "販売ページを見る", sponsored: true };
  if (p.officialUrl) return { href: p.officialUrl, rel: "noopener noreferrer", label: "公式サイトを見る", sponsored: false };
  return null;
}

/** 価格の表示。確認日を必ず添える */
export function priceLabel(p: Product): string | null {
  if (p.price === undefined || !p.priceCheckedAt) return null;
  const d = new Date(p.priceCheckedAt);
  return `${p.price.toLocaleString("ja-JP")}円（税込・${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日時点）`;
}
