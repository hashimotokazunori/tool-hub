/**
 * 楽天ウェブサービスから、商品の価格・写真・評価・店舗ごとの価格を取ってくる（サーバー側だけで使う）。
 *
 * - 製品検索API（楽天プロダクト／商品価格ナビ）：最安値・平均価格・出品数・評価・スペック・写真
 * - 市場商品検索API：店舗ごとの価格・送料・ポイント・購入リンク
 *
 * 環境変数（Vercel の Environment Variables に設定する。リポジトリには書かない）
 * - RAKUTEN_APPLICATION_ID：アプリID
 * - RAKUTEN_ACCESS_KEY：アクセスキー
 * - RAKUTEN_AFFILIATE_ID：アフィリエイトID（任意。入れると購入リンクがアフィリエイトリンクになる）
 * 設定がないときは何も取りに行かず null を返す（画面には「価格は準備中」と出す。作り物の価格は出さない）。
 */
import { site } from "@/data/site";
import type { Product } from "./types";

/** 接続先。手元で画面を確かめるときだけ RAKUTEN_API_BASE で試験用のサーバーに向けられる */
const API_BASE = process.env.RAKUTEN_API_BASE || "https://openapi.rakuten.co.jp";
const PRODUCT_API = `${API_BASE}/ichibaproduct/api/Product/Search/20250801`;
export const ITEM_API = `${API_BASE}/ichibams/api/IchibaItem/Search/20260701`;
/** 価格を取り直す間隔（秒）。ページは静的に作り、この間隔で裏で作り直す */
export const MARKET_REVALIDATE = 6 * 60 * 60;

export type MarketOffer = {
  shopName: string;
  itemName: string;
  /** 税込の本体価格（円） */
  price: number;
  /** 送料込み（送料無料を含む）なら true */
  postageIncluded: boolean;
  /** ポイント倍率（1なら通常） */
  pointRate: number;
  reviewAverage: number;
  reviewCount: number;
  url: string;
  imageUrl?: string;
};

export type MarketData = {
  /** 取得した日時（ISO 8601） */
  fetchedAt: string;
  minPrice?: number;
  maxPrice?: number;
  averagePrice?: number;
  /** 楽天市場で扱っている店舗（商品）の数 */
  itemCount?: number;
  reviewAverage?: number;
  reviewCount?: number;
  imageUrl?: string;
  /** 楽天の製品ページ（価格の一覧） */
  productUrl?: string;
  /** 楽天の製品ページのスペック */
  specs: { name: string; value: string }[];
  /** 安い順の店舗ごとの価格（型番などが一致したものだけ） */
  offers: MarketOffer[];
};

/** 比べやすいように文字をそろえる：全角→半角、大文字、空白・記号を除く */
export function normalizeName(s: string): string {
  return s
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[\s\-‐－―ー−–—_/／・()（）[\]【】「」『』.,、。]/g, "");
}

/** 商品名が、登録した型番などの条件に合うか。match はどれか1組の語がすべて含まれていれば合格 */
export function matchesProduct(name: string, match: string[][], exclude: string[] = []): boolean {
  const n = normalizeName(name);
  const raw = name.normalize("NFKC");
  if ([...EXCLUDE_ALWAYS, ...exclude].some((w) => raw.includes(w)) || EXCLUDE_PATTERNS.some((r) => r.test(raw))) return false;
  return match.some((group) => group.every((w) => n.includes(normalizeName(w))));
}
/** 中古・互換品・部品・まとめ売りなどは別の商品なので比べない */
const EXCLUDE_ALWAYS = ["中古", "互換", "ジャンク", "訳あり", "レンタル", "部品", "交換用", "替え", "用蓋", "用フタ", "用ふた", "対応製品", "対応機種", "用パッキン", "法人限定", "業務用", "まとめ買い", "ケース販売", "セット販売"];
/** 「×24」「24個セット」「3個組」のような、複数個のまとめ売り */
// 「4L×2」のように単位や英字のすぐ後の × は商品の仕様なので除かない
const EXCLUDE_PATTERNS = [/(?<![0-9A-Za-zＡ-Ｚａ-ｚ])[×✕]\s*\d+/, /\d+\s*(個|点|本|枚|台|箱)\s*(セット|組|入り?|パック)/];

/** 中央値から極端に外れた価格（部品・まとめ売りの取りこぼし）を除く */
export function dropOutliers<T extends { price: number }>(list: T[]): T[] {
  if (list.length < 3) return list;
  const sorted = [...list].map((o) => o.price).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  // 楽天は店によって価格の幅が大きいので、ゆるめに（中央値の3割未満・3倍超だけを除く）
  return list.filter((o) => o.price >= median * 0.3 && o.price <= median * 3);
}

/** 楽天の画像URLを大きいサイズにする（_ex=128x128 → 400x400） */
export function largerImage(url: string | undefined, size = 400): string | undefined {
  if (!url) return undefined;
  const u = url.replace(/^http:/, "https:");
  if (/[?&]_ex=\d+x\d+/.test(u)) return u.replace(/_ex=\d+x\d+/, `_ex=${size}x${size}`);
  return u.includes("thumbnail.image.rakuten.co.jp") ? `${u}${u.includes("?") ? "&" : "?"}_ex=${size}x${size}` : u;
}

/** formatVersion=1・2 のどちらの形でも、検索結果の配列を取り出す */
function listOf(json: unknown, keys: string[], wrapper: string): Record<string, unknown>[] {
  if (!json || typeof json !== "object") return [];
  const o = json as Record<string, unknown>;
  for (const k of keys) {
    const v = o[k];
    if (Array.isArray(v)) return v.map((x) => (x && typeof x === "object" && wrapper in x ? (x as Record<string, unknown>)[wrapper] : x)).filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
  }
  return [];
}
const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined);
const str = (v: unknown) => (typeof v === "string" ? v : undefined);
function firstImage(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length) {
    const x = v[0];
    return typeof x === "string" ? x : str((x as Record<string, unknown>)?.imageUrl);
  }
  return undefined;
}

/** 製品検索APIの結果から、型番が合う最初の製品を読む */
export function parseProductResult(json: unknown, match: string[][], exclude?: string[]): Omit<MarketData, "fetchedAt" | "offers"> | null {
  const list = listOf(json, ["Products", "products"], "Product");
  const p = list.find((x) => matchesProduct(`${str(x.productName) ?? ""} ${str(x.productNo) ?? ""}`, match, exclude));
  if (!p) return null;
  // スペックは [{ name, value }]（formatVersion=2）か [{ detail: { name, value } }] の形
  const rawDetails = p.ProductDetails ?? p.productDetails;
  const specs = (Array.isArray(rawDetails) ? (rawDetails as Record<string, unknown>[]) : [])
    .map((d) => ((d && typeof d === "object" && "detail" in d ? d.detail : d) ?? {}) as Record<string, unknown>)
    .map((d) => ({ name: str(d.name) ?? "", value: str(d.value) ?? "" }))
    .filter((d) => d.name && d.value);
  return {
    minPrice: num(p.usedExcludeMinPrice) ?? num(p.minPrice),
    maxPrice: num(p.usedExcludeMaxPrice) ?? num(p.maxPrice),
    averagePrice: num(p.averagePrice),
    itemCount: num(p.usedExcludeCount) ?? num(p.itemCount),
    reviewAverage: num(p.reviewAverage),
    reviewCount: num(p.reviewCount),
    imageUrl: largerImage(str(p.mediumImageUrl) ?? str(p.smallImageUrl)),
    productUrl: str(p.affiliateUrl) || str(p.productUrlPC),
    specs,
  };
}

/** 市場商品検索APIの結果から、型番が合う商品を安い順に（同じ店は1件だけ） */
export function parseItemResult(json: unknown, match: string[][], exclude?: string[], limit = 10): MarketOffer[] {
  const seen = new Set<string>();
  const offers = listOf(json, ["Items", "items"], "Item")
    .map((x) => ({
      shopName: str(x.shopName) ?? "",
      itemName: str(x.itemName) ?? "",
      price: num(x.itemPrice) ?? 0,
      // 出力の postageFlag は 0 が「送料込み」、1 が「送料別」
      postageIncluded: num(x.postageFlag) === 0,
      pointRate: num(x.pointRate) ?? 1,
      reviewAverage: num(x.reviewAverage) ?? 0,
      reviewCount: num(x.reviewCount) ?? 0,
      url: str(x.affiliateUrl) || str(x.itemUrl) || "",
      imageUrl: largerImage(firstImage(x.mediumImageUrls)),
      available: num(x.availability) !== 0,
    }))
    .filter((o) => o.available && o.price > 0 && o.url.startsWith("https://") && o.shopName && matchesProduct(o.itemName, match, exclude));
  return dropOutliers(offers)
    .sort((a, b) => a.price - b.price)
    .filter((o) => (seen.has(o.shopName) ? false : (seen.add(o.shopName), true)))
    .slice(0, limit)
    .map((o) => ({ shopName: o.shopName, itemName: o.itemName, price: o.price, postageIncluded: o.postageIncluded, pointRate: o.pointRate, reviewAverage: o.reviewAverage, reviewCount: o.reviewCount, url: o.url, imageUrl: o.imageUrl }));
}

function credentials() {
  // 貼り付けたときに入りがちな前後の空白・改行を除く
  const applicationId = process.env.RAKUTEN_APPLICATION_ID?.trim();
  const accessKey = process.env.RAKUTEN_ACCESS_KEY?.trim();
  if (!applicationId || !accessKey) return null;
  return { applicationId, accessKey, affiliateId: process.env.RAKUTEN_AFFILIATE_ID?.trim() || undefined };
}
export const marketEnabled = () => credentials() !== null;

/** 楽天APIは短い間隔で同じ呼び出しを続けると止められるので、1件ずつ間をあけて呼ぶ */
let queue: Promise<unknown> = Promise.resolve();
function throttled<T>(fn: () => Promise<T>): Promise<T> {
  // アプリの登録は「1秒に1回」なので、1.1秒ずつあける
  const run = queue.then(() => new Promise((r) => setTimeout(r, 1100))).then(fn);
  queue = run.catch(() => undefined);
  return run;
}

export async function call(base: string, params: Record<string, string>): Promise<unknown | null> {
  const c = credentials();
  if (!c) return null;
  // アクセスキーはヘッダーとURLの両方で送る（説明ではどちらでもよいが、URLで送る例が多いため）。ログにはURLを残さない
  const q = new URLSearchParams({ format: "json", formatVersion: "2", applicationId: c.applicationId, accessKey: c.accessKey, ...(c.affiliateId ? { affiliateId: c.affiliateId } : {}), ...params });
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await throttled(() =>
      fetch(`${base}?${q}`, {
        headers: { accessKey: c.accessKey, Referer: `${site.url}/`, Origin: site.url },
        next: { revalidate: MARKET_REVALIDATE },
      }),
    );
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) {
      // 原因を調べられるよう、楽天からのエラー内容（鍵は含まれない）と、送った Origin を残す
      const body = (await res.text().catch(() => "")).slice(0, 300);
      // 設定の取り違えを見つけるため、アプリIDの先頭8文字とアクセスキーの文字数だけを残す（鍵そのものは残さない）
      const shape = `appId=${c.applicationId.slice(0, 8)}…(${c.applicationId.length}文字) accessKey=${c.accessKey.length}文字(アプリIDと${c.accessKey === c.applicationId ? "同じ" : "違う"}) affiliateId=${c.affiliateId ? `${c.affiliateId.slice(0, 8)}…` : "なし"}`;
      console.warn(`楽天APIの呼び出しに失敗しました（${res.status}）`, base, `Origin=${site.url}`, shape, body);
      return null;
    }
    return res.json();
  }
  return null;
}

/** ビルド中は同じ商品を何度も問い合わせないよう、1商品1回だけ取る */
const marketCache = new Map<string, Promise<MarketData | null>>();

/** 商品の価格情報。取れなかったときは null（画面は「価格は準備中」になる） */
export function getMarketData(p: Product): Promise<MarketData | null> {
  if (!p.market || !credentials()) return Promise.resolve(null);
  let d = marketCache.get(p.id);
  if (!d) {
    d = fetchMarketData(p);
    marketCache.set(p.id, d);
  }
  return d;
}

async function fetchMarketData(p: Product): Promise<MarketData | null> {
  if (!p.market || !credentials()) return null;
  const { keyword, match, exclude, minPrice } = p.market;
  try {
    const [productJson, itemJson] = await Promise.all([
      call(PRODUCT_API, { keyword, hits: "5" }),
      // 安い順で取ると消耗品や部品が上位30件を埋めることがあるので、関連度順で取ってからこちらで並べ替える
      call(ITEM_API, { keyword, hits: "30", availability: "1", imageFlag: "1", ...(minPrice ? { minPrice: String(minPrice) } : {}) }),
    ]);
    const product = productJson ? parseProductResult(productJson, match, exclude) : null;
    const offers = itemJson ? parseItemResult(itemJson, match, exclude) : [];
    if (!product && offers.length === 0) return null;
    const prices = offers.map((o) => o.price);
    return {
      fetchedAt: new Date().toISOString(),
      ...product,
      specs: product?.specs ?? [],
      minPrice: product?.minPrice ?? (prices.length ? Math.min(...prices) : undefined),
      maxPrice: product?.maxPrice ?? (prices.length ? Math.max(...prices) : undefined),
      imageUrl: product?.imageUrl ?? offers.find((o) => o.imageUrl)?.imageUrl,
      offers,
    };
  } catch (e) {
    console.warn("楽天APIから価格を取得できませんでした", p.slug, e);
    return null;
  }
}

/** 一覧ページ用：複数の商品をまとめて（1件ずつ順番に）取る */
export async function getMarketDataMap(products: Product[]): Promise<Map<string, MarketData>> {
  const map = new Map<string, MarketData>();
  for (const p of products) {
    const d = await getMarketData(p);
    if (d) map.set(p.id, d);
  }
  return map;
}

/** 商品の画像があるか（楽天の画像か、商品データの画像） */
export const hasImage = (p: Product, m?: MarketData | null) => Boolean(m?.imageUrl ?? p.imageUrl);

/**
 * 一覧に載せる商品：画像のないものは載せない。
 * 楽天のデータを使えないとき（ローカルのビルドなど）は画像を確かめられないので、絞らずに返す。
 */
export async function withImages(products: Product[]): Promise<{ products: Product[]; market: Map<string, MarketData> }> {
  const market = await getMarketDataMap(products);
  if (!marketEnabled()) return { products, market };
  return { products: products.filter((p) => hasImage(p, market.get(p.id))), market };
}
