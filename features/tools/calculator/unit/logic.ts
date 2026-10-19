/** 単位変換。各単位を基準の単位（m・kg・m²・L）に直す倍率で持つ */

export type UnitKind = "length" | "mass" | "area" | "volume" | "temperature";
export type Unit = { id: string; label: string; factor: number };

export const UNITS: Record<Exclude<UnitKind, "temperature">, Unit[]> = {
  length: [
    { id: "mm", label: "ミリメートル（mm）", factor: 0.001 },
    { id: "cm", label: "センチメートル（cm）", factor: 0.01 },
    { id: "m", label: "メートル（m）", factor: 1 },
    { id: "km", label: "キロメートル（km）", factor: 1000 },
    { id: "in", label: "インチ（in）", factor: 0.0254 },
    { id: "ft", label: "フィート（ft）", factor: 0.3048 },
    { id: "yd", label: "ヤード（yd）", factor: 0.9144 },
    { id: "mi", label: "マイル（mi）", factor: 1609.344 },
    { id: "sun", label: "寸", factor: 1 / 33 },
    { id: "shaku", label: "尺", factor: 10 / 33 },
    { id: "ken", label: "間（けん）", factor: 60 / 33 },
  ],
  mass: [
    { id: "mg", label: "ミリグラム（mg）", factor: 1e-6 },
    { id: "g", label: "グラム（g）", factor: 0.001 },
    { id: "kg", label: "キログラム（kg）", factor: 1 },
    { id: "t", label: "トン（t）", factor: 1000 },
    { id: "oz", label: "オンス（oz）", factor: 0.028349523125 },
    { id: "lb", label: "ポンド（lb）", factor: 0.45359237 },
    { id: "monme", label: "匁（もんめ）", factor: 0.00375 },
    { id: "kan", label: "貫", factor: 3.75 },
  ],
  area: [
    { id: "cm2", label: "平方センチメートル（cm²）", factor: 1e-4 },
    { id: "m2", label: "平方メートル（m²）", factor: 1 },
    { id: "a", label: "アール（a）", factor: 100 },
    { id: "ha", label: "ヘクタール（ha）", factor: 10_000 },
    { id: "km2", label: "平方キロメートル（km²）", factor: 1e6 },
    { id: "tsubo", label: "坪", factor: 400 / 121 },
    { id: "jo", label: "畳（不動産広告の基準 1.62m²）", factor: 1.62 },
    { id: "ft2", label: "平方フィート（ft²）", factor: 0.09290304 },
    { id: "acre", label: "エーカー", factor: 4046.8564224 },
  ],
  volume: [
    { id: "ml", label: "ミリリットル（mL・cc）", factor: 0.001 },
    { id: "l", label: "リットル（L）", factor: 1 },
    { id: "m3", label: "立方メートル（m³）", factor: 1000 },
    { id: "tsp", label: "小さじ（5mL）", factor: 0.005 },
    { id: "tbsp", label: "大さじ（15mL）", factor: 0.015 },
    { id: "cup", label: "カップ（日本・200mL）", factor: 0.2 },
    { id: "go", label: "合（約180mL）", factor: 2401 / 13310 },
    { id: "sho", label: "升（約1.8L）", factor: 24010 / 13310 },
    { id: "floz", label: "米液量オンス（fl oz）", factor: 0.0295735295625 },
    { id: "gal", label: "米ガロン（gal）", factor: 3.785411784 },
  ],
};

export const TEMPS = [
  { id: "c", label: "摂氏（℃）" },
  { id: "f", label: "華氏（℉）" },
  { id: "k", label: "ケルビン（K）" },
] as const;
export type TempUnit = (typeof TEMPS)[number]["id"];

export function convertUnit(value: number, from: Unit, to: Unit): number {
  return (value * from.factor) / to.factor;
}

export function convertTemp(value: number, from: TempUnit, to: TempUnit): number {
  const c = from === "c" ? value : from === "f" ? ((value - 32) * 5) / 9 : value - 273.15;
  return to === "c" ? c : to === "f" ? (c * 9) / 5 + 32 : c + 273.15;
}

/** 表示用：有効数字を保ちつつ、余計な桁を出さない */
export function formatNumber(x: number): string {
  if (!Number.isFinite(x)) return "—";
  if (x === 0) return "0";
  const abs = Math.abs(x);
  if (abs >= 1e15 || abs < 1e-6) return x.toExponential(6).replace(/\.?0+e/, "e");
  return Number(x.toPrecision(10)).toLocaleString("ja-JP", { maximumFractionDigits: 8 });
}
