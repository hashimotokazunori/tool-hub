/** PDF画像化の純粋な計算部分 */

/** スマホのブラウザでも描けるキャンバスの画素数の上限（iOS Safari は約1677万画素） */
export const MAX_PIXELS = 16_000_000;

/**
 * 解像度（dpi）から描画の倍率を決める。PDF の 1pt は 1/72 インチ。
 * 大きな用紙で画素数が上限を超えるときは、上限に収まるまで倍率を下げる。
 */
export function renderScale(widthPt: number, heightPt: number, dpi: number, maxPixels = MAX_PIXELS): { scale: number; width: number; height: number; reduced: boolean } {
  let scale = dpi / 72;
  let reduced = false;
  if (widthPt * scale * heightPt * scale > maxPixels) {
    scale = Math.sqrt(maxPixels / (widthPt * heightPt));
    reduced = true;
  }
  return { scale, width: Math.floor(widthPt * scale), height: Math.floor(heightPt * scale), reduced };
}

/** 書き出すファイル名。ページ番号は桁をそろえる（例 資料_p01.jpg） */
export function pageFileName(base: string, pageIndex: number, totalPages: number, ext: string): string {
  const digits = String(totalPages).length;
  return `${base}_p${String(pageIndex + 1).padStart(Math.max(2, digits), "0")}.${ext}`;
}
