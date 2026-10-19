import { describe, expect, it } from "vitest";
import { chars, roundTwoColumns, roundVertical, squareGrid, squareLayout, stampDate, dateTiers, chordWidth } from "@/features/tools/generator/hanko/logic";
import { applyMask, backgroundMask, dominantColors, maskRatio, readableTextColor, toHex, toRgbText, toleranceDistance, MAX_DISTANCE } from "@/features/tools/image/color/logic";
import { blockOrigin, fontPx, placementFromOrigin, presetPlacement, splitLines } from "@/features/tools/image/text/logic";
import { GIF_TRAILER, clampRange, concatBytes, encodeRgbaFrame, encodeWav, formatTime, frameDelays, frameTimes, gifFrame, gifHeader, lzwDecode, lzwEncode, mapToPalette, medianCut, minCodeSize, scaledSize, wavSize } from "@/features/tools/media/logic";

/** w×h の単色 RGBA */
function solid(w: number, h: number, [r, g, b]: number[]) {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) d.set([r, g, b, 255], i * 4);
  return d;
}

describe("色の表示", () => {
  it("HEX と RGB", () => {
    expect(toHex({ r: 255, g: 0, b: 128 })).toBe("#FF0080");
    expect(toHex({ r: 1.4, g: 300, b: -2 })).toBe("#01FF00");
    expect(toRgbText({ r: 12, g: 34, b: 56 })).toBe("rgb(12, 34, 56)");
  });
  it("読みやすい文字色", () => {
    expect(readableTextColor({ r: 255, g: 255, b: 255 })).toBe("#000000");
    expect(readableTextColor({ r: 0, g: 0, b: 80 })).toBe("#FFFFFF");
  });
});

describe("代表色（k-means）", () => {
  it("2色が3:1の画像から、その2色と割合を取り出す", () => {
    const d = new Uint8ClampedArray(400 * 4);
    for (let i = 0; i < 400; i++) d.set(i < 300 ? [200, 30, 30, 255] : [20, 40, 220, 255], i * 4);
    const res = dominantColors(d, 5);
    expect(res).toHaveLength(2);
    expect(toHex(res[0])).toBe("#C81E1E");
    expect(res[0].ratio).toBeCloseTo(0.75, 10);
    expect(toHex(res[1])).toBe("#1428DC");
  });
  it("透明な画素は数えない", () => {
    const d = solid(10, 10, [0, 255, 0]);
    for (let i = 0; i < 50; i++) d[i * 4 + 3] = 0;
    const res = dominantColors(d, 3);
    expect(res).toHaveLength(1);
    expect(res[0].ratio).toBe(1);
  });
  it("空なら空", () => {
    expect(dominantColors(new Uint8ClampedArray(0), 5)).toEqual([]);
  });
});

describe("背景透過", () => {
  // 5×5 の白地の真ん中に 3×3 の赤。ただし右下隅にも離れた白でない点はない
  const img = () => {
    const d = solid(5, 5, [255, 255, 255]);
    for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) d.set([255, 0, 0, 255], (y * 5 + x) * 4);
    // 赤の真ん中に白い穴
    d.set([255, 255, 255, 255], (2 * 5 + 2) * 4);
    return d;
  };
  it("つながった所だけ消すと、囲まれた白い穴は残る", () => {
    const m = backgroundMask(img(), 5, 5, [{ x: 0, y: 0 }], 10, true);
    expect(maskRatio(m)).toBeCloseTo(16 / 25, 10);
    expect(m[2 * 5 + 2]).toBe(0);
  });
  it("同じ色をすべて消すと、穴も消える", () => {
    const m = backgroundMask(img(), 5, 5, [{ x: 0, y: 0 }], 10, false);
    expect(maskRatio(m)).toBeCloseTo(17 / 25, 10);
    expect(m[2 * 5 + 2]).toBe(1);
  });
  it("許容範囲を広げると近い色も消える", () => {
    const d = solid(2, 1, [255, 255, 255]);
    d.set([230, 230, 230, 255], 4);
    expect(maskRatio(backgroundMask(d, 2, 1, [{ x: 0, y: 0 }], 5, true))).toBe(0.5);
    expect(maskRatio(backgroundMask(d, 2, 1, [{ x: 0, y: 0 }], 10, true))).toBe(1);
    expect(toleranceDistance(100)).toBeCloseTo(MAX_DISTANCE, 10);
  });
  it("消す所の透明度を0にする", () => {
    const d = img();
    const m = backgroundMask(d, 5, 5, [{ x: 0, y: 0 }], 10, true);
    applyMask(d, 5, 5, m);
    expect(d[3]).toBe(0);
    expect(d[(1 * 5 + 1) * 4 + 3]).toBe(255);
  });
  it("境目をなめらかにすると、接する画素が半透明になる", () => {
    const d = img();
    const m = backgroundMask(d, 5, 5, [{ x: 0, y: 0 }], 10, true);
    applyMask(d, 5, 5, m, { soften: true, background: { r: 255, g: 255, b: 255 }, tolerancePct: 10 });
    const a = d[(1 * 5 + 1) * 4 + 3];
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(255);
  });
});

describe("GIF の LZW", () => {
  // 「What's in a GIF」(Matthew Flickinger) の 10×10 の例
  const sample = [
    [1, 1, 1, 1, 1, 2, 2, 2, 2, 2],
    [1, 1, 1, 1, 1, 2, 2, 2, 2, 2],
    [1, 1, 1, 1, 1, 2, 2, 2, 2, 2],
    [1, 1, 1, 0, 0, 0, 0, 2, 2, 2],
    [1, 1, 1, 0, 0, 0, 0, 2, 2, 2],
    [2, 2, 2, 0, 0, 0, 0, 1, 1, 1],
    [2, 2, 2, 0, 0, 0, 0, 1, 1, 1],
    [2, 2, 2, 2, 2, 1, 1, 1, 1, 1],
    [2, 2, 2, 2, 2, 1, 1, 1, 1, 1],
    [2, 2, 2, 2, 2, 1, 1, 1, 1, 1],
  ].flat();
  const expected = [0x8c, 0x2d, 0x99, 0x87, 0x2a, 0x1c, 0xdc, 0x33, 0xa0, 0x02, 0x75, 0xec, 0x95, 0xfa, 0xa8, 0xde, 0x60, 0x8c, 0x04, 0x91, 0x4c, 0x01];
  it("既知の圧縮結果と一致する", () => {
    expect([...lzwEncode(sample, 2)]).toEqual(expected);
  });
  it("元に戻せる", () => {
    expect(lzwDecode(expected, 2)).toEqual(sample);
  });
  it("表がいっぱいになる長いデータも往復できる", () => {
    let s = 12345;
    const data = Array.from({ length: 60000 }, () => {
      s = (s * 1103515245 + 12345) % 2147483648;
      return (s >> 16) & 255;
    });
    expect(lzwDecode(lzwEncode(data, 8), 8)).toEqual(data);
  });
  it("最小コードサイズ", () => {
    expect(minCodeSize(2)).toBe(2);
    expect(minCodeSize(4)).toBe(2);
    expect(minCodeSize(16)).toBe(4);
    expect(minCodeSize(256)).toBe(8);
  });
});

describe("GIF の組み立て", () => {
  it("先頭は GIF89a と大きさ、無限ループの NETSCAPE2.0", () => {
    const h = gifHeader(320, 180);
    expect(String.fromCharCode(...h.subarray(0, 6))).toBe("GIF89a");
    expect([...h.subarray(6, 10)]).toEqual([0x40, 0x01, 0xb4, 0x00]);
    expect([...h.subarray(13, 16)]).toEqual([0x21, 0xff, 0x0b]);
    expect(String.fromCharCode(...h.subarray(16, 27))).toBe("NETSCAPE2.0");
    expect([...h.subarray(27)]).toEqual([0x03, 0x01, 0x00, 0x00, 0x00]);
    expect(GIF_TRAILER[0]).toBe(0x3b);
  });
  it("1コマ：表示時間・色表・画像データ", () => {
    const palette = { colors: Uint8Array.from([255, 255, 255, 255, 0, 0, 0, 0, 255, 0, 0, 0]), count: 4 };
    const indices = [1, 1, 1, 0, 0, 2, 2, 3, 3];
    const f = gifFrame(3, 3, indices, palette, 10);
    expect([...f.subarray(0, 8)]).toEqual([0x21, 0xf9, 0x04, 0x04, 10, 0, 0, 0]);
    expect(f[8]).toBe(0x2c);
    expect([...f.subarray(13, 17)]).toEqual([3, 0, 3, 0]);
    expect(f[17]).toBe(0x81); // コマの色表あり・4色
    expect([...f.subarray(18, 30)]).toEqual([...palette.colors]);
    expect(f[30]).toBe(2); // 最小コードサイズ
    const len = f[31];
    expect(lzwDecode(f.subarray(32, 32 + len), 2, 9)).toEqual(indices);
    expect(f[32 + len]).toBe(0);
    expect(f.length).toBe(33 + len);
  });
  it("つなぐと GIF89a で始まり 0x3B で終わる", () => {
    const rgba = solid(4, 4, [10, 20, 30]);
    const gif = concatBytes([gifHeader(4, 4), encodeRgbaFrame(rgba, 4, 4, 10), encodeRgbaFrame(rgba, 4, 4, 10), GIF_TRAILER]);
    expect(String.fromCharCode(...gif.subarray(0, 6))).toBe("GIF89a");
    expect(gif[gif.length - 1]).toBe(0x3b);
  });
  it("減色：色数が少なければそのままの色になる", () => {
    const d = new Uint8ClampedArray(4 * 4);
    d.set([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 0, 0, 255]);
    const p = medianCut(d, 256);
    expect(p.count).toBe(3);
    const idx = mapToPalette(d, p);
    expect(idx[0]).toBe(idx[3]);
    expect([...p.colors.subarray(idx[1] * 3, idx[1] * 3 + 3)]).toEqual([0, 255, 0]);
  });
  it("減色：上限の色数に収める", () => {
    const d = new Uint8ClampedArray(256 * 256 * 4);
    for (let i = 0; i < 256 * 256; i++) d.set([i & 255, i >> 8, (i * 7) & 255, 255], i * 4);
    expect(medianCut(d, 16).count).toBe(16);
  });
});

describe("動画の範囲とコマ", () => {
  it("範囲は動画の長さと15秒に収める", () => {
    expect(clampRange(2, 40, 60)).toEqual({ start: 2, end: 17 });
    expect(clampRange(-1, 5, 3)).toEqual({ start: 0, end: 3 });
    expect(clampRange(4, 2, 10)).toEqual({ start: 4, end: 4 });
  });
  it("コマの時刻と表示時間", () => {
    expect(frameTimes(0, 1, 10)).toHaveLength(10);
    expect(frameTimes(0, 1, 10)[0]).toBeCloseTo(0.05, 10);
    const d = frameDelays(15, 15);
    expect(d.reduce((a, b) => a + b, 0)).toBe(100);
    expect(new Set(d)).toEqual(new Set([7, 6]));
    expect(frameDelays(3, 10)).toEqual([10, 10, 10]);
  });
  it("横幅に合わせた大きさ（拡大しない）", () => {
    expect(scaledSize(1920, 1080, 480)).toEqual({ width: 480, height: 270 });
    expect(scaledSize(200, 100, 320)).toEqual({ width: 200, height: 100 });
  });
  it("時間の表示", () => {
    expect(formatTime(83.44)).toBe("1:23.4");
    expect(formatTime(5)).toBe("0:05.0");
  });
});

describe("WAV", () => {
  it("ヘッダーとデータ（ステレオ・44.1kHz）", () => {
    const wav = encodeWav([Float32Array.from([0, 1, -1]), Float32Array.from([0.5, -0.5, 2])], 44100);
    const v = new DataView(wav.buffer);
    const str = (o: number) => String.fromCharCode(...wav.subarray(o, o + 4));
    expect(str(0)).toBe("RIFF");
    expect(v.getUint32(4, true)).toBe(36 + 12);
    expect(str(8)).toBe("WAVE");
    expect(str(12)).toBe("fmt ");
    expect(v.getUint32(16, true)).toBe(16);
    expect(v.getUint16(20, true)).toBe(1);
    expect(v.getUint16(22, true)).toBe(2);
    expect(v.getUint32(24, true)).toBe(44100);
    expect(v.getUint32(28, true)).toBe(176400);
    expect(v.getUint16(32, true)).toBe(4);
    expect(v.getUint16(34, true)).toBe(16);
    expect(str(36)).toBe("data");
    expect(v.getUint32(40, true)).toBe(12);
    expect(wav.length).toBe(56);
    const samples = Array.from({ length: 6 }, (_, i) => v.getInt16(44 + i * 2, true));
    expect(samples).toEqual([0, 16384, 32767, -16384, -32768, 32767]);
  });
  it("大きさの見込み", () => {
    expect(wavSize(1, 48000, 1)).toBe(44 + 96000);
    expect(wavSize(10, 44100, 2)).toBe(44 + 1764000);
  });
});

describe("文字入れの位置", () => {
  it("位置の目安", () => {
    expect(presetPlacement("top", "left")).toEqual({ x: 0.05, y: 0.05, ax: 0, ay: 0 });
    expect(presetPlacement("bottom", "center")).toEqual({ x: 0.5, y: 0.95, ax: 0.5, ay: 1 });
  });
  it("左上の位置と、はみ出さないように収める", () => {
    expect(blockOrigin(presetPlacement("bottom", "right"), 100, 50, 1000, 500)).toEqual({ left: 850, top: 425 });
    expect(blockOrigin({ x: 0.5, y: 0.5, ax: 0.5, ay: 0.5 }, 200, 100, 1000, 500)).toEqual({ left: 400, top: 200 });
    expect(blockOrigin({ x: 0, y: 0, ax: 0.5, ay: 0.5 }, 200, 100, 1000, 500)).toEqual({ left: 0, top: 0 });
  });
  it("ドラッグした位置から基準点に戻す", () => {
    const p = presetPlacement("bottom", "right");
    expect(placementFromOrigin(850, 425, 100, 50, 1000, 500, p)).toEqual({ ...p, x: 0.95, y: 0.95 });
  });
  it("文字の大きさと行", () => {
    expect(fontPx(10, 1200, 800)).toBe(80);
    expect(splitLines("a\r\n\nb")).toEqual(["a", "", "b"]);
  });
});

describe("電子印鑑", () => {
  it("文字に分ける（空白を除く）", () => {
    expect(chars("山田 太郎")).toEqual(["山", "田", "太", "郎"]);
    expect(chars("𠮷田")).toHaveLength(2);
  });
  it("丸印の縦1列は上から順に、円の中に収まる", () => {
    const b = roundVertical("山田", 400, 360);
    expect(b.map((x) => x.ch)).toEqual(["山", "田"]);
    expect(b[0].cy).toBeLessThan(b[1].cy);
    for (const x of roundVertical("佐々木一", 400, 360)) {
      const dx = x.w / 2;
      const dy = Math.abs(x.cy - 200) + x.h / 2;
      expect(Math.hypot(dx, dy)).toBeLessThanOrEqual(180 * 1.02);
    }
  });
  it("丸印の2行は右の列が先", () => {
    const b = roundTwoColumns("山田", "太郎", 400, 360);
    expect(b[0].ch).toBe("山");
    expect(b[0].cx).toBeGreaterThan(b[2].cx);
  });
  it("角印の升目は右上から縦に読む", () => {
    expect(squareGrid(9)).toEqual({ rows: 3, cols: 3 });
    expect(squareGrid(12)).toEqual({ rows: 4, cols: 3 });
    expect(squareGrid(8)).toEqual({ rows: 3, cols: 3 });
    const b = squareLayout("株式会社山田之印", 400, 360);
    expect(b[0].cx).toBeGreaterThan(b[3].cx);
    expect(b[0].cy).toBeLessThan(b[1].cy);
    expect(b[3].cy).toBeCloseTo(b[0].cy, 10);
  });
  it("日付印の段は上・中・下の順で、線は円の中", () => {
    const t = dateTiers(400, 360);
    expect(t.top.cy).toBeLessThan(t.middle.cy);
    expect(t.middle.cy).toBeLessThan(t.bottom.cy);
    expect(t.lineHalf).toBeLessThan(180);
    expect(chordWidth(400, 360, 200, 0)).toBeCloseTo(360 * 0.9, 10);
  });
  it("日付の書き方（令和は2019年5月から）", () => {
    expect(stampDate(2026, 10, 19, "reiwa")).toBe("R8.10.19");
    expect(stampDate(2019, 5, 1, "reiwa")).toBe("R1.05.01");
    expect(stampDate(2019, 4, 30, "reiwa")).toBe("H31.04.30");
    expect(stampDate(1989, 1, 7, "reiwa")).toBe("S64.01.07");
    expect(stampDate(2026, 3, 5, "seireki")).toBe("2026.03.05");
    expect(stampDate(2026, 3, 5, "short")).toBe("26.03.05");
  });
});
