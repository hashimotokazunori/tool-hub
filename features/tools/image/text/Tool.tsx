"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { FileDrop } from "@/components/FileDrop";
import { Check, Choice } from "@/components/TextTransform";
import { Field, FieldGrid } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { baseName, formatBytes, saveBlob } from "@/lib/files";
import { EXTENSION, isImageFile, loadImage, type LoadedImage } from "@/lib/image";
import { alignFor, blockOrigin, fontPx, inRect, placementFromOrigin, presetPlacement, splitLines, type HPos, type Placement, type VPos } from "./logic";

type Format = "image/jpeg" | "image/png";
type FontKind = "sans" | "serif";
type Layer = {
  id: number;
  text: string;
  size: number; // 画像の短い辺に対する％
  color: string;
  font: FontKind;
  bold: boolean;
  outline: "0" | "8" | "16"; // 文字の大きさに対する％
  outlineColor: string;
  shadow: boolean;
  band: boolean;
  bandColor: string;
  bandOpacity: number; // ％
  place: Placement;
};
type Rect = { left: number; top: number; width: number; height: number };

const SERIF = '"Hiragino Mincho ProN", "Yu Mincho", YuMincho, "Noto Serif JP", serif';
let nextId = 1;

const newLayer = (text: string, v: VPos, h: HPos): Layer => ({
  id: nextId++,
  text,
  size: 8,
  color: "#ffffff",
  font: "sans",
  bold: true,
  outline: "8",
  outlineColor: "#000000",
  shadow: false,
  band: false,
  bandColor: "#000000",
  bandOpacity: 50,
  place: presetPlacement(v, h),
});

const hexToRgba = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

/** 画像の上に文字を描く。g は画像の大きさ（w×h）の座標で描ける状態にしておく。各文字のかたまりの範囲を返す */
function drawLayers(g: CanvasRenderingContext2D, w: number, h: number, layers: Layer[], sans: string): Rect[] {
  return layers.map((L) => {
    const px = fontPx(L.size, w, h);
    g.font = `${L.bold ? 700 : 400} ${px}px ${L.font === "serif" ? SERIF : sans}`;
    const lines = splitLines(L.text);
    const lineH = px * 1.3;
    const pad = px * 0.3;
    const textW = Math.max(1, ...lines.map((s) => g.measureText(s).width));
    const blockW = textW + pad * 2;
    const blockH = lines.length * lineH + pad * 2;
    const { left, top } = blockOrigin(L.place, blockW, blockH, w, h);
    if (L.band) {
      g.fillStyle = hexToRgba(L.bandColor, L.bandOpacity / 100);
      g.fillRect(0, top, w, blockH);
    }
    const align = alignFor(L.place.ax);
    g.textAlign = align;
    g.textBaseline = "middle";
    g.lineJoin = "round";
    const x = align === "left" ? left + pad : align === "right" ? left + blockW - pad : left + blockW / 2;
    lines.forEach((s, i) => {
      const y = top + pad + lineH * (i + 0.5);
      g.save();
      if (L.shadow) {
        g.shadowColor = "rgba(0,0,0,0.55)";
        g.shadowBlur = px * 0.18;
        g.shadowOffsetX = px * 0.05;
        g.shadowOffsetY = px * 0.05;
      }
      if (L.outline !== "0") {
        g.strokeStyle = L.outlineColor;
        g.lineWidth = (px * Number(L.outline) * 2) / 100;
        g.strokeText(s, x, y);
        g.shadowColor = "transparent";
      }
      g.fillStyle = L.color;
      g.fillText(s, x, y);
      g.restore();
    });
    return { left, top, width: blockW, height: blockH };
  });
}

const POSITIONS: { v: VPos; h: HPos; label: string }[] = (["top", "middle", "bottom"] as VPos[]).flatMap((v) =>
  (["left", "center", "right"] as HPos[]).map((h) => ({ v, h, label: `${v === "top" ? "上" : v === "middle" ? "中央" : "下"}・${h === "left" ? "左" : h === "center" ? "中" : "右"}` })),
);

type Drag = { id: number; dx: number; dy: number; w: number; h: number };

/** 画像に文字を入れる：文字を何個でも重ね、ドラッグで動かして保存 */
export function ImageText() {
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<LoadedImage | null>(null);
  const [layers, setLayers] = useState<Layer[]>(() => [newLayer("ここに文字", "bottom", "center")]);
  const [selected, setSelected] = useState(layers[0].id);
  const [format, setFormat] = useState<Format>("image/jpeg");
  const [msg, setMsg] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  const rects = useRef<Rect[]>([]);
  const drag = useRef<Drag | null>(null);

  const cur = layers.find((l) => l.id === selected) ?? layers[0];
  const update = (patch: Partial<Layer>) => setLayers((ls) => ls.map((l) => (l.id === cur?.id ? { ...l, ...patch } : l)));

  const open = async (files: File[]) => {
    const f = files.find(isImageFile);
    if (!f) return setMsg("画像ファイルを選んでください");
    try {
      setMsg("読み込み中…");
      const s = await loadImage(f);
      if (src) URL.revokeObjectURL(src.url);
      setFile(f);
      setSrc(s);
      setFormat(f.type === "image/png" ? "image/png" : "image/jpeg");
      setMsg("");
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  // 見本：長い辺 1200px までに縮めて描く
  useEffect(() => {
    const c = canvas.current;
    if (!c || !src) return;
    const k = Math.min(1, 1200 / Math.max(src.width, src.height));
    c.width = Math.round(src.width * k);
    c.height = Math.round(src.height * k);
    const g = c.getContext("2d")!;
    g.imageSmoothingQuality = "high";
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(src.img, 0, 0, c.width, c.height);
    g.scale(k, k);
    rects.current = drawLayers(g, src.width, src.height, layers, getComputedStyle(document.body).fontFamily || "sans-serif");
    // 選んでいる文字の範囲を点線で示す
    const i = layers.findIndex((l) => l.id === selected);
    const r = rects.current[i];
    if (r && layers.length > 1) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.setLineDash([6, 4]);
      g.lineWidth = 2;
      g.strokeStyle = "rgba(99,102,241,0.9)";
      g.strokeRect(r.left * k, r.top * k, r.width * k, r.height * k);
    }
  }, [src, layers, selected]);

  const toImage = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const k = src!.width / box.width;
    return { x: (e.clientX - box.left) * k, y: (e.clientY - box.top) * k };
  };
  const onDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!src) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // 取れなくても画像の中では動く
    }
    const p = toImage(e);
    // 上に重なっている文字から順に探す
    let i = rects.current.length - 1;
    while (i >= 0 && !inRect(p.x, p.y, rects.current[i])) i--;
    if (i >= 0) {
      const r = rects.current[i];
      setSelected(layers[i].id);
      drag.current = { id: layers[i].id, dx: p.x - r.left, dy: p.y - r.top, w: r.width, h: r.height };
    } else if (cur) {
      // 文字のない所を押したら、選んでいる文字をそこへ動かす
      const ci = layers.findIndex((l) => l.id === cur.id);
      const r = rects.current[ci];
      if (!r) return;
      drag.current = { id: cur.id, dx: r.width / 2, dy: r.height / 2, w: r.width, h: r.height };
      onMove(e);
    }
  };
  const onMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d || !src) return;
    const p = toImage(e);
    setLayers((ls) => ls.map((l) => (l.id === d.id ? { ...l, place: placementFromOrigin(p.x - d.dx, p.y - d.dy, d.w, d.h, src.width, src.height, l.place) } : l)));
  };
  const onUp = () => {
    drag.current = null;
  };

  const add = () => {
    const l = newLayer("文字", "middle", "center");
    setLayers((ls) => [...ls, l]);
    setSelected(l.id);
  };
  const remove = () => {
    if (layers.length <= 1 || !cur) return;
    const rest = layers.filter((l) => l.id !== cur.id);
    setLayers(rest);
    setSelected(rest[rest.length - 1].id);
  };

  const save = async () => {
    if (!src || !file) return;
    try {
      if (src.width * src.height > 40_000_000) return setMsg("画像が大きすぎます");
      const c = document.createElement("canvas");
      c.width = src.width;
      c.height = src.height;
      const g = c.getContext("2d")!;
      if (format === "image/jpeg") {
        g.fillStyle = "#fff";
        g.fillRect(0, 0, c.width, c.height);
      }
      g.drawImage(src.img, 0, 0, src.width, src.height);
      drawLayers(g, src.width, src.height, layers, getComputedStyle(document.body).fontFamily || "sans-serif");
      const blob = await new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("画像を書き出せませんでした"))), format, 0.92));
      saveBlob(`${baseName(file.name)}_text.${EXTENSION[format]}`, blob);
      setMsg(`保存しました（${formatBytes(blob.size)}）`);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const colorInput = "h-11 w-full cursor-pointer rounded-lg border border-line bg-field p-1";
  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="画像" accept="image/*,.heic,.heif" onFiles={open} hint="JPEG・PNG・WebP・HEIC に対応" />
      {src && (
        <div className="flex justify-center rounded-xl bg-field p-2">
          <canvas
            ref={canvas}
            className="block max-h-[65vh] max-w-full cursor-move touch-none select-none"
            role="img"
            aria-label={`文字を入れた画像の見本：${layers.map((l) => l.text).join("／")}`}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          />
        </div>
      )}
      {src && <p className={ui.note}>見本の文字をドラッグすると動かせます。文字のない所を押すと、選んでいる文字がそこへ移ります。</p>}

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="文字の選択">
        {layers.map((l, i) => (
          <button key={l.id} type="button" aria-pressed={l.id === cur?.id} className={`${ui.chip} ${l.id === cur?.id ? "border-accent text-accent" : ""}`} onClick={() => setSelected(l.id)}>
            {i + 1}. {l.text.split("\n")[0].slice(0, 10) || "（空）"}
          </button>
        ))}
        <button type="button" className={ui.button} onClick={add}>
          文字を追加
        </button>
        <button type="button" className={ui.button} disabled={layers.length <= 1} onClick={remove}>
          この文字を消す
        </button>
      </div>

      {cur && (
        <div className={`${ui.panel} flex flex-col gap-3 p-4`}>
          <Field label="文字（改行で複数行）">
            <textarea className={`${ui.input} min-h-20`} value={cur.text} onChange={(e) => update({ text: e.target.value })} />
          </Field>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-muted">位置</span>
            <div className="grid w-full max-w-xs grid-cols-3 gap-1.5">
              {POSITIONS.map((p) => {
                const pl = presetPlacement(p.v, p.h);
                const on = cur.place.ax === pl.ax && cur.place.ay === pl.ay && Math.abs(cur.place.x - pl.x) < 1e-6 && Math.abs(cur.place.y - pl.y) < 1e-6;
                return (
                  <button key={p.label} type="button" aria-pressed={on} className={`${ui.button} px-2 py-1.5 text-xs ${on ? "border-accent text-accent" : ""}`} onClick={() => update({ place: pl })}>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
          <FieldGrid>
            <Field label={`文字の大きさ：${cur.size}%（画像の短い辺に対して）`}>
              <input type="range" min={2} max={30} step={0.5} value={cur.size} onChange={(e) => update({ size: Number(e.target.value) })} className="accent-accent" />
            </Field>
            <Field label="文字の色">
              <input type="color" className={colorInput} value={cur.color} onChange={(e) => update({ color: e.target.value })} />
            </Field>
            <Choice
              label="書体"
              value={cur.font}
              onChange={(v) => update({ font: v })}
              options={[
                ["sans", "ゴシック体"],
                ["serif", "明朝体"],
              ]}
            />
            <Choice
              label="ふち取り"
              value={cur.outline}
              onChange={(v) => update({ outline: v })}
              options={[
                ["0", "なし"],
                ["8", "細い"],
                ["16", "太い"],
              ]}
            />
            {cur.outline !== "0" && (
              <Field label="ふちの色">
                <input type="color" className={colorInput} value={cur.outlineColor} onChange={(e) => update({ outlineColor: e.target.value })} />
              </Field>
            )}
            {cur.band && (
              <>
                <Field label="帯の色">
                  <input type="color" className={colorInput} value={cur.bandColor} onChange={(e) => update({ bandColor: e.target.value })} />
                </Field>
                <Field label={`帯の濃さ：${cur.bandOpacity}%`}>
                  <input type="range" min={10} max={100} step={5} value={cur.bandOpacity} onChange={(e) => update({ bandOpacity: Number(e.target.value) })} className="accent-accent" />
                </Field>
              </>
            )}
          </FieldGrid>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Check label="太字" checked={cur.bold} onChange={(v) => update({ bold: v })} />
            <Check label="影を付ける" checked={cur.shadow} onChange={(v) => update({ shadow: v })} />
            <Check label="文字の後ろに帯を敷く" checked={cur.band} onChange={(v) => update({ band: v })} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <Choice
          label="保存形式"
          value={format}
          onChange={setFormat}
          options={[
            ["image/jpeg", "JPEG（写真向け・軽い）"],
            ["image/png", "PNG（劣化なし）"],
          ]}
        />
        <button type="button" className={ui.buttonPrimary} disabled={!src} onClick={save}>
          文字を入れて保存
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {msg}
        </span>
      </div>
      <p className={ui.note}>保存する画像は元の大きさのままです。書体は端末に入っているフォントを使うため、パソコンとスマホで少し見た目が変わることがあります。画像はサーバーに送らず、この端末の中だけで処理します。</p>
    </div>
  );
}
