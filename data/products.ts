import type { Product } from "@/lib/types";

/**
 * 商品データ。1商品につき1件。複数の記事から productIds で参照する。
 *
 * 登録のルール（docs/DESIGN.md「公開できる条件」も参照）
 * - 実在を確認した商品だけを登録する。仕様は sourceUrls に出典を残す。
 * - price を入れるときは priceCheckedAt（確認日時）も入れる。
 * - affiliateUrl は、実際に提携登録した販売先のURLだけを入れる。
 * - imageUrl は使用条件を確認した画像だけ。条件は imageLicenseNote に書く。
 * - AIで下書きした内容は reviewStatus: "pending" のまま。人が確認したら "verified"。
 *
 * まだ商品は登録していない（例のための架空の商品も入れない）。
 */
export const products: Product[] = [];
