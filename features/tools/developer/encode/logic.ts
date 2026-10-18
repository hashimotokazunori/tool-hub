/** 開発者向けの変換（JSON・URL・Base64・HTML・正規表現）。すべて純粋関数 */

export type JsonResult = { ok: true; text: string } | { ok: false; message: string; line?: number; column?: number; position?: number };

/** JSONの整形・圧縮。構文エラーなら位置（行・列）を返す */
export function formatJson(input: string, indent: number | "\t" | "minify"): JsonResult {
  try {
    const v = JSON.parse(input);
    return { ok: true, text: indent === "minify" ? JSON.stringify(v) : JSON.stringify(v, null, indent) };
  } catch (e) {
    const message = (e as Error).message;
    const m = /position (\d+)/.exec(message) ?? /at (\d+)/.exec(message);
    let position = m ? Number(m[1]) : undefined;
    const lc = /line (\d+) column (\d+)/.exec(message);
    if (position === undefined && lc) {
      const lines = input.split("\n");
      position = lines.slice(0, Number(lc[1]) - 1).reduce((a, l) => a + l.length + 1, 0) + Number(lc[2]) - 1;
    }
    if (position === undefined) return { ok: false, message };
    const before = input.slice(0, position);
    return { ok: false, message, position, line: before.split("\n").length, column: position - before.lastIndexOf("\n") };
  }
}

export type CodecResult = { ok: true; text: string } | { ok: false; message: string };
const wrap = (f: () => string, message: string): CodecResult => {
  try {
    return { ok: true, text: f() };
  } catch {
    return { ok: false, message };
  }
};

/* URL */
export const urlEncode = (s: string, component = true) => wrap(() => (component ? encodeURIComponent(s) : encodeURI(s)), "変換できない文字が含まれています");
export const urlDecode = (s: string) => wrap(() => decodeURIComponent(s.replace(/\+/g, " ")), "正しくエンコードされた文字列ではありません（% のあとの2文字を確認してください）");

/* Base64（UTF-8） */
export function base64Encode(s: string, urlSafe = false): CodecResult {
  return wrap(() => {
    let bin = "";
    for (const b of new TextEncoder().encode(s)) bin += String.fromCharCode(b);
    const out = btoa(bin);
    return urlSafe ? out.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : out;
  }, "変換できませんでした");
}
export function base64Decode(s: string): CodecResult {
  return wrap(() => {
    let t = s.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
    t += "===".slice((t.length + 3) % 4);
    const bytes = Uint8Array.from(atob(t), (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  }, "Base64として読めないか、中身がUTF-8の文字ではありません");
}

/* HTML */
const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const htmlEscape = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);
const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", copy: "©", reg: "®", yen: "¥" };
export const htmlUnescape = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const cp = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) && cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });

/* 正規表現 */
export type RegexMatch = { text: string; index: number; groups: (string | undefined)[] };
export type RegexResult = { ok: true; matches: RegexMatch[]; replaced?: string } | { ok: false; message: string };
export function testRegex(pattern: string, flags: string, text: string, replacement?: string): RegexResult {
  if (!pattern) return { ok: true, matches: [] };
  let re: RegExp;
  try {
    re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
  } catch (e) {
    return { ok: false, message: `パターンかフラグが正しくありません：${(e as Error).message}` };
  }
  const matches = [...text.matchAll(re)].slice(0, 1000).map((m) => ({ text: m[0], index: m.index ?? 0, groups: m.slice(1) }));
  const replaced = replacement !== undefined && replacement !== "" ? text.replace(new RegExp(pattern, flags), replacement) : undefined;
  return { ok: true, matches, replaced };
}
