import { describe, expect, it } from "vitest";
import { formatMinutes, readingPlan, scriptChars, speakingMinutes } from "@/features/tools/business/time/logic";
import { calcDiscount, calcPercent, numberStats, parseNumbers, roundAll, simplifyRatio, solveRatio, wariLabel } from "@/features/tools/calculator/basic/logic";
import { addDaysFrom, calcAge, dayInfo } from "@/features/tools/date/calendar/logic";
import { base64Decode, base64Encode, formatJson, htmlEscape, htmlUnescape, testRegex, urlDecode, urlEncode } from "@/features/tools/developer/encode/logic";
import { randomNumbers, uuidV4, uuidV7 } from "@/features/tools/generator/random/logic";
import { fromHourly, fromMonthly } from "@/features/tools/life/wage/logic";
import { cleanWhitespace, convertCase, convertKana, convertWidth, dedupeLines, replaceText } from "@/features/tools/text/convert/logic";
import { layoutManuscript } from "@/features/tools/text/manuscript-paper/logic";
import { changedRange, diffLines } from "@/features/tools/text/text-diff/logic";

describe("文章の変換", () => {
  it("ひらがな・カタカナ（半角カナ・濁点も）", () => {
    expect(convertKana("やまだ ｶﾞｯｺｳ", "toKatakana", true)).toBe("ヤマダ ガッコウ");
    expect(convertKana("ヴァイオリン", "toHiragana", false)).toBe("ゔぁいおりん");
  });
  it("全角・半角", () => {
    const o = { direction: "toHalf" as const, alnum: true, symbol: true, space: true, kana: false };
    expect(convertWidth("ＴＥＬ：０３－１２３４　ｶﾅ", o)).toBe("TEL:03-1234 カナ");
    expect(convertWidth("ガイド", { ...o, kana: true })).toBe("ｶﾞｲﾄﾞ");
    expect(convertWidth("A1 ", { ...o, direction: "toFull" })).toBe("Ａ１　");
  });
  it("大文字・小文字とプログラム用の書き方", () => {
    expect(convertCase("getUserName", "snake")).toBe("get_user_name");
    expect(convertCase("user profile image", "camel")).toBe("userProfileImage");
    expect(convertCase("hello world. bye", "sentence")).toBe("Hello world. Bye");
    expect(convertCase("HTTPServer error", "kebab")).toBe("http-server-error");
  });
  it("改行・空白の整理", () => {
    const base = { trimLines: true, collapseSpaces: true, fullWidthSpace: true, tabsToSpace: false, collapseBlankLines: true, removeBlankLines: false, joinParagraphLines: false, removeAllNewlines: false };
    expect(cleanWhitespace("  あ　　い  \n\n\n\nう", base)).toBe("あ い\n\nう");
    expect(cleanWhitespace("一行目が\n途中で切れる\n\n次", { ...base, joinParagraphLines: true })).toBe("一行目が途中で切れる\n\n次");
  });
  it("置換（通常・正規表現・複数ルール・不正なパターン）", () => {
    expect(replaceText("a.b.c", { find: ".", replace: "-", regex: false, ignoreCase: false, rules: "" })).toEqual({ text: "a-b-c", count: 2 });
    expect(replaceText("100-0005", { find: "(\\d{3})-(\\d{4})", replace: "$2/$1", regex: true, ignoreCase: false, rules: "" }).text).toBe("0005/100");
    expect(replaceText("東京 2025年", { find: "", replace: "", regex: false, ignoreCase: false, rules: "東京 → 東京都\n2025年 → 令和7年" }).text).toBe("東京都 令和7年");
    expect(replaceText("abc", { find: "(", replace: "", regex: true, ignoreCase: false, rules: "" }).error).toBeTruthy();
  });
  it("重複行の削除", () => {
    const o = { mode: "unique" as const, sort: "none" as const, trim: true, ignoreCase: true, removeBlank: true, showCount: false };
    expect(dedupeLines("A\n a\nb\n\nB\nc", o)).toEqual({ text: "A\nb\nc", before: 5, after: 3 });
    expect(dedupeLines("x\ny\nx", { ...o, mode: "duplicatesOnly" }).text).toBe("x");
  });
});

describe("原稿用紙", () => {
  it("字下げ・20字で折り返し・句読点のぶら下げ", () => {
    const m = layoutManuscript("あ".repeat(19) + "。い", 20, true);
    // 字下げ1マス + 19字 = 20マス。次の「。」は行頭に来るので前の行にぶら下げる
    expect(m.lines[0]).toHaveLength(20);
    expect(m.lines[0][19]).toBe("あ。");
    expect(m.lines[1]).toEqual(["い"]);
    expect(m).toMatchObject({ pages: 1, lastPageRows: 2, chars: 21 });
  });
  it("空なら0枚、200字詰めは10行で1枚", () => {
    expect(layoutManuscript("", 20, true).pages).toBe(0);
    expect(layoutManuscript("あ\n".repeat(11).trim(), 10, false).pages).toBe(2);
  });
});

describe("テキスト比較", () => {
  it("追加・削除・同じ行を出す", () => {
    const ops = diffLines("a\nb\nc", "a\nB\nc\nd")!;
    expect(ops.map((o) => o.type)).toEqual(["same", "removed", "added", "same", "added"]);
  });
  it("書き換えた部分の位置", () => {
    expect(changedRange("料金は月額10,000円", "料金は月額12,000円")).toEqual({ a: [6, 7], b: [6, 7] });
  });
});

describe("計算", () => {
  it("割引（二重割引と割・分）", () => {
    const r = calcDiscount(10000, 20, 10);
    expect(r.discounted).toBe(7200);
    expect(r.effectiveRate).toBeCloseTo(28);
    expect(r.label).toBe("2割8分引き");
    expect(wariLabel(25)).toBe("2割5分引き");
    expect(wariLabel(0)).toBe("割引なし");
  });
  it("割合", () => {
    expect(calcPercent(30, 120, 15)).toMatchObject({ aOfB: 25, xOfB: 18, changeRate: 300, diff: 90, baseFromA: 200 });
  });
  it("比率", () => {
    expect(solveRatio(16, 9, 1920)).toBe(1080);
    expect(simplifyRatio(1920, 1080)).toEqual([16, 9]);
    expect(simplifyRatio(1.5, 2)).toEqual([3, 4]);
    expect(simplifyRatio(0, 2)).toBeNull();
  });
  it("平均など（桁区切りのカンマを1つの数として読む）", () => {
    expect(parseNumbers("1,200\n300, 400、５００")).toEqual([1200, 300, 400, 500]);
    const s = numberStats([2, 4, 4, 4, 5, 5, 7, 9])!;
    expect(s).toMatchObject({ count: 8, sum: 40, mean: 5, median: 4.5, sdPopulation: 2, modes: [4] });
    expect(numberStats([])).toBeNull();
  });
  it("四捨五入（浮動小数点の誤差・マイナス・偶数丸め）", () => {
    expect(roundAll(1.005, 2).halfUp).toBe(1.01);
    expect(roundAll(-2.5, 0)).toMatchObject({ halfUp: -3, down: -2, up: -3, halfEven: -2 });
    expect(roundAll(1234, -2).halfUp).toBe(1200);
    expect(roundAll(2.55, 1).fiveDownSixUp).toBe(2.5);
  });
});

describe("日付", () => {
  it("○日後と祝日", () => {
    const r = addDaysFrom("2026-04-25", 10)!;
    expect(r.holiday).toBe("こどもの日");
    expect(r.weekday).toBe("火曜日");
    expect(addDaysFrom("不正", 1)).toBeNull();
  });
  it("曜日と第何曜日・何日目", () => {
    expect(dayInfo(new Date(2026, 9, 12))).toMatchObject({ weekday: "月曜日", holiday: "スポーツの日", nthWeekday: "第2月曜日", dayOfYear: 285 });
  });
  it("年齢（誕生日の前日・当日）", () => {
    expect(calcAge("1990-10-19", "2026-10-18")).toMatchObject({ years: 35, kazoe: 37 });
    expect(calcAge("1990-10-19", "2026-10-19")).toMatchObject({ years: 36, months: 0, days: 0, daysToBirthday: 0, eto: "午年", zodiac: "天秤座" });
    expect(calcAge("2030-01-01", "2026-01-01")).toBeNull();
  });
});

describe("生成", () => {
  it("重複なしの乱数", () => {
    const r = randomNumbers({ min: 1, max: 10, count: 10, decimals: 0, unique: true, sort: true });
    expect("values" in r && r.values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(randomNumbers({ min: 1, max: 3, count: 5, decimals: 0, unique: true, sort: false })).toHaveProperty("error");
    expect(randomNumbers({ min: 5, max: 1, count: 1, decimals: 0, unique: false, sort: false })).toHaveProperty("error");
  });
  it("UUIDの形式とバージョン", () => {
    expect(uuidV4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    const v7 = uuidV7(0x0192_3456_789a);
    expect(v7).toMatch(/^01923456-789a-7[0-9a-f]{3}-[89ab]/);
  });
});

describe("開発者向けの変換", () => {
  it("JSONの整形とエラー位置", () => {
    expect(formatJson('{"a":[1,2]}', 2)).toEqual({ ok: true, text: '{\n  "a": [\n    1,\n    2\n  ]\n}' });
    expect(formatJson('{ "a": 1 }', "minify")).toEqual({ ok: true, text: '{"a":1}' });
    const bad = formatJson('{\n  "a": 1,\n}', 2);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.line).toBe(3);
  });
  it("URL・Base64・HTML（日本語も往復できる）", () => {
    expect(urlEncode("無料 ツール")).toEqual({ ok: true, text: "%E7%84%A1%E6%96%99%20%E3%83%84%E3%83%BC%E3%83%AB" });
    expect(urlDecode("%E7%84%A1%E6%96%99+a")).toEqual({ ok: true, text: "無料 a" });
    expect(urlDecode("%E7%84").ok).toBe(false);
    const b = base64Encode("こんにちは");
    expect(b).toEqual({ ok: true, text: "44GT44KT44Gr44Gh44Gv" });
    expect(base64Decode("44GT44KT44Gr44Gh44Gv")).toEqual({ ok: true, text: "こんにちは" });
    expect(base64Decode("!!!").ok).toBe(false);
    expect(htmlEscape(`<a href="x">&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;");
    expect(htmlUnescape("&lt;b&gt;&#x3042;&#12354;&amp;&unknown;")).toBe("<b>ああ&&unknown;");
  });
  it("正規表現（一致・グループ・置換・不正なパターン）", () => {
    const r = testRegex("(\\d{3})-(\\d{4})", "g", "〒100-0005 と 〒530-0001", "$2");
    expect(r.ok && r.matches.map((m) => m.groups[0])).toEqual(["100", "530"]);
    expect(r.ok && r.replaced).toBe("〒0005 と 〒0001");
    expect(testRegex("(", "g", "x").ok).toBe(false);
    expect(testRegex("", "g", "x")).toEqual({ ok: true, matches: [] });
  });
});

describe("お金・ビジネス", () => {
  it("時給と月給", () => {
    expect(fromHourly(1200, { hoursPerDay: 8, daysPerMonth: 20, bonusMonths: 0 })).toMatchObject({ daily: 9600, monthly: 192000, yearly: 2304000 });
    expect(fromMonthly(240000, { hoursPerDay: 8, daysPerMonth: 20, bonusMonths: 2 })).toMatchObject({ hourly: 1500, yearly: 3360000 });
  });
  it("話す時間・読む時間", () => {
    expect(scriptChars("あい う\nえ")).toBe(4);
    expect(formatMinutes(speakingMinutes(1500, 300))).toBe("5分");
    expect(formatMinutes(2.5)).toBe("2分30秒");
    expect(readingPlan(320, 600, 600, 30)).toMatchObject({ chars: 192000, minutes: 320, days: 11 });
  });
});
