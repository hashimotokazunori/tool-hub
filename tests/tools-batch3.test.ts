import { describe, expect, it } from "vitest";
import { decodeText, encodeText } from "@/features/tools/data/charset/logic";
import { bingoLetter, drawBingo, shuffle } from "@/features/tools/generator/random/logic";
import { allocate, convertDataSize, electricityCost, parseBudgetLines, rankUnitPrices, settle, tipTotal, transferSeconds } from "@/features/tools/life/money/logic";
import { A4, parsePageRange, placeImage } from "@/features/tools/pdf/logic";
import { uniqueNames } from "@/lib/files";
import { fitSize } from "@/lib/image";

describe("画像・ファイルの共通処理", () => {
  it("大きさの上限（拡大はしない）", () => {
    expect(fitSize(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitSize(3000, 4000, 1080, 1080)).toEqual({ width: 810, height: 1080 });
    expect(fitSize(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });
  it("ZIPの中で名前が重ならない", () => {
    expect(uniqueNames(["a.jpg", "a.jpg", "b", "b"])).toEqual(["a.jpg", "a_2.jpg", "b", "b_2"]);
  });
});

describe("PDF", () => {
  it("ページ指定（全角・範囲・末尾まで）", () => {
    expect(parsePageRange("", 3)).toEqual({ pages: [0, 1, 2] });
    expect(parsePageRange("１－２、５, 7-", 8)).toEqual({ pages: [0, 1, 4, 6, 7] });
    expect(parsePageRange("0", 3)).toHaveProperty("error");
    expect(parsePageRange("2-9", 3)).toHaveProperty("error");
    expect(parsePageRange("a", 3)).toHaveProperty("error");
  });
  it("画像の配置（横長はA4横、余白、中央寄せ）", () => {
    const p = placeImage(1600, 1200, "auto", 10);
    expect(p.pageWidth).toBeCloseTo(A4.height);
    expect(p.x + p.width / 2).toBeCloseTo(p.pageWidth / 2);
    expect(p.height).toBeLessThanOrEqual(p.pageHeight - 2 * ((10 * 72) / 25.4) + 1e-6);
    expect(placeImage(1000, 2000, "fit", 0)).toMatchObject({ pageWidth: 750, pageHeight: 1500, width: 750 });
  });
});

describe("文字コード変換", () => {
  it("Shift_JISのCSVを判定して読み、BOM付きUTF-8にする", () => {
    const sjis = encodeText("商品,価格\r\nりんご,198\r\n", "SJIS", "keep").bytes;
    const r = decodeText(sjis);
    expect(r.encoding).toBe("SJIS");
    expect(r.text).toBe("商品,価格\r\nりんご,198\r\n");
    expect(r.lineEnding).toBe("CRLF");
    const utf8 = encodeText(r.text, "UTF8BOM", "lf").bytes;
    expect([...utf8.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(decodeText(utf8)).toMatchObject({ encoding: "UTF8BOM", text: "商品,価格\nりんご,198\n" });
  });
  it("Shift_JISにない文字を知らせる（髙・①はWindowsの拡張で使える）", () => {
    expect(encodeText("髙橋①", "SJIS", "keep").lostChars).toEqual([]);
    expect(encodeText("𠮷野家😀", "SJIS", "keep").lostChars).toEqual(["𠮷", "😀"]);
  });
});

describe("お金の計算", () => {
  it("旅行費用の精算（送金の回数が少ない組み合わせ）", () => {
    const r = settle([
      { name: "佐藤", paid: 42000 },
      { name: "鈴木", paid: 8500 },
      { name: "高橋", paid: 0 },
      { name: "田中", paid: 15300 },
    ]);
    expect(r.total).toBe(65800);
    expect(r.perPerson).toBe(16450);
    expect(r.transfers).toEqual([
      { from: "高橋", to: "佐藤", amount: 16450 },
      { from: "鈴木", to: "佐藤", amount: 7950 },
      { from: "田中", to: "佐藤", amount: 1150 },
    ]);
    expect(settle([{ name: "", paid: 100 }, { name: "", paid: 100 }]).transfers).toEqual([]);
  });
  it("単価の比較", () => {
    const r = rankUnitPrices([
      { name: "本体", price: 398, amount: 500, packs: 1 },
      { name: "大容量", price: 698, amount: 1100, packs: 1 },
      { name: "", price: Number.NaN, amount: 100, packs: 1 },
    ]);
    expect(r.map((x) => x.name)).toEqual(["大容量", "本体"]);
    expect(r[0].per100).toBeCloseTo(63.45, 1);
    expect(r[1].diffPct).toBeCloseTo(25.5, 0);
  });
  it("予算配分（合計が100でなくても比率で配分）", () => {
    const items = parseBudgetLines("食費 15\n住居：30%\n不正な行\n貯蓄,5");
    expect(items).toEqual([
      { name: "食費", weight: 15 },
      { name: "住居", weight: 30 },
      { name: "貯蓄", weight: 5 },
    ]);
    expect(allocate(100000, items).rows.map((x) => x.amount)).toEqual([30000, 60000, 10000]);
  });
  it("電気代・チップ・データ容量", () => {
    expect(electricityCost(1200, 0.5, 1, 31, 30)).toMatchObject({ kwhPerDay: 0.6, perHour: 37.2 });
    expect(electricityCost(1200, 0.5, 1, 31, 30).perMonth).toBeCloseTo(558);
    expect(tipTotal(120, 18, 2, true)).toMatchObject({ total: 142, perPerson: 71 });
    expect(tipTotal(10000, "jp", 1, false).total).toBeCloseTo(12100);
    const d = convertDataSize(64, 3, 1000);
    expect(d.bytes).toBe(64e9);
    expect(d.units[2].value).toBe(64000);
    expect(transferSeconds(1e9, 100)).toBe(80);
  });
});

describe("抽選・ビンゴ", () => {
  it("並べ替えても要素は同じ", () => {
    const a = ["a", "b", "c", "d", "e"];
    expect(shuffle(a).sort()).toEqual(a);
  });
  it("ビンゴの列の文字と、重複しない番号", () => {
    expect([1, 15, 16, 45, 46, 75].map(bingoLetter).join("")).toBe("BBINGO");
    const drawn = Array.from({ length: 74 }, (_, i) => i + 1);
    expect(drawBingo(drawn)).toBe(75);
    expect(drawBingo([...drawn, 75])).toBeNull();
  });
});
