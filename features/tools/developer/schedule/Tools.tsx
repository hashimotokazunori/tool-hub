"use client";

import { useMemo, useState } from "react";
import { Choice } from "@/components/TextTransform";
import { CopyButton, Field, FieldGrid, SavedNote, Stats } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { useClientValue } from "@/components/useClientValue";
import { useStoredState } from "@/components/useStoredState";
import { WEEKDAYS } from "@/lib/date";
import { CRON_EXAMPLES, CRON_FIELDS, UNIT_LABELS, convertTime, describeCron, describeField, formatHms, formatJa, nextRuns, parseCron, parseDuration, sumDurations, type TimeUnit } from "./logic";

const fmt = (x: number, d = 6) => (Number.isFinite(x) ? x.toLocaleString("ja-JP", { maximumFractionDigits: d }) : "—");
const UNITS = Object.entries(UNIT_LABELS) as [TimeUnit, string][];

/* ---------- 時間・分・秒変換 ---------- */

export function TimeUnits() {
  const [value, setValue] = useState(90);
  const [unit, setUnit] = useState<TimeUnit>("min");
  const [duration, setDuration] = useState("1:45");
  const [sheet, setSheet, clearSheet] = useStoredState("time-units:sheet", "1:30\n0:45\n2:15");
  const conv = convertTime(value, unit);
  const sec = conv ? conv.s : Number.NaN;
  const d = parseDuration(duration);
  const sum = useMemo(() => sumDurations(sheet), [sheet]);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className={ui.h3}>単位を変換する</h3>
        <FieldGrid>
          <Field label="数値">
            <input
              className={ui.input}
              type="number"
              inputMode="decimal"
              step="any"
              value={Number.isFinite(value) ? value : ""}
              onChange={(e) => setValue(e.target.value === "" ? Number.NaN : Number(e.target.value))}
            />
          </Field>
          <Choice label="単位" value={unit} onChange={setUnit} options={UNITS} />
        </FieldGrid>
        {conv ? (
          <>
            <Stats
              items={UNITS.filter(([u]) => u !== unit).map(([u, l]) => ({
                label: l,
                value: fmt(conv[u]),
                emphasis: u === "h" || (unit === "h" && u === "min"),
              }))}
            />
            <p className="text-sm" aria-live="polite">
              {formatJa(sec)}（{formatHms(sec)}）
            </p>
          </>
        ) : (
          <p className={ui.note}>数値を入れてください。</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className={ui.h3}>「時:分」と10進数の時間を変換する</h3>
        <Field label="時間の長さ（例：1:45、1.75、1時間45分、105分）">
          <input className={`${ui.input} sm:max-w-xs`} value={duration} onChange={(e) => setDuration(e.target.value)} />
        </Field>
        {d !== null ? (
          <Stats
            items={[
              {
                label: "10進数の時間",
                value: `${fmt(d / 3600, 4)} 時間`,
                emphasis: true,
              },
              { label: "時:分:秒", value: formatHms(d) },
              { label: "日本語", value: formatJa(d, false) },
              { label: "分", value: fmt(d / 60, 2) },
              { label: "秒", value: fmt(d, 0) },
            ]}
          />
        ) : (
          <p className="text-sm text-warn" aria-live="polite">
            {duration.trim() ? "読み取れません。「1:45」「1.75」「1時間45分」のように入れてください。" : "時間の長さを入れてください。"}
          </p>
        )}
        <p className={ui.note}>コロンを使うと「時:分」または「時:分:秒」、数字だけなら時間（10進数）として読みます。たとえば 1.75時間 は 1時間45分 です。</p>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className={ui.h3}>時間を合計する（勤務時間など）</h3>
        <label className={ui.label}>
          合計したい時間（1行に1つ、またはカンマ区切り）
          <textarea className={`${ui.input} min-h-40 font-mono text-sm leading-relaxed`} value={sheet} onChange={(e) => setSheet(e.target.value)} placeholder={"1:30\n0:45\n2時間15分"} />
        </label>
        <Stats
          items={[
            {
              label: "合計（時:分）",
              value: formatHms(sum.total, false),
              emphasis: true,
            },
            {
              label: "合計（10進数の時間）",
              value: `${fmt(sum.total / 3600, 2)} 時間`,
            },
            { label: "合計（分）", value: fmt(sum.total / 60, 1) },
            { label: "項目数", value: sum.items.length - sum.invalid },
          ]}
        />
        {sum.invalid > 0 && (
          <p className="text-sm text-warn" aria-live="polite">
            読み取れない項目が {sum.invalid} 個あり、合計に入れていません：
            {sum.items
              .filter((it) => it.seconds === null)
              .map((it) => `「${it.raw}」`)
              .join("")}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <CopyButton text={formatHms(sum.total, false)} label="合計をコピー" primary />
          <button type="button" className={ui.button} onClick={clearSheet}>
            消す
          </button>
        </div>
        <p className={ui.note}>合計の「時:分」は秒を四捨五入して分にしています。24時間を超えても「27:30」のように時間で表します。</p>
        <SavedNote />
      </section>
    </div>
  );
}

/* ---------- cron ---------- */

type Zone = "jst" | "utc";
const ZONE_OFFSET: Record<Zone, number> = { jst: 540, utc: 0 };
let startedAt: number | null = null;
const clientNow = () => (startedAt ??= Date.now());

function formatRun(ms: number, offsetMin: number): string {
  const d = new Date(ms + offsetMin * 60_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}/${p(d.getUTCMonth() + 1)}/${p(d.getUTCDate())}（${WEEKDAYS[d.getUTCDay()]}） ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

export function CronParser() {
  const [expr, setExpr] = useStoredState("cron-parser:expr", "0 9 * * 1-5");
  const [zone, setZone] = useStoredState<Zone>("cron-parser:zone", "jst");
  const now = useClientValue(clientNow, 0);
  const c = useMemo(() => parseCron(expr), [expr]);
  const runs = useMemo(() => ("error" in c || !now ? [] : nextRuns(c, now, 10, ZONE_OFFSET[zone])), [c, now, zone]);
  const runText = runs.map((r) => formatRun(r, ZONE_OFFSET[zone])).join("\n");

  return (
    <div className="flex flex-col gap-4">
      <Field label="cron式（分 時 日 月 曜日）">
        <input className={`${ui.input} font-mono`} value={expr} onChange={(e) => setExpr(e.target.value)} spellCheck={false} autoCapitalize="off" autoComplete="off" placeholder="0 9 * * 1-5" />
      </Field>
      <div className="flex flex-wrap gap-1.5">
        {CRON_EXAMPLES.map((x) => (
          <button key={x.expr} type="button" className={ui.chip} onClick={() => setExpr(x.expr)}>
            {x.label}
          </button>
        ))}
      </div>
      {"error" in c ? (
        <p className="rounded-xl border border-warn/40 px-3.5 py-2.5 text-sm text-warn" role="alert">
          {c.error}
        </p>
      ) : (
        <>
          <p className="rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-lg font-bold" aria-live="polite">
            {describeCron(c)}
          </p>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-field text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-1.5 font-medium whitespace-nowrap">項目</th>
                  <th className="px-3 py-1.5 font-medium whitespace-nowrap">値</th>
                  <th className="px-3 py-1.5 font-medium">意味</th>
                </tr>
              </thead>
              <tbody>
                {CRON_FIELDS.map((s) => (
                  <tr key={s.key} className="border-t border-line">
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      {s.label}（{s.min}〜{s.max}）
                    </td>
                    <td className="px-3 py-1.5 font-mono whitespace-nowrap">{c.fields[s.key].raw}</td>
                    <td className="px-3 py-1.5">{describeField(c.fields[s.key], s.key)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Choice<Zone>
              label="時刻の基準"
              value={zone}
              onChange={setZone}
              options={[
                ["jst", "日本時間（JST）"],
                ["utc", "協定世界時（UTC）"],
              ]}
            />
          </div>
          <h3 className={ui.h3}>次の実行日時（10回分）</h3>
          {runs.length ? (
            <ol className="flex flex-col gap-1 font-mono text-sm tabular-nums" aria-live="polite">
              {runs.map((r, i) => (
                <li key={r} className="rounded-lg border border-line bg-field/60 px-3 py-1.5">
                  <span className="mr-3 inline-block w-6 text-right text-muted">{i + 1}.</span>
                  {formatRun(r, ZONE_OFFSET[zone])}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-warn">{now ? "30年先まで探しても実行日時が見つかりません（2月30日のような、存在しない日付になっていないか確かめてください）。" : "計算しています…"}</p>
          )}
          {runs.length > 0 && runs.length < 10 && <p className={ui.note}>30年先までに見つかった分だけを表示しています。</p>}
          {runs.length > 0 && (
            <div>
              <CopyButton text={runText} label="実行日時をコピー" />
            </div>
          )}
        </>
      )}
      <p className={ui.note}>
        一般的な crontab（Vixie cron）の5項目の書き方に対応しています。「*」「,」（列挙）「-」（範囲）「/」（間隔）と、JAN〜DEC・SUN〜SAT の名前、@daily
        などが使えます。曜日の0と7はどちらも日曜です。日と曜日の両方を指定すると（どちらも「*」で始まらないとき）、どちらか一方に当てはまる日に実行されます。サーバーの時刻がUTCになっていることも多いので、実行環境のタイムゾーンを確かめてください。
      </p>
    </div>
  );
}
