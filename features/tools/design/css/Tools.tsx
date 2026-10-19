"use client";

import { useState } from "react";
import { Check, Choice } from "@/components/TextTransform";
import { CopyButton, Field, FieldGrid } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import {
  BLACK,
  COMMON_PX,
  CSS_UNITS,
  GRADIENT_PRESETS,
  SHADOW_PRESETS,
  WHITE,
  buildPalettes,
  contrastRatio,
  convertAll,
  convertUnit,
  gradientCss,
  parseHex,
  rgbText,
  shadowCss,
  toHex,
  trimNumber,
  type ColorStop,
  type CssUnit,
  type GradientSpec,
  type GradientType,
  type Rgb,
  type ShadowLayer,
  type UnitContext,
} from "./logic";

/** 色を選ぶ欄（カラーピッカー＋カラーコード） */
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const rgb = parseHex(value);
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <div className="flex gap-2">
        <input type="color" aria-label={`${label}を色から選ぶ`} className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-line bg-field p-1" value={rgb ? toHex(rgb) : "#000000"} onChange={(e) => onChange(e.target.value)} />
        <input aria-label={`${label}のカラーコード`} className={`${ui.input} min-w-0 font-mono`} value={value} spellCheck={false} autoCapitalize="off" placeholder="#3b82f6" onChange={(e) => onChange(e.target.value)} />
      </div>
      {!rgb && <span className="text-xs text-warn">「#36f」や「#3366ff」の形で入れてください</span>}
    </div>
  );
}

/** 数値の入力欄 */
function NumberField({ label, value, onChange, min, max, step = 1, unit }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string }) {
  return (
    <Field label={unit ? `${label}（${unit}）` : label}>
      <input type="number" inputMode="decimal" className={ui.input} value={Number.isFinite(value) ? value : ""} min={min} max={max} step={step} onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} />
    </Field>
  );
}

/** スライダー＋数値 */
function Slider({ label, value, onChange, min, max, step = 1, unit }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; unit: string }) {
  return (
    <label className={ui.label}>
      <span className="flex items-center justify-between gap-2">
        {label}
        <span className="flex items-center gap-1">
          <input type="number" aria-label={`${label}（${unit}）`} className="w-20 rounded-lg border border-line bg-field px-2 py-1 text-right text-sm text-ink" value={value} min={min} max={max} step={step} onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} />
          <span className="text-xs">{unit}</span>
        </span>
      </span>
      <input type="range" className="w-full accent-accent" aria-hidden="true" tabIndex={-1} value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function CodeBox({ code, label }: { code: string; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Field label={label}>
        <textarea className={`${ui.input} min-h-24 font-mono text-sm`} value={code} readOnly />
      </Field>
      <div>
        <CopyButton text={code} label="CSSをコピー" primary />
      </div>
    </div>
  );
}

// ───────── グラデーション作成 ─────────

const GRADIENT_TYPES: [GradientType, string][] = [
  ["linear", "線形（linear）"],
  ["radial", "円形（radial）"],
  ["conic", "扇形（conic）"],
];

/** CSSグラデーション作成 */
export function GradientMaker() {
  const [spec, setSpec] = useState<GradientSpec>(GRADIENT_PRESETS[0].spec);
  const update = (patch: Partial<GradientSpec>) => setSpec((s) => ({ ...s, ...patch }));
  const setStop = (i: number, patch: Partial<ColorStop>) => setSpec((s) => ({ ...s, stops: s.stops.map((st, j) => (j === i ? { ...st, ...patch } : st)) }));
  const css = gradientCss(spec);
  const code = `background: ${css};`;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="見本">
        {GRADIENT_PRESETS.map((p) => (
          <button key={p.name} type="button" className={ui.chip} onClick={() => setSpec(p.spec)}>
            <span className="h-4 w-4 rounded-full border border-line" style={{ backgroundImage: gradientCss(p.spec) }} aria-hidden="true" />
            {p.name}
          </button>
        ))}
      </div>
      <div className="h-48 w-full rounded-2xl border border-line sm:h-64" style={{ backgroundImage: css }} role="img" aria-label="グラデーションのプレビュー" />
      <FieldGrid>
        <Choice label="種類" value={spec.type} options={GRADIENT_TYPES} onChange={(type) => update({ type })} />
        {spec.type === "radial" ? (
          <Choice
            label="形"
            value={spec.shape}
            options={[
              ["circle", "正円（circle）"],
              ["ellipse", "だ円（ellipse）"],
            ]}
            onChange={(shape) => update({ shape })}
          />
        ) : (
          <Slider label={spec.type === "conic" ? "開始の角度" : "角度"} value={spec.angle} min={0} max={360} unit="deg" onChange={(angle) => update({ angle })} />
        )}
      </FieldGrid>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-bold">色と位置（{spec.stops.length}色）</legend>
        {spec.stops.map((st, i) => (
          <div key={i} className="grid gap-3 rounded-2xl border border-line bg-field/40 p-3 sm:grid-cols-[1.2fr_1fr_0.6fr_auto] sm:items-end">
            <ColorField label={`色${i + 1}`} value={st.color} onChange={(color) => setStop(i, { color })} />
            <Slider label={`色${i + 1}の位置`} value={st.pos} min={0} max={100} unit="%" onChange={(pos) => setStop(i, { pos })} />
            <NumberField label={`色${i + 1}の不透明度`} unit="%" value={st.opacity} min={0} max={100} onChange={(opacity) => setStop(i, { opacity })} />
            <button type="button" className={ui.button} disabled={spec.stops.length <= 2} aria-label={`色${i + 1}を消す`} onClick={() => update({ stops: spec.stops.filter((_, j) => j !== i) })}>
              ×
            </button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={ui.button}
            disabled={spec.stops.length >= 5}
            onClick={() => {
              const last = spec.stops[spec.stops.length - 1];
              update({ stops: [...spec.stops, { color: last?.color ?? "#ffffff", pos: 100, opacity: 100 }] });
            }}
          >
            色を追加（最大5色）
          </button>
          <button type="button" className={ui.button} onClick={() => update({ stops: spec.stops.map((s) => ({ ...s, pos: 100 - s.pos })) })}>
            向きを反転
          </button>
        </div>
      </fieldset>
      <CodeBox code={code} label="CSS" />
      <p className={ui.note}>位置は小さい順に並べ替えてコードにします。角度は 0deg が下から上、90deg が左から右です。conic-gradient は最近のブラウザ（Chrome・Safari・Firefox・Edge）で使えます。</p>
    </div>
  );
}

// ───────── 配色パレット ─────────

function Swatch({ color }: { color: Rgb }) {
  const [copied, setCopied] = useState("");
  const hex = toHex(color);
  const onWhite = contrastRatio(color, WHITE);
  const onBlack = contrastRatio(color, BLACK);
  const textColor = onBlack >= onWhite ? "#000000" : "#ffffff";
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      // コピーできない環境では何もしない（値は画面で読める）
    }
  };
  const ratio = (r: number) => `${(Math.floor(r * 100) / 100).toFixed(2)}${r >= 4.5 ? "（AA合格）" : r >= 3 ? "（大きな文字のみ）" : ""}`;
  return (
    <li className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-panel">
      <button type="button" className="flex h-20 items-end p-2 text-left font-mono text-xs font-semibold" style={{ background: hex, color: textColor }} onClick={() => copy(hex)} aria-label={`${hex} をコピー`}>
        {copied === hex ? "コピーしました" : hex}
      </button>
      <div className="flex flex-col gap-1 p-2 text-xs">
        <button type="button" className="truncate text-left font-mono hover:text-accent" onClick={() => copy(rgbText(color))} aria-label={`${rgbText(color)} をコピー`}>
          {copied === rgbText(color) ? "コピーしました" : rgbText(color)}
        </button>
        <span className="text-muted">白と {ratio(onWhite)}</span>
        <span className="text-muted">黒と {ratio(onBlack)}</span>
      </div>
    </li>
  );
}

/** 配色パレット生成 */
export function ColorPalette() {
  const [base, setBase] = useState("#3b82f6");
  const rgb = parseHex(base);
  const palettes = rgb ? buildPalettes(rgb) : [];
  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-sm">
        <ColorField label="基準の色" value={base} onChange={setBase} />
      </div>
      <div className="flex flex-col gap-5" aria-live="polite">
        {palettes.map((p) => (
          <section key={p.id} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className={ui.h3}>
                {p.name}
                <span className="ml-2 text-xs font-normal text-muted">{p.desc}</span>
              </h3>
              <CopyButton text={p.colors.map(toHex).join(", ")} label="HEXをまとめてコピー" />
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {p.colors.map((c, i) => (
                <Swatch key={i} color={c} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className={ui.note}>
        色の見本を押すとHEX、その下の rgb(…) を押すとRGBをコピーします。色相環の配色はHSLの色相を回して作り、彩度と明るさは基準の色のままです。「白と」「黒と」は、その色を背景にして白・黒の文字を置いたときのコントラスト比（WCAG 2.x）で、ふつうの文字は4.5以上がAA合格です。
      </p>
    </div>
  );
}

// ───────── ボックスシャドウ ─────────

const NEW_LAYER: ShadowLayer = { x: 0, y: 8, blur: 24, spread: 0, color: "#000000", opacity: 15, inset: false };

/** CSSボックスシャドウ作成 */
export function BoxShadowMaker() {
  const [layers, setLayers] = useState<ShadowLayer[]>(SHADOW_PRESETS[1].layers);
  const [bg, setBg] = useState("#f1f5f9");
  const [card, setCard] = useState("#ffffff");
  const [radius, setRadius] = useState(16);
  const setLayer = (i: number, patch: Partial<ShadowLayer>) => setLayers((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const css = shadowCss(layers);
  const code = `box-shadow: ${css};${radius ? `\nborder-radius: ${radius}px;` : ""}`;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="見本">
        {SHADOW_PRESETS.map((p) => (
          <button key={p.name} type="button" className={ui.chip} onClick={() => setLayers(p.layers)}>
            {p.name}
          </button>
        ))}
      </div>
      <div className="flex h-64 items-center justify-center rounded-2xl border border-line p-6" style={{ background: parseHex(bg) ? bg : "#f1f5f9" }}>
        <div className="flex h-32 w-44 items-center justify-center text-sm text-slate-500" style={{ background: parseHex(card) ? card : "#ffffff", boxShadow: css, borderRadius: radius }} role="img" aria-label="影のプレビュー">
          プレビュー
        </div>
      </div>
      <FieldGrid>
        <ColorField label="背景の色" value={bg} onChange={setBg} />
        <ColorField label="カードの色" value={card} onChange={setCard} />
        <Slider label="角の丸み" value={radius} min={0} max={64} unit="px" onChange={setRadius} />
      </FieldGrid>
      {layers.map((l, i) => (
        <fieldset key={i} className="flex flex-col gap-3 rounded-2xl border border-line bg-field/40 p-3">
          <legend className="px-1 text-sm font-bold">影{i + 1}</legend>
          <FieldGrid>
            <Slider label="横のずれ（X）" value={l.x} min={-50} max={50} unit="px" onChange={(x) => setLayer(i, { x })} />
            <Slider label="縦のずれ（Y）" value={l.y} min={-50} max={50} unit="px" onChange={(y) => setLayer(i, { y })} />
            <Slider label="ぼかし" value={l.blur} min={0} max={100} unit="px" onChange={(blur) => setLayer(i, { blur: Math.max(0, blur) })} />
            <Slider label="広がり" value={l.spread} min={-50} max={50} unit="px" onChange={(spread) => setLayer(i, { spread })} />
            <ColorField label="影の色" value={l.color} onChange={(color) => setLayer(i, { color })} />
            <Slider label="不透明度" value={l.opacity} min={0} max={100} unit="%" onChange={(opacity) => setLayer(i, { opacity })} />
          </FieldGrid>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Check label="内側の影（inset）" checked={l.inset} onChange={(inset) => setLayer(i, { inset })} />
            <button type="button" className={ui.button} disabled={layers.length <= 1} onClick={() => setLayers(layers.filter((_, j) => j !== i))}>
              影{i + 1}を消す
            </button>
          </div>
        </fieldset>
      ))}
      <div>
        <button type="button" className={ui.button} disabled={layers.length >= 5} onClick={() => setLayers([...layers, NEW_LAYER])}>
          影を重ねる（最大5つ）
        </button>
      </div>
      <CodeBox code={code} label="CSS" />
      <p className={ui.note}>影を複数重ねると、先に書いた影（影1）がいちばん上に表示されます。小さく濃い影と大きく薄い影を重ねると、自然な立体感になります。</p>
    </div>
  );
}

// ───────── CSS単位変換 ─────────

const UNIT_LABEL: Record<CssUnit, string> = { px: "px", rem: "rem", em: "em", "%": "%", vw: "vw", vh: "vh", pt: "pt" };

/** CSS単位変換 */
export function CssUnitConverter() {
  const [value, setValue] = useState(24);
  const [unit, setUnit] = useState<CssUnit>("px");
  const [ctx, setCtx] = useState<UnitContext>({ root: 16, parent: 16, vw: 1440, vh: 900 });
  const setC = (patch: Partial<UnitContext>) => setCtx((c) => ({ ...c, ...patch }));
  const all = convertAll(value, unit, ctx);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[1fr_auto] gap-3 sm:max-w-md">
        <NumberField label="値" value={value} step={0.1} onChange={setValue} />
        <Choice label="単位" value={unit} options={CSS_UNITS.map((u) => [u, UNIT_LABEL[u]] as [CssUnit, string])} onChange={setUnit} />
      </div>
      <FieldGrid>
        <NumberField label="ルートの文字サイズ（rem の基準）" unit="px" value={ctx.root} min={1} onChange={(root) => setC({ root })} />
        <NumberField label="親要素の文字サイズ（em・% の基準）" unit="px" value={ctx.parent} min={1} onChange={(parent) => setC({ parent })} />
        <NumberField label="画面の幅（vw の基準）" unit="px" value={ctx.vw} min={1} onChange={(vw) => setC({ vw })} />
        <NumberField label="画面の高さ（vh の基準）" unit="px" value={ctx.vh} min={1} onChange={(vh) => setC({ vh })} />
      </FieldGrid>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-live="polite">
        {CSS_UNITS.map((u) => {
          const text = `${trimNumber(all[u])}${u}`;
          return (
            <li key={u} className={`flex flex-col gap-1 rounded-2xl border px-3.5 py-2.5 ${u === unit ? "border-accent/30 bg-accent-soft" : "border-line bg-field/60"}`}>
              <span className="text-xs text-muted">{UNIT_LABEL[u]}</span>
              <span className="truncate text-lg font-bold tabular-nums">{text}</span>
              <CopyButton text={text} />
            </li>
          );
        })}
      </ul>
      <section className="flex flex-col gap-2">
        <h3 className={ui.h3}>よく使う大きさの早見表</h3>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[480px] text-right text-sm tabular-nums">
            <thead className="bg-field text-xs text-muted">
              <tr>
                {(["px", "rem", "em", "pt", "vw", "vh"] as CssUnit[]).map((u) => (
                  <th key={u} scope="col" className="px-3 py-2 font-semibold">
                    {u}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMMON_PX.map((p) => (
                <tr key={p} className="border-t border-line">
                  {(["px", "rem", "em", "pt", "vw", "vh"] as CssUnit[]).map((u) => (
                    <td key={u} className={`px-3 py-1.5 ${u === "px" ? "font-semibold" : ""}`}>
                      {trimNumber(convertUnit(p, "px", u, ctx), 3)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className={ui.note}>
        rem はルート（html要素）、em と % は親要素の文字の大きさが基準です（% は font-size に使ったときの値。幅などに使う % は親要素の幅が基準になります）。ブラウザの初期の文字サイズはふつう16pxです。1pt は 1/72インチで、CSSでは 1px = 0.75pt です。
      </p>
    </div>
  );
}
