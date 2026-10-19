import { describe, expect, it } from "vitest";
import { contrastRatio, convertValue, csvToJson, detectDelimiter, formatRatio, jsonToCsv, parseCsv, parseHex, quoteCsvField, uniqueHeaders, wcagJudge } from "@/features/tools/data/convert/logic";
import { blurRect, containInSquare, coverSquare, fillRect, marginsToPx, paddedSize, pixelate, rectFromPoints } from "@/features/tools/image/extra/logic";
import { pageFileName, renderScale } from "@/features/tools/pdf/to-image/logic";

describe("コントラスト比", () => {
  it("HEXを読む", () => {
    expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex("1A2b3C")).toEqual({ r: 26, g: 43, b: 60 });
    expect(parseHex("#12345")).toBeNull();
  });
  it("黒と白は21:1、同じ色は1:1", () => {
    expect(contrastRatio(parseHex("#000")!, parseHex("#fff")!)).toBeCloseTo(21, 10);
    expect(contrastRatio(parseHex("#777")!, parseHex("#777")!)).toBeCloseTo(1, 10);
  });
  it("既知の値：#767676/白 は 4.54、#777777/白 は 4.48", () => {
    const white = parseHex("#fff")!;
    const r1 = contrastRatio(parseHex("#767676")!, white);
    const r2 = contrastRatio(parseHex("#777777")!, white);
    expect(r1).toBeCloseTo(4.54, 2);
    expect(r2).toBeCloseTo(4.48, 2);
    expect(wcagJudge(r1).aaNormal).toBe(true);
    expect(wcagJudge(r2).aaNormal).toBe(false);
    expect(wcagJudge(r2).aaLarge).toBe(true);
  });
  it("順番を入れ替えても同じ", () => {
    const a = parseHex("#336699")!;
    const b = parseHex("#ffeecc")!;
    expect(contrastRatio(a, b)).toBe(contrastRatio(b, a));
  });
  it("表示は切り捨て", () => {
    expect(formatRatio(4.4999)).toBe("4.49 : 1");
    expect(formatRatio(21)).toBe("21.00 : 1");
  });
});

describe("CSVの読み取り", () => {
  it("引用符・エスケープ・欄の中の改行", () => {
    expect(parseCsv('a,"b,c","say ""hi"""\r\n1,"line1\nline2",3\n', ",")).toEqual([
      ["a", "b,c", 'say "hi"'],
      ["1", "line1\nline2", "3"],
    ]);
  });
  it("空欄・末尾の改行なし・BOM", () => {
    expect(parseCsv("﻿x,,z\n,,", ",")).toEqual([
      ["x", "", "z"],
      ["", "", ""],
    ]);
  });
  it("区切り文字の自動判定", () => {
    expect(detectDelimiter("a\tb\tc\n1\t2\t3")).toBe("\t");
    expect(detectDelimiter("a;b;c\n1;2,5;3")).toBe(";");
    expect(detectDelimiter('a,b\n"x;y;z",1')).toBe(",");
  });
  it("数値・真偽値の変換", () => {
    expect(convertValue("42")).toBe(42);
    expect(convertValue("-3.5")).toBe(-3.5);
    expect(convertValue("1e3")).toBe(1000);
    expect(convertValue("0123")).toBe("0123");
    expect(convertValue("12345678901234567890")).toBe("12345678901234567890");
    expect(convertValue("TRUE")).toBe(true);
    expect(convertValue("false")).toBe(false);
    expect(convertValue("")).toBe("");
    expect(convertValue("1,000")).toBe("1,000");
  });
  it("見出しの空欄・重複", () => {
    expect(uniqueHeaders(["名前", "", "名前"])).toEqual(["名前", "列2", "名前_2"]);
  });
});

describe("CSV → JSON", () => {
  it("オブジェクトの配列", () => {
    const r = csvToJson("名前,年齢,会員\n山田,30,true\n佐藤,,false\n", "auto", { header: true, convert: true, shape: "objects", pretty: false });
    expect(JSON.parse(r.json)).toEqual([
      { 名前: "山田", 年齢: 30, 会員: true },
      { 名前: "佐藤", 年齢: "", 会員: false },
    ]);
    expect(r.rows).toBe(2);
    expect(r.columns).toBe(3);
  });
  it("見出しなし・変換なしは配列の配列", () => {
    const r = csvToJson("1\t2\n3\t4", "auto", { header: false, convert: false, shape: "objects", pretty: false });
    expect(r.json).toBe('[["1","2"],["3","4"]]');
    expect(r.delimiter).toBe("\t");
  });
  it("列の足りない行は空欄、多い行は列を足す", () => {
    const r = csvToJson("a,b\n1\n2,3,4", ",", { header: true, convert: false, shape: "objects", pretty: false });
    expect(JSON.parse(r.json)).toEqual([
      { a: "1", b: "", 列3: "" },
      { a: "2", b: "3", 列3: "4" },
    ]);
  });
});

describe("JSON → CSV", () => {
  it("キーを合わせて列にし、必要な欄を引用符で囲む", () => {
    const r = jsonToCsv('[{"a":1,"b":"x,y"},{"b":"say \\"hi\\"","c":null}]', ",", "flatten");
    expect(r).toEqual({ csv: 'a,b,c\r\n1,"x,y",\r\n,"say ""hi""",\r\n', rows: 2, columns: 3 });
  });
  it("入れ子は点でつないだ列に開く／JSONの文字のまま", () => {
    const json = '[{"id":1,"addr":{"city":"Tokyo","zip":"100"},"tags":["a","b"]}]';
    const flat = jsonToCsv(json, ",", "flatten");
    expect("csv" in flat && flat.csv).toBe('id,addr.city,addr.zip,tags\r\n1,Tokyo,100,"[""a"",""b""]"\r\n');
    const asJson = jsonToCsv(json, ",", "json");
    expect("csv" in asJson && asJson.csv).toBe('id,addr,tags\r\n1,"{""city"":""Tokyo"",""zip"":""100""}","[""a"",""b""]"\r\n');
  });
  it("配列の配列・オブジェクト1つ・タブ区切り", () => {
    expect(jsonToCsv("[[1,2],[3,4]]", "\t", "flatten")).toEqual({ csv: "1\t2\r\n3\t4\r\n", rows: 2, columns: 2 });
    expect(jsonToCsv('{"x":1}', ",", "flatten")).toEqual({ csv: "x\r\n1\r\n", rows: 1, columns: 1 });
  });
  it("読めないJSON・配列でない値はエラー", () => {
    expect("error" in jsonToCsv("[1,", ",", "flatten")).toBe(true);
    expect("error" in jsonToCsv("123", ",", "flatten")).toBe(true);
  });
  it("引用符の付け方", () => {
    expect(quoteCsvField("abc", ",")).toBe("abc");
    expect(quoteCsvField("a\nb", ",")).toBe('"a\nb"');
    expect(quoteCsvField("a\tb", "\t")).toBe('"a\tb"');
    expect(quoteCsvField("a\tb", ",")).toBe("a\tb");
  });
  it("CSV → JSON → CSV で元に戻る", () => {
    const csv = 'a,b\r\n"1,2","x\ny"\r\n';
    const j = csvToJson(csv, ",", { header: true, convert: false, shape: "objects", pretty: false });
    const back = jsonToCsv(j.json, ",", "flatten");
    expect("csv" in back && back.csv).toBe(csv);
  });
});

describe("正方形・余白", () => {
  it("横長の写真を正方形の中央に収める", () => {
    expect(containInSquare(4000, 3000, 1080)).toEqual({ x: 0, y: 135, w: 1080, h: 810 });
    expect(containInSquare(3000, 4000, 1000, 10)).toEqual({ x: 200, y: 100, w: 600, h: 800 });
  });
  it("ぼかし背景は正方形全体を覆う", () => {
    expect(coverSquare(200, 100, 100)).toEqual({ x: -50, y: 0, w: 200, h: 100 });
  });
  it("％は短い辺に対する割合", () => {
    const m = marginsToPx({ top: 10, right: 10, bottom: 10, left: 10 }, "%", 1000, 500);
    expect(m).toEqual({ top: 50, right: 50, bottom: 50, left: 50 });
    expect(paddedSize(1000, 500, m)).toEqual({ width: 1100, height: 600 });
    expect(marginsToPx({ top: 5, right: -3, bottom: Number.NaN, left: 0 }, "px", 10, 10)).toEqual({ top: 5, right: 0, bottom: 0, left: 0 });
  });
});

describe("モザイク・ぼかし", () => {
  it("ドラッグの2点から画像内の四角", () => {
    expect(rectFromPoints(50, 40, 10, 10, 100, 100)).toEqual({ x: 10, y: 10, w: 40, h: 30 });
    expect(rectFromPoints(-20, 90, 30, 150, 100, 100)).toEqual({ x: 0, y: 90, w: 30, h: 10 });
  });
  it("モザイクはマスごとの平均色", () => {
    // 2×1 の画像：黒と白 → 2pxのマスで灰色
    const d = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]);
    pixelate(d, 2, { x: 0, y: 0, w: 2, h: 1 }, 2);
    expect([...d]).toEqual([128, 128, 128, 255, 128, 128, 128, 255]);
  });
  it("範囲の外は変えない", () => {
    const d = new Uint8ClampedArray(3 * 1 * 4).fill(200);
    d.set([0, 0, 0, 255], 0);
    fillRect(d, 3, { x: 2, y: 0, w: 1, h: 1 }, [0, 0, 0]);
    expect([...d.slice(4, 8)]).toEqual([200, 200, 200, 200]);
    expect([...d.slice(8, 12)]).toEqual([0, 0, 0, 255]);
  });
  it("ぼかしは単色を変えず、白黒の境目をなだらかにする", () => {
    const flat = new Uint8ClampedArray(4 * 4 * 4).fill(100);
    blurRect(flat, 4, { x: 0, y: 0, w: 4, h: 4 }, 2);
    expect([...flat].every((v) => v === 100)).toBe(true);
    const w = 10;
    const d = new Uint8ClampedArray(w * 4);
    for (let x = 0; x < w; x++) d.set(x < 5 ? [0, 0, 0, 255] : [255, 255, 255, 255], x * 4);
    blurRect(d, w, { x: 0, y: 0, w, h: 1 }, 2);
    expect(d[4 * 4]).toBeGreaterThan(0);
    expect(d[5 * 4]).toBeLessThan(255);
    expect(d[0]).toBeLessThan(d[9 * 4]);
  });
});

describe("PDF画像化", () => {
  it("A4・150dpi は 1240×1753 px", () => {
    const s = renderScale(595.28, 841.89, 150);
    expect(s).toMatchObject({ width: 1240, height: 1753, reduced: false });
  });
  it("A4・300dpi は 2480×3507 px", () => {
    expect(renderScale(595.28, 841.89, 300)).toMatchObject({ width: 2480, height: 3507, reduced: false });
  });
  it("大きすぎる用紙は画素数の上限に収める", () => {
    const s = renderScale(2383.94, 3370.39, 300); // A0
    expect(s.reduced).toBe(true);
    expect(s.width * s.height).toBeLessThanOrEqual(16_000_000);
  });
  it("ファイル名のページ番号は桁をそろえる", () => {
    expect(pageFileName("資料", 0, 9, "jpg")).toBe("資料_p01.jpg");
    expect(pageFileName("a", 11, 120, "png")).toBe("a_p012.png");
  });
});
