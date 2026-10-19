"use client";

import { useState } from "react";
import { Check } from "@/components/TextTransform";
import { Field, FieldGrid, Stats } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { useClientValue } from "@/components/useClientValue";
import { WEEKDAYS, addDays, formatJa, parseYmd, toYmd } from "@/lib/date";
import { calcAchievement, calcProgress, calcStudy, monthBusinessDays, monthCalendarDays } from "./logic";

const num = (s: string) => (s === "" ? Number.NaN : Number(s));
const fmt = (x: number, d = 1) => (Number.isFinite(x) ? x.toLocaleString("ja-JP", { maximumFractionDigits: d }) : "—");
const dateJa = (ymd: string | null) => {
  const d = ymd ? parseYmd(ymd) : null;
  return d ? formatJa(d) : "—";
};
const hoursText = (h: number) => {
  if (!Number.isFinite(h)) return "—";
  const m = Math.round(h * 60);
  return `${Math.floor(m / 60)} 時間 ${m % 60} 分`;
};
const useToday = () => useClientValue(() => toYmd(new Date()), "");

function Num({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step?: string }) {
  return (
    <Field label={label}>
      <input className={ui.input} type="number" inputMode="decimal" step={step ?? "any"} min={0} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(num(e.target.value))} />
    </Field>
  );
}

/* ---------- 目標達成率 ---------- */

export function AchievementRate() {
  const today = useToday();
  const [target, setTarget] = useState(1_000_000);
  const [actual, setActual] = useState(450_000);
  const [elapsed, setElapsed] = useState(12);
  const [total, setTotal] = useState(20);
  const [unit, setUnit] = useState("");
  const r = calcAchievement({ target, actual, elapsed, total });
  const u = unit.trim() ? ` ${unit.trim()}` : "";
  const fill = (v: { elapsed: number; total: number } | null) => {
    if (!v) return;
    setElapsed(v.elapsed);
    setTotal(v.total);
  };
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Num label="目標" value={target} onChange={setTarget} />
        <Num label="今日までの実績" value={actual} onChange={setActual} />
        <Field label="単位（任意・例：円、件）">
          <input className={ui.input} type="text" value={unit} maxLength={10} onChange={(e) => setUnit(e.target.value)} />
        </Field>
        <Num label="経過した日数（今日を含む）" value={elapsed} onChange={setElapsed} step="1" />
        <Num label="期間全体の日数" value={total} onChange={setTotal} step="1" />
      </FieldGrid>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={ui.chip} disabled={!today} onClick={() => fill(monthBusinessDays(today))}>
          今月の営業日（土日祝を除く）で入れる
        </button>
        <button type="button" className={ui.chip} disabled={!today} onClick={() => fill(monthCalendarDays(today))}>
          今月の暦日で入れる
        </button>
      </div>
      {r ? (
        <>
          <Stats
            items={[
              { label: "達成率", value: `${fmt(r.rate)} %`, emphasis: true },
              { label: "期間の経過率", value: `${fmt(r.timeRate)} %` },
              { label: "着地見込み", value: `${fmt(r.projected, 0)}${u}` },
              { label: "着地見込みの達成率", value: `${fmt(r.projectedRate)} %` },
              { label: "目標までの残り", value: `${fmt(r.remaining, 0)}${u}` },
              { label: "残りの日数", value: `${r.remainingDays} 日` },
              { label: "これまでの1日あたり", value: `${fmt(r.pace, 1)}${u}` },
              { label: "必要な1日あたり", value: r.remaining === 0 ? "達成済み" : r.remainingDays === 0 ? "—" : `${fmt(r.requiredPerDay, 1)}${u}` },
            ]}
          />
          <p className={ui.note} aria-live="polite">
            {r.remaining === 0
              ? "目標を達成しています。"
              : r.projectedRate >= 100
                ? "今のペースなら目標に届く見込みです。"
                : r.remainingDays > 0
                  ? `今のペースだと届かない見込みです。残りの日は1日あたり ${fmt(r.requiredPerDay, 1)}${u} が必要です（これまでの ${fmt(r.requiredPerDay / r.pace, 2)} 倍）。`
                  : "期間が終わっています。"}
          </p>
        </>
      ) : (
        <p className={ui.note}>目標・実績と、経過した日数（1日以上・期間全体以下）を入れてください。</p>
      )}
      <p className={ui.note}>着地見込みは「実績 ÷ 経過した日数 × 期間全体の日数」で、これまでと同じペースが続いた場合の目安です。営業日は土日と祝日を除いて数えます（会社独自の休日は含みません）。</p>
    </div>
  );
}

/* ---------- 進捗率 ---------- */

export function ProgressRate() {
  const today = useToday();
  const [total, setTotal] = useState(100);
  const [done, setDone] = useState(30);
  const [startIn, setStart] = useState<string | null>(null);
  const [deadline, setDeadline] = useState("");
  const start = startIn ?? (today ? toYmd(addDays(parseYmd(today)!, -9)) : "");
  const r = today && start ? calcProgress({ total, done, start, today, deadline: deadline || undefined }) : null;
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Num label="全体の量（タスク数・ページ数など）" value={total} onChange={setTotal} />
        <Num label="終わった量" value={done} onChange={setDone} />
        <Field label="開始日">
          <input className={ui.input} type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="期限（任意）">
          <input className={ui.input} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
      </FieldGrid>
      {r ? (
        <>
          <div className="h-3 overflow-hidden rounded-full bg-field" role="progressbar" aria-label="進捗率" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(r.rate)}>
            <div className="h-full rounded-full bg-accent" style={{ width: `${r.rate}%` }} />
          </div>
          <Stats
            items={[
              { label: "進捗率", value: `${fmt(r.rate)} %`, emphasis: true },
              { label: "残り", value: fmt(r.remaining, 2) },
              { label: "経過日数（今日を含む）", value: `${r.elapsedDays} 日` },
              { label: "1日あたりのペース", value: fmt(r.pace, 2) },
              { label: "完了予定日", value: r.daysLeft === 0 ? "完了済み" : dateJa(r.finishDate) },
              { label: "完了まであと", value: r.daysLeft === null ? "—" : `${r.daysLeft} 日` },
              ...(r.daysToDeadline !== null ? [{ label: "期限まであと", value: `${r.daysToDeadline} 日` }] : []),
              ...(r.requiredPerDay !== null ? [{ label: "期限に間に合う1日あたり", value: fmt(r.requiredPerDay, 2) }] : []),
            ]}
          />
          {r.daysToDeadline !== null && r.finishDate && r.remaining > 0 && (
            <p className={ui.note} aria-live="polite">
              {r.daysToDeadline < 0 ? "期限を過ぎています。" : r.daysLeft !== null && r.daysLeft <= r.daysToDeadline ? "今のペースなら期限に間に合う見込みです。" : `今のペースだと期限に${(r.daysLeft ?? 0) - r.daysToDeadline}日遅れる見込みです。`}
            </p>
          )}
          {r.pace === 0 && r.remaining > 0 && <p className={ui.note}>まだ進んでいないため、完了予定日は出せません。</p>}
        </>
      ) : (
        <p className={ui.note}>全体の量・終わった量と、今日以前の開始日を入れてください。</p>
      )}
      <p className={ui.note}>開始日から今日まで（両端を含む・土日も含む暦日）と同じペースで進んだ場合の目安です。今日の分まで終わっている前提で、完了予定日は明日以降で数えます。</p>
    </div>
  );
}

/* ---------- 学習時間 ---------- */

const PRESETS = [50, 100, 200, 300, 500, 1000];
const NO_REST: number[] = [];

export function StudyTime() {
  const today = useToday();
  const [examIn, setExam] = useState<string | null>(null);
  const [totalHours, setTotal] = useState(300);
  const [doneHours, setDone] = useState(0);
  const [rest, setRest] = useState<number[]>(NO_REST);
  const [includeToday, setIncludeToday] = useState(true);
  const exam = examIn ?? (today ? toYmd(addDays(parseYmd(today)!, 90)) : "");
  const r = today && exam ? calcStudy({ exam, today, totalHours, doneHours, restWeekdays: rest, includeToday }) : null;
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Field label="試験日">
          <input className={ui.input} type="date" value={exam} onChange={(e) => setExam(e.target.value)} />
        </Field>
        <Num label="必要な勉強時間の合計（時間）" value={totalHours} onChange={setTotal} step="10" />
        <Num label="もう勉強した時間（時間）" value={doneHours} onChange={setDone} step="1" />
      </FieldGrid>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-muted">合計の例：</span>
        {PRESETS.map((p) => (
          <button key={p} type="button" className={ui.chip} aria-pressed={totalHours === p} onClick={() => setTotal(p)}>
            合計{p}時間
          </button>
        ))}
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-[13px] text-muted">勉強しない曜日</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {WEEKDAYS.map((w, i) => (
            <Check key={w} label={`${w}曜日`} checked={rest.includes(i)} onChange={(on) => setRest((p) => (on ? [...p, i].sort((a, b) => a - b) : p.filter((x) => x !== i)))} />
          ))}
        </div>
      </fieldset>
      <Check label="今日も勉強する日に数える" checked={includeToday} onChange={setIncludeToday} />
      {r ? (
        <Stats
          items={[
            { label: "1日あたり", value: hoursText(r.perDay), emphasis: true },
            { label: "1週間あたり", value: hoursText(r.perWeek) },
            { label: "残りの勉強時間", value: `${fmt(r.remainingHours)} 時間` },
            { label: "勉強する日", value: `${r.studyDays} 日` },
            { label: "試験の前日までの日数", value: `${r.days} 日` },
          ]}
        />
      ) : (
        <p className={ui.note} aria-live="polite">
          {rest.length >= 7 ? "勉強する曜日を1つ以上残してください。" : "未来の試験日と、必要な勉強時間を入れてください。"}
        </p>
      )}
      <p className={ui.note}>試験日の前日までの、勉強する曜日に均等に割り振った目安です。必要な勉強時間は試験や今の実力で大きく変わるため、合計の例はあくまで入力の補助です。公式の案内や合格者の目安などを参考に決めてください。</p>
    </div>
  );
}
