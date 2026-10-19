/** ファビコン作成の純粋な部分（ICOファイルの組み立て・HTMLのタグ・webmanifest） */

/** 書き出すPNGの大きさと、ファイル名 */
export const FAVICON_FILES: { size: number; name: string; note: string }[] = [
  { size: 16, name: "favicon-16x16.png", note: "ブラウザのタブ" },
  { size: 32, name: "favicon-32x32.png", note: "タブ（高解像度）・ブックマーク" },
  { size: 48, name: "favicon-48x48.png", note: "Windows・検索結果" },
  { size: 180, name: "apple-touch-icon.png", note: "iPhone・iPadのホーム画面" },
  { size: 192, name: "android-chrome-192x192.png", note: "Androidのホーム画面" },
  { size: 512, name: "android-chrome-512x512.png", note: "アプリとして追加・起動画面" },
];

/** favicon.ico に入れる大きさ */
export const ICO_SIZES = [16, 32, 48];

/**
 * PNG画像を入れた ICO ファイルを作る（Windows Vista 以降・すべての主要ブラウザが読める形式）。
 * 形：ICONDIR（6バイト）＋ ICONDIRENTRY（16バイト×枚数）＋ PNGのデータ。数値はリトルエンディアン。
 */
export function buildIco(images: { size: number; png: Uint8Array }[]): Uint8Array {
  const headerSize = 6 + 16 * images.length;
  const total = headerSize + images.reduce((s, i) => s + i.png.length, 0);
  const out = new Uint8Array(total);
  const v = new DataView(out.buffer);
  v.setUint16(0, 0, true); // 予約（0）
  v.setUint16(2, 1, true); // 種類（1 = アイコン）
  v.setUint16(4, images.length, true); // 枚数
  let offset = headerSize;
  images.forEach((img, i) => {
    const e = 6 + 16 * i;
    const dim = img.size >= 256 ? 0 : img.size; // 256px は 0 と書く決まり
    v.setUint8(e, dim); // 幅
    v.setUint8(e + 1, dim); // 高さ
    v.setUint8(e + 2, 0); // パレットの色数（なし）
    v.setUint8(e + 3, 0); // 予約
    v.setUint16(e + 4, 1, true); // カラープレーン
    v.setUint16(e + 6, 32, true); // 1ピクセルのビット数
    v.setUint32(e + 8, img.png.length, true); // データの大きさ
    v.setUint32(e + 12, offset, true); // データの位置
    out.set(img.png, offset);
    offset += img.png.length;
  });
  return out;
}

/** ICO の中身を読む（確認用） */
export function readIcoEntries(bytes: Uint8Array): { width: number; height: number; size: number; offset: number }[] | null {
  if (bytes.length < 6) return null;
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (v.getUint16(0, true) !== 0 || v.getUint16(2, true) !== 1) return null;
  const n = v.getUint16(4, true);
  if (bytes.length < 6 + 16 * n) return null;
  return Array.from({ length: n }, (_, i) => {
    const e = 6 + 16 * i;
    return { width: v.getUint8(e) || 256, height: v.getUint8(e + 1) || 256, size: v.getUint32(e + 8, true), offset: v.getUint32(e + 12, true) };
  });
}

/** <head> に貼るタグ。ファイルはサイトのいちばん上（ルート）に置く前提 */
export function faviconHtml(): string {
  return [
    `<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">`,
    `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">`,
    `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">`,
    `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`,
    `<link rel="manifest" href="/site.webmanifest">`,
  ].join("\n");
}

/** site.webmanifest（Androidのホーム画面に追加したときの名前・アイコン・色） */
export function webManifest(opts: { name: string; shortName: string; themeColor: string; backgroundColor: string }): string {
  const name = opts.name.trim() || "My Site";
  return JSON.stringify(
    {
      name,
      short_name: opts.shortName.trim() || name,
      icons: [
        { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      theme_color: opts.themeColor,
      background_color: opts.backgroundColor,
      display: "standalone",
    },
    null,
    2,
  );
}

/** 文字を正方形に収める大きさ（px）。measuredWidth は 100px で測った幅 */
export function fitFontSize(size: number, measuredWidthAt100: number, scale = 0.78): number {
  const byHeight = size * scale;
  if (measuredWidthAt100 <= 0) return byHeight;
  const byWidth = (size * 0.86 * 100) / measuredWidthAt100;
  return Math.min(byHeight, byWidth);
}
