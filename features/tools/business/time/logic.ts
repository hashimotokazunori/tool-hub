/** 文字数から話す時間・読む時間を見積もる */

/** 原稿の文字数（空白・改行は数えない） */
export const scriptChars = (text: string) => [...text.replace(/\s/g, "")].length;

/** 話す時間（分）。charsPerMinute は 1分あたりの文字数（300字がよく使われる目安） */
export function speakingMinutes(chars: number, charsPerMinute: number) {
  return charsPerMinute > 0 ? chars / charsPerMinute : Number.NaN;
}

/** 読む時間（分）と、1日 minutesPerDay 分読んだときの日数 */
export function readingPlan(pages: number, charsPerPage: number, charsPerMinute: number, minutesPerDay: number) {
  const chars = Math.max(0, pages) * charsPerPage;
  const minutes = charsPerMinute > 0 ? chars / charsPerMinute : Number.NaN;
  return { chars, minutes, days: minutesPerDay > 0 ? Math.ceil(minutes / minutesPerDay) : Number.NaN, pagesPerDay: charsPerPage > 0 ? (minutesPerDay * charsPerMinute) / charsPerPage : Number.NaN };
}

/** 分 → 「X時間Y分」「Y分Z秒」 */
export function formatMinutes(min: number): string {
  if (!Number.isFinite(min)) return "—";
  const totalSec = Math.round(min * 60);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h) return `${h}時間${m}分`;
  return s ? `${m}分${s}秒` : `${m}分`;
}
