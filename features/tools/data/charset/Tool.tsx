"use client";

import { useState } from "react";
import { FileDrop } from "@/components/FileDrop";
import { Choice } from "@/components/TextTransform";
import { FieldGrid } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { formatBytes, saveBlob, saveZip } from "@/lib/files";
import { decodeText, encodeText, ENCODING_LABEL, type LineEnding, type SourceEncoding, type TargetEncoding } from "./logic";

type Item = { id: number; name: string; size: number; encoding: SourceEncoding; text: string; lineEnding: string };
let nextId = 1;

export default function CsvEncoding() {
  const [items, setItems] = useState<Item[]>([]);
  const [to, setTo] = useState<TargetEncoding>("UTF8BOM");
  const [eol, setEol] = useState<LineEnding>("keep");
  const [selected, setSelected] = useState<number | null>(null);
  const add = async (files: File[]) => {
    const added: Item[] = [];
    for (const f of files) {
      const r = decodeText(new Uint8Array(await f.arrayBuffer()));
      added.push({ id: nextId++, name: f.name, size: f.size, ...r });
    }
    setItems((p) => [...p, ...added]);
    if (added[0]) setSelected(added[0].id);
  };
  const convert = (it: Item) => encodeText(it.text, to, eol);
  const preview = items.find((x) => x.id === selected) ?? items[0];
  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="CSV・テキストファイル" accept=".csv,.tsv,.txt,.md,.html,.htm,.xml,.json,.log,text/*" multiple onFiles={add} hint="Shift_JIS・UTF-8・EUC-JPを自動で見分けます" />
      <FieldGrid>
        <Choice label="変換先" value={to} onChange={setTo} options={[["UTF8BOM", "UTF-8（BOM付き・Excel向け）"], ["UTF8", "UTF-8（BOMなし）"], ["SJIS", "Shift_JIS（古いシステム・Windows向け）"], ["EUCJP", "EUC-JP"]]} />
        <Choice label="改行コード" value={eol} onChange={setEol} options={[["keep", "そのまま"], ["crlf", "CRLF（Windows）"], ["lf", "LF（Mac・Linux）"]]} />
      </FieldGrid>
      {items.length > 0 && (
        <>
          <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel">
            {items.map((it) => {
              const bin = it.encoding === "BINARY";
              const r = bin ? null : convert(it);
              return (
                <li key={it.id} className={`flex flex-wrap items-center gap-3 px-3 py-2 ${preview?.id === it.id ? "bg-accent-soft" : ""}`}>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm">{it.name}</span>
                    <span className="text-xs text-muted">
                      {ENCODING_LABEL[it.encoding]} → <b className="text-ink">{ENCODING_LABEL[to]}</b>・改行 {it.lineEnding}・{formatBytes(it.size)}
                    </span>
                    {r && r.lostChars.length > 0 && <span className="text-xs text-warn">変換先にない文字は「?」になります：{r.lostChars.slice(0, 10).join(" ")}</span>}
                    {bin && <span className="text-xs text-warn">テキストファイルとして読めません</span>}
                  </span>
                  <button type="button" className={`${ui.button} px-2 py-1 text-xs`} onClick={() => setSelected(it.id)}>
                    中身
                  </button>
                  <button type="button" className={`${ui.buttonPrimary} px-3 py-1 text-xs`} disabled={bin} onClick={() => r && saveBlob(it.name, r.bytes)}>
                    保存
                  </button>
                </li>
              );
            })}
          </ul>
          <label className={ui.label}>
            中身の確認（正しく読めていれば変換できます）
            <textarea className={`${ui.input} min-h-36 font-mono text-sm`} readOnly value={preview ? preview.text.slice(0, 5000) + (preview.text.length > 5000 ? "\n…（以下省略）" : "") : ""} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={ui.buttonPrimary} disabled={items.length < 2} onClick={() => saveZip("converted.zip", items.filter((x) => x.encoding !== "BINARY").map((x) => ({ name: x.name, data: convert(x).bytes })))}>
              すべて変換して保存（ZIP）
            </button>
            <button type="button" className={ui.button} onClick={() => setItems([])}>
              一覧を空にする
            </button>
          </div>
        </>
      )}
      <p className={ui.note}>「UTF-8（BOM付き）」にすると、WindowsのExcelでダブルクリックして開いても文字化けしません。ファイルはサーバーに送らず、この端末の中だけで変換します。</p>
    </div>
  );
}
