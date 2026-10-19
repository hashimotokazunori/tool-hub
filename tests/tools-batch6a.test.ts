import { describe, expect, it } from "vitest";
import { analyzeLines, countSentences, numberedText } from "@/features/tools/text/lines/logic";
import { convertTime, describeCron, describeField, formatHms, formatJa, nextRuns, parseCron, parseDuration, sumDurations, type Cron } from "@/features/tools/developer/schedule/logic";
import { LOREM_START, MAIL_TEMPLATES, countForSns, fillMail, findHashtags, formatDummy, generateDummyRows, generateDummyText, graphemeCount, mailDate } from "@/features/tools/generator/content/logic";
import { EMPTY_MINUTES, minutesMarkdown, minutesText, planMeeting, withinHours, type Minutes } from "@/features/tools/business/meeting/logic";

describe("行数・段落数カウント", () => {
  it("行・空行・段落を数える（最後の改行のあとは数えない）", () => {
    const s = analyzeLines("a\nb\n\nc\n");
    expect(s).toMatchObject({ lines: 4, nonEmpty: 3, blank: 1, paragraphs: 2 });
    expect(analyzeLines("").lines).toBe(0);
    expect(analyzeLines("a\r\nb").lines).toBe(2);
  });
  it("平均といちばん長い行", () => {
    const s = analyzeLines("ab\nabcd\nabc");
    expect(s.averageLength).toBe(3);
    expect(s.longestLine).toBe(2);
    expect(s.longestLength).toBe(4);
  });
  it("文の数（小数点では区切らない）", () => {
    expect(countSentences("今日は晴れ。明日は雨！本当？")).toBe(3);
    expect(countSentences("Pi is 3.14. Yes!")).toBe(2);
    expect(countSentences("「はい。」と言った。")).toBe(2);
    expect(countSentences("区切りなし")).toBe(1);
  });
  it("行番号付き", () => {
    expect(numberedText("a\n\nb")).toBe("1: a\n2: \n3: b");
    expect(numberedText("a\n\nb", true)).toBe("1: a\n\n2: b");
  });
});

describe("時間・分・秒変換", () => {
  it("単位を変換する", () => {
    const c = convertTime(90, "min")!;
    expect(c.h).toBe(1.5);
    expect(c.s).toBe(5400);
    expect(convertTime(1, "w")!.d).toBe(7);
  });
  it("h:mm:ss と10進数の時間", () => {
    expect(formatHms(6300)).toBe("1:45:00");
    expect(formatHms(6300, false)).toBe("1:45");
    expect(formatHms(99_000, false)).toBe("27:30");
    expect(formatJa(90_061)).toBe("1日1時間1分1秒");
    for (const s of ["1:45", "1.75", "1時間45分", "105分", "1h45m", "1:45:00"]) expect(parseDuration(s)).toBe(6300);
    expect(parseDuration("１：３０")).toBe(5400);
    expect(parseDuration("1:75")).toBeNull();
    expect(parseDuration("abc")).toBeNull();
  });
  it("時間を合計する", () => {
    const r = sumDurations("1:30, 0:45\n2時間\nあ");
    expect(r.total).toBe(15_300);
    expect(r.invalid).toBe(1);
    expect(formatHms(r.total, false)).toBe("4:15");
  });
});

const cron = (s: string) => {
  const c = parseCron(s);
  if ("error" in c) throw new Error(c.error);
  return c as Cron;
};

describe("cron式", () => {
  it("読み取りと日本語の説明", () => {
    const c = cron("0 9 * * 1-5");
    expect(c.fields.dow.values).toEqual([1, 2, 3, 4, 5]);
    expect(describeCron(c)).toBe("毎週 月曜〜金曜 9:00に実行");
    expect(describeCron(cron("*/15 * * * *"))).toBe("毎日 15分ごとに実行");
    expect(describeCron(cron("0 0 1 * *"))).toBe("毎月 1日 0:00に実行");
    expect(describeField(cron("*/15 * * * *").fields.minute, "minute")).toBe("15分ごと");
    expect(cron("0 0 * JAN MON").fields.month.values).toEqual([1]);
    expect(cron("0 0 * * 7").fields.dow.values).toEqual([0]);
    expect(cron("@daily").expr).toBe("0 0 * * *");
  });
  it("エラー", () => {
    expect(parseCron("0 9 * *")).toHaveProperty("error");
    expect((parseCron("60 * * * *") as { error: string }).error).toContain("範囲外");
    expect(parseCron("0 0 * * 1-")).toHaveProperty("error");
    expect(parseCron("*/0 * * * *")).toHaveProperty("error");
    expect(parseCron("5-1 * * * *")).toHaveProperty("error");
  });
  it("次の実行日時（日本時間）", () => {
    // 2026-10-17（土）0:00 JST から → 10/19（月）9:00 JST
    const from = Date.UTC(2026, 9, 16, 15, 0);
    expect(nextRuns(cron("0 9 * * 1-5"), from, 2, 540)).toEqual([Date.UTC(2026, 9, 19, 0, 0), Date.UTC(2026, 9, 20, 0, 0)]);
    expect(nextRuns(cron("*/15 * * * *"), Date.UTC(2026, 0, 1, 10, 7), 2, 0)).toEqual([Date.UTC(2026, 0, 1, 10, 15), Date.UTC(2026, 0, 1, 10, 30)]);
  });
  it("日と曜日の両方を指定すると「どちらか」、* で始まれば「かつ」", () => {
    const from = Date.UTC(2026, 9, 1, 0, 0); // 10/1（木）
    const days = (s: string) => nextRuns(cron(s), from, 4, 0).map((t) => new Date(t).getUTCDate());
    expect(days("0 0 13 * 5")).toEqual([2, 9, 13, 16]);
    expect(days("0 0 */2 * 5")[0]).toBe(9);
    expect(nextRuns(cron("0 0 30 2 *"), from, 3, 0)).toEqual([]);
  });
});

describe("ダミーデータ・ダミー文章", () => {
  it("架空のデータを作る", () => {
    const [r] = generateDummyRows(3, () => 0);
    expect(r).toEqual({
      id: "0001",
      name: "佐藤 翔太",
      kana: "サトウ ショウタ",
      email: "shota.sato0001@example.com",
      phone: "090-0000-0000",
      zip: "000-0000",
      prefecture: "北海道",
      birthday: "1950-01-01",
      company: "サンプル商事株式会社",
    });
    const many = generateDummyRows(5000);
    expect(many).toHaveLength(1000);
    for (const x of many) {
      expect(x.email).toMatch(/@example\.(com|jp)$/);
      expect(x.phone).toMatch(/^0[789]0-0000-\d{4}$/);
      expect(x.zip).toMatch(/^000-\d{4}$/);
      expect(x.birthday >= "1950-01-01" && x.birthday <= "2006-12-31").toBe(true);
    }
  });
  it("CSV・JSONに出力する", () => {
    const [r] = generateDummyRows(1, () => 0);
    const csv = formatDummy([{ ...r, name: 'a,"b"' }], ["id", "name"], "csv");
    expect(csv).toBe('ID,氏名\r\n0001,"a,""b"""');
    expect(JSON.parse(formatDummy([r], ["id", "zip"], "json"))).toEqual([{ id: "0001", zip: "000-0000" }]);
    expect(formatDummy([r], ["id", "zip"], "tsv", false)).toBe("0001\t000-0000");
  });
  it("ダミー文章", () => {
    for (const count of [1, 2, 37, 100, 500]) {
      const ja = generateDummyText({ lang: "ja", unit: "chars", count });
      expect([...ja]).toHaveLength(count);
      expect(ja.endsWith("。")).toBe(true);
      const en = generateDummyText({ lang: "lorem", unit: "chars", count });
      expect([...en]).toHaveLength(count);
      expect(en.endsWith(".")).toBe(true);
    }
    expect(generateDummyText({ lang: "ja", unit: "sentences", count: 3 }).match(/。/g)).toHaveLength(3);
    expect(generateDummyText({ lang: "ja", unit: "paragraphs", count: 2 }).split("\n\n")).toHaveLength(2);
    expect(generateDummyText({ lang: "lorem", unit: "sentences", count: 1 })).toBe(LOREM_START);
  });
});

describe("SNS投稿文字数チェック", () => {
  it("Xの数え方と見た目の文字数", () => {
    expect(countForSns("あいう", "x")).toBe(6);
    expect(countForSns("abc https://example.com/x", "x")).toBe(27);
    expect(graphemeCount("👨‍👩‍👧a")).toBe(2);
  });
  it("ハッシュタグ", () => {
    expect(findHashtags("今日は #晴れ と ＃散歩 、mail#no #a_b")).toEqual(["#晴れ", "#散歩", "#a_b"]);
  });
});

describe("メール文面テンプレート", () => {
  it("入力内容を入れる", () => {
    const t = MAIL_TEMPLATES.find((x) => x.id === "request")!;
    const m = fillMail(t, {
      company: "テスト株式会社",
      name: "山田 太郎 様",
      myCompany: "",
      me: "佐藤",
      date: "2026-10-23",
      content: "見積書の送付",
    });
    expect(m.subject).toBe("【ご依頼】見積書の送付のお願い");
    expect(m.body.startsWith("テスト株式会社\n山田 太郎様\n")).toBe(true);
    expect(m.body).toContain("佐藤です。");
    expect(m.body).toContain("10月23日（金）までに");
    expect(m.body).not.toMatch(/\{\w+\}/);
  });
  it("空の欄は〇〇のまま", () => {
    for (const t of MAIL_TEMPLATES) {
      const m = fillMail(t, {
        company: "",
        name: "",
        myCompany: "",
        me: "",
        date: "",
        content: "",
      });
      expect(m.body).toContain("〇〇様");
      expect(m.body + m.subject).not.toMatch(/\{\w+\}/);
    }
    expect(mailDate("")).toBe("〇月〇日");
  });
});

describe("議事録・会議時間", () => {
  const m: Minutes = {
    ...EMPTY_MINUTES,
    title: "定例",
    datetime: "2026-10-19T14:00",
    endTime: "15:00",
    attendees: "山田、佐藤\n鈴木",
    agenda: "・予算\n2. 採用",
    decisions: "案Aで進める",
    actions: [
      { who: "山田", what: "見積を取る", due: "2026-10-23" },
      { who: "", what: "", due: "" },
    ],
  };
  it("テキストの議事録", () => {
    const t = minutesText(m);
    expect(t).toContain("■ 定例 議事録");
    expect(t).toContain("日時：2026年10月19日（月） 14:00〜15:00");
    expect(t).toContain("出席者：山田、佐藤、鈴木");
    expect(t).toContain("【議題】\n1. 予算\n2. 採用");
    expect(t).toContain("・見積を取る　担当：山田　期限：10月23日（金）");
    expect(t).not.toContain("場所");
  });
  it("Markdownの議事録", () => {
    const md = minutesMarkdown(m);
    expect(md.startsWith("# 定例 議事録")).toBe(true);
    expect(md).toContain("| 見積を取る | 山田 | 10月23日（金） |");
    expect(md).toContain("## 決定事項\n\n- 案Aで進める");
  });
  it("業務時間に収まるか", () => {
    expect(withinHours(9 * 60, 60, 9, 18)).toBe(true);
    expect(withinHours(17 * 60 + 30, 60, 9, 18)).toBe(false);
    expect(withinHours(23 * 60, 60, 22, 6)).toBe(true);
    expect(withinHours(60, 60, 22, 6)).toBe(true);
    expect(withinHours(5 * 60 + 30, 60, 22, 6)).toBe(false);
  });
  it("時差と夏時間を反映する", () => {
    const tokyo = { zone: "Asia/Tokyo", label: "東京", start: 9, end: 18 };
    const london = {
      zone: "Europe/London",
      label: "ロンドン",
      start: 9,
      end: 18,
    };
    expect(planMeeting("2026-01-15", [tokyo, london]).filter((s) => s.allOk)).toHaveLength(0);
    const winter = planMeeting("2026-01-15", [tokyo, { ...london, start: 8 }]).filter((s) => s.allOk);
    expect(winter.map((s) => s.baseHour)).toEqual([17]);
    expect(winter[0].cells[1].time).toBe("08:00");
    const summer = planMeeting("2026-07-15", [tokyo, london]);
    expect(summer[17].cells[1].time).toBe("09:00");
    expect(summer.filter((s) => s.allOk).map((s) => s.baseHour)).toEqual([17]);
    const ny = planMeeting("2026-01-15", [tokyo, { zone: "America/New_York", label: "NY", start: 9, end: 18 }]);
    expect(ny[9].cells[1]).toMatchObject({
      time: "19:00",
      dayDiff: -1,
      weekday: "水",
    });
  });
});
