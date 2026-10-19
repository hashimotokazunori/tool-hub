/** ハッシュ・カラーコード・JWT の計算（画面に関わらない部分） */
import { formatJst } from "@/features/tools/date/time/logic";

/* ---------- ハッシュ ---------- */

export const utf8 = (s: string) => new TextEncoder().encode(s);

export const toHex = (bytes: ArrayBuffer | Uint8Array) => Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");

const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);

/** MD5（RFC 1321）。Web Crypto にないため自前で計算する。結果は16進数の文字列 */
export function md5(data: Uint8Array): string {
  const h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  const M = new Uint32Array(16);
  const block = (src: Uint8Array, off: number) => {
    for (let i = 0; i < 16; i++) {
      const j = off + i * 4;
      M[i] = src[j] | (src[j + 1] << 8) | (src[j + 2] << 16) | (src[j + 3] << 24);
    }
    let [a, b, c, d] = h;
    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      const tmp = d;
      d = c;
      c = b;
      const x = (a + f + K[i] + M[g]) | 0;
      b = (b + ((x << S[i]) | (x >>> (32 - S[i])))) | 0;
      a = tmp;
    }
    h[0] = (h[0] + a) | 0;
    h[1] = (h[1] + b) | 0;
    h[2] = (h[2] + c) | 0;
    h[3] = (h[3] + d) | 0;
  };
  const full = data.length - (data.length % 64);
  for (let off = 0; off < full; off += 64) block(data, off);
  // 最後の端数に 0x80 と長さ（ビット数・リトルエンディアン64ビット）を付けて仕上げる
  const rest = data.length - full;
  const tail = new Uint8Array(rest < 56 ? 64 : 128);
  tail.set(data.subarray(full));
  tail[rest] = 0x80;
  const bits = data.length * 8;
  const lo = bits >>> 0;
  const hi = Math.floor(bits / 2 ** 32) >>> 0;
  const p = tail.length - 8;
  for (let i = 0; i < 4; i++) {
    tail[p + i] = (lo >>> (8 * i)) & 0xff;
    tail[p + 4 + i] = (hi >>> (8 * i)) & 0xff;
  }
  for (let off = 0; off < tail.length; off += 64) block(tail, off);
  const out = new Uint8Array(16);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) out[i * 4 + j] = (h[i] >>> (8 * j)) & 0xff;
  return toHex(out);
}

export const HASH_ALGORITHMS = ["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

/** 指定した方式のハッシュ（16進数・小文字）。SHA は Web Crypto で計算する */
export async function hashBytes(alg: HashAlgorithm, data: Uint8Array): Promise<string> {
  if (alg === "MD5") return md5(data);
  return toHex(await crypto.subtle.digest(alg, data as Uint8Array<ArrayBuffer>));
}

export async function hashAll(data: Uint8Array): Promise<Record<HashAlgorithm, string>> {
  const r = {} as Record<HashAlgorithm, string>;
  for (const a of HASH_ALGORITHMS) r[a] = await hashBytes(a, data);
  return r;
}

/** 照合用：空白・コロン・大文字小文字の違いを無視してハッシュが同じか */
export const sameHash = (a: string, b: string) => {
  const n = (s: string) => s.replace(/[\s:-]/g, "").toLowerCase();
  return n(a) !== "" && n(a) === n(b);
};

/* ---------- カラーコード ---------- */

export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };
export type Cmyk = { c: number; m: number; y: number; k: number };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** "#RGB" "#RRGGBB"（# は省略可） */
export function parseHex(s: string): Rgb | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

/** 文字列から数を取り出す（"rgb(1, 2, 3)" や "1 2 3" のどちらでも） */
function numbersIn(s: string, prefix: RegExp): number[] | null {
  const body = s.trim().replace(prefix, "").replace(/[()%°;]/g, " ").replace(/deg/gi, " ");
  if (!/^[\s\d.,/-]*$/.test(body)) return null;
  const ns = body.split(/[\s,/]+/).filter(Boolean).map(Number);
  return ns.every(Number.isFinite) ? ns : null;
}

export function parseRgb(s: string): Rgb | null {
  const n = numbersIn(s, /^rgba?/i);
  if (!n || n.length < 3 || n.length > 4 || n.slice(0, 3).some((x) => x < 0 || x > 255)) return null;
  return { r: n[0], g: n[1], b: n[2] };
}

export function parseHsl(s: string): Hsl | null {
  const n = numbersIn(s, /^hsla?/i);
  if (!n || n.length < 3 || n.length > 4 || n[1] < 0 || n[1] > 100 || n[2] < 0 || n[2] > 100) return null;
  return { h: ((n[0] % 360) + 360) % 360, s: n[1], l: n[2] };
}

export function parseCmyk(s: string): Cmyk | null {
  const n = numbersIn(s, /^cmyk/i);
  if (!n || n.length !== 4 || n.some((x) => x < 0 || x > 100)) return null;
  return { c: n[0], m: n[1], y: n[2], k: n[3] };
}

/** RGB（0〜255）→ HSL（色相0〜360・彩度と明度は0〜100） */
export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const S2 = s / 100;
  const L = l / 100;
  const c = (1 - Math.abs(2 * L - 1)) * S2;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] = hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = L - c / 2;
  return { r: Math.round((r1 + m) * 255), g: Math.round((g1 + m) * 255), b: Math.round((b1 + m) * 255) };
}

/** 単純な式による RGB → CMYK（%）。印刷用のプロファイルは考えない近似 */
export function rgbToCmyk({ r, g, b }: Rgb): Cmyk {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const k = 1 - Math.max(R, G, B);
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };
  return { c: ((1 - R - k) / (1 - k)) * 100, m: ((1 - G - k) / (1 - k)) * 100, y: ((1 - B - k) / (1 - k)) * 100, k: k * 100 };
}

export function cmykToRgb({ c, m, y, k }: Cmyk): Rgb {
  const K2 = 1 - k / 100;
  return { r: Math.round(255 * (1 - c / 100) * K2), g: Math.round(255 * (1 - m / 100) * K2), b: Math.round(255 * (1 - y / 100) * K2) };
}

const r0 = (n: number) => Math.round(n);
export const formatRgb = (c: Rgb) => `rgb(${r0(c.r)}, ${r0(c.g)}, ${r0(c.b)})`;
export const formatHsl = (c: Rgb) => {
  const h = rgbToHsl(c);
  return `hsl(${r0(h.h) % 360}, ${r0(h.s)}%, ${r0(h.l)}%)`;
};
export const formatCmyk = (c: Rgb) => {
  const x = rgbToCmyk(c);
  return `cmyk(${r0(x.c)}%, ${r0(x.m)}%, ${r0(x.y)}%, ${r0(x.k)}%)`;
};

export type ColorFormat = "hex" | "rgb" | "hsl" | "cmyk";

/** 入力欄の文字を RGB に。読めなければ null */
export function parseColor(format: ColorFormat, s: string): Rgb | null {
  if (format === "hex") return parseHex(s);
  if (format === "rgb") return parseRgb(s);
  if (format === "hsl") {
    const h = parseHsl(s);
    return h && hslToRgb(h);
  }
  const c = parseCmyk(s);
  return c && cmykToRgb(c);
}

export function formatColor(format: ColorFormat, c: Rgb): string {
  return format === "hex" ? rgbToHex(c) : format === "rgb" ? formatRgb(c) : format === "hsl" ? formatHsl(c) : formatCmyk(c);
}

/** WCAG 2 のコントラスト比（白・黒の文字との比較用） */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const lum = ({ r, g, b: bl }: Rgb) => {
    const f = (v: number) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl);
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/* ---------- JWT ---------- */

/** base64url（= なし・-_ を使う形）を読み、UTF-8 の文字列にする。壊れていれば null */
export function base64UrlDecode(s: string): string | null {
  if (!/^[A-Za-z0-9_-]*={0,2}$/.test(s)) return null;
  const b64 = s.replace(/=+$/, "").replace(/-/g, "+").replace(/_/g, "/");
  if (b64.length % 4 === 1) return null;
  try {
    const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export function base64UrlEncode(s: string): string {
  const bytes = utf8(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export type JwtDecoded =
  | { ok: true; header: Record<string, unknown>; payload: unknown; headerJson: string; payloadJson: string; signature: string }
  | { ok: false; message: string };

/** JWT（ヘッダー.ペイロード.署名）を読む。署名の検証はしない */
export function decodeJwt(input: string): JwtDecoded {
  const token = input.trim().replace(/^Bearer\s+/i, "").replace(/\s+/g, "");
  const parts = token.split(".");
  if (parts.length === 5) return { ok: false, message: "5つの部分からなるトークン（JWE・暗号化されたJWT）は、鍵がないと中身を読めません。" };
  if (parts.length !== 3) return { ok: false, message: "JWTは「.」で区切られた3つの部分（ヘッダー.ペイロード.署名）からなります。トークン全体を貼り付けてください。" };
  const parse = (seg: string, name: string): { ok: true; value: unknown } | { ok: false; message: string } => {
    const text = base64UrlDecode(seg);
    if (text === null) return { ok: false, message: `${name}をbase64urlとして読めませんでした。` };
    try {
      return { ok: true, value: JSON.parse(text) };
    } catch {
      return { ok: false, message: `${name}がJSONではありません。` };
    }
  };
  const h = parse(parts[0], "ヘッダー");
  if (!h.ok) return h;
  if (typeof h.value !== "object" || h.value === null || Array.isArray(h.value)) return { ok: false, message: "ヘッダーがJSONのオブジェクトではありません。" };
  const p = parse(parts[1], "ペイロード");
  if (!p.ok) return p;
  return { ok: true, header: h.value as Record<string, unknown>, payload: p.value, headerJson: JSON.stringify(h.value, null, 2), payloadJson: JSON.stringify(p.value, null, 2), signature: parts[2] };
}

export type JwtTime = { claim: "exp" | "iat" | "nbf"; label: string; seconds: number; jst: string };
export type JwtStatus = { times: JwtTime[]; expired: boolean | null; notYetValid: boolean };

const CLAIM_LABEL = { exp: "有効期限（exp）", iat: "発行日時（iat）", nbf: "有効になる日時（nbf）" } as const;

/** exp・iat・nbf を日本時間で。nowSec の時点で期限切れか（exp がなければ null） */
export function jwtTimes(payload: unknown, nowSec: number): JwtStatus {
  const times: JwtTime[] = [];
  const obj = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};
  for (const claim of ["iat", "nbf", "exp"] as const) {
    const v = obj[claim];
    if (typeof v === "number" && Number.isFinite(v) && Math.abs(v) < 8.64e12) times.push({ claim, label: CLAIM_LABEL[claim], seconds: v, jst: `${formatJst(Math.round(v * 1000))}（JST）` });
  }
  const exp = times.find((t) => t.claim === "exp");
  const nbf = times.find((t) => t.claim === "nbf");
  return { times, expired: exp ? exp.seconds <= nowSec : null, notYetValid: nbf ? nbf.seconds > nowSec : false };
}

/** 説明用のサンプル（署名は形だけのダミー） */
export const SAMPLE_JWT = `${base64UrlEncode('{"alg":"HS256","typ":"JWT"}')}.${base64UrlEncode('{"sub":"1234567890","name":"山田太郎","iat":1767225600,"exp":1767229200}')}.c2FtcGxlLXNpZ25hdHVyZS1ub3QtdmFsaWQ`;
