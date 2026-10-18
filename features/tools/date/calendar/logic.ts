import { addDays, diffDays, holidayName, parseYmd, WEEKDAYS } from "@/lib/date";

export type DayInfo = { date: Date; weekday: string; holiday: string; dayOfYear: number; nthWeekday: string };

export function dayInfo(d: Date): DayInfo {
  return {
    date: d,
    weekday: `${WEEKDAYS[d.getDay()]}曜日`,
    holiday: holidayName(d),
    dayOfYear: diffDays(new Date(d.getFullYear(), 0, 1), d) + 1,
    nthWeekday: `第${Math.ceil(d.getDate() / 7)}${WEEKDAYS[d.getDay()]}曜日`,
  };
}

/** 基準日から n 日後（マイナスなら前） */
export function addDaysFrom(base: string, n: number): DayInfo | null {
  const b = parseYmd(base);
  if (!b || !Number.isFinite(n)) return null;
  return dayInfo(addDays(b, Math.trunc(n)));
}

const ZODIAC: [number, string][] = [
  [120, "山羊座"],
  [219, "水瓶座"],
  [321, "魚座"],
  [420, "牡羊座"],
  [521, "牡牛座"],
  [622, "双子座"],
  [723, "蟹座"],
  [823, "獅子座"],
  [923, "乙女座"],
  [1024, "天秤座"],
  [1123, "蠍座"],
  [1222, "射手座"],
  [1232, "山羊座"],
];
const ETO = "子丑寅卯辰巳午未申酉戌亥";

export type AgeResult = { years: number; months: number; days: number; kazoe: number; daysLived: number; daysToBirthday: number; eto: string; zodiac: string };

/** 年齢。誕生日に1歳加える一般的な数え方。2/29生まれは平年は3/1に加える */
export function calcAge(birth: string, at: string): AgeResult | null {
  const b = parseYmd(birth);
  const a = parseYmd(at);
  if (!b || !a || a < b) return null;
  let years = a.getFullYear() - b.getFullYear();
  let months = a.getMonth() - b.getMonth();
  let days = a.getDate() - b.getDate();
  if (days < 0) {
    months--;
    days += new Date(a.getFullYear(), a.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  let next = new Date(a.getFullYear(), b.getMonth(), b.getDate());
  if (next < a) next = new Date(a.getFullYear() + 1, b.getMonth(), b.getDate());
  const md = (b.getMonth() + 1) * 100 + b.getDate();
  return {
    years,
    months,
    days,
    kazoe: a.getFullYear() - b.getFullYear() + 1,
    daysLived: diffDays(b, a),
    daysToBirthday: diffDays(a, next),
    eto: `${ETO[(((b.getFullYear() - 4) % 12) + 12) % 12]}年`,
    zodiac: ZODIAC.find(([edge]) => md < edge)![1],
  };
}
