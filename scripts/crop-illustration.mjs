/**
 * 画面から切り出した記事イラスト（周りに暗い背景と角丸がある）から、イラストの部分だけを取り出す。
 * 使い方：node scripts/crop-illustration.mjs <入力.png> <slug>   → public/articles/<slug>.webp（横1200px）
 * 終わったら、イラストがある記事の一覧 data/article-images.json も作り直す。
 */
import { readdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const [input, slug] = process.argv.slice(2);
const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h, channels: c } = info;
const light = (x, y) => {
  const i = (y * w + x) * c;
  return data[i] + data[i + 1] + data[i + 2] > 3 * 90;
};
// 明るい画素が7割以上ある行・列を、イラストの範囲とみなす
const rowOk = (y) => { let n = 0; for (let x = 0; x < w; x++) n += light(x, y); return n > w * 0.7; };
const colOk = (x, y0, y1) => { let n = 0; for (let y = y0; y <= y1; y++) n += light(x, y); return n > (y1 - y0) * 0.7; };
let top = 0; while (top < h && !rowOk(top)) top++;
let bottom = h - 1; while (bottom > top && !rowOk(bottom)) bottom--;
let left = 0; while (left < w && !colOk(left, top, bottom)) left++;
let right = w - 1; while (right > left && !colOk(right, top, bottom)) right--;
// 角丸の暗い部分が残らないよう、内側に少し入る
const inset = Math.round((right - left) * 0.03);
const box = { left: left + inset, top: top + inset, width: right - left - inset * 2, height: bottom - top - inset * 2 };
// 16:9 にそろえる（高さを基準に切る）
const targetH = Math.min(box.height, Math.round(box.width * 9 / 16));
const offY = box.top + Math.round((box.height - targetH) / 2);
const targetW = Math.round(targetH * 16 / 9);
const offX = box.left + Math.round((box.width - targetW) / 2);
await sharp(input).extract({ left: offX, top: offY, width: targetW, height: targetH }).resize({ width: 1200 }).webp({ quality: 80 }).toFile(`public/articles/${slug}.webp`);
console.log(slug, box, targetW, targetH);
const all = readdirSync("public/articles").filter((f) => f.endsWith(".webp")).map((f) => f.slice(0, -5)).sort();
writeFileSync("data/article-images.json", JSON.stringify(all, null, 2) + "\n");
