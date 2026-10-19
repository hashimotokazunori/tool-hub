"use client";

import { useState } from "react";
import { FileDrop } from "@/components/FileDrop";
import { Choice } from "@/components/TextTransform";
import { Field, FieldGrid, Stats } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { baseName, formatBytes, saveBlob, saveZip } from "@/lib/files";
import { isImageFile, loadImage, renderImage, type LoadedImage } from "@/lib/image";
import { parsePageRange, placeImage, type PageMode } from "./logic";

const isPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);
const pdfLib = () => import("pdf-lib");
async function pdfjs() {
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return lib;
}
const pdfBlob = (bytes: Uint8Array) => new Blob([bytes as BlobPart], { type: "application/pdf" });

/** 並べ替え・削除ボタン付きのファイル一覧 */
function FileList<T extends { id: number; name: string; meta: string }>({ items, onChange }: { items: T[]; onChange: (items: T[]) => void }) {
  const move = (i: number, d: number) => {
    const a = [...items];
    [a[i], a[i + d]] = [a[i + d], a[i]];
    onChange(a);
  };
  return (
    <ol className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel">
      {items.map((it, i) => (
        <li key={it.id} className="flex items-center gap-3 px-3 py-2">
          <span className="w-6 text-right font-mono text-xs text-muted">{i + 1}</span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm">{it.name}</span>
            <span className="text-xs text-muted">{it.meta}</span>
          </span>
          <button type="button" className={`${ui.button} px-2 py-1`} disabled={i === 0} onClick={() => move(i, -1)} aria-label="上へ">
            ↑
          </button>
          <button type="button" className={`${ui.button} px-2 py-1`} disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="下へ">
            ↓
          </button>
          <button type="button" className={`${ui.button} px-2 py-1`} onClick={() => onChange(items.filter((x) => x.id !== it.id))} aria-label="削除">
            ×
          </button>
        </li>
      ))}
    </ol>
  );
}

let nextId = 1;
type PdfItem = { id: number; name: string; meta: string; bytes: Uint8Array; pages: number };

/** PDFの結合・分割・ページ抽出・回転 */
function PdfPages({ mode }: { mode: "merge" | "split" }) {
  const [items, setItems] = useState<PdfItem[]>([]);
  const [range, setRange] = useState("");
  const [rotate, setRotate] = useState<"0" | "90" | "180" | "270">("0");
  const [msg, setMsg] = useState("");
  const total = items.reduce((a, x) => a + x.pages, 0);

  const add = async (files: File[]) => {
    const { PDFDocument } = await pdfLib();
    const added: PdfItem[] = [];
    for (const f of files.filter(isPdf)) {
      try {
        const bytes = new Uint8Array(await f.arrayBuffer());
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        added.push({ id: nextId++, name: f.name, bytes, pages: doc.getPageCount(), meta: `${doc.getPageCount()}ページ・${formatBytes(f.size)}` });
      } catch {
        setMsg(`${f.name} は読み込めませんでした（壊れているか、パスワード付きの可能性があります）`);
      }
    }
    if (added.length === 0 && !files.some(isPdf)) setMsg("PDFファイルを選んでください");
    setItems((p) => [...p, ...added]);
  };

  /** 一覧の順につなげたときの、選んだページ（[文書, ページ番号]） */
  const selected = async () => {
    const { PDFDocument } = await pdfLib();
    const docs = await Promise.all(items.map((it) => PDFDocument.load(it.bytes, { ignoreEncryption: true })));
    const all = docs.flatMap((d) => d.getPageIndices().map((p) => [d, p] as const));
    const r = parsePageRange(range, all.length);
    if ("error" in r) throw new Error(r.error);
    return r.pages.map((i) => all[i]);
  };
  const build = async (pages: Awaited<ReturnType<typeof selected>>) => {
    const { PDFDocument, degrees } = await pdfLib();
    const out = await PDFDocument.create();
    for (const [d, p] of pages) {
      const [page] = await out.copyPages(d, [p]);
      if (rotate !== "0") page.setRotation(degrees((page.getRotation().angle + Number(rotate)) % 360));
      out.addPage(page);
    }
    return out.save();
  };
  const run = async (kind: "merge" | "split") => {
    try {
      setMsg("作成中…");
      const pages = await selected();
      if (kind === "merge") {
        const bytes = await build(pages);
        saveBlob(items.length === 1 ? `${baseName(items[0].name)}_edited.pdf` : "merged.pdf", pdfBlob(bytes));
        setMsg(`${pages.length}ページのPDFを作りました（${formatBytes(bytes.length)}）`);
      } else {
        const files = [];
        for (const [k, pg] of pages.entries()) files.push({ name: `page_${String(k + 1).padStart(3, "0")}.pdf`, data: pdfBlob(await build([pg])) });
        await saveZip("split_pages.zip", files);
        setMsg(`${files.length}個のPDFに分けて、ZIPで保存しました`);
      }
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="PDF" accept="application/pdf,.pdf" multiple onFiles={add} />
      {items.length > 0 && <FileList items={items} onChange={setItems} />}
      <FieldGrid>
        <Field label="使うページ（空欄ですべて・例：1-3, 5, 8-）">
          <input className={ui.input} value={range} onChange={(e) => setRange(e.target.value)} placeholder="例：1-3, 5" />
        </Field>
        <Choice label="回転" value={rotate} onChange={setRotate} options={[["0", "そのまま"], ["90", "右に90°"], ["180", "180°"], ["270", "左に90°"]]} />
      </FieldGrid>
      <p className={ui.note}>ページ番号は、上の一覧の順につなげたときの通し番号です（全{total}ページ）。</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={mode === "merge" ? ui.buttonPrimary : ui.button} disabled={!items.length} onClick={() => run("merge")}>
          {items.length > 1 ? "結合して保存" : "選んだページで保存"}
        </button>
        <button type="button" className={mode === "split" ? ui.buttonPrimary : ui.button} disabled={!items.length} onClick={() => run("split")}>
          1ページずつ分割（ZIP）
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {msg}
        </span>
      </div>
      <p className={ui.note}>PDFはサーバーに送らず、この端末の中だけで処理します。</p>
    </div>
  );
}
export const PdfMerge = () => <PdfPages mode="merge" />;
export const PdfSplit = () => <PdfPages mode="split" />;

type ImgItem = { id: number; name: string; meta: string; src: LoadedImage };

/** 画像をPDFにまとめる */
export function ImageToPdf() {
  const [items, setItems] = useState<ImgItem[]>([]);
  const [mode, setMode] = useState<PageMode>("auto");
  const [margin, setMargin] = useState<"0" | "10" | "20">("10");
  const [quality, setQuality] = useState<"0.75" | "0.88" | "0.95">("0.88");
  const [msg, setMsg] = useState("");
  const add = async (files: File[]) => {
    const added: ImgItem[] = [];
    for (const [i, f] of files.filter(isImageFile).entries()) {
      setMsg(`読み込み中… ${i + 1}`);
      try {
        const src = await loadImage(f);
        added.push({ id: nextId++, name: f.name, src, meta: `${src.width}×${src.height}・${formatBytes(f.size)}` });
      } catch (e) {
        setMsg(`${f.name}：${(e as Error).message}`);
      }
    }
    setMsg("");
    setItems((p) => [...p, ...added]);
  };
  const run = async () => {
    try {
      setMsg("PDFを作成中…");
      const { PDFDocument } = await pdfLib();
      const doc = await PDFDocument.create();
      for (const it of items) {
        const r = await renderImage(it.src, { maxWidth: 2400, maxHeight: 2400, format: "image/jpeg", quality: Number(quality) });
        const jpg = await doc.embedJpg(new Uint8Array(await r.blob.arrayBuffer()));
        const p = placeImage(r.width, r.height, mode, Number(margin));
        doc.addPage([p.pageWidth, p.pageHeight]).drawImage(jpg, { x: p.x, y: p.y, width: p.width, height: p.height });
      }
      const bytes = await doc.save();
      saveBlob("images.pdf", pdfBlob(bytes));
      setMsg(`${items.length}ページのPDFを作りました（${formatBytes(bytes.length)}）`);
    } catch (e) {
      setMsg(`作成できませんでした：${(e as Error).message}`);
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="画像" accept="image/*,.heic,.heif" multiple onFiles={add} hint="スマホで撮った書類の写真も使えます（HEIC対応）" />
      {items.length > 0 && <FileList items={items} onChange={setItems} />}
      <FieldGrid>
        <Choice label="用紙" value={mode} onChange={setMode} options={[["auto", "A4（画像の向きに合わせる）"], ["portrait", "A4 縦"], ["landscape", "A4 横"], ["fit", "画像と同じ大きさ"]]} />
        <Choice label="余白" value={margin} onChange={setMargin} options={[["0", "なし"], ["10", "10mm"], ["20", "20mm"]]} />
        <Choice label="画質" value={quality} onChange={setQuality} options={[["0.75", "軽量"], ["0.88", "標準"], ["0.95", "高画質"]]} />
      </FieldGrid>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} disabled={!items.length} onClick={run}>
          PDFを作成して保存
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {msg}
        </span>
      </div>
    </div>
  );
}

/** PDFを圧縮する（各ページを画像にして作り直す） */
export function PdfCompress() {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<"96,0.55" | "150,0.7" | "200,0.82">("150,0.7");
  const [gray, setGray] = useState(false);
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState<{ bytes: Uint8Array; before: number } | null>(null);
  const run = async () => {
    if (!file) return;
    try {
      setResult(null);
      const [dpi, q] = level.split(",").map(Number);
      const lib = await pdfjs();
      const { PDFDocument } = await pdfLib();
      const src = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
      const out = await PDFDocument.create();
      for (let i = 1; i <= src.numPages; i++) {
        setMsg(`圧縮中… ${i} / ${src.numPages} ページ`);
        const page = await src.getPage(i);
        const vp1 = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: dpi / 72 });
        const c = document.createElement("canvas");
        c.width = Math.floor(vp.width);
        c.height = Math.floor(vp.height);
        const g = c.getContext("2d")!;
        g.fillStyle = "#fff";
        g.fillRect(0, 0, c.width, c.height);
        // intent: "print" は画面の描画タイミング（requestAnimationFrame）を待たないので、別のタブを見ていても止まらない
        await page.render({ canvasContext: g, viewport: vp, intent: "print" }).promise;
        if (gray) {
          const im = g.getImageData(0, 0, c.width, c.height);
          const d = im.data;
          for (let k = 0; k < d.length; k += 4) d[k] = d[k + 1] = d[k + 2] = d[k] * 0.299 + d[k + 1] * 0.587 + d[k + 2] * 0.114;
          g.putImageData(im, 0, 0);
        }
        const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("ページを画像にできませんでした"))), "image/jpeg", q));
        const img = await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));
        out.addPage([vp1.width, vp1.height]).drawImage(img, { x: 0, y: 0, width: vp1.width, height: vp1.height });
      }
      const bytes = await out.save();
      setResult({ bytes, before: file.size });
      setMsg(bytes.length < file.size ? "圧縮できました" : "元のPDFのほうが小さいため、圧縮の必要はありません（文字中心のPDFはすでに軽いことが多いです）");
    } catch (e) {
      setMsg(`圧縮できませんでした：${(e as Error).message}`);
    }
  };
  const pct = result ? Math.round((1 - result.bytes.length / result.before) * 100) : 0;
  return (
    <div className="flex flex-col gap-4">
      <FileDrop
        label="PDF"
        accept="application/pdf,.pdf"
        onFiles={(fs) => {
          const f = fs.find(isPdf);
          setFile(f ?? null);
          setResult(null);
          setMsg(f ? `${f.name}（${formatBytes(f.size)}）を圧縮できます` : "PDFファイルを選んでください");
        }}
      />
      <FieldGrid>
        <Choice label="圧縮の強さ" value={level} onChange={setLevel} options={[["96,0.55", "強い（画面で読む用・96dpi）"], ["150,0.7", "ふつう（150dpi）"], ["200,0.82", "弱い（印刷向け・200dpi）"]]} />
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-accent" checked={gray} onChange={(e) => setGray(e.target.checked)} />
          白黒（グレー）にしてさらに軽くする
        </label>
      </FieldGrid>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} disabled={!file} onClick={run}>
          圧縮する
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {msg}
        </span>
      </div>
      {result && (
        <>
          <Stats
            items={[
              { label: "元のサイズ", value: formatBytes(result.before) },
              { label: "圧縮後", value: formatBytes(result.bytes.length), emphasis: true },
              { label: "削減率", value: pct > 0 ? `−${pct}%` : "効果なし" },
            ]}
          />
          {pct > 0 && file && (
            <button type="button" className={`${ui.buttonPrimary} w-fit`} onClick={() => saveBlob(`${baseName(file.name)}_compressed.pdf`, pdfBlob(result.bytes))}>
              圧縮したPDFを保存
            </button>
          )}
        </>
      )}
      <p className={ui.note}>各ページを画像にして作り直すため、圧縮後のPDFでは文字の検索やコピーができなくなります。スキャンした書類や写真の多いPDFで効果が大きく出ます。</p>
    </div>
  );
}

type OrgPage = { id: number; index: number; turn: number; deleted: boolean; thumb: string };

/** PDFのページ整理：サムネイルを見ながら並べ替え・回転・削除 */
export function PdfOrganize() {
  const [file, setFile] = useState<{ name: string; bytes: Uint8Array } | null>(null);
  const [pages, setPages] = useState<OrgPage[]>([]);
  const [msg, setMsg] = useState("");

  const open = async (files: File[]) => {
    const f = files.find(isPdf);
    if (!f) return setMsg("PDFファイルを選んでください");
    try {
      setPages([]);
      const bytes = new Uint8Array(await f.arrayBuffer());
      const lib = await pdfjs();
      // pdf.js は渡したデータを使い切るので、保存用とは別にコピーを渡す
      const doc = await lib.getDocument({ data: bytes.slice(), isEvalSupported: false }).promise;
      if (doc.numPages > 300) setMsg("ページ数が多いため、表示に時間がかかります…");
      const list: OrgPage[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        setMsg(`ページを読み込み中… ${i} / ${doc.numPages}`);
        const page = await doc.getPage(i);
        const vp1 = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: 180 / Math.max(vp1.width, vp1.height) });
        const c = document.createElement("canvas");
        c.width = Math.ceil(vp.width);
        c.height = Math.ceil(vp.height);
        const g = c.getContext("2d")!;
        g.fillStyle = "#fff";
        g.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: g, viewport: vp, intent: "print" }).promise;
        list.push({ id: nextId++, index: i - 1, turn: 0, deleted: false, thumb: c.toDataURL("image/jpeg", 0.7) });
      }
      setFile({ name: f.name, bytes });
      setPages(list);
      setMsg("");
    } catch (e) {
      setMsg(`読み込めませんでした（パスワード付きか、壊れている可能性があります）：${(e as Error).message}`);
    }
  };

  const update = (id: number, patch: Partial<OrgPage>) => setPages((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const move = (i: number, d: number) =>
    setPages((ps) => {
      const a = [...ps];
      [a[i], a[i + d]] = [a[i + d], a[i]];
      return a;
    });
  const kept = pages.filter((p) => !p.deleted);
  const changed = pages.some((p, i) => p.deleted || p.turn !== 0 || p.index !== i);

  const save = async () => {
    if (!file || !kept.length) return;
    try {
      setMsg("保存中…");
      const { PDFDocument, degrees } = await pdfLib();
      const src = await PDFDocument.load(file.bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const copied = await out.copyPages(
        src,
        kept.map((p) => p.index),
      );
      copied.forEach((page, k) => {
        const t = kept[k].turn;
        if (t) page.setRotation(degrees((page.getRotation().angle + t) % 360));
        out.addPage(page);
      });
      const bytes = await out.save();
      saveBlob(`${baseName(file.name)}_organized.pdf`, pdfBlob(bytes));
      setMsg(`${kept.length}ページのPDFを保存しました（${formatBytes(bytes.length)}）`);
    } catch (e) {
      setMsg(`保存できませんでした：${(e as Error).message}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="PDF" accept="application/pdf,.pdf" onFiles={open} />
      {pages.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={ui.button} onClick={() => setPages((ps) => ps.map((p) => ({ ...p, turn: (p.turn + 90) % 360 })))}>
              全ページを右に90°
            </button>
            <button type="button" className={ui.button} onClick={() => setPages((ps) => [...ps].reverse())}>
              順番を逆にする
            </button>
            <button type="button" className={ui.button} disabled={!changed} onClick={() => setPages((ps) => [...ps].sort((a, b) => a.index - b.index).map((p) => ({ ...p, turn: 0, deleted: false })))}>
              最初の状態に戻す
            </button>
            <span className="text-sm text-muted">
              {kept.length} / {pages.length} ページを残す
            </span>
          </div>
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {pages.map((p, i) => (
              <li key={p.id} className={`flex flex-col gap-1.5 rounded-xl border p-2 ${p.deleted ? "border-warn/60 opacity-50" : "border-line"}`}>
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-field">
                  {/* eslint-disable-next-line @next/next/no-img-element -- 端末で描いたページの縮小画像 */}
                  <img src={p.thumb} alt={`元の${p.index + 1}ページ目`} className="max-h-[85%] max-w-[85%] shadow transition-transform" style={{ transform: `rotate(${p.turn}deg)` }} />
                </div>
                <span className="text-center text-xs text-muted">
                  {i + 1}番目（元の{p.index + 1}ページ）{p.deleted && "・削除"}
                </span>
                <div className="grid grid-cols-4 gap-1">
                  <button type="button" className={`${ui.button} px-1 py-1`} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`${i + 1}番目を前へ`}>
                    ←
                  </button>
                  <button type="button" className={`${ui.button} px-1 py-1`} disabled={i === pages.length - 1} onClick={() => move(i, 1)} aria-label={`${i + 1}番目を後ろへ`}>
                    →
                  </button>
                  <button type="button" className={`${ui.button} px-1 py-1`} onClick={() => update(p.id, { turn: (p.turn + 90) % 360 })} aria-label={`${i + 1}番目を右に90°回転`}>
                    ↻
                  </button>
                  <button type="button" className={`${ui.button} px-1 py-1`} onClick={() => update(p.id, { deleted: !p.deleted })} aria-label={p.deleted ? `${i + 1}番目の削除を取り消す` : `${i + 1}番目を削除`}>
                    {p.deleted ? "↩" : "×"}
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} disabled={!file || !kept.length} onClick={save}>
          この順番で保存
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {msg}
        </span>
      </div>
      <p className={ui.note}>← → で順番を、↻ で向きを変え、× で削除します（もう一度押すと元に戻ります）。文字やリンクはそのまま残ります。PDFはサーバーに送らず、この端末の中だけで処理します。</p>
    </div>
  );
}
