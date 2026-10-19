/** 画像の色：代表色の抽出（k-means）と、単色背景の透過（DOMを使わない計算だけ） */

export type RGB = { r: number; g: number; b: number };

const hex2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
export const toHex = ({ r, g, b }: RGB) => `#${hex2(r)}${hex2(g)}${hex2(b)}`.toUpperCase();
export const toRgbText = ({ r, g, b }: RGB) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

/** RGBA の並びから (x, y) の色を読む */
export function pixelAt(data: ArrayLike<number>, width: number, x: number, y: number): RGB & { a: number } {
  const i = (y * width + x) * 4;
  return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
}

const dist2 = (a: RGB, b: RGB) => (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;

/** 文字を白・黒のどちらで載せると読みやすいか（相対輝度で判定） */
export function readableTextColor({ r, g, b }: RGB): "#000000" | "#FFFFFF" {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.179 ? "#000000" : "#FFFFFF";
}

export type Dominant = RGB & { ratio: number };

/**
 * 代表色を k 個取り出す（k-means）。透明に近い画素は数えない。
 * 初期値は「すでに選んだ色からいちばん遠い色」を順に選ぶので、毎回同じ結果になる。
 * 割合の大きい順に返す。似た色しかないときは k 個より少なくなる。
 */
export function dominantColors(data: ArrayLike<number>, k: number, maxIter = 12): Dominant[] {
  const pts: RGB[] = [];
  for (let i = 0; i + 3 < data.length; i += 4) if (data[i + 3] >= 128) pts.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  if (!pts.length || k < 1) return [];

  // 初期値：平均に最も近い色から始め、以後は最も遠い色を足していく
  const mean = pts.reduce((m, p) => ({ r: m.r + p.r / pts.length, g: m.g + p.g / pts.length, b: m.b + p.b / pts.length }), { r: 0, g: 0, b: 0 });
  let first = pts[0];
  for (const p of pts) if (dist2(p, mean) < dist2(first, mean)) first = p;
  const centers: RGB[] = [{ ...first }];
  const nearest = pts.map((p) => dist2(p, first));
  while (centers.length < k) {
    let bi = 0;
    for (let i = 1; i < pts.length; i++) if (nearest[i] > nearest[bi]) bi = i;
    if (nearest[bi] < 1) break; // 残りはどれも同じ色
    const c = { ...pts[bi] };
    centers.push(c);
    for (let i = 0; i < pts.length; i++) nearest[i] = Math.min(nearest[i], dist2(pts[i], c));
  }

  const assign = new Int32Array(pts.length);
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    for (let i = 0; i < pts.length; i++) {
      let best = 0;
      let bd = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const d = dist2(pts[i], centers[c]);
        if (d < bd) {
          bd = d;
          best = c;
        }
      }
      if (assign[i] !== best) changed = true;
      assign[i] = best;
    }
    const sum = centers.map(() => ({ r: 0, g: 0, b: 0, n: 0 }));
    for (let i = 0; i < pts.length; i++) {
      const s = sum[assign[i]];
      s.r += pts[i].r;
      s.g += pts[i].g;
      s.b += pts[i].b;
      s.n++;
    }
    sum.forEach((s, c) => {
      if (s.n) centers[c] = { r: s.r / s.n, g: s.g / s.n, b: s.b / s.n };
    });
    if (!changed && iter > 0) break;
  }
  const counts = new Array(centers.length).fill(0);
  for (let i = 0; i < pts.length; i++) counts[assign[i]]++;
  return centers
    .map((c, i) => ({ r: Math.round(c.r), g: Math.round(c.g), b: Math.round(c.b), ratio: counts[i] / pts.length }))
    .filter((c) => c.ratio > 0)
    .sort((a, b) => b.ratio - a.ratio);
}

/** 縮小したときの大きさ（長い辺を max に。拡大はしない） */
export function sampleSize(w: number, h: number, max: number): { width: number; height: number } {
  const k = Math.min(1, max / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * k)), height: Math.max(1, Math.round(h * k)) };
}

// ───────── 背景透過 ─────────

/** RGB の距離の最大値（黒と白の距離） */
export const MAX_DISTANCE = Math.sqrt(3 * 255 * 255);

/** 許容範囲（0〜100%）を色の距離にする */
export const toleranceDistance = (pct: number) => (Math.max(0, Math.min(100, pct)) / 100) * MAX_DISTANCE;

const distAt = (data: ArrayLike<number>, i: number, c: RGB) => Math.sqrt((data[i] - c.r) ** 2 + (data[i + 1] - c.g) ** 2 + (data[i + 2] - c.b) ** 2);

/** 四隅の画素の位置 */
export const cornerPoints = (w: number, h: number) => [
  { x: 0, y: 0 },
  { x: w - 1, y: 0 },
  { x: 0, y: h - 1 },
  { x: w - 1, y: h - 1 },
];

/**
 * 消す範囲（1 = 消す）を作る。
 * connected = true なら、指定した点からつながっている似た色だけ（塗りつぶしと同じ考え方）。
 * false なら、画像全体で似た色をすべて消す。基準の色は点ごとの色。
 */
export function backgroundMask(data: ArrayLike<number>, w: number, h: number, seeds: { x: number; y: number }[], tolerancePct: number, connected: boolean): Uint8Array {
  const mask = new Uint8Array(w * h);
  const T = toleranceDistance(tolerancePct);
  const targets = seeds.filter((s) => s.x >= 0 && s.y >= 0 && s.x < w && s.y < h).map((s) => ({ s, c: pixelAt(data, w, Math.floor(s.x), Math.floor(s.y)) }));
  if (!connected) {
    for (let p = 0; p < w * h; p++) {
      for (const t of targets) {
        if (distAt(data, p * 4, t.c) <= T) {
          mask[p] = 1;
          break;
        }
      }
    }
    return mask;
  }
  const stack = new Int32Array(w * h);
  for (const t of targets) {
    const start = Math.floor(t.s.y) * w + Math.floor(t.s.x);
    if (mask[start]) continue;
    let top = 0;
    stack[top++] = start;
    mask[start] = 1;
    while (top) {
      const p = stack[--top];
      const x = p % w;
      const y = (p - x) / w;
      const next = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const q of next) {
        if (q < 0 || mask[q]) continue;
        if (distAt(data, q * 4, t.c) <= T) {
          mask[q] = 1;
          stack[top++] = q;
        }
      }
    }
  }
  return mask;
}

/**
 * 消す範囲を透明にする（data を書き換える）。
 * soften = true なら、消した所と接する残りの画素を、背景の色に近いほど半透明にして境目のギザギザを和らげる。
 */
export function applyMask(data: Uint8ClampedArray | number[], w: number, h: number, mask: Uint8Array, opts: { soften: boolean; background?: RGB; tolerancePct?: number } = { soften: false }) {
  if (opts.soften && opts.background) {
    const T = toleranceDistance(opts.tolerancePct ?? 0);
    const range = Math.max(T, 0.12 * MAX_DISTANCE);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (mask[p]) continue;
        let edge = false;
        for (let dy = -1; dy <= 1 && !edge; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < w && ny < h && mask[ny * w + nx]) {
              edge = true;
              break;
            }
          }
        }
        if (!edge) continue;
        const d = distAt(data, p * 4, opts.background);
        const k = Math.max(0, Math.min(1, (d - T) / range));
        // 境目の画素は少なくとも少し薄くする
        data[p * 4 + 3] = Math.round(data[p * 4 + 3] * Math.min(0.85, Math.max(0.25, k)));
      }
    }
  }
  for (let p = 0; p < w * h; p++) if (mask[p]) data[p * 4 + 3] = 0;
}

/** 消える画素の割合 */
export const maskRatio = (mask: Uint8Array) => {
  let n = 0;
  for (let i = 0; i < mask.length; i++) n += mask[i];
  return mask.length ? n / mask.length : 0;
};
