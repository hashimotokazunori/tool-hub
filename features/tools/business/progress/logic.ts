/** 目標達成率・進捗率・学習時間の計算（DOMを使わない純粋な計算） */

import { addDays, diffDays, japaneseHolidays, parseYmd, toYmd } from "@/lib/date";

/* ---------- 目標達成率 ---------- */

export type AchievementResult = {
  /** 達成率（%） */
  rate: number;
  /** 期間の経過率（%） */
  timeRate: number;
  /** 今のペースで進んだ場合の着地見込み（実績 ÷ 経過日数 × 全日数） */
  projected: number;
  /** 着地見込みの達成率（%） */
  projectedRate: number;
  /** 1日あたりの実績 */
  pace: number;
  /** 残り */
  remaining: number;
  remainingDays: number;
  /** 残りの日で目標に届くための1日あたりの数（残りの日がない・達成済みなら0） */
  requiredPerDay: number;
};

export function calcAchievement({ target, actual, elapsed, total }: { target: number; actual: number; elapsed: number; total: number }): AchievementResult | null {
  if (!(target > 0) || !(actual >= 0) || !(total > 0) || !(elapsed > 0) || elapsed > total) return null;
  const pace = actual / elapsed;
  const projected = pace * total;
  const remaining = Math.max(0, target - actual);
  const remainingDays = total - elapsed;
  return {
    rate: (actual / target) * 100,
    timeRate: (elapsed / total) * 100,
    projected,
    projectedRate: (projected / target) * 100,
    pace,
    remaining,
    remainingDays,
    requiredPerDay: remaining > 0 && remainingDays > 0 ? remaining / remainingDays : 0,
  };
}

const isBusinessDay = (d: Date) => d.getDay() !== 0 && d.getDay() !== 6 && !japaneseHolidays(d.getFullYear()).has(toYmd(d));

/** その日を含む月の営業日（土日祝を除く）の数と、月初からその日まで（その日を含む）の営業日の数 */
export function monthBusinessDays(ymd: string): { elapsed: number; total: number } | null {
  const d = parseYmd(ymd);
  if (!d) return null;
  let elapsed = 0;
  let total = 0;
  for (let x = new Date(d.getFullYear(), d.getMonth(), 1); x.getMonth() === d.getMonth(); x = addDays(x, 1)) {
    if (!isBusinessDay(x)) continue;
    total++;
    if (x.getDate() <= d.getDate()) elapsed++;
  }
  return { elapsed, total };
}

/** その日を含む月の暦日の数と、月初からその日までの日数 */
export function monthCalendarDays(ymd: string): { elapsed: number; total: number } | null {
  const d = parseYmd(ymd);
  if (!d) return null;
  return { elapsed: d.getDate(), total: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() };
}

/* ---------- 進捗率 ---------- */

export type ProgressResult = {
  /** 進捗率（%） */
  rate: number;
  remaining: number;
  /** 開始日から今日まで（両端を含む）の日数 */
  elapsedDays: number;
  /** 1日あたりの量 */
  pace: number;
  /** 今のペースで終わるまでにかかる残りの日数（今日の翌日から数える） */
  daysLeft: number | null;
  /** 完了予定日（"YYYY-MM-DD"） */
  finishDate: string | null;
  /** 期限までの残りの日数（今日の翌日〜期限日） */
  daysToDeadline: number | null;
  /** 期限に間に合わせるための1日あたりの量 */
  requiredPerDay: number | null;
};

/** 開始日から今日まで（今日の分も終わった前提）のペースで、残りが終わる日を暦日で出す */
export function calcProgress({ total, done, start, today, deadline }: { total: number; done: number; start: string; today: string; deadline?: string }): ProgressResult | null {
  const s = parseYmd(start);
  const t = parseYmd(today);
  if (!s || !t || !(total > 0) || !(done >= 0)) return null;
  const elapsedDays = diffDays(s, t) + 1;
  if (elapsedDays < 1) return null;
  const remaining = Math.max(0, total - done);
  const pace = done / elapsedDays;
  let daysLeft: number | null = null;
  let finishDate: string | null = null;
  if (remaining === 0) {
    daysLeft = 0;
    finishDate = today;
  } else if (pace > 0) {
    daysLeft = Math.ceil(remaining / pace - 1e-9);
    finishDate = toYmd(addDays(t, daysLeft));
  }
  const dl = deadline ? parseYmd(deadline) : null;
  const daysToDeadline = dl ? diffDays(t, dl) : null;
  const requiredPerDay = daysToDeadline !== null && daysToDeadline > 0 ? remaining / daysToDeadline : null;
  return { rate: Math.min(100, (done / total) * 100), remaining, elapsedDays, pace, daysLeft, finishDate, daysToDeadline, requiredPerDay };
}

/* ---------- 学習時間 ---------- */

export type StudyResult = {
  /** 今日（含めるとき）から試験の前日までの日数 */
  days: number;
  /** そのうち勉強する日 */
  studyDays: number;
  remainingHours: number;
  perDay: number;
  /** 1週間あたり（勉強する曜日の数 × 1日あたり） */
  perWeek: number;
};

/**
 * 試験日の前日までに必要な時間を、勉強する日に均等に割り振る。
 * restWeekdays は休む曜日（0=日〜6=土）。includeToday が true なら今日から数える。
 */
export function calcStudy({ exam, today, totalHours, doneHours, restWeekdays, includeToday }: { exam: string; today: string; totalHours: number; doneHours: number; restWeekdays: number[]; includeToday: boolean }): StudyResult | null {
  const e = parseYmd(exam);
  const t = parseYmd(today);
  if (!e || !t || !(totalHours > 0) || !(doneHours >= 0)) return null;
  const rest = new Set(restWeekdays);
  if (rest.size >= 7) return null;
  const first = includeToday ? t : addDays(t, 1);
  const days = diffDays(first, e);
  if (days < 1 || days > 3660) return null;
  let studyDays = 0;
  for (let i = 0; i < days; i++) if (!rest.has(addDays(first, i).getDay())) studyDays++;
  if (studyDays === 0) return null;
  const remainingHours = Math.max(0, totalHours - doneHours);
  const perDay = remainingHours / studyDays;
  return { days, studyDays, remainingHours, perDay, perWeek: perDay * (7 - rest.size) };
}
