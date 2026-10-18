/** 割引・割合・比率・平均・四捨五入の計算（純粋関数） */

const ok = (x: number) => Number.isFinite(x);

/* 割引 */
export type DiscountResult = { price: number; discounted: number; off: number; effectiveRate: number; label: string };
/** 「2割5分引き」のような言い方 */
export function wariLabel(rate: number): string {
  const r = Math.round(rate * 10) / 10;
  const wari = Math.floor(r / 10);
  const bu = Math.round((r - wari * 10) * 10) / 10;
  if (r <= 0) return "割引なし";
  return `${wari ? `${wari}割` : ""}${bu ? `${bu}分` : ""}引き`;
}
/** 定価に割引を1回または2回かける。tax は税抜の定価を税込で表示するときの倍率（1.1 など） */
export function calcDiscount(price: number, rate: number, extraRate = 0, tax = 1): DiscountResult {
  const base = Math.max(0, price || 0) * tax;
  const after = base * (1 - (rate || 0) / 100) * (1 - (extraRate || 0) / 100);
  const discounted = Math.round(after);
  const effectiveRate = base ? (1 - after / base) * 100 : 0;
  return { price: Math.round(base), discounted, off: Math.round(base) - discounted, effectiveRate, label: wariLabel(effectiveRate) };
}

/* 割合 */
export type PercentResult = { aOfB: number; xOfB: number; changeRate: number; diff: number; baseFromA: number };
export function calcPercent(a: number, b: number, x: number): PercentResult {
  return { aOfB: (a / b) * 100, xOfB: (b * x) / 100, changeRate: ((b - a) / a) * 100, diff: b - a, baseFromA: a / (x / 100) };
}

/* 比率 */
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
export function simplifyRatio(a: number, b: number): [number, number] | null {
  if (!ok(a) || !ok(b) || a <= 0 || b <= 0) return null;
  const decimals = Math.max(...[a, b].map((n) => (String(n).split(".")[1] ?? "").length));
  const k = 10 ** decimals;
  const A = Math.round(a * k);
  const B = Math.round(b * k);
  const g = gcd(A, B) || 1;
  return [A / g, B / g];
}
/** a:b = c:x の x */
export const solveRatio = (a: number, b: number, c: number) => (b * c) / a;

/* 平均など */
export type NumberStats = { count: number; sum: number; mean: number; median: number; max: number; min: number; sdPopulation: number; sdSample: number | null; modes: number[] };
/** 改行・スペース・読点・カンマ区切りの数を取り出す。「1,200」のような桁区切りは1つの数として読む */
export function parseNumbers(text: string): number[] {
  return text
    .split(/[\s、;]+/)
    .flatMap((tok) => {
      const t = tok.replace(/[０-９．－，]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
      if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) return [Number(t.replace(/,/g, ""))];
      return t.split(",").filter(Boolean).map(Number);
    })
    .filter(ok);
}
export function numberStats(values: number[]): NumberStats | null {
  const n = values.length;
  if (n === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const sorted = [...values].sort((a, b) => a - b);
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / n;
  const freq = new Map<number, number>();
  for (const v of values) freq.set(v, (freq.get(v) ?? 0) + 1);
  const top = Math.max(...freq.values());
  return {
    count: n,
    sum,
    mean,
    median,
    max: sorted[n - 1],
    min: sorted[0],
    sdPopulation: Math.sqrt(variance),
    sdSample: n > 1 ? Math.sqrt((variance * n) / (n - 1)) : null,
    modes: top > 1 ? [...freq].filter(([, c]) => c === top).map(([v]) => v) : [],
  };
}

/* 四捨五入 */
export type RoundResult = { halfUp: number; down: number; up: number; halfEven: number; fiveDownSixUp: number };
/**
 * digits 桁（小数第digits位まで残す。マイナスは十の位など）で丸める。
 * 浮動小数点の誤差を避けるため、桁を移したあと有効数字15桁で整えてから丸める。
 * マイナスの数は絶対値で丸めて符号を戻す（切り捨て＝0に近づける）。
 */
export function roundAll(x: number, digits: number): RoundResult {
  const f = 10 ** digits;
  const sign = Math.sign(x) || 1;
  const y = Number((Math.abs(x) * f).toPrecision(15));
  const fl = Math.floor(y);
  const frac = y - fl;
  const back = (v: number) => (sign * v) / f;
  const half = Math.abs(frac - 0.5) < 1e-9;
  return {
    halfUp: back(Math.round(y)),
    down: back(fl),
    up: back(Math.ceil(y)),
    halfEven: back(half ? (fl % 2 ? fl + 1 : fl) : Math.round(y)),
    fiveDownSixUp: back(frac > 0.5 + 1e-9 ? fl + 1 : fl),
  };
}
