/** 正方形画像・余白追加・モザイクの純粋な計算部分（DOMは使わない） */

export type Rect = { x: number; y: number; w: number; h: number };

/** 画像を切らずに size×size の正方形の中央に収める位置（拡大もする） */
export function containInSquare(w: number, h: number, size: number, marginPct = 0): Rect {
  const inner = size * (1 - (2 * marginPct) / 100);
  const k = inner / Math.max(w, h);
  const dw = Math.max(1, Math.round(w * k));
  const dh = Math.max(1, Math.round(h * k));
  return { x: Math.round((size - dw) / 2), y: Math.round((size - dh) / 2), w: dw, h: dh };
}

/** 画像で正方形全体を覆う位置（はみ出した部分は切れる。ぼかした背景に使う） */
export function coverSquare(w: number, h: number, size: number): Rect {
  const k = size / Math.min(w, h);
  const dw = w * k;
  const dh = h * k;
  return { x: (size - dw) / 2, y: (size - dh) / 2, w: dw, h: dh };
}

/** 「元の画像の大きさ」を選んだときの正方形の一辺（長い辺） */
export const naturalSquareSize = (w: number, h: number) => Math.max(w, h);

export type Margins = { top: number; right: number; bottom: number; left: number };

/**
 * 余白をpxにする。％は画像の短いほうの辺に対する割合
 * （縦長・横長でも「10%」なら上下左右が同じ太さになるように）。
 */
export function marginsToPx(m: Margins, unit: "px" | "%", w: number, h: number): Margins {
  const base = Math.min(w, h);
  const f = (v: number) => Math.max(0, Math.round(unit === "%" ? (base * (Number.isFinite(v) ? v : 0)) / 100 : Number.isFinite(v) ? v : 0));
  return { top: f(m.top), right: f(m.right), bottom: f(m.bottom), left: f(m.left) };
}

export const paddedSize = (w: number, h: number, m: Margins) => ({ width: w + m.left + m.right, height: h + m.top + m.bottom });

/** 2つの点（ドラッグの始点・終点）から、画像の内側に収まる四角を作る */
export function rectFromPoints(x1: number, y1: number, x2: number, y2: number, imgW: number, imgH: number): Rect {
  const cx = (v: number, max: number) => Math.min(max, Math.max(0, v));
  const ax = cx(Math.min(x1, x2), imgW);
  const ay = cx(Math.min(y1, y2), imgH);
  const bx = cx(Math.max(x1, x2), imgW);
  const by = cx(Math.max(y1, y2), imgH);
  return { x: Math.round(ax), y: Math.round(ay), w: Math.round(bx) - Math.round(ax), h: Math.round(by) - Math.round(ay) };
}

/**
 * 範囲をモザイク（ピクセル化）する。block px ごとのマスを平均の色で塗る。
 * data は RGBA の並び（ImageData.data と同じ）で、その場で書き換える。
 */
export function pixelate(data: Uint8ClampedArray, width: number, rect: Rect, block: number) {
  const b = Math.max(1, Math.round(block));
  const x0 = rect.x;
  const y0 = rect.y;
  const x1 = rect.x + rect.w;
  const y1 = rect.y + rect.h;
  for (let by = y0; by < y1; by += b) {
    for (let bx = x0; bx < x1; bx += b) {
      const ex = Math.min(bx + b, x1);
      const ey = Math.min(by + b, y1);
      let r = 0;
      let g = 0;
      let bl = 0;
      let a = 0;
      let n = 0;
      for (let y = by; y < ey; y++)
        for (let x = bx; x < ex; x++) {
          const i = (y * width + x) * 4;
          r += data[i];
          g += data[i + 1];
          bl += data[i + 2];
          a += data[i + 3];
          n++;
        }
      r = Math.round(r / n);
      g = Math.round(g / n);
      bl = Math.round(bl / n);
      a = Math.round(a / n);
      for (let y = by; y < ey; y++)
        for (let x = bx; x < ex; x++) {
          const i = (y * width + x) * 4;
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = bl;
          data[i + 3] = a;
        }
    }
  }
}

/** 1方向の箱型ぼかし（範囲の外の色は混ぜない） */
function boxBlurLine(src: Float32Array, dst: Float32Array, start: number, step: number, len: number, radius: number) {
  for (let c = 0; c < 4; c++) {
    let sum = 0;
    const at = (k: number) => src[start + Math.min(len - 1, Math.max(0, k)) * step + c];
    for (let k = -radius; k <= radius; k++) sum += at(k);
    for (let k = 0; k < len; k++) {
      dst[start + k * step + c] = sum / (radius * 2 + 1);
      sum += at(k + radius + 1) - at(k - radius);
    }
  }
}

/**
 * 範囲をぼかす。箱型ぼかしを縦横3回ずつかけて、ガウスぼかしに近い見た目にする。
 * （canvas の filter はブラウザによって使えないため自前で計算する）
 */
export function blurRect(data: Uint8ClampedArray, width: number, rect: Rect, radius: number) {
  const r = Math.max(1, Math.round(radius));
  const { w, h } = rect;
  if (w <= 0 || h <= 0) return;
  let a = new Float32Array(w * h * 4);
  let b = new Float32Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 4; c++) a[(y * w + x) * 4 + c] = data[((rect.y + y) * width + rect.x + x) * 4 + c];
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < h; y++) boxBlurLine(a, b, y * w * 4, 4, w, r);
    [a, b] = [b, a];
    for (let x = 0; x < w; x++) boxBlurLine(a, b, x * 4, w * 4, h, r);
    [a, b] = [b, a];
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 4; c++) data[((rect.y + y) * width + rect.x + x) * 4 + c] = Math.round(a[(y * w + x) * 4 + c]);
}

/** 範囲を単色で塗りつぶす */
export function fillRect(data: Uint8ClampedArray, width: number, rect: Rect, rgb: [number, number, number]) {
  for (let y = rect.y; y < rect.y + rect.h; y++)
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      const i = (y * width + x) * 4;
      data[i] = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];
      data[i + 3] = 255;
    }
}

/** 画像の大きさに合わせた、モザイクのマス・ぼかしの強さの目安（短い辺の n%） */
export const strengthPx = (imgW: number, imgH: number, level: number) => Math.max(2, Math.round((Math.min(imgW, imgH) * level) / 100));
