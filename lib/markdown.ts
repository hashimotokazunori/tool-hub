import { readFileSync } from "node:fs";
import path from "node:path";
import { marked } from "marked";

/** content/ 以下のMarkdownをHTMLにする（ビルド時に実行。本文はリポジトリ内の文章だけ） */
export function renderMarkdownFile(relativePath: string): string {
  const file = path.join(process.cwd(), "content", relativePath);
  const md = readFileSync(file, "utf8");
  return marked.parse(md, { async: false });
}
