"use client";

import { useMemo, useState } from "react";
import { Check, Choice } from "@/components/TextTransform";
import { CopyButton, Field, FieldGrid, SavedNote } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { useClientValue } from "@/components/useClientValue";
import { useStoredState } from "@/components/useStoredState";
import { toYmd } from "@/lib/date";
import { saveBlob } from "@/lib/files";
import { EMPTY_MINUTES, PLANNER_CITIES, minutesMarkdown, minutesText, planMeeting, type ActionItem, type Minutes, type Participant, type PlannerCell } from "./logic";

/* ---------- 議事録テンプレート ---------- */

export function MeetingMinutes() {
  const [m, setM, reset] = useStoredState<Minutes>("meeting-minutes:draft", EMPTY_MINUTES);
  const [format, setFormat] = useStoredState<"text" | "md">("meeting-minutes:format", "text");
  const set = (k: Exclude<keyof Minutes, "actions">) => (e: { target: { value: string } }) => setM((p) => ({ ...p, [k]: e.target.value }));
  const setAction = (i: number, k: keyof ActionItem, v: string) =>
    setM((p) => ({
      ...p,
      actions: p.actions.map((a, j) => (j === i ? { ...a, [k]: v } : a)),
    }));
  const output = format === "md" ? minutesMarkdown(m) : minutesText(m);
  const fileBase = `議事録_${(m.title.trim() || "会議").replace(/[\\/:*?"<>|\s]+/g, "_")}${m.datetime ? `_${m.datetime.slice(0, 10)}` : ""}`;
  const area = (label: string, k: "agenda" | "discussion" | "decisions" | "attendees", placeholder: string) => (
    <label className={ui.label}>
      {label}
      <textarea className={`${ui.input} min-h-24 leading-relaxed`} value={m[k]} onChange={set(k)} placeholder={placeholder} />
    </label>
  );

  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Field label="会議名">
          <input className={ui.input} value={m.title} onChange={set("title")} placeholder="例：定例ミーティング" />
        </Field>
        <Field label="日時（開始）">
          <input className={ui.input} type="datetime-local" value={m.datetime} onChange={set("datetime")} />
        </Field>
        <Field label="終了時刻（任意）">
          <input className={ui.input} type="time" value={m.endTime} onChange={set("endTime")} />
        </Field>
        <Field label="場所">
          <input className={ui.input} value={m.place} onChange={set("place")} placeholder="例：第1会議室／オンライン" />
        </Field>
        <Field label="記録者（任意）">
          <input className={ui.input} value={m.author} onChange={set("author")} />
        </Field>
      </FieldGrid>
      {area("出席者（改行か「、」で区切る）", "attendees", "山田、佐藤、鈴木")}
      <div className="grid gap-3 md:grid-cols-2">
        {area("議題（1行に1つ）", "agenda", "来期の予算について\n新サービスの進め方")}
        {area("内容・議論（1行に1つ・任意）", "discussion", "予算案Aと案Bを比較した")}
        {area("決定事項（1行に1つ）", "decisions", "予算は案Aで進める")}
        <label className={ui.label}>
          次回予定
          <textarea className={`${ui.input} min-h-24 leading-relaxed`} value={m.next} onChange={set("next")} placeholder="例：11月2日（月）14:00〜 第1会議室" />
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${ui.h3} mb-2`}>宿題（担当・内容・期限）</legend>
        {m.actions.map((a, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 rounded-2xl border border-line p-3 sm:grid-cols-[8rem_1fr_10rem_auto] sm:items-end sm:border-0 sm:p-0">
            <Field label="担当">
              <input className={ui.input} value={a.who} onChange={(e) => setAction(i, "who", e.target.value)} />
            </Field>
            <Field label="内容">
              <input className={ui.input} value={a.what} onChange={(e) => setAction(i, "what", e.target.value)} />
            </Field>
            <Field label="期限">
              <input className={ui.input} type="date" value={a.due} onChange={(e) => setAction(i, "due", e.target.value)} />
            </Field>
            <button
              type="button"
              className={ui.button}
              aria-label={`宿題の${i + 1}行目を消す`}
              onClick={() =>
                setM((p) => ({
                  ...p,
                  actions: p.actions.filter((_, j) => j !== i),
                }))
              }
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className={`${ui.button} w-fit`}
          onClick={() =>
            setM((p) => ({
              ...p,
              actions: [...p.actions, { who: "", what: "", due: "" }],
            }))
          }
        >
          宿題の行を追加
        </button>
      </fieldset>

      <div className="flex flex-wrap items-end gap-3">
        <Choice
          label="出力の形式"
          value={format}
          onChange={setFormat}
          options={[
            ["text", "テキスト（メール・チャット向け）"],
            ["md", "Markdown"],
          ]}
        />
      </div>
      <label className={ui.label}>
        できあがった議事録
        <textarea className={`${ui.input} min-h-80 font-mono text-sm leading-relaxed`} value={output} readOnly aria-live="polite" />
      </label>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={output} label="議事録をコピー" primary />
        <button type="button" className={ui.button} onClick={() => saveBlob(`${fileBase}.txt`, new Blob([minutesText(m)], { type: "text/plain;charset=utf-8" }))}>
          テキスト（.txt）で保存
        </button>
        <button
          type="button"
          className={ui.button}
          onClick={() =>
            saveBlob(
              `${fileBase}.md`,
              new Blob([minutesMarkdown(m)], {
                type: "text/markdown;charset=utf-8",
              }),
            )
          }
        >
          Markdown（.md）で保存
        </button>
        <button type="button" className={ui.button} onClick={reset}>
          消す
        </button>
      </div>
      <p className={ui.note}>空の欄は議事録に入りません。議題・決定事項は1行に1つずつ書くと、箇条書きになります（行の先頭の「・」や「1.」は自動で整えます）。</p>
      <SavedNote />
    </div>
  );
}

/* ---------- 時差を考慮した会議時間 ---------- */

const DEFAULT_PEOPLE: Participant[] = [
  { zone: "Asia/Tokyo", label: "東京", start: 9, end: 18 },
  { zone: "America/New_York", label: "ニューヨーク", start: 9, end: 18 },
  { zone: "Europe/London", label: "ロンドン", start: 9, end: 18 },
];
const HOURS = Array.from({ length: 25 }, (_, h) => [String(h), `${h}時`] as [string, string]);
const LENGTHS: [string, string][] = [
  ["30", "30分"],
  ["60", "1時間"],
  ["90", "1時間30分"],
  ["120", "2時間"],
];
const dayMark = (c: PlannerCell) => (c.dayDiff > 0 ? "翌日" : c.dayDiff < 0 ? "前日" : "");

export function MeetingPlanner() {
  const today = useClientValue(() => toYmd(new Date()), "");
  const [people, setPeople, reset] = useStoredState<Participant[]>("meeting-planner:people", DEFAULT_PEOPLE);
  const [dateIn, setDate] = useState("");
  const [length, setLength] = useStoredState("meeting-planner:length", "60");
  const [skipWeekend, setSkipWeekend] = useStoredState("meeting-planner:skipWeekend", true);
  const [onlyOk, setOnlyOk] = useState(false);
  const date = dateIn || today;
  const slots = useMemo(() => (date ? planMeeting(date, people, Number(length), skipWeekend) : []), [date, people, length, skipWeekend]);
  const good = slots.filter((s) => s.allOk);
  const update = (i: number, patch: Partial<Participant>) => setPeople((p) => p.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const summary = good.map((s) => s.cells.map((c, i) => `${people[i].label} ${c.time}${dayMark(c) ? `（${dayMark(c)}）` : ""}`).join(" / ")).join("\n");

  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Field label="日付（いちばん上の場所の日付）">
          <input className={ui.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Choice label="会議の長さ" value={length} onChange={setLength} options={LENGTHS} />
      </FieldGrid>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${ui.h3} mb-2`}>参加する場所と業務時間</legend>
        {people.map((p, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 rounded-2xl border border-line p-3 sm:grid-cols-[1fr_7rem_7rem_auto] sm:items-end sm:border-0 sm:p-0">
            <label className={`${ui.label} col-span-2 sm:col-span-1`}>
              {i === 0 ? "場所（基準）" : `場所 ${i + 1}`}
              <select
                className={ui.input}
                value={p.zone}
                onChange={(e) => {
                  const city = PLANNER_CITIES.find((c) => c.zone === e.target.value);
                  update(i, {
                    zone: e.target.value,
                    label: city?.name ?? e.target.value,
                  });
                }}
              >
                {PLANNER_CITIES.map((c) => (
                  <option key={c.zone} value={c.zone}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <Choice label="始業" value={String(p.start)} onChange={(v) => update(i, { start: Number(v) })} options={HOURS.slice(0, 24)} />
            <Choice label="終業" value={String(p.end)} onChange={(v) => update(i, { end: Number(v) })} options={HOURS} />
            <button
              type="button"
              className={`${ui.button} col-span-2 sm:col-span-1`}
              disabled={people.length <= 1}
              aria-label={`${p.label}を消す`}
              onClick={() => setPeople((x) => x.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={ui.button}
            disabled={people.length >= 8}
            onClick={() =>
              setPeople((x) => [
                ...x,
                {
                  zone: "Asia/Singapore",
                  label: "シンガポール",
                  start: 9,
                  end: 18,
                },
              ])
            }
          >
            場所を追加
          </button>
          <button type="button" className={ui.button} onClick={reset}>
            最初の状態に戻す
          </button>
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Check label="土日は業務時間外にする" checked={skipWeekend} onChange={setSkipWeekend} />
        <Check label="全員が業務時間内の時間だけ表示" checked={onlyOk} onChange={setOnlyOk} />
      </div>

      <p className={`rounded-2xl border px-4 py-3 text-sm ${good.length ? "border-accent/30 bg-accent-soft" : "border-warn/40 text-warn"}`} aria-live="polite">
        {!date
          ? "日付を選んでください。"
          : good.length
            ? `全員の業務時間に収まる開始時刻は ${good.length} 個あります（色付きの行）。`
            : "この日は、全員の業務時間に収まる時間がありません。業務時間や日付を見直してください。"}
      </p>

      {slots.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm whitespace-nowrap tabular-nums">
            <thead className="bg-field text-left text-xs text-muted">
              <tr>
                {people.map((p, i) => (
                  <th key={i} className="px-3 py-1.5 font-medium">
                    {p.label}
                    <span className="ml-1 font-normal">{slots[0].cells[i].offsetLabel}</span>
                  </th>
                ))}
                <th className="px-3 py-1.5 font-medium">判定</th>
              </tr>
            </thead>
            <tbody>
              {slots
                .filter((s) => !onlyOk || s.allOk)
                .map((s) => (
                  <tr key={s.epoch} className={`border-t border-line ${s.allOk ? "bg-accent-soft font-semibold" : ""}`}>
                    {s.cells.map((c, i) => (
                      <td key={i} className={`px-3 py-1.5 ${c.inHours ? "" : "text-muted"}`}>
                        <span className={`inline-block h-2 w-2 rounded-full align-middle ${c.inHours ? "bg-ok" : "bg-line"}`} aria-hidden="true" />
                        <span className="ml-1.5">{c.time}</span>
                        <span className="ml-1 text-xs text-muted">
                          {c.weekday}
                          {dayMark(c) && `・${dayMark(c)}`}
                        </span>
                      </td>
                    ))}
                    <td className="px-3 py-1.5">{s.allOk ? "◎ 全員OK" : `${s.cells.filter((c) => c.inHours).length}/${s.cells.length}人`}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
      {good.length > 0 && <CopyButton text={summary} label="候補の時刻をコピー" />}
      <p className={ui.note}>
        いちばん上の場所の日付の0時〜23時を1時間ごとに並べ、ほかの場所の現地時刻を表示しています。夏時間（サマータイム）はブラウザのタイムゾーン情報で自動で反映します。会議の開始から終了までが業務時間に収まるときに「業務時間内」とし、終業より始業が遅いと夜勤（日をまたぐ）として扱います。祝日は考慮していません。
      </p>
      <SavedNote />
    </div>
  );
}
