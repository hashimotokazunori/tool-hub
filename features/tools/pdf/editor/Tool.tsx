"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { FileDrop } from "@/components/FileDrop";
import { Check, Choice } from "@/components/TextTransform";
import { Field } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { baseName, formatBytes, saveBlob } from "@/lib/files";
import { isImageFile, loadImage } from "@/lib/image";
import { clampRect, displaySize, imagePlacement, LINE_HEIGHT, normRotation, rectFromPoints, rectToPdf, resizeRect, TEXT_PADDING, textBoxSize, textRenderScale, type Rect, type Rotation, type View } from "./logic";

const isPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);
const pdfLib = () => import("pdf-lib");
async function pdfjs() {
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return lib;
}
type PdfJsDoc = Awaited<ReturnType<Awaited<ReturnType<typeof pdfjs>>["getDocument"]>["promise"]>;

type Font = "gothic" | "mincho";
const FONT_FAMILY: Record<Font, string> = {
  gothic: `"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", YuGothic, Meiryo, "Noto Sans JP", sans-serif`,
  mincho: `"Hiragino Mincho ProN", "Yu Mincho", YuMincho, "MS PMincho", "Noto Serif JP", serif`,
};

type TextStyle = { text: string; size: number; color: string; font: Font };
type Item = Rect & { id: number; page: number } & ({ kind: "text"; style: TextStyle; src: string } | { kind: "tape" } | { kind: "image"; src: string; aspect: number });
type PageInfo = { view: View; rotation: Rotation; width: number; height: number };
type Shown = PageInfo & { index: number; url: string };
type Drag = { id: number; mode: "move" | "resize" | "draw"; sx: number; sy: number; orig: Rect };

let nextId = 1;

/** 文字を透明な背景のPNG画像にする（日本語をそのままの見た目でPDFに入れるため） */
function renderText(style: TextStyle): { src: string; w: number; h: number } {
  const lines = style.text.split(/\r\n|\r|\n/);
  const c = document.createElement("canvas");
  const g = c.getContext("2d")!;
  // 小さな文字では幅の測り方がずれるので、100px で測って1ptあたりに直す
  g.font = `100px ${FONT_FAMILY[style.font]}`;
  const widths = lines.map((l) => g.measureText(l).width / 100);
  const { w, h } = textBoxSize(widths, style.size);
  const k = textRenderScale(w, h);
  c.width = Math.ceil(w * k);
  c.height = Math.ceil(h * k);
  g.scale(k, k);
  g.font = `${style.size}px ${FONT_FAMILY[style.font]}`;
  g.fillStyle = style.color;
  g.textBaseline = "middle";
  const pad = style.size * TEXT_PADDING;
  lines.forEach((l, i) => g.fillText(l, pad, pad + style.size * LINE_HEIGHT * (i + 0.5)));
  return { src: c.toDataURL("image/png"), w, h };
}

/** 押印などの画像をPNGにする。白っぽい背景を透明にすることもできる */
async function stampFromFile(file: File, transparentWhite: boolean): Promise<{ src: string; aspect: number }> {
  const im = await loadImage(file);
  try {
    const s = Math.min(1, 1000 / Math.max(im.width, im.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(im.width * s));
    c.height = Math.max(1, Math.round(im.height * s));
    const g = c.getContext("2d")!;
    g.drawImage(im.img, 0, 0, c.width, c.height);
    if (transparentWhite) {
      const d = g.getImageData(0, 0, c.width, c.height);
      const p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        const min = Math.min(p[i], p[i + 1], p[i + 2]);
        // 白に近いほど透明にする（ふちがギザギザにならないよう、なめらかに）
        if (min > 200) p[i + 3] = Math.round(p[i + 3] * Math.max(0, (245 - min) / 45));
      }
      g.putImageData(d, 0, 0);
    }
    return { src: c.toDataURL("image/png"), aspect: c.width / c.height };
  } finally {
    URL.revokeObjectURL(im.url);
  }
}

/** PDF編集（文字の書き込み・修正テープ・押印） */
export function PdfEditor() {
  const [file, setFile] = useState<{ name: string; bytes: Uint8Array } | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [shown, setShown] = useState<Shown | null>(null);
  const [infos, setInfos] = useState<Record<number, PageInfo>>({});
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [tapeMode, setTapeMode] = useState(false);
  const [draft, setDraft] = useState<TextStyle>({ text: "", size: 12, color: "#000000", font: "gothic" });
  const [transparent, setTransparent] = useState(true);
  const [msg, setMsg] = useState("");
  const docRef = useRef<PdfJsDoc | null>(null);
  const seq = useRef(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  const showPage = async (index: number, doc = docRef.current) => {
    if (!doc) return;
    const my = ++seq.current;
    setSelected(null);
    setMsg(`${index + 1}ページ目を表示しています…`);
    try {
      const page = await doc.getPage(index + 1);
      const view = page.view as View;
      const rotation = normRotation(page.rotate);
      const { width, height } = displaySize(view, rotation);
      const scale = Math.min(3, 2000 / Math.max(width, height));
      const vp = page.getViewport({ scale });
      const c = document.createElement("canvas");
      c.width = Math.ceil(vp.width);
      c.height = Math.ceil(vp.height);
      const g = c.getContext("2d")!;
      g.fillStyle = "#fff";
      g.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: g, viewport: vp, intent: "print" }).promise;
      if (my !== seq.current) return;
      const info = { view, rotation, width, height };
      setInfos((p) => ({ ...p, [index]: info }));
      setShown({ ...info, index, url: c.toDataURL("image/jpeg", 0.9) });
      setMsg("");
    } catch (e) {
      if (my === seq.current) setMsg(`ページを表示できませんでした：${(e as Error).message}`);
    }
  };

  const open = async (files: File[]) => {
    const f = files.find(isPdf);
    if (!f) return setMsg("PDFファイルを選んでください");
    try {
      setMsg("読み込み中…");
      const bytes = new Uint8Array(await f.arrayBuffer());
      const lib = await pdfjs();
      // pdf.js は渡したデータを使い切るので、保存用とは別にコピーを渡す
      const doc = await lib.getDocument({ data: bytes.slice(), isEvalSupported: false }).promise;
      await docRef.current?.destroy();
      docRef.current = doc;
      setFile({ name: f.name, bytes });
      setNumPages(doc.numPages);
      setItems([]);
      setInfos({});
      setShown(null);
      await showPage(0, doc);
    } catch (e) {
      setMsg(`読み込めませんでした（パスワード付きか、壊れている可能性があります）：${(e as Error).message}`);
    }
  };

  const sel = items.find((it) => it.id === selected) ?? null;
  const pageItems = shown ? items.filter((it) => it.page === shown.index) : [];
  const update = (id: number, patch: Partial<Rect>) => setItems((list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id: number) => {
    setItems((list) => list.filter((it) => it.id !== id));
    setSelected(null);
  };

  /** 新しい書き込みをページの中央に置く */
  const place = (w: number, h: number): Rect => (shown ? clampRect({ x: (shown.width - w) / 2, y: (shown.height - h) / 2, w, h }, shown.width, shown.height) : { x: 0, y: 0, w, h });

  const addText = () => {
    if (!shown || !draft.text.trim()) return;
    const r = renderText(draft);
    const id = nextId++;
    setItems((list) => [...list, { id, page: shown.index, kind: "text", style: draft, src: r.src, ...place(r.w, r.h) }]);
    setSelected(id);
    setTapeMode(false);
  };

  const editText = (it: Item, patch: Partial<TextStyle>) => {
    if (it.kind !== "text" || !shown) return;
    const style = { ...it.style, ...patch };
    const r = renderText(style);
    setItems((list) => list.map((x) => (x.id === it.id ? { ...x, style, src: r.src, ...clampRect({ x: it.x, y: it.y, w: r.w, h: r.h }, shown.width, shown.height) } : x)));
  };

  const addStamp = async (files: File[]) => {
    const f = files.find(isImageFile);
    if (!f || !shown) return setMsg("画像ファイルを選んでください");
    try {
      const s = await stampFromFile(f, transparent);
      // 印鑑の大きさに近い、幅60pt（約21mm）で置く
      const w = Math.min(60, shown.width);
      const id = nextId++;
      setItems((list) => [...list, { id, page: shown.index, kind: "image", src: s.src, aspect: s.aspect, ...place(w, w / s.aspect) }]);
      setSelected(id);
      setTapeMode(false);
      setMsg("");
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  // ── ドラッグ（移動・大きさの変更・修正テープを引く） ──
  const toPt = (e: ReactPointerEvent) => {
    const b = boxRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - b.left) / b.width) * shown!.width, y: ((e.clientY - b.top) / b.height) * shown!.height };
  };
  const startDrag = (e: ReactPointerEvent, it: Item, mode: "move" | "resize") => {
    e.stopPropagation();
    e.preventDefault();
    boxRef.current?.setPointerCapture(e.pointerId);
    const p = toPt(e);
    drag.current = { id: it.id, mode, sx: p.x, sy: p.y, orig: { x: it.x, y: it.y, w: it.w, h: it.h } };
    setSelected(it.id);
  };
  const onBoxDown = (e: ReactPointerEvent) => {
    if (!shown) return;
    if (!tapeMode) return setSelected(null);
    e.preventDefault();
    boxRef.current?.setPointerCapture(e.pointerId);
    const p = toPt(e);
    const id = nextId++;
    setItems((list) => [...list, { id, page: shown.index, kind: "tape", x: p.x, y: p.y, w: 0, h: 0 }]);
    setSelected(id);
    drag.current = { id, mode: "draw", sx: p.x, sy: p.y, orig: { x: p.x, y: p.y, w: 0, h: 0 } };
  };
  const onBoxMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d || !shown) return;
    const p = toPt(e);
    const { width: W, height: H } = shown;
    if (d.mode === "draw") {
      const cx = Math.min(Math.max(0, p.x), W);
      const cy = Math.min(Math.max(0, p.y), H);
      update(d.id, rectFromPoints(d.sx, d.sy, cx, cy));
    } else if (d.mode === "move") {
      update(d.id, clampRect({ ...d.orig, x: d.orig.x + p.x - d.sx, y: d.orig.y + p.y - d.sy }, W, H));
    } else {
      const it = items.find((x) => x.id === d.id);
      update(d.id, resizeRect(d.orig, d.orig.w + p.x - d.sx, d.orig.h + p.y - d.sy, W, H, it?.kind === "image" ? it.aspect : undefined));
    }
  };
  const onBoxUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.mode === "draw") {
      // ほとんど動かさなかったときは引かなかったことにする
      const it = items.find((x) => x.id === d.id);
      if (it && (it.w < 3 || it.h < 3)) remove(d.id);
    }
  };
  const onItemKey = (e: KeyboardEvent, it: Item) => {
    if (!shown) return;
    const step = e.shiftKey ? 10 : 1;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      update(it.id, clampRect({ ...it, x: it.x + moves[e.key][0], y: it.y + moves[e.key][1] }, shown.width, shown.height));
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      remove(it.id);
    }
  };

  const save = async () => {
    if (!file || !items.length) return;
    try {
      setMsg("保存中…");
      const { PDFDocument, rgb, degrees } = await pdfLib();
      const doc = await PDFDocument.load(file.bytes).catch((e: Error) => {
        throw /encrypt/i.test(`${e.name} ${e.message}`) ? new Error("パスワードや編集の制限がかかったPDFは保存できません") : e;
      });
      const embedded = new Map<string, Awaited<ReturnType<typeof doc.embedPng>>>();
      for (const it of items) {
        const info = infos[it.page];
        if (!info) continue;
        const page = doc.getPage(it.page);
        if (it.kind === "tape") {
          page.drawRectangle({ ...rectToPdf(info.view, info.rotation, it), color: rgb(1, 1, 1), borderWidth: 0 });
        } else {
          let png = embedded.get(it.src);
          if (!png) {
            png = await doc.embedPng(it.src);
            embedded.set(it.src, png);
          }
          const p = imagePlacement(info.view, info.rotation, it);
          page.drawImage(png, { ...p, rotate: degrees(p.rotate) });
        }
      }
      const bytes = await doc.save();
      saveBlob(`${baseName(file.name)}_edited.pdf`, new Blob([bytes as BlobPart], { type: "application/pdf" }));
      setMsg(`保存しました（${formatBytes(bytes.length)}）`);
    } catch (e) {
      setMsg(`保存できませんでした：${(e as Error).message}`);
    }
  };

  const pct = (v: number, total: number) => `${(v / total) * 100}%`;
  const label = (it: Item) => (it.kind === "text" ? `文字「${it.style.text.slice(0, 20)}」` : it.kind === "tape" ? "修正テープ" : "画像");

  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="PDF" accept="application/pdf,.pdf" onFiles={open} hint={file ? `${file.name}（${numPages}ページ）を編集中。別のPDFを入れると書き込みは消えます` : undefined} />
      {shown && (
        <>
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-field/60 p-3">
            <Field label="書き込む文字（改行できます）">
              <textarea className={`${ui.input} min-h-16`} value={draft.text} placeholder="例：2026年10月19日　山田太郎" onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
            </Field>
            <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
              <Field label="文字の大きさ（pt）">
                <input type="number" inputMode="decimal" min={4} max={144} className={`${ui.input} w-24`} value={draft.size} onChange={(e) => setDraft({ ...draft, size: Math.min(144, Math.max(4, Number(e.target.value) || 12)) })} />
              </Field>
              <Field label="色">
                <input type="color" className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-field p-1" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} />
              </Field>
              <Choice label="書体" value={draft.font} onChange={(font) => setDraft({ ...draft, font })} options={[["gothic", "ゴシック"], ["mincho", "明朝"]]} />
              <button type="button" className={ui.buttonPrimary} disabled={!draft.text.trim()} onClick={addText}>
                文字を追加
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={tapeMode ? ui.buttonPrimary : ui.button} aria-pressed={tapeMode} onClick={() => setTapeMode(!tapeMode)}>
                {tapeMode ? "修正テープを引く（ページをドラッグ）" : "修正テープ（白い四角）"}
              </button>
              <label className={`${ui.button} cursor-pointer focus-within:outline-2 focus-within:outline-accent`}>
                印鑑・画像を追加
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files?.length) addStamp([...e.target.files]);
                    e.target.value = "";
                  }}
                />
              </label>
              <Check label="画像の白い背景を透明にする" checked={transparent} onChange={setTransparent} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={ui.button} disabled={shown.index === 0} onClick={() => showPage(shown.index - 1)}>
              ← 前のページ
            </button>
            <label className="flex items-center gap-1.5 text-sm">
              <select className={`${ui.input} w-auto py-1.5`} aria-label="表示するページ" value={shown.index} onChange={(e) => showPage(Number(e.target.value))}>
                {Array.from({ length: numPages }, (_, i) => (
                  <option key={i} value={i}>
                    {i + 1}
                  </option>
                ))}
              </select>
              / {numPages}ページ
            </label>
            <button type="button" className={ui.button} disabled={shown.index >= numPages - 1} onClick={() => showPage(shown.index + 1)}>
              次のページ →
            </button>
          </div>

          <div className="rounded-xl border border-line bg-slate-100 p-3">
            <div
              ref={boxRef}
              className={`relative mx-auto w-full bg-white shadow select-none ${tapeMode ? "cursor-crosshair touch-none" : ""}`}
              style={{ maxWidth: `${Math.max(320, (shown.width / shown.height) * 900)}px` }}
              onPointerDown={onBoxDown}
              onPointerMove={onBoxMove}
              onPointerUp={onBoxUp}
              onPointerCancel={onBoxUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- 端末で描いたページの画像（data:）を表示する */}
              <img src={shown.url} alt={`${shown.index + 1}ページ目`} className="block h-auto w-full" draggable={false} />
              {pageItems.map((it) => (
                <div
                  key={it.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${label(it)}（矢印キーで移動、Deleteで削除）`}
                  aria-pressed={it.id === selected}
                  className={`absolute touch-none ${tapeMode ? "" : "cursor-move"} ${it.id === selected ? "outline-2 outline-accent" : it.kind === "tape" ? "outline-1 outline-dashed outline-slate-400" : "hover:outline-1 hover:outline-dashed hover:outline-accent"}`}
                  style={{ left: pct(it.x, shown.width), top: pct(it.y, shown.height), width: pct(it.w, shown.width), height: pct(it.h, shown.height), background: it.kind === "tape" ? "#fff" : undefined }}
                  onPointerDown={(e) => (tapeMode ? undefined : startDrag(e, it, "move"))}
                  onFocus={() => setSelected(it.id)}
                  onKeyDown={(e) => onItemKey(e, it)}
                >
                  {it.kind !== "tape" && (
                    // eslint-disable-next-line @next/next/no-img-element -- 端末で作った画像（data:）を表示する
                    <img src={it.src} alt="" className="pointer-events-none block h-full w-full" draggable={false} />
                  )}
                  {it.id === selected && it.kind !== "text" && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-2.5 -bottom-2.5 h-5 w-5 cursor-nwse-resize rounded-full border-2 border-white bg-accent shadow"
                      onPointerDown={(e) => startDrag(e, it, "resize")}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {sel && (
            <div className="flex flex-col gap-3 rounded-2xl border border-accent/40 bg-accent-soft/40 p-3">
              <p className="text-sm font-semibold">選択中：{label(sel)}</p>
              {sel.kind === "text" && (
                <>
                  <Field label="文字を直す">
                    <textarea className={`${ui.input} min-h-16`} value={sel.style.text} onChange={(e) => editText(sel, { text: e.target.value })} />
                  </Field>
                  <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
                    <Field label="大きさ（pt）">
                      <input type="number" inputMode="decimal" min={4} max={144} className={`${ui.input} w-24`} value={sel.style.size} onChange={(e) => editText(sel, { size: Math.min(144, Math.max(4, Number(e.target.value) || 12)) })} />
                    </Field>
                    <Field label="色">
                      <input type="color" className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-field p-1" value={sel.style.color} onChange={(e) => editText(sel, { color: e.target.value })} />
                    </Field>
                    <Choice label="書体" value={sel.style.font} onChange={(font) => editText(sel, { font })} options={[["gothic", "ゴシック"], ["mincho", "明朝"]]} />
                  </div>
                </>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className={ui.button} onClick={() => remove(sel.id)}>
                  この書き込みを削除
                </button>
                <button type="button" className={ui.button} onClick={() => setSelected(null)}>
                  選択をやめる
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={ui.buttonPrimary} disabled={!items.length} onClick={save}>
              保存
            </button>
            <button
              type="button"
              className={ui.button}
              disabled={!pageItems.length}
              onClick={() => {
                setItems((list) => list.filter((it) => it.page !== shown.index));
                setSelected(null);
              }}
            >
              このページの書き込みを全部消す
            </button>
            <span className="text-sm text-muted">書き込み：このページ {pageItems.length}件・全体 {items.length}件</span>
          </div>
        </>
      )}
      <p className="text-sm text-muted" aria-live="polite">
        {msg}
      </p>
      <p className={ui.note}>
        書き込みは、ドラッグで動かし、右下の丸で大きさを変えられます（キーボードでは選んで矢印キーで移動、Deleteで削除）。点線の枠は編集画面だけの表示で、保存したPDFには入りません。元のPDFの文字や画像はそのまま残り、文字の検索やコピーもこれまでどおりできます。ただし、追加した文字は日本語をそのままの見た目で入れるために画像にしているので、検索やコピーはできません。修正テープは上から白い四角を重ねるだけで、下の文字のデータは消えません（文字の選択やコピーで読めてしまいます）。人に見せたくない情報を消す目的には使わないでください。PDFはサーバーに送らず、この端末の中だけで処理します。
      </p>
    </div>
  );
}
