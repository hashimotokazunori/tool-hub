import { addDays, diffDays, holidayName, parseYmd } from "@/lib/date";

export type DaysBetweenResult = {
  /** 終了日 − 開始日 */
  days: number;
  /** 開始日と終了日の両方を含めた日数 */
  inclusiveDays: number;
  weeks: number;
  /** 土日を除いた日数（両端を含む） */
  weekdays: number;
  /** 土日と祝日を除いた日数（両端を含む） */
  businessDays: number;
  holidays: { date: string; name: string }[];
};

export function daysBetween(start: string, end: string): DaysBetweenResult | null {
  const a = parseYmd(start);
  const b = parseYmd(end);
  if (!a || !b) return null;
  const days = diffDays(a, b);
  const from = days >= 0 ? a : b;
  const n = Math.abs(days);
  let weekdays = 0;
  let businessDays = 0;
  const holidays: { date: string; name: string }[] = [];
  for (let i = 0; i <= n && i <= 36600; i++) {
    const d = addDays(from, i);
    const w = d.getDay();
    if (w === 0 || w === 6) continue;
    weekdays++;
    const h = holidayName(d);
    if (h) holidays.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, name: h });
    else businessDays++;
  }
  return { days, inclusiveDays: n + 1, weeks: days / 7, weekdays, businessDays, holidays };
}
