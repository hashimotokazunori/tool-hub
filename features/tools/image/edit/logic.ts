/** 画像の切り抜き・回転の計算部分（座標はすべて元画像のピクセル） */

export type Box = { x: number; y: number; w: number; h: number };

/** 切り抜きの比率。null は自由 */
export const RATIOS: { id: string; label: string; ratio: number | null }[] = [
  { id: "free", label: "自由", ratio: null },
  { id: "1:1", label: "1:1（正方形・アイコン）", ratio: 1 },
  { id: "4:5", label: "4:5（Instagram 縦）", ratio: 4 / 5 },
  { id: "16:9", label: "16:9（YouTube サムネイル・横長）", ratio: 16 / 9 },
  { id: "9:16", label: "9:16（ストーリーズ・縦長）", ratio: 9 / 16 },
  { id: "3:2", label: "3:2（一般的な写真）", ratio: 3 / 2 },
  { id: "4:3", label: "4:3（スマホの写真）", ratio: 4 / 3 },
  { id: "3:1", label: "3:1（X のヘッダー）", ratio: 3 },
];

/** 画像の中に収まる、指定の比率でいちばん大きい中央の枠 */
export function initialBox(imgW: number, imgH: number, ratio: number | null): Box {
  if (!ratio) return { x: 0, y: 0, w: imgW, h: imgH };
  let w = imgW;
  let h = w / ratio;
  if (h > imgH) {
    h = imgH;
    w = h * ratio;
  }
  return { x: (imgW - w) / 2, y: (imgH - h) / 2, w, h };
}

/** 枠を画像の中に収める（大きさが画像を超えるときは縮める） */
export function clampBox(b: Box, imgW: number, imgH: number): Box {
  const w = Math.min(Math.max(1, b.w), imgW);
  const h = Math.min(Math.max(1, b.h), imgH);
  return { x: Math.min(Math.max(0, b.x), imgW - w), y: Math.min(Math.max(0, b.y), imgH - h), w, h };
}

/**
 * 右下の角をドラッグして大きさを変える。比率の指定があれば保つ。
 * 左上の位置は動かさず、画像からはみ出さない範囲で、最小 minSize px。
 */
export function resizeBox(b: Box, newW: number, newH: number, imgW: number, imgH: number, ratio: number | null, minSize = 16): Box {
  const maxW = imgW - b.x;
  const maxH = imgH - b.y;
  let w = Math.max(minSize, Math.min(newW, maxW));
  let h = Math.max(minSize, Math.min(newH, maxH));
  if (ratio) {
    // 横の動きを基準に高さを決め、はみ出すなら高さを基準にする
    h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
    if (h < minSize) {
      h = minSize;
      w = h * ratio;
    }
  }
  return { x: b.x, y: b.y, w, h };
}

/** 整数のピクセルにそろえる（書き出し用） */
export const roundBox = (b: Box): Box => ({ x: Math.round(b.x), y: Math.round(b.y), w: Math.max(1, Math.round(b.w)), h: Math.max(1, Math.round(b.h)) });

export type Turn = 0 | 90 | 180 | 270;

/** 回転後の幅・高さ */
export const rotatedSize = (w: number, h: number, turn: Turn) => (turn === 90 || turn === 270 ? { width: h, height: w } : { width: w, height: h });

/** 右回り（時計回り）に 90° 足す・引く */
export const turnBy = (t: Turn, d: 90 | -90): Turn => ((((t + d) % 360) + 360) % 360) as Turn;
