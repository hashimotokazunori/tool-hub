/** PDFツールの純粋な計算部分 */

/**
 * ページ指定（例「1-3, 5, 8-」）を、0始まりのページ番号の配列にする。空欄ならすべて。
 * 全角数字・全角ハイフン・読点も受け付ける。範囲外や読めない指定はエラー。
 */
export function parsePageRange(input: string, total: number): { pages: number[] } | { error: string } {
  const s = input
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[ー－〜～]/g, "-")
    .replace(/[、，]/g, ",")
    .replace(/\s/g, "");
  if (!s) return { pages: Array.from({ length: total }, (_, i) => i) };
  const pages: number[] = [];
  for (const part of s.split(",").filter(Boolean)) {
    const m = /^(\d*)-(\d*)$/.exec(part);
    if (m) {
      const a = m[1] ? Number(m[1]) : 1;
      const b = m[2] ? Number(m[2]) : total;
      if (a < 1 || b > total || a > b) return { error: `「${part}」は範囲外です（1〜${total}）` };
      for (let i = a; i <= b; i++) pages.push(i - 1);
    } else if (/^\d+$/.test(part)) {
      const p = Number(part);
      if (p < 1 || p > total) return { error: `${p}ページはありません（1〜${total}）` };
      pages.push(p - 1);
    } else return { error: `「${part}」を読み取れません。例：1-3, 5` };
  }
  return { pages };
}

/** A4（pt）。72pt = 1インチ */
export const A4 = { width: 595.28, height: 841.89 };
export const mmToPt = (mm: number) => (mm * 72) / 25.4;

export type PageMode = "auto" | "portrait" | "landscape" | "fit";

/** 画像をPDFの1ページに置くときの用紙サイズと配置 */
export function placeImage(imgW: number, imgH: number, mode: PageMode, marginMm: number) {
  const m = mmToPt(marginMm);
  let W: number;
  let H: number;
  if (mode === "fit") {
    // 画像の1pxを0.75pt（96dpi相当）として、そのままの大きさのページにする
    W = imgW * 0.75 + m * 2;
    H = imgH * 0.75 + m * 2;
  } else {
    const landscape = mode === "landscape" || (mode === "auto" && imgW > imgH);
    W = landscape ? A4.height : A4.width;
    H = landscape ? A4.width : A4.height;
  }
  const s = Math.min((W - m * 2) / imgW, (H - m * 2) / imgH);
  const w = imgW * s;
  const h = imgH * s;
  return { pageWidth: W, pageHeight: H, x: (W - w) / 2, y: (H - h) / 2, width: w, height: h };
}
