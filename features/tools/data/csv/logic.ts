/** CSVの重複行削除・列の抽出・区切り文字変換・比較 の純粋な計算部分 */
import { parseCsv, uniqueHeaders, type Delimiter } from "../convert/logic";

export type AnyDelimiter = "," | "\t" | ";" | "|";
export const DELIMITER_OPTIONS: [AnyDelimiter, string][] = [
  [",", "カンマ（,）"],
  ["\t", "タブ"],
  [";", "セミコロン（;）"],
  ["|", "パイプ（|）"],
];
export const DELIMITER_NAME: Record<AnyDelimiter, string> = { ",": "カンマ", "\t": "タブ", ";": "セミコロン", "|": "パイプ" };

/** 先頭の数行で、引用符の外にいちばん多く出てくる区切り文字を選ぶ（同数ならカンマ） */
export function detectAnyDelimiter(text: string): AnyDelimiter {
  const counts: Record<AnyDelimiter, number> = { ",": 0, "\t": 0, ";": 0, "|": 0 };
  let inQuote = false;
  let lines = 0;
  for (let i = 0; i < text.length && lines < 10; i++) {
    const c = text[i];
    if (c === '"') inQuote = !inQuote;
    else if (!inQuote && c in counts) counts[c as AnyDelimiter]++;
    else if (!inQuote && c === "\n") lines++;
  }
  let best: AnyDelimiter = ",";
  for (const d of ["\t", ";", "|"] as AnyDelimiter[]) if (counts[d] > counts[best]) best = d;
  return best;
}

/** 読み込んだ表。headerRow は元の見出し（見出しなしなら null）、headers は重ならない列名 */
export type Table = { headers: string[]; headerRow: string[] | null; rows: string[][]; width: number; delimiter: AnyDelimiter };

/** CSVの文字を表にする。空行は除き、列の数が足りない行は空欄で埋める */
export function readTable(text: string, delimiter: AnyDelimiter | "auto", header: boolean): Table {
  const d = delimiter === "auto" ? detectAnyDelimiter(text) : delimiter;
  // parseCsv は1文字の区切りなら何でも扱える
  const all = parseCsv(text, d as Delimiter).filter((r) => !(r.length === 1 && r[0] === ""));
  const width = Math.max(0, ...all.map((r) => r.length));
  const pad = (r: string[]) => (r.length < width ? [...r, ...Array<string>(width - r.length).fill("")] : r);
  const padded = all.map(pad);
  if (header && padded.length) {
    const [head, ...rows] = padded;
    return { headers: uniqueHeaders(head), headerRow: head, rows, width, delimiter: d };
  }
  return { headers: Array.from({ length: width }, (_, i) => `列${i + 1}`), headerRow: null, rows: padded, width, delimiter: d };
}

// ───────── 書き出し ─────────

export type QuoteMode = "minimal" | "all";
export type Eol = "crlf" | "lf";

/** 欄を囲む。minimal：区切り文字・「"」・改行・前後の空白を含むときだけ。all：すべて */
export function quoteField(value: string, delimiter: string, mode: QuoteMode): string {
  if (mode === "all" || value.includes(delimiter) || /["\r\n]/.test(value) || /^\s|\s$/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function writeCsv(rows: string[][], delimiter: string, opts: { quote?: QuoteMode; eol?: Eol } = {}): string {
  const nl = opts.eol === "lf" ? "\n" : "\r\n";
  const quote = opts.quote ?? "minimal";
  return rows.map((r) => r.map((v) => quoteField(v, delimiter, quote)).join(delimiter)).join(nl) + (rows.length ? nl : "");
}

/** 見出し行を付けた行の並び */
export const withHeader = (t: Table, rows: string[][] = t.rows) => (t.headerRow ? [t.headerRow, ...rows] : rows);

// ───────── 重複行の削除 ─────────

export type MatchOptions = { ignoreCase: boolean; ignoreSpace: boolean; ignoreWidth: boolean };

/** 比べるための値。空白：前後を消して連続をまとめる（全角スペースも）。幅：全角英数を半角に（NFKC） */
export function normalizeCell(s: string, o: Partial<MatchOptions>): string {
  let t = s;
  if (o.ignoreWidth) t = t.normalize("NFKC");
  if (o.ignoreSpace) t = t.replace(/\s+/g, " ").trim();
  if (o.ignoreCase) t = t.toLowerCase();
  return t;
}

/** keys が null なら行全体で比べる */
export function rowKey(row: string[], keys: number[] | null, o: Partial<MatchOptions>): string {
  const cols = keys ?? row.map((_, i) => i);
  return JSON.stringify(cols.map((i) => normalizeCell(row[i] ?? "", o)));
}

export type DedupeOptions = MatchOptions & { keys: number[] | null; keep: "first" | "last" };

/** 重複した行を除く。残す行の順番は元のまま */
export function dedupeRows(rows: string[][], o: DedupeOptions): { kept: string[][]; removed: number[]; duplicateGroups: number } {
  const keys = rows.map((r) => rowKey(r, o.keys, o));
  const pick = new Map<string, number>();
  const count = new Map<string, number>();
  keys.forEach((k, i) => {
    count.set(k, (count.get(k) ?? 0) + 1);
    if (o.keep === "last" || !pick.has(k)) pick.set(k, i);
  });
  const kept: string[][] = [];
  const removed: number[] = [];
  keys.forEach((k, i) => (pick.get(k) === i ? kept.push(rows[i]) : removed.push(i)));
  return { kept, removed, duplicateGroups: [...count.values()].filter((n) => n > 1).length };
}

// ───────── 列の抽出 ─────────

export type ColumnPick = { index: number; name: string };

/** 選んだ列を選んだ順に並べる。name が空なら元の見出しのまま */
export function pickColumns(t: Table, picks: ColumnPick[]): string[][] {
  const body = t.rows.map((r) => picks.map((p) => r[p.index] ?? ""));
  if (!t.headerRow) return body;
  return [picks.map((p) => p.name.trim() || t.headerRow![p.index] || ""), ...body];
}

/** 配列の i 番目を dir（-1 上・+1 下）に動かす */
export function moveItem<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

// ───────── 比較 ─────────

export type DiffStatus = "added" | "removed" | "changed" | "same";
export type DiffRow = { status: DiffStatus; key: string; before: string[] | null; after: string[] | null; changed: number[] };
export type DiffResult = {
  columns: string[];
  /** 両方にある列の位置（比べる対象） */
  common: number[];
  onlyA: string[];
  onlyB: string[];
  rows: DiffRow[];
  counts: Record<DiffStatus, number>;
  duplicateKeys: number;
};

/**
 * 2つの表を比べる。列は見出しの名前で合わせ、両方にある列だけを比べる。
 * key を指定すると、その列の値が同じ行どうしを比べて「変更」を見つける。
 * key が null なら行全体で比べ、片方にしかない行を「追加」「削除」とする（同じ行が複数あれば数で合わせる）。
 */
export function diffTables(a: Table, b: Table, key: string | null, o: Partial<MatchOptions> = {}): DiffResult {
  const columns = [...a.headers, ...b.headers.filter((h) => !a.headers.includes(h))];
  const ia = columns.map((c) => a.headers.indexOf(c));
  const ib = columns.map((c) => b.headers.indexOf(c));
  const common = columns.map((_, i) => i).filter((i) => ia[i] >= 0 && ib[i] >= 0);
  const projA = (r: string[]) => ia.map((j) => (j >= 0 ? (r[j] ?? "") : ""));
  const projB = (r: string[]) => ib.map((j) => (j >= 0 ? (r[j] ?? "") : ""));
  const eq = (x: string, y: string) => normalizeCell(x, o) === normalizeCell(y, o);
  const rows: DiffRow[] = [];
  let duplicateKeys = 0;
  const k = key !== null ? columns.indexOf(key) : -1;

  if (k >= 0 && common.includes(k)) {
    const mapA = new Map<string, string[]>();
    for (const r of a.rows.map(projA)) {
      const kv = normalizeCell(r[k], o);
      if (mapA.has(kv)) duplicateKeys++;
      else mapA.set(kv, r);
    }
    const seenB = new Set<string>();
    for (const r of b.rows.map(projB)) {
      const kv = normalizeCell(r[k], o);
      if (seenB.has(kv)) {
        duplicateKeys++;
        continue;
      }
      seenB.add(kv);
      const before = mapA.get(kv);
      if (!before) rows.push({ status: "added", key: r[k], before: null, after: r, changed: [] });
      else {
        const changed = common.filter((i) => !eq(before[i], r[i]));
        rows.push({ status: changed.length ? "changed" : "same", key: r[k], before, after: r, changed });
      }
    }
    for (const [kv, r] of mapA) if (!seenB.has(kv)) rows.push({ status: "removed", key: r[k], before: r, after: null, changed: [] });
  } else {
    const sig = (r: string[]) => JSON.stringify(common.map((i) => normalizeCell(r[i], o)));
    const pool = new Map<string, number>();
    const pa = a.rows.map(projA);
    for (const r of pa) pool.set(sig(r), (pool.get(sig(r)) ?? 0) + 1);
    const matched = new Map<string, number>();
    for (const r of b.rows.map(projB)) {
      const s = sig(r);
      const left = pool.get(s) ?? 0;
      if (left > 0) {
        pool.set(s, left - 1);
        matched.set(s, (matched.get(s) ?? 0) + 1);
        rows.push({ status: "same", key: "", before: r, after: r, changed: [] });
      } else rows.push({ status: "added", key: "", before: null, after: r, changed: [] });
    }
    for (const r of pa) {
      const s = sig(r);
      const m = matched.get(s) ?? 0;
      if (m > 0) matched.set(s, m - 1);
      else rows.push({ status: "removed", key: "", before: r, after: null, changed: [] });
    }
  }
  const counts: Record<DiffStatus, number> = { added: 0, removed: 0, changed: 0, same: 0 };
  for (const r of rows) counts[r.status]++;
  return {
    columns,
    common,
    onlyA: a.headers.filter((h) => !b.headers.includes(h)),
    onlyB: b.headers.filter((h) => !a.headers.includes(h)),
    rows,
    counts,
    duplicateKeys,
  };
}

export const DIFF_LABEL: Record<DiffStatus, string> = { added: "追加", removed: "削除", changed: "変更", same: "同じ" };

/** 差分を表にする（同じ行は除く）。変更は「変更前」「変更後」の2行にする */
export function diffToRows(d: DiffResult): string[][] {
  const out: string[][] = [["差分", "変更された列", ...d.columns]];
  for (const r of d.rows) {
    if (r.status === "added") out.push(["追加", "", ...r.after!]);
    else if (r.status === "removed") out.push(["削除", "", ...r.before!]);
    else if (r.status === "changed") {
      const names = r.changed.map((i) => d.columns[i]).join("・");
      out.push(["変更前", names, ...r.before!]);
      out.push(["変更後", names, ...r.after!]);
    }
  }
  return out;
}
