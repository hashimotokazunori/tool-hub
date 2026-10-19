"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Choice } from "@/components/TextTransform";
import { CopyButton, Field, FieldGrid, SavedNote, Stats } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { useClientValue } from "@/components/useClientValue";
import { useStoredState } from "@/components/useStoredState";
import { WEEKDAYS, formatJa, parseYmd, toYmd } from "@/lib/date";
import {
  CITIES,
  addBusinessDays,
  countBusinessDays,
  countdownParts,
  countdownPresets,
  dateTimeToEpoch,
  describeEpoch,
  formatJst,
  isoWeek,
  nthWeekday,
  parseLocalDateTime,
  parseUnix,
  timeInZone,
  weekOfMonth,
  ymdDiff,
  zonedToEpoch,
} from "./logic";

/** 毎秒（秒の変わり目）に知らせる購読。今の時刻を毎秒更新するのに使う */
function subscribeSecond(cb: () => void) {
  let id: ReturnType<typeof setTimeout>;
  const wait = () => 1000 - (Date.now() % 1000) + 5;
  const tick = () => {
    cb();
    id = setTimeout(tick, wait());
  };
  id = setTimeout(tick, wait());
  return () => clearTimeout(id);
}

/** 今の時刻（Unix秒）。静的HTMLでは 0 */
const useNowSecond = () =>
  useSyncExternalStore(
    subscribeSecond,
    () => Math.floor(Date.now() / 1000),
    () => 0,
  );

const useToday = () => useClientValue(() => toYmd(new Date()), "");

const ymdJa = (ymd: string) => {
  const d = parseYmd(ymd);
  return d ? formatJa(d) : ymd;
};

/* ---------- カウントダウン ---------- */

type CountdownState = { target: string; title: string };
const COUNTDOWN_INITIAL: CountdownState = { target: "", title: "" };

export function Countdown() {
  const today = useToday();
  const nowSec = useNowSecond();
  const [v, setV, reset] = useStoredState("countdown", COUNTDOWN_INITIAL);
  const todayDate = parseYmd(today);
  const presets = todayDate ? countdownPresets(todayDate) : [];
  // 未入力のあいだは「次の元日」
  const target = v.target || (presets[0]?.value ?? "");
  const title = v.title || (!v.target && presets[0] ? presets[0].label : "");
  const t = parseLocalDateTime(target);
  const r = t && nowSec ? countdownParts(t.getTime(), nowSec * 1000) : null;
  const tiles: [string, number][] = r ? [["日", r.days], ["時間", r.hours], ["分", r.minutes], ["秒", r.seconds]] : [];
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Field label="目標の日時">
          <input className={ui.input} type="datetime-local" value={target} onChange={(e) => setV({ ...v, target: e.target.value })} />
        </Field>
        <Field label="名前（任意）">
          <input className={ui.input} type="text" value={v.title} placeholder="例：試験日、旅行の出発" onChange={(e) => setV({ ...v, target, title: e.target.value })} />
        </Field>
      </FieldGrid>
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="よく使う日時">
          {presets.map((p) => (
            <button key={p.label} type="button" className={ui.chip} onClick={() => setV({ target: p.value, title: p.label })}>
              {p.label}
            </button>
          ))}
        </div>
      )}
      {t && (
        <p className="text-sm">
          {title && <b>{title}：</b>}
          {formatJa(t)} {String(t.getHours()).padStart(2, "0")}:{String(t.getMinutes()).padStart(2, "0")}
          {r && !r.done && " まで"}
        </p>
      )}
      {r ? (
        r.done ? (
          <p className="rounded-xl border border-accent bg-accent-soft px-4 py-5 text-center text-lg font-bold" aria-live="polite">
            目標の日時になりました
          </p>
        ) : (
          <>
            <div role="timer" aria-label="残り時間" className="grid grid-cols-4 gap-2">
              {tiles.map(([label, n]) => (
                <div key={label} className="flex flex-col items-center rounded-xl border border-accent bg-accent-soft px-1 py-3">
                  <span className="font-mono text-[clamp(1.5rem,7vw,2.5rem)] leading-none font-bold tabular-nums">{label === "日" ? n.toLocaleString("ja-JP") : String(n).padStart(2, "0")}</span>
                  <span className="mt-1 text-xs text-muted">{label}</span>
                </div>
              ))}
            </div>
            <p className={ui.note}>
              合計で {Math.floor(r.totalMs / 3_600_000).toLocaleString("ja-JP")} 時間 {Math.floor((r.totalMs % 3_600_000) / 60000)} 分です。
            </p>
          </>
        )
      ) : (
        <p className={ui.note}>{target && !t ? "日時の形式が正しくありません。" : "目標の日時を入れてください。"}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.button} onClick={reset}>
          消す
        </button>
      </div>
      <p className={ui.note}>この端末の時計と時刻設定（タイムゾーン）を使って、1秒ごとに数えています。</p>
      <SavedNote />
    </div>
  );
}

/* ---------- タイムゾーン ---------- */

const ZONES: [string, string][] = [...CITIES.map((c): [string, string] => [c.zone, `${c.name}（${c.zone}）`]), ["UTC", "UTC（協定世界時）"]];

export function TimeZone() {
  const [zone, setZone] = useStoredState("timezone:zone", "Asia/Tokyo");
  const [dateInput, setDate] = useState<string | null>(null);
  const [timeInput, setTime] = useState<string | null>(null);
  // 未入力のあいだは、選んだ地域の今の時刻（分単位）
  const nowLocal = useClientValue(() => {
    const z = timeInZone(Math.floor(Date.now() / 60000) * 60000, zone);
    return `${z.ymd}T${z.time}`;
  }, "");
  const date = dateInput ?? nowLocal.slice(0, 10);
  const time = timeInput ?? nowLocal.slice(11, 16);
  const epoch = date && time ? zonedToEpoch(date, time, zone) : null;
  const src = epoch !== null ? timeInZone(epoch, zone) : null;
  const rows = epoch !== null ? [...CITIES, ...(zone === "UTC" ? [{ name: "UTC", zone: "UTC" }] : [])].map((c) => ({ ...c, t: timeInZone(epoch, c.zone) })) : [];
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Choice label="基準の地域" value={zone} options={ZONES} onChange={setZone} />
        <Field label="日付（基準の地域）">
          <input className={ui.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="時刻（基準の地域）">
          <input className={ui.input} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </FieldGrid>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={ui.chip}
          onClick={() => {
            setDate(null);
            setTime(null);
          }}
        >
          今の時刻にする
        </button>
      </div>
      {src && (
        <p className="text-sm" aria-live="polite">
          基準：{ymdJa(src.ymd)} {src.time}（{src.offsetLabel}
          {src.dst ? "・夏時間" : ""}）
        </p>
      )}
      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm whitespace-nowrap tabular-nums">
            <thead className="bg-field text-left text-xs text-muted">
              <tr>
                <th className="px-3 py-1.5 font-medium">都市</th>
                <th className="px-3 py-1.5 font-medium">日付</th>
                <th className="px-3 py-1.5 font-medium">時刻</th>
                <th className="px-3 py-1.5 font-medium">UTCとの差</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const dd = src ? ymdDiff(src.ymd, c.t.ymd) : 0;
                return (
                  <tr key={c.zone} className={`border-t border-line ${c.zone === zone ? "bg-accent-soft font-semibold" : ""}`}>
                    <td className="px-3 py-1.5">{c.name}</td>
                    <td className="px-3 py-1.5">
                      {Number(c.t.ymd.slice(5, 7))}/{Number(c.t.ymd.slice(8))}（{c.t.weekday}）{dd !== 0 && <span className="ml-1 text-xs text-muted">{dd > 0 ? "翌日" : "前日"}</span>}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-base">{c.t.time}</td>
                    <td className="px-3 py-1.5">
                      {c.t.offsetLabel}
                      {c.t.dst && <span className="ml-1 rounded bg-field px-1 text-xs">夏時間</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={ui.note}>日付と時刻を入れてください。</p>
      )}
      <p className={ui.note}>
        夏時間（サマータイム）は、ブラウザに入っている世界のタイムゾーン情報（IANA）から日付に合わせて自動で反映しています。夏時間に切り替わる瞬間に存在しない時刻を入れた場合は、切り替え後の時刻として扱います。
      </p>
    </div>
  );
}

/* ---------- Unix時間 ---------- */

export function UnixTime() {
  const nowSec = useNowSecond();
  const [unixInput, setUnix] = useState("");
  const [unit, setUnit] = useState<"auto" | "s" | "ms">("auto");
  const [dtInput, setDt] = useState("");
  const [dtZone, setDtZone] = useState<"jst" | "utc">("jst");
  const parsed = unixInput.trim() ? parseUnix(unixInput, unit) : null;
  const info = parsed ? describeEpoch(parsed.ms) : null;
  const dtMs = dtInput ? dateTimeToEpoch(dtInput, dtZone) : null;
  const setNow = () => {
    const ms = Date.now();
    setUnix(String(Math.floor(ms / 1000)));
    setUnit("auto");
    const s = dtZone === "jst" ? formatJst(Math.floor(ms / 1000) * 1000) : describeEpoch(Math.floor(ms / 1000) * 1000).utc;
    setDt(s.replace(" ", "T"));
  };
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={ui.buttonPrimary} onClick={setNow}>
          今
        </button>
        <span className="text-sm text-muted">
          現在のUnix時間：<span className="font-mono text-ink tabular-nums">{nowSec ? nowSec : "—"}</span>
        </span>
      </div>

      <section className="flex flex-col gap-3">
        <h3 className={ui.h3}>Unix時間 → 日時</h3>
        <FieldGrid>
          <Field label="Unix時間">
            <input className={`${ui.input} font-mono`} type="text" inputMode="numeric" value={unixInput} placeholder="例：1700000000" onChange={(e) => setUnix(e.target.value)} />
          </Field>
          <Choice
            label="単位"
            value={unit}
            onChange={setUnit}
            options={[
              ["auto", "自動（桁数で判断）"],
              ["s", "秒"],
              ["ms", "ミリ秒"],
            ]}
          />
        </FieldGrid>
        {info && parsed ? (
          <Stats
            items={[
              { label: `日本時間（JST・${info.weekdayJst}曜日）`, value: info.jst, emphasis: true },
              { label: "協定世界時（UTC）", value: info.utc },
              { label: "ISO 8601（UTC）", value: info.isoUtc },
              { label: "ISO 8601（JST）", value: info.isoJst },
              { label: parsed.unit === "s" ? "ミリ秒にすると" : "秒にすると", value: parsed.unit === "s" ? info.millis : info.seconds },
            ]}
          />
        ) : (
          <p className={ui.note}>{unixInput.trim() ? "数字で入れてください（扱える範囲を超えている可能性もあります）。" : "Unix時間（1970年1月1日0時UTCからの秒数）を入れてください。"}</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className={ui.h3}>日時 → Unix時間</h3>
        <FieldGrid>
          <Field label="日時">
            <input className={ui.input} type="datetime-local" step={1} value={dtInput} onChange={(e) => setDt(e.target.value)} />
          </Field>
          <Choice
            label="この日時のタイムゾーン"
            value={dtZone}
            onChange={setDtZone}
            options={[
              ["jst", "日本時間（JST・UTC+9）"],
              ["utc", "協定世界時（UTC）"],
            ]}
          />
        </FieldGrid>
        {dtMs !== null ? (
          <Stats
            items={[
              { label: "Unix時間（秒）", value: String(Math.floor(dtMs / 1000)), emphasis: true },
              { label: "Unix時間（ミリ秒）", value: String(dtMs) },
              { label: "ISO 8601（UTC）", value: describeEpoch(dtMs).isoUtc },
            ]}
          />
        ) : (
          <p className={ui.note}>日時を入れてください。</p>
        )}
      </section>
      <p className={ui.note}>Unix時間はうるう秒を数えない決まりです。値を押すとコピーできます。</p>
    </div>
  );
}

/* ---------- 営業日 ---------- */

export function BusinessDays() {
  const today = useToday();
  const [startInput, setStart] = useState<string | null>(null);
  const [endInput, setEnd] = useState<string | null>(null);
  const [includeStart, setIncludeStart] = useState(true);
  const [yearEnd, setYearEnd] = useState(false);
  const [baseInput, setBase] = useState<string | null>(null);
  const [n, setN] = useState(10);
  const [dir, setDir] = useState<"after" | "before">("after");
  const opts = { yearEnd };
  const start = startInput ?? today;
  const end = endInput ?? (today ? toYmd(new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0)) : "");
  const base = baseInput ?? today;
  const r = start && end ? countBusinessDays(start, end, opts, includeStart) : null;
  const target = base && Number.isInteger(n) && n >= 0 ? addBusinessDays(base, dir === "after" ? n : -n, opts) : null;
  const wd = (ymd: string) => {
    const d = parseYmd(ymd);
    return d ? `（${WEEKDAYS[d.getDay()]}）` : "";
  };
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Check label="年末年始（12月29日〜1月3日）も休みにする" checked={yearEnd} onChange={setYearEnd} />
      </div>

      <section className="flex flex-col gap-3">
        <h3 className={ui.h3}>期間の営業日数</h3>
        <FieldGrid>
          <Field label={`開始日${wd(start)}`}>
            <input className={ui.input} type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label={`終了日${wd(end)}`}>
            <input className={ui.input} type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </FieldGrid>
        <Check label="開始日も数える" checked={includeStart} onChange={setIncludeStart} />
        {r ? (
          <>
            <Stats
              items={[
                { label: "営業日", value: `${r.businessDays.toLocaleString("ja-JP")} 日`, emphasis: true },
                { label: "期間の日数", value: `${r.totalDays.toLocaleString("ja-JP")} 日` },
                { label: "土日", value: `${r.weekendDays.toLocaleString("ja-JP")} 日` },
                { label: "祝日（平日）", value: `${r.holidayDays.toLocaleString("ja-JP")} 日` },
                ...(yearEnd ? [{ label: "年末年始（平日）", value: `${r.yearEndDays.toLocaleString("ja-JP")} 日` }] : []),
              ]}
            />
            {r.holidays.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer">期間内の祝日（土日を除く・{r.holidays.length}日）</summary>
                <ul className="mt-2 flex flex-col gap-0.5 pl-4">
                  {r.holidays.slice(0, 100).map((h) => (
                    <li key={h.ymd}>
                      {ymdJa(h.ymd)} {h.name}
                    </li>
                  ))}
                  {r.holidays.length > 100 && <li className="text-muted">ほか {r.holidays.length - 100} 日</li>}
                </ul>
              </details>
            )}
          </>
        ) : (
          <p className={ui.note}>開始日と終了日を入れてください。</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className={ui.h3}>○営業日後・前の日付</h3>
        <FieldGrid>
          <Field label={`基準日${wd(base)}`}>
            <input className={ui.input} type="date" value={base} onChange={(e) => setBase(e.target.value)} />
          </Field>
          <Field label="営業日数">
            <input className={ui.input} type="number" inputMode="numeric" min={0} max={10000} value={Number.isFinite(n) ? n : ""} onChange={(e) => setN(e.target.value === "" ? Number.NaN : Math.floor(Number(e.target.value)))} />
          </Field>
          <Choice
            label="向き"
            value={dir}
            onChange={setDir}
            options={[
              ["after", "後（○営業日後）"],
              ["before", "前（○営業日前）"],
            ]}
          />
        </FieldGrid>
        {target ? (
          <Stats items={[{ label: `${n}営業日${dir === "after" ? "後" : "前"}`, value: ymdJa(target), emphasis: true }]} />
        ) : (
          <p className={ui.note}>基準日と、0以上の営業日数を入れてください。</p>
        )}
        <p className={ui.note}>基準日は数えません（1営業日後＝次の営業日）。</p>
      </section>
      <p className={ui.note}>
        土曜日・日曜日・国民の祝日（振替休日・国民の休日を含む）を休みとして数えます。祝日は法律の規則から計算しており、春分の日・秋分の日は予測です（2000〜2099年）。会社独自の休日や臨時の祝日は含まないため、目安としてお使いください。
      </p>
    </div>
  );
}

/* ---------- 週番号 ---------- */

export function WeekNumber() {
  const today = useToday();
  const [input, setInput] = useState<string | null>(null);
  const value = input ?? today;
  const w = value ? isoWeek(value) : null;
  const sun = value ? weekOfMonth(value, 0) : null;
  const mon = value ? weekOfMonth(value, 1) : null;
  const nth = value ? nthWeekday(value) : null;
  const month = value ? Number(value.slice(5, 7)) : 0;
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Field label="日付">
          <input className={ui.input} type="date" value={value} onChange={(e) => setInput(e.target.value)} />
        </Field>
      </FieldGrid>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={ui.chip} onClick={() => setInput(null)} disabled={!today}>
          今日にする
        </button>
      </div>
      {w && sun && mon && nth ? (
        <>
          <Stats
            items={[
              { label: "ISO週番号", value: `第${w.week}週`, emphasis: true },
              { label: "ISO 8601 の表記", value: w.label },
              { label: "週の年（ISO）", value: `${w.weekYear}年` },
              { label: `${w.weekYear}年のISO週の数`, value: `${w.weeksInYear}週` },
              { label: `${month}月の第何週（日曜始まり）`, value: `第${sun}週` },
              { label: `${month}月の第何週（月曜始まり）`, value: `第${mon}週` },
              { label: "その月の", value: `第${nth.n}${nth.weekday}曜日` },
            ]}
          />
          <p className="text-sm">
            ISO週の期間：{ymdJa(w.start)} 〜 {ymdJa(w.end)}
          </p>
          <div>
            <CopyButton text={w.label} label={`「${w.label}」をコピー`} />
          </div>
        </>
      ) : (
        <p className={ui.note}>日付を入れてください。</p>
      )}
      <p className={ui.note}>
        ISO 8601 の週番号は、月曜日から始まり、その年の最初の木曜日を含む週を第1週とします。そのため年末年始の数日は、前後の年の週に入ることがあります。「その月の第何週」は、1日を含む週を第1週として数えます。
      </p>
    </div>
  );
}
