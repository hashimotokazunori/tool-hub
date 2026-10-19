"use client";

import { useState } from "react";
import { FileDrop } from "@/components/FileDrop";
import { Check, Choice } from "@/components/TextTransform";
import { Field } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { baseName, saveBlob } from "@/lib/files";
import { decodeText, encodeText } from "../charset/logic";
import { csvRowsToData, detectDelimiter, parseCsv, toCsvText } from "../convert/logic";
import { buildXlsx, colName, openXlsx, readSheet, type Workbook } from "./logic";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const PREVIEW_ROWS = 50;

/** 先頭の行だけを表で見せる */
function Preview({ rows }: { rows: string[][] }) {
  if (!rows.length) return <p className="text-sm text-muted">このシートには値の入ったセルがありません。</p>;
  const width = Math.max(...rows.map((r) => r.length));
  return (
    <div className="max-h-96 overflow-auto rounded-xl border border-line">
      <table className="min-w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-field">
          <tr>
            <th className="border-b border-line px-2 py-1 text-xs text-muted" />
            {Array.from({ length: width }, (_, c) => (
              <th key={c} scope="col" className="border-b border-l border-line px-2 py-1 font-mono text-xs text-muted">
                {colName(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, PREVIEW_ROWS).map((r, i) => (
            <tr key={i}>
              <th scope="row" className="border-t border-line bg-field px-2 py-1 text-right font-mono text-xs text-muted">
                {i + 1}
              </th>
              {Array.from({ length: width }, (_, c) => (
                <td key={c} className="max-w-60 truncate border-t border-l border-line px-2 py-1 whitespace-nowrap">
                  {r[c] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type OutEnc = "UTF8BOM" | "UTF8" | "SJIS";

function FromXlsx() {
  const [wb, setWb] = useState<Workbook | null>(null);
  const [name, setName] = useState("");
  const [sheet, setSheet] = useState(0);
  const [formatDates, setFormatDates] = useState(true);
  const [rows, setRows] = useState<string[][] | null>(null);
  const [out, setOut] = useState<"csv" | "json">("csv");
  const [enc, setEnc] = useState<OutEnc>("UTF8BOM");
  const [header, setHeader] = useState(true);
  const [msg, setMsg] = useState("");

  const load = async (book: Workbook, index: number, dates: boolean) => {
    try {
      setRows(await readSheet(book, index, { formatDates: dates }));
      setMsg("");
    } catch (e) {
      setRows(null);
      setMsg((e as Error).message);
    }
  };

  const open = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    const bytes = new Uint8Array(await f.arrayBuffer());
    // 古い .xls は「D0 CF 11 E0」で始まるバイナリ形式
    if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
      setWb(null);
      setRows(null);
      return setMsg("古い .xls 形式（またはパスワード付きのファイル）には対応していません。Excelで「.xlsx」形式で保存し直してからお使いください");
    }
    try {
      setMsg("読み込み中…");
      const book = await openXlsx(bytes);
      if (!book.sheets.length) throw new Error("表のシートが見つかりません");
      setWb(book);
      setName(baseName(f.name));
      setSheet(0);
      await load(book, 0, formatDates);
    } catch (e) {
      setWb(null);
      setRows(null);
      setMsg((e as Error).message);
    }
  };

  const fileBase = wb ? (wb.sheets.length > 1 ? `${name}_${wb.sheets[sheet].name}` : name) : "data";
  const save = () => {
    if (!rows) return;
    if (out === "csv") {
      const r = encodeText(toCsvText(rows, ","), enc, "keep");
      saveBlob(`${fileBase}.csv`, new Blob([r.bytes as BlobPart], { type: "text/csv" }));
      setMsg(r.lostChars.length ? `Shift_JISにない文字（${r.lostChars.slice(0, 10).join(" ")}）は「?」になりました。UTF-8で保存すると残せます` : "保存しました");
    } else {
      const data = csvRowsToData(rows, { header, convert: true, shape: "objects" });
      saveBlob(`${fileBase}.json`, new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      setMsg("保存しました");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="Excelファイル（.xlsx）" accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onFiles={open} />
      {wb && (
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          <label className={ui.label}>
            シート
            <select
              className={`${ui.input} w-auto`}
              value={sheet}
              onChange={(e) => {
                const i = Number(e.target.value);
                setSheet(i);
                load(wb, i, formatDates);
              }}
            >
              {wb.sheets.map((s, i) => (
                <option key={i} value={i}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <Choice
            label="出力の形式"
            value={out}
            onChange={setOut}
            options={[
              ["csv", "CSV"],
              ["json", "JSON"],
            ]}
          />
          {out === "csv" ? (
            <Choice
              label="文字コード"
              value={enc}
              onChange={setEnc}
              options={[
                ["UTF8BOM", "UTF-8（BOM付き・Excel向け）"],
                ["UTF8", "UTF-8"],
                ["SJIS", "Shift_JIS"],
              ]}
            />
          ) : (
            <Check label="1行目を見出し（キー）にする" checked={header} onChange={setHeader} />
          )}
          <Check
            label="日付の書式のセルを 2024-01-31 の形にする"
            checked={formatDates}
            onChange={(v) => {
              setFormatDates(v);
              load(wb, sheet, v);
            }}
          />
        </div>
      )}
      {rows && (
        <>
          <p className="text-sm text-muted">
            {rows.length}行・{Math.max(0, ...rows.map((r) => r.length))}列{rows.length > PREVIEW_ROWS ? `（先頭の${PREVIEW_ROWS}行を表示）` : ""}
          </p>
          <Preview rows={rows} />
        </>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} disabled={!rows?.length} onClick={save}>
          {out === "csv" ? "CSVで保存" : "JSONで保存"}
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {msg}
        </span>
      </div>
      <p className={ui.note}>
        セルに表示されている書式ではなく、入っている値を書き出します（数式は計算結果の値になります）。日付の書式のセルは、オフにすると Excel の日付の数値（シリアル値）のままになります。結合したセルの値は左上のセルにだけ入ります。古い .xls 形式には対応していません。
      </p>
    </div>
  );
}

function ToXlsx() {
  const [text, setText] = useState("");
  const [name, setName] = useState("data");
  const [numbers, setNumbers] = useState(true);
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
  const rows = text.trim() ? parseCsv(text, detectDelimiter(text)).filter((r) => !(r.length === 1 && r[0] === "")) : [];
  const save = async () => {
    try {
      const bytes = await buildXlsx(rows, name, { numbers });
      saveBlob(`${name}.xlsx`, new Blob([bytes as BlobPart], { type: XLSX_MIME }));
      setMsg("保存しました");
    } catch (e) {
      setMsg(`作成できませんでした：${(e as Error).message}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="CSVファイル" accept=".csv,.tsv,.txt,text/csv,text/plain" onFiles={open} hint="UTF-8・Shift_JIS を自動で見分けます。下の欄に貼り付けても使えます" />
      <Field label="CSV（カンマ・タブ区切りを自動で判定）">
        <textarea className={`${ui.input} min-h-48 font-mono text-sm`} value={text} spellCheck={false} placeholder={"名前,点数\n山田,80\n佐藤,92"} onChange={(e) => setText(e.target.value)} />
      </Field>
      <Check label="数値に見える欄は数値として入れる（0で始まる番号は文字のまま）" checked={numbers} onChange={setNumbers} />
      {rows.length > 0 && <Preview rows={rows} />}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} disabled={!rows.length} onClick={save}>
          xlsxで保存
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {msg}
        </span>
      </div>
      <p className={ui.note}>1つのシートだけの、書式のないシンプルな .xlsx を作ります。日付や「1/2」のような値は文字として入ります。</p>
    </div>
  );
}

/** Excel・CSV変換（xlsx → CSV・JSON、CSV → xlsx） */
export function ExcelCsvConverter() {
  const [mode, setMode] = useState<"from" | "to">("from");
  return (
    <div className="flex flex-col gap-4">
      <div role="radiogroup" aria-label="変換の向き" className="flex flex-wrap gap-2">
        {(
          [
            ["from", "Excel → CSV・JSON"],
            ["to", "CSV → Excel"],
          ] as const
        ).map(([v, l]) => (
          <button key={v} type="button" role="radio" aria-checked={mode === v} className={mode === v ? ui.buttonPrimary : ui.button} onClick={() => setMode(v)}>
            {l}
          </button>
        ))}
      </div>
      {mode === "from" ? <FromXlsx /> : <ToXlsx />}
      <p className={ui.note}>ファイルはサーバーに送らず、この端末の中だけで変換します。</p>
    </div>
  );
}
