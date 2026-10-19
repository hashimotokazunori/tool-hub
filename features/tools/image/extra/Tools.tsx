"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { FileDrop } from "@/components/FileDrop";
import { Check, Choice } from "@/components/TextTransform";
import { Field, FieldGrid, Stats } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { baseName, formatBytes, saveBlob, saveZip } from "@/lib/files";
import { EXTENSION, isImageFile, loadImage, type LoadedImage } from "@/lib/image";
import { blurRect, containInSquare, coverSquare, fillRect, marginsToPx, naturalSquareSize, paddedSize, pixelate, rectFromPoints, strengthPx, type Margins, type Rect } from "./logic";

type Format = "image/jpeg" | "image/png";
const FORMATS: [Format, string][] = [
  ["image/jpeg", "JPEG（写真向け・軽い）"],
  ["image/png", "PNG（劣化なし）"],
];
const formatFor = (f: File): Format => (f.type === "image/png" ? "image/png" : "image/jpeg");

function toBlob(c: HTMLCanvasElement, format: Format, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("画像を書き出せませんでした"))), format, quality));
}

function makeCanvas(width: number, height: number) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const g = c.getContext("2d")!;
  g.imageSmoothingQuality = "high";
  return { c, g };
}

const PRIVACY = "画像はサーバーに送らず、この端末の中だけで処理します。";

// ───────── 正方形画像 ─────────

type SquareBg = "white" | "black" | "custom" | "blur";
type SqItem = { id: number; file: File; src: LoadedImage };
let nextId = 1;

/** ぼかした背景：いったんごく小さく縮めてから引き伸ばす（どのブラウザでも同じようにぼける） */
function drawBlurredCover(g: CanvasRenderingContext2D, src: LoadedImage, size: number) {
  const small = Math.max(8, Math.round(size / 40));
  const t = makeCanvas(small, small);
  const cv = coverSquare(src.width, src.height, small);
  t.g.drawImage(src.img, cv.x, cv.y, cv.w, cv.h);
  g.imageSmoothingEnabled = true;
  g.drawImage(t.c, 0, 0, small, small, 0, 0, size, size);
  // 写真が目立つように少しだけ暗くする
  g.fillStyle = "rgba(0,0,0,0.12)";
  g.fillRect(0, 0, size, size);
}

/** 正方形画像作成：写真を切らずに正方形のキャンバスに置く */
export function SquareImage() {
  const [items, setItems] = useState<SqItem[]>([]);
  const [size, setSize] = useState<"1080" | "1200" | "2048" | "original">("1080");
  const [bg, setBg] = useState<SquareBg>("white");
  const [color, setColor] = useState("#f2efe9");
  const [margin, setMargin] = useState(0);
  const [format, setFormat] = useState<Format>("image/jpeg");
  const [msg, setMsg] = useState("");

  const add = async (files: File[]) => {
    const list = files.filter(isImageFile);
    if (!list.length) return setMsg("画像ファイルを選んでください");
    const added: SqItem[] = [];
    for (const [i, f] of list.entries()) {
      setMsg(`読み込み中… ${i + 1} / ${list.length}`);
      try {
        added.push({ id: nextId++, file: f, src: await loadImage(f) });
      } catch (e) {
        setMsg(`${f.name}：${(e as Error).message}`);
      }
    }
    if (!items.length && added[0]) setFormat(formatFor(added[0].file));
    setItems((p) => [...p, ...added]);
    setMsg("");
  };

  const bgColor = bg === "white" ? "#ffffff" : bg === "black" ? "#000000" : color;
  const render = async (it: SqItem) => {
    const s = size === "original" ? naturalSquareSize(it.src.width, it.src.height) : Number(size);
    const { c, g } = makeCanvas(s, s);
    if (bg === "blur") drawBlurredCover(g, it.src, s);
    else {
      g.fillStyle = bgColor;
      g.fillRect(0, 0, s, s);
    }
    const r = containInSquare(it.src.width, it.src.height, s, margin);
    g.drawImage(it.src.img, r.x, r.y, r.w, r.h);
    const blob = await toBlob(c, format);
    return { name: `${baseName(it.file.name)}_square.${EXTENSION[format]}`, data: blob };
  };
  const save = async () => {
    try {
      const out = [];
      for (const [i, it] of items.entries()) {
        setMsg(`書き出し中… ${i + 1} / ${items.length}`);
        out.push(await render(it));
      }
      if (out.length === 1) saveBlob(out[0].name, out[0].data);
      else await saveZip("square_images.zip", out);
      setMsg(out.length === 1 ? `保存しました（${formatBytes(out[0].data.size)}）` : `${out.length}枚をZIPで保存しました`);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="画像" accept="image/*,.heic,.heif" multiple onFiles={add} hint="複数の画像を同じ設定でまとめて正方形にできます" />
      <FieldGrid>
        <Choice
          label="出力サイズ"
          value={size}
          onChange={setSize}
          options={[
            ["1080", "1080×1080 px（Instagram）"],
            ["1200", "1200×1200 px"],
            ["2048", "2048×2048 px（高画質）"],
            ["original", "元の画像の長い辺に合わせる"],
          ]}
        />
        <Choice
          label="背景"
          value={bg}
          onChange={setBg}
          options={[
            ["white", "白"],
            ["black", "黒"],
            ["custom", "好きな色"],
            ["blur", "写真をぼかした背景"],
          ]}
        />
        {bg === "custom" && (
          <Field label="背景の色">
            <input type="color" className="h-11 w-full cursor-pointer rounded-lg border border-line bg-field p-1" value={color} onChange={(e) => setColor(e.target.value)} />
          </Field>
        )}
        <Field label={`写真のまわりの余白：${margin}%`}>
          <input type="range" min={0} max={20} step={1} value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="accent-accent" />
        </Field>
        <Choice label="保存形式" value={format} onChange={setFormat} options={FORMATS} />
      </FieldGrid>
      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => (
            <li key={it.id} className="flex flex-col gap-1 rounded-xl border border-line p-2">
              <div className="relative aspect-square overflow-hidden rounded-lg" style={{ background: bg === "blur" ? "#000" : bgColor }}>
                {bg === "blur" && (
                  // eslint-disable-next-line @next/next/no-img-element -- 端末で読み込んだ画像（blob:）を表示する
                  <img src={it.src.url} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-90 blur-md" />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element -- 端末で読み込んだ画像（blob:）を表示する */}
                <img src={it.src.url} alt={`${it.file.name} の仕上がり見本`} className="absolute object-contain" style={{ inset: `${margin}%`, width: `${100 - margin * 2}%`, height: `${100 - margin * 2}%` }} />
              </div>
              <span className="truncate text-xs text-muted">
                {it.file.name}（{it.src.width}×{it.src.height}）
              </span>
              <button type="button" className={`${ui.button} px-2 py-1 text-xs`} onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))}>
                外す
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} disabled={!items.length} onClick={save}>
          {items.length > 1 ? `${items.length}枚を保存（ZIP）` : "正方形にして保存"}
        </button>
        {items.length > 0 && (
          <button type="button" className={ui.button} onClick={() => setItems([])}>
            すべて外す
          </button>
        )}
        <span className="text-sm text-muted" aria-live="polite">
          {msg}
        </span>
      </div>
      <p className={ui.note}>写真は切り取らず、全体が正方形の中に収まるように置きます。小さい写真は出力サイズまで拡大するため、少しぼやけることがあります。{PRIVACY}</p>
    </div>
  );
}

// ───────── 余白追加 ─────────

const SIDES: [keyof Margins, string][] = [
  ["top", "上"],
  ["right", "右"],
  ["bottom", "下"],
  ["left", "左"],
];

/** 画像の余白追加：上下左右に背景色（または透明）の余白を付ける */
export function ImagePadding() {
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<LoadedImage | null>(null);
  const [unit, setUnit] = useState<"px" | "%">("%");
  const [uniform, setUniform] = useState(true);
  const [all, setAll] = useState(10);
  const [each, setEach] = useState<Margins>({ top: 10, right: 10, bottom: 10, left: 10 });
  const [color, setColor] = useState("#ffffff");
  const [transparent, setTransparent] = useState(false);
  const [jpeg, setJpeg] = useState(true);
  const [msg, setMsg] = useState("");
  const preview = useRef<HTMLCanvasElement>(null);

  const open = async (files: File[]) => {
    const f = files.find(isImageFile);
    if (!f) return setMsg("画像ファイルを選んでください");
    try {
      setMsg("読み込み中…");
      const s = await loadImage(f);
      setFile(f);
      setSrc(s);
      setJpeg(formatFor(f) === "image/jpeg");
      setMsg("");
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const margins = src ? marginsToPx(uniform ? { top: all, right: all, bottom: all, left: all } : each, unit, src.width, src.height) : null;
  const out = src && margins ? paddedSize(src.width, src.height, margins) : null;
  // 透明はPNGでしか残せない
  const format: Format = transparent || !jpeg ? "image/png" : "image/jpeg";

  const draw = (c: HTMLCanvasElement, scale: number) => {
    if (!src || !margins || !out) return;
    c.width = Math.max(1, Math.round(out.width * scale));
    c.height = Math.max(1, Math.round(out.height * scale));
    const g = c.getContext("2d")!;
    g.imageSmoothingQuality = "high";
    g.clearRect(0, 0, c.width, c.height);
    if (!transparent) {
      g.fillStyle = color;
      g.fillRect(0, 0, c.width, c.height);
    }
    g.drawImage(src.img, margins.left * scale, margins.top * scale, src.width * scale, src.height * scale);
  };

  useEffect(() => {
    const c = preview.current;
    if (!c || !out) return;
    draw(c, Math.min(1, 800 / Math.max(out.width, out.height)));
  });

  const save = async () => {
    if (!file || !out) return;
    try {
      if (out.width * out.height > 40_000_000) return setMsg("仕上がりが大きすぎます。余白を小さくしてください");
      const { c } = makeCanvas(out.width, out.height);
      draw(c, 1);
      const blob = await toBlob(c, format);
      saveBlob(`${baseName(file.name)}_padding.${EXTENSION[format]}`, blob);
      setMsg(`${out.width}×${out.height} px で保存しました（${formatBytes(blob.size)}）`);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const numInput = (label: string, value: number, onChange: (v: number) => void) => (
    <Field label={`${label}（${unit}）`}>
      <input className={ui.input} type="number" inputMode="numeric" min={0} max={unit === "%" ? 200 : 5000} value={value} onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} />
    </Field>
  );

  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="画像" accept="image/*,.heic,.heif" onFiles={open} hint="JPEG・PNG・WebP・HEIC に対応" />
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <Choice
          label="余白の単位"
          value={unit}
          onChange={setUnit}
          options={[
            ["%", "％（短い辺に対する割合）"],
            ["px", "px"],
          ]}
        />
        <Check
          label="上下左右を同じにする"
          checked={uniform}
          onChange={(v) => {
            // 個別に切り替えたときは、いまの値から始める
            if (!v) setEach({ top: all, right: all, bottom: all, left: all });
            setUniform(v);
          }}
        />
      </div>
      <FieldGrid>
        {uniform ? numInput("余白", all, setAll) : SIDES.map(([k, l]) => <div key={k}>{numInput(l, each[k], (v) => setEach((m) => ({ ...m, [k]: v })))}</div>)}
        <Field label="余白の色">
          <input type="color" className="h-11 w-full cursor-pointer rounded-lg border border-line bg-field p-1 disabled:opacity-40" value={color} disabled={transparent} onChange={(e) => setColor(e.target.value)} />
        </Field>
      </FieldGrid>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Check label="余白を透明にする（PNGで保存）" checked={transparent} onChange={setTransparent} />
        {!transparent && <Check label="JPEGで保存する（オフにするとPNG）" checked={jpeg} onChange={setJpeg} />}
      </div>
      {src && out && (
        <>
          <div className="flex justify-center rounded-xl p-2" style={{ background: "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 16px 16px" }}>
            <canvas ref={preview} className="block max-h-[60vh] max-w-full" role="img" aria-label="余白を付けた仕上がりの見本" />
          </div>
          <Stats
            items={[
              { label: "元の画像", value: `${src.width}×${src.height}` },
              { label: "仕上がり（px）", value: `${out.width}×${out.height}`, emphasis: true },
            ]}
          />
        </>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} disabled={!src} onClick={save}>
          余白を付けて保存
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {msg}
        </span>
      </div>
      <p className={ui.note}>％は画像の短いほうの辺に対する割合です（縦長・横長でも、同じ％なら上下左右が同じ太さになります）。{PRIVACY}</p>
    </div>
  );
}

// ───────── モザイク・ぼかし ─────────

type Effect = "mosaic" | "blur" | "black";
type Region = Rect & { id: number; effect: Effect; level: number };
const EFFECT_LABEL: Record<Effect, string> = { mosaic: "モザイク", blur: "ぼかし", black: "黒塗り" };
type Draft = { x1: number; y1: number; x2: number; y2: number };

/** 元の画像の上に、範囲ごとの加工をかける */
function paint(c: HTMLCanvasElement, src: LoadedImage, regions: Region[]) {
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.clearRect(0, 0, c.width, c.height);
  g.drawImage(src.img, 0, 0, src.width, src.height);
  for (const r of regions) {
    if (r.w < 1 || r.h < 1) continue;
    const im = g.getImageData(r.x, r.y, r.w, r.h);
    const local = { x: 0, y: 0, w: r.w, h: r.h };
    const px = strengthPx(src.width, src.height, r.level);
    if (r.effect === "mosaic") pixelate(im.data, r.w, local, px);
    else if (r.effect === "blur") blurRect(im.data, r.w, local, px);
    else fillRect(im.data, r.w, local, [0, 0, 0]);
    g.putImageData(im, r.x, r.y);
  }
}

/** モザイク・ぼかし：ドラッグで囲んだ範囲を隠す */
export function ImageMosaic() {
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<LoadedImage | null>(null);
  const [effect, setEffect] = useState<Effect>("mosaic");
  const [level, setLevel] = useState<"1" | "2" | "4">("2");
  const [regions, setRegions] = useState<Region[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [msg, setMsg] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  const frame = useRef<HTMLDivElement>(null);

  const open = async (files: File[]) => {
    const f = files.find(isImageFile);
    if (!f) return setMsg("画像ファイルを選んでください");
    try {
      setMsg("読み込み中…");
      const s = await loadImage(f);
      setFile(f);
      setSrc(s);
      setRegions([]);
      setMsg("");
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  useEffect(() => {
    if (canvas.current && src) paint(canvas.current, src, regions);
  }, [src, regions]);

  /** 画面上の位置を、元の画像のpxにする */
  const toImage = (e: ReactPointerEvent) => {
    const box = frame.current!.getBoundingClientRect();
    const k = src!.width / box.width;
    return { x: (e.clientX - box.left) * k, y: (e.clientY - box.top) * k };
  };
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!src || !frame.current) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // 取れなくても画像の中では動く
    }
    const p = toImage(e);
    setDraft({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draft || !src || !frame.current) return;
    const p = toImage(e);
    setDraft({ ...draft, x2: p.x, y2: p.y });
  };
  const onUp = () => {
    if (!draft || !src) return;
    const r = rectFromPoints(draft.x1, draft.y1, draft.x2, draft.y2, src.width, src.height);
    setDraft(null);
    // 小さすぎる範囲（ただのタップ）は無視する
    if (r.w >= 4 && r.h >= 4) setRegions((p) => [...p, { ...r, id: nextId++, effect, level: Number(level) }]);
  };
  const onCancel = () => setDraft(null);

  const save = async () => {
    if (!file || !src) return;
    try {
      const format = formatFor(file);
      const { c } = makeCanvas(src.width, src.height);
      paint(c, src, regions);
      const blob = await toBlob(c, format);
      saveBlob(`${baseName(file.name)}_masked.${EXTENSION[format]}`, blob);
      setMsg(`保存しました（${formatBytes(blob.size)}）`);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const pct = (v: number, total: number) => `${(v / total) * 100}%`;
  const d = draft && src ? rectFromPoints(draft.x1, draft.y1, draft.x2, draft.y2, src.width, src.height) : null;
  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="画像" accept="image/*,.heic,.heif" onFiles={open} hint="スクリーンショットや写真の個人情報を隠せます" />
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <Choice
          label="隠し方"
          value={effect}
          onChange={setEffect}
          options={[
            ["mosaic", "モザイク"],
            ["blur", "ぼかし"],
            ["black", "黒塗り"],
          ]}
        />
        {effect !== "black" && (
          <Choice
            label="強さ"
            value={level}
            onChange={setLevel}
            options={[
              ["1", "弱い"],
              ["2", "ふつう"],
              ["4", "強い"],
            ]}
          />
        )}
      </div>
      {src && (
        <>
          <p className={ui.note}>隠したいところを画像の上でドラッグして囲んでください。何か所でも追加できます。</p>
          <div className="flex justify-center rounded-xl bg-field p-2">
            <div ref={frame} className="relative inline-block cursor-crosshair touch-none select-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel}>
              <canvas ref={canvas} className="block max-h-[65vh] max-w-full" role="img" aria-label={`加工中の画像（加工した範囲 ${regions.length}か所）`} />
              {d && <div className="pointer-events-none absolute border-2 border-dashed border-accent bg-accent/20" style={{ left: pct(d.x, src.width), top: pct(d.y, src.height), width: pct(d.w, src.width), height: pct(d.h, src.height) }} />}
            </div>
          </div>
        </>
      )}
      {regions.length > 0 && (
        <ol className="flex flex-col gap-1 text-sm" aria-label="加工した範囲">
          {regions.map((r, i) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line px-3 py-1.5">
              <span className="font-mono text-xs text-muted">{i + 1}</span>
              <span>
                {EFFECT_LABEL[r.effect]}（{r.w}×{r.h} px）
              </span>
              <button type="button" className={`${ui.button} ml-auto px-2 py-1 text-xs`} onClick={() => setRegions((p) => p.filter((x) => x.id !== r.id))}>
                この範囲を消す
              </button>
            </li>
          ))}
        </ol>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} disabled={!src} onClick={save}>
          保存
        </button>
        <button type="button" className={ui.button} disabled={!regions.length} onClick={() => setRegions((p) => p.slice(0, -1))}>
          ひとつ戻す
        </button>
        <button type="button" className={ui.button} disabled={!regions.length} onClick={() => setRegions([])}>
          すべて消す
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {msg}
        </span>
      </div>
      <p className={ui.note}>
        保存した画像は加工が画素そのものに焼き付けられるので、あとから元に戻すことはできません。撮影日時や位置情報などの情報（Exif）も消えます。弱いぼかしは読み取れてしまうことがあるため、文字や番号を確実に隠したいときは「黒塗り」がおすすめです。{PRIVACY}
      </p>
    </div>
  );
}
