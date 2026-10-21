/**
 * SNS で共有されたときの画像（OGP画像 1200×630）をビルドのときに作る。
 * next/og の ImageResponse は日本語の字形を持たないので、Google Fonts から「画像に出る文字だけ」の
 * Noto Sans JP（太字）を取り寄せて使う。取れなかったときは画像を作らずに例外を出す（ビルドで気付けるように）。
 */
import { ImageResponse } from "next/og";
import { site } from "@/data/site";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export type OgKind = "tool" | "goods" | "solution" | "guide" | "furusato" | "site";

const KIND: Record<OgKind, { label: string; color: string; soft: string }> = {
  tool: { label: "無料ツール", color: "#4f46e5", soft: "#eef0ff" },
  goods: { label: "便利グッズ", color: "#b45309", soft: "#fef3e2" },
  solution: { label: "悩み別ガイド", color: "#0e7490", soft: "#e3f6fa" },
  guide: { label: "選び方ガイド", color: "#be185d", soft: "#fdebf3" },
  furusato: { label: "ふるさと納税", color: "#9b2c3a", soft: "#faf0ef" },
  site: { label: "登録不要・無料", color: "#4f46e5", soft: "#eef0ff" },
};

const fontCache = new Map<string, Promise<ArrayBuffer>>();

/** Google Fonts の CSS API で、text に含まれる文字だけの TTF を取る（古いブラウザの UA だと WOFF か TTF が返る。WOFF2 は ImageResponse が読めない） */
async function loadFont(text: string): Promise<ArrayBuffer> {
  const chars = [...new Set(text)].sort().join("");
  const hit = fontCache.get(chars);
  if (hit) return hit;
  const p = withRetry(async () => {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(chars)}`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30 (KHTML, like Gecko) Safari/534.30" },
      })
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype|woff)'\)/)?.[1];
    if (!url) throw new Error("OGP画像用のフォントを取得できませんでした");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OGP画像用のフォントを取得できませんでした（${res.status}）`);
    return res.arrayBuffer();
  });
  fontCache.set(chars, p);
  // 失敗したものは覚えておかない（次に呼ばれたときに取り直す）
  p.catch(() => fontCache.delete(chars));
  return p;
}

/** Google Fonts がたまに 502 やタイムアウトになり、ビルドが止まるので、間をあけて3回まで試す */
async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= tries) throw e;
      await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
}

/** 長い題名は2行に収まるよう文字の大きさを下げる */
const titleSize = (t: string) => (t.length <= 12 ? 84 : t.length <= 20 ? 72 : t.length <= 30 ? 60 : 50);

/**
 * 説明文を2行（約56文字）に収める。文の途中で切らず、文の区切り（。）までを使う。
 * 「〇〇の無料ツール。」のように題名をくり返すだけの文は飛ばす。
 */
export function shortSub(title: string, sub: string, max = 56): string {
  const sentences = sub.split(/(?<=。)/).map((x) => x.trim()).filter(Boolean);
  const useful = sentences.filter((x) => !(x.startsWith(title) && x.length <= title.length + 10));
  let out = "";
  for (const x of useful.length ? useful : sentences) {
    if ((out + x).length > max) break;
    out += x;
  }
  if (out) return out;
  const first = (useful[0] ?? sentences[0] ?? "").replace(/。$/, "");
  return first.length > max ? `${first.slice(0, max - 1)}…` : first;
}

export async function renderOg({ title, kind, sub }: { title: string; kind: OgKind; sub?: string }) {
  const k = KIND[kind];
  const host = new URL(site.url).host;
  const subText = sub ? shortSub(title, sub) : "";
  const font = await loadFont(`${title}${subText}${k.label}${site.name}${host}登録不要ブラウザだけで使える`);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", background: "#f6f7fb", fontFamily: "NotoSansJP", color: "#0f172a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
            </svg>
          </div>
          <div style={{ fontSize: 40 }}>{site.name}</div>
          <div style={{ marginLeft: "auto", display: "flex", padding: "10px 24px", borderRadius: 999, background: k.soft, color: k.color, fontSize: 30 }}>{k.label}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: titleSize(title), lineHeight: 1.25, display: "flex", flexWrap: "wrap" }}>{title}</div>
          {subText && <div style={{ fontSize: 32, color: "#5b6477", lineHeight: 1.45 }}>{subText}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 28, color: "#5b6477" }}>
          <div style={{ display: "flex" }}>{host}</div>
          <div style={{ display: "flex", height: 10, width: 240, borderRadius: 999, background: `linear-gradient(90deg, ${k.color}, #7c3aed)` }} />
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: "NotoSansJP", data: font, weight: 700, style: "normal" }] },
  );
}
