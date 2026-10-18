"use client";

import { useState } from "react";
import { CopyButton } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { useClientValue } from "@/components/useClientValue";
import { entropyBits, generatePassword, strengthLabel, type PasswordOptions } from "./logic";

// 設定と「作り直した回数」が同じあいだは、同じパスワードを返す
const cache = { key: "", value: "" };
function passwordFor(o: PasswordOptions, round: number): string {
  const key = `${JSON.stringify(o)}#${round}`;
  if (cache.key !== key) {
    cache.key = key;
    cache.value = generatePassword(o);
  }
  return cache.value;
}

const CHECKS: { key: keyof Omit<PasswordOptions, "length">; label: string }[] = [
  { key: "upper", label: "大文字 A–Z" },
  { key: "lower", label: "小文字 a–z" },
  { key: "digits", label: "数字 0–9" },
  { key: "symbols", label: "記号 !@#…" },
  { key: "excludeAmbiguous", label: "紛らわしい文字を除く（0 O o 1 l I）" },
];

export default function PasswordGenerator() {
  const [o, setO] = useState<PasswordOptions>({ length: 16, upper: true, lower: true, digits: true, symbols: false, excludeAmbiguous: true });
  const [round, setRound] = useState(0);
  // 乱数は端末の中で作る（静的生成のHTMLにパスワードを入れない）
  const pw = useClientValue(() => passwordFor(o, round), "");
  const regenerate = () => setRound((n) => n + 1);
  const bits = entropyBits(o);
  const label = strengthLabel(bits);
  const none = !(o.upper || o.lower || o.digits || o.symbols);
  return (
    <div className="flex flex-col gap-4">
      <output className="rounded-lg border border-dashed border-line bg-field px-4 py-3 font-mono text-xl break-all" aria-live="polite">
        {none ? "文字の種類を1つ以上選んでください" : pw || " "}
      </output>
      <div className="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className={`h-full ${bits < 64 ? "bg-warn" : "bg-ok"}`} style={{ width: `${Math.min(100, bits / 1.28)}%` }} />
      </div>
      <p className="text-sm">
        強さ：<b>{label}</b>（約 {bits} ビット）
      </p>
      <label className={ui.label}>
        長さ：{o.length} 文字
        <input type="range" min={6} max={64} value={o.length} onChange={(e) => setO({ ...o, length: Number(e.target.value) })} className="accent-accent" />
      </label>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {CHECKS.map((c) => (
          <label key={c.key} className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-accent" checked={o[c.key]} onChange={(e) => setO({ ...o, [c.key]: e.target.checked })} />
            {c.label}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={ui.buttonPrimary} onClick={regenerate} disabled={none}>
          もう一度作る
        </button>
        <CopyButton text={pw} />
      </div>
    </div>
  );
}
