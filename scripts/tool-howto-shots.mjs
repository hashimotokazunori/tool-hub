/**
 * ツールページの「使い方」に添える画像を撮る。
 * 例を入れた状態の操作パネルを写し、手順の「」で書いたボタンや欄の場所に ①②③ の番号を付ける。
 * 撮った画像は public/howto/<slug>.webp に置き、data/howto-shots.json に一覧を書く（ToolGuideSection が読む）。
 *
 * 使い方：node scripts/tool-howto-shots.mjs [slug ...]   （slug を省くと /tools/ にある全部）
 * 撮る先は既定で http://localhost:3100（静的書き出しの out/ を配信しておく）。HOWTO_BASE で変えられる。
 */
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { SHOTS } from "./tool-shot-examples.mjs";

const BASE = process.env.HOWTO_BASE ?? "http://localhost:3100";
const OUT = "public/howto";
const WIDTH = 390;

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const root = join(process.env.LOCALAPPDATA ?? "", "ms-playwright");
  const dir = existsSync(root) ? readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)).sort().pop() : undefined;
  const exe = dir && join(root, dir, "chrome-win64", "chrome.exe");
  if (!exe || !existsSync(exe)) throw new Error("Chromium が見つかりません。CHROME_PATH を指定してください");
  return exe;
}

const url = (path) => (BASE.includes("localhost") ? `${BASE}${path}index.html` : `${BASE}${path}`);

async function allToolSlugs(page) {
  await page.goto(url("/tools/"), { waitUntil: "load" });
  const hrefs = await page.$$eval("a[href^='/tools/']", (as) => as.map((a) => a.getAttribute("href")));
  return [...new Set(hrefs.map((h) => h.match(/^\/tools\/([a-z0-9-]+)\/$/)?.[1]).filter((s) => s && s !== "category"))];
}

/** 手順の文から、場所を指す「」の言葉を順に取り出す（数字や長い文は除く） */
const termsOf = (step) => [...step.matchAll(/「([^」]{1,24})」/g)].map((m) => m[1]).filter((t) => !/^[\d,.%円]+$/.test(t));

/** パネルの中で、その言葉が書かれた見える要素の位置（パネルの左上からの相対位置） */
async function locate(panel, term) {
  const found = await panel.evaluate((root, term) => {
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      return r.width > 4 && r.height > 4 && st.visibility !== "hidden" && st.display !== "none";
    };
    const base = root.getBoundingClientRect();
    const norm = (t) => t.replace(/\s+/g, "");
    // 要素そのものの文字（中の入力欄に入っている文字は除く）
    const own = (el) => {
      const c = el.cloneNode(true);
      c.querySelectorAll("textarea, input, select").forEach((x) => x.remove());
      return norm(c.textContent ?? "");
    };
    const want = norm(term);
    // ラベル・ボタン・見出し・選択肢などで、文字がぴったり一致するものを優先し、なければ一番短く含むもの
    const cands = [...root.querySelectorAll("label, button, legend, h2, h3, span, p, option, a, summary, th, dt")].filter((el) => visible(el) && own(el).includes(want));
    cands.sort((a, b) => Number(own(b) === want) - Number(own(a) === want) || own(a).length - own(b).length);
    if (cands.length === 0) {
      const ph = [...root.querySelectorAll("input, textarea")].find((el) => visible(el) && (el.getAttribute("placeholder") ?? "").includes(term));
      if (!ph) return null;
      cands.push(ph);
    }
    let el = cands[0];
    if (el.tagName === "OPTION") el = el.closest("select") ?? el;
    const r = el.getBoundingClientRect();
    return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
  }, term);
  return found;
}

const badge = (n, x, y, r) =>
  `<g><circle cx="${x}" cy="${y}" r="${r}" fill="#9b2c3a" stroke="#fff" stroke-width="${r * 0.22}"/><text x="${x}" y="${y + r * 0.38}" font-size="${r * 1.15}" font-weight="700" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif">${n}</text></g>`;

async function shoot(page, slug, spec) {
  await page.goto(url(`/tools/${slug}/`), { waitUntil: "load" });
  // 画面が動き出す（ハイドレーション）前に入力すると消えるので、少し待つ
  await page.waitForTimeout(1500);
  await page.addStyleTag({ content: "header, nav[aria-label], .fixed { display: none !important; } *:focus { outline: none !important; }" });
  for (const [label, value] of spec.fill ?? []) {
    const field = page.getByLabel(label, { exact: false }).first();
    const tag = await field.evaluate((el) => el.tagName.toLowerCase());
    if (tag === "select") await field.selectOption(value);
    else await field.fill(value);
  }
  const areas = page.locator("section[aria-label$='の操作'] textarea:not([readonly])");
  for (const [i, value] of (spec.text ?? []).entries()) await areas.nth(i).fill(value);
  for (const name of spec.click ?? []) await page.getByRole("button", { name }).first().click();
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
  await page.waitForTimeout(400);

  const steps = await page.$$eval("h2", (hs) => {
    const h = hs.find((x) => (x.textContent ?? "").endsWith("の使い方"));
    const ol = h?.parentElement?.querySelector("ol");
    return ol ? [...ol.querySelectorAll("li")].map((li) => li.textContent ?? "") : [];
  });
  const panel = page.locator("section[aria-label$='の操作']").first();
  const box = await panel.boundingBox();
  if (!box) throw new Error("操作パネルが見つかりません");

  // 手順ごとに、最初に見つかった「」の場所に番号を付ける
  const marks = [];
  for (const [i, step] of steps.entries()) {
    // ファイルを選ぶ手順で「」がないときは、ファイルを置く場所を指す
    const extra = /ファイル|PDF|画像|動画|音声|CSV|選び|選択|ドロップ/.test(step) ? ["ドロップ", "クリックして選択", "ファイルを選ぶ"] : [];
    for (const term of [...termsOf(step), ...extra]) {
      const at = await locate(panel, term);
      if (at) {
        marks.push({ n: i + 1, ...at });
        break;
      }
    }
  }
  if (marks.length < 1) throw new Error(`番号を付けられた手順がない（0/${steps.length}）`);

  const png = await panel.screenshot({ animations: "disabled" });
  const meta = await sharp(png).metadata();
  const scale = (meta.width ?? 1) / box.width;
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  // 番号の付いた欄・ボタンのある範囲だけを切り出す（全体を縮めると文字が読めないので、操作する部分を大きく見せる）
  const lo = Math.max(0, Math.round(Math.min(...marks.map((m) => m.y * scale)) - 20 * scale));
  // 最後の番号の下にある入力欄が入るよう、少し下まで含める
  const hi = Math.min(height, Math.round(Math.max(...marks.map((m) => (m.y + m.h) * scale)) + 100 * scale));
  let top = lo;
  let h = Math.max(hi - lo, Math.round(width * 0.6));
  if (top + h > height) {
    h = Math.min(h, height);
    top = height - h;
  }
  // 番号は画像の左に足した余白に、指す場所と同じ高さで置く（文字に重ならないように）
  const r = 14 * scale;
  const gutter = Math.round(r * 2 + 10 * scale);
  const cy = (m) => Math.max(r + 2, Math.min(h - r - 2, (m.y + Math.min(m.h, 40) / 2) * scale - top));
  // 下を切ったときは、切れ目がわかるように下をうすくぼかす
  const fade =
    top + h < height
      ? `<defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f7fb" stop-opacity="0"/><stop offset="1" stop-color="#f6f7fb" stop-opacity="1"/></linearGradient></defs><rect x="0" y="${h - 70 * scale}" width="${width + gutter}" height="${70 * scale}" fill="url(#f)"/>`
      : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width + gutter}" height="${h}">${fade}${marks
    .map((m) => `<line x1="${gutter / 2 + r}" y1="${cy(m)}" x2="${gutter + m.x * scale - 2 * scale}" y2="${cy(m)}" stroke="#9b2c3a" stroke-width="${2 * scale}" stroke-dasharray="${4 * scale} ${3 * scale}"/>` + badge(m.n, gutter / 2, cy(m), r))
    .join("")}</svg>`;
  // sharp は composite を最後に行うので、切り出しと番号付けを先に済ませてから縮める
  const cut = await sharp(png).extract({ left: 0, top, width, height: h }).toBuffer();
  const marked = await sharp({ create: { width: width + gutter, height: h, channels: 4, background: "#f6f7fb" } })
    .composite([
      { input: cut, top: 0, left: gutter },
      { input: Buffer.from(svg), top: 0, left: 0 },
    ])
    .png()
    .toBuffer();
  await sharp(marked)
    .resize({ width: 640 })
    .webp({ quality: 80 })
    .toFile(join(OUT, `${slug}.webp`));
  return `${slug}.webp（番号 ${marks.length}/${steps.length}）`;
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: findChrome() });
const newPage = () => browser.newPage({ viewport: { width: WIDTH, height: 844 }, deviceScaleFactor: 2, colorScheme: "light", locale: "ja-JP" });
const wanted = process.argv.slice(2);
const slugs = wanted.length ? wanted : await allToolSlugs(await newPage());
const failed = [];
// 4ページずつ並べて撮る
const queue = [...slugs];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    const page = await newPage();
    for (let slug = queue.shift(); slug; slug = queue.shift()) {
      try {
        console.log("ok", await shoot(page, slug, SHOTS[slug] ?? {}));
      } catch (e) {
        failed.push(slug);
        console.warn("ng", slug, e.message.split("\n")[0]);
      }
    }
  }),
);
await browser.close();
const all = readdirSync(OUT).filter((f) => f.endsWith(".webp")).map((f) => f.replace(/\.webp$/, "")).sort();
writeFileSync("data/howto-shots.json", JSON.stringify(all, null, 2) + "\n");
console.log(`撮れた ${all.length} 件、撮れなかった ${failed.length} 件：${failed.join(" ")}`);
