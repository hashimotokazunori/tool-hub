/**
 * ツールの結果を、次のツールへそのまま渡す（ブラウザの中だけ。サーバーには送らない）。
 * 保存したファイル（saveBlob）を覚えておき、「次のツールで使う」を押すと次のツールの FileDrop が読み込む。
 * ページを移るときは Next.js の画面切り替えなので、このモジュールの値は消えない。
 */

let lastOutput: File | null = null;
let pending: File[] | null = null;
const listeners = new Set<() => void>();

/** いちばん新しく保存した結果 */
export const getLastOutput = () => lastOutput;

export function setLastOutput(file: File) {
  lastOutput = file;
  listeners.forEach((l) => l());
}

export function clearLastOutput() {
  lastOutput = null;
  listeners.forEach((l) => l());
}

export function onOutputChange(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** 次のツールに渡すファイルを置く */
export function handOff(files: File[]) {
  pending = files;
}

/** 渡されたファイルを受け取る（受け取ったら消える）。accept に合わないファイルは受け取らない */
export function takeHandoff(accept?: string): File[] | null {
  if (!pending) return null;
  const files = pending.filter((f) => matchesAccept(f, accept));
  pending = null;
  return files.length ? files : null;
}

/** input の accept（"image/*,.pdf" など）に合うか */
export function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  return accept.split(",").some((a) => {
    const t = a.trim().toLowerCase();
    if (!t) return false;
    if (t.startsWith(".")) return name.endsWith(t);
    if (t.endsWith("/*")) return file.type.startsWith(t.slice(0, -1));
    return file.type === t;
  });
}

/** ファイルの種類ごとに、続けて使えるツール */
export function nextToolsFor(file: File): { slug: string; name: string }[] {
  const n = file.name.toLowerCase();
  if (file.type === "application/pdf" || n.endsWith(".pdf"))
    return [
      { slug: "pdf-compress", name: "PDF容量の最適化" },
      { slug: "pdf-merge", name: "PDF結合" },
      { slug: "pdf-split", name: "PDF分割" },
      { slug: "pdf-to-image", name: "PDF画像化" },
    ];
  if (file.type.startsWith("image/"))
    return [
      { slug: "image-compress", name: "画像圧縮" },
      { slug: "image-resize", name: "画像リサイズ" },
      { slug: "image-crop", name: "画像トリミング" },
      { slug: "image-to-pdf", name: "画像からPDF作成" },
      { slug: "image-mosaic", name: "モザイク・ぼかし" },
    ];
  if (n.endsWith(".csv") || n.endsWith(".tsv") || file.type === "text/csv")
    return [
      { slug: "csv-dedupe", name: "CSVの重複行削除" },
      { slug: "csv-columns", name: "CSV列の抽出" },
      { slug: "csv-encoding", name: "CSV文字コード変換" },
      { slug: "csv-to-json", name: "CSVをJSONに変換" },
    ];
  return [];
}
