/** 動画→GIF（GIF89a の書き出し・減色・LZW）と、音声の WAV 書き出し。DOMを使わない計算だけ */

// ───────── 減色（メディアンカット） ─────────

export type Palette = { colors: Uint8Array; count: number };

type Box = { bins: number[]; rMin: number; rMax: number; gMin: number; gMax: number; bMin: number; bMax: number; total: number };

const binOf = (r: number, g: number, b: number) => ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);

/**
 * RGBA の画素から最大 maxColors 色のパレットを作る（各色5ビットのヒストグラムでメディアンカット）。
 * step ごとに画素を間引いて数える。
 */
export function medianCut(rgba: ArrayLike<number>, maxColors = 256, step = 1): Palette {
  const hist = new Uint32Array(32768);
  const sums = new Float64Array(32768 * 3);
  for (let i = 0; i + 3 < rgba.length; i += 4 * step) {
    const bin = binOf(rgba[i], rgba[i + 1], rgba[i + 2]);
    hist[bin]++;
    sums[bin * 3] += rgba[i];
    sums[bin * 3 + 1] += rgba[i + 1];
    sums[bin * 3 + 2] += rgba[i + 2];
  }
  const used: number[] = [];
  for (let b = 0; b < 32768; b++) if (hist[b]) used.push(b);
  const makeBox = (bins: number[]): Box => {
    const box: Box = { bins, rMin: 31, rMax: 0, gMin: 31, gMax: 0, bMin: 31, bMax: 0, total: 0 };
    for (const b of bins) {
      const r = b >> 10;
      const g = (b >> 5) & 31;
      const bl = b & 31;
      box.rMin = Math.min(box.rMin, r);
      box.rMax = Math.max(box.rMax, r);
      box.gMin = Math.min(box.gMin, g);
      box.gMax = Math.max(box.gMax, g);
      box.bMin = Math.min(box.bMin, bl);
      box.bMax = Math.max(box.bMax, bl);
      box.total += hist[b];
    }
    return box;
  };
  const boxes: Box[] = used.length ? [makeBox(used)] : [];
  while (boxes.length < maxColors) {
    // 画素が多く、色の幅が広い箱から分ける
    let pick = -1;
    let score = 0;
    boxes.forEach((bx, i) => {
      if (bx.bins.length < 2) return;
      const span = Math.max(bx.rMax - bx.rMin, bx.gMax - bx.gMin, bx.bMax - bx.bMin);
      const s = (span + 1) * Math.sqrt(bx.total);
      if (s > score) {
        score = s;
        pick = i;
      }
    });
    if (pick < 0) break;
    const bx = boxes[pick];
    const rs = bx.rMax - bx.rMin;
    const gs = bx.gMax - bx.gMin;
    const bs = bx.bMax - bx.bMin;
    const key = gs >= rs && gs >= bs ? (b: number) => (b >> 5) & 31 : rs >= bs ? (b: number) => b >> 10 : (b: number) => b & 31;
    const sorted = [...bx.bins].sort((a, b) => key(a) - key(b));
    let acc = 0;
    let cut = 1;
    for (let i = 0; i < sorted.length - 1; i++) {
      acc += hist[sorted[i]];
      cut = i + 1;
      if (acc >= bx.total / 2) break;
    }
    boxes.splice(pick, 1, makeBox(sorted.slice(0, cut)), makeBox(sorted.slice(cut)));
  }
  const colors = new Uint8Array(Math.max(1, boxes.length) * 3);
  boxes.forEach((bx, i) => {
    let r = 0;
    let g = 0;
    let b = 0;
    for (const bin of bx.bins) {
      r += sums[bin * 3];
      g += sums[bin * 3 + 1];
      b += sums[bin * 3 + 2];
    }
    colors[i * 3] = Math.round(r / bx.total);
    colors[i * 3 + 1] = Math.round(g / bx.total);
    colors[i * 3 + 2] = Math.round(b / bx.total);
  });
  return { colors, count: Math.max(1, boxes.length) };
}

/** 各画素をパレットのいちばん近い色の番号にする（5ビットごとに結果を覚えて速くする） */
export function mapToPalette(rgba: ArrayLike<number>, palette: Palette): Uint8Array {
  const n = Math.floor(rgba.length / 4);
  const out = new Uint8Array(n);
  const cache = new Int16Array(32768).fill(-1);
  const { colors, count } = palette;
  for (let p = 0; p < n; p++) {
    const r = rgba[p * 4];
    const g = rgba[p * 4 + 1];
    const b = rgba[p * 4 + 2];
    const bin = binOf(r, g, b);
    let idx = cache[bin];
    if (idx < 0) {
      let bd = Infinity;
      idx = 0;
      for (let c = 0; c < count; c++) {
        const d = (colors[c * 3] - r) ** 2 + (colors[c * 3 + 1] - g) ** 2 + (colors[c * 3 + 2] - b) ** 2;
        if (d < bd) {
          bd = d;
          idx = c;
        }
      }
      cache[bin] = idx;
    }
    out[p] = idx;
  }
  return out;
}

// ───────── LZW（GIF方式） ─────────

/** GIF の最小コードサイズ（色数を表せるビット数。2以上） */
export const minCodeSize = (colorCount: number) => Math.max(2, Math.ceil(Math.log2(Math.max(2, colorCount))));

/** 色番号の並びを GIF の LZW で圧縮する（サブブロックに分ける前のバイト列） */
export function lzwEncode(indices: ArrayLike<number>, minSize: number): Uint8Array {
  const clear = 1 << minSize;
  const eoi = clear + 1;
  const out: number[] = [];
  let cur = 0;
  let bits = 0;
  let size = minSize + 1;
  const write = (code: number) => {
    cur |= code << bits;
    bits += size;
    while (bits >= 8) {
      out.push(cur & 0xff);
      cur >>>= 8;
      bits -= 8;
    }
  };
  let dict = new Map<number, number>();
  let next = eoi + 1;
  write(clear);
  if (!indices.length) {
    write(eoi);
    if (bits > 0) out.push(cur & 0xff);
    return Uint8Array.from(out);
  }
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const key = prefix * 4096 + k;
    const found = dict.get(key);
    if (found !== undefined) {
      prefix = found;
      continue;
    }
    write(prefix);
    if (next === 4096) {
      // 表がいっぱいになったら作り直す
      write(clear);
      dict = new Map();
      size = minSize + 1;
      next = eoi + 1;
    } else {
      // これから付ける番号が今のビット数で表せないなら、次からビット数を増やす
      if (next >= 1 << size) size++;
      dict.set(key, next++);
    }
    prefix = k;
  }
  write(prefix);
  write(eoi);
  if (bits > 0) out.push(cur & 0xff);
  return Uint8Array.from(out);
}

/** GIF の LZW を元に戻す（確認用） */
export function lzwDecode(data: ArrayLike<number>, minSize: number, maxPixels = Infinity): number[] {
  const clear = 1 << minSize;
  const eoi = clear + 1;
  let size = minSize + 1;
  let dict: number[][] = [];
  const reset = () => {
    dict = [];
    for (let i = 0; i < clear; i++) dict.push([i]);
    dict.push([], []);
    size = minSize + 1;
  };
  reset();
  const out: number[] = [];
  let pos = 0;
  let prev: number[] | null = null;
  const read = () => {
    let code = 0;
    for (let i = 0; i < size; i++) {
      const byte = data[pos >> 3];
      if (byte === undefined) return -1;
      code |= ((byte >> (pos & 7)) & 1) << i;
      pos++;
    }
    return code;
  };
  while (out.length < maxPixels) {
    const code = read();
    if (code < 0 || code === eoi) break;
    if (code === clear) {
      reset();
      prev = null;
      continue;
    }
    let entry: number[];
    if (code < dict.length) entry = dict[code];
    else if (prev) entry = [...prev, prev[0]];
    else break;
    out.push(...entry);
    if (prev && dict.length < 4096) dict.push([...prev, entry[0]]);
    prev = entry;
    if (dict.length === 1 << size && size < 12) size++;
  }
  return out;
}

// ───────── GIF89a の組み立て ─────────

const u16 = (n: number) => [n & 0xff, (n >> 8) & 0xff];
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

/** 色表の大きさ（2のべき乗）のビット数 - 1 */
const tableBits = (count: number) => Math.max(1, Math.ceil(Math.log2(Math.max(2, count)))) - 1;

function colorTable(palette: Palette): number[] {
  const size = 1 << (tableBits(palette.count) + 1);
  const t = new Array(size * 3).fill(0);
  for (let i = 0; i < palette.count * 3; i++) t[i] = palette.colors[i];
  return t;
}

/** ファイルの先頭：署名・画面の大きさ（全体の色表なし）・無限ループ指定（NETSCAPE2.0） */
export function gifHeader(width: number, height: number, loop = 0): Uint8Array {
  return Uint8Array.from([
    ...ascii("GIF89a"),
    ...u16(width),
    ...u16(height),
    0x00, // 全体の色表なし（コマごとの色表を使う）
    0x00, // 背景色の番号
    0x00, // 画素の縦横比
    0x21,
    0xff,
    0x0b,
    ...ascii("NETSCAPE2.0"),
    0x03,
    0x01,
    ...u16(loop),
    0x00,
  ]);
}

/** 1コマ分：表示時間・画像の位置と大きさ・このコマの色表・圧縮した画素 */
export function gifFrame(width: number, height: number, indices: ArrayLike<number>, palette: Palette, delayCs: number): Uint8Array {
  const bits = tableBits(palette.count);
  const minSize = minCodeSize(1 << (bits + 1));
  const lzw = lzwEncode(indices, minSize);
  const blocks: number[] = [];
  for (let i = 0; i < lzw.length; i += 255) {
    const chunk = lzw.subarray(i, i + 255);
    blocks.push(chunk.length, ...chunk);
  }
  return Uint8Array.from([
    0x21,
    0xf9,
    0x04,
    0x04, // 次のコマを重ねる前にそのまま残す（disposal = 1）
    ...u16(Math.max(2, Math.round(delayCs))),
    0x00,
    0x00,
    0x2c,
    ...u16(0),
    ...u16(0),
    ...u16(width),
    ...u16(height),
    0x80 | bits, // コマごとの色表あり
    ...colorTable(palette),
    minSize,
    ...blocks,
    0x00,
  ]);
}

export const GIF_TRAILER = Uint8Array.of(0x3b);

/** バイト列をつなぐ */
export function concatBytes(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** RGBA のコマを減色して GIF の1コマにする */
export function encodeRgbaFrame(rgba: ArrayLike<number>, width: number, height: number, delayCs: number, colors = 256): Uint8Array {
  const step = Math.max(1, Math.floor((width * height) / 40000));
  const palette = medianCut(rgba, colors, step);
  return gifFrame(width, height, mapToPalette(rgba, palette), palette, delayCs);
}

// ───────── 動画の範囲・大きさ ─────────

export const GIF_MAX_SECONDS = 15;

/** 開始・終了を動画の長さと上限に収める */
export function clampRange(start: number, end: number, duration: number, max = GIF_MAX_SECONDS): { start: number; end: number } {
  const d = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const s = Math.max(0, Math.min(Number.isFinite(start) ? start : 0, d));
  let e = Math.max(s, Math.min(Number.isFinite(end) ? end : d, d));
  if (e - s > max) e = s + max;
  return { start: s, end: e };
}

/** 書き出すコマの時刻（秒）。コマの真ん中の時刻を使う */
export function frameTimes(start: number, end: number, fps: number): number[] {
  const n = Math.max(1, Math.round((end - start) * fps));
  return Array.from({ length: n }, (_, i) => Math.min(end, start + (i + 0.5) / fps));
}

/** fps から1コマの表示時間（1/100秒）。端数は累積して合計がずれないようにする */
export function frameDelays(count: number, fps: number): number[] {
  const out: number[] = [];
  let shown = 0;
  for (let i = 1; i <= count; i++) {
    const target = Math.round((i * 100) / fps);
    out.push(target - shown);
    shown = target;
  }
  return out;
}

/** 横幅を指定して高さを決める（偶数にそろえる。元より大きくはしない） */
export function scaledSize(w: number, h: number, targetWidth: number): { width: number; height: number } {
  const width = Math.max(2, Math.min(targetWidth, w));
  return { width, height: Math.max(2, Math.round((h * width) / w)) };
}

// ───────── WAV ─────────

/** 16ビットPCMのWAVを作る。channels は各チャンネルの -1〜1 の値 */
export function encodeWav(channels: Float32Array[], sampleRate: number): Uint8Array {
  const nch = channels.length;
  const frames = nch ? channels[0].length : 0;
  const dataSize = frames * nch * 2;
  const buf = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + dataSize, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, nch, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * nch * 2, true);
  v.setUint16(32, nch * 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, dataSize, true);
  let o = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < nch; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i] || 0));
      v.setInt16(o, s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff), true);
      o += 2;
    }
  }
  return new Uint8Array(buf);
}

/** WAV の大きさ（バイト）の見込み */
export const wavSize = (seconds: number, sampleRate: number, channels: number) => 44 + Math.round(seconds * sampleRate) * channels * 2;

/** 「1:23.4」のような表示 */
export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00.0";
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}
