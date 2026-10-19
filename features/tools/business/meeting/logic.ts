import { CITIES, timeInZone, zonedToEpoch } from "@/features/tools/date/time/logic";
import { WEEKDAYS } from "@/lib/date";

/* ---------- 議事録 ---------- */

export type ActionItem = { who: string; what: string; due: string };
export type Minutes = {
  title: string;
  /** "YYYY-MM-DDTHH:mm"（datetime-local の値） */
  datetime: string;
  /** 終了時刻 "HH:mm"（任意） */
  endTime: string;
  place: string;
  attendees: string;
  agenda: string;
  discussion: string;
  decisions: string;
  actions: ActionItem[];
  next: string;
  author: string;
};

export const EMPTY_MINUTES: Minutes = {
  title: "",
  datetime: "",
  endTime: "",
  place: "",
  attendees: "",
  agenda: "",
  discussion: "",
  decisions: "",
  actions: [{ who: "", what: "", due: "" }],
  next: "",
  author: "",
};

/** "YYYY-MM-DD" → 「2026年10月19日（月）」 */
export function jaDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd);
  if (!m) return "";
  const w = WEEKDAYS[new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay()];
  return `${Number(m[1])}年${Number(m[2])}月${Number(m[3])}日（${w}）`;
}

/** 日時の表示（「2026年10月19日（月） 14:00〜15:00」） */
export function minutesDateText(datetime: string, endTime: string): string {
  const d = jaDate(datetime);
  const t = /T(\d{2}:\d{2})/.exec(datetime)?.[1];
  if (!d) return "";
  return `${d}${t ? ` ${t}` : ""}${t && endTime ? `〜${endTime}` : ""}`;
}

/** 期限の表示（"YYYY-MM-DD" は「10月25日（日）」に。それ以外は書いたまま） */
export function dueText(due: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(due.trim());
  if (!m) return due.trim();
  const w = WEEKDAYS[new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay()];
  return `${Number(m[2])}月${Number(m[3])}日（${w}）`;
}

/** 複数行の欄を項目のリストに（先頭の「・」「-」「1.」などは取る） */
export function toItems(s: string): string[] {
  return s
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[・\-*•●]|\d+[.)．）])\s*/, "").trim())
    .filter(Boolean);
}

/** 出席者は改行・読点・カンマで区切れる */
const people = (s: string) =>
  s
    .split(/[\n、,，]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .join("、");

const filledActions = (m: Minutes) => m.actions.filter((a) => a.who.trim() || a.what.trim() || a.due.trim());

export function minutesText(m: Minutes): string {
  const out: string[] = [];
  out.push(`■ ${m.title.trim() || "会議"} 議事録`, "");
  const when = minutesDateText(m.datetime, m.endTime);
  if (when) out.push(`日時：${when}`);
  if (m.place.trim()) out.push(`場所：${m.place.trim()}`);
  if (people(m.attendees)) out.push(`出席者：${people(m.attendees)}`);
  if (m.author.trim()) out.push(`記録者：${m.author.trim()}`);
  const section = (title: string, items: string[], numbered = false) => {
    if (!items.length) return;
    out.push("", `【${title}】`, ...items.map((x, i) => (numbered ? `${i + 1}. ${x}` : `・${x}`)));
  };
  section("議題", toItems(m.agenda), true);
  section("内容・議論", toItems(m.discussion));
  section("決定事項", toItems(m.decisions));
  const acts = filledActions(m);
  if (acts.length) {
    out.push("", "【宿題（担当・期限）】");
    for (const a of acts) out.push(`・${a.what.trim() || "（内容未定）"}　担当：${a.who.trim() || "未定"}　期限：${dueText(a.due) || "未定"}`);
  }
  if (m.next.trim()) out.push("", "【次回予定】", m.next.trim());
  return out.join("\n").trim() + "\n";
}

const mdCell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

export function minutesMarkdown(m: Minutes): string {
  const out: string[] = [];
  out.push(`# ${m.title.trim() || "会議"} 議事録`, "");
  const when = minutesDateText(m.datetime, m.endTime);
  if (when) out.push(`- **日時**：${when}`);
  if (m.place.trim()) out.push(`- **場所**：${m.place.trim()}`);
  if (people(m.attendees)) out.push(`- **出席者**：${people(m.attendees)}`);
  if (m.author.trim()) out.push(`- **記録者**：${m.author.trim()}`);
  const section = (title: string, items: string[], numbered = false) => {
    if (!items.length) return;
    out.push("", `## ${title}`, "", ...items.map((x, i) => (numbered ? `${i + 1}. ${x}` : `- ${x}`)));
  };
  section("議題", toItems(m.agenda), true);
  section("内容・議論", toItems(m.discussion));
  section("決定事項", toItems(m.decisions));
  const acts = filledActions(m);
  if (acts.length) {
    out.push("", "## 宿題", "", "| 内容 | 担当 | 期限 |", "| --- | --- | --- |");
    for (const a of acts) out.push(`| ${mdCell(a.what.trim() || "（内容未定）")} | ${mdCell(a.who.trim() || "未定")} | ${mdCell(dueText(a.due) || "未定")} |`);
  }
  if (m.next.trim()) out.push("", "## 次回予定", "", m.next.trim());
  return out.join("\n").trim() + "\n";
}

/* ---------- 時差を考慮した会議時間 ---------- */

export const PLANNER_CITIES: { name: string; zone: string }[] = [
  ...CITIES,
  { name: "台北", zone: "Asia/Taipei" },
  { name: "香港", zone: "Asia/Hong_Kong" },
  { name: "マニラ", zone: "Asia/Manila" },
  { name: "ジャカルタ", zone: "Asia/Jakarta" },
  { name: "ホーチミン", zone: "Asia/Ho_Chi_Minh" },
  { name: "ベルリン", zone: "Europe/Berlin" },
  { name: "アムステルダム", zone: "Europe/Amsterdam" },
  { name: "ヘルシンキ", zone: "Europe/Helsinki" },
  { name: "シカゴ", zone: "America/Chicago" },
  { name: "デンバー", zone: "America/Denver" },
  { name: "トロント", zone: "America/Toronto" },
  { name: "バンクーバー", zone: "America/Vancouver" },
  { name: "メキシコシティ", zone: "America/Mexico_City" },
  { name: "オークランド", zone: "Pacific/Auckland" },
];

export type Participant = {
  zone: string;
  label: string;
  start: number;
  end: number;
};

export type PlannerCell = {
  ymd: string;
  time: string;
  weekday: string;
  dayDiff: number;
  inHours: boolean;
  weekend: boolean;
  offsetLabel: string;
};
export type PlannerSlot = {
  epoch: number;
  baseHour: number;
  cells: PlannerCell[];
  allOk: boolean;
};

const minutesOf = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));
const dayNumber = (ymd: string) => Date.parse(`${ymd}T00:00:00Z`) / 86_400_000;

/** 開始時刻（分）から meetingMinutes 分の会議が業務時間（start〜end 時、日をまたぐ指定も可）に収まるか */
export function withinHours(startMin: number, meetingMinutes: number, start: number, end: number): boolean {
  const s = start * 60;
  const e = end * 60;
  const finish = startMin + meetingMinutes;
  if (s === e) return true;
  if (s < e) return startMin >= s && finish <= e;
  // 22時〜6時のように日をまたぐ
  return startMin >= s ? finish <= e + 1440 : finish <= e;
}

/**
 * 基準の場所（participants[0]）の ymd の0時〜23時の1時間ごとに、各地の現地時刻と、
 * 全員の業務時間に収まるかを出す。夏時間も Intl のタイムゾーン情報で反映する。
 */
export function planMeeting(ymd: string, participants: Participant[], meetingMinutes = 60, skipWeekend = true): PlannerSlot[] {
  if (!participants.length || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return [];
  const base = participants[0].zone;
  const seen = new Set<number>();
  const slots: PlannerSlot[] = [];
  for (let h = 0; h < 24; h++) {
    const epoch = zonedToEpoch(ymd, `${String(h).padStart(2, "0")}:00`, base);
    // 夏時間の切り替えで同じ時刻になる時間は1回だけ
    if (epoch === null || seen.has(epoch)) continue;
    seen.add(epoch);
    const cells = participants.map((p) => {
      const z = timeInZone(epoch, p.zone);
      const weekend = z.weekday === "土" || z.weekday === "日";
      return {
        ymd: z.ymd,
        time: z.time,
        weekday: z.weekday,
        dayDiff: dayNumber(z.ymd) - dayNumber(ymd),
        inHours: withinHours(minutesOf(z.time), meetingMinutes, p.start, p.end) && !(skipWeekend && weekend),
        weekend,
        offsetLabel: z.offsetLabel,
      };
    });
    slots.push({
      epoch,
      baseHour: h,
      cells,
      allOk: cells.every((c) => c.inHours),
    });
  }
  return slots;
}
