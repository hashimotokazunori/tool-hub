"use client";

import { useState } from "react";
import { FileDrop } from "@/components/FileDrop";
import { Choice } from "@/components/TextTransform";
import { Field, FieldGrid } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { baseName, formatBytes, saveBlob, saveZip } from "@/lib/files";
import { parsePageRange } from "../logic";
import { pageFileName, renderScale } from "./logic";

const isPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);
async function pdfjs() {
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return lib;
}

type Format = "image/jpeg" | "image/png";

/** PDFのページを画像（JPEG・PNG）にする */
export function PdfToImage() {
  const [file, setFile] = useState<{ file: File; pages: number } | null>(null);
  const [range, setRange] = useState("");
  const [dpi, setDpi] = useState<"72" | "150" | "300">("150");
  const [format, setFormat] = useState<Format>("image/jpeg");
  const [msg, setMsg] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const open = async (files: File[]) => {
    const f = files.find(isPdf);
    if (!f) return setMsg("PDFファイルを選んでください");
    try {
      setMsg("読み込み中…");
      const lib = await pdfjs();
      const doc = await lib.getDocument({ data: new Uint8Array(await f.arrayBuffer()), isEvalSupported: false }).promise;
      setFile({ file: f, pages: doc.numPages });
      await doc.destroy();
      setRange("");
      setMsg(`${f.name}（${doc.numPages}ページ・${formatBytes(f.size)}）`);
    } catch (e) {
      setFile(null);
      setMsg(`読み込めませんでした（パスワード付きか、壊れている可能性があります）：${(e as Error).message}`);
    }
  };

  const parsed = file ? parsePageRange(range, file.pages) : null;
  const pages = parsed && "pages" in parsed ? parsed.pages : [];
  const busy = progress !== null;

  const run = async () => {
    if (!file || !pages.length) return;
    try {
      const lib = await pdfjs();
      const doc = await lib.getDocument({ data: new Uint8Array(await file.file.arrayBuffer()), isEvalSupported: false }).promise;
      const ext = format === "image/png" ? "png" : "jpg";
      const base = baseName(file.file.name);
      const out: { name: string; data: Blob }[] = [];
      let reduced = false;
      setProgress({ done: 0, total: pages.length });
      for (const [k, index] of pages.entries()) {
        setMsg(`画像にしています… ${k + 1} / ${pages.length} ページ`);
        const page = await doc.getPage(index + 1);
        const vp1 = page.getViewport({ scale: 1 });
        const s = renderScale(vp1.width, vp1.height, Number(dpi));
        reduced ||= s.reduced;
        const vp = page.getViewport({ scale: s.scale });
        const c = document.createElement("canvas");
        c.width = s.width;
        c.height = s.height;
        const g = c.getContext("2d")!;
        // PDFの白い紙の部分は透明なので、白で塗ってから描く
        g.fillStyle = "#fff";
        g.fillRect(0, 0, c.width, c.height);
        // intent: "print" は画面の描画タイミング（requestAnimationFrame）を待たないので、別のタブを見ていても止まらない
        await page.render({ canvasContext: g, viewport: vp, intent: "print" }).promise;
        const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("ページを画像にできませんでした"))), format, 0.92));
        out.push({ name: pageFileName(base, index, file.pages, ext), data: blob });
        // メモリを早めに返す
        c.width = c.height = 0;
        page.cleanup();
        setProgress({ done: k + 1, total: pages.length });
      }
      await doc.destroy();
      if (out.length === 1) saveBlob(out[0].name, out[0].data);
      else {
        setMsg("ZIPにまとめています…");
        await saveZip(`${base}_images.zip`, out);
      }
      const total = out.reduce((a, f) => a + f.data.size, 0);
      setMsg(`${out.length}枚を保存しました（合計 ${formatBytes(total)}）${reduced ? "。大きな用紙のページは、端末で扱える大きさまで解像度を下げました" : ""}`);
    } catch (e) {
      setMsg(`画像にできませんでした：${(e as Error).message}`);
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="PDF" accept="application/pdf,.pdf" onFiles={open} />
      <FieldGrid>
        <Field label={`ページ（空欄ですべて${file ? `・全${file.pages}ページ` : ""}）`}>
          <input className={ui.input} value={range} placeholder="例：1-3, 5" onChange={(e) => setRange(e.target.value)} disabled={!file} />
        </Field>
        <Choice
          label="解像度"
          value={dpi}
          onChange={setDpi}
          options={[
            ["72", "72dpi（画面で見る・軽い）"],
            ["150", "150dpi（標準）"],
            ["300", "300dpi（印刷向け・重い）"],
          ]}
        />
        <Choice
          label="画像の形式"
          value={format}
          onChange={setFormat}
          options={[
            ["image/jpeg", "JPEG（写真向け・軽い）"],
            ["image/png", "PNG（文字や図がくっきり）"],
          ]}
        />
      </FieldGrid>
      {parsed && "error" in parsed && (
        <p className="text-sm text-warn" role="alert">
          {parsed.error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} disabled={!file || !pages.length || busy} onClick={run}>
          {pages.length > 1 ? `${pages.length}ページを画像にして保存（ZIP）` : "画像にして保存"}
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {msg}
        </span>
      </div>
      {progress && (
        <progress className="h-2 w-full accent-accent" max={progress.total} value={progress.done} aria-label="変換の進み具合">
          {progress.done} / {progress.total}
        </progress>
      )}
      <p className={ui.note}>PDFはサーバーに送らず、この端末の中だけで画像にします。1ページだけならそのまま、複数ページならZIPにまとめて保存します。300dpiはファイルが大きくなり、時間もかかります。</p>
    </div>
  );
}
