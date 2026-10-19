"use client";

import { useEffect, useRef, useState } from "react";
import { FileDrop } from "@/components/FileDrop";
import { Check, Choice } from "@/components/TextTransform";
import { CopyButton, Field, FieldGrid } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { saveBlob, saveZip } from "@/lib/files";
import { isImageFile, loadImage, type LoadedImage } from "@/lib/image";
import { FAVICON_FILES, ICO_SIZES, buildIco, faviconHtml, fitFontSize, webManifest } from "./logic";

type Shape = "square" | "rounded" | "circle";
type Fit = "cover" | "contain";

type IconOptions = {
  mode: "image" | "text";
  src: LoadedImage | null;
  fit: Fit;
  padding: number;
  text: string;
  textColor: string;
  bold: boolean;
  bg: string;
  transparent: boolean;
  shape: Shape;
};

const FONT = `"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", Meiryo, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
const isHex = (s: string) => /^#[0-9a-f]{6}$/i.test(s);

/**
 * アイコンを描く。apple が true のときは iPhone 向けに、角を切らず背景を必ず塗る
 * （iOS は透明の部分を黒くし、角は自分で丸めるため）
 */
function drawIcon(g: CanvasRenderingContext2D, size: number, o: IconOptions, apple = false) {
  g.clearRect(0, 0, size, size);
  g.save();
  if (!apple && o.shape !== "square") {
    g.beginPath();
    if (o.shape === "circle") g.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    else g.roundRect(0, 0, size, size, size * 0.2);
    g.clip();
  }
  if (!o.transparent || apple) {
    g.fillStyle = o.transparent ? "#ffffff" : o.bg;
    g.fillRect(0, 0, size, size);
  }
  g.imageSmoothingQuality = "high";
  if (o.mode === "image" && o.src) {
    const { img, width: w, height: h } = o.src;
    if (o.fit === "cover") {
      const s = Math.min(w, h);
      g.drawImage(img, (w - s) / 2, (h - s) / 2, s, s, 0, 0, size, size);
    } else {
      const box = size * (1 - (2 * o.padding) / 100);
      const k = Math.min(box / w, box / h);
      const dw = w * k;
      const dh = h * k;
      g.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
    }
  } else if (o.mode === "text" && o.text.trim()) {
    const text = o.text.trim();
    const weight = o.bold ? "700" : "400";
    g.font = `${weight} 100px ${FONT}`;
    const fs = fitFontSize(size, g.measureText(text).width, o.shape === "circle" ? 0.66 : 0.78);
    g.font = `${weight} ${fs}px ${FONT}`;
    g.fillStyle = o.textColor;
    g.textAlign = "center";
    g.textBaseline = "alphabetic";
    const m = g.measureText(text);
    g.fillText(text, size / 2, size / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
  }
  g.restore();
}

/** 描いたアイコンを表示するキャンバス。表示の大きさ（display）と描く大きさ（size）を分けられる */
function IconCanvas({ size, display, options, apple, label }: { size: number; display: number; options: IconOptions; apple?: boolean; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const g = ref.current?.getContext("2d");
    if (g) drawIcon(g, size, options, apple);
  });
  return <canvas ref={ref} width={size} height={size} style={{ width: display, height: display }} role="img" aria-label={label} />;
}

async function renderPng(size: number, o: IconOptions, apple = false): Promise<Uint8Array> {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  drawIcon(c.getContext("2d")!, size, o, apple);
  const blob = await new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("画像を書き出せませんでした"))), "image/png"));
  return new Uint8Array(await blob.arrayBuffer());
}

/** ブラウザのタブ風の見本 */
function FakeTab({ options, title, dark }: { options: IconOptions; title: string; dark: boolean }) {
  return (
    <div className={`rounded-xl p-2 pb-0 ${dark ? "bg-[#202124]" : "bg-[#dee1e6]"}`}>
      <div className={`flex w-full max-w-60 items-center gap-2 rounded-t-lg px-3 py-2 text-xs ${dark ? "bg-[#35363a] text-[#e8eaed]" : "bg-white text-[#3c4043]"}`}>
        <IconCanvas size={32} display={16} options={options} label="タブに表示されるアイコン" />
        <span className="truncate">{title || "サイトの名前"}</span>
        <span className="ml-auto opacity-60" aria-hidden="true">
          ×
        </span>
      </div>
    </div>
  );
}

/** ファビコン作成・プレビュー */
export function FaviconMaker() {
  const [mode, setMode] = useState<"image" | "text">("text");
  const [src, setSrc] = useState<LoadedImage | null>(null);
  const [fit, setFit] = useState<Fit>("contain");
  const [padding, setPadding] = useState(0);
  const [text, setText] = useState("ツ");
  const [textColor, setTextColor] = useState("#ffffff");
  const [bold, setBold] = useState(true);
  const [bg, setBg] = useState("#4f46e5");
  const [transparent, setTransparent] = useState(false);
  const [shape, setShape] = useState<Shape>("rounded");
  const [siteName, setSiteName] = useState("");
  const [msg, setMsg] = useState("");

  const options: IconOptions = { mode, src, fit, padding, text, textColor: isHex(textColor) ? textColor : "#ffffff", bold, bg: isHex(bg) ? bg : "#4f46e5", transparent, shape };
  const manifest = webManifest({ name: siteName, shortName: siteName, themeColor: options.bg, backgroundColor: transparent ? "#ffffff" : options.bg });
  const html = faviconHtml();
  const ready = mode === "text" ? !!text.trim() : !!src;

  const open = async (files: File[]) => {
    const f = files.find(isImageFile);
    if (!f) return setMsg("画像ファイルを選んでください");
    try {
      setMsg("読み込み中…");
      const s = await loadImage(f);
      if (src) URL.revokeObjectURL(src.url);
      setSrc(s);
      setMsg(`${f.name}（${s.width}×${s.height}）を読み込みました`);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const makeIco = async () => buildIco(await Promise.all(ICO_SIZES.map(async (size) => ({ size, png: await renderPng(size, options) }))));

  const downloadZip = async () => {
    try {
      setMsg("作成中…");
      const pngs = await Promise.all(FAVICON_FILES.map(async (f) => ({ name: f.name, data: await renderPng(f.size, options, f.size === 180) })));
      await saveZip("favicon.zip", [{ name: "favicon.ico", data: await makeIco() }, ...pngs, { name: "site.webmanifest", data: manifest }]);
      setMsg("favicon.zip を保存しました");
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Choice
        label="作り方"
        value={mode}
        onChange={setMode}
        options={[
          ["text", "文字・絵文字から作る"],
          ["image", "画像から作る"],
        ]}
      />
      {mode === "image" ? (
        <>
          <FileDrop label="画像ファイル" accept="image/*,.heic,.heif" onFiles={open} hint="正方形で、512px以上の画像がきれいに仕上がります" />
          <FieldGrid>
            <Choice
              label="正方形でない画像"
              value={fit}
              onChange={setFit}
              options={[
                ["contain", "全体を収める"],
                ["cover", "中央を切り抜く"],
              ]}
            />
            {fit === "contain" && (
              <Field label={`余白（${padding}%）`}>
                <input type="range" className="w-full accent-accent" min={0} max={25} value={padding} onChange={(e) => setPadding(Number(e.target.value))} />
              </Field>
            )}
          </FieldGrid>
        </>
      ) : (
        <FieldGrid>
          <Field label="文字・絵文字（1〜2文字がおすすめ）">
            <input className={ui.input} value={text} maxLength={8} onChange={(e) => setText(e.target.value)} />
          </Field>
          <Field label="文字の色">
            <span className="flex gap-2">
              <input type="color" aria-label="文字の色を色から選ぶ" className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-line bg-field p-1" value={isHex(textColor) ? textColor : "#ffffff"} onChange={(e) => setTextColor(e.target.value)} />
              <input className={`${ui.input} font-mono`} value={textColor} spellCheck={false} onChange={(e) => setTextColor(e.target.value)} />
            </span>
          </Field>
          <div className="flex items-end pb-2">
            <Check label="太字にする" checked={bold} onChange={setBold} />
          </div>
        </FieldGrid>
      )}
      <FieldGrid>
        <Field label="背景の色">
          <span className="flex gap-2">
            <input type="color" aria-label="背景の色を色から選ぶ" className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-line bg-field p-1" value={isHex(bg) ? bg : "#4f46e5"} disabled={transparent} onChange={(e) => setBg(e.target.value)} />
            <input className={`${ui.input} font-mono`} value={bg} spellCheck={false} disabled={transparent} onChange={(e) => setBg(e.target.value)} />
          </span>
        </Field>
        <Choice
          label="形"
          value={shape}
          onChange={setShape}
          options={[
            ["square", "四角"],
            ["rounded", "角丸"],
            ["circle", "丸"],
          ]}
        />
        <div className="flex items-end pb-2">
          <Check label="背景を透明にする" checked={transparent} onChange={setTransparent} />
        </div>
        <Field label="サイトの名前（タブの見本と webmanifest に使います）">
          <input className={ui.input} value={siteName} placeholder="ツールひろば" onChange={(e) => setSiteName(e.target.value)} />
        </Field>
      </FieldGrid>

      {ready && (
        <section className="flex flex-col gap-3" aria-label="プレビュー">
          <h3 className={ui.h3}>プレビュー</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <FakeTab options={options} title={siteName} dark={false} />
            <FakeTab options={options} title={siteName} dark />
          </div>
          <ul className="flex flex-wrap items-end gap-4">
            {FAVICON_FILES.map((f) => (
              <li key={f.name} className="flex flex-col items-center gap-1 text-center text-xs text-muted">
                <span className="rounded-lg border border-line bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#fff_0%_50%)] bg-[length:12px_12px] p-1">
                  <IconCanvas size={f.size} display={Math.min(f.size, 96)} options={options} apple={f.size === 180} label={`${f.size}×${f.size}のアイコン`} />
                </span>
                <span>
                  {f.size}×{f.size}
                  <span className="block">{f.note}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} disabled={!ready} onClick={downloadZip}>
          まとめて保存（ZIP）
        </button>
        <button
          type="button"
          className={ui.button}
          disabled={!ready}
          onClick={async () => {
            try {
              saveBlob("favicon.ico", new Blob([(await makeIco()) as BlobPart], { type: "image/x-icon" }));
            } catch (e) {
              setMsg((e as Error).message);
            }
          }}
        >
          favicon.ico だけ保存
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {msg || (mode === "image" && !src ? "画像を選んでください" : "")}
        </span>
      </div>

      <Field label="<head> に貼るタグ">
        <textarea className={`${ui.input} min-h-32 font-mono text-xs`} value={html} readOnly />
      </Field>
      <div>
        <CopyButton text={html} label="タグをコピー" />
      </div>
      <Field label="site.webmanifest（ZIPに入っています）">
        <textarea className={`${ui.input} min-h-40 font-mono text-xs`} value={manifest} readOnly />
      </Field>

      <p className={ui.note}>
        ZIPには favicon.ico（16・32・48pxを1つにまとめたもの）、PNG 6種類、site.webmanifest が入っています。ファイルはサイトのいちばん上の階層に置き、タグを &lt;head&gt; に貼ってください。apple-touch-icon は iPhone が透明部分を黒くし、角を自分で丸めるため、四角いまま背景を塗って作ります。画像はこの端末の中だけで処理します。
      </p>
    </div>
  );
}
