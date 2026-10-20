/**
 * /furusato/ の返礼品を、ビルドのときに楽天ウェブサービスの市場商品検索API（IchibaItem/Search）から取る（サーバー側だけで使う）。
 *
 * 楽天ふるさと納税の返礼品だけに絞る方法（2026-10-20 に確認）
 * - 楽天市場の商品検索APIには「ふるさと納税だけ」を指定するパラメータはなく、ふるさと納税専用のジャンルIDもない
 *   （https://webservice.rakuten.co.jp/documentation/ichiba-item-search の入力パラメータ一覧・
 *    ジャンル検索APIで genreId=0 の子ジャンルを確認）。
 * - 楽天ふるさと納税の返礼品は、自治体が楽天市場に出している店舗の商品。公式トップページ
 *   （https://event.rakuten.co.jp/furusato/）の自治体へのリンクはすべて
 *   「https://www.rakuten.co.jp/f{6桁の全国地方公共団体コード}-{自治体名のローマ字}/」の形
 *   （例：f016918-betsukai 北海道別海町、f452025-miyakonojo 宮崎県都城市）。
 *   この URL の店舗部分が API の shopCode（「ショップURLの xyz の部分」）にあたる。
 * - そこで、キーワード「ふるさと納税」＋カテゴリのジャンルID（公式トップページのカテゴリ検索リンクと同じ値）で検索し、
 *   結果のうち shopCode が「f＋6桁の数字＋ハイフン＋英小文字」の店舗の商品だけを残す。
 *   キーワードに一致しただけの一般の店舗の商品（ふるさと納税の解説本など）はここで落ちる。
 */
import { FURUSATO_CATEGORIES, type FurusatoCategory } from "@/data/furusato-categories";
import { ITEM_API, call, largerImage, marketEnabled } from "./rakuten";

export type FurusatoItem = {
  /** 楽天の itemCode（店舗:商品） */
  id: string;
  /** 返礼品の名前（先頭の【ふるさと納税】は除く） */
  name: string;
  /** 寄附額（円）。API の itemPrice */
  price: number;
  /** 自治体の店舗名（例：宮崎県都城市） */
  municipality: string;
  shopCode: string;
  imageUrl: string;
  /** 楽天ふるさと納税の商品ページ（アフィリエイトIDがあればアフィリエイトURL） */
  url: string;
  reviewAverage: number;
  reviewCount: number;
};

export type FurusatoItemsByCategory = Record<FurusatoCategory["id"], FurusatoItem[]>;

/** 自治体の店舗の shopCode：f＋全国地方公共団体コード（6桁）＋ハイフン＋ローマ字 */
export const MUNICIPALITY_SHOP = /^f\d{6}-[a-z0-9-]+$/;

/** 1カテゴリで残す件数の上限（画面にはまず8件を出し、残りは「もっと見る」と寄附額の絞り込みで使う） */
export const ITEMS_PER_CATEGORY = 24;

/** 2025年10月1日からポイント付与を伴う募集は禁止。ポイント・還元をうたう商品名は載せない */
const NG_WORDS = ["ポイント", "還元"];

const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined);
const str = (v: unknown) => (typeof v === "string" ? v : undefined);

/** 商品名の先頭の【ふるさと納税】と余分な空白を除く */
export function cleanItemName(name: string): string {
  const cleaned = name
    // お店が付けた飾り（【最強翌日配送】・＼総合1位／・★…★・≪…≫ など）は商品名ではないので外す
    .replace(/【[^】]*】/g, " ")
    .replace(/[＼\\][^／/]*[／/]/g, " ")
    .replace(/[★☆◆◇■□●◎♪]+[^★☆◆◇■□●◎♪]{0,30}[★☆◆◇■□●◎♪]+/g, " ")
    .replace(/[≪《〈][^≫》〉]*[≫》〉]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // 飾りを外して空になったら、元の名前（【ふるさと納税】だけ外したもの）を使う
  return cleaned || name.replace(/^\s*【ふるさと納税】\s*/, "").replace(/\s+/g, " ").trim();
}

/**
 * 市場商品検索API（formatVersion=2。1 の形でも読める）の結果から、自治体の店舗の返礼品だけを取り出す。
 * 同じ自治体の商品は1件だけにして、いろいろな自治体の返礼品が並ぶようにする。並び順は API の順のまま。
 */
export function parseFurusatoItems(json: unknown, limit = ITEMS_PER_CATEGORY): FurusatoItem[] {
  if (!json || typeof json !== "object") return [];
  const o = json as Record<string, unknown>;
  const raw = (Array.isArray(o.Items) ? o.Items : Array.isArray(o.items) ? o.items : []) as unknown[];
  const seenShops = new Set<string>();
  const out: FurusatoItem[] = [];
  for (const r of raw) {
    const x = (r && typeof r === "object" && "Item" in r ? (r as { Item: unknown }).Item : r) as Record<string, unknown> | null;
    if (!x || typeof x !== "object") continue;
    const shopCode = str(x.shopCode) ?? "";
    const price = num(x.itemPrice) ?? 0;
    const url = str(x.affiliateUrl) || str(x.itemUrl) || "";
    const images = Array.isArray(x.mediumImageUrls) ? x.mediumImageUrls : [];
    const firstImage = images.length ? (typeof images[0] === "string" ? images[0] : str((images[0] as Record<string, unknown>)?.imageUrl)) : undefined;
    const imageUrl = largerImage(firstImage, 400);
    const name = cleanItemName(str(x.itemName) ?? "");
    if (!MUNICIPALITY_SHOP.test(shopCode)) continue;
    if (num(x.availability) === 0 || price <= 0 || !url.startsWith("https://") || !imageUrl || !name) continue;
    if (NG_WORDS.some((w) => name.includes(w))) continue;
    if (seenShops.has(shopCode)) continue;
    seenShops.add(shopCode);
    out.push({
      id: str(x.itemCode) ?? `${shopCode}:${out.length}`,
      name,
      price,
      municipality: str(x.shopName) ?? "",
      shopCode,
      imageUrl,
      url,
      reviewAverage: num(x.reviewAverage) ?? 0,
      reviewCount: num(x.reviewCount) ?? 0,
    });
    if (out.length >= limit) break;
  }
  return out;
}

/** 市場商品検索APIに渡す条件。レビューの多い順（よく選ばれている返礼品）で30件 */
export function searchParamsFor(c: FurusatoCategory): Record<string, string> {
  return { keyword: "ふるさと納税", ...(c.genreId ? { genreId: c.genreId } : {}), sort: "-reviewCount", hits: "30", availability: "1", imageFlag: "1" };
}

/**
 * すべてのカテゴリの返礼品。楽天APIの鍵がない・全部取れなかったときは null（画面は案内だけを出す。作り物は出さない）。
 * lib/rakuten の call は1秒に1回に間引くので、6カテゴリで7秒ほどかかる。
 */
export async function getFurusatoItems(): Promise<FurusatoItemsByCategory | null> {
  if (!marketEnabled()) return null;
  const result = {} as FurusatoItemsByCategory;
  let total = 0;
  for (const c of FURUSATO_CATEGORIES) {
    // ビルドでは便利グッズのページも同時に楽天APIを呼ぶので、混み合って取れないことがある。少し待って1回だけやり直す
    for (let attempt = 0; attempt < 2 && !result[c.id]?.length; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 5000 * attempt));
      try {
        const json = await call(ITEM_API, searchParamsFor(c));
        result[c.id] = json ? parseFurusatoItems(json) : [];
      } catch (e) {
        console.warn("楽天APIから返礼品を取得できませんでした", c.id, e);
        result[c.id] = [];
      }
    }
    if (!result[c.id].length) console.warn("楽天ふるさと納税の返礼品が0件でした", c.id);
    total += result[c.id].length;
  }
  return total > 0 ? result : null;
}
