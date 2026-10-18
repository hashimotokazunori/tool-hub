import { secureRandomInt } from "../password-generator/logic";

export type RandomOptions = { min: number; max: number; count: number; decimals: 0 | 1 | 2; unique: boolean; sort: boolean };
export type RandomResult = { values: number[] } | { error: string };

/** 範囲内の乱数（暗号論的乱数）。decimals 桁の小数も作れる */
export function randomNumbers(o: RandomOptions, randomInt: (n: number) => number = secureRandomInt): RandomResult {
  const f = 10 ** o.decimals;
  const lo = Math.ceil(o.min * f);
  const hi = Math.floor(o.max * f);
  const span = hi - lo + 1;
  const n = Math.min(10_000, Math.max(1, Math.floor(o.count || 1)));
  if (!Number.isFinite(span) || span <= 0) return { error: "最大は最小と同じか、それより大きくしてください" };
  if (o.unique && n > span) return { error: `重複なしでは最大 ${span.toLocaleString("ja-JP")} 個までです` };
  const out: number[] = [];
  const seen = new Set<number>();
  while (out.length < n) {
    const x = lo + randomInt(span);
    if (o.unique) {
      if (seen.has(x)) continue;
      seen.add(x);
    }
    out.push(x / f);
  }
  if (o.sort) out.sort((a, b) => a - b);
  return { values: out };
}

/** 配列をランダムに並べ替える（フィッシャー–イェーツ） */
export function shuffle<T>(items: T[], randomInt: (n: number) => number = secureRandomInt): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** ビンゴの列の文字（1〜15 B、16〜30 I、31〜45 N、46〜60 G、61〜75 O） */
export const bingoLetter = (n: number) => "BINGO"[Math.floor((n - 1) / 15)];

/** まだ出ていない番号から1つ引く。全部出ていたら null */
export function drawBingo(drawn: number[], randomInt: (n: number) => number = secureRandomInt): number | null {
  const rest = Array.from({ length: 75 }, (_, i) => i + 1).filter((n) => !drawn.includes(n));
  return rest.length ? rest[randomInt(rest.length)] : null;
}

const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
const format = (h: string) => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;

/** UUID v4（ランダム） */
export function uuidV4(random: (b: Uint8Array) => void = (b) => crypto.getRandomValues(b)): string {
  const b = new Uint8Array(16);
  random(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return format(hex(b));
}

/** UUID v7（先頭48ビットがミリ秒の時刻。作った順に並ぶ） */
export function uuidV7(now = Date.now(), random: (b: Uint8Array) => void = (b) => crypto.getRandomValues(b)): string {
  const b = new Uint8Array(16);
  random(b);
  for (let i = 0; i < 6; i++) b[i] = Math.floor(now / 2 ** (8 * (5 - i))) & 0xff;
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  return format(hex(b));
}
