import { describe, expect, it } from "vitest";
import { decodeShare, encodeShare } from "@/components/useShareableState";
import { calcBmi, calcLoan } from "@/features/tools/calculator/finance/logic";
import { UNITS, convertTemp, convertUnit, formatNumber } from "@/features/tools/calculator/unit/logic";
import { schoolBaseYear, schoolTimeline, warekiYear } from "@/features/tools/date/school/logic";
import { qrSvg, wifiPayload } from "@/features/tools/generator/qr/logic";
import { clampBox, initialBox, resizeBox, rotatedSize, turnBy } from "@/features/tools/image/edit/logic";

const unit = (kind: keyof typeof UNITS, id: string) => UNITS[kind].find((u) => u.id === id)!;

describe("ローン返済", () => {
  it("元利均等：3000万円・年1.5%・35年", () => {
    const r = calcLoan({ amount: 30_000_000, annualRate: 1.5, years: 35, method: "annuity" })!;
    // 公式による毎月の返済額は 91,855.2… 円
    expect(r.firstPayment).toBe(91_855);
    expect(r.months).toBe(420);
    expect(r.yearly.at(-1)!.balance).toBe(0);
    expect(r.totalPayment - r.totalInterest).toBe(30_000_000);
  });
  it("元金均等は返済額が減っていき、利息の合計は元利均等より少ない", () => {
    const a = calcLoan({ amount: 30_000_000, annualRate: 1.5, years: 35, method: "annuity" })!;
    const p = calcLoan({ amount: 30_000_000, annualRate: 1.5, years: 35, method: "principal" })!;
    expect(p.firstPayment).toBe(71_429 + 37_500);
    expect(p.lastPayment).toBeLessThan(p.firstPayment);
    expect(p.totalInterest).toBeLessThan(a.totalInterest);
  });
  it("金利0%と不正な入力", () => {
    expect(calcLoan({ amount: 1_200_000, annualRate: 0, years: 1, method: "annuity" })).toMatchObject({ firstPayment: 100_000, totalInterest: 0 });
    expect(calcLoan({ amount: 0, annualRate: 1, years: 10, method: "annuity" })).toBeNull();
    expect(calcLoan({ amount: 100, annualRate: Number.NaN, years: 10, method: "annuity" })).toBeNull();
  });
});

describe("BMI", () => {
  it("判定の境目", () => {
    expect(calcBmi(170, 65)!.bmi).toBeCloseTo(22.49, 2);
    expect(calcBmi(100, 18.4)!.label).toBe("低体重");
    expect(calcBmi(100, 18.5)!.label).toBe("普通体重");
    expect(calcBmi(100, 25)!.label).toBe("肥満（1度）");
    expect(calcBmi(100, 40)!.label).toBe("肥満（4度）");
    expect(calcBmi(170, 65)!.standardWeight).toBeCloseTo(63.58, 2);
    expect(calcBmi(0, 60)).toBeNull();
  });
});

describe("単位変換", () => {
  it("長さ・面積・体積・温度", () => {
    expect(convertUnit(1, unit("length", "in"), unit("length", "cm"))).toBeCloseTo(2.54, 10);
    expect(convertUnit(1, unit("length", "shaku"), unit("length", "cm"))).toBeCloseTo(30.303, 3);
    expect(convertUnit(1, unit("area", "tsubo"), unit("area", "m2"))).toBeCloseTo(3.30579, 5);
    expect(convertUnit(1, unit("volume", "sho"), unit("volume", "go"))).toBeCloseTo(10, 10);
    expect(convertUnit(1, unit("volume", "go"), unit("volume", "ml"))).toBeCloseTo(180.39, 2);
    expect(convertUnit(1, unit("mass", "lb"), unit("mass", "g"))).toBeCloseTo(453.59237, 8);
    expect(convertTemp(100, "c", "f")).toBeCloseTo(212);
    expect(convertTemp(-40, "f", "c")).toBeCloseTo(-40);
    expect(convertTemp(0, "k", "c")).toBeCloseTo(-273.15);
  });
  it("表示の桁", () => {
    expect(formatNumber(30.30303030303)).toBe("30.3030303");
    expect(formatNumber(1e-9)).toBe("1e-9");
    expect(formatNumber(Number.NaN)).toBe("—");
  });
});

describe("入学・卒業年", () => {
  it("4月1日生まれまでは前の学年（早生まれ）", () => {
    expect(schoolBaseYear(2004, 4, 1)).toBe(2003);
    expect(schoolBaseYear(2004, 4, 2)).toBe(2004);
    expect(schoolBaseYear(2004, 1, 10)).toBe(2003);
  });
  it("2003年8月生まれの学歴", () => {
    const t = schoolTimeline(2003, 8, 15, 4);
    expect(t[0]).toEqual({ school: "小学校", kind: "入学", year: 2010, month: 4 });
    expect(t.find((e) => e.school === "高等学校" && e.kind === "卒業")!.year).toBe(2022);
    expect(t.at(-1)).toEqual({ school: "大学", kind: "卒業", year: 2026, month: 3 });
    expect(schoolTimeline(2003, 8, 15, 0)).toHaveLength(6);
  });
  it("和暦の年（元年・改元の月）", () => {
    expect(warekiYear(2019, 4)).toBe("平成31年");
    expect(warekiYear(2019, 5)).toBe("令和元年");
    expect(warekiYear(2026, 3)).toBe("令和8年");
    expect(warekiYear(1989, 4)).toBe("平成元年");
    expect(warekiYear(1988, 4)).toBe("昭和63年");
  });
});

describe("QRコード", () => {
  it("Wi-Fi の文字列（記号の前に \\）", () => {
    expect(wifiPayload("my;net", 'p"a:ss', "WPA")).toBe('WIFI:T:WPA;S:my\\;net;P:p\\"a\\:ss;;');
    expect(wifiPayload("Free", "", "nopass", true)).toBe("WIFI:T:nopass;S:Free;H:true;;");
  });
  it("SVG は黒いマスを線にまとめる", () => {
    const svg = qrSvg(2, (r, c) => r === 0 || c === 1, { margin: 1, fg: "#000", bg: "#fff" });
    expect(svg).toContain('viewBox="0 0 4 4"');
    expect(svg).toContain("M1 1h2v1h-2z");
    expect(svg).toContain("M2 2h1v1h-1z");
  });
});

describe("画像の切り抜き・回転", () => {
  it("比率に合わせた最初の枠と、はみ出さない移動・拡大", () => {
    expect(initialBox(1600, 900, 1)).toEqual({ x: 350, y: 0, w: 900, h: 900 });
    expect(initialBox(1000, 2000, 16 / 9)).toMatchObject({ x: 0, w: 1000 });
    expect(clampBox({ x: 900, y: -20, w: 300, h: 300 }, 1000, 1000)).toEqual({ x: 700, y: 0, w: 300, h: 300 });
    const b = resizeBox({ x: 100, y: 100, w: 200, h: 200 }, 5000, 260, 1000, 800, 1);
    expect(b).toEqual({ x: 100, y: 100, w: 700, h: 700 });
  });
  it("回転後の大きさと向き", () => {
    expect(rotatedSize(400, 300, 90)).toEqual({ width: 300, height: 400 });
    expect(turnBy(0, -90)).toBe(270);
    expect(turnBy(270, 90)).toBe(0);
  });
});

describe("共有リンク", () => {
  it("日本語や NaN を含んでも往復できる", () => {
    const v = [{ name: "佐藤", paid: 1200 }, { name: "🍣", paid: Number.NaN }];
    const back = decodeShare(encodeShare(v)) as typeof v;
    expect(back[0]).toEqual({ name: "佐藤", paid: 1200 });
    expect(back[1].name).toBe("🍣");
    expect(back[1].paid).toBeNaN();
    expect(encodeShare(v)).not.toMatch(/[+/=]/);
    expect(decodeShare("@@壊れた")).toBeUndefined();
  });
});
