"use client";

import { useState, type ReactNode } from "react";
import { FileDrop } from "@/components/FileDrop";
import { Check, Choice } from "@/components/TextTransform";
import { Field, FieldGrid, Stats } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { formatBytes, saveBlob, saveZip } from "@/lib/files";
import { decodeText, encodeText, ENCODING_LABEL, type SourceEncoding } from "../data/charset/logic";
import { DEFAULT_RULES, mergedFileName, mergeTexts, renameAll, type CaseMode, type DateFormat, type Position, type RenameRules, type Separator } from "./logic";

let nextId = 1;

/** 並べ替え・削除ボタン付きの一覧 */
function OrderList<T extends { id: number }>({ items, onChange, render }: { items: T[]; onChange: (items: T[]) => void; render: (it: T, i: number) => ReactNode }) {
  const move = (i: number, d: number) => {
    const a = [...items];
    [a[i], a[i + d]] = [a[i + d], a[i]];
    onChange(a);
  };
  return (
    <ol className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel">
      {items.map((it, i) => (
        <li key={it.id} className="flex items-center gap-2 px-3 py-2">
          <span className="w-6 shrink-0 text-right font-mono text-xs text-muted">{i + 1}</span>
          <span className="flex min-w-0 flex-1 flex-col">{render(it, i)}</span>
          <button type="button" className={`${ui.button} px-2 py-1`} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`${i + 1}番目を上へ`}>
            ↑
          </button>
          <button type="button" className={`${ui.button} px-2 py-1`} disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label={`${i + 1}番目を下へ`}>
            ↓
          </button>
          <button type="button" className={`${ui.button} px-2 py-1`} onClick={() => onChange(items.filter((x) => x.id !== it.id))} aria-label={`${i + 1}番目を一覧から外す`}>
            ×
          </button>
        </li>
      ))}
    </ol>
  );
}

// ───────── テキストファイル結合 ─────────

type TextItem = { id: number; name: string; text: string; encoding: SourceEncoding; size: number };
type OutEnc = "UTF8BOM" | "UTF8" | "SJIS";

/** テキストファイル結合 */
export function TextFileMerge() {
  const [items, setItems] = useState<TextItem[]>([]);
  const [separator, setSeparator] = useState<Separator>("none");
  const [skipCsvHeader, setSkipCsvHeader] = useState(true);
  const [enc, setEnc] = useState<OutEnc>("UTF8");
  const [eol, setEol] = useState<"crlf" | "lf">("crlf");
  const [msg, setMsg] = useState("");

  const add = async (files: File[]) => {
    const added: TextItem[] = [];
    const skipped: string[] = [];
    for (const f of files) {
      const r = decodeText(new Uint8Array(await f.arrayBuffer()));
      if (r.encoding === "BINARY") skipped.push(f.name);
      else added.push({ id: nextId++, name: f.name, text: r.text, encoding: r.encoding, size: f.size });
    }
    // ファイル名の順（1, 2, 10 の順）で入れる。あとから並べ替えられる
    added.sort((a, b) => a.name.localeCompare(b.name, "ja", { numeric: true }));
    setItems((p) => [...p, ...added]);
    setMsg(skipped.length ? `テキストとして読めないため外しました：${skipped.join("、")}` : "");
  };

  const hasCsv = items.some((it) => /\.(csv|tsv)$/i.test(it.name));
  const merged = mergeTexts(items, { separator, skipCsvHeader: hasCsv && skipCsvHeader });
  const lines = merged ? merged.split("\n").length - 1 : 0;
  const save = () => {
    const r = encodeText(merged, enc, eol);
    saveBlob(mergedFileName(items.map((it) => it.name)), new Blob([r.bytes as BlobPart], { type: "text/plain" }));
    setMsg(r.lostChars.length ? `Shift_JISにない文字（${r.lostChars.slice(0, 10).join(" ")}）は「?」になりました。UTF-8で保存すると残せます` : "保存しました");
  };

  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="テキストファイル" accept=".txt,.csv,.tsv,.md,.log,.json,text/*" multiple onFiles={add} hint="UTF-8・Shift_JIS などの文字コードは自動で見分けます" />
      {items.length > 0 && (
        <OrderList
          items={items}
          onChange={setItems}
          render={(it) => (
            <>
              <span className="truncate text-sm">{it.name}</span>
              <span className="text-xs text-muted">
                {ENCODING_LABEL[it.encoding]}・{formatBytes(it.size)}
              </span>
            </>
          )}
        />
      )}
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <Choice
          label="ファイルの区切り"
          value={separator}
          onChange={setSeparator}
          options={[
            ["none", "なし（そのままつなぐ）"],
            ["blank", "空行を入れる"],
            ["header", "ファイル名の見出しを入れる"],
          ]}
        />
        <Choice
          label="保存する文字コード"
          value={enc}
          onChange={setEnc}
          options={[
            ["UTF8", "UTF-8"],
            ["UTF8BOM", "UTF-8（BOM付き・Excel向け）"],
            ["SJIS", "Shift_JIS"],
          ]}
        />
        <Choice
          label="改行コード"
          value={eol}
          onChange={setEol}
          options={[
            ["crlf", "CRLF（Windows）"],
            ["lf", "LF（Mac・Linux）"],
          ]}
        />
        {hasCsv && <Check label="2つ目以降のCSVの1行目（見出し）を除く" checked={skipCsvHeader} onChange={setSkipCsvHeader} />}
      </div>
      {items.length > 0 && (
        <>
          <Stats
            items={[
              { label: "ファイル数", value: `${items.length}個` },
              { label: "行数", value: `${lines.toLocaleString("ja-JP")}行` },
              { label: "文字数", value: `${[...merged].length.toLocaleString("ja-JP")}文字` },
            ]}
          />
          <Field label="結合した中身（先頭の部分）">
            <textarea className={`${ui.input} min-h-56 font-mono text-sm`} value={merged.slice(0, 20000)} readOnly />
          </Field>
        </>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} disabled={!items.length} onClick={save}>
          結合して保存
        </button>
        <button type="button" className={ui.button} disabled={!items.length} onClick={() => setItems([])}>
          すべて外す
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {msg}
        </span>
      </div>
      <p className={ui.note}>一覧の順（上から）につなげます。ファイルはサーバーに送らず、この端末の中だけで処理します。</p>
    </div>
  );
}

// ───────── ファイル名一括変更 ─────────

type RenameItem = { id: number; file: File };

/** ファイル名一括変更（新しい名前でZIPに入れて保存） */
export function BulkRename() {
  const [items, setItems] = useState<RenameItem[]>([]);
  const [rules, setRules] = useState<RenameRules>(DEFAULT_RULES);
  const [msg, setMsg] = useState("");
  const set = (patch: Partial<RenameRules>) => setRules((r) => ({ ...r, ...patch }));
  const setSeq = (patch: Partial<RenameRules["seq"]>) => setRules((r) => ({ ...r, seq: { ...r.seq, ...patch } }));
  const setDate = (patch: Partial<RenameRules["date"]>) => setRules((r) => ({ ...r, date: { ...r.date, ...patch } }));

  const add = (files: File[]) => setItems((p) => [...p, ...files.map((file) => ({ id: nextId++, file }))]);
  const sortBy = (key: "name" | "date") =>
    setItems((p) => [...p].sort((a, b) => (key === "name" ? a.file.name.localeCompare(b.file.name, "ja", { numeric: true }) : a.file.lastModified - b.file.lastModified)));

  const r = renameAll(
    items.map((it) => it.file),
    rules,
  );
  const ok = !("error" in r);
  const changed = ok ? r.names.filter((n, i) => n !== items[i].file.name).length : 0;
  const save = async () => {
    if (!ok) return;
    try {
      setMsg("ZIPを作成中…");
      await saveZip(
        "renamed_files.zip",
        items.map((it, i) => ({ name: r.names[i], data: it.file })),
      );
      setMsg(`${items.length}個のファイルを新しい名前でZIPに入れて保存しました`);
    } catch (e) {
      setMsg(`保存できませんでした：${(e as Error).message}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="ファイル" multiple onFiles={add} hint="どんな種類のファイルでも使えます" />
      <FieldGrid>
        <Field label="検索する文字">
          <input className={ui.input} value={rules.find} onChange={(e) => set({ find: e.target.value })} placeholder="例：IMG_" />
        </Field>
        <Field label="置き換える文字（空欄で削除）">
          <input className={ui.input} value={rules.replace} onChange={(e) => set({ replace: e.target.value })} placeholder="例：旅行_" />
        </Field>
        <Choice<CaseMode>
          label="大文字・小文字"
          value={rules.caseMode}
          onChange={(caseMode) => set({ caseMode })}
          options={[
            ["none", "そのまま"],
            ["lower", "小文字にする"],
            ["upper", "大文字にする"],
          ]}
        />
        <Field label="先頭に足す文字">
          <input className={ui.input} value={rules.prefix} onChange={(e) => set({ prefix: e.target.value })} />
        </Field>
        <Field label="末尾に足す文字（拡張子の前）">
          <input className={ui.input} value={rules.suffix} onChange={(e) => set({ suffix: e.target.value })} />
        </Field>
      </FieldGrid>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Check label="正規表現で検索する" checked={rules.regex} onChange={(regex) => set({ regex })} />
        <Check label="拡張子を変えない" checked={rules.keepExt} onChange={(keepExt) => set({ keepExt })} />
      </div>

      <fieldset className="flex flex-col gap-3 rounded-2xl border border-line p-3">
        <legend className="px-1 text-sm font-semibold">
          <Check label="連番をつける" checked={rules.seq.on} onChange={(on) => setSeq({ on })} />
        </legend>
        {rules.seq.on && (
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
            <Field label="開始番号">
              <input type="number" inputMode="numeric" className={`${ui.input} w-24`} value={rules.seq.start} onChange={(e) => setSeq({ start: Math.trunc(Number(e.target.value) || 0) })} />
            </Field>
            <Field label="桁数（0で埋める）">
              <input type="number" inputMode="numeric" min={1} max={10} className={`${ui.input} w-24`} value={rules.seq.digits} onChange={(e) => setSeq({ digits: Math.min(10, Math.max(1, Math.trunc(Number(e.target.value) || 1))) })} />
            </Field>
            <Choice<Position | "replace">
              label="位置"
              value={rules.seq.position}
              onChange={(position) => setSeq({ position })}
              options={[
                ["before", "名前の前"],
                ["after", "名前の後"],
                ["replace", "名前を連番だけにする"],
              ]}
            />
            {rules.seq.position !== "replace" && (
              <Field label="区切り">
                <input className={`${ui.input} w-20`} value={rules.seq.sep} onChange={(e) => setSeq({ sep: e.target.value })} />
              </Field>
            )}
          </div>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-2xl border border-line p-3">
        <legend className="px-1 text-sm font-semibold">
          <Check label="更新日時をつける" checked={rules.date.on} onChange={(on) => setDate({ on })} />
        </legend>
        {rules.date.on && (
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
            <Choice<DateFormat>
              label="形式"
              value={rules.date.format}
              onChange={(format) => setDate({ format })}
              options={[
                ["YYYYMMDD", "20261019"],
                ["YYYY-MM-DD", "2026-10-19"],
                ["YYYYMMDD_HHmmss", "20261019_153000"],
              ]}
            />
            <Choice<Position>
              label="位置"
              value={rules.date.position}
              onChange={(position) => setDate({ position })}
              options={[
                ["before", "名前の前"],
                ["after", "名前の後"],
              ]}
            />
            <Field label="区切り">
              <input className={`${ui.input} w-20`} value={rules.date.sep} onChange={(e) => setDate({ sep: e.target.value })} />
            </Field>
          </div>
        )}
      </fieldset>

      {items.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={ui.button} onClick={() => sortBy("name")}>
              名前順に並べる
            </button>
            <button type="button" className={ui.button} onClick={() => sortBy("date")}>
              更新日時の古い順に並べる
            </button>
            <button type="button" className={ui.button} onClick={() => setItems([])}>
              すべて外す
            </button>
          </div>
          <div aria-live="polite">
            {!ok ? (
              <p className="text-sm text-warn">{r.error}</p>
            ) : (
              <>
                {r.duplicates.size > 0 && <p className="text-sm text-warn">同じ名前になるファイルが{r.duplicates.size}個あります。そのまま保存すると、2つ目以降の名前の末尾に「_2」などがつきます。</p>}
                {r.empty.size > 0 && <p className="text-sm text-warn">名前が空、または「.」で始まるファイルが{r.empty.size}個あります。</p>}
                <p className="text-sm text-muted">
                  {items.length}個中 {changed}個の名前が変わります
                </p>
              </>
            )}
          </div>
          <OrderList
            items={items}
            onChange={setItems}
            render={(it, i) => {
              const name = ok ? r.names[i] : it.file.name;
              const bad = ok && (r.duplicates.has(i) || r.empty.has(i));
              return (
                <>
                  <span className="truncate text-xs text-muted">{it.file.name}</span>
                  <span className={`truncate font-mono text-sm ${bad ? "text-warn" : ""}`}>→ {name}</span>
                </>
              );
            }}
          />
        </>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} disabled={!items.length || !ok} onClick={save}>
          新しい名前でZIPに保存
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {msg}
        </span>
      </div>
      <p className={ui.note}>
        ブラウザには端末のファイルの名前を直接変える機能がないため、新しい名前をつけたコピーをZIPにまとめて保存します（元のファイルはそのまま残ります）。変える順番は、置換 → 大文字・小文字 → 日付 → 連番 → 先頭・末尾の文字です。連番は一覧の上から順につきます。ファイル名に使えない記号（\ / : * ? &quot; &lt; &gt; |）は「_」に置き換えます。ファイルはサーバーに送らず、この端末の中だけで処理します。
      </p>
    </div>
  );
}
