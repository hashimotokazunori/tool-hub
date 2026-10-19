import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildXlsx, colName, dateKind, decodeEntities, formatNumber, formatSerial, isNumberCell, openXlsx, parseRef, parseXml, readSheet, sheetName } from "@/features/tools/data/excel/logic";
import { DEFAULT_RULES, formatDate, mergedFileName, mergeTexts, renameAll, renameOne, sanitizeFileName, splitExt, type RenameRules } from "@/features/tools/files/logic";
import { clampRect, displaySize, displayToPdf, imagePlacement, normRotation, pdfToDisplay, rectFromPoints, rectToPdf, resizeRect, textBoxSize, type Rect, type Rotation, type View } from "@/features/tools/pdf/editor/logic";

// ───────── PDF編集の座標 ─────────

describe("PDF編集：座標の変換", () => {
  const views: View[] = [
    [0, 0, 600, 800],
    [10, 20, 610, 820],
  ];
  const rots: Rotation[] = [0, 90, 180, 270];

  it("回転をそろえる", () => {
    expect(normRotation(-90)).toBe(270);
    expect(normRotation(450)).toBe(90);
    expect(normRotation(360)).toBe(0);
  });

  it("90°・270°では表示の幅と高さが入れ替わる", () => {
    expect(displaySize(views[0], 0)).toEqual({ width: 600, height: 800 });
    expect(displaySize(views[0], 90)).toEqual({ width: 800, height: 600 });
    expect(displaySize(views[1], 270)).toEqual({ width: 800, height: 600 });
  });

  it("回転なし：表示の左上はPDFの左上（y は上が大きい）", () => {
    expect(displayToPdf(views[1], 0, 0, 0)).toEqual([10, 820]);
    expect(displayToPdf(views[1], 0, 600, 800)).toEqual([610, 20]);
    expect(displayToPdf(views[0], 0, 100, 50)).toEqual([100, 750]);
  });

  it("時計回り90°：元の左下が表示の左上、元の左上が表示の右上に来る", () => {
    expect(displayToPdf(views[0], 90, 0, 0)).toEqual([0, 0]);
    expect(displayToPdf(views[0], 90, 800, 0)).toEqual([0, 800]);
    expect(displayToPdf(views[0], 90, 0, 600)).toEqual([600, 0]);
  });

  it("180°・270°の角", () => {
    expect(displayToPdf(views[0], 180, 0, 0)).toEqual([600, 0]);
    expect(displayToPdf(views[0], 270, 0, 0)).toEqual([600, 800]);
    expect(displayToPdf(views[0], 270, 0, 600)).toEqual([0, 800]);
  });

  it("行って戻ると同じ点になる（全回転・原点ずれあり）", () => {
    for (const v of views)
      for (const r of rots) {
        const [px, py] = displayToPdf(v, r, 123.5, 45.25);
        expect(pdfToDisplay(v, r, px, py)).toEqual([123.5, 45.25]);
      }
  });

  it("修正テープの四角形は、表示の四角形と同じ範囲を覆う", () => {
    const rect: Rect = { x: 50, y: 70, w: 100, h: 30 };
    expect(rectToPdf(views[0], 0, rect)).toEqual({ x: 50, y: 700, width: 100, height: 30 });
    // 90°では幅と高さが入れ替わる
    expect(rectToPdf(views[0], 90, rect)).toEqual({ x: 70, y: 50, width: 30, height: 100 });
    for (const v of views)
      for (const r of rots) {
        const p = rectToPdf(v, r, rect);
        const a = pdfToDisplay(v, r, p.x, p.y);
        const b = pdfToDisplay(v, r, p.x + p.width, p.y + p.height);
        expect(Math.min(a[0], b[0])).toBeCloseTo(50);
        expect(Math.min(a[1], b[1])).toBeCloseTo(70);
        expect(Math.abs(a[0] - b[0])).toBeCloseTo(100);
        expect(Math.abs(a[1] - b[1])).toBeCloseTo(30);
      }
  });

  it("画像は表示の四角形にぴったり、上向きで置かれる", () => {
    const rect: Rect = { x: 50, y: 70, w: 100, h: 30 };
    for (const v of views)
      for (const r of rots) {
        const p = imagePlacement(v, r, rect);
        expect(p.rotate).toBe(r);
        // pdf-lib は (x, y) を中心に反時計回りに rotate 度回して描く
        const t = (p.rotate * Math.PI) / 180;
        const ux = [Math.cos(t), Math.sin(t)]; // 画像の横方向
        const uy = [-Math.sin(t), Math.cos(t)]; // 画像の上方向
        const corner = (fx: number, fy: number) => pdfToDisplay(v, r, p.x + ux[0] * p.width * fx + uy[0] * p.height * fy, p.y + ux[1] * p.width * fx + uy[1] * p.height * fy);
        const bl = corner(0, 0);
        const br = corner(1, 0);
        const tl = corner(0, 1);
        // 画像の左下・右下・左上が、表示の四角形の左下・右下・左上に来る
        expect(bl[0]).toBeCloseTo(50);
        expect(bl[1]).toBeCloseTo(100);
        expect(br[0]).toBeCloseTo(150);
        expect(br[1]).toBeCloseTo(100);
        expect(tl[0]).toBeCloseTo(50);
        expect(tl[1]).toBeCloseTo(70);
      }
  });

  it("ドラッグの四角形・はみ出しの補正・大きさの変更", () => {
    expect(rectFromPoints(100, 80, 40, 20)).toEqual({ x: 40, y: 20, w: 60, h: 60 });
    expect(clampRect({ x: -10, y: 790, w: 50, h: 30 }, 600, 800)).toEqual({ x: 0, y: 770, w: 50, h: 30 });
    expect(clampRect({ x: 0, y: 0, w: 700, h: 30 }, 600, 800)).toEqual({ x: 0, y: 0, w: 600, h: 30 });
    // 縦横比2の画像：幅を80にすると高さは40
    expect(resizeRect({ x: 10, y: 10, w: 60, h: 30 }, 80, 999, 600, 800, 2)).toEqual({ x: 10, y: 10, w: 80, h: 40 });
    // 下にはみ出すときは高さに合わせる
    expect(resizeRect({ x: 0, y: 780, w: 20, h: 10 }, 100, 0, 600, 800, 2)).toEqual({ x: 0, y: 780, w: 40, h: 20 });
    // 最小の大きさ
    expect(resizeRect({ x: 0, y: 0, w: 20, h: 20 }, 1, 1, 600, 800)).toEqual({ x: 0, y: 0, w: 6, h: 6 });
  });

  it("文字の枠の大きさ", () => {
    const s = textBoxSize([2, 3], 10);
    expect(s.w).toBeCloseTo(30 + 3);
    expect(s.h).toBeCloseTo(2 * 14 + 3);
  });
});

// ───────── テキストファイル結合 ─────────

describe("テキストファイル結合", () => {
  const files = [
    { name: "a.txt", text: "1行目\r\n2行目\r\n" },
    { name: "b.txt", text: "3行目" },
  ];
  it("区切りなし・空行・ファイル名の見出し", () => {
    expect(mergeTexts(files, { separator: "none", skipCsvHeader: false })).toBe("1行目\n2行目\n3行目\n");
    expect(mergeTexts(files, { separator: "blank", skipCsvHeader: false })).toBe("1行目\n2行目\n\n3行目\n");
    expect(mergeTexts(files, { separator: "header", skipCsvHeader: false })).toBe("===== a.txt =====\n1行目\n2行目\n\n===== b.txt =====\n3行目\n");
  });
  it("2つ目以降のCSVの見出しを除く", () => {
    const csv = [
      { name: "1.csv", text: "名前,点\n山田,1\n" },
      { name: "2.csv", text: "名前,点\n佐藤,2\n" },
      { name: "3.csv", text: "名前,点\n" },
    ];
    expect(mergeTexts(csv, { separator: "none", skipCsvHeader: true })).toBe("名前,点\n山田,1\n佐藤,2\n");
    expect(mergeTexts(csv, { separator: "none", skipCsvHeader: false })).toBe("名前,点\n山田,1\n名前,点\n佐藤,2\n名前,点\n");
  });
  it("空のときと保存する名前", () => {
    expect(mergeTexts([], { separator: "none", skipCsvHeader: false })).toBe("");
    expect(mergedFileName(["a.csv", "b.CSV"])).toBe("merged.csv");
    expect(mergedFileName(["a.csv", "b.txt"])).toBe("merged.txt");
  });
});

// ───────── ファイル名一括変更 ─────────

describe("ファイル名一括変更", () => {
  const t = new Date(2024, 0, 2, 3, 4, 5).getTime();
  const rules = (patch: Partial<RenameRules>): RenameRules => ({ ...DEFAULT_RULES, ...patch });

  it("拡張子を分ける", () => {
    expect(splitExt("a.b.jpg")).toEqual(["a.b", ".jpg"]);
    expect(splitExt(".bashrc")).toEqual([".bashrc", ""]);
    expect(splitExt("README")).toEqual(["README", ""]);
  });
  it("日付の形式（端末の時刻）", () => {
    expect(formatDate(t, "YYYYMMDD")).toBe("20240102");
    expect(formatDate(t, "YYYY-MM-DD")).toBe("2024-01-02");
    expect(formatDate(t, "YYYYMMDD_HHmmss")).toBe("20240102_030405");
  });
  it("置換・大文字小文字・先頭末尾", () => {
    const f = { name: "IMG_001.JPG", lastModified: t };
    expect(renameOne(f, 0, rules({ prefix: "旅行_", suffix: "_x" }))).toBe("旅行_IMG_001_x.JPG");
    expect(renameAll([f], rules({ find: "IMG_", replace: "" }))).toMatchObject({ names: ["001.JPG"] });
    // 拡張子を変えないときは、拡張子には大文字・小文字の変更がかからない
    expect(renameAll([f], rules({ caseMode: "lower" }))).toMatchObject({ names: ["img_001.JPG"] });
    expect(renameAll([f], rules({ caseMode: "lower", keepExt: false }))).toMatchObject({ names: ["img_001.jpg"] });
    // 「.」は普通の文字として検索する
    expect(renameAll([{ name: "a.b.c.txt", lastModified: t }], rules({ find: ".", replace: "-" }))).toMatchObject({ names: ["a-b-c.txt"] });
  });
  it("正規表現（グループの参照）と、正しくない正規表現", () => {
    const f = { name: "2024-05-06 memo.txt", lastModified: t };
    expect(renameAll([f], rules({ find: "(\\d{4})-(\\d{2})-(\\d{2})", replace: "$1$2$3", regex: true }))).toMatchObject({ names: ["20240506 memo.txt"] });
    expect(renameAll([f], rules({ find: "(", regex: true }))).toEqual({ error: "正規表現の書き方が正しくありません" });
  });
  it("連番と日付", () => {
    const files = ["a.jpg", "b.jpg", "c.png"].map((name) => ({ name, lastModified: t }));
    const seq = { on: true, start: 9, digits: 3, position: "before" as const, sep: "_" };
    expect(renameAll(files, rules({ seq }))).toMatchObject({ names: ["009_a.jpg", "010_b.jpg", "011_c.png"] });
    expect(renameAll(files, rules({ seq: { ...seq, position: "replace", start: 1, digits: 2 } }))).toMatchObject({ names: ["01.jpg", "02.jpg", "03.png"] });
    expect(renameAll(files.slice(0, 1), rules({ date: { on: true, format: "YYYY-MM-DD", position: "after", sep: "_" } }))).toMatchObject({ names: ["a_2024-01-02.jpg"] });
  });
  it("重なる名前・空の名前・使えない記号", () => {
    const files = ["A.txt", "a.txt", "b.txt"].map((name) => ({ name, lastModified: t }));
    const r = renameAll(files, rules({}));
    expect("error" in r ? null : [...r.duplicates]).toEqual([0, 1]);
    const r2 = renameAll([{ name: "abc.txt", lastModified: t }], rules({ find: "abc", replace: "" }));
    expect("error" in r2 ? null : [...r2.empty]).toEqual([0]);
    expect(sanitizeFileName('a/b:c*?"<>|.txt')).toBe("a_b_c______.txt");
  });
});

// ───────── Excel ─────────

/** テスト用の小さな xlsx を、Excel が書くのと同じ形で作る */
async function sampleXlsx(): Promise<Uint8Array> {
  const zip = new JSZip();
  const ns = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  zip.file("_rels/.rels", '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.file("xl/workbook.xml", `<?xml version="1.0"?><workbook ${ns}><workbookPr/><sheets><sheet name="売上" sheetId="1" r:id="rId1"/><sheet name="メモ &amp; 予定" sheetId="2" r:id="rId2"/></sheets></workbook>`);
  zip.file(
    "xl/_rels/workbook.xml.rels",
    '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="/xl/worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
  );
  zip.file(
    "xl/sharedStrings.xml",
    `<?xml version="1.0"?><sst ${ns} count="3" uniqueCount="3"><si><t>名前</t></si><si><r><rPr><b/></rPr><t>山田</t></r><r><t xml:space="preserve"> 太郎</t></r><rPh sb="0" eb="2"><t>ヤマダ</t></rPh></si><si><t>a&lt;b_x000D_</t></si></sst>`,
  );
  zip.file(
    "xl/styles.xml",
    `<?xml version="1.0"?><styleSheet ${ns}><numFmts count="1"><numFmt numFmtId="176" formatCode="yyyy&quot;年&quot;m&quot;月&quot;d&quot;日&quot;"/></numFmts><cellXfs count="4"><xf numFmtId="0"/><xf numFmtId="14"/><xf numFmtId="176"/><xf numFmtId="20"/></cellXfs></styleSheet>`,
  );
  // A1:名前 B1:（空） C1:インライン文字 / 2行目は r 属性なし / 4行目に飛ぶ
  zip.file(
    "xl/worksheets/sheet1.xml",
    `<?xml version="1.0"?><worksheet ${ns}><sheetData>` +
      `<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" s="1"/><c r="C1" t="inlineStr"><is><t>インライン</t></is></c></row>` +
      `<row><c t="s"><v>1</v></c><c><v>0.30000000000000004</v></c><c t="b"><v>1</v></c><c t="e"><v>#DIV/0!</v></c></row>` +
      `<row r="4"><c r="B4" s="1"><v>45293</v></c><c r="C4" s="2"><v>45293</v></c><c r="D4" s="3"><v>0.5</v></c><c r="E4" t="str"><f>A1</f><v>計算結果</v></c><c r="F4" t="s"><v>2</v></c></row>` +
      `</sheetData></worksheet>`,
  );
  zip.file("xl/worksheets/sheet2.xml", `<?xml version="1.0"?><worksheet ${ns}><sheetData><row r="2"><c r="B2"><v>-12.5</v></c></row></sheetData></worksheet>`);
  return zip.generateAsync({ type: "uint8array" });
}

describe("Excel：部品", () => {
  it("番地と列名", () => {
    expect(parseRef("A1")).toEqual({ col: 0, row: 0 });
    expect(parseRef("$AB$12")).toEqual({ col: 27, row: 11 });
    expect(parseRef("XFD1048576")).toEqual({ col: 16383, row: 1048575 });
    expect(colName(0)).toBe("A");
    expect(colName(25)).toBe("Z");
    expect(colName(26)).toBe("AA");
    expect(colName(16383)).toBe("XFD");
  });
  it("文字参照とXML", () => {
    expect(decodeEntities("&lt;a&gt; &amp;amp; &#12354;&#x3044;")).toBe("<a> &amp; あい");
    const x = parseXml('<?xml version="1.0"?><x:a k="1&amp;2"><x:b/>text<![CDATA[<raw>]]></x:a>');
    const a = x.children[0] as { name: string; attrs: Record<string, string>; children: unknown[] };
    expect(a.name).toBe("a");
    expect(a.attrs.k).toBe("1&2");
    expect(a.children.slice(1)).toEqual(["text", "<raw>"]);
  });
  it("日付の書式の判定", () => {
    expect(dateKind(14)).toBe("date");
    expect(dateKind(22)).toBe("datetime");
    expect(dateKind(20)).toBe("time");
    expect(dateKind(0)).toBeNull();
    expect(dateKind(2)).toBeNull();
    expect(dateKind(176, 'yyyy"年"m"月"d"日"')).toBe("date");
    expect(dateKind(177, "yyyy/mm/dd hh:mm")).toBe("datetime");
    expect(dateKind(178, "[h]:mm:ss")).toBe("time");
    expect(dateKind(179, "mm:ss")).toBe("time");
    expect(dateKind(180, '#,##0"円"')).toBeNull();
    expect(dateKind(181, "[Red]#,##0;[Blue]-#,##0")).toBeNull();
    expect(dateKind(182, "0.00E+00")).toBeNull();
    expect(dateKind(183, "General")).toBeNull();
  });
  it("シリアル値を日付に（Excel の 1900年の数え方）", () => {
    expect(formatSerial(1, "date")).toBe("1900-01-01");
    expect(formatSerial(59, "date")).toBe("1900-02-28");
    expect(formatSerial(60, "date")).toBe("1900-02-29");
    expect(formatSerial(61, "date")).toBe("1900-03-01");
    expect(formatSerial(45293, "date")).toBe("2024-01-02");
    expect(formatSerial(45293.75, "datetime")).toBe("2024-01-02 18:00:00");
    expect(formatSerial(0.5, "time")).toBe("12:00:00");
    // 1904年基準
    expect(formatSerial(0, "date", true)).toBe("1904-01-01");
    expect(formatSerial(43831, "date", true)).toBe("2024-01-02");
  });
  it("数値の表示と、数値として書くかの判定", () => {
    expect(formatNumber("0.30000000000000004")).toBe("0.3");
    expect(formatNumber("1E-3")).toBe("0.001");
    expect(formatNumber("123456789")).toBe("123456789");
    expect(isNumberCell("123")).toBe(true);
    expect(isNumberCell("-1.5")).toBe(true);
    expect(isNumberCell("0123")).toBe(false);
    expect(isNumberCell("1234567890123456")).toBe(false);
    expect(isNumberCell("1,000")).toBe(false);
    expect(sheetName("売上/2024[1]")).toBe("売上_2024_1_");
    expect(sheetName("")).toBe("Sheet1");
  });
});

describe("Excel：読み込みと書き出し", () => {
  it("シート名・共有文字列（書式付き・ふりがな除く）・セルの型・抜けたセル", async () => {
    const wb = await openXlsx(await sampleXlsx());
    expect(wb.sheets.map((s) => s.name)).toEqual(["売上", "メモ & 予定"]);
    expect(wb.shared).toEqual(["名前", "山田 太郎", "a<b\r"]);
    const rows = await readSheet(wb, 0, { formatDates: true });
    expect(rows).toEqual([
      ["名前", "", "インライン", "", "", ""],
      ["山田 太郎", "0.3", "TRUE", "#DIV/0!", "", ""],
      ["", "", "", "", "", ""],
      ["", "2024-01-02", "2024-01-02", "12:00:00", "計算結果", "a<b\r"],
    ]);
    const raw = await readSheet(wb, 0, { formatDates: false });
    expect(raw[3].slice(1, 4)).toEqual(["45293", "45293", "0.5"]);
    expect(await readSheet(wb, 1, { formatDates: true })).toEqual([
      ["", ""],
      ["", "-12.5"],
    ]);
  });

  it("CSV から作った xlsx を読み戻すと同じ表になる", async () => {
    const rows = [
      ["名前", "郵便番号", "点数", "メモ"],
      ["山田", "0123", "80", 'カンマ,と"引用符" & <タグ>'],
      ["佐藤", "", "92.5", "改行\nあり"],
    ];
    const bytes = await buildXlsx(rows, "成績");
    const wb = await openXlsx(bytes);
    expect(wb.sheets.map((s) => s.name)).toEqual(["成績"]);
    expect(await readSheet(wb, 0, { formatDates: true })).toEqual(rows);
    // 数値は数値のセル、0で始まる番号は文字のセルになっている
    const xml = await (await JSZip.loadAsync(bytes)).file("xl/worksheets/sheet1.xml")!.async("string");
    expect(xml).toContain('<c r="C2"><v>80</v></c>');
    expect(xml).toContain('<c r="B2" t="inlineStr">');
  });

  it("xlsx でないものはエラー", async () => {
    await expect(openXlsx(new TextEncoder().encode("not a zip"))).rejects.toThrow(/xlsx として読めません/);
  });
});
