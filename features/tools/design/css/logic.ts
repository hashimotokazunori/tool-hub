/** グラデーション・配色パレット・ボックスシャドウ・CSS単位変換 の純粋な計算部分 */
import { contrastRatio, parseHex, toHex, type Rgb } from "../../data/convert/logic";

export { contrastRatio, parseHex, toHex, type Rgb };

/** 小数を最大 digits 桁にして、末尾の0を消す（1.50 → 1.5、2.0 → 2） */
export function trimNumber(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return "";
  const s = n.toFixed(digits).replace(/\.?0+$/, "");
  return s === "-0" ? "0" : s;
}

/** HEX と不透明度（0〜100）から CSS の色。100 なら HEX のまま */
export function colorWithOpacity(hex: string, opacity: number): string {
  const rgb = parseHex(hex) ?? { r: 0, g: 0, b: 0 };
  const a = Math.min(100, Math.max(0, opacity));
  if (a >= 100) return toHex(rgb);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${trimNumber(a / 100, 2)})`;
}

// ───────── グラデーション ─────────

export type GradientType = "linear" | "radial" | "conic";
export type ColorStop = { color: string; pos: number; opacity: number };
export type GradientSpec = { type: GradientType; angle: number; shape: "circle" | "ellipse"; stops: ColorStop[] };

/** CSS の background-image の値。色の位置は小さい順に並べ替える */
export function gradientCss(spec: GradientSpec): string {
  const stops = [...spec.stops]
    .sort((a, b) => a.pos - b.pos)
    .map((s) => `${colorWithOpacity(s.color, s.opacity)} ${trimNumber(Math.min(100, Math.max(0, s.pos)), 1)}%`)
    .join(", ");
  const angle = `${trimNumber(((spec.angle % 360) + 360) % 360, 1)}deg`;
  if (spec.type === "radial") return `radial-gradient(${spec.shape}, ${stops})`;
  if (spec.type === "conic") return `conic-gradient(from ${angle}, ${stops})`;
  return `linear-gradient(${angle}, ${stops})`;
}

const stop = (color: string, pos: number): ColorStop => ({ color, pos, opacity: 100 });

export const GRADIENT_PRESETS: { name: string; spec: GradientSpec }[] = [
  { name: "夕焼け", spec: { type: "linear", angle: 135, shape: "circle", stops: [stop("#ff7e5f", 0), stop("#feb47b", 100)] } },
  { name: "海", spec: { type: "linear", angle: 90, shape: "circle", stops: [stop("#2193b0", 0), stop("#6dd5ed", 100)] } },
  { name: "ぶどう", spec: { type: "linear", angle: 45, shape: "circle", stops: [stop("#8e2de2", 0), stop("#4a00e0", 100)] } },
  { name: "新緑", spec: { type: "linear", angle: 120, shape: "circle", stops: [stop("#a8e063", 0), stop("#56ab2f", 100)] } },
  { name: "桜", spec: { type: "radial", angle: 0, shape: "circle", stops: [stop("#fff1f5", 0), stop("#fbc2eb", 55), stop("#f78fb3", 100)] } },
  { name: "虹", spec: { type: "conic", angle: 0, shape: "circle", stops: [stop("#ff0000", 0), stop("#ffff00", 25), stop("#00ff00", 50), stop("#0000ff", 75), stop("#ff0000", 100)] } },
];

// ───────── 配色パレット ─────────

export type Hsl = { h: number; s: number; l: number };

/** RGB（0〜255）→ HSL（h:0〜360, s・l:0〜100） */
export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === R) h = ((G - B) / d) % 6;
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s: s * 100, l: l * 100 };
}

/** HSL → RGB（0〜255 に四捨五入） */
export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const S = s / 100;
  const L = l / 100;
  const c = (1 - Math.abs(2 * L - 1)) * S;
  const hh = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  const [r1, g1, b1] = hh < 1 ? [c, x, 0] : hh < 2 ? [x, c, 0] : hh < 3 ? [0, c, x] : hh < 4 ? [0, x, c] : hh < 5 ? [x, 0, c] : [c, 0, x];
  const m = L - c / 2;
  const to = (v: number) => Math.round(Math.min(1, Math.max(0, v + m)) * 255);
  return { r: to(r1), g: to(g1), b: to(b1) };
}

/** 色相を deg 度回した色（彩度・明度はそのまま） */
export function rotateHue(rgb: Rgb, deg: number): Rgb {
  if (deg % 360 === 0) return rgb;
  const hsl = rgbToHsl(rgb);
  return hslToRgb({ ...hsl, h: hsl.h + deg });
}

/** 2色を t（0〜1）の割合で混ぜる。t=1 で other になる */
export function mix(a: Rgb, other: Rgb, t: number): Rgb {
  const f = (x: number, y: number) => Math.round(x + (y - x) * t);
  return { r: f(a.r, other.r), g: f(a.g, other.g), b: f(a.b, other.b) };
}

export const WHITE: Rgb = { r: 255, g: 255, b: 255 };
export const BLACK: Rgb = { r: 0, g: 0, b: 0 };

export type PaletteScheme = { id: string; name: string; desc: string; colors: Rgb[] };

/** 基準の色から、色相環の配色と明るさの段階を作る */
export function buildPalettes(base: Rgb): PaletteScheme[] {
  const hues = (list: number[]) => list.map((d) => rotateHue(base, d));
  return [
    { id: "complementary", name: "補色", desc: "色相環の反対側（180°）の色", colors: hues([0, 180]) },
    { id: "analogous", name: "類似色", desc: "となり合う色（±30°）", colors: hues([-30, 0, 30]) },
    { id: "triadic", name: "トライアド", desc: "120°ずつ離れた3色", colors: hues([0, 120, 240]) },
    { id: "split", name: "分裂補色", desc: "補色の両どなり（150°・210°）", colors: hues([0, 150, 210]) },
    { id: "tetradic", name: "テトラード", desc: "90°ずつ離れた4色（正方形）", colors: hues([0, 90, 180, 270]) },
    { id: "tints", name: "ティント（明るく）", desc: "白を20%ずつ混ぜた色", colors: [0, 0.2, 0.4, 0.6, 0.8].map((t) => mix(base, WHITE, t)) },
    { id: "shades", name: "シェード（暗く）", desc: "黒を20%ずつ混ぜた色", colors: [0, 0.2, 0.4, 0.6, 0.8].map((t) => mix(base, BLACK, t)) },
  ];
}

export const rgbText = ({ r, g, b }: Rgb) => `rgb(${r}, ${g}, ${b})`;

// ───────── ボックスシャドウ ─────────

export type ShadowLayer = { x: number; y: number; blur: number; spread: number; color: string; opacity: number; inset: boolean };

const px = (n: number) => (n === 0 ? "0" : `${trimNumber(n, 2)}px`);

/** box-shadow の値。複数の影はカンマでつなぐ（先に書いたものが上に重なる） */
export function shadowCss(layers: ShadowLayer[]): string {
  if (!layers.length) return "none";
  return layers.map((l) => `${l.inset ? "inset " : ""}${px(l.x)} ${px(l.y)} ${px(Math.max(0, l.blur))} ${px(l.spread)} ${colorWithOpacity(l.color, l.opacity)}`).join(", ");
}

export const SHADOW_PRESETS: { name: string; layers: ShadowLayer[] }[] = [
  { name: "ふんわり", layers: [{ x: 0, y: 4, blur: 12, spread: 0, color: "#000000", opacity: 12, inset: false }] },
  {
    name: "浮き上がり",
    layers: [
      { x: 0, y: 2, blur: 4, spread: 0, color: "#000000", opacity: 8, inset: false },
      { x: 0, y: 12, blur: 28, spread: -4, color: "#000000", opacity: 20, inset: false },
    ],
  },
  { name: "くっきり", layers: [{ x: 6, y: 6, blur: 0, spread: 0, color: "#111827", opacity: 100, inset: false }] },
  { name: "内側", layers: [{ x: 0, y: 2, blur: 6, spread: 0, color: "#000000", opacity: 25, inset: true }] },
];

// ───────── CSS単位変換 ─────────

export type CssUnit = "px" | "rem" | "em" | "%" | "vw" | "vh" | "pt";
export const CSS_UNITS: CssUnit[] = ["px", "rem", "em", "%", "vw", "vh", "pt"];

/** root：html の文字の大きさ、parent：親要素の文字の大きさ、vw・vh：画面の幅・高さ（いずれも px） */
export type UnitContext = { root: number; parent: number; vw: number; vh: number };

/** 1単位が何pxか。% は親要素の文字の大きさに対する割合（font-size で使うときの値）。1pt = 1/72インチ = 4/3 px */
export function pxPerUnit(unit: CssUnit, ctx: UnitContext): number {
  switch (unit) {
    case "px":
      return 1;
    case "rem":
      return ctx.root;
    case "em":
      return ctx.parent;
    case "%":
      return ctx.parent / 100;
    case "vw":
      return ctx.vw / 100;
    case "vh":
      return ctx.vh / 100;
    case "pt":
      return 4 / 3;
  }
}

export function convertUnit(value: number, from: CssUnit, to: CssUnit, ctx: UnitContext): number {
  const per = pxPerUnit(to, ctx);
  if (!per) return NaN;
  return (value * pxPerUnit(from, ctx)) / per;
}

export function convertAll(value: number, from: CssUnit, ctx: UnitContext): Record<CssUnit, number> {
  return Object.fromEntries(CSS_UNITS.map((u) => [u, convertUnit(value, from, u, ctx)])) as Record<CssUnit, number>;
}

export const COMMON_PX = [1, 2, 4, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64, 80, 96];
