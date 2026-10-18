/** 画像の読み込み（HEIC対応）と書き出し（ブラウザ専用） */

export const isHeic = (f: File) => /hei[cf]/i.test(f.type) || /\.hei[cf]$/i.test(f.name);
export const isImageFile = (f: File) => f.type.startsWith("image/") || isHeic(f);

export type LoadedImage = { img: HTMLImageElement; url: string; width: number; height: number };

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("この画像は読み込めません（ブラウザが対応していない形式の可能性があります）"));
    img.src = url;
  });
}

/** 画像ファイルを読み込む。HEICはまずPNGに変換する。幅・高さのないSVGは1024pxで扱う */
export async function loadImage(file: File): Promise<LoadedImage> {
  let blob: Blob = file;
  if (isHeic(file)) {
    const { default: heic2any } = await import("heic2any");
    const r = await heic2any({ blob: file, toType: "image/png" });
    blob = Array.isArray(r) ? r[0] : r;
  }
  const url = URL.createObjectURL(blob);
  const img = await loadImg(url);
  const width = img.naturalWidth || 1024;
  const height = img.naturalHeight || 1024;
  return { img, url, width, height };
}

export type OutputFormat = "image/jpeg" | "image/png" | "image/webp";
export const EXTENSION: Record<OutputFormat, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** 長い辺・幅・高さの上限に収まる大きさ（拡大はしない） */
export function fitSize(w: number, h: number, maxWidth?: number, maxHeight?: number): { width: number; height: number } {
  let k = 1;
  if (maxWidth && w > maxWidth) k = Math.min(k, maxWidth / w);
  if (maxHeight && h > maxHeight) k = Math.min(k, maxHeight / h);
  return { width: Math.max(1, Math.round(w * k)), height: Math.max(1, Math.round(h * k)) };
}

/** 画像を指定の大きさ・形式・画質で書き出す。JPEGは透明部分を白にする */
export function renderImage(src: LoadedImage, opts: { maxWidth?: number; maxHeight?: number; format: OutputFormat; quality: number }): Promise<{ blob: Blob; width: number; height: number }> {
  const { width, height } = fitSize(src.width, src.height, opts.maxWidth, opts.maxHeight);
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const g = c.getContext("2d")!;
  if (opts.format === "image/jpeg") {
    g.fillStyle = "#fff";
    g.fillRect(0, 0, width, height);
  }
  g.imageSmoothingQuality = "high";
  g.drawImage(src.img, 0, 0, width, height);
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve({ blob: b, width, height }) : reject(new Error("画像を書き出せませんでした"))), opts.format, opts.quality));
}
