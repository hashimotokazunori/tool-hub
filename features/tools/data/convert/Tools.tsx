"use client";

import { useState } from "react";
import { FileDrop } from "@/components/FileDrop";
import { Check, Choice } from "@/components/TextTransform";
import { CopyButton, Field, Stats } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { baseName, saveBlob } from "@/lib/files";
import { decodeText } from "../charset/logic";
import { contrastRatio, csvToJson, formatRatio, jsonToCsv, parseHex, toHex, wcagJudge, type Delimiter, type NestedMode } from "./logic";

// ───────── コントラスト比 ─────────

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const rgb = parseHex(value);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] text-muted">{label}</span>
      <div className="flex gap-2">
        <input type="color" aria-label={`${label}を色から選ぶ`} className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-line bg-field p-1" value={rgb ? toHex(rgb) : "#000000"} onChange={(e) => onChange(e.target.value)} />
        <input aria-label={`${label}のカラーコード`} className={`${ui.input} font-mono`} value={value} spellCheck={false} autoCapitalize="off" placeholder="#333333" onChange={(e) => onChange(e.target.value)} />
      </div>
      {!rgb && <span className="text-xs text-warn">「#333」や「#1a2b3c」の形で入れてください</span>}
    </div>
  );
}

function Verdict({ label, pass, need }: { label: string; pass: boolean; need: string }) {
  return (
    <li className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${pass ? "border-ok" : "border-warn"}`}>
      <span className="text-sm">
        {label}
        <span className="block text-xs text-muted">{need}</span>
      </span>
      <b className={pass ? "text-ok" : "text-warn"}>{pass ? "合格" : "不合格"}</b>
    </li>
  );
}

/** コントラスト比計算（WCAG 2.x） */
export function ContrastChecker() {
  const [fg, setFg] = useState("#333333");
  const [bg, setBg] = useState("#ffffff");
  const a = parseHex(fg);
  const b = parseHex(bg);
  const ratio = a && b ? contrastRatio(a, b) : null;
  const j = ratio ? wcagJudge(ratio) : null;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <ColorInput label="文字の色" value={fg} onChange={setFg} />
        <button
          type="button"
          className={ui.button}
          onClick={() => {
            setFg(bg);
            setBg(fg);
          }}
        >
          ⇄ 入れ替える
        </button>
        <ColorInput label="背景の色" value={bg} onChange={setBg} />
      </div>
      {a && b && (
        <div className="flex flex-col gap-2 rounded-xl border border-line p-4" style={{ color: toHex(a), background: toHex(b) }}>
          <p className="text-base">ふつうの文字の見本です。The quick brown fox.</p>
          <p className="text-2xl">大きな文字の見本（24px）</p>
          <p className="text-[19px] font-bold">太字の大きな文字の見本（約19px）</p>
        </div>
      )}
      {ratio && j && (
        <>
          <Stats items={[{ label: "コントラスト比", value: formatRatio(ratio), emphasis: true }]} />
          <ul className="grid gap-2 sm:grid-cols-2" aria-live="polite">
            <Verdict label="AA・ふつうの文字" pass={j.aaNormal} need="4.5 : 1 以上" />
            <Verdict label="AA・大きな文字" pass={j.aaLarge} need="3 : 1 以上" />
            <Verdict label="AAA・ふつうの文字" pass={j.aaaNormal} need="7 : 1 以上" />
            <Verdict label="AAA・大きな文字" pass={j.aaaLarge} need="4.5 : 1 以上" />
          </ul>
        </>
      )}
      <p className={ui.note}>WCAG 2.x の計算式で求めています。「大きな文字」は 18pt（約24px）以上、または 14pt（約18.7px）以上の太字です。ロゴや飾りの文字には基準がありません。</p>
    </div>
  );
}

// ───────── CSV → JSON ─────────

const DELIMITERS: [Delimiter, string][] = [
  [",", "カンマ（,）"],
  ["\t", "タブ"],
  [";", "セミコロン（;）"],
];
const DELIM_LABEL: Record<Delimiter, string> = { ",": "カンマ", "\t": "タブ", ";": "セミコロン" };

/** CSVをJSONに変換 */
export function CsvToJson() {
  const [text, setText] = useState("");
  const [name, setName] = useState("data");
  const [delimiter, setDelimiter] = useState<Delimiter | "auto">("auto");
  const [header, setHeader] = useState(true);
  const [convert, setConvert] = useState(true);
  const [shape, setShape] = useState<"objects" | "arrays">("objects");
  const [pretty, setPretty] = useState(true);
  const [msg, setMsg] = useState("");

  const open = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    const r = decodeText(new Uint8Array(await f.arrayBuffer()));
    if (r.encoding === "BINARY") return setMsg("テキストのファイルとして読めません");
    setText(r.text);
    setName(baseName(f.name));
    setMsg(`${f.name} を読み込みました`);
  };

  const r = text.trim() ? csvToJson(text, delimiter, { header, convert, shape: header ? shape : "arrays", pretty }) : null;
  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="CSVファイル" accept=".csv,.tsv,.txt,text/csv,text/plain" onFiles={open} hint="UTF-8・Shift_JIS を自動で見分けます。下の欄に貼り付けても使えます" />
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <Choice label="区切り文字" value={delimiter} onChange={setDelimiter} options={[["auto", "自動で判定"], ...DELIMITERS]} />
        {header && (
          <Choice
            label="出力の形"
            value={shape}
            onChange={setShape}
            options={[
              ["objects", "オブジェクトの配列（見出しがキー）"],
              ["arrays", "配列の配列"],
            ]}
          />
        )}
        <Check label="1行目を見出しにする" checked={header} onChange={setHeader} />
        <Check label="数値・true/false を変換する" checked={convert} onChange={setConvert} />
        <Check label="改行して見やすくする" checked={pretty} onChange={setPretty} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="CSV">
          <textarea className={`${ui.input} min-h-64 font-mono text-sm`} value={text} spellCheck={false} placeholder={"名前,年齢\n山田,30\n佐藤,25"} onChange={(e) => setText(e.target.value)} />
        </Field>
        <Field label="JSON">
          <textarea className={`${ui.input} min-h-64 font-mono text-sm`} value={r?.json ?? ""} readOnly />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton text={r?.json ?? ""} label="JSONをコピー" primary />
        <button type="button" className={ui.button} disabled={!r} onClick={() => r && saveBlob(`${name}.json`, new Blob([r.json], { type: "application/json" }))}>
          .json で保存
        </button>
        <button
          type="button"
          className={ui.button}
          disabled={!text}
          onClick={() => {
            setText("");
            setMsg("");
          }}
        >
          消す
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {r ? `${r.rows}件・${r.columns}列（区切り：${DELIM_LABEL[r.delimiter]}）` : msg}
        </span>
      </div>
      <p className={ui.note}>
        {`「"」で囲んだ欄の中のカンマや改行、「""」（「"」そのもの）も正しく読みます。数値の変換では、「0123」のように0で始まる数字（郵便番号・電話番号など）や、桁が多すぎる数字は文字のまま残します。データはこの端末の中だけで変換します。`}
      </p>
    </div>
  );
}

// ───────── JSON → CSV ─────────

/** JSONからCSVへ変換 */
export function JsonToCsv() {
  const [text, setText] = useState("");
  const [name, setName] = useState("data");
  const [delimiter, setDelimiter] = useState<Delimiter>(",");
  const [nested, setNested] = useState<NestedMode>("flatten");
  const [bom, setBom] = useState(true);
  const [msg, setMsg] = useState("");

  const open = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setText(await f.text());
    setName(baseName(f.name));
    setMsg(`${f.name} を読み込みました`);
  };

  const r = jsonToCsv(text, delimiter, nested);
  const csv = "csv" in r ? r.csv : "";
  const ext = delimiter === "\t" ? "tsv" : "csv";
  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="JSONファイル" accept=".json,application/json,text/plain" onFiles={open} hint="下の欄に貼り付けても使えます" />
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <Choice label="区切り文字" value={delimiter} onChange={setDelimiter} options={DELIMITERS} />
        <Choice
          label="入れ子のオブジェクト"
          value={nested}
          onChange={setNested}
          options={[
            ["flatten", "列に開く（住所.市区町村）"],
            ["json", "JSONの文字のまま1つの欄に"],
          ]}
        />
        <Check label="BOM付きUTF-8で保存（Excel向け）" checked={bom} onChange={setBom} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="JSON">
          <textarea className={`${ui.input} min-h-64 font-mono text-sm`} value={text} spellCheck={false} placeholder={'[\n  {"名前": "山田", "年齢": 30},\n  {"名前": "佐藤", "年齢": 25}\n]'} onChange={(e) => setText(e.target.value)} />
        </Field>
        <Field label="CSV">
          <textarea className={`${ui.input} min-h-64 font-mono text-sm`} value={csv} readOnly />
        </Field>
      </div>
      {"error" in r && (
        <p className="text-sm text-warn" role="alert">
          {r.error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton text={csv} label="CSVをコピー" primary />
        <button type="button" className={ui.button} disabled={!csv} onClick={() => saveBlob(`${name}.${ext}`, new Blob([bom ? "﻿" : "", csv], { type: "text/csv;charset=utf-8" }))}>
          .{ext} で保存
        </button>
        <button
          type="button"
          className={ui.button}
          disabled={!text}
          onClick={() => {
            setText("");
            setMsg("");
          }}
        >
          消す
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {"rows" in r && text.trim() ? `${r.rows}行・${r.columns}列` : msg}
        </span>
      </div>
      <p className={ui.note}>
        {`すべての行のキーを合わせて列にします（最初に出てきた順）。キーがない行は空欄になります。入れ子の配列は列が増えすぎないよう、JSONの文字のまま1つの欄に入れます。カンマ・「"」・改行を含む値は「"」で囲みます。データはこの端末の中だけで変換します。`}
      </p>
    </div>
  );
}
