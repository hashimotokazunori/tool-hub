/**
 * PDF編集の座標の計算。
 *
 * 画面の座標（表示座標）は、回転を反映して表示したページの左上を原点に、右と下が正、単位はポイント（1/72インチ）。
 * PDFの座標（ユーザー空間）は、回転前のページの左下が原点で上が正。view は表示範囲（CropBox）の [x0, y0, x1, y1]。
 * ページの回転（/Rotate）は、表示するときに時計回りに回す角度。
 */

export type View = [number, number, number, number];
export type Rotation = 0 | 90 | 180 | 270;
export type Rect = { x: number; y: number; w: number; h: number };

/** -90 や 450 のような回転を 0・90・180・270 にそろえる */
export function normRotation(r: number): Rotation {
  const n = (((Math.round(r / 90) * 90) % 360) + 360) % 360;
  return n as Rotation;
}

/** 表示したときのページの大きさ（90°・270°では幅と高さが入れ替わる） */
export function displaySize(view: View, rotation: Rotation): { width: number; height: number } {
  const w = view[2] - view[0];
  const h = view[3] - view[1];
  return rotation === 90 || rotation === 270 ? { width: h, height: w } : { width: w, height: h };
}

/** PDFの座標 → 表示座標（pdf.js の viewport と同じ変換で、倍率1のもの） */
export function pdfToDisplay(view: View, rotation: Rotation, px: number, py: number): [number, number] {
  const [x0, y0, x1, y1] = view;
  switch (rotation) {
    case 0:
      return [px - x0, y1 - py];
    case 90:
      return [py - y0, px - x0];
    case 180:
      return [x1 - px, py - y0];
    case 270:
      return [y1 - py, x1 - px];
  }
}

/** 表示座標 → PDFの座標 */
export function displayToPdf(view: View, rotation: Rotation, dx: number, dy: number): [number, number] {
  const [x0, y0, x1, y1] = view;
  switch (rotation) {
    case 0:
      return [x0 + dx, y1 - dy];
    case 90:
      return [x0 + dy, y0 + dx];
    case 180:
      return [x1 - dx, y0 + dy];
    case 270:
      return [x1 - dy, y1 - dx];
  }
}

/** 表示上の四角形を、PDFの座標の四角形（左下の点と幅・高さ）にする。修正テープ（白い四角）に使う */
export function rectToPdf(view: View, rotation: Rotation, r: Rect): { x: number; y: number; width: number; height: number } {
  const [ax, ay] = displayToPdf(view, rotation, r.x, r.y);
  const [bx, by] = displayToPdf(view, rotation, r.x + r.w, r.y + r.h);
  return { x: Math.min(ax, bx), y: Math.min(ay, by), width: Math.abs(bx - ax), height: Math.abs(by - ay) };
}

/**
 * 表示上の四角形に、画像を正しい向きで描くための pdf-lib の drawImage の値。
 * 画像は (x, y) を左下の角として、反時計回りに rotate 度回して描かれる。
 * ページが時計回りに回って表示されるので、同じ角度だけ逆に回しておくと、表示したときにまっすぐになる。
 */
export function imagePlacement(view: View, rotation: Rotation, r: Rect): { x: number; y: number; width: number; height: number; rotate: number } {
  // 画像の左下の角＝表示上の四角形の左下の角
  const [x, y] = displayToPdf(view, rotation, r.x, r.y + r.h);
  return { x, y, width: r.w, height: r.h, rotate: rotation };
}

/** ドラッグした2点から四角形を作る */
export function rectFromPoints(ax: number, ay: number, bx: number, by: number): Rect {
  return { x: Math.min(ax, bx), y: Math.min(ay, by), w: Math.abs(bx - ax), h: Math.abs(by - ay) };
}

/** 四角形がページからはみ出さないように位置を直す（大きすぎるときはページに合わせて縮める） */
export function clampRect(r: Rect, width: number, height: number): Rect {
  const w = Math.min(r.w, width);
  const h = Math.min(r.h, height);
  return { x: Math.min(Math.max(0, r.x), width - w), y: Math.min(Math.max(0, r.y), height - h), w, h };
}

/** 右下の角をドラッグして大きさを変える。aspect を渡すと縦横の比を保つ。最小の大きさは min ポイント */
export function resizeRect(r: Rect, newW: number, newH: number, pageW: number, pageH: number, aspect?: number, min = 6): Rect {
  let w = Math.max(min, Math.min(newW, pageW - r.x));
  let h = Math.max(min, Math.min(newH, pageH - r.y));
  if (aspect) {
    // 幅に合わせて高さを決め、はみ出すなら高さに合わせる
    h = w / aspect;
    if (r.y + h > pageH) {
      h = pageH - r.y;
      w = h * aspect;
    }
    if (h < min) {
      h = min;
      w = h * aspect;
    }
  }
  return { ...r, w, h };
}

/** 文字の行の高さ（文字の大きさに対する倍率）と、まわりの余白 */
export const LINE_HEIGHT = 1.4;
export const TEXT_PADDING = 0.15;

/** 複数行の文字を置く枠の大きさ（ポイント）。lineWidths は文字の大きさ1ptあたりの各行の幅 */
export function textBoxSize(lineWidths: number[], fontSize: number): { w: number; h: number } {
  const lines = Math.max(1, lineWidths.length);
  const maxW = Math.max(0, ...lineWidths);
  const pad = fontSize * TEXT_PADDING;
  return { w: maxW * fontSize + pad * 2, h: lines * fontSize * LINE_HEIGHT + pad * 2 };
}

/** 文字を画像にするときの解像度の倍率（1pt あたりのピクセル数）。大きすぎる画像にならないよう抑える */
export function textRenderScale(wPt: number, hPt: number, preferred = 4, maxPixels = 8000): number {
  return Math.max(1, Math.min(preferred, maxPixels / Math.max(wPt, 1), maxPixels / Math.max(hPt, 1)));
}
