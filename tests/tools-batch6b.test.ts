import { describe, expect, it } from "vitest";
import {
  buildPalettes,
  colorWithOpacity,
  convertAll,
  convertUnit,
  gradientCss,
  hslToRgb,
  mix,
  parseHex,
  rgbToHsl,
  rotateHue,
  shadowCss,
  toHex,
  trimNumber,
  type UnitContext,
} from "@/features/tools/design/css/logic";
import { FAVICON_FILES, buildIco, faviconHtml, fitFontSize, readIcoEntries, webManifest } from "@/features/tools/design/favicon/logic";
import { dedupeRows, detectAnyDelimiter, diffTables, diffToRows, moveItem, normalizeCell, pickColumns, quoteField, readTable, withHeader, writeCsv } from "@/features/tools/data/csv/logic";

describe("色の計算", () => {
  it("HSLとRGBを行き来する", () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
    const h = rgbToHsl(parseHex("#3b82f6")!);
    expect(h.h).toBeCloseTo(217.2, 1);
    expect(toHex(hslToRgb(h))).toBe("#3b82f6");
    expect(toHex(hslToRgb({ h: 120, s: 100, l: 25 }))).toBe("#008000");
    expect(rgbToHsl({ r: 128, g: 128, b: 128 }).s).toBe(0);
  });
  it("補色・トライアドなど", () => {
    const red = parseHex("#ff0000")!;
    expect(toHex(rotateHue(red, 180))).toBe("#00ffff");
    const p = buildPalettes(red);
    expect(p.find((x) => x.id === "triadic")!.colors.map(toHex)).toEqual(["#ff0000", "#00ff00", "#0000ff"]);
    expect(p.find((x) => x.id === "tetradic")!.colors.map(toHex)).toEqual(["#ff0000", "#80ff00", "#00ffff", "#8000ff"]);
    expect(p.find((x) => x.id === "analogous")!.colors.map(toHex)).toEqual(["#ff0080", "#ff0000", "#ff8000"]);
    expect(p.find((x) => x.id === "split")!.colors.map(toHex)).toEqual(["#ff0000", "#00ff80", "#0080ff"]);
  });
  it("ティント・シェード", () => {
    expect(toHex(mix({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, 0.5))).toBe("#808080");
    const p = buildPalettes(parseHex("#000000")!);
    expect(p.find((x) => x.id === "tints")!.colors.map(toHex)).toEqual(["#000000", "#333333", "#666666", "#999999", "#cccccc"]);
  });
  it("不透明度つきの色", () => {
    expect(colorWithOpacity("#ff0000", 100)).toBe("#ff0000");
    expect(colorWithOpacity("#ff0000", 50)).toBe("rgba(255, 0, 0, 0.5)");
    expect(colorWithOpacity("#000", 15)).toBe("rgba(0, 0, 0, 0.15)");
  });
});

describe("グラデーション・影", () => {
  it("グラデーションのCSS", () => {
    const stops = [
      { color: "#0000ff", pos: 100, opacity: 100 },
      { color: "#ff0000", pos: 0, opacity: 100 },
    ];
    expect(gradientCss({ type: "linear", angle: 90, shape: "circle", stops })).toBe("linear-gradient(90deg, #ff0000 0%, #0000ff 100%)");
    expect(gradientCss({ type: "linear", angle: -90, shape: "circle", stops })).toBe("linear-gradient(270deg, #ff0000 0%, #0000ff 100%)");
    expect(gradientCss({ type: "radial", angle: 0, shape: "ellipse", stops })).toBe("radial-gradient(ellipse, #ff0000 0%, #0000ff 100%)");
    expect(gradientCss({ type: "conic", angle: 45, shape: "circle", stops })).toBe("conic-gradient(from 45deg, #ff0000 0%, #0000ff 100%)");
  });
  it("影のCSS", () => {
    expect(shadowCss([])).toBe("none");
    expect(
      shadowCss([
        { x: 0, y: 4, blur: 12, spread: 0, color: "#000000", opacity: 12, inset: false },
        { x: 1, y: -2, blur: 0, spread: 3, color: "#ff0000", opacity: 100, inset: true },
      ]),
    ).toBe("0 4px 12px 0 rgba(0, 0, 0, 0.12), inset 1px -2px 0 3px #ff0000");
  });
});

describe("CSS単位変換", () => {
  const ctx: UnitContext = { root: 16, parent: 20, vw: 1440, vh: 900 };
  it("px と各単位", () => {
    const r = convertAll(24, "px", ctx);
    expect(r.rem).toBe(1.5);
    expect(r.em).toBe(1.2);
    expect(r["%"]).toBe(120);
    expect(r.vw).toBeCloseTo(1.6667, 4);
    expect(r.vh).toBeCloseTo(2.6667, 4);
    expect(r.pt).toBe(18);
    expect(convertUnit(12, "pt", "px", ctx)).toBe(16);
    expect(convertUnit(2, "rem", "em", ctx)).toBe(1.6);
    expect(convertUnit(50, "vw", "px", ctx)).toBe(720);
  });
  it("表示用の丸め", () => {
    expect(trimNumber(1.5)).toBe("1.5");
    expect(trimNumber(2)).toBe("2");
    expect(trimNumber(1 / 3)).toBe("0.3333");
    expect(trimNumber(-0.00001)).toBe("0");
  });
});

describe("ファビコン", () => {
  it("ICOのヘッダーと目次", () => {
    const pngs = [16, 32, 48].map((size, i) => ({ size, png: new Uint8Array(10 + i).fill(0x89) }));
    const ico = buildIco(pngs);
    expect(ico.length).toBe(6 + 16 * 3 + 10 + 11 + 12);
    expect([...ico.slice(0, 6)]).toEqual([0, 0, 1, 0, 3, 0]);
    // 1枚目の目次：幅16・高さ16・色数0・予約0・プレーン1・32ビット・大きさ10・位置54
    expect([...ico.slice(6, 22)]).toEqual([16, 16, 0, 0, 1, 0, 32, 0, 10, 0, 0, 0, 54, 0, 0, 0]);
    expect(readIcoEntries(ico)).toEqual([
      { width: 16, height: 16, size: 10, offset: 54 },
      { width: 32, height: 32, size: 11, offset: 64 },
      { width: 48, height: 48, size: 12, offset: 75 },
    ]);
    expect(ico[54]).toBe(0x89);
  });
  it("256pxは0と書く", () => {
    const ico = buildIco([{ size: 256, png: new Uint8Array(1) }]);
    expect(ico[6]).toBe(0);
    expect(readIcoEntries(ico)![0].width).toBe(256);
  });
  it("タグとwebmanifest", () => {
    expect(faviconHtml()).toContain('<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">');
    const m = JSON.parse(webManifest({ name: "テスト", shortName: "", themeColor: "#123456", backgroundColor: "#ffffff" }));
    expect(m.short_name).toBe("テスト");
    expect(m.icons.map((i: { sizes: string }) => i.sizes)).toEqual(["192x192", "512x512"]);
    expect(FAVICON_FILES.map((f) => f.size)).toEqual([16, 32, 48, 180, 192, 512]);
  });
  it("文字の大きさ", () => {
    expect(fitFontSize(100, 50)).toBe(78);
    expect(fitFontSize(100, 200)).toBe(43);
  });
});

describe("CSVの読み書き", () => {
  it("区切り文字を判定", () => {
    expect(detectAnyDelimiter("a|b|c\n1|2|3")).toBe("|");
    expect(detectAnyDelimiter("a\tb\n1\t2")).toBe("\t");
    expect(detectAnyDelimiter('"a,b";c;d')).toBe(";");
    expect(detectAnyDelimiter("abc")).toBe(",");
  });
  it("表にする（空行を除き、足りない列は埋める）", () => {
    const t = readTable("ID,名前\n1,山田\n\n2\n", "auto", true);
    expect(t.headers).toEqual(["ID", "名前"]);
    expect(t.rows).toEqual([
      ["1", "山田"],
      ["2", ""],
    ]);
    const n = readTable("1|a\n2|b", "auto", false);
    expect(n.headers).toEqual(["列1", "列2"]);
    expect(n.headerRow).toBeNull();
  });
  it("書き出し", () => {
    expect(quoteField("a,b", ",", "minimal")).toBe('"a,b"');
    expect(quoteField("a,b", "\t", "minimal")).toBe("a,b");
    expect(quoteField('x"y', "\t", "minimal")).toBe('"x""y"');
    expect(quoteField("abc", ",", "all")).toBe('"abc"');
    expect(
      writeCsv(
        [
          ["a", "b c"],
          ["1", "2"],
        ],
        "|",
        { eol: "lf" },
      ),
    ).toBe("a|b c\n1|2\n");
    expect(writeCsv([["a"]], ",")).toBe("a\r\n");
    expect(writeCsv([], ",")).toBe("");
  });
  it("区切り文字の変換で中身が変わらない", () => {
    const src = 'a,"b,1","c\n2","d""e"\r\n';
    const t = readTable(src, ",", false);
    const tsv = writeCsv(t.rows, "\t");
    expect(tsv).toBe('a\tb,1\t"c\n2"\t"d""e"\r\n');
    expect(readTable(tsv, "\t", false).rows).toEqual(t.rows);
  });
});

describe("重複行の削除", () => {
  const rows = [
    ["1", "山田", "a@x.jp"],
    ["2", "佐藤", "b@x.jp"],
    ["3", "山田 ", "A@X.JP"],
    ["4", "佐藤", "b@x.jp"],
  ];
  it("行全体・最初を残す", () => {
    const r = dedupeRows(rows, { keys: null, keep: "first", ignoreCase: false, ignoreSpace: false, ignoreWidth: false });
    expect(r.removed).toEqual([]);
  });
  it("キー列・最初を残す／最後を残す", () => {
    const first = dedupeRows(rows, { keys: [2], keep: "first", ignoreCase: true, ignoreSpace: true, ignoreWidth: false });
    expect(first.kept.map((r) => r[0])).toEqual(["1", "2"]);
    expect(first.removed).toEqual([2, 3]);
    expect(first.duplicateGroups).toBe(2);
    const last = dedupeRows(rows, { keys: [2], keep: "last", ignoreCase: true, ignoreSpace: true, ignoreWidth: false });
    expect(last.kept.map((r) => r[0])).toEqual(["3", "4"]);
    const strict = dedupeRows(rows, { keys: [1], keep: "first", ignoreCase: false, ignoreSpace: false, ignoreWidth: false });
    expect(strict.removed).toEqual([3]);
  });
  it("比べるための正規化", () => {
    expect(normalizeCell("　ＡＢＣ　１２ ", { ignoreWidth: true, ignoreSpace: true, ignoreCase: true })).toBe("abc 12");
    expect(normalizeCell(" A ", {})).toBe(" A ");
  });
});

describe("列の抽出", () => {
  const t = readTable("ID,名前,メール\n1,山田,a@x.jp\n2,佐藤,b@x.jp", ",", true);
  it("選んだ順・名前の変更", () => {
    expect(
      pickColumns(t, [
        { index: 2, name: "" },
        { index: 0, name: "番号" },
      ]),
    ).toEqual([
      ["メール", "番号"],
      ["a@x.jp", "1"],
      ["b@x.jp", "2"],
    ]);
    expect(withHeader(t)[0]).toEqual(["ID", "名前", "メール"]);
  });
  it("並べ替え", () => {
    expect(moveItem([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
    expect(moveItem([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
  });
});

describe("CSV比較", () => {
  const a = readTable("ID,名前,点数\n1,山田,80\n2,佐藤,70\n3,鈴木,90", ",", true);
  const b = readTable("ID,点数,名前,備考\n1,80,山田,\n2,75,佐藤,\n4,60,田中,新規", ",", true);
  it("キーで比べる", () => {
    const d = diffTables(a, b, "ID");
    expect(d.columns).toEqual(["ID", "名前", "点数", "備考"]);
    expect(d.onlyB).toEqual(["備考"]);
    expect(d.counts).toEqual({ added: 1, removed: 1, changed: 1, same: 1 });
    const changed = d.rows.find((r) => r.status === "changed")!;
    expect(changed.key).toBe("2");
    expect(changed.changed).toEqual([2]);
    expect(changed.before![2]).toBe("70");
    expect(changed.after![2]).toBe("75");
    const out = diffToRows(d);
    expect(out[0]).toEqual(["差分", "変更された列", "ID", "名前", "点数", "備考"]);
    expect(out.slice(1).map((r) => r[0])).toEqual(["変更前", "変更後", "追加", "削除"]);
    expect(out[1][1]).toBe("点数");
  });
  it("キーなしで比べる（重複は数で合わせる）", () => {
    const x = readTable("a,b\n1,2\n1,2\n3,4", ",", true);
    const y = readTable("a,b\n1,2\n5,6", ",", true);
    const d = diffTables(x, y, null);
    expect(d.counts).toEqual({ added: 1, removed: 2, changed: 0, same: 1 });
  });
  it("空白・大文字を無視", () => {
    const x = readTable("id,v\n1, Abc", ",", true);
    const y = readTable("id,v\n1,abc", ",", true);
    expect(diffTables(x, y, "id").counts.changed).toBe(1);
    expect(diffTables(x, y, "id", { ignoreSpace: true, ignoreCase: true }).counts.same).toBe(1);
  });
  it("キーの重複を数える", () => {
    const x = readTable("id,v\n1,a\n1,b", ",", true);
    const y = readTable("id,v\n1,a", ",", true);
    const d = diffTables(x, y, "id");
    expect(d.duplicateKeys).toBe(1);
    expect(d.counts.same).toBe(1);
  });
});
