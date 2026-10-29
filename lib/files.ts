/** ファイルの保存・ZIP・大きさの表示（ブラウザ専用。クライアント部品から使う） */
import { setLastOutput } from "./handoff";

const TYPE_OF_EXT: Record<string, string> = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", csv: "text/csv", tsv: "text/tab-separated-values", json: "application/json", txt: "text/plain" };

/** ファイルを保存する（ブラウザのダウンロード） */
export function saveBlob(filename: string, data: Blob | Uint8Array | string, { remember = true }: { remember?: boolean } = {}) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: TYPE_OF_EXT[ext] ?? "" });
  // 「次のツールで使う」で渡せるように、保存した結果を覚えておく
  if (remember) setLastOutput(new File([blob], filename, { type: blob.type || TYPE_OF_EXT[ext] || "" }));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** 同じ名前が重ならないように「_2」などを付ける */
export function uniqueNames(names: string[]): string[] {
  const used = new Map<string, number>();
  return names.map((n) => {
    const count = (used.get(n) ?? 0) + 1;
    used.set(n, count);
    if (count === 1) return n;
    const dot = n.lastIndexOf(".");
    return dot > 0 ? `${n.slice(0, dot)}_${count}${n.slice(dot)}` : `${n}_${count}`;
  });
}

/** 複数のファイルをZIPにまとめて保存する */
export async function saveZip(zipName: string, files: { name: string; data: Blob | Uint8Array | string }[]) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const names = uniqueNames(files.map((f) => f.name));
  files.forEach((f, i) => zip.file(names[i], f.data));
  saveBlob(zipName, await zip.generateAsync({ type: "blob" }));
}

export function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(2)} MB`;
}

export const baseName = (name: string) => name.replace(/\.[^.]+$/, "");
