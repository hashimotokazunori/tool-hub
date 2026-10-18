/** 日付ユーティリティ（タイムゾーンの影響を受けないよう、日付は "YYYY-MM-DD" の文字列で扱う） */

export const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "YYYY-MM-DD" を、その日の0時（ローカル時刻）の Date にする。不正なら null */
export function parseYmd(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return toYmd(d) === s ? d : null;
}

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** 2つの日付の差（b − a）を日数で。夏時間の影響を避けるためUTCで計算する */
export function diffDays(a: Date, b: Date): number {
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86_400_000);
}

export function formatJa(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`;
}

export function wareki(d: Date): string {
  try {
    return new Intl.DateTimeFormat("ja-JP-u-ca-japanese", { era: "long", year: "numeric", month: "long", day: "numeric" }).format(d);
  } catch {
    return "";
  }
}

const cache = new Map<number, Map<string, string>>();

/**
 * 日本の祝日（「国民の祝日に関する法律」の規則による計算）。
 * 春分・秋分の日は計算式による予測で、正式には前年2月の官報で決まる。対象は2000〜2099年。
 */
export function japaneseHolidays(year: number): Map<string, string> {
  const hit = cache.get(year);
  if (hit) return hit;
  const H = new Map<string, string>();
  const key = (m: number, d: number) => `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const add = (m: number, d: number, name: string) => H.set(key(m, d), name);
  const nthMonday = (m: number, n: number) => {
    const first = new Date(year, m - 1, 1).getDay();
    return 1 + ((8 - first) % 7) + (n - 1) * 7;
  };
  const shunbun = Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  const shubun = Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));

  add(1, 1, "元日");
  add(1, nthMonday(1, 2), "成人の日");
  add(2, 11, "建国記念の日");
  if (year >= 2020) add(2, 23, "天皇誕生日");
  add(3, shunbun, "春分の日");
  add(4, 29, "昭和の日");
  add(5, 3, "憲法記念日");
  add(5, 4, "みどりの日");
  add(5, 5, "こどもの日");
  if (year === 2020) {
    add(7, 23, "海の日");
    add(7, 24, "スポーツの日");
    add(8, 10, "山の日");
  } else if (year === 2021) {
    add(7, 22, "海の日");
    add(7, 23, "スポーツの日");
    add(8, 8, "山の日");
  } else {
    add(7, nthMonday(7, 3), "海の日");
    if (year >= 2016) add(8, 11, "山の日");
    add(10, nthMonday(10, 2), year >= 2020 ? "スポーツの日" : "体育の日");
  }
  add(9, nthMonday(9, 3), "敬老の日");
  add(9, shubun, "秋分の日");
  add(11, 3, "文化の日");
  add(11, 23, "勤労感謝の日");
  if (year <= 2018) add(12, 23, "天皇誕生日");
  if (year === 2019) {
    add(4, 30, "国民の休日");
    add(5, 1, "天皇の即位の日");
    add(5, 2, "国民の休日");
    add(10, 22, "即位礼正殿の儀の行われる日");
  }
  // 国民の休日：前日と翌日が祝日である平日
  for (const k of [...H.keys()]) {
    const d = parseYmd(k)!;
    const mid = addDays(d, 1);
    if (H.has(toYmd(addDays(d, 2))) && !H.has(toYmd(mid)) && mid.getDay() !== 0 && mid.getFullYear() === year) H.set(toYmd(mid), "国民の休日");
  }
  // 振替休日：祝日が日曜日なら、その後の最初の祝日でない日
  for (const k of [...H.keys()].sort()) {
    const d = parseYmd(k)!;
    if (d.getDay() !== 0) continue;
    let n = addDays(d, 1);
    while (H.has(toYmd(n))) n = addDays(n, 1);
    if (n.getFullYear() === year) H.set(toYmd(n), "振替休日");
  }
  cache.set(year, H);
  return H;
}

export const holidayName = (d: Date) => japaneseHolidays(d.getFullYear()).get(toYmd(d)) ?? "";
