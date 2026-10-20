/** /furusato/ の寄附額の絞り込み（ブラウザでもサーバーでも使う、副作用のない関数だけ） */

export type PriceBand = { id: string; label: string; /** この額より大きい */ above: number; /** この額以下（上限なしは Infinity） */ upTo: number };

export const PRICE_BANDS: PriceBand[] = [
  { id: "u10k", label: "〜1万円", above: 0, upTo: 10_000 },
  { id: "10-20k", label: "1〜2万円", above: 10_000, upTo: 20_000 },
  { id: "o20k", label: "2万円〜", above: 20_000, upTo: Infinity },
];

/** いま選んでいる絞り込み。max は控除上限の計算ツールから来たときの「◯円以内」 */
export type PriceFilter = { kind: "all" } | { kind: "band"; id: string } | { kind: "max"; value: number };

/** 寄附額として受け付ける範囲（これを外れた ?max= は無視する） */
const MAX_MIN = 1_000;
const MAX_MAX = 100_000_000;

/** URLの ?max=<円> を読む。数字（カンマ可）だけを受け付け、範囲外や不正な値は null */
export function parseMaxParam(search: string): number | null {
  const raw = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("max");
  if (raw === null) return null;
  const s = raw.normalize("NFKC").replace(/[,，円\s]/g, "");
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n >= MAX_MIN && n <= MAX_MAX ? n : null;
}

/** 寄附額がその絞り込みに合うか */
export function matchesPrice(price: number, f: PriceFilter): boolean {
  if (f.kind === "all") return true;
  if (f.kind === "max") return price <= f.value;
  const b = PRICE_BANDS.find((x) => x.id === f.id);
  return b ? price > b.above && price <= b.upTo : true;
}

export function filterByPrice<T extends { price: number }>(items: T[], f: PriceFilter): T[] {
  return items.filter((x) => matchesPrice(x.price, f));
}
