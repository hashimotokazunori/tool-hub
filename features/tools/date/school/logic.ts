/**
 * 生年月日から、入学・卒業の年月を出す（日本の学校制度。浪人・留年などがない場合）。
 * 学年は4月2日生まれから翌年4月1日生まれまでが同じ。満6歳になった翌日以後の最初の4月に小学校に入学する。
 */

export type SchoolEvent = { school: string; kind: "入学" | "卒業"; year: number; month: 3 | 4 };

/** 学年の基準の年（4月2日〜12月31日生まれはその年、1月1日〜4月1日生まれは前の年） */
export function schoolBaseYear(y: number, m: number, d: number): number {
  return m > 4 || (m === 4 && d >= 2) ? y : y - 1;
}

/** university は大学の年数（4年制なら4、短大なら2、なしなら0） */
export function schoolTimeline(y: number, m: number, d: number, university = 4): SchoolEvent[] {
  const b = schoolBaseYear(y, m, d);
  const list: SchoolEvent[] = [
    { school: "小学校", kind: "入学", year: b + 7, month: 4 },
    { school: "小学校", kind: "卒業", year: b + 13, month: 3 },
    { school: "中学校", kind: "入学", year: b + 13, month: 4 },
    { school: "中学校", kind: "卒業", year: b + 16, month: 3 },
    { school: "高等学校", kind: "入学", year: b + 16, month: 4 },
    { school: "高等学校", kind: "卒業", year: b + 19, month: 3 },
  ];
  if (university > 0) {
    const name = university === 2 ? "短期大学" : university === 6 ? "大学（6年制）" : "大学";
    list.push({ school: name, kind: "入学", year: b + 19, month: 4 }, { school: name, kind: "卒業", year: b + 19 + university, month: 3 });
  }
  return list;
}

/** 和暦の年（例：令和7年）。元年は「元年」と書く。対象は昭和以降 */
export function warekiYear(year: number, month: number): string {
  const ymd = year * 100 + month;
  const [era, start] = ymd >= 201905 ? ["令和", 2019] : ymd >= 198901 ? ["平成", 1989] : ["昭和", 1926];
  const n = year - start + 1;
  return `${era}${n === 1 ? "元" : n}年`;
}
