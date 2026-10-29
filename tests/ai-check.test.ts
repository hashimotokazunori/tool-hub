import { describe, expect, it } from "vitest";
import { checkAnswer, detectKind, normalize } from "@/features/tools/calculator/ai-check/logic";

describe("AIの答えの検算", () => {
  it("全角数字・カンマ・万を読める形にする", () => {
    expect(normalize("合計２万３５００円、1,980円")).toBe("合計23500円、1980円");
  });

  it("種類を見分ける", () => {
    expect(detectKind("6人で割り勘すると1人あたり4000円です")).toBe("warikan");
    expect(detectKind("税抜1980円の消費税は198円です")).toBe("tax");
    expect(detectKind("2026年12月1日から2027年1月10日までは40日です")).toBe("days");
  });

  it("割り勘：ちょうど割った金額・単位に切り上げた金額は正しい、違えば×", () => {
    const ok = checkAnswer("合計23,500円を6人で割り勘すると、1人あたり約3,917円です。")!;
    expect(ok.claims[0].ok).toBe(true);
    const up = checkAnswer("合計23500円を6人で割り勘。100円単位なら1人あたり4000円ずつ集めます。")!;
    expect(up.claims[0].ok).toBe(true);
    const ng = checkAnswer("合計23500円を6人で割り勘すると1人あたり3,800円です。")!;
    expect(ng.claims[0].ok).toBe(false);
  });

  it("消費税：切り捨て・四捨五入のどちらでも合っていれば正しい", () => {
    const ok = checkAnswer("税抜1,980円の商品の消費税（10%）は198円、税込は2,178円です。")!;
    expect(ok.claims.map((c) => c.ok)).toEqual([true, true]);
    const ng = checkAnswer("税抜1980円なら消費税は200円、税込2180円です。")!;
    expect(ng.claims.map((c) => c.ok)).toEqual([false, false]);
    const fromIncluded = checkAnswer("税込1,000円に含まれる消費税（10%）は90円です。")!;
    expect(fromIncluded.claims[0].ok).toBe(true);
  });

  it("日数：差・両端を含む・営業日を比べる", () => {
    const r = checkAnswer("2026年12月1日から2027年1月10日までは40日です。")!;
    expect(r.claims[0]).toMatchObject({ claimed: 40, actual: 40, ok: true });
    const biz = checkAnswer("2026年11月1日から2026年11月30日までの営業日は20日です。")!;
    expect(biz.claims[0]).toMatchObject({ claimed: 20, actual: 19, ok: false });
  });

  it("読み取れないときは理由を返す", () => {
    expect(checkAnswer("今日はいい天気です")).toBeNull();
    expect(checkAnswer("割り勘してください")!.problem).toBeTruthy();
  });
});
