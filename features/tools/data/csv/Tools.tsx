"use client";

import { useState, type ReactNode } from "react";
import { FileDrop } from "@/components/FileDrop";
import { Check, Choice } from "@/components/TextTransform";
import { CopyButton, Field, Stats } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { baseName, saveBlob } from "@/lib/files";
import { ENCODING_LABEL, decodeText, encodeText } from "../charset/logic";
import {
  DELIMITER_NAME,
  DELIMITER_OPTIONS,
  DIFF_LABEL,
  dedupeRows,
  diffTables,
  diffToRows,
  moveItem,
  pickColumns,
  readTable,
  withHeader,
  writeCsv,
  type AnyDelimiter,
  type ColumnPick,
  type DiffStatus,
  type Eol,
  type QuoteMode,
  type Table,
} from "./logic";

type OutEncoding = "UTF8BOM" | "UTF8" | "SJIS";
const OUT_ENCODINGS: [OutEncoding, string][] = [
  ["UTF8BOM", "UTF-8（BOM付き・Excel向け）"],
  ["UTF8", "UTF-8（BOMなし）"],
  ["SJIS", "Shift_JIS"],
];
const PREVIEW_LIMIT = 100;
const extFor = (d: string) => (d === "\t" ? "tsv" : d === "|" ? "txt" : "csv");

// ───────── 共通の部品 ─────────

/** CSVを読み込む欄（ファイル・貼り付け）。文字コードは自動で判定する */
function CsvInput({ label, value, onChange, onName, rows = "min-h-40" }: { label: string; value: string; onChange: (v: string) => void; onName?: (name: string) => void; rows?: string }) {
  const [msg, setMsg] = useState("");
  const open = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    const r = decodeText(new Uint8Array(await f.arrayBuffer()));
    if (r.encoding === "BINARY") return setMsg("テキストのファイルとして読めません");
    onChange(r.text);
    onName?.(baseName(f.name));
    setMsg(`${f.name} を読み込みました（${ENCODING_LABEL[r.encoding]}）`);
  };
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <FileDrop label={`${label}のファイル`} accept=".csv,.tsv,.txt,text/csv,text/plain" onFiles={open} hint="UTF-8・Shift_JIS を自動で見分けます" />
      <Field label={`${label}（貼り付けても使えます）`}>
        <textarea className={`${ui.input} ${rows} font-mono text-sm`} value={value} spellCheck={false} placeholder={"ID,名前,メール\n1,山田,yamada@example.com"} onChange={(e) => onChange(e.target.value)} />
      </Field>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted" aria-live="polite">
        <span>{msg}</span>
        {value && (
          <button
            type="button"
            className="underline hover:text-accent"
            onClick={() => {
              onChange("");
              setMsg("");
            }}
          >
            消す
          </button>
        )}
      </div>
    </div>
  );
}

/** 区切り文字と見出しの有無 */
function ReadOptions({ delimiter, setDelimiter, header, setHeader, detected }: { delimiter: AnyDelimiter | "auto"; setDelimiter: (d: AnyDelimiter | "auto") => void; header: boolean; setHeader: (v: boolean) => void; detected?: AnyDelimiter }) {
  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
      <Choice label="区切り文字" value={delimiter} onChange={setDelimiter} options={[["auto", detected && delimiter === "auto" ? `自動で判定（${DELIMITER_NAME[detected]}）` : "自動で判定"], ...DELIMITER_OPTIONS]} />
      <Check label="1行目は見出し" checked={header} onChange={setHeader} />
    </div>
  );
}

/** 表のプレビュー。cell で欄の中身や色を変えられる */
function PreviewTable({ headers, rows, caption, lead, cell }: { headers: string[]; rows: string[][]; caption: string; lead?: { title: string; values: ReactNode[] }; cell?: (row: number, col: number, value: string) => { node?: ReactNode; className?: string } }) {
  const shown = rows.slice(0, PREVIEW_LIMIT);
  return (
    <div className="flex flex-col gap-1">
      <div className="max-h-[28rem] overflow-auto rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-field text-xs text-muted">
            <tr>
              {lead && (
                <th scope="col" className="px-3 py-2 font-semibold whitespace-nowrap">
                  {lead.title}
                </th>
              )}
              {headers.map((h, i) => (
                <th key={i} scope="col" className="px-3 py-2 font-semibold whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, ri) => (
              <tr key={ri} className="border-t border-line align-top">
                {lead && <td className="px-3 py-1.5 whitespace-nowrap text-xs text-muted">{lead.values[ri]}</td>}
                {headers.map((_, ci) => {
                  const c = cell?.(ri, ci, r[ci] ?? "");
                  return (
                    <td key={ci} className={`max-w-64 px-3 py-1.5 break-words ${c?.className ?? ""}`}>
                      {c?.node ?? r[ci] ?? ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > PREVIEW_LIMIT && <p className="text-xs text-muted">先頭の{PREVIEW_LIMIT}行だけ表示しています（全{rows.length.toLocaleString()}行）。保存するファイルにはすべての行が入ります。</p>}
    </div>
  );
}

/** 保存のボタンと文字コードの選択 */
function SaveBar({ text, name, delimiter, label = "保存" }: { text: string; name: string; delimiter: string; label?: string }) {
  const [enc, setEnc] = useState<OutEncoding>("UTF8BOM");
  const [warn, setWarn] = useState("");
  const ext = extFor(delimiter);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <Choice label="保存する文字コード" value={enc} onChange={setEnc} options={OUT_ENCODINGS} />
        <button
          type="button"
          className={ui.buttonPrimary}
          disabled={!text}
          onClick={() => {
            const r = encodeText(text, enc, "keep");
            setWarn(r.lostChars.length ? `Shift_JISで表せない文字（${r.lostChars.slice(0, 10).join(" ")}${r.lostChars.length > 10 ? " …" : ""}）は「?」になりました。` : "");
            saveBlob(`${name}.${ext}`, new Blob([r.bytes as BlobPart], { type: `text/${ext === "tsv" ? "tab-separated-values" : ext === "csv" ? "csv" : "plain"}` }));
          }}
        >
          {label}（.{ext}）
        </button>
        <CopyButton text={text} label="コピー" />
      </div>
      {warn && (
        <p className="text-sm text-warn" role="alert">
          {warn}
        </p>
      )}
    </div>
  );
}

/** 見出しが変わったら選択を初期値に戻すための状態（useEffect を使わずに、見出しの並びで見分ける） */
function useKeyedState<T>(sig: string, initial: () => T): [T, (v: T) => void] {
  const [state, setState] = useState<{ sig: string; value: T } | null>(null);
  const value = state && state.sig === sig ? state.value : initial();
  return [value, (v: T) => setState({ sig, value: v })];
}

// ───────── CSVの重複行削除 ─────────

/** CSVの重複行削除 */
export function CsvDedupe() {
  const [text, setText] = useState("");
  const [name, setName] = useState("data");
  const [delimiter, setDelimiter] = useState<AnyDelimiter | "auto">("auto");
  const [header, setHeader] = useState(true);
  const [keep, setKeep] = useState<"first" | "last">("first");
  const [ignoreSpace, setIgnoreSpace] = useState(true);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWidth, setIgnoreWidth] = useState(false);
  const t = text.trim() ? readTable(text, delimiter, header) : null;
  const sig = t ? JSON.stringify(t.headers) : "";
  const [keys, setKeys] = useKeyedState<number[]>(sig, () => []);
  const r = t ? dedupeRows(t.rows, { keys: keys.length ? keys : null, keep, ignoreCase, ignoreSpace, ignoreWidth }) : null;
  const out = t && r ? writeCsv(withHeader(t, r.kept), t.delimiter) : "";
  const offset = t?.headerRow ? 2 : 1;

  return (
    <div className="flex flex-col gap-4">
      <CsvInput label="CSV" value={text} onChange={setText} onName={setName} />
      <ReadOptions delimiter={delimiter} setDelimiter={setDelimiter} header={header} setHeader={setHeader} detected={t?.delimiter} />
      {t && r && (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-bold">重複を見分ける列（選ばなければ行全体で比べます）</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {t.headers.map((h, i) => (
                <Check key={i} label={h} checked={keys.includes(i)} onChange={(on) => setKeys(on ? [...keys, i].sort((a, b) => a - b) : keys.filter((k) => k !== i))} />
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
            <Choice
              label="残す行"
              value={keep}
              onChange={setKeep}
              options={[
                ["first", "最初に出てきた行"],
                ["last", "最後に出てきた行"],
              ]}
            />
            <Check label="前後・連続の空白を無視" checked={ignoreSpace} onChange={setIgnoreSpace} />
            <Check label="大文字・小文字を区別しない" checked={ignoreCase} onChange={setIgnoreCase} />
            <Check label="全角・半角を区別しない" checked={ignoreWidth} onChange={setIgnoreWidth} />
          </div>
          <Stats
            items={[
              { label: "元の行数", value: `${t.rows.length.toLocaleString()} 行` },
              { label: "残った行数", value: `${r.kept.length.toLocaleString()} 行`, emphasis: true },
              { label: "削除した行数", value: `${r.removed.length.toLocaleString()} 行` },
              { label: "重複していたグループ", value: `${r.duplicateGroups.toLocaleString()} 組` },
            ]}
          />
          <SaveBar text={out} name={`${name}_重複削除`} delimiter={t.delimiter} label="重複を除いて保存" />
          <section className="flex flex-col gap-2">
            <h3 className={ui.h3}>残った行</h3>
            <PreviewTable headers={t.headers} rows={r.kept} caption="重複を除いたあとの行" />
          </section>
          {r.removed.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className={ui.h3}>削除した行</h3>
              <PreviewTable headers={t.headers} rows={r.removed.map((i) => t.rows[i])} caption="削除した行" lead={{ title: "元の行", values: r.removed.map((i) => `${i + offset}行目`) }} />
            </section>
          )}
        </>
      )}
      <p className={ui.note}>見出し行は比べる対象に含めません。「元の行」はファイルの何行目かを表します（空行は数えません）。データはこの端末の中だけで処理します。</p>
    </div>
  );
}

// ───────── CSV列の抽出 ─────────

/** CSV列の抽出・並べ替え */
export function CsvColumns() {
  const [text, setText] = useState("");
  const [name, setName] = useState("data");
  const [delimiter, setDelimiter] = useState<AnyDelimiter | "auto">("auto");
  const [header, setHeader] = useState(true);
  const t = text.trim() ? readTable(text, delimiter, header) : null;
  const sig = t ? JSON.stringify(t.headers) : "";
  const [picks, setPicks] = useKeyedState<ColumnPick[]>(sig, () => (t ? t.headers.map((_, index) => ({ index, name: "" })) : []));
  const rows = t ? pickColumns(t, picks) : [];
  const out = t && picks.length ? writeCsv(rows, t.delimiter) : "";
  const outHeaders = t ? (t.headerRow ? rows[0] ?? [] : picks.map((p) => t.headers[p.index])) : [];

  return (
    <div className="flex flex-col gap-4">
      <CsvInput label="CSV" value={text} onChange={setText} onName={setName} />
      <ReadOptions delimiter={delimiter} setDelimiter={setDelimiter} header={header} setHeader={setHeader} detected={t?.delimiter} />
      {t && (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-bold">残す列</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {t.headers.map((h, i) => (
                <Check key={i} label={h} checked={picks.some((p) => p.index === i)} onChange={(on) => setPicks(on ? [...picks, { index: i, name: "" }] : picks.filter((p) => p.index !== i))} />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={ui.button} onClick={() => setPicks(t.headers.map((_, index) => ({ index, name: "" })))}>
                すべて選ぶ
              </button>
              <button type="button" className={ui.button} onClick={() => setPicks([])}>
                すべて外す
              </button>
            </div>
          </fieldset>
          {picks.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className={ui.h3}>並び順と列名</h3>
              <ol className="flex flex-col gap-2">
                {picks.map((p, i) => (
                  <li key={p.index} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-field/40 px-3 py-2">
                    <span className="w-6 text-right text-xs text-muted tabular-nums">{i + 1}</span>
                    <span className="min-w-20 flex-1 truncate text-sm font-semibold">{t.headers[p.index]}</span>
                    {t.headerRow && (
                      <input
                        className={`${ui.input} w-40 flex-none py-1.5 text-sm`}
                        aria-label={`${t.headers[p.index]}の新しい列名`}
                        placeholder="新しい列名（任意）"
                        value={p.name}
                        onChange={(e) => setPicks(picks.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                      />
                    )}
                    <span className="flex gap-1">
                      <button type="button" className={`${ui.button} px-2.5`} disabled={i === 0} aria-label={`${t.headers[p.index]}を上へ`} onClick={() => setPicks(moveItem(picks, i, -1))}>
                        ↑
                      </button>
                      <button type="button" className={`${ui.button} px-2.5`} disabled={i === picks.length - 1} aria-label={`${t.headers[p.index]}を下へ`} onClick={() => setPicks(moveItem(picks, i, 1))}>
                        ↓
                      </button>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <p className="text-sm text-muted" aria-live="polite">
            {t.width}列のうち{picks.length}列・{t.rows.length.toLocaleString()}行
          </p>
          <SaveBar text={out} name={`${name}_列抽出`} delimiter={t.delimiter} />
          {picks.length > 0 && <PreviewTable headers={outHeaders} rows={t.headerRow ? rows.slice(1) : rows} caption="取り出した列のプレビュー" />}
        </>
      )}
      <p className={ui.note}>列を選んだ順に並びます。↑↓で順番を変えられます。列名を空欄にすると元の見出しのままです。データはこの端末の中だけで処理します。</p>
    </div>
  );
}

// ───────── CSV区切り文字変換 ─────────

/** CSV区切り文字変換 */
export function CsvDelimiter() {
  const [text, setText] = useState("");
  const [name, setName] = useState("data");
  const [from, setFrom] = useState<AnyDelimiter | "auto">("auto");
  const [to, setTo] = useState<AnyDelimiter>("\t");
  const [quote, setQuote] = useState<QuoteMode>("minimal");
  const [eol, setEol] = useState<Eol>("crlf");
  const t = text.trim() ? readTable(text, from, false) : null;
  const out = t ? writeCsv(t.rows, to, { quote, eol }) : "";
  return (
    <div className="flex flex-col gap-4">
      <CsvInput label="変換前" value={text} onChange={setText} onName={setName} />
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <Choice label="変換前の区切り" value={from} onChange={setFrom} options={[["auto", t && from === "auto" ? `自動で判定（${DELIMITER_NAME[t.delimiter]}）` : "自動で判定"], ...DELIMITER_OPTIONS]} />
        <Choice label="変換後の区切り" value={to} onChange={setTo} options={DELIMITER_OPTIONS} />
        <Choice
          label={'「"」で囲む欄'}
          value={quote}
          onChange={setQuote}
          options={[
            ["minimal", "必要な欄だけ"],
            ["all", "すべての欄"],
          ]}
        />
        <Choice
          label="改行コード"
          value={eol}
          onChange={setEol}
          options={[
            ["crlf", "CRLF（Windows・Excel）"],
            ["lf", "LF（Mac・Linux）"],
          ]}
        />
      </div>
      <Field label="変換後">
        <textarea className={`${ui.input} min-h-40 font-mono text-sm`} value={out} readOnly />
      </Field>
      {t && (
        <p className="text-sm text-muted" aria-live="polite">
          {t.rows.length.toLocaleString()}行・{t.width}列を{DELIMITER_NAME[t.delimiter]}区切りから{DELIMITER_NAME[to]}区切りにしました
        </p>
      )}
      <SaveBar text={out} name={name} delimiter={to} />
      <p className={ui.note}>
        {`「必要な欄だけ」では、区切り文字・「"」・改行・前後の空白を含む欄だけを「"」で囲みます。欄の中の「"」は「""」にします。列の数が足りない行は空欄で埋めます。データはこの端末の中だけで変換します。`}
      </p>
    </div>
  );
}

// ───────── CSV比較 ─────────

const STATUS_STYLE: Record<DiffStatus, string> = {
  added: "text-ok font-semibold",
  removed: "text-warn font-semibold",
  changed: "text-accent font-semibold",
  same: "text-muted",
};

/** CSV比較（差分） */
export function CsvDiff() {
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [delimiter, setDelimiter] = useState<AnyDelimiter | "auto">("auto");
  const [header, setHeader] = useState(true);
  const [ignoreSpace, setIgnoreSpace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [showSame, setShowSame] = useState(false);
  const [keyChoice, setKeyChoice] = useState<string | null>(null);
  const a: Table | null = textA.trim() ? readTable(textA, delimiter, header) : null;
  const b: Table | null = textB.trim() ? readTable(textB, delimiter, header) : null;
  const commonCols = a && b ? a.headers.filter((h) => b.headers.includes(h)) : [];
  const key = keyChoice === "" ? null : keyChoice !== null && commonCols.includes(keyChoice) ? keyChoice : (commonCols[0] ?? null);
  const d = a && b ? diffTables(a, b, key, { ignoreSpace, ignoreCase }) : null;
  const shown = d ? d.rows.filter((r) => showSame || r.status !== "same") : [];
  const out = d ? writeCsv(diffToRows(d), ",") : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <CsvInput label="比較元（古いほう）" value={textA} onChange={setTextA} rows="min-h-32" />
        <CsvInput label="比較先（新しいほう）" value={textB} onChange={setTextB} rows="min-h-32" />
      </div>
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <ReadOptions delimiter={delimiter} setDelimiter={setDelimiter} header={header} setHeader={setHeader} />
        {d && (
          <Choice
            label="行を対応させる列（キー）"
            value={key ?? ""}
            onChange={(v) => setKeyChoice(v)}
            options={[...commonCols.map((c) => [c, c] as [string, string]), ["", "キーなし（行全体で比べる）"]]}
          />
        )}
        <Check label="前後・連続の空白を無視" checked={ignoreSpace} onChange={setIgnoreSpace} />
        <Check label="大文字・小文字を区別しない" checked={ignoreCase} onChange={setIgnoreCase} />
      </div>
      {d && (
        <>
          <Stats
            items={[
              { label: "追加", value: `${d.counts.added.toLocaleString()} 行`, emphasis: true },
              { label: "削除", value: `${d.counts.removed.toLocaleString()} 行`, emphasis: true },
              { label: "変更", value: `${d.counts.changed.toLocaleString()} 行`, emphasis: true },
              { label: "同じ", value: `${d.counts.same.toLocaleString()} 行` },
            ]}
          />
          {(d.onlyA.length > 0 || d.onlyB.length > 0 || d.duplicateKeys > 0) && (
            <ul className="flex flex-col gap-1 text-sm text-warn" role="status">
              {d.onlyA.length > 0 && <li>比較元にだけある列：{d.onlyA.join("・")}（比べる対象から外しました）</li>}
              {d.onlyB.length > 0 && <li>比較先にだけある列：{d.onlyB.join("・")}（比べる対象から外しました）</li>}
              {d.duplicateKeys > 0 && <li>キーが重複している行が{d.duplicateKeys}行あります。それぞれ最初の行だけを比べました。</li>}
            </ul>
          )}
          <Check label="同じ行も表示する" checked={showSame} onChange={setShowSame} />
          {shown.length ? (
            <PreviewTable
              headers={d.columns}
              rows={shown.map((r) => r.after ?? r.before ?? [])}
              caption="比較の結果"
              lead={{ title: "差分", values: shown.map((r) => <span key={0} className={STATUS_STYLE[r.status]}>{DIFF_LABEL[r.status]}</span>) }}
              cell={(ri, ci, value) => {
                const r = shown[ri];
                if (r.status === "added") return { className: "bg-ok/10" };
                if (r.status === "removed") return { className: "bg-warn/10 line-through decoration-warn/60" };
                if (r.status === "changed" && r.changed.includes(ci))
                  return {
                    className: "bg-accent-soft",
                    node: (
                      <>
                        <del className="block text-xs text-muted">{r.before![ci] || "（空欄）"}</del>
                        <ins className="block font-semibold no-underline">{value || "（空欄）"}</ins>
                      </>
                    ),
                  };
                return {};
              }}
            />
          ) : (
            <p className="text-sm text-muted">違いはありません。</p>
          )}
          <SaveBar text={out} name="csv_diff" delimiter="," label="差分を保存" />
        </>
      )}
      <p className={ui.note}>
        列は見出しの名前で合わせます（見出しなしのときは列の位置）。キーを選ぶと、キーの値が同じ行どうしを比べて、変わった欄を色付きで表示します。キーなしでは、片方にしかない行を「追加」「削除」として数えます。保存するCSVでは、変更は「変更前」「変更後」の2行になります。データはこの端末の中だけで処理します。
      </p>
    </div>
  );
}
