import Encoding from "encoding-japanese";

export type SourceEncoding = "UTF8" | "UTF8BOM" | "SJIS" | "EUCJP" | "JIS" | "UTF16" | "ASCII" | "BINARY";
export type TargetEncoding = "UTF8BOM" | "UTF8" | "SJIS" | "EUCJP";
export type LineEnding = "keep" | "crlf" | "lf";

export const ENCODING_LABEL: Record<SourceEncoding | TargetEncoding, string> = {
  UTF8: "UTF-8",
  UTF8BOM: "UTF-8（BOM付き）",
  SJIS: "Shift_JIS",
  EUCJP: "EUC-JP",
  JIS: "JIS（ISO-2022-JP）",
  UTF16: "UTF-16",
  ASCII: "ASCII（英数字のみ）",
  BINARY: "テキストではない可能性",
};

/** 文字コードを判定して文字列にする */
export function decodeText(bytes: Uint8Array): { encoding: SourceEncoding; text: string; lineEnding: "CRLF" | "LF" | "なし" } {
  const bom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  const detected = bom ? "UTF8" : Encoding.detect(bytes);
  const enc: SourceEncoding = bom ? "UTF8BOM" : detected === "UNICODE" || detected === "UTF16BE" || detected === "UTF16LE" ? "UTF16" : ((detected || "BINARY") as SourceEncoding);
  if (enc === "BINARY") return { encoding: enc, text: "", lineEnding: "なし" };
  const from = enc === "UTF8BOM" ? "UTF8" : enc === "UTF16" ? (detected as Encoding.Encoding) : enc;
  const text = Encoding.convert(bytes, { to: "UNICODE", from, type: "string" }).replace(/^﻿/, "");
  return { encoding: enc, text, lineEnding: /\r\n/.test(text) ? "CRLF" : /\n/.test(text) ? "LF" : "なし" };
}

/**
 * 文字列を指定の文字コードのバイト列にする。
 * Shift_JIS・EUC-JP で表せない文字は「?」になるので、lostChars でその文字を返す。
 */
export function encodeText(text: string, to: TargetEncoding, eol: LineEnding): { bytes: Uint8Array; lostChars: string[] } {
  let t = text;
  if (eol !== "keep") t = t.replace(/\r\n|\r|\n/g, eol === "crlf" ? "\r\n" : "\n");
  if (to === "UTF8" || to === "UTF8BOM") {
    const b = new TextEncoder().encode(t);
    if (to === "UTF8") return { bytes: b, lostChars: [] };
    const out = new Uint8Array(b.length + 3);
    out.set([0xef, 0xbb, 0xbf]);
    out.set(b, 3);
    return { bytes: out, lostChars: [] };
  }
  const arr = Encoding.convert(Encoding.stringToCode(t), { to, from: "UNICODE" });
  const back = Encoding.convert(arr, { to: "UNICODE", from: to, type: "string" });
  // 元に戻したときに変わった文字＝変換先で表せなかった文字
  const lost = new Set<string>();
  const a = [...t];
  const b = [...back];
  if (a.length === b.length) a.forEach((c, i) => c !== b[i] && lost.add(c));
  else for (const c of new Set(a)) if (!back.includes(c)) lost.add(c);
  return { bytes: Uint8Array.from(arr), lostChars: [...lost] };
}
