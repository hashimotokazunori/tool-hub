/** 日時のツール（カウントダウン・タイムゾーン・Unix時間・営業日・週番号）の計算 */
import { WEEKDAYS, addDays, japaneseHolidays, parseYmd, toYmd } from "@/lib/date";

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/* ---------- カウントダウン ---------- */

export type Countdown = { done: boolean; totalMs: number; days: number; hours: number; minutes: number; seconds: number };

/** target までの残り時間（ミリ秒の時刻どうし）。過ぎていれば done */
export function countdownParts(targetMs: number, nowMs: number): Countdown {
  const totalMs = targetMs - nowMs;
  if (!(totalMs > 0)) return { done: true, totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  // 残り1.2秒は「1秒」ではなく「2秒」と見せる（0になった瞬間に到着とするため切り上げ）
  const s = Math.ceil(totalMs / 1000);
  return { done: false, totalMs, days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

/** "YYYY-MM-DDTHH:mm(:ss)" をローカル時刻の Date に。不正なら null */
export function parseLocalDateTime(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0));
  if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return null;
  return d;
}

/** 今日（ローカルの日付）から計算した、よく使う目標日時。値は datetime-local の形式 */
export function countdownPresets(today: Date): { label: string; value: string }[] {
  const y = today.getFullYear();
  const t = toYmd(today);
  /** その月日が今日より後なら今年、今日以前なら来年 */
  const next = (m: number, d: number) => {
    const ymd = `${y}-${pad(m)}-${pad(d)}`;
    return `${ymd > t ? y : y + 1}-${pad(m)}-${pad(d)}T00:00`;
  };
  return [
    { label: "次の元日", value: `${y + 1}-01-01T00:00` },
    { label: "クリスマス", value: next(12, 25) },
    { label: "クリスマスイブ", value: next(12, 24) },
    { label: "大みそか", value: next(12, 31) },
    { label: "バレンタインデー", value: next(2, 14) },
    { label: "明日の0時", value: `${toYmd(addDays(today, 1))}T00:00` },
  ];
}

/* ---------- タイムゾーン ---------- */

export const CITIES: { name: string; zone: string }[] = [
  { name: "東京", zone: "Asia/Tokyo" },
  { name: "ソウル", zone: "Asia/Seoul" },
  { name: "上海・北京", zone: "Asia/Shanghai" },
  { name: "シンガポール", zone: "Asia/Singapore" },
  { name: "バンコク", zone: "Asia/Bangkok" },
  { name: "デリー", zone: "Asia/Kolkata" },
  { name: "ドバイ", zone: "Asia/Dubai" },
  { name: "モスクワ", zone: "Europe/Moscow" },
  { name: "パリ", zone: "Europe/Paris" },
  { name: "ロンドン", zone: "Europe/London" },
  { name: "ニューヨーク", zone: "America/New_York" },
  { name: "ロサンゼルス", zone: "America/Los_Angeles" },
  { name: "ホノルル", zone: "Pacific/Honolulu" },
  { name: "シドニー", zone: "Australia/Sydney" },
  { name: "サンパウロ", zone: "America/Sao_Paulo" },
];

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function partsIn(zone: string, epochMs: number) {
  let f = fmtCache.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });
    fmtCache.set(zone, f);
  }
  const p: Record<string, number> = {};
  for (const x of f.formatToParts(new Date(epochMs))) if (x.type !== "literal") p[x.type] = Number(x.value);
  return { year: p.year, month: p.month, day: p.day, hour: p.hour % 24, minute: p.minute, second: p.second };
}

/** その時刻における、そのタイムゾーンのUTCとの差（分）。東京なら +540 */
export function zoneOffsetMinutes(zone: string, epochMs: number): number {
  const p = partsIn(zone, epochMs);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(epochMs / 1000) * 1000) / 60000);
}

/** そのタイムゾーンの現地時刻（"YYYY-MM-DD" と "HH:mm"）を、時刻（ミリ秒）に。夏時間の切り替えで存在しない時刻は、切り替え後の時刻にずらす */
export function zonedToEpoch(ymd: string, hm: string, zone: string): number | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  const t = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(hm);
  if (!d || !t || !parseYmd(ymd)) return null;
  const guess = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]), Number(t[3] ?? 0));
  const o1 = zoneOffsetMinutes(zone, guess);
  let epoch = guess - o1 * 60000;
  const o2 = zoneOffsetMinutes(zone, epoch);
  if (o2 !== o1) {
    const alt = guess - o2 * 60000;
    // 2回目の候補が本当にその現地時刻になるなら採用（秋の重複時刻・春の欠けた時刻の扱い）
    epoch = zoneOffsetMinutes(zone, alt) === o2 ? alt : Math.max(epoch, alt);
  }
  return epoch;
}

export const offsetLabel = (min: number) => `UTC${min < 0 ? "−" : "+"}${Math.floor(Math.abs(min) / 60)}${Math.abs(min) % 60 ? `:${pad(Math.abs(min) % 60)}` : ""}`;

/** その年の1月と7月の差のうち小さい方を標準時とし、それより進んでいれば夏時間 */
export function isDst(zone: string, epochMs: number): boolean {
  const y = partsIn(zone, epochMs).year;
  const std = Math.min(zoneOffsetMinutes(zone, Date.UTC(y, 0, 1)), zoneOffsetMinutes(zone, Date.UTC(y, 6, 1)));
  return zoneOffsetMinutes(zone, epochMs) > std;
}

export type ZonedTime = { ymd: string; time: string; weekday: string; offset: number; offsetLabel: string; dst: boolean };

export function timeInZone(epochMs: number, zone: string): ZonedTime {
  const p = partsIn(zone, epochMs);
  const ymd = `${p.year}-${pad(p.month)}-${pad(p.day)}`;
  const offset = zoneOffsetMinutes(zone, epochMs);
  return { ymd, time: `${pad(p.hour)}:${pad(p.minute)}`, weekday: WEEKDAYS[new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()], offset, offsetLabel: offsetLabel(offset), dst: isDst(zone, epochMs) };
}

/** 日付の差（b − a、"YYYY-MM-DD" どうし） */
export const ymdDiff = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/* ---------- Unix時間 ---------- */

/** Unix時間の文字列を、ミリ秒の時刻に。auto は桁数で判断（絶対値が 1e11 以上ならミリ秒） */
export function parseUnix(input: string, unit: "auto" | "s" | "ms"): { ms: number; unit: "s" | "ms" } | null {
  const s = input.trim().replace(/[,_\s]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  const u = unit === "auto" ? (Math.abs(n) >= 1e11 ? "ms" : "s") : unit;
  const ms = u === "s" ? Math.round(n * 1000) : Math.round(n);
  // Date で表せる範囲（±8.64e15 ミリ秒）
  if (!Number.isFinite(ms) || Math.abs(ms) > 8.64e15) return null;
  return { ms, unit: u };
}

/** 決まった時差（分）での日時の文字列。"YYYY-MM-DD HH:mm:ss" */
export function formatWithOffset(ms: number, offsetMin: number, withMs = false): string {
  const d = new Date(ms + offsetMin * 60000);
  const y = d.getUTCFullYear();
  const ys = y < 0 ? `-${pad(-y, 6)}` : y > 9999 ? `+${pad(y, 6)}` : pad(y, 4);
  return `${ys}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}${withMs ? `.${pad(d.getUTCMilliseconds(), 3)}` : ""}`;
}

export const formatJst = (ms: number, withMs = false) => formatWithOffset(ms, 540, withMs);

export type EpochInfo = { seconds: string; millis: string; jst: string; utc: string; isoUtc: string; isoJst: string; weekdayJst: string };

export function describeEpoch(ms: number): EpochInfo {
  const hasMs = ms % 1000 !== 0;
  const sec = ms / 1000;
  return {
    seconds: hasMs ? sec.toFixed(3) : String(sec),
    millis: String(ms),
    jst: formatJst(ms, hasMs),
    utc: formatWithOffset(ms, 0, hasMs),
    isoUtc: `${formatWithOffset(ms, 0, true).replace(" ", "T")}Z`,
    isoJst: `${formatJst(ms, true).replace(" ", "T")}+09:00`,
    weekdayJst: WEEKDAYS[new Date(ms + 540 * 60000).getUTCDay()],
  };
}

/** "YYYY-MM-DDTHH:mm(:ss)" を、日本時間（JST）か UTC の日時として Unix ミリ秒に */
export function dateTimeToEpoch(s: string, zone: "jst" | "utc"): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(s);
  if (!m || !parseYmd(`${m[1]}-${m[2]}-${m[3]}`) || Number(m[4]) > 23 || Number(m[5]) > 59 || Number(m[6] ?? 0) > 59) return null;
  const utc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0), Number((m[7] ?? "0").padEnd(3, "0")));
  return zone === "jst" ? utc - 540 * 60000 : utc;
}

/* ---------- 営業日 ---------- */

export type BizOptions = { yearEnd: boolean };

/** 休みの理由。営業日なら "" */
export function closedReason(d: Date, o: BizOptions): string {
  const w = d.getDay();
  if (w === 0 || w === 6) return w === 0 ? "日曜日" : "土曜日";
  const h = japaneseHolidays(d.getFullYear()).get(toYmd(d));
  if (h) return h;
  if (o.yearEnd) {
    const m = d.getMonth() + 1;
    const day = d.getDate();
    if ((m === 12 && day >= 29) || (m === 1 && day <= 3)) return "年末年始";
  }
  return "";
}

export const isBusinessDay = (d: Date, o: BizOptions) => closedReason(d, o) === "";

export type BizCount = { start: string; end: string; totalDays: number; businessDays: number; weekendDays: number; holidayDays: number; yearEndDays: number; holidays: { ymd: string; name: string }[] };

/** 2つの日付のあいだの営業日数（両端を含む。開始日を数えないときは includeStart=false）。逆順なら入れ替える */
export function countBusinessDays(a: string, b: string, o: BizOptions, includeStart = true): BizCount | null {
  let s = parseYmd(a);
  let e = parseYmd(b);
  if (!s || !e) return null;
  if (s > e) [s, e] = [e, s];
  const r: BizCount = { start: toYmd(s), end: toYmd(e), totalDays: 0, businessDays: 0, weekendDays: 0, holidayDays: 0, yearEndDays: 0, holidays: [] };
  if (!includeStart) s = addDays(s, 1);
  // 長すぎる範囲は計算しない（約275年）
  if ((e.getTime() - s.getTime()) / 86_400_000 > 100_000) return null;
  for (let d = s; d <= e; d = addDays(d, 1)) {
    r.totalDays++;
    const why = closedReason(d, o);
    if (!why) r.businessDays++;
    else if (why === "土曜日" || why === "日曜日") r.weekendDays++;
    else if (why === "年末年始") r.yearEndDays++;
    else {
      r.holidayDays++;
      r.holidays.push({ ymd: toYmd(d), name: why });
    }
  }
  return r;
}

/** 基準日から n 営業日後（n が負なら前）の日付。基準日は数えない（1営業日後＝翌営業日）。n=0 は基準日 */
export function addBusinessDays(base: string, n: number, o: BizOptions): string | null {
  let d = parseYmd(base);
  if (!d || !Number.isInteger(n) || Math.abs(n) > 100_000) return null;
  const step = n < 0 ? -1 : 1;
  for (let left = Math.abs(n); left > 0; ) {
    d = addDays(d, step);
    if (isBusinessDay(d, o)) left--;
  }
  return toYmd(d);
}

/* ---------- 週番号 ---------- */

export type IsoWeek = { weekYear: number; week: number; label: string; start: string; end: string; weeksInYear: number };

function isoWeekOf(d: Date): { weekYear: number; week: number } {
  // その週の木曜日が属する年が「週の年」
  const day = (d.getDay() + 6) % 7; // 月曜=0
  const thu = addDays(d, 3 - day);
  const jan1 = new Date(thu.getFullYear(), 0, 1);
  const week = Math.floor(Math.round((thu.getTime() - jan1.getTime()) / 86_400_000) / 7) + 1;
  return { weekYear: thu.getFullYear(), week };
}

/** ISO 8601 の週番号（月曜始まり、その年の最初の木曜日を含む週が第1週） */
export function isoWeek(ymd: string): IsoWeek | null {
  const d = parseYmd(ymd);
  if (!d) return null;
  const { weekYear, week } = isoWeekOf(d);
  const mon = addDays(d, -((d.getDay() + 6) % 7));
  return { weekYear, week, label: `${weekYear}-W${pad(week)}`, start: toYmd(mon), end: toYmd(addDays(mon, 6)), weeksInYear: isoWeekOf(new Date(weekYear, 11, 28)).week };
}

/** その月の第何週か。1日を含む週を第1週とし、週の始まりは日曜（0）か月曜（1） */
export function weekOfMonth(ymd: string, weekStart: 0 | 1): number | null {
  const d = parseYmd(ymd);
  if (!d) return null;
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  const offset = (firstDay - weekStart + 7) % 7;
  return Math.ceil((d.getDate() + offset) / 7);
}

/** 「第3月曜日」のような、その月で何回目のその曜日か */
export function nthWeekday(ymd: string): { n: number; weekday: string } | null {
  const d = parseYmd(ymd);
  if (!d) return null;
  return { n: Math.ceil(d.getDate() / 7), weekday: WEEKDAYS[d.getDay()] };
}
