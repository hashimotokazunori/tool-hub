/**
 * ツールの「使うとこうなる」画面写真を撮る（スマホ幅・例を入力した状態）。
 * 撮った写真は public/shots/<slug>.webp に置き、ツール一覧のカードや記事に出す。
 *
 * 使い方：node scripts/tool-shots.mjs [slug ...]   （slug を省くと SHOTS の全部）
 * 撮る先は既定で https://toolhiroba.com（SHOT_BASE で変えられる）。
 * ブラウザは Playwright の Chromium（%LOCALAPPDATA%/ms-playwright）か、CHROME_PATH。
 */
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const BASE = process.env.SHOT_BASE ?? "https://toolhiroba.com";
const OUT = "public/shots";

import { SHOTS } from "./tool-shot-examples.mjs";

export { SHOTS };

/** 入力欄と結果欄が上下に並ぶ文字変換ツール。結果の欄を写す */
const OUTPUT_TEXTAREA = new Set(["hiragana-katakana", "case-converter", "whitespace-remover", "text-replace", "remove-duplicate-lines", "url-encode", "base64", "html-escape", "json-formatter"]);

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const root = join(process.env.LOCALAPPDATA ?? "", "ms-playwright");
  const dir = existsSync(root) ? readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)).sort().pop() : undefined;
  const exe = dir && join(root, dir, "chrome-win64", "chrome.exe");
  if (!exe || !existsSync(exe)) throw new Error("Chromium が見つかりません。CHROME_PATH を指定してください");
  return exe;
}

async function fillByLabel(page, label, value) {
  const field = page.getByLabel(label, { exact: false }).first();
  const tag = await field.evaluate((el) => el.tagName.toLowerCase());
  if (tag === "select") await field.selectOption(value);
  else await field.fill(value);
}

async function shoot(page, slug, spec) {
  await page.goto(`${BASE}/tools/${slug}/`, { waitUntil: "networkidle" });
  // 上に貼りつくヘッダー・下のナビは写真に入れない
  await page.addStyleTag({ content: "header, nav[aria-label], .fixed { display: none !important; } *:focus { outline: none !important; }" });
  for (const [label, value] of spec.fill ?? []) await fillByLabel(page, label, value);
  const areas = page.locator("section[aria-label$='の操作'] textarea:not([readonly])");
  for (const [i, value] of (spec.text ?? []).entries()) await areas.nth(i).fill(value);
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
  await page.waitForTimeout(400);
  const panel = page.locator("section[aria-label$='の操作']").first();
  const box = await panel.boundingBox();
  // 結果（aria-live の表示）があれば、それが写真の下寄りに入るように切る
  const result = page.locator(`section[aria-label$='の操作'] ${spec.target ?? (OUTPUT_TEXTAREA.has(slug) ? "textarea[readonly]" : "[aria-live]")}`).first();
  const rbox = (await result.count()) ? await result.boundingBox() : null;
  const png = await panel.screenshot({ animations: "disabled" });
  const meta = await sharp(png).metadata();
  const scale = (meta.width ?? 1) / (box?.width ?? 1);
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const h = Math.min(height, Math.round(width * 0.75));
  let top = 0;
  if (rbox && box) {
    const rTop = (rbox.y - box.y) * scale;
    const rBottom = (rbox.y + rbox.height - box.y) * scale;
    // 結果が大きい（QRコードなど）ときは結果の上端を少し下に置き、小さいときは結果の下端を写真の下に合わせる
    const want = rBottom - rTop > h * 0.8 ? rTop - h * 0.12 : Math.max(rBottom, rTop + h * 0.45) - h;
    top = Math.max(0, Math.min(height - h, Math.round(want)));
  }
  await sharp(png).extract({ left: 0, top, width, height: h }).resize({ width: 720 }).webp({ quality: 78 }).toFile(join(OUT, `${slug}.webp`));
  return `${slug}.webp`;
}

const wanted = process.argv.slice(2);
const list = Object.entries(SHOTS).filter(([s]) => !wanted.length || wanted.includes(s));
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: findChrome() });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: "light", locale: "ja-JP" });
const failed = [];
for (const [slug, spec] of list) {
  try {
    console.log("ok", await shoot(page, slug, spec));
  } catch (e) {
    failed.push(slug);
    console.warn("ng", slug, e.message.split("\n")[0]);
  }
}
await browser.close();
// 写真があるツールの一覧（カードが読む）。public/shots にある .webp を全部書く
const all = readdirSync(OUT).filter((f) => f.endsWith(".webp")).map((f) => f.replace(/\.webp$/, "")).sort();
writeFileSync("data/tool-shots.json", JSON.stringify(all, null, 2) + "\n");
if (failed.length) process.exitCode = 1;
