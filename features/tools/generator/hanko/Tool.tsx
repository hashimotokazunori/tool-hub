"use client";

import { useEffect, useRef, useState } from "react";
import { Choice } from "@/components/TextTransform";
import { Field, FieldGrid } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { useClientValue } from "@/components/useClientValue";
import { formatBytes, saveBlob } from "@/lib/files";
import { parseYmd, toYmd } from "@/lib/date";
import { HANKO_SIZES, chars, chordWidth, dateTiers, roundTwoColumns, roundVertical, squareLayout, stampDate, strokeWidth, type CharBox, type DateStyle } from "./logic";

type Kind = "round" | "square" | "date";
type Thick = "thin" | "normal" | "bold";
type FontKind = "sans" | "serif";

const COLORS: [string, string][] = [
  ["#E3392B", "朱色"],
  ["#C8102E", "赤"],
  ["#1F3A93", "藍色"],
  ["#222222", "黒"],
];
const SERIF = '"Hiragino Mincho ProN", "Yu Mincho", YuMincho, "Noto Serif JP", serif';
const CHECKER = "repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50% / 14px 14px";

type Opts = {
  kind: Kind;
  layout: "one" | "two";
  name: string;
  right: string;
  left: string;
  company: string;
  top: string;
  date: string;
  bottom: string;
  color: string;
  thick: Thick;
  font: FontKind;
};

/** 1文字を枠いっぱいに描く（漢字はほぼ正方形なので、縦横の比で伸び縮みさせる） */
function drawChar(g: CanvasRenderingContext2D, b: CharBox, family: string, weight: number) {
  g.save();
  g.translate(b.cx, b.cy);
  g.scale(b.w / b.h, 1);
  g.font = `${weight} ${b.h}px ${family}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(b.ch, 0, b.h * 0.04);
  g.restore();
}

/** 1行の文字を、高さ h・幅 maxW に収めて描く */
function drawLine(g: CanvasRenderingContext2D, text: string, cx: number, cy: number, h: number, maxW: number, family: string, weight: number) {
  if (!text) return;
  g.save();
  g.font = `${weight} ${h}px ${family}`;
  const w = g.measureText(text).width;
  g.translate(cx, cy);
  if (w > maxW) g.scale(maxW / w, 1);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 0, h * 0.04);
  g.restore();
}

function render(c: HTMLCanvasElement, size: number, o: Opts, sans: string) {
  c.width = size;
  c.height = size;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, size, size);
  g.fillStyle = o.color;
  g.strokeStyle = o.color;
  const sw = strokeWidth(size, o.thick);
  const family = o.font === "serif" ? SERIF : sans;
  const weight = o.font === "serif" ? 600 : o.thick === "thin" ? 500 : 700;
  g.lineWidth = sw;
  const margin = size * 0.02 + sw / 2;
  if (o.kind === "square") {
    const s = size - margin * 2;
    g.beginPath();
    g.roundRect(margin, margin, s, s, size * 0.025);
    g.stroke();
    const inner = s - sw;
    squareLayout(o.company, size, inner).forEach((b) => drawChar(g, b, family, weight));
    return;
  }
  const R = size / 2 - margin;
  g.beginPath();
  g.arc(size / 2, size / 2, R, 0, Math.PI * 2);
  g.stroke();
  const inner = 2 * R - sw;
  if (o.kind === "round") {
    const boxes = o.layout === "two" ? roundTwoColumns(o.right, o.left, size, inner) : roundVertical(o.name, size, inner);
    boxes.forEach((b) => drawChar(g, b, family, weight));
    return;
  }
  // 日付印：2本の横線で3段に分ける
  const t = dateTiers(size, inner);
  g.lineWidth = sw * 0.75;
  for (const y of t.lineY) {
    g.beginPath();
    g.moveTo(size / 2 - t.lineHalf, y);
    g.lineTo(size / 2 + t.lineHalf, y);
    g.stroke();
  }
  const d = parseYmd(o.date);
  drawLine(g, o.top, size / 2, t.top.cy, t.top.h, chordWidth(size, inner, t.top.cy, t.top.h), family, weight);
  drawLine(g, d ? o.date : "", size / 2, t.middle.cy, t.middle.h, t.lineHalf * 2 * 0.86, family, weight);
  drawLine(g, o.bottom, size / 2, t.bottom.cy, t.bottom.h, chordWidth(size, inner, t.bottom.cy, t.bottom.h), family, weight);
}

/** 電子印鑑：丸印・角印・日付印の透過PNGを作る */
export function Hanko() {
  const today = useClientValue(() => toYmd(new Date()), "");
  const [kind, setKind] = useState<Kind>("round");
  const [layout, setLayout] = useState<"one" | "two">("one");
  const [name, setName] = useState("山田");
  const [right, setRight] = useState("山田");
  const [left, setLeft] = useState("太郎");
  const [company, setCompany] = useState("見本商事株式会社之印");
  const [top, setTop] = useState("経理部");
  const [dateInput, setDateInput] = useState<string | null>(null);
  const [dateStyle, setDateStyle] = useState<DateStyle>("reiwa");
  const [bottom, setBottom] = useState("山田");
  const [color, setColor] = useState("#E3392B");
  const [size, setSize] = useState<"300" | "400" | "500" | "600">("400");
  const [thick, setThick] = useState<Thick>("normal");
  const [font, setFont] = useState<FontKind>("serif");
  const [msg, setMsg] = useState("");
  const preview = useRef<HTMLCanvasElement>(null);

  const ymd = dateInput ?? today;
  const d = parseYmd(ymd);
  const opts: Opts = { kind, layout, name, right, left, company, top, bottom, color, thick, font, date: d ? stampDate(d.getFullYear(), d.getMonth() + 1, d.getDate(), dateStyle) : "" };

  useEffect(() => {
    if (preview.current) render(preview.current, 400, opts, getComputedStyle(document.body).fontFamily || "sans-serif");
  });

  const save = () => {
    const c = document.createElement("canvas");
    render(c, Number(size), opts, getComputedStyle(document.body).fontFamily || "sans-serif");
    c.toBlob((b) => {
      if (!b) return setMsg("画像を書き出せませんでした");
      const label = kind === "round" ? "maruin" : kind === "square" ? "kakuin" : "hizukein";
      saveBlob(`hanko_${label}_${size}px.png`, b);
      setMsg(`保存しました（${size}×${size} px・${formatBytes(b.size)}）`);
    }, "image/png");
  };

  const n = kind === "square" ? chars(company).length : 0;
  const preset = COLORS.find(([v]) => v === color);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex shrink-0 justify-center rounded-xl border border-line p-3" style={{ background: CHECKER }}>
          <canvas ref={preview} className="block h-48 w-48 sm:h-56 sm:w-56" role="img" aria-label="電子印鑑の見本（市松模様の所は透明）" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Choice
            label="印鑑の種類"
            value={kind}
            onChange={setKind}
            options={[
              ["round", "丸印（認印）"],
              ["square", "角印（会社印）"],
              ["date", "日付印（データ印）"],
            ]}
          />
          {kind === "round" && (
            <>
              <Choice
                label="並べ方"
                value={layout}
                onChange={setLayout}
                options={[
                  ["one", "縦1列（1〜4文字）"],
                  ["two", "2行（右の列から読む）"],
                ]}
              />
              {layout === "one" ? (
                <Field label="名前（1〜4文字がおすすめ）">
                  <input className={ui.input} value={name} maxLength={6} onChange={(e) => setName(e.target.value)} />
                </Field>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="右の列（姓）">
                    <input className={ui.input} value={right} maxLength={4} onChange={(e) => setRight(e.target.value)} />
                  </Field>
                  <Field label="左の列（名）">
                    <input className={ui.input} value={left} maxLength={4} onChange={(e) => setLeft(e.target.value)} />
                  </Field>
                </div>
              )}
            </>
          )}
          {kind === "square" && (
            <Field label={`会社名など（12文字まで・右上から縦に読みます）：${n}文字`}>
              <input className={ui.input} value={company} maxLength={16} onChange={(e) => setCompany(e.target.value)} />
            </Field>
          )}
          {kind === "date" && (
            <>
              <Field label="上の段（部署名など）">
                <input className={ui.input} value={top} maxLength={8} onChange={(e) => setTop(e.target.value)} />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="日付">
                  <input className={ui.input} type="date" value={ymd} onChange={(e) => setDateInput(e.target.value)} />
                </Field>
                <Choice
                  label="日付の書き方"
                  value={dateStyle}
                  onChange={setDateStyle}
                  options={[
                    ["reiwa", "和暦（R8.10.19）"],
                    ["seireki", "西暦（2026.10.19）"],
                    ["short", "西暦2桁（26.10.19）"],
                  ]}
                />
              </div>
              <Field label="下の段（名前）">
                <input className={ui.input} value={bottom} maxLength={8} onChange={(e) => setBottom(e.target.value)} />
              </Field>
            </>
          )}
        </div>
      </div>
      {kind === "square" && n > 12 && <p className="text-sm text-muted">12文字を超えると文字が小さくなり、読みにくくなります。</p>}
      <FieldGrid>
        <Choice label="色" value={preset ? color : "custom"} onChange={(v) => v !== "custom" && setColor(v)} options={[...COLORS, ["custom", "好きな色（右で選ぶ）"]]} />
        <Field label="色を選ぶ">
          <input type="color" className="h-11 w-full cursor-pointer rounded-lg border border-line bg-field p-1" value={color.toLowerCase()} onChange={(e) => setColor(e.target.value.toUpperCase())} />
        </Field>
        <Choice
          label="書体"
          value={font}
          onChange={setFont}
          options={[
            ["serif", "明朝体"],
            ["sans", "ゴシック体"],
          ]}
        />
        <Choice
          label="線の太さ"
          value={thick}
          onChange={setThick}
          options={[
            ["thin", "細い"],
            ["normal", "ふつう"],
            ["bold", "太い"],
          ]}
        />
        <Choice label="画像の大きさ" value={size} onChange={setSize} options={HANKO_SIZES.map((s) => [String(s) as typeof size, `${s}×${s} px`])} />
      </FieldGrid>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} onClick={save}>
          透過PNGで保存
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {msg}
        </span>
      </div>
      <p className="rounded-xl border border-line bg-field px-3.5 py-2.5 text-sm leading-relaxed">
        作れるのは印鑑の<b>見た目の画像</b>です。電子署名や電子証明書のように本人であることや改ざんがないことを証明するしくみはなく、実印・銀行印の代わりにはなりません。社内の書類や取引先とのやりとりで使えるかは、会社や相手先のルールを確認してください。
      </p>
      <p className={ui.note}>背景は透明なので、Word・Excel・PDFの書類に貼り付けて使えます。書体は端末に入っているフォントを使うため、パソコンとスマホで少し見た目が変わることがあります。入力した文字はこの端末の中だけで使い、外部には送りません。</p>
    </div>
  );
}
