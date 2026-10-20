// 静的書き出し（out/）の先読みファイルの名前を、ブラウザが取りに来る名前にそろえる。
// Next.js は out/a/__next.a/$d$slug/__PAGE__.txt のようにフォルダで書き出すが、
// ブラウザは a/__next.a.$d$slug.__PAGE__.txt を取りに来るので、同じ中身をその名前でも置く。
import { copyFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] ?? "out";
let count = 0;

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p).map((f) => [name, ...f]) : [[name]];
  });
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (!statSync(p).isDirectory()) continue;
    if (name.startsWith("__next.")) {
      for (const parts of files(p)) {
        copyFileSync(join(p, ...parts), join(dir, [name, ...parts].join(".")));
        count++;
      }
    } else {
      walk(p);
    }
  }
}

walk(root);
console.log(`先読みファイルを ${count} 件そろえた`);
