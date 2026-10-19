/**
 * Excel（.xlsx）の読み書き。xlsx は XML ファイルを ZIP にまとめたもの（Office Open XML）。
 * 古い .xls（バイナリ形式）は読めない。
 */
import JSZip from "jszip";

// ───────── 小さなXMLパーサー（xlsx の中身を読むのに足りるだけ） ─────────

export type XmlNode = { name: string; attrs: Record<string, string>; children: (XmlNode | string)[] };

/** 「&amp;」「&#12354;」などの文字参照を戻す */
export function decodeEntities(s: string): string {
  if (!s.includes("&")) return s;
  return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
    return ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" } as Record<string, string>)[e.toLowerCase()];
  });
}

/** 名前空間の接頭辞（「x:c」の「x:」）を除いた名前。属性の「r:id」はそのまま残す */
const local = (name: string) => name.slice(name.indexOf(":") + 1);

export function parseXml(xml: string): XmlNode {
  const root: XmlNode = { name: "#root", attrs: {}, children: [] };
  const stack: XmlNode[] = [root];
  const re = /<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!(?:[^>"']|"[^"]*"|'[^']*')*>|<(\/?)([^\s/>]+)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  const attrRe = /([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const top = stack[stack.length - 1];
    if (m[1] !== undefined) top.children.push(m[1]);
    else if (m[6] !== undefined) top.children.push(decodeEntities(m[6]));
    else if (m[3] !== undefined) {
      const name = local(m[3]);
      if (m[2]) {
        // 閉じタグ：同じ名前の開きタグまで戻る
        for (let i = stack.length - 1; i > 0; i--) {
          if (stack[i].name === name) {
            stack.length = i;
            break;
          }
        }
        continue;
      }
      const attrs: Record<string, string> = {};
      let a: RegExpExecArray | null;
      attrRe.lastIndex = 0;
      while ((a = attrRe.exec(m[4] ?? ""))) attrs[a[1]] = decodeEntities(a[2] ?? a[3] ?? "");
      const node: XmlNode = { name, attrs, children: [] };
      top.children.push(node);
      if (!m[5]) stack.push(node);
    }
  }
  return root;
}

const elements = (n: XmlNode) => n.children.filter((c): c is XmlNode => typeof c !== "string");
const child = (n: XmlNode | undefined, name: string) => (n ? elements(n).find((c) => c.name === name) : undefined);
const childrenNamed = (n: XmlNode | undefined, name: string) => (n ? elements(n).filter((c) => c.name === name) : []);
/** 子孫の中から名前の合う最初の要素 */
function find(n: XmlNode, name: string): XmlNode | undefined {
  for (const c of elements(n)) {
    if (c.name === name) return c;
    const f = find(c, name);
    if (f) return f;
  }
  return undefined;
}
const textOf = (n: XmlNode | undefined): string => (n ? n.children.map((c) => (typeof c === "string" ? c : textOf(c))).join("") : "");

/** Excel が文字の中の制御文字などを「_x000D_」の形で書いたものを戻す */
export const decodeXString = (s: string) => s.replace(/_x([0-9A-Fa-f]{4})_/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)));

/**
 * 文字の要素（共有文字列の si・セル内の is）から文字を取り出す。
 * 書式付き（r の中の t）はつなげ、ふりがな（rPh）は除く。
 */
export function richText(si: XmlNode): string {
  let s = "";
  for (const c of elements(si)) {
    if (c.name === "t") s += textOf(c);
    else if (c.name === "r") s += childrenNamed(c, "t").map(textOf).join("");
  }
  return decodeXString(s);
}

// ───────── セルの番地・日付 ─────────

/** 「BC12」→ { col: 54, row: 11 }（0始まり） */
export function parseRef(ref: string): { col: number; row: number } | null {
  const m = /^\$?([A-Za-z]{1,3})\$?(\d+)$/.exec(ref);
  if (!m) return null;
  let col = 0;
  for (const ch of m[1].toUpperCase()) col = col * 26 + (ch.charCodeAt(0) - 64);
  return { col: col - 1, row: Number(m[2]) - 1 };
}

/** 0始まりの列番号 → 「A」「Z」「AA」 */
export function colName(col: number): string {
  let s = "";
  for (let n = col + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

export type DateKind = "date" | "datetime" | "time";

/**
 * 表示形式が日付・時刻かどうか。組み込みの番号（14〜22、日本語版の27〜36・50〜58、45〜47）と、
 * ファイルに書かれた形式（y・d・m と h・s の有無）で見分ける。日付でなければ null。
 */
export function dateKind(numFmtId: number, formatCode?: string): DateKind | null {
  if (!formatCode) {
    // 形式の中身が書かれていない組み込みの番号
    if ((numFmtId >= 14 && numFmtId <= 17) || (numFmtId >= 27 && numFmtId <= 31) || (numFmtId >= 34 && numFmtId <= 36) || (numFmtId >= 50 && numFmtId <= 58)) return "date";
    if (numFmtId === 22) return "datetime";
    if ((numFmtId >= 18 && numFmtId <= 21) || numFmtId === 32 || numFmtId === 33 || (numFmtId >= 45 && numFmtId <= 47)) return "time";
    return null;
  }
  // 「"円"」のような文字、「\-」のような1文字、[Red] や [$-411] などの指定を除いてから調べる
  const f = formatCode
    .replace(/"[^"]*"/g, "")
    .replace(/\\./g, "")
    .replace(/\[(?![hms]+\])[^\]]*\]/gi, "")
    .split(";")[0]
    .toLowerCase()
    .replace(/general/g, "");
  // m は「月」にも「分」にも使うので、時・秒（h・s）がないときだけ日付とみなす
  const hasDate = /[yd]/.test(f) || (/m/.test(f) && !/[hs]/.test(f));
  const hasTime = /[hs]/.test(f);
  if (hasDate && hasTime) return "datetime";
  if (hasDate) return "date";
  if (hasTime) return "time";
  return null;
}

/** Excel の日付シリアル値を「2024-01-02」「2024-01-02 03:04:05」「03:04:05」にする */
export function formatSerial(serial: number, kind: DateKind, date1904 = false): string {
  if (!Number.isFinite(serial)) return String(serial);
  const p = (n: number) => String(n).padStart(2, "0");
  // 秒の端数で 59.9999 秒のようにならないよう、秒に丸める
  const totalSec = Math.round(serial * 86400);
  const days = Math.floor(totalSec / 86400);
  const sec = totalSec - days * 86400;
  const time = `${p(Math.floor(sec / 3600))}:${p(Math.floor((sec % 3600) / 60))}:${p(sec % 60)}`;
  if (kind === "time") return time;
  let ymd: string;
  if (!date1904 && days === 60) {
    // 1900年2月29日は実在しないが、Excel は（Lotus 1-2-3 に合わせて）あるものとして数える
    ymd = "1900-02-29";
  } else {
    const base = date1904 ? Date.UTC(1904, 0, 1) : days < 60 ? Date.UTC(1899, 11, 31) : Date.UTC(1899, 11, 30);
    const d = new Date(base + days * 86400000);
    ymd = `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
  }
  return kind === "date" ? ymd : `${ymd} ${time}`;
}

/** 数値の表示。Excel と同じく有効数字15桁で丸め、0.1+0.2 のような誤差を出さない */
export function formatNumber(v: string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return String(Number(n.toPrecision(15)));
}

// ───────── 読み込み ─────────

export type Workbook = {
  zip: JSZip;
  sheets: { name: string; path: string }[];
  shared: string[];
  /** セルの書式番号（s属性）ごとの日付の種類 */
  dateStyles: (DateKind | null)[];
  date1904: boolean;
};

async function readText(zip: JSZip, path: string): Promise<string | null> {
  const f = zip.file(path) ?? zip.file(Object.keys(zip.files).find((k) => k.toLowerCase() === path.toLowerCase()) ?? "");
  return f ? f.async("string") : null;
}

/** 関係ファイル（.rels）の Target を、ZIPの中のパスにする */
function resolvePath(base: string, target: string): string {
  if (target.startsWith("/")) return target.slice(1);
  const parts = base.split("/").slice(0, -1);
  for (const seg of target.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg !== ".") parts.push(seg);
  }
  return parts.join("/");
}

async function readRels(zip: JSZip, path: string): Promise<Map<string, { type: string; target: string }>> {
  const xml = await readText(zip, path);
  const map = new Map<string, { type: string; target: string }>();
  if (!xml) return map;
  for (const r of childrenNamed(find(parseXml(xml), "Relationships"), "Relationship")) map.set(r.attrs.Id, { type: r.attrs.Type ?? "", target: r.attrs.Target ?? "" });
  return map;
}

/** xlsx を開いて、シートの一覧・共有文字列・書式を読む */
export async function openXlsx(data: Uint8Array | ArrayBuffer): Promise<Workbook> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(data);
  } catch {
    throw new Error("xlsx として読めません。古い .xls 形式やパスワード付きのファイルには対応していません");
  }
  // ブックの場所は _rels/.rels に書かれている（ふつうは xl/workbook.xml）
  const rootRels = await readRels(zip, "_rels/.rels");
  const bookRel = [...rootRels.values()].find((r) => r.type.endsWith("/officeDocument"));
  const bookPath = bookRel ? resolvePath("", bookRel.target) : "xl/workbook.xml";
  const bookXml = await readText(zip, bookPath);
  if (!bookXml) throw new Error("xlsx として読めません（ブックの情報が見つかりません）");
  const book = parseXml(bookXml);
  const rels = await readRels(zip, bookPath.replace(/[^/]*$/, (f) => `_rels/${f}.rels`));
  const pr = find(book, "workbookPr");
  const date1904 = pr ? /^(1|true)$/i.test(pr.attrs.date1904 ?? "") : false;

  const sheets = childrenNamed(find(book, "sheets"), "sheet").map((s, i) => {
    const rid = s.attrs["r:id"] ?? Object.entries(s.attrs).find(([k]) => /(^|:)id$/.test(k) && k !== "sheetId")?.[1];
    const rel = rid ? rels.get(rid) : undefined;
    return { name: s.attrs.name ?? `Sheet${i + 1}`, path: rel ? resolvePath(bookPath, rel.target) : `xl/worksheets/sheet${i + 1}.xml`, type: rel?.type ?? "" };
  });
  // グラフだけのシート（chartsheet）は表がないので除く
  const tableSheets = sheets.filter((s) => !s.type.endsWith("/chartsheet")).map(({ name, path }) => ({ name, path }));

  const relOf = (suffix: string) => [...rels.values()].find((r) => r.type.endsWith(suffix));
  const sstRel = relOf("/sharedStrings");
  const sstXml = await readText(zip, sstRel ? resolvePath(bookPath, sstRel.target) : "xl/sharedStrings.xml");
  const shared = sstXml ? childrenNamed(find(parseXml(sstXml), "sst"), "si").map(richText) : [];

  const stRel = relOf("/styles");
  const stXml = await readText(zip, stRel ? resolvePath(bookPath, stRel.target) : "xl/styles.xml");
  let dateStyles: (DateKind | null)[] = [];
  if (stXml) {
    const st = parseXml(stXml);
    const codes = new Map<number, string>();
    for (const f of childrenNamed(find(st, "numFmts"), "numFmt")) codes.set(Number(f.attrs.numFmtId), f.attrs.formatCode ?? "");
    dateStyles = childrenNamed(find(st, "cellXfs"), "xf").map((xf) => {
      const id = Number(xf.attrs.numFmtId ?? 0);
      return dateKind(id, codes.get(id));
    });
  }
  return { zip, sheets: tableSheets, shared, dateStyles, date1904 };
}

/**
 * シートを読んで、行×列の文字の表にする。
 * セルの番地（r属性）で位置を決め、抜けているセルは空欄にする。値のあるセルまでの範囲を返す。
 */
export async function readSheet(wb: Workbook, index: number, opts: { formatDates: boolean }): Promise<string[][]> {
  const sheet = wb.sheets[index];
  if (!sheet) throw new Error("シートが見つかりません");
  const xml = await readText(wb.zip, sheet.path);
  if (!xml) throw new Error(`シート「${sheet.name}」が見つかりません`);
  const data = find(parseXml(xml), "sheetData");
  const rows: string[][] = [];
  let maxCol = -1;
  let rowIdx = -1;
  for (const row of childrenNamed(data, "row")) {
    rowIdx = row.attrs.r ? Number(row.attrs.r) - 1 : rowIdx + 1;
    let colIdx = -1;
    for (const c of childrenNamed(row, "c")) {
      const ref = c.attrs.r ? parseRef(c.attrs.r) : null;
      colIdx = ref ? ref.col : colIdx + 1;
      const r = ref ? ref.row : rowIdx;
      const value = cellValue(wb, c, opts);
      if (value === "") continue;
      (rows[r] ??= [])[colIdx] = value;
      maxCol = Math.max(maxCol, colIdx);
    }
  }
  return Array.from({ length: rows.length }, (_, r) => Array.from({ length: maxCol + 1 }, (_, c) => rows[r]?.[c] ?? ""));
}

function cellValue(wb: Workbook, c: XmlNode, opts: { formatDates: boolean }): string {
  const t = c.attrs.t ?? "n";
  if (t === "inlineStr") {
    const is = child(c, "is");
    return is ? richText(is) : "";
  }
  const vNode = child(c, "v");
  if (!vNode) return "";
  const v = textOf(vNode);
  switch (t) {
    case "s":
      return wb.shared[Number(v)] ?? "";
    case "str":
      return decodeXString(v);
    case "b":
      return v === "1" || v.toLowerCase() === "true" ? "TRUE" : "FALSE";
    case "e":
    case "d":
      return v;
    default: {
      if (v.trim() === "") return "";
      const kind = opts.formatDates && c.attrs.s !== undefined ? wb.dateStyles[Number(c.attrs.s)] : null;
      return kind ? formatSerial(Number(v), kind, wb.date1904) : formatNumber(v);
    }
  }
}

// ───────── 書き出し（CSV → xlsx） ─────────

const escapeXml = (s: string) =>
  s
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** 数値として書く文字か。「0123」のような先頭0や、桁が多すぎて誤差が出る数は文字のままにする */
export function isNumberCell(s: string): boolean {
  if (!/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(s)) return false;
  const n = Number(s);
  return Number.isFinite(n) && s.replace(/^-|\.|[eE].*$/g, "").replace(/^0+/, "").length <= 15;
}

/** シート名に使えない文字（\ / ? * [ ] :）を除き、31文字までにする */
export function sheetName(name: string): string {
  const s = name.replace(/[\\/?*[\]:]/g, "_").replace(/^'+|'+$/g, "").slice(0, 31);
  return s || "Sheet1";
}

/** 表から1シートだけの最小限の xlsx を作る。文字はセルに直接（inlineStr）、数値は数値で入れる */
export async function buildXlsx(rows: string[][], name = "Sheet1", opts: { numbers: boolean } = { numbers: true }): Promise<Uint8Array> {
  const sheetRows = rows
    .map((row, r) => {
      const cells = row
        .map((v, c) => {
          if (v === "") return "";
          const ref = `${colName(c)}${r + 1}`;
          if (opts.numbers && isNumberCell(v)) return `<c r="${ref}"><v>${v}</v></c>`;
          return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(v)}</t></is></c>`;
        })
        .join("");
      return cells ? `<row r="${r + 1}">${cells}</row>` : "";
    })
    .join("");
  const zip = new JSZip();
  const head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  zip.file(
    "[Content_Types].xml",
    `${head}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
  );
  zip.file("_rels/.rels", `${head}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  zip.file(
    "xl/workbook.xml",
    `${head}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXml(sheetName(name))}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  );
  zip.file(
    "xl/_rels/workbook.xml.rels",
    `${head}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
  );
  zip.file(
    "xl/styles.xml",
    `${head}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
  );
  zip.file("xl/worksheets/sheet1.xml", `${head}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`);
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
