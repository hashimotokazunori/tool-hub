/** 電子印鑑：文字の並べ方と日付の書き方（DOMを使わない計算だけ） */

/** 1文字を置く枠（中心と幅・高さ。px） */
export type CharBox = { ch: string; cx: number; cy: number; w: number; h: number };

/** 文字列を1文字ずつに分ける（サロゲートペアも1文字として数える）。空白は除く */
export const chars = (s: string) => [...s.replace(/\s+/g, "")];

/**
 * 丸印：縦1列（1〜4文字程度）。円の中に収まるよう、文字を縦長の枠に並べる。
 * size は画像の一辺、inner は内側の直径（枠線の内側）。
 */
export function roundVertical(text: string, size: number, inner: number): CharBox[] {
  const cs = chars(text);
  const n = cs.length;
  if (!n) return [];
  const c = size / 2;
  if (n === 1) {
    const s = inner * 0.62;
    return [{ ch: cs[0], cx: c, cy: c, w: s, h: s }];
  }
  const total = inner * (n === 2 ? 0.74 : 0.8);
  const h = total / n;
  // 円の中に収まる幅（上下の文字ほど狭くなるので、いちばん外側の文字に合わせる）
  const r = inner / 2;
  const edge = total / 2;
  const w = Math.min(h * 1.15, 2 * Math.sqrt(Math.max(0, r * r - edge * edge)) * 0.95, inner * 0.55);
  return cs.map((ch, i) => ({ ch, cx: c, cy: c - total / 2 + h * (i + 0.5), w: Math.max(w, h * 0.6), h }));
}

/** 丸印：2行（右の列から縦に読む）。right が右の列、left が左の列 */
export function roundTwoColumns(right: string, left: string, size: number, inner: number): CharBox[] {
  const cols = [chars(right), chars(left)].filter((c) => c.length);
  if (!cols.length) return [];
  if (cols.length === 1) return roundVertical(cols[0].join(""), size, inner);
  const rows = Math.max(...cols.map((c) => c.length));
  const c = size / 2;
  const total = inner * (rows <= 2 ? 0.66 : 0.76);
  const h = total / rows;
  const w = Math.min(h * 1.1, inner * 0.3);
  const gap = w * 1.05;
  const out: CharBox[] = [];
  cols.forEach((col, ci) => {
    const cx = ci === 0 ? c + gap / 2 : c - gap / 2;
    // 文字数が少ない列は上下の真ん中に寄せる
    const top = c - (h * col.length) / 2;
    col.forEach((ch, i) => out.push({ ch, cx, cy: top + h * (i + 0.5), w, h }));
  });
  return out;
}

/** 角印の行数・列数（縦に読む。行数 ≥ 列数） */
export function squareGrid(n: number): { rows: number; cols: number } {
  if (n <= 0) return { rows: 0, cols: 0 };
  const rows = Math.ceil(Math.sqrt(n));
  return { rows, cols: Math.ceil(n / rows) };
}

/** 角印：右上から縦に読む升目に並べる。inner は枠線の内側の一辺 */
export function squareLayout(text: string, size: number, inner: number): CharBox[] {
  const cs = chars(text);
  const { rows, cols } = squareGrid(cs.length);
  if (!rows) return [];
  const pad = inner * 0.06;
  const area = inner - pad * 2;
  const w = area / cols;
  const h = area / rows;
  const left = (size - area) / 2;
  const top = (size - area) / 2;
  return cs.map((ch, i) => {
    const col = Math.floor(i / rows);
    const row = i % rows;
    return { ch, cx: left + area - w * (col + 0.5), cy: top + h * (row + 0.5), w: w * 0.92, h: h * 0.92 };
  });
}

/** 日付印の3段（上・中・下）の帯の位置。y は中心、h は高さ */
export function dateTiers(size: number, inner: number): { top: { cy: number; h: number }; middle: { cy: number; h: number }; bottom: { cy: number; h: number }; lineY: [number, number]; lineHalf: number } {
  const c = size / 2;
  const r = inner / 2;
  const mid = inner * 0.3; // 真ん中の段の高さ
  const y1 = c - mid / 2;
  const y2 = c + mid / 2;
  // 横線の半分の長さ（円と交わる所まで）
  const lineHalf = Math.sqrt(Math.max(0, r * r - (mid / 2) ** 2));
  const outerH = r - mid / 2;
  return {
    top: { cy: y1 - outerH * 0.5, h: outerH * 0.55 },
    middle: { cy: c, h: mid * 0.62 },
    bottom: { cy: y2 + outerH * 0.5, h: outerH * 0.55 },
    lineY: [y1, y2],
    lineHalf,
  };
}

/** 段の中で使える幅（円の弦の長さ。少し内側に寄せる） */
export function chordWidth(size: number, inner: number, cy: number, h: number): number {
  const r = inner / 2;
  const dy = Math.abs(cy - size / 2) + h / 2;
  return Math.max(0, 2 * Math.sqrt(Math.max(0, r * r - dy * dy)) * 0.9);
}

export type DateStyle = "reiwa" | "seireki" | "short";

/** 日付印の真ん中の日付。reiwa は「R8.10.19」、seireki は「2026.10.19」、short は「26.10.19」 */
export function stampDate(y: number, m: number, d: number, style: DateStyle): string {
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  if (style === "seireki") return `${y}.${mm}.${dd}`;
  if (style === "short") return `${String(y % 100).padStart(2, "0")}.${mm}.${dd}`;
  // 令和は2019年5月1日から
  if (y > 2019 || (y === 2019 && m >= 5)) return `R${y - 2018}.${mm}.${dd}`;
  // 平成は1989年1月8日から。それより前は昭和
  if (y > 1989 || (y === 1989 && (m > 1 || d >= 8))) return `H${y - 1988}.${mm}.${dd}`;
  return `S${y - 1925}.${mm}.${dd}`;
}

/** 保存する画像の大きさの候補（px） */
export const HANKO_SIZES = [300, 400, 500, 600] as const;

/** 枠線の太さ（細い・ふつう・太い）を px にする */
export const strokeWidth = (size: number, level: "thin" | "normal" | "bold") => size * (level === "thin" ? 0.02 : level === "bold" ? 0.045 : 0.032);
