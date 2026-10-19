"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { FileDrop } from "@/components/FileDrop";
import { Choice } from "@/components/TextTransform";
import { Stats } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { baseName, formatBytes, saveBlob, saveZip } from "@/lib/files";
import { EXTENSION, isImageFile, loadImage, type LoadedImage, type OutputFormat } from "@/lib/image";
import { RATIOS, clampBox, initialBox, resizeBox, rotatedSize, roundBox, turnBy, type Box, type Turn } from "./logic";

/** 元の形式に近い書き出し形式（PNG・WebP はそのまま、それ以外は JPEG） */
const formatFor = (f: File): OutputFormat => (f.type === "image/png" ? "image/png" : f.type === "image/webp" ? "image/webp" : "image/jpeg");

function toBlob(c: HTMLCanvasElement, format: OutputFormat, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("画像を書き出せませんでした"))), format, quality));
}

/** 白で塗ってから描く（JPEG は透明を扱えないため） */
function canvasFor(width: number, height: number, format: OutputFormat) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const g = c.getContext("2d")!;
  if (format === "image/jpeg") {
    g.fillStyle = "#fff";
    g.fillRect(0, 0, width, height);
  }
  g.imageSmoothingQuality = "high";
  return { c, g };
}

const FORMATS: [OutputFormat, string][] = [
  ["image/jpeg", "JPEG"],
  ["image/png", "PNG"],
  ["image/webp", "WebP"],
];

type Drag = { mode: "move" | "resize"; startX: number; startY: number; box: Box; scale: number };

/** 画像トリミング：比率を選び、枠を動かして切り抜く */
export function ImageCrop() {
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<LoadedImage | null>(null);
  const [ratioId, setRatioId] = useState("1:1");
  const [box, setBox] = useState<Box | null>(null);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [width, setWidth] = useState<number | "">("");
  const [msg, setMsg] = useState("");
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const ratio = RATIOS.find((r) => r.id === ratioId)?.ratio ?? null;

  const open = async (files: File[]) => {
    const f = files.find(isImageFile);
    if (!f) return setMsg("画像ファイルを選んでください");
    try {
      setMsg("読み込み中…");
      const s = await loadImage(f);
      if (src) URL.revokeObjectURL(src.url);
      setFile(f);
      setSrc(s);
      setFormat(formatFor(f));
      setBox(initialBox(s.width, s.height, ratio));
      setMsg("");
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const start = (mode: Drag["mode"], e: ReactPointerEvent) => {
    if (!src || !box || !frame.current) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      // 枠の外に指が出てもドラッグを続ける
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      // 取れなくても枠の中では動く
    }
    drag.current = { mode, startX: e.clientX, startY: e.clientY, box, scale: src.width / frame.current.getBoundingClientRect().width };
  };
  const move = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d || !src) return;
    const dx = (e.clientX - d.startX) * d.scale;
    const dy = (e.clientY - d.startY) * d.scale;
    if (d.mode === "move") setBox(clampBox({ ...d.box, x: d.box.x + dx, y: d.box.y + dy }, src.width, src.height));
    else setBox(resizeBox(d.box, d.box.w + dx, d.box.h + dy, src.width, src.height, ratio));
  };
  const end = () => {
    drag.current = null;
  };
  /** 矢印キーで1px（Shift で10px）動かす */
  const key = (e: KeyboardEvent) => {
    if (!src || !box) return;
    const step = e.shiftKey ? 10 : 1;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    setBox(clampBox({ ...box, x: box.x + d[0], y: box.y + d[1] }, src.width, src.height));
  };

  const save = async () => {
    if (!src || !box || !file) return;
    try {
      const b = roundBox(box);
      const outW = width && width < b.w ? Math.round(width) : b.w;
      const outH = Math.max(1, Math.round((b.h * outW) / b.w));
      const { c, g } = canvasFor(outW, outH, format);
      g.drawImage(src.img, b.x, b.y, b.w, b.h, 0, 0, outW, outH);
      const blob = await toBlob(c, format);
      const ext = EXTENSION[(blob.type as OutputFormat) || format] ?? "png";
      saveBlob(`${baseName(file.name)}_crop.${ext}`, blob);
      setMsg(`${outW}×${outH} px で保存しました（${formatBytes(blob.size)}）`);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const pct = (v: number, total: number) => `${(v / total) * 100}%`;
  const rb = box && roundBox(box);
  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="画像" accept="image/*,.heic,.heif" onFiles={open} hint="JPEG・PNG・WebP・HEIC に対応" />
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <Choice
          label="比率"
          value={ratioId}
          onChange={(id) => {
            setRatioId(id);
            if (src) setBox(initialBox(src.width, src.height, RATIOS.find((r) => r.id === id)?.ratio ?? null));
          }}
          options={RATIOS.map((r) => [r.id, r.label])}
        />
        <Choice label="保存形式" value={format} onChange={setFormat} options={FORMATS} />
        <label className={ui.label}>
          幅を縮める（任意・px）
          <input className={`${ui.input} w-36`} type="number" inputMode="numeric" min={16} placeholder="そのまま" value={width} onChange={(e) => setWidth(e.target.value === "" ? "" : Number(e.target.value))} />
        </label>
      </div>
      {src && box && (
        <>
          <div className="flex justify-center rounded-xl bg-field p-2">
            <div ref={frame} className="relative inline-block touch-none overflow-hidden select-none" onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 端末で読み込んだ画像（blob:）を表示する */}
              <img src={src.url} alt="切り抜く画像" className="block max-h-[60vh] max-w-full" draggable={false} />
              <div
                role="group"
                tabIndex={0}
                aria-label={rb ? `切り抜く範囲：左 ${rb.x}・上 ${rb.y}・幅 ${rb.w}・高さ ${rb.h} px（矢印キーで移動）` : "切り抜く範囲"}
                className="absolute cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] outline-accent focus-visible:outline-2"
                style={{ left: pct(box.x, src.width), top: pct(box.y, src.height), width: pct(box.w, src.width), height: pct(box.h, src.height) }}
                onPointerDown={(e) => start("move", e)}
                onKeyDown={key}
              >
                <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3" aria-hidden="true">
                  {Array.from({ length: 9 }, (_, i) => (
                    <span key={i} className="border border-white/30" />
                  ))}
                </div>
                <span className="absolute -right-2.5 -bottom-2.5 h-5 w-5 cursor-nwse-resize rounded-full border-2 border-white bg-accent" onPointerDown={(e) => start("resize", e)} aria-hidden="true" />
              </div>
            </div>
          </div>
          <p className={ui.note}>枠をドラッグすると動かせます。右下の丸をドラッグすると大きさを変えられます（キーボードの矢印でも動かせます）。</p>
          {rb && (
            <Stats
              items={[
                { label: "元の画像", value: `${src.width}×${src.height}` },
                { label: "切り抜く範囲（px）", value: `${rb.w}×${rb.h}`, emphasis: true },
              ]}
            />
          )}
        </>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} disabled={!src} onClick={save}>
          切り抜いて保存
        </button>
        {src && (
          <button type="button" className={ui.button} onClick={() => setBox(initialBox(src.width, src.height, ratio))}>
            枠を戻す
          </button>
        )}
        <span className="text-sm text-muted" aria-live="polite">
          {msg}
        </span>
      </div>
      <p className={ui.note}>画像はサーバーに送らず、この端末の中だけで処理します。</p>
    </div>
  );
}

type RotItem = { id: number; file: File; src: LoadedImage };
let nextId = 1;

/** 画像の回転・反転（複数の画像にまとめて同じ操作） */
export function ImageRotate() {
  const [items, setItems] = useState<RotItem[]>([]);
  const [turn, setTurn] = useState<Turn>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [msg, setMsg] = useState("");

  const add = async (files: File[]) => {
    const list = files.filter(isImageFile);
    if (!list.length) return setMsg("画像ファイルを選んでください");
    const added: RotItem[] = [];
    for (const [i, f] of list.entries()) {
      setMsg(`読み込み中… ${i + 1} / ${list.length}`);
      try {
        added.push({ id: nextId++, file: f, src: await loadImage(f) });
      } catch (e) {
        setMsg(`${f.name}：${(e as Error).message}`);
      }
    }
    setItems((p) => [...p, ...added]);
    setMsg("");
  };

  const render = async (it: RotItem) => {
    const format = formatFor(it.file);
    const { width, height } = rotatedSize(it.src.width, it.src.height, turn);
    const { c, g } = canvasFor(width, height, format);
    g.translate(width / 2, height / 2);
    g.rotate((turn * Math.PI) / 180);
    g.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    g.drawImage(it.src.img, -it.src.width / 2, -it.src.height / 2);
    const blob = await toBlob(c, format);
    return { name: `${baseName(it.file.name)}_rotated.${EXTENSION[(blob.type as OutputFormat) || format] ?? "png"}`, data: blob };
  };
  const save = async () => {
    try {
      setMsg("書き出し中…");
      const out = [];
      for (const it of items) out.push(await render(it));
      if (out.length === 1) saveBlob(out[0].name, out[0].data);
      else await saveZip("rotated_images.zip", out);
      setMsg(out.length === 1 ? "保存しました" : `${out.length}枚をZIPで保存しました`);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const changed = turn !== 0 || flipH || flipV;
  const transform = `rotate(${turn}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`;
  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="画像" accept="image/*,.heic,.heif" multiple onFiles={add} hint="複数の画像に同じ回転をまとめてかけられます" />
      <div className="flex flex-wrap gap-2">
        <button type="button" className={ui.button} onClick={() => setTurn((t) => turnBy(t, -90))}>
          ↺ 左に90°
        </button>
        <button type="button" className={ui.button} onClick={() => setTurn((t) => turnBy(t, 90))}>
          ↻ 右に90°
        </button>
        <button type="button" className={ui.button} onClick={() => setTurn((t) => turnBy(turnBy(t, 90), 90))}>
          180°
        </button>
        <button type="button" className={ui.button} aria-pressed={flipH} onClick={() => setFlipH((v) => !v)}>
          ⇋ 左右反転
        </button>
        <button type="button" className={ui.button} aria-pressed={flipV} onClick={() => setFlipV((v) => !v)}>
          ⇵ 上下反転
        </button>
        <button
          type="button"
          className={ui.button}
          disabled={!changed}
          onClick={() => {
            setTurn(0);
            setFlipH(false);
            setFlipV(false);
          }}
        >
          元に戻す
        </button>
      </div>
      <p className="text-sm" aria-live="polite">
        いまの設定：{turn === 0 ? "回転なし" : `右に${turn}°`}
        {flipH && "・左右反転"}
        {flipV && "・上下反転"}
      </p>
      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => (
            <li key={it.id} className="flex flex-col gap-1 rounded-xl border border-line p-2">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-field">
                {/* eslint-disable-next-line @next/next/no-img-element -- 端末で読み込んだ画像（blob:）を表示する */}
                <img src={it.src.url} alt={it.file.name} className="max-h-[70%] max-w-[70%] transition-transform" style={{ transform }} />
              </div>
              <span className="truncate text-xs text-muted">{it.file.name}</span>
              <button type="button" className={`${ui.button} px-2 py-1 text-xs`} onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))}>
                外す
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} disabled={!items.length || !changed} onClick={save}>
          {items.length > 1 ? `${items.length}枚を保存（ZIP）` : "保存"}
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {msg}
        </span>
      </div>
      <p className={ui.note}>画像はサーバーに送らず、この端末の中だけで処理します。スマホの写真の向きの情報（Exif）は、表示されている向きのまま書き出します。</p>
    </div>
  );
}
