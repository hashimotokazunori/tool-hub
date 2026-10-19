/** 画像に文字を入れる：位置と大きさの計算（DOMを使わない計算だけ） */

export type VPos = "top" | "middle" | "bottom";
export type HPos = "left" | "center" | "right";

/** 文字のかたまりの置き方。x, y は画像に対する基準点（0〜1）、ax, ay は基準点がかたまりのどこか（0=左/上, 0.5=中, 1=右/下） */
export type Placement = { x: number; y: number; ax: number; ay: number };

/** 位置の目安（上・中央・下 × 左・中・右）を置き方にする */
export function presetPlacement(v: VPos, h: HPos, margin = 0.05): Placement {
  const ax = h === "left" ? 0 : h === "right" ? 1 : 0.5;
  const ay = v === "top" ? 0 : v === "bottom" ? 1 : 0.5;
  return { x: ax === 0 ? margin : ax === 1 ? 1 - margin : 0.5, y: ay === 0 ? margin : ay === 1 ? 1 - margin : 0.5, ax, ay };
}

/** 置き方とかたまりの大きさから、左上の位置（px）を決める。画像からはみ出さないように収める */
export function blockOrigin(p: Placement, blockW: number, blockH: number, imgW: number, imgH: number): { left: number; top: number } {
  const fit = (v: number, size: number, total: number) => (size > total ? (total - size) / 2 : Math.max(0, Math.min(total - size, v)));
  return { left: fit(p.x * imgW - blockW * p.ax, blockW, imgW), top: fit(p.y * imgH - blockH * p.ay, blockH, imgH) };
}

/** 左上の位置から基準点（0〜1）に戻す。ドラッグで動かしたときに使う */
export function placementFromOrigin(left: number, top: number, blockW: number, blockH: number, imgW: number, imgH: number, p: Placement): Placement {
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  return { ...p, x: clamp((left + blockW * p.ax) / imgW), y: clamp((top + blockH * p.ay) / imgH) };
}

/** 文字の揃え（基準点が左なら左揃え） */
export const alignFor = (ax: number): "left" | "center" | "right" => (ax === 0 ? "left" : ax === 1 ? "right" : "center");

/** 文字の大きさ（画像の短い辺に対する％）を px にする */
export const fontPx = (pct: number, imgW: number, imgH: number) => Math.max(4, Math.round((Math.min(imgW, imgH) * pct) / 100));

/** 行に分ける（空の行も行の高さを保つ） */
export const splitLines = (text: string) => text.replace(/\r\n?/g, "\n").split("\n");

/** 点 (x, y) が四角の中にあるか */
export const inRect = (x: number, y: number, r: { left: number; top: number; width: number; height: number }) => x >= r.left && x <= r.left + r.width && y >= r.top && y <= r.top + r.height;
