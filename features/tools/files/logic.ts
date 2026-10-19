/** テキストファイル結合・ファイル名一括変更の計算部分 */

// ───────── テキストファイル結合 ─────────

export type Separator = "none" | "blank" | "header";
export type MergeOptions = { separator: Separator; skipCsvHeader: boolean };

const isTable = (name: string) => /\.(csv|tsv)$/i.test(name);

/**
 * 複数のテキストを1つにつなげる。改行は「\n」にそろえて返す（保存するときに改行コードを選ぶ）。
 * - none：そのまま続けてつなぐ（各ファイルの終わりで改行する）
 * - blank：ファイルの間に空行を1行入れる
 * - header：各ファイルの前に「===== ファイル名 =====」の行を入れる
 * skipCsvHeader のときは、2つ目以降のCSV・TSVの1行目（見出し）を除く。
 */
export function mergeTexts(files: { name: string; text: string }[], opts: MergeOptions): string {
  const parts = files.map((f, i) => {
    let t = f.text.replace(/\r\n|\r/g, "\n").replace(/\n+$/, "");
    if (opts.skipCsvHeader && i > 0 && isTable(f.name)) {
      const nl = t.indexOf("\n");
      t = nl < 0 ? "" : t.slice(nl + 1);
    }
    return opts.separator === "header" ? `===== ${f.name} =====\n${t}` : t;
  });
  // 見出しを除いて中身がなくなったCSVは、空行を残さないように除く
  const kept = opts.skipCsvHeader ? parts.filter((p, i) => p !== "" || i === 0 || !isTable(files[i].name)) : parts;
  if (!kept.length) return "";
  return kept.join(opts.separator === "none" ? "\n" : "\n\n") + "\n";
}

/** 結合したファイルの名前（すべてCSVなら .csv、そうでなければ .txt など、1つ目に合わせる） */
export function mergedFileName(names: string[]): string {
  const exts = names.map((n) => /\.([^.]+)$/.exec(n)?.[1].toLowerCase() ?? "txt");
  const same = exts.every((e) => e === exts[0]);
  return `merged.${same && exts.length ? exts[0] : "txt"}`;
}

// ───────── ファイル名一括変更 ─────────

export type CaseMode = "none" | "lower" | "upper";
export type Position = "before" | "after";
export type DateFormat = "YYYYMMDD" | "YYYY-MM-DD" | "YYYYMMDD_HHmmss";

export type RenameRules = {
  find: string;
  replace: string;
  regex: boolean;
  caseMode: CaseMode;
  prefix: string;
  suffix: string;
  /** 連番。replace は名前を連番だけにする */
  seq: { on: boolean; start: number; digits: number; position: Position | "replace"; sep: string };
  /** 更新日時 */
  date: { on: boolean; format: DateFormat; position: Position; sep: string };
  keepExt: boolean;
};

export const DEFAULT_RULES: RenameRules = {
  find: "",
  replace: "",
  regex: false,
  caseMode: "none",
  prefix: "",
  suffix: "",
  seq: { on: false, start: 1, digits: 3, position: "before", sep: "_" },
  date: { on: false, format: "YYYYMMDD", position: "before", sep: "_" },
  keepExt: true,
};

/** 名前と拡張子（「.」を含む）に分ける。「.bashrc」のように先頭が「.」の名前は拡張子なしとする */
export function splitExt(name: string): [string, string] {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ""];
}

const pad = (n: number, d = 2) => String(n).padStart(d, "0");

/** 日時を指定の形の文字にする（端末の時刻で） */
export function formatDate(ms: number, f: DateFormat): string {
  const d = new Date(ms);
  const ymd = [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())];
  if (f === "YYYY-MM-DD") return ymd.join("-");
  if (f === "YYYYMMDD") return ymd.join("");
  return `${ymd.join("")}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/** ファイル名に使えない文字（Windows の \ / : * ? " < > | と制御文字）を「_」にする */
export function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_");
}

/** 検索の正規表現を作る。正しくないときは error を返す */
export function findPattern(rules: Pick<RenameRules, "find" | "regex">): RegExp | null | { error: string } {
  if (!rules.find) return null;
  if (!rules.regex) return new RegExp(rules.find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
  try {
    return new RegExp(rules.find, "gu");
  } catch {
    return { error: "正規表現の書き方が正しくありません" };
  }
}

/**
 * ルールに沿って新しい名前を作る。処理の順は
 * 1. 置換 → 2. 大文字・小文字 → 3. 日付・連番をつける → 4. 先頭・末尾に文字を足す → 5. 拡張子を戻す
 * index は一覧の何番目か（0始まり。連番に使う）。
 */
export function renameOne(file: { name: string; lastModified: number }, index: number, rules: RenameRules, pattern: RegExp | null = null): string {
  const [stem, ext] = rules.keepExt ? splitExt(file.name) : [file.name, ""];
  let core = pattern ? stem.replace(pattern, rules.replace) : stem;
  if (rules.caseMode === "lower") core = core.toLowerCase();
  if (rules.caseMode === "upper") core = core.toUpperCase();
  if (rules.date.on) {
    const d = formatDate(file.lastModified, rules.date.format);
    core = rules.date.position === "before" ? `${d}${rules.date.sep}${core}` : `${core}${rules.date.sep}${d}`;
  }
  if (rules.seq.on) {
    const n = rules.seq.start + index;
    const s = (n < 0 ? "-" : "") + String(Math.abs(n)).padStart(Math.max(1, Math.min(10, rules.seq.digits)), "0");
    core = rules.seq.position === "replace" ? s : rules.seq.position === "before" ? `${s}${rules.seq.sep}${core}` : `${core}${rules.seq.sep}${s}`;
  }
  return sanitizeFileName(`${rules.prefix}${core}${rules.suffix}${ext}`);
}

export type RenameResult = { names: string[]; duplicates: Set<number>; empty: Set<number> } | { error: string };

/** すべてのファイルの新しい名前と、重なっている名前（大文字・小文字は区別しない）・名前が空（または「.」で始まる）の位置 */
export function renameAll(files: { name: string; lastModified: number }[], rules: RenameRules): RenameResult {
  const p = findPattern(rules);
  if (p && "error" in p) return p;
  const names = files.map((f, i) => renameOne(f, i, rules, p));
  const count = new Map<string, number>();
  for (const n of names) count.set(n.toLowerCase(), (count.get(n.toLowerCase()) ?? 0) + 1);
  const duplicates = new Set<number>();
  const empty = new Set<number>();
  names.forEach((n, i) => {
    if ((count.get(n.toLowerCase()) ?? 0) > 1) duplicates.add(i);
    // 「.jpg」のように名前の部分がないもの（隠しファイルの扱いになる）も空とみなす
    if (!n.trim() || n.startsWith(".")) empty.add(i);
  });
  return { names, duplicates, empty };
}
