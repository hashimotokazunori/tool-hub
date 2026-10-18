import { describe, expect, it } from "vitest";
import { calcTax } from "@/features/tools/calculator/consumption-tax/logic";
import { daysBetween } from "@/features/tools/date/days-between/logic";
import { charsets, entropyBits, generatePassword, type PasswordOptions } from "@/features/tools/generator/password-generator/logic";
import { calcWarikan } from "@/features/tools/life/warikan/logic";
import { countText, xWeightedCount } from "@/features/tools/text/character-counter/logic";
import { japaneseHolidays } from "@/lib/date";
import { normalize, makeItem, search } from "@/lib/search";

describe("文字数カウンター", () => {
  it("空の入力でも壊れない", () => {
    expect(countText("")).toMatchObject({ chars: 0, lines: 0, paragraphs: 0, bytes: 0, manuscriptPages: 0, xCount: 0 });
  });
  it("改行・空白・絵文字を正しく数える", () => {
    const c = countText("あいう えお\r\n😀abc\n\n次の段落");
    // CRLF は1つの改行として数える。絵文字は1文字
    expect(c.chars).toBe(17);
    expect(c.charsNoNewline).toBe(14);
    expect(c.charsNoSpace).toBe(13);
    expect(c.lines).toBe(4);
    expect(c.paragraphs).toBe(2);
  });
  it("原稿用紙は20字で1行、20行で1枚", () => {
    expect(countText("あ".repeat(400)).manuscriptPages).toBe(1);
    expect(countText("あ".repeat(401)).manuscriptPages).toBe(2);
  });
  it("Xの数え方（全角2・半角1・URLは23）", () => {
    expect(xWeightedCount("あいうabc https://example.com/very/long/path")).toBe(6 + 4 + 23);
  });
});

describe("消費税計算", () => {
  it("税抜から税込（10%・切り捨て）", () => {
    expect(calcTax({ amount: 1980, basis: "excluded", rate: 10, rounding: "floor" })).toEqual({ excluded: 1980, tax: 198, included: 2178 });
  });
  it("税込から税抜（8%）", () => {
    expect(calcTax({ amount: 1080, basis: "included", rate: 8, rounding: "floor" })).toEqual({ excluded: 1000, tax: 80, included: 1080 });
  });
  it("端数処理の違い", () => {
    expect(calcTax({ amount: 105, basis: "excluded", rate: 10, rounding: "floor" }).tax).toBe(10);
    expect(calcTax({ amount: 105, basis: "excluded", rate: 10, rounding: "round" }).tax).toBe(11);
    expect(calcTax({ amount: 101, basis: "excluded", rate: 10, rounding: "ceil" }).tax).toBe(11);
  });
  it("不正な入力は0として扱う", () => {
    expect(calcTax({ amount: Number.NaN, basis: "excluded", rate: 10, rounding: "floor" })).toEqual({ excluded: 0, tax: 0, included: 0 });
    expect(calcTax({ amount: -500, basis: "excluded", rate: 10, rounding: "floor" }).included).toBe(0);
  });
});

describe("割り勘計算", () => {
  it("100円単位に切り上げて余りを出す", () => {
    expect(calcWarikan({ total: 23500, people: 6, unit: 100, heavyPayers: 0, ratio: 1 })).toMatchObject({ perPerson: 4000, collected: 24000, surplus: 500 });
  });
  it("多めに払う人がいる傾斜配分", () => {
    const r = calcWarikan({ total: 23500, people: 6, unit: 100, heavyPayers: 1, ratio: 1.5 });
    expect(r).toMatchObject({ perPerson: 3700, perHeavyPayer: 5500, collected: 24000, surplus: 500 });
  });
  it("人数0や空欄でも壊れない", () => {
    expect(calcWarikan({ total: 1000, people: 0, unit: 1, heavyPayers: 0, ratio: 1 }).perPerson).toBe(1000);
  });
});

describe("パスワード生成", () => {
  const o: PasswordOptions = { length: 20, upper: true, lower: true, digits: true, symbols: true, excludeAmbiguous: true };
  it("指定した長さで、選んだ文字種をすべて含む", () => {
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword(o);
      expect(pw).toHaveLength(20);
      for (const set of charsets(o)) expect([...pw].some((c) => set.includes(c))).toBe(true);
      expect(pw).not.toMatch(/[0Oo1lI]/);
    }
  });
  it("文字種を選ばないと空", () => {
    expect(generatePassword({ ...o, upper: false, lower: false, digits: false, symbols: false })).toBe("");
  });
  it("強さのビット数", () => {
    expect(entropyBits({ length: 16, upper: false, lower: true, digits: false, symbols: false, excludeAmbiguous: false })).toBe(Math.round(16 * Math.log2(26)));
  });
});

describe("日数計算と日本の祝日", () => {
  it("2026年の祝日（振替休日・国民の休日を含む）", () => {
    const h = japaneseHolidays(2026);
    expect(h.get("2026-05-06")).toBe("振替休日");
    expect(h.get("2026-09-22")).toBe("国民の休日");
    expect(h.get("2026-03-20")).toBe("春分の日");
    expect(h.get("2026-09-23")).toBe("秋分の日");
    expect(h.size).toBe(18);
  });
  it("2019年の改元の休日", () => {
    const h = japaneseHolidays(2019);
    for (const d of ["2019-04-30", "2019-05-01", "2019-05-02", "2019-05-06"]) expect(h.has(d)).toBe(true);
  });
  it("日数・平日・営業日", () => {
    const r = daysBetween("2026-04-27", "2026-05-08")!;
    expect(r.days).toBe(11);
    expect(r.inclusiveDays).toBe(12);
    expect(r.weekdays).toBe(10);
    // 4/29 昭和の日、5/4〜5/6 は平日の祝日
    expect(r.businessDays).toBe(6);
  });
  it("終了日が前でも、不正な日付でも壊れない", () => {
    expect(daysBetween("2026-12-31", "2026-01-01")!.days).toBe(-364);
    expect(daysBetween("2026-02-30", "2026-03-01")).toBeNull();
    expect(daysBetween("", "2026-03-01")).toBeNull();
  });
});

describe("サイト内検索", () => {
  it("全角・カタカナの違いを吸収する", () => {
    expect(normalize("ＰＤＦ カタカナ")).toBe("pdf かたかな");
    const items = [makeItem("ツール", "文字数カウンター", "文字数を数える", "/tools/character-counter/"), makeItem("ツール", "消費税計算", "税込・税抜", "/tools/consumption-tax/")];
    expect(search(items, "もじすう").length).toBe(0);
    expect(search(items, "カウンター")[0].href).toBe("/tools/character-counter/");
    expect(search(items, "税込")[0].href).toBe("/tools/consumption-tax/");
  });
});
