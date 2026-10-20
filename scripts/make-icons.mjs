// アプリのアイコン（public/icon-*.png・apple-touch-icon.png）を作り直すときだけ使う：node scripts/make-icons.mjs
import { ImageResponse } from "next/og.js";
import React from "react";
import { writeFile } from "node:fs/promises";
const h = React.createElement;
async function make(size, pad, file, maskable) {
  const inner = maskable ? size * 0.6 : size * 0.78;
  const el = h("div", { style: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: maskable ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "transparent" } },
    h("div", { style: { width: maskable ? size : size - pad * 2, height: maskable ? size : size - pad * 2, borderRadius: maskable ? 0 : size * 0.22, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" } },
      h("svg", { width: inner * 0.62, height: inner * 0.62, viewBox: "0 0 24 24", fill: "none", stroke: "#ffffff", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M13 2L4 14h7l-1 8 9-12h-7l1-8z" }))));
  const res = new ImageResponse(el, { width: size, height: size });
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
}
await make(192, 0, "public/icon-192.png", false);
await make(512, 0, "public/icon-512.png", false);
await make(512, 0, "public/icon-maskable-512.png", true);
await make(180, 0, "public/apple-touch-icon.png", true);
console.log("ok");
