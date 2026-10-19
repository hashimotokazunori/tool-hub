"use client";

import { useMemo, useState } from "react";
import { Check, Choice } from "@/components/TextTransform";
import { CopyButton, Field, FieldGrid, SavedNote, Stats } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { useClientValue } from "@/components/useClientValue";
import { useStoredState } from "@/components/useStoredState";
import { saveBlob } from "@/lib/files";
import {
  DUMMY_COLUMNS,
  MAIL_TEMPLATES,
  SNS_LIMITS,
  countForSns,
  fillMail,
  findHashtags,
  formatDummy,
  generateDummyRows,
  generateDummyText,
  graphemeCount,
  type DummyColumn,
  type DummyFormat,
  type DummyTextOptions,
  type MailFields,
} from "./logic";

/** 設定と「作り直した回数」が同じあいだは同じ結果を返す（乱数は端末の中で作る） */
function memo<T>() {
  const c = { key: "", value: undefined as T | undefined };
  return (key: string, make: () => T): T => {
    if (c.key !== key || c.value === undefined) {
      c.key = key;
      c.value = make();
    }
    return c.value;
  };
}
const rowsMemo = memo<ReturnType<typeof generateDummyRows>>();
const textMemo = memo<string>();
const fmt = (n: number) => n.toLocaleString("ja-JP");

/* ---------- ダミーデータ生成 ---------- */

const DEFAULT_COLS: DummyColumn[] = ["id", "name", "kana", "email", "phone", "zip", "prefecture", "birthday", "company"];
const MIME: Record<DummyFormat, string> = {
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  json: "application/json",
};

export function DummyData() {
  const [count, setCount] = useState(20);
  const [cols, setCols] = useState<DummyColumn[]>(DEFAULT_COLS);
  const [format, setFormat] = useState<DummyFormat>("csv");
  const [header, setHeader] = useState(true);
  const [round, setRound] = useState(0);
  const n = Math.min(1000, Math.max(1, Math.floor(count || 1)));
  const rows = useClientValue(() => rowsMemo(`${n}#${round}`, () => generateDummyRows(n)), null);
  const ordered = DEFAULT_COLS.filter((c) => cols.includes(c));
  const text = rows && ordered.length ? formatDummy(rows, ordered, format, header) : "";
  const toggle = (c: DummyColumn, on: boolean) => setCols((p) => (on ? [...p, c] : p.filter((x) => x !== c)));

  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Field label="件数（1〜1000）">
          <input
            className={ui.input}
            type="number"
            inputMode="numeric"
            min={1}
            max={1000}
            value={Number.isFinite(count) ? count : ""}
            onChange={(e) => setCount(e.target.value === "" ? Number.NaN : Number(e.target.value))}
          />
        </Field>
        <Choice<DummyFormat>
          label="出力形式"
          value={format}
          onChange={setFormat}
          options={[
            ["csv", "CSV（カンマ区切り）"],
            ["tsv", "TSV（タブ区切り・Excelに貼り付け向け）"],
            ["json", "JSON"],
          ]}
        />
      </FieldGrid>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-[13px] font-medium text-muted">入れる項目</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {DUMMY_COLUMNS.map((c) => (
            <Check key={c.key} label={c.label} checked={cols.includes(c.key)} onChange={(v) => toggle(c.key, v)} />
          ))}
        </div>
      </fieldset>
      {format !== "json" && <Check label="1行目に見出しを入れる" checked={header} onChange={setHeader} />}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={ui.buttonPrimary} onClick={() => setRound((r) => r + 1)}>
          作り直す
        </button>
        <CopyButton text={text} />
        <button
          type="button"
          className={ui.button}
          disabled={!text}
          onClick={() =>
            saveBlob(
              `dummy-data.${format}`,
              new Blob([format === "json" ? text : `﻿${text}`], {
                type: `${MIME[format]};charset=utf-8`,
              }),
            )
          }
        >
          ファイルで保存
        </button>
      </div>
      {!ordered.length ? (
        <p className="text-sm text-warn">入れる項目を1つ以上選んでください。</p>
      ) : (
        rows && (
          <>
            <p className="text-sm" aria-live="polite">
              {fmt(rows.length)} 件を作りました（表は最初の10件）。
            </p>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-field text-left text-xs text-muted">
                  <tr>
                    {ordered.map((c) => (
                      <th key={c} className="px-3 py-1.5 font-medium">
                        {DUMMY_COLUMNS.find((d) => d.key === c)!.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 10).map((r) => (
                    <tr key={r.id} className="border-t border-line">
                      {ordered.map((c) => (
                        <td key={c} className="px-3 py-1.5">
                          {r[c]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <label className={ui.label}>
              出力（{format.toUpperCase()}）
              <textarea className={`${ui.input} min-h-48 font-mono text-xs leading-relaxed`} value={text} readOnly />
            </label>
          </>
        )
      )}
      <p className={ui.note}>
        すべて架空のテスト用データです。氏名はよくある名字と名前をランダムに組み合わせたもので、実在の人物とは関係ありません。メールアドレスは例示用に予約されたドメイン（example.com・example.jp）、郵便番号は使われていない「000-」で始まる形、電話番号は真ん中を「0000」にした形だけの番号、会社名は「サンプル商事」のような架空の名前です。電話をかけたりメールを送ったりしないでください。乱数は端末の中で作り、どこにも送りません。CSV・TSVのファイルはExcelで文字化けしないようBOM付きのUTF-8で保存します。
      </p>
    </div>
  );
}

/* ---------- ダミー文章生成 ---------- */

const UNIT_LIMIT: Record<DummyTextOptions["unit"], number> = {
  chars: 20_000,
  sentences: 1000,
  paragraphs: 100,
};

export function DummyText() {
  const [o, setO] = useState<DummyTextOptions>({
    lang: "ja",
    unit: "chars",
    count: 200,
  });
  const [round, setRound] = useState(0);
  const text = useClientValue(() => textMemo(`${JSON.stringify(o)}#${round}`, () => generateDummyText(o)), "");
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Choice<DummyTextOptions["lang"]>
          label="種類"
          value={o.lang}
          onChange={(lang) => setO({ ...o, lang })}
          options={[
            ["ja", "日本語"],
            ["lorem", "Lorem ipsum（ラテン語風）"],
          ]}
        />
        <Choice<DummyTextOptions["unit"]>
          label="長さの決め方"
          value={o.unit}
          onChange={(unit) => setO({ ...o, unit })}
          options={[
            ["chars", "文字数"],
            ["sentences", "文の数"],
            ["paragraphs", "段落の数"],
          ]}
        />
        <Field label={`${o.unit === "chars" ? "文字数" : o.unit === "sentences" ? "文の数" : "段落の数"}（${fmt(UNIT_LIMIT[o.unit])}まで）`}>
          <input
            className={ui.input}
            type="number"
            inputMode="numeric"
            min={1}
            max={UNIT_LIMIT[o.unit]}
            value={Number.isFinite(o.count) ? o.count : ""}
            onChange={(e) =>
              setO({
                ...o,
                count: e.target.value === "" ? Number.NaN : Number(e.target.value),
              })
            }
          />
        </Field>
      </FieldGrid>
      <div className="flex flex-wrap gap-1.5">
        {(o.unit === "chars" ? [100, 200, 400, 800, 1000] : o.unit === "sentences" ? [3, 5, 10, 20] : [1, 2, 3, 5]).map((n) => (
          <button key={n} type="button" className={ui.chip} onClick={() => setO({ ...o, count: n })}>
            {fmt(n)}
            {o.unit === "chars" ? "字" : o.unit === "sentences" ? "文" : "段落"}
          </button>
        ))}
      </div>
      <label className={ui.label}>
        ダミー文章
        <textarea className={`${ui.input} min-h-56 leading-relaxed`} value={text} readOnly />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} onClick={() => setRound((r) => r + 1)}>
          作り直す
        </button>
        <CopyButton text={text} />
        <span className="text-xs text-muted" aria-live="polite">
          {fmt([...text.replace(/\n/g, "")].length)} 文字（改行を除く）
        </span>
      </div>
      <p className={ui.note}>
        日本語の文は、このサイトで用意した特に意味のない文をランダムに並べたものです。Lorem ipsum
        は印刷やデザインで昔から使われている、意味のないラテン語風の文です。「文字数」で作るときは指定した文字数ちょうどで切り、最後を句点にします。
      </p>
    </div>
  );
}

/* ---------- SNS投稿文字数チェック ---------- */

export function SnsCharacterCount() {
  const [text, setText, clear] = useStoredState("sns-character-count:text", "");
  const tags = useMemo(() => findHashtags(text), [text]);
  const counts = useMemo(() => SNS_LIMITS.map((s) => ({ ...s, count: countForSns(text, s.counter) })), [text]);
  return (
    <div className="flex flex-col gap-4">
      <label className={ui.label}>
        投稿する文章
        <textarea className={`${ui.input} min-h-48 leading-relaxed`} value={text} onChange={(e) => setText(e.target.value)} placeholder="ここに投稿文を入力するか、貼り付けてください。" />
      </label>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={text} label="文章をコピー" />
        <button type="button" className={ui.button} onClick={clear} disabled={!text}>
          消す
        </button>
      </div>
      <Stats
        items={[
          {
            label: "文字数（見た目の1文字を1）",
            value: graphemeCount(text),
            emphasis: true,
          },
          { label: "Xでの文字数（全角2・半角1）", value: counts[0].count },
          { label: "ハッシュタグ", value: `${tags.length} 個` },
          { label: "改行", value: (text.match(/\n/g) ?? []).length },
        ]}
      />
      <ul className="flex flex-col gap-3" aria-live="polite">
        {counts.map((s) => {
          const over = s.count > s.limit;
          return (
            <li key={s.id} className="flex flex-col gap-1.5 rounded-2xl border border-line bg-field/60 px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="font-semibold">{s.name}</span>
                <span className="text-sm tabular-nums">
                  {fmt(s.count)} / {fmt(s.limit)}
                  {over ? <b className="ml-2 text-warn">{fmt(s.count - s.limit)} 文字オーバー</b> : <span className="ml-2 text-muted">あと {fmt(s.limit - s.count)}</span>}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
                <div
                  className={`h-full ${over ? "bg-warn" : "bg-ok"}`}
                  style={{
                    width: `${Math.min(100, (s.count / s.limit) * 100)}%`,
                  }}
                />
              </div>
              <span className={ui.note}>{s.note}</span>
            </li>
          );
        })}
      </ul>
      {tags.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className={ui.h3}>ハッシュタグ（{tags.length} 個）</h3>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t, i) => (
              <span key={`${t}-${i}`} className="rounded-full bg-accent-soft px-3 py-1 text-sm">
                {t}
              </span>
            ))}
          </div>
          <CopyButton text={tags.join(" ")} label="ハッシュタグだけをコピー" />
        </div>
      )}
      <p className={ui.note}>
        上限は各サービスが案内している値をもとにした目安です。サービス側で変更されることがあるため、最新の上限は各アプリで確かめてください。Xは全角を2、半角を1、URLを23として数え、ほかのサービスは絵文字なども見た目の1文字を1として数えています（サービスによって絵文字の数え方が少し違うことがあります）。Instagramのハッシュタグは長く1投稿30個まででしたが、より少ない数に制限する変更が案内されています。
      </p>
      <SavedNote />
    </div>
  );
}

/* ---------- メール文面テンプレート ---------- */

const EMPTY_MAIL: MailFields = {
  company: "",
  name: "",
  myCompany: "",
  me: "",
  date: "",
  content: "",
};

export function EmailTemplates() {
  const [kind, setKind] = useStoredState("email-templates:kind", MAIL_TEMPLATES[0].id);
  const [f, setF, reset] = useStoredState<MailFields>("email-templates:fields", EMPTY_MAIL);
  const t = MAIL_TEMPLATES.find((x) => x.id === kind) ?? MAIL_TEMPLATES[0];
  const mail = fillMail(t, f);
  const set = (k: keyof MailFields) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="メールの種類">
        {MAIL_TEMPLATES.map((x) => (
          <button key={x.id} type="button" aria-pressed={x.id === t.id} className={x.id === t.id ? ui.buttonPrimary : ui.button} onClick={() => setKind(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <FieldGrid>
        <Field label="宛先の会社名">
          <input className={ui.input} value={f.company} onChange={set("company")} placeholder="例：〇〇株式会社" />
        </Field>
        <Field label="宛先の氏名（様は不要）">
          <input className={ui.input} value={f.name} onChange={set("name")} placeholder="例：山田 太郎" />
        </Field>
        <Field label="自分の会社名（任意）">
          <input className={ui.input} value={f.myCompany} onChange={set("myCompany")} />
        </Field>
        <Field label="自分の名前">
          <input className={ui.input} value={f.me} onChange={set("me")} />
        </Field>
        <Field label={t.dateLabel}>
          <input className={ui.input} type="date" value={f.date} onChange={set("date")} />
        </Field>
        <Field label={t.contentLabel}>
          <input className={ui.input} value={f.content} onChange={set("content")} />
        </Field>
      </FieldGrid>
      <label className={ui.label}>
        件名
        <input className={ui.input} value={mail.subject} readOnly />
      </label>
      <label className={ui.label}>
        本文
        <textarea className={`${ui.input} min-h-96 leading-relaxed`} value={mail.body} readOnly aria-live="polite" />
      </label>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={mail.body} label="本文をコピー" primary />
        <CopyButton text={mail.subject} label="件名をコピー" />
        <CopyButton text={`件名：${mail.subject}\n\n${mail.body}`} label="件名と本文をコピー" />
        <button type="button" className={ui.button} onClick={reset}>
          入力を消す
        </button>
      </div>
      <p className={ui.note}>
        入力していない欄は「〇〇」のまま残ります。コピーしたあと、メールソフトで内容に合わせて言葉を調整してください。社内向けのメールでは「お世話になっております」を「お疲れさまです」に変えるのが一般的です。
      </p>
      <SavedNote />
    </div>
  );
}
