/** コントラスト比・CSV→JSON・JSON→CSV の純粋な計算部分 */

// ───────── コントラスト比（WCAG 2.x） ─────────

export type Rgb = { r: number; g: number; b: number };

/** 「#fff」「#1a2b3c」「1a2b3c」を読む。読めなければ null */
export function parseHex(input: string): Rgb | null {
  const s = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(s)) {
    const [r, g, b] = [...s].map((c) => parseInt(c + c, 16));
    return { r, g, b };
  }
  if (/^[0-9a-f]{6}$/i.test(s)) return { r: parseInt(s.slice(0, 2), 16), g: parseInt(s.slice(2, 4), 16), b: parseInt(s.slice(4, 6), 16) };
  return null;
}

export const toHex = ({ r, g, b }: Rgb) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

/** 相対輝度（WCAG 2.x の定義。sRGB を直線化して 0.2126R + 0.7152G + 0.0722B） */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** コントラスト比 (L1 + 0.05) / (L2 + 0.05)。1〜21 */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** 判定。WCAG は丸めずに比べるので、比はそのまま基準値と比べる */
export function wcagJudge(ratio: number) {
  return {
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  };
}

/** 表示用：小数第2位までで切り捨て（4.497 を 4.50 と見せて合格に見えないように） */
export const formatRatio = (ratio: number) => `${(Math.floor(ratio * 100) / 100).toFixed(2)} : 1`;

// ───────── CSV の読み書き ─────────

export type Delimiter = "," | "\t" | ";";

/** 先頭の数行で、引用符の外にいちばん多く出てくる区切り文字を選ぶ */
export function detectDelimiter(text: string): Delimiter {
  const counts: Record<Delimiter, number> = { ",": 0, "\t": 0, ";": 0 };
  let inQuote = false;
  let lines = 0;
  for (let i = 0; i < text.length && lines < 10; i++) {
    const c = text[i];
    if (c === '"') inQuote = !inQuote;
    else if (!inQuote && (c === "," || c === "\t" || c === ";")) counts[c]++;
    else if (!inQuote && c === "\n") lines++;
  }
  if (counts["\t"] > counts[","] && counts["\t"] >= counts[";"]) return "\t";
  if (counts[";"] > counts[","]) return ";";
  return ",";
}

/**
 * CSV を行×列の文字列にする（RFC 4180）。
 * 「"」で囲んだ欄の中の区切り文字・改行はそのまま、「""」は「"」1つとして読む。
 * 改行は CRLF・LF・CR のどれでもよい。最後の改行のあとの空行は数えない。
 */
export function parseCsv(input: string, delimiter: Delimiter): string[][] {
  const text = input.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuote = false;
  let i = 0;
  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };
  while (i < text.length) {
    const c = text[i];
    if (inQuote) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuote = false;
      } else field += c;
      i++;
      continue;
    }
    if (c === '"' && field === "") inQuote = true;
    else if (c === delimiter) endField();
    else if (c === "\r" || c === "\n") {
      endRow();
      if (c === "\r" && text[i + 1] === "\n") i++;
    } else field += c;
    i++;
  }
  if (field !== "" || row.length > 0 || inQuote) endRow();
  return rows;
}

/** 欄を CSV 用に囲む。区切り文字・「"」・改行・前後の空白を含むときだけ「"」で囲む */
export function quoteCsvField(value: string, delimiter: string): string {
  if (value.includes(delimiter) || /["\r\n]/.test(value) || /^\s|\s$/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export const toCsvText = (rows: string[][], delimiter: string) => rows.map((r) => r.map((v) => quoteCsvField(v, delimiter)).join(delimiter)).join("\r\n") + (rows.length ? "\r\n" : "");

// ───────── CSV → JSON ─────────

/**
 * 数値・真偽値として読める文字を変換する。
 * 「0123」のような先頭が0の数字（郵便番号・電話番号など）や、桁が多すぎて正確に表せない数字は文字のまま残す。
 */
export function convertValue(s: string): string | number | boolean {
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n) && (!/^-?\d+$/.test(s) || Number.isSafeInteger(n))) return n;
    return s;
  }
  if (/^true$/i.test(s)) return true;
  if (/^false$/i.test(s)) return false;
  return s;
}

/** 見出しの空欄・重複を「列3」「名前_2」のようにして重ならないようにする */
export function uniqueHeaders(headers: string[]): string[] {
  const used = new Map<string, number>();
  return headers.map((h, i) => {
    const base = h.trim() || `列${i + 1}`;
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    return n === 1 ? base : `${base}_${n}`;
  });
}

export type CsvToJsonOptions = { header: boolean; convert: boolean; shape: "objects" | "arrays"; pretty: boolean };

export function csvRowsToData(rows: string[][], opts: Pick<CsvToJsonOptions, "header" | "convert" | "shape">): unknown[] {
  const cell = (s: string) => (opts.convert ? convertValue(s) : s);
  // 中身がまったくない行（空行）は除く
  const body = rows.filter((r) => !(r.length === 1 && r[0] === ""));
  // 配列の形では、見出しの行も1行目の配列としてそのまま残す
  if (!opts.header || opts.shape === "arrays") return body.map((r, i) => (opts.header && i === 0 ? r : r.map(cell)));
  const [head = [], ...rest] = body;
  const width = Math.max(head.length, ...rest.map((r) => r.length));
  const keys = uniqueHeaders(Array.from({ length: width }, (_, i) => head[i] ?? ""));
  return rest.map((r) => Object.fromEntries(keys.map((k, i) => [k, cell(r[i] ?? "")])));
}

export function csvToJson(text: string, delimiter: Delimiter | "auto", opts: CsvToJsonOptions): { json: string; rows: number; columns: number; delimiter: Delimiter } {
  const d = delimiter === "auto" ? detectDelimiter(text) : delimiter;
  const rows = parseCsv(text, d);
  const data = csvRowsToData(rows, opts);
  const columns = Math.max(0, ...rows.map((r) => r.length));
  return { json: JSON.stringify(data, null, opts.pretty ? 2 : undefined), rows: data.length, columns, delimiter: d };
}

// ───────── JSON → CSV ─────────

export type NestedMode = "flatten" | "json";

/**
 * 入れ子のオブジェクトを「住所.市区町村」のような名前の列に開く。
 * 配列は開くと列が増えすぎるので、JSON の文字のまま1つの欄に入れる。
 */
export function flattenObject(obj: Record<string, unknown>, prefix = "", out: Record<string, unknown> = {}): Record<string, unknown> {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length > 0) flattenObject(v as Record<string, unknown>, key, out);
    else out[key] = v;
  }
  return out;
}

/** 1つの値を CSV の欄の文字にする。null・undefined は空欄、オブジェクト・配列は JSON の文字 */
export function cellText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/**
 * JSON の値を表にする。
 * オブジェクトの配列 → 全部のキーを合わせた列（最初に出てきた順）。配列の配列 → そのまま行。
 * オブジェクト1つ → 1行。数値や文字の配列 → 「value」1列。
 */
export function jsonToRows(value: unknown, nested: NestedMode): { rows: string[][]; header: boolean } | { error: string } {
  const list = Array.isArray(value) ? value : value !== null && typeof value === "object" ? [value] : null;
  if (!list) return { error: "JSONの配列（[ … ]）かオブジェクト（{ … }）を入れてください" };
  if (!list.length) return { rows: [], header: false };
  if (list.every((x) => Array.isArray(x))) return { rows: (list as unknown[][]).map((r) => r.map(cellText)), header: false };
  const objs: Record<string, unknown>[] = list.map((x) => (x !== null && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : { value: x }));
  const flat = objs.map((o) => (nested === "flatten" ? flattenObject(o) : o));
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const o of flat)
    for (const k of Object.keys(o))
      if (!seen.has(k)) {
        seen.add(k);
        keys.push(k);
      }
  return { rows: [keys, ...flat.map((o) => keys.map((k) => cellText(o[k])))], header: true };
}

export function jsonToCsv(text: string, delimiter: Delimiter, nested: NestedMode): { csv: string; rows: number; columns: number } | { error: string } {
  if (!text.trim()) return { csv: "", rows: 0, columns: 0 };
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (e) {
    return { error: `JSONとして読み取れません：${(e as Error).message}` };
  }
  const r = jsonToRows(value, nested);
  if ("error" in r) return r;
  return { csv: toCsvText(r.rows, delimiter), rows: r.rows.length - (r.header ? 1 : 0), columns: Math.max(0, ...r.rows.map((x) => x.length)) };
}
