import { describe, expect, it } from "vitest";
import { calcAchievement, calcProgress, calcStudy, monthBusinessDays, monthCalendarDays } from "@/features/tools/business/progress/logic";
import { addMonthsYm, calcCompound, calcOvertime, metersToSteps, monthsToGoal, monthsUntil, requiredMonthly, stepsToMeters, strideFromHeight, walkMinutes } from "@/features/tools/life/plan/logic";

describe("複利計算", () => {
  it("元本100万円・年12%・1年（月複利）は 1,000,000 × 1.01^12", () => {
    const r = calcCompound({ principal: 1_000_000, monthly: 0, annualRate: 12, years: 1 })!;
    expect(r.final).toBeCloseTo(1_126_825.03, 1);
    expect(r.contributed).toBe(1_000_000);
    expect(r.yearly).toHaveLength(1);
  });
  it("毎月1万円・年6%・10年（月末積立）は年金終価の公式どおり", () => {
    const r = calcCompound({ principal: 0, monthly: 10_000, annualRate: 6, years: 10 })!;
    expect(r.final).toBeCloseTo(1_638_793.47, 1);
    expect(r.contributed).toBe(1_200_000);
    expect(r.gain).toBeCloseTo(438_793.47, 1);
    expect(r.yearly).toHaveLength(10);
  });
  it("利率0%は入れた額のまま、不正な入力は null", () => {
    expect(calcCompound({ principal: 100, monthly: 10, annualRate: 0, years: 1 })!.final).toBe(220);
    expect(calcCompound({ principal: 0, monthly: 0, annualRate: 3, years: 10 })).toBeNull();
    expect(calcCompound({ principal: 100, monthly: 0, annualRate: Number.NaN, years: 10 })).toBeNull();
  });
});

describe("貯金目標", () => {
  it("100万円を24か月・利息なし → 毎月41,667円（切り上げ）", () => {
    expect(requiredMonthly({ target: 1_000_000, current: 0, months: 24, annualRate: 0 })!.monthly).toBe(41_667);
  });
  it("年1%の利息があると少なくてすむ", () => {
    const r = requiredMonthly({ target: 1_000_000, current: 0, months: 24, annualRate: 1 })!;
    expect(r.monthly).toBe(41_269);
    expect(r.final).toBeGreaterThanOrEqual(1_000_000);
  });
  it("今の貯金で足りていれば0円", () => {
    expect(requiredMonthly({ target: 500_000, current: 600_000, months: 12, annualRate: 0 })!.monthly).toBe(0);
  });
  it("毎月3万円で100万円（今10万円）→ 30か月", () => {
    expect(monthsToGoal({ target: 1_000_000, current: 100_000, monthly: 30_000, annualRate: 0 })).toEqual({ months: 30, balance: 1_000_000 });
    expect(monthsToGoal({ target: 1_000_000, current: 0, monthly: 0, annualRate: 0 })).toBeNull();
  });
  it("年月の計算", () => {
    expect(addMonthsYm("2026-10-19", 30)).toEqual({ year: 2029, month: 4 });
    expect(addMonthsYm("2026-12-01", 1)).toEqual({ year: 2027, month: 1 });
    expect(monthsUntil("2026-10-19", "2027-03-01")).toBe(5);
  });
});

describe("残業代", () => {
  it("時給1,500円・時間外20時間 → 37,500円", () => {
    expect(calcOvertime(1500, { ot: 20, otNight: 0, holiday: 0, holidayNight: 0, nightOnly: 0 })!.total).toBe(37_500);
  });
  it("時間外70時間なら、60時間を超えた10時間は1.5倍", () => {
    const r = calcOvertime(1500, { ot: 70, otNight: 0, holiday: 0, holidayNight: 0, nightOnly: 0 })!;
    expect(r.over60Hours).toBe(10);
    expect(r.total).toBe(1500 * (60 * 1.25 + 10 * 1.5));
  });
  it("深夜・法定休日の割増", () => {
    const r = calcOvertime(1500, { ot: 0, otNight: 10, holiday: 8, holidayNight: 2, nightOnly: 4 })!;
    expect(r.rows.map((x) => x.amount)).toEqual([0, 22_500, 0, 16_200, 4_800, 1_500]);
    expect(r.total).toBe(45_000);
  });
  it("時間外かつ深夜が60時間を超えると1.75倍になる", () => {
    const r = calcOvertime(1000, { ot: 0, otNight: 61, holiday: 0, holidayNight: 0, nightOnly: 0 })!;
    expect(r.total).toBe(60 * 1500 + 1750);
    expect(calcOvertime(0, { ot: 1, otNight: 0, holiday: 0, holidayNight: 0, nightOnly: 0 })).toBeNull();
  });
});

describe("歩数・距離", () => {
  it("身長170cm → 歩幅76.5cm、1万歩は7.65km", () => {
    const s = strideFromHeight(170);
    expect(s).toBeCloseTo(76.5, 6);
    expect(stepsToMeters(10_000, s)).toBeCloseTo(7650, 6);
    expect(metersToSteps(7650, s)).toBe(10_000);
    expect(walkMinutes(800)).toBe(10);
  });
});

describe("目標達成率", () => {
  it("目標100万・実績45万・20日中12日", () => {
    const r = calcAchievement({ target: 1_000_000, actual: 450_000, elapsed: 12, total: 20 })!;
    expect(r.rate).toBeCloseTo(45, 6);
    expect(r.timeRate).toBeCloseTo(60, 6);
    expect(r.projected).toBeCloseTo(750_000, 6);
    expect(r.requiredPerDay).toBeCloseTo(68_750, 6);
    expect(calcAchievement({ target: 100, actual: 10, elapsed: 0, total: 20 })).toBeNull();
  });
  it("2026年10月の営業日は21日（スポーツの日を除く）、19日までに12日", () => {
    expect(monthBusinessDays("2026-10-19")).toEqual({ elapsed: 12, total: 21 });
    expect(monthCalendarDays("2026-02-10")).toEqual({ elapsed: 10, total: 28 });
  });
});

describe("進捗率", () => {
  it("10日で100のうち30 → 1日3、完了予定は24日後", () => {
    const r = calcProgress({ total: 100, done: 30, start: "2026-10-10", today: "2026-10-19", deadline: "2026-10-31" })!;
    expect(r.rate).toBe(30);
    expect(r.elapsedDays).toBe(10);
    expect(r.pace).toBe(3);
    expect(r.daysLeft).toBe(24);
    expect(r.finishDate).toBe("2026-11-12");
    expect(r.daysToDeadline).toBe(12);
    expect(r.requiredPerDay).toBeCloseTo(70 / 12, 6);
  });
  it("終わっていない・開始日が未来", () => {
    expect(calcProgress({ total: 10, done: 0, start: "2026-10-10", today: "2026-10-19" })!.finishDate).toBeNull();
    expect(calcProgress({ total: 10, done: 1, start: "2026-10-20", today: "2026-10-19" })).toBeNull();
  });
});

describe("学習時間", () => {
  it("今日（月）から1週間後の試験、日曜は休み → 6日で割る", () => {
    const r = calcStudy({ exam: "2026-10-26", today: "2026-10-19", totalHours: 60, doneHours: 0, restWeekdays: [0], includeToday: true })!;
    expect(r.days).toBe(7);
    expect(r.studyDays).toBe(6);
    expect(r.perDay).toBe(10);
    expect(r.perWeek).toBe(60);
  });
  it("今日を含めない・勉強済みの時間を引く", () => {
    const r = calcStudy({ exam: "2026-10-26", today: "2026-10-19", totalHours: 60, doneHours: 6, restWeekdays: [], includeToday: false })!;
    expect(r.studyDays).toBe(6);
    expect(r.perDay).toBe(9);
    expect(calcStudy({ exam: "2026-10-19", today: "2026-10-19", totalHours: 60, doneHours: 0, restWeekdays: [], includeToday: true })).toBeNull();
  });
});
