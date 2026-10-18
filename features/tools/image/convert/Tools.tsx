"use client";

import { useEffect, useRef, useState } from "react";
import { FileDrop } from "@/components/FileDrop";
import { Choice } from "@/components/TextTransform";
import { Field, FieldGrid } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { baseName, formatBytes, saveBlob, saveZip } from "@/lib/files";
import { EXTENSION, isImageFile, loadImage, renderImage, type LoadedImage, type OutputFormat } from "@/lib/image";

type Item = { id: number; file: File; src?: LoadedImage; error?: string };
type Output = { blob: Blob; url: string; width: number; height: number; name: string };
type Preset = { format: OutputFormat; maxWidth: number | ""; maxHeight: number | ""; quality: number };

const PRESETS: Record<"convert" | "resize" | "compress" | "bulk", Preset> = {
  convert: { format: "image/jpeg", maxWidth: "", maxHeight: "", quality: 92 },
  resize: { format: "image/jpeg", maxWidth: 1280, maxHeight: "", quality: 90 },
  compress: { format: "image/jpeg", maxWidth: 1600, maxHeight: "", quality: 75 },
  bulk: { format: "image/jpeg", maxWidth: 1080, maxHeight: 1080, quality: 85 },
};

let nextId = 1;

function ImageTool({ preset }: { preset: keyof typeof PRESETS }) {
  const [items, setItems] = useState<Item[]>([]);
  const [o, setO] = useState<Preset>(PRESETS[preset]);
  const [outputs, setOutputs] = useState<Map<number, Output>>(new Map());
  const [busy, setBusy] = useState("");
  const urls = useRef<string[]>([]);

  const add = async (files: File[]) => {
    const list = files.filter(isImageFile);
    if (list.length === 0) {
      setBusy("画像ファイルを選んでください");
      return;
    }
    const added: Item[] = [];
    for (const [i, file] of list.entries()) {
      setBusy(`読み込み中… ${i + 1} / ${list.length}${/\.hei[cf]$/i.test(file.name) ? "（HEICの変換には少し時間がかかります）" : ""}`);
      try {
        added.push({ id: nextId++, file, src: await loadImage(file) });
      } catch (e) {
        added.push({ id: nextId++, file, error: (e as Error).message });
      }
    }
    setBusy("");
    setItems((prev) => [...prev, ...added]);
  };

  // 画像か設定が変わったら書き出し直す
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = new Map<number, Output>();
      for (const it of items) {
        if (!it.src) continue;
        const r = await renderImage(it.src, { format: o.format, quality: o.quality / 100, maxWidth: o.maxWidth || undefined, maxHeight: o.maxHeight || undefined });
        // Safari は WebP の書き出しに対応していないことがあり、そのときは PNG になる
        const ext = EXTENSION[(r.blob.type as OutputFormat) || o.format] ?? "png";
        next.set(it.id, { ...r, url: URL.createObjectURL(r.blob), name: `${baseName(it.file.name)}.${ext}` });
      }
      if (cancelled) {
        next.forEach((x) => URL.revokeObjectURL(x.url));
        return;
      }
      urls.current.forEach((u) => URL.revokeObjectURL(u));
      urls.current = [...next.values()].map((x) => x.url);
      setOutputs(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [items, o]);

  const done = items.map((it) => ({ it, out: outputs.get(it.id) })).filter((x) => x.out);
  const total = { before: done.reduce((a, x) => a + x.it.file.size, 0), after: done.reduce((a, x) => a + x.out!.blob.size, 0) };
  const sizeInput = (k: "maxWidth" | "maxHeight", label: string) => (
    <Field label={label}>
      <input className={ui.input} type="number" inputMode="numeric" min={16} placeholder="元のまま" value={o[k]} onChange={(e) => setO({ ...o, [k]: e.target.value === "" ? "" : Math.max(16, Number(e.target.value)) })} />
    </Field>
  );

  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="画像" accept="image/*,.heic,.heif" multiple onFiles={add} hint="JPG・PNG・WebP・GIF・BMP・SVG・HEIC（iPhoneの写真）に対応" />
      <FieldGrid>
        <Choice
          label="変換後の形式"
          value={o.format}
          onChange={(v) => setO({ ...o, format: v })}
          options={[
            ["image/jpeg", "JPG（写真向け・軽い）"],
            ["image/png", "PNG（図・透明部分を残す）"],
            ["image/webp", "WebP（Web向け・より軽い）"],
          ]}
        />
        {sizeInput("maxWidth", "最大の幅（px・空欄で元のまま）")}
        {sizeInput("maxHeight", "最大の高さ（px・空欄で元のまま）")}
        <Field label={`画質：${o.quality}%（JPG・WebP）`}>
          <input type="range" min={30} max={100} value={o.quality} onChange={(e) => setO({ ...o, quality: Number(e.target.value) })} className="accent-accent" disabled={o.format === "image/png"} />
        </Field>
      </FieldGrid>
      {busy && (
        <p className="text-sm text-muted" aria-live="polite">
          {busy}
        </p>
      )}
      {items.length > 0 && (
        <>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => {
              const out = outputs.get(it.id);
              const pct = out ? Math.round((1 - out.blob.size / it.file.size) * 100) : 0;
              return (
                <li key={it.id} className="flex flex-col gap-2 rounded-xl border border-line bg-panel p-3">
                  <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-lg bg-field">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {out ? <img src={out.url} alt={out.name} className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-muted">{it.error ?? "変換中…"}</span>}
                  </div>
                  <span className="truncate text-sm font-medium" title={it.file.name}>
                    {out?.name ?? it.file.name}
                  </span>
                  {out && it.src && (
                    <span className="text-xs text-muted tabular-nums">
                      {it.src.width}×{it.src.height} → {out.width}×{out.height}
                      <br />
                      {formatBytes(it.file.size)} → <b className={pct > 0 ? "text-ok" : "text-ink"}>{formatBytes(out.blob.size)}</b>
                      {pct > 0 ? `（−${pct}%）` : pct < 0 ? `（+${-pct}%）` : ""}
                    </span>
                  )}
                  <div className="flex gap-2">
                    <button type="button" className={ui.buttonPrimary} disabled={!out} onClick={() => out && saveBlob(out.name, out.blob)}>
                      保存
                    </button>
                    <button type="button" className={ui.button} onClick={() => setItems(items.filter((x) => x.id !== it.id))}>
                      削除
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={ui.buttonPrimary} disabled={done.length < 2} onClick={() => saveZip("images.zip", done.map((x) => ({ name: x.out!.name, data: x.out!.blob })))}>
              すべて保存（ZIP）
            </button>
            <button type="button" className={ui.button} onClick={() => setItems([])}>
              一覧を空にする
            </button>
            {done.length > 0 && (
              <span className="text-xs text-muted tabular-nums">
                合計 {formatBytes(total.before)} → {formatBytes(total.after)}
              </span>
            )}
          </div>
        </>
      )}
      <p className={ui.note}>画像はサーバーに送らず、この端末の中だけで変換します。写真の位置情報などのメタデータは、変換すると取り除かれます。</p>
    </div>
  );
}

export const ImageConvert = () => <ImageTool preset="convert" />;
export const ImageResize = () => <ImageTool preset="resize" />;
export const ImageCompress = () => <ImageTool preset="compress" />;
export const BulkImageResize = () => <ImageTool preset="bulk" />;
