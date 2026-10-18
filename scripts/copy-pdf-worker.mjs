// pdf.js の処理用ワーカーを public/ にコピーする（npm install のたびに実行）
import { copyFileSync, mkdirSync } from "node:fs";
mkdirSync("public", { recursive: true });
copyFileSync("node_modules/pdfjs-dist/build/pdf.worker.min.mjs", "public/pdf.worker.min.mjs");
console.log("pdf.worker.min.mjs をコピーしました");
