import type { Product } from "@/lib/types";
import raw from "./products.json";

/**
 * 商品データ。1商品につき1件。複数の記事から productIds で参照する。
 * 中身は data/products.json（管理画面 /admin/ からも編集できる。public/admin/config.yml）。
 *
 * 登録のルール（docs/DESIGN.md「公開できる条件」も参照）
 * - 実在を確認した商品だけを登録する。仕様は sourceUrls に出典を残す。
 * - price を入れるときは priceCheckedAt（確認日時）も入れる。
 * - affiliateUrl は、実際に提携登録した販売先のURLだけを入れる。
 * - imageUrl は使用条件を確認した画像だけ。条件は imageLicenseNote に書く。
 * - 下書きは reviewStatus: "pending"。公式ページで事実確認したら reviewedAt・reviewedBy を入れて "verified"。
 *
 * 2026-10-19・2026-10-20・2026-10-21 にメーカー公式ページで仕様・販売状況を確認し、公開している（確認：AI（Claude））。
 * 調査の記録は docs/review/product-candidates.md と docs/review/final-check.md にある。
 *
 * JSON の market.match は「語 + 語」の文字列（管理画面で入力しやすくするため）。ここで語の組（string[][]）に戻す。
 */
// JSON は管理画面から書き換わるので、形のチェックは lib/validation.ts（テスト）で行う
type RawProduct = Omit<Product, "market"> & { market?: Omit<NonNullable<Product["market"]>, "match"> & { match: string[] } };

export const parseMatchGroup = (s: string) => s.split(/\s+\+\s+/).map((w) => w.trim()).filter(Boolean);

export const products: Product[] = ((raw as unknown as { items: RawProduct[] }).items).map((p) => ({
  ...p,
  market: p.market ? { ...p.market, match: p.market.match.map(parseMatchGroup).filter((g) => g.length > 0) } : undefined,
}));
