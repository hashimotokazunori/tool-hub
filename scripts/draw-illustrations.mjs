/**
 * 記事のイラストを SVG で描いて webp にする（Gemini の画像生成を使わない分）。
 * 使い方：node scripts/draw-illustrations.mjs
 * 色は既存のイラストに合わせる：背景 #f6f7fb・藍紫 #4f46e5・えんじ #9b2c3a・線 #1e1b4b。文字は入れない。
 */
import { readdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const BG = "#f6f7fb";
const INK = "#1e1b4b";
const INDIGO = "#4f46e5";
const SOFT = "#c7d2fe";
const ENJI = "#9b2c3a";
const PAPER = "#ffffff";
const GRAY = "#e5e7f0";

/** 輪郭線（太さを変えられる） */
const lineW = (w) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const line = lineW(4);
const thin = `stroke="${INK}" stroke-width="2.5" stroke-linecap="round"`;

/** 4つの角のきらきら */
const sparkle = (x, y, r, fill) => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="${fill}"/>`;
const confetti = () =>
  [
    sparkle(90, 120, 22, "#a5b4fc"),
    sparkle(150, 210, 12, "#a5b4fc"),
    sparkle(1110, 110, 20, "#a5b4fc"),
    sparkle(1060, 560, 16, "#a5b4fc"),
    `<rect x="210" y="80" width="22" height="22" rx="3" fill="${SOFT}" transform="rotate(20 221 91)"/>`,
    `<rect x="1150" y="230" width="16" height="30" rx="3" fill="#d79aa3" transform="rotate(30 1158 245)"/>`,
    `<circle cx="120" cy="560" r="7" fill="#d79aa3"/>`,
    `<circle cx="1000" cy="80" r="6" fill="${SOFT}"/>`,
  ].join("");

/** ふた付きの贈り物の箱（返礼品） */
const giftBox = (x, y, w, h) => `
  <rect x="${x}" y="${y + h * 0.28}" width="${w}" height="${h * 0.72}" rx="6" fill="${ENJI}" ${line}/>
  <rect x="${x - 10}" y="${y}" width="${w + 20}" height="${h * 0.3}" rx="6" fill="#b84453" ${line}/>
  <rect x="${x + w / 2 - 12}" y="${y}" width="24" height="${h}" fill="${PAPER}" ${line}/>
  <path d="M${x + w / 2} ${y} C${x + w / 2 - 50} ${y - 50} ${x + w / 2 - 70} ${y + 5} ${x + w / 2} ${y}Z M${x + w / 2} ${y} C${x + w / 2 + 50} ${y - 50} ${x + w / 2 + 70} ${y + 5} ${x + w / 2} ${y}Z" fill="${PAPER}" ${line}/>`;

/** 表の線が入った書類 */
const sheet = (x, y, w, h, rows, highlight) => {
  let s = `<rect x="${x + 14}" y="${y + 14}" width="${w}" height="${h}" rx="10" fill="${GRAY}" ${line}/>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${PAPER}" ${line}/>`;
  s += `<rect x="${x + 30}" y="${y + 28}" width="${w * 0.4}" height="22" rx="4" fill="${SOFT}"/>`;
  const top = y + 80;
  const rh = (h - 110) / rows;
  for (let i = 0; i < rows; i++) {
    const ry = top + i * rh;
    if (i === highlight) s += `<rect x="${x + 22}" y="${ry - 4}" width="${w - 44}" height="${rh}" rx="6" fill="#e0e7ff" stroke="${INDIGO}" stroke-width="5"/>`;
    s += `<line x1="${x + 34}" y1="${ry + rh / 2 - 2}" x2="${x + 34 + w * 0.28}" y2="${ry + rh / 2 - 2}" ${thin} opacity="0.55"/>`;
    s += `<rect x="${x + w * 0.55}" y="${ry + rh / 2 - 12}" width="${w * 0.3}" height="20" rx="4" fill="${i === highlight ? INDIGO : GRAY}"/>`;
  }
  return s;
};

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><rect width="1200" height="675" fill="${BG}"/>${confetti()}${body}</svg>`;

const drawings = {
  // 住民税の通知書の「所得割額」の行を虫めがねで見る
  "furusato-tax-notice": svg(`
    ${sheet(300, 90, 440, 500, 7, 2)}
    <g transform="translate(720 300)">
      <line x1="70" y1="70" x2="170" y2="170" stroke="${INK}" stroke-width="26" stroke-linecap="round"/>
      <line x1="70" y1="70" x2="165" y2="165" stroke="${ENJI}" stroke-width="16" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="105" fill="#eef2ff" fill-opacity="0.85" ${lineW(10)}/>
      <circle cx="0" cy="0" r="105" fill="none" stroke="${INDIGO}" stroke-width="6"/>
      <rect x="-70" y="-18" width="140" height="36" rx="6" fill="${INDIGO}"/>
    </g>
    ${giftBox(930, 470, 150, 120)}
    <g transform="translate(130 400)">
      <rect x="0" y="0" width="120" height="170" rx="16" fill="${INDIGO}" ${line}/>
      <rect x="14" y="20" width="92" height="120" rx="8" fill="${PAPER}"/>
      <path d="M32 80 l18 18 l36 -40" fill="none" stroke="${INDIGO}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`),

  // カレンダーの10日に印、封筒と時計、確定申告の書類
  "furusato-one-stop-late": svg(`
    <g transform="translate(150 120)">
      <rect x="10" y="10" width="420" height="420" rx="18" fill="${GRAY}" ${line}/>
      <rect x="0" y="0" width="420" height="420" rx="18" fill="${PAPER}" ${line}/>
      <path d="M0 18 a18 18 0 0 1 18 -18 h384 a18 18 0 0 1 18 18 v62 h-420z" fill="${INDIGO}" ${line}/>
      <line x1="100" y1="-24" x2="100" y2="34" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
      <line x1="320" y1="-24" x2="320" y2="34" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
      ${Array.from({ length: 35 }, (_, i) => {
        const cx = 40 + (i % 7) * 57;
        const cy = 125 + Math.floor(i / 7) * 62;
        if (i === 9) return `<circle cx="${cx}" cy="${cy}" r="27" fill="${ENJI}"/><circle cx="${cx}" cy="${cy}" r="9" fill="${PAPER}"/>`;
        return `<rect x="${cx - 13}" y="${cy - 9}" width="26" height="18" rx="4" fill="${i < 9 ? SOFT : GRAY}"/>`;
      }).join("")}
    </g>
    <g transform="translate(640 330) rotate(-8)">
      <rect x="0" y="0" width="300" height="190" rx="12" fill="${PAPER}" ${line}/>
      <path d="M0 10 L150 110 L300 10" fill="none" ${line}/>
      <rect x="215" y="25" width="55" height="62" rx="6" fill="${ENJI}" ${lineW(3)}/>
    </g>
    <g transform="translate(860 210)">
      <circle cx="0" cy="0" r="92" fill="${PAPER}" ${lineW(8)}/>
      <circle cx="0" cy="0" r="92" fill="none" stroke="${INDIGO}" stroke-width="5"/>
      ${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="-74" x2="0" y2="-62" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" transform="rotate(${i * 30})"/>`).join("")}
      <line x1="0" y1="0" x2="0" y2="-55" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
      <line x1="0" y1="0" x2="40" y2="18" stroke="${ENJI}" stroke-width="9" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="9" fill="${INK}"/>
    </g>
    <g transform="translate(1000 380) rotate(6)">
      <rect x="0" y="0" width="150" height="200" rx="10" fill="${PAPER}" ${line}/>
      ${[0, 1, 2, 3].map((i) => `<rect x="20" y="${30 + i * 40}" width="22" height="22" rx="4" fill="none" stroke="${INDIGO}" stroke-width="4"/><path d="M24 ${41 + i * 40} l6 7 l12 -14" fill="none" stroke="${INDIGO}" stroke-width="4" stroke-linecap="round"/><line x1="55" y1="${41 + i * 40}" x2="125" y2="${41 + i * 40}" ${thin} opacity="0.5"/>`).join("")}
    </g>`),

  // 上がって下がる折れ線、コインの山、かばん、返礼品
  "furusato-income-change": svg(`
    <g transform="translate(140 110)">
      <rect x="10" y="10" width="560" height="380" rx="18" fill="${GRAY}" ${line}/>
      <rect x="0" y="0" width="560" height="380" rx="18" fill="${PAPER}" ${line}/>
      ${[1, 2, 3].map((i) => `<line x1="40" y1="${i * 90 + 10}" x2="520" y2="${i * 90 + 10}" stroke="${GRAY}" stroke-width="4"/>`).join("")}
      ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${60 + i * 78}" y="${[200, 170, 130, 110, 230, 260][i]}" width="40" height="${330 - [200, 170, 130, 110, 230, 260][i]}" rx="6" fill="${i < 4 ? SOFT : "#f1c9cf"}"/>`).join("")}
      <polyline points="80,180 158,150 236,110 314,90 392,210 470,240" fill="none" stroke="${INDIGO}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="392,210 470,240" fill="none" stroke="${ENJI}" stroke-width="10" stroke-linecap="round"/>
      ${[
        [80, 180],
        [158, 150],
        [236, 110],
        [314, 90],
      ].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="${PAPER}" stroke="${INDIGO}" stroke-width="6"/>`).join("")}
      <circle cx="392" cy="210" r="11" fill="${PAPER}" stroke="${ENJI}" stroke-width="6"/>
      <circle cx="470" cy="240" r="11" fill="${PAPER}" stroke="${ENJI}" stroke-width="6"/>
    </g>
    <g transform="translate(780 330)">
      <rect x="0" y="40" width="220" height="150" rx="16" fill="${INDIGO}" ${line}/>
      <path d="M70 40 v-24 a10 10 0 0 1 10 -10 h60 a10 10 0 0 1 10 10 v24" fill="none" ${lineW(8)}/>
      <line x1="0" y1="100" x2="220" y2="100" ${line}/>
      <rect x="95" y="88" width="30" height="24" rx="4" fill="${PAPER}" ${lineW(3)}/>
    </g>
    <g transform="translate(150 520)">
      ${[0, 1, 2, 3].map((i) => `<ellipse cx="60" cy="${80 - i * 20}" rx="60" ry="18" fill="#f5d48a" ${lineW(3)}/>`).join("")}
      ${[0, 1].map((i) => `<ellipse cx="170" cy="${80 - i * 20}" rx="60" ry="18" fill="#f5d48a" ${lineW(3)}/>`).join("")}
    </g>
    ${giftBox(1010, 200, 120, 100)}`),
};

for (const [slug, s] of Object.entries(drawings)) {
  await sharp(Buffer.from(s)).webp({ quality: 85 }).toFile(`public/articles/${slug}.webp`);
  console.log(slug);
}
const all = readdirSync("public/articles").filter((f) => f.endsWith(".webp")).map((f) => f.slice(0, -5)).sort();
writeFileSync("data/article-images.json", JSON.stringify(all, null, 2) + "\n");
