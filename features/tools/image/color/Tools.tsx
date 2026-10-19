"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { FileDrop } from "@/components/FileDrop";
import { Check, Choice } from "@/components/TextTransform";
import { Field, FieldGrid, Stats } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { baseName, formatBytes, saveBlob } from "@/lib/files";
import { isImageFile, loadImage, type LoadedImage } from "@/lib/image";
import { applyMask, backgroundMask, cornerPoints, dominantColors, maskRatio, pixelAt, readableTextColor, sampleSize, toHex, toRgbText, type RGB } from "./logic";

const PRIVACY = "画像はサーバーに送らず、この端末の中だけで処理します。";
const CHECKER = "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 16px 16px";

/** 画像を（長い辺 max px までに縮めて）キャンバスに描き、画素を読めるようにする */
function rasterize(src: LoadedImage, max: number) {
  const { width, height } = sampleSize(src.width, src.height, max);
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.imageSmoothingQuality = "high";
  g.drawImage(src.img, 0, 0, width, height);
  return { c, g, width, height, data: g.getImageData(0, 0, width, height) };
}

/** 押すとHEXをコピーする色見本 */
function Swatch({ color, sub }: { color: RGB; sub?: string }) {
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  const hex = toHex(color);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    setTimeout(() => setCopied(""), 1500);
  };
  return (
    <li className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-card">
      <button type="button" className="flex h-16 items-end px-2.5 py-1.5 text-left text-xs font-semibold" style={{ background: hex, color: readableTextColor(color) }} onClick={() => copy(hex)} aria-label={`${hex} をコピー`}>
        {copied === "ok" ? "コピーしました" : copied === "fail" ? "コピーできませんでした" : sub}
      </button>
      <div className="flex flex-col gap-0.5 px-2.5 py-2 text-xs">
        <button type="button" className="text-left font-mono font-semibold text-ink hover:text-accent" onClick={() => copy(hex)}>
          {hex}
        </button>
        <button type="button" className="text-left font-mono text-muted hover:text-accent" onClick={() => copy(toRgbText(color))}>
          {toRgbText(color)}
        </button>
      </div>
    </li>
  );
}

type Hover = { x: number; y: number; px: number; py: number; color: RGB; boxW: number; boxH: number };

/** 画像から色を抽出：クリックした所の色（スポイト）と、画像の代表色 */
export function ImageColorPicker() {
  const [src, setSrc] = useState<LoadedImage | null>(null);
  const [k, setK] = useState<"5" | "6" | "8">("6");
  const [picked, setPicked] = useState<RGB[]>([]);
  const [hover, setHover] = useState<Hover | null>(null);
  const [msg, setMsg] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  const lens = useRef<HTMLCanvasElement>(null);
  const pixels = useRef<ImageData | null>(null);

  const open = async (files: File[]) => {
    const f = files.find(isImageFile);
    if (!f) return setMsg("画像ファイルを選んでください");
    try {
      setMsg("読み込み中…");
      const s = await loadImage(f);
      if (src) URL.revokeObjectURL(src.url);
      setSrc(s);
      setPicked([]);
      setMsg("");
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  // 表示用（兼スポイト用）のキャンバス。大きすぎる画像は長い辺 2400px に縮める
  useEffect(() => {
    const c = canvas.current;
    if (!c || !src) return;
    const r = rasterize(src, 2400);
    c.width = r.width;
    c.height = r.height;
    c.getContext("2d")!.putImageData(r.data, 0, 0);
    pixels.current = r.data;
  }, [src]);

  const palette = useMemo(() => {
    if (!src) return [];
    const r = rasterize(src, 120);
    return dominantColors(r.data.data, Number(k));
  }, [src, k]);

  // 拡大鏡：触れている所のまわり 11×11 画素を大きく描く
  useEffect(() => {
    const l = lens.current;
    const im = pixels.current;
    if (!l || !im || !hover) return;
    const n = 11;
    const cell = 8;
    l.width = n * cell;
    l.height = n * cell;
    const g = l.getContext("2d")!;
    g.fillStyle = "#fff";
    g.fillRect(0, 0, l.width, l.height);
    for (let dy = 0; dy < n; dy++) {
      for (let dx = 0; dx < n; dx++) {
        const x = hover.px + dx - 5;
        const y = hover.py + dy - 5;
        if (x < 0 || y < 0 || x >= im.width || y >= im.height) continue;
        const p = pixelAt(im.data, im.width, x, y);
        g.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
        g.fillRect(dx * cell, dy * cell, cell, cell);
      }
    }
    g.strokeStyle = readableTextColor(hover.color);
    g.lineWidth = 2;
    g.strokeRect(5 * cell, 5 * cell, cell, cell);
  }, [hover]);

  const locate = (e: ReactPointerEvent<HTMLCanvasElement>): Hover | null => {
    const im = pixels.current;
    if (!im) return null;
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const px = Math.max(0, Math.min(im.width - 1, Math.floor((x / box.width) * im.width)));
    const py = Math.max(0, Math.min(im.height - 1, Math.floor((y / box.height) * im.height)));
    const p = pixelAt(im.data, im.width, px, py);
    return { x, y, px, py, color: { r: p.r, g: p.g, b: p.b }, boxW: box.width, boxH: box.height };
  };
  const pick = (h: Hover | null) => {
    if (!h) return;
    setPicked((list) => [h.color, ...list.filter((c) => toHex(c) !== toHex(h.color))].slice(0, 12));
  };

  const touch = hover !== null && typeof window !== "undefined" && matchMedia("(pointer: coarse)").matches;
  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="画像" accept="image/*,.heic,.heif" onFiles={open} hint="写真・ロゴ・スクリーンショットなど" />
      {msg && (
        <p className="text-sm text-muted" aria-live="polite">
          {msg}
        </p>
      )}
      {src && (
        <>
          <p className={ui.note}>画像の上を押すと、その場所の色を取り出せます（スマホは指でなぞって、離した所の色になります）。</p>
          <div className="flex justify-center rounded-xl bg-field p-2">
            <div className="relative inline-block">
              <canvas
                ref={canvas}
                className="block max-h-[65vh] max-w-full cursor-crosshair touch-none select-none"
                role="img"
                aria-label="色を取り出す画像"
                onPointerDown={(e) => {
                  try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  } catch {
                    // 取れなくても画像の中では動く
                  }
                  setHover(locate(e));
                }}
                onPointerMove={(e) => setHover(locate(e))}
                onPointerUp={(e) => {
                  pick(locate(e));
                  if (e.pointerType !== "mouse") setHover(null);
                }}
                onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
                onPointerCancel={() => setHover(null)}
              />
              {hover && (
                <div
                  className="pointer-events-none absolute z-10 flex flex-col items-center gap-1 rounded-xl border border-line bg-panel p-1.5 shadow-lift"
                  style={{
                    left: Math.max(0, Math.min(hover.boxW - 100, hover.x + (hover.x > hover.boxW / 2 ? -110 : 16))),
                    top: Math.max(0, Math.min(hover.boxH - 120, hover.y - (touch ? 140 : -16))),
                  }}
                >
                  <canvas ref={lens} className="block h-[88px] w-[88px] rounded-md [image-rendering:pixelated]" aria-hidden="true" />
                  <span className="font-mono text-xs font-semibold">{toHex(hover.color)}</span>
                </div>
              )}
            </div>
          </div>
          <section className="flex flex-col gap-2" aria-live="polite">
            <h3 className={ui.h3}>取り出した色</h3>
            {picked.length ? (
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {picked.map((c, i) => (
                  <Swatch key={toHex(c)} color={c} sub={i === 0 ? "いま選んだ色" : undefined} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">まだありません。画像の上を押してください。</p>
            )}
          </section>
          <section className="flex flex-col gap-2">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h3 className={ui.h3}>画像の代表色</h3>
              <Choice
                label="色の数"
                value={k}
                onChange={setK}
                options={[
                  ["5", "5色"],
                  ["6", "6色"],
                  ["8", "8色"],
                ]}
              />
            </div>
            <div className="flex h-6 overflow-hidden rounded-lg border border-line" aria-hidden="true">
              {palette.map((c) => (
                <div key={toHex(c)} style={{ background: toHex(c), width: `${c.ratio * 100}%` }} />
              ))}
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-4" aria-live="polite">
              {palette.map((c) => (
                <Swatch key={toHex(c)} color={c} sub={`${Math.round(c.ratio * 100)}%`} />
              ))}
            </ul>
          </section>
        </>
      )}
      <p className={ui.note}>色見本やカラーコードを押すとコピーできます。代表色は画像を縮小して似た色をまとめた目安で、％は画像の中で占める割合です。{PRIVACY}</p>
    </div>
  );
}

// ───────── 背景透過 ─────────

type Point = { x: number; y: number };
const PREVIEW_MAX = 1000;
const SAVE_MAX = 4096;

/** 縮小した画像に、点の位置（元画像に対する 0〜1 の割合）で透過をかける */
function removeBackground(raster: ImageData, pts: Point[], tolerance: number, connected: boolean, soften: boolean) {
  const { width: w, height: h } = raster;
  const seeds = pts.map((p) => ({ x: Math.min(w - 1, Math.floor(p.x * w)), y: Math.min(h - 1, Math.floor(p.y * h)) }));
  const out = new ImageData(new Uint8ClampedArray(raster.data), w, h);
  const mask = backgroundMask(raster.data, w, h, seeds, tolerance, connected);
  const bg = seeds.length ? pixelAt(raster.data, w, seeds[0].x, seeds[0].y) : undefined;
  applyMask(out.data, w, h, mask, { soften, background: bg, tolerancePct: tolerance });
  return { out, ratio: maskRatio(mask) };
}

/** 背景透過：単色の背景を透明にして PNG で保存する */
export function BackgroundRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<LoadedImage | null>(null);
  const [auto, setAuto] = useState<"corners" | "click">("corners");
  const [points, setPoints] = useState<Point[]>([]);
  const [tolerance, setTolerance] = useState(12);
  const [connected, setConnected] = useState<"flood" | "global">("flood");
  const [soften, setSoften] = useState(true);
  const [msg, setMsg] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);

  const open = async (files: File[]) => {
    const f = files.find(isImageFile);
    if (!f) return setMsg("画像ファイルを選んでください");
    try {
      setMsg("読み込み中…");
      const s = await loadImage(f);
      if (src) URL.revokeObjectURL(src.url);
      setFile(f);
      setSrc(s);
      setPoints([]);
      setMsg("");
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const preview = useMemo(() => (src ? rasterize(src, PREVIEW_MAX).data : null), [src]);
  const seeds = useMemo<Point[]>(() => {
    if (!preview) return [];
    if (auto === "click") return points;
    // 四隅の点（割合）。画素の真ん中を指す
    return cornerPoints(preview.width, preview.height).map((p) => ({ x: (p.x + 0.5) / preview.width, y: (p.y + 0.5) / preview.height }));
  }, [preview, auto, points]);
  const result = useMemo(() => (preview ? removeBackground(preview, seeds, tolerance, connected === "flood", soften) : null), [preview, seeds, tolerance, connected, soften]);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !result) return;
    c.width = result.out.width;
    c.height = result.out.height;
    c.getContext("2d")!.putImageData(result.out, 0, 0);
  }, [result]);

  const onPick = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (auto !== "click") return;
    const box = e.currentTarget.getBoundingClientRect();
    const p = { x: Math.max(0, Math.min(0.9999, (e.clientX - box.left) / box.width)), y: Math.max(0, Math.min(0.9999, (e.clientY - box.top) / box.height)) };
    setPoints((list) => [...list, p]);
  };

  const save = async () => {
    if (!src || !file) return;
    try {
      setMsg("書き出し中…");
      const big = rasterize(src, SAVE_MAX);
      const { out } = removeBackground(big.data, seeds, tolerance, connected === "flood", soften);
      big.g.putImageData(out, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) => big.c.toBlob((b) => (b ? resolve(b) : reject(new Error("画像を書き出せませんでした"))), "image/png"));
      saveBlob(`${baseName(file.name)}_transparent.png`, blob);
      setMsg(`${big.width}×${big.height} px のPNGで保存しました（${formatBytes(blob.size)}）`);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const shrunk = src && Math.max(src.width, src.height) > SAVE_MAX;
  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl border border-line bg-field px-3.5 py-2.5 text-sm leading-relaxed">
        白い紙や無地の壁など、<b>背景が1色に近い画像</b>向けです。AIで人物や物を見分けるしくみではないので、風景や柄のある背景の写真はきれいに切り抜けません。
      </p>
      <FileDrop label="画像" accept="image/*,.heic,.heif" onFiles={open} hint="ロゴ・イラスト・ハンコ・白背景の商品写真など" />
      <FieldGrid>
        <Choice
          label="消す背景の色"
          value={auto}
          onChange={setAuto}
          options={[
            ["corners", "四隅の色を自動で使う"],
            ["click", "画像を押して指定する"],
          ]}
        />
        <Choice
          label="消す範囲"
          value={connected}
          onChange={setConnected}
          options={[
            ["flood", "つながっている所だけ（塗りつぶし）"],
            ["global", "同じ色をすべて"],
          ]}
        />
        <Field label={`許容範囲：${tolerance}%（大きいほど近い色も消す）`}>
          <input type="range" min={0} max={60} step={1} value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} className="accent-accent" />
        </Field>
      </FieldGrid>
      <Check label="境目をなめらかにする" checked={soften} onChange={setSoften} />
      {src && result && (
        <>
          {auto === "click" && <p className={ui.note}>消したい背景の所を押してください。何か所でも追加できます。{points.length ? `（指定 ${points.length}か所）` : ""}</p>}
          <div className="flex justify-center rounded-xl p-2" style={{ background: CHECKER }}>
            <div className="relative inline-block">
              <canvas ref={canvas} className={`block max-h-[65vh] max-w-full ${auto === "click" ? "cursor-crosshair" : ""}`} role="img" aria-label="背景を透明にした仕上がりの見本（市松模様の所が透明）" onPointerUp={onPick} />
              {seeds.map((p, i) => (
                <span key={i} className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }} aria-hidden="true" />
              ))}
            </div>
          </div>
          <Stats
            items={[
              { label: "透明にした割合", value: `${Math.round(result.ratio * 100)}%`, emphasis: true },
              { label: "元の画像", value: `${src.width}×${src.height}` },
            ]}
          />
        </>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} disabled={!src || !seeds.length} onClick={save}>
          PNGで保存
        </button>
        {auto === "click" && (
          <button type="button" className={ui.button} disabled={!points.length} onClick={() => setPoints([])}>
            指定をやり直す
          </button>
        )}
        <span className="text-sm text-muted" aria-live="polite">
          {msg || (auto === "click" && src && !points.length ? "画像の背景を押してください" : "")}
        </span>
      </div>
      <p className={ui.note}>
        市松模様に見える所が透明になります。消えすぎるときは許容範囲を小さく、残りが多いときは大きくしてください。画像の中の白い部分まで消えるときは「つながっている所だけ」を選びます。
        {shrunk ? `大きな画像は長い辺 ${SAVE_MAX}px に縮めて保存します。` : ""}
        {PRIVACY}
      </p>
    </div>
  );
}
