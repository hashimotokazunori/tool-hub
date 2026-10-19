import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  addBusinessDays,
  countBusinessDays,
  countdownParts,
  countdownPresets,
  dateTimeToEpoch,
  describeEpoch,
  isoWeek,
  nthWeekday,
  parseUnix,
  timeInZone,
  weekOfMonth,
  zoneOffsetMinutes,
  zonedToEpoch,
} from "@/features/tools/date/time/logic";
import {
  SAMPLE_JWT,
  base64UrlDecode,
  base64UrlEncode,
  cmykToRgb,
  contrastRatio,
  decodeJwt,
  formatCmyk,
  formatHsl,
  hashAll,
  hashBytes,
  hslToRgb,
  jwtTimes,
  md5,
  parseColor,
  rgbToHex,
  sameHash,
  utf8,
} from "@/features/tools/developer/crypto/logic";

describe("カウントダウン", () => {
  it("残りの日・時・分・秒", () => {
    const now = Date.UTC(2026, 0, 1, 0, 0, 0);
    expect(countdownParts(now + ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000, now)).toMatchObject({ done: false, days: 2, hours: 3, minutes: 4, seconds: 5 });
    expect(countdownParts(now, now).done).toBe(true);
    expect(countdownParts(now - 1000, now).done).toBe(true);
  });
  it("プリセットは今日より後の日付", () => {
    const p = Object.fromEntries(countdownPresets(new Date(2026, 9, 19)).map((x) => [x.label, x.value]));
    expect(p["次の元日"]).toBe("2027-01-01T00:00");
    expect(p["クリスマス"]).toBe("2026-12-25T00:00");
    expect(p["バレンタインデー"]).toBe("2027-02-14T00:00");
    expect(p["明日の0時"]).toBe("2026-10-20T00:00");
    // 当日のクリスマスは来年
    expect(countdownPresets(new Date(2026, 11, 25)).find((x) => x.label === "クリスマス")?.value).toBe("2027-12-25T00:00");
  });
});

describe("タイムゾーン", () => {
  it("時差と夏時間", () => {
    const winter = Date.UTC(2026, 0, 15, 3, 0);
    const summer = Date.UTC(2026, 6, 15, 3, 0);
    expect(zoneOffsetMinutes("Asia/Tokyo", winter)).toBe(540);
    expect(zoneOffsetMinutes("Asia/Kolkata", winter)).toBe(330);
    expect(zoneOffsetMinutes("America/New_York", winter)).toBe(-300);
    expect(zoneOffsetMinutes("America/New_York", summer)).toBe(-240);
    expect(zoneOffsetMinutes("Australia/Sydney", winter)).toBe(660);
    expect(zoneOffsetMinutes("Australia/Sydney", summer)).toBe(600);
    expect(timeInZone(summer, "Europe/London")).toMatchObject({ time: "04:00", offsetLabel: "UTC+1", dst: true });
    expect(timeInZone(winter, "Europe/London")).toMatchObject({ time: "03:00", offsetLabel: "UTC+0", dst: false });
    expect(timeInZone(winter, "Asia/Kolkata").offsetLabel).toBe("UTC+5:30");
    expect(timeInZone(winter, "Pacific/Honolulu")).toMatchObject({ ymd: "2026-01-14", time: "17:00", offsetLabel: "UTC−10" });
  });
  it("現地時刻から時刻へ", () => {
    expect(zonedToEpoch("2026-10-19", "09:00", "Asia/Tokyo")).toBe(Date.UTC(2026, 9, 19, 0, 0));
    expect(zonedToEpoch("2026-07-01", "12:00", "America/New_York")).toBe(Date.UTC(2026, 6, 1, 16, 0));
    // 夏時間の始まりで存在しない 2:30 は、切り替え後の 3:30（EDT）
    expect(zonedToEpoch("2026-03-08", "02:30", "America/New_York")).toBe(Date.UTC(2026, 2, 8, 7, 30));
    expect(zonedToEpoch("2026-02-30", "02:30", "Asia/Tokyo")).toBeNull();
  });
});

describe("Unix時間", () => {
  it("秒・ミリ秒の判定と表示", () => {
    expect(parseUnix("1700000000", "auto")).toEqual({ ms: 1_700_000_000_000, unit: "s" });
    expect(parseUnix("1700000000000", "auto")).toEqual({ ms: 1_700_000_000_000, unit: "ms" });
    expect(parseUnix("abc", "auto")).toBeNull();
    const d = describeEpoch(1_700_000_000_000);
    expect(d.utc).toBe("2023-11-14 22:13:20");
    expect(d.jst).toBe("2023-11-15 07:13:20");
    expect(d.isoUtc).toBe("2023-11-14T22:13:20.000Z");
    expect(d.isoJst).toBe("2023-11-15T07:13:20.000+09:00");
    expect(d.weekdayJst).toBe("水");
    expect(describeEpoch(0).utc).toBe("1970-01-01 00:00:00");
  });
  it("日時から", () => {
    expect(dateTimeToEpoch("1970-01-01T09:00", "jst")).toBe(0);
    expect(dateTimeToEpoch("2023-11-14T22:13:20", "utc")).toBe(1_700_000_000_000);
    expect(dateTimeToEpoch("2023-13-01T00:00", "utc")).toBeNull();
  });
});

describe("営業日", () => {
  const o = { yearEnd: false };
  it("期間の営業日数（土日祝を除く）", () => {
    // 2026年5月：31日、土日10日、平日の祝日 4(月)・5(火)・6(水・振替休日)
    const r = countBusinessDays("2026-05-01", "2026-05-31", o)!;
    expect(r).toMatchObject({ totalDays: 31, weekendDays: 10, holidayDays: 3, businessDays: 18 });
    expect(r.holidays.map((h) => h.name)).toEqual(["みどりの日", "こどもの日", "振替休日"]);
    // 開始日を数えない
    expect(countBusinessDays("2026-10-19", "2026-10-23", o, false)!.businessDays).toBe(4);
    // 逆順でも同じ
    expect(countBusinessDays("2026-05-31", "2026-05-01", o)!.businessDays).toBe(18);
  });
  it("年末年始を休みにする", () => {
    // 2026-12-28(月)〜2027-01-08(金)：平日は 12/28-31, 1/1, 1/4-8 = 10日。元日は祝日
    expect(countBusinessDays("2026-12-28", "2027-01-08", o)!.businessDays).toBe(9);
    const r = countBusinessDays("2026-12-28", "2027-01-08", { yearEnd: true })!;
    expect(r.businessDays).toBe(6);
    expect(r.yearEndDays).toBe(3);
  });
  it("○営業日後・前", () => {
    expect(addBusinessDays("2026-10-16", 1, o)).toBe("2026-10-19"); // 金→月
    expect(addBusinessDays("2026-04-30", 1, o)).toBe("2026-05-01");
    expect(addBusinessDays("2026-05-01", 1, o)).toBe("2026-05-07"); // GW明け
    expect(addBusinessDays("2026-05-07", -1, o)).toBe("2026-05-01");
    expect(addBusinessDays("2026-12-28", 2, { yearEnd: true })).toBe("2027-01-05");
    expect(addBusinessDays("2026-10-17", 0, o)).toBe("2026-10-17");
  });
});

describe("週番号", () => {
  it("ISO 8601", () => {
    expect(isoWeek("2026-10-19")).toMatchObject({ weekYear: 2026, week: 43, label: "2026-W43", start: "2026-10-19", end: "2026-10-25" });
    expect(isoWeek("2021-01-03")).toMatchObject({ weekYear: 2020, week: 53, weeksInYear: 53 });
    expect(isoWeek("2024-12-30")).toMatchObject({ weekYear: 2025, week: 1 });
    expect(isoWeek("2027-01-01")).toMatchObject({ weekYear: 2026, week: 53, weeksInYear: 53 });
    expect(isoWeek("2025-06-01")).toMatchObject({ weekYear: 2025, week: 22, weeksInYear: 52 });
  });
  it("月の第何週", () => {
    // 2026年11月1日は日曜日
    expect(weekOfMonth("2026-11-01", 0)).toBe(1);
    expect(weekOfMonth("2026-11-02", 0)).toBe(1);
    expect(weekOfMonth("2026-11-02", 1)).toBe(2);
    expect(weekOfMonth("2026-11-30", 0)).toBe(5);
    expect(weekOfMonth("2026-11-30", 1)).toBe(6);
    expect(nthWeekday("2026-10-12")).toEqual({ n: 2, weekday: "月" });
  });
});

describe("ハッシュ", () => {
  it("MD5 の既知の値（RFC 1321）", () => {
    const v: [string, string][] = [
      ["", "d41d8cd98f00b204e9800998ecf8427e"],
      ["a", "0cc175b9c0f1b6a831c399e269772661"],
      ["abc", "900150983cd24fb0d6963f7d28e17f72"],
      ["message digest", "f96b697d7cb7938d525a2f31aaf161d0"],
      ["abcdefghijklmnopqrstuvwxyz", "c3fcd3d76192e4007dfb496cca67e13b"],
      ["The quick brown fox jumps over the lazy dog", "9e107d9d372bb6826bd81d3542a419d6"],
      ["12345678901234567890123456789012345678901234567890123456789012345678901234567890", "57edf4a22be3c955ac49da2e2107b67a"],
    ];
    for (const [s, h] of v) expect(md5(utf8(s))).toBe(h);
  });
  it("MD5 はどの長さでも Node.js と一致", () => {
    for (let n = 0; n <= 200; n++) {
      const b = Uint8Array.from({ length: n }, (_, i) => (i * 37 + n) & 0xff);
      expect(md5(b)).toBe(createHash("md5").update(b).digest("hex"));
    }
    expect(md5(utf8("日本語のテキスト🍣"))).toBe(createHash("md5").update("日本語のテキスト🍣", "utf8").digest("hex"));
  });
  it("SHA", async () => {
    expect(await hashBytes("SHA-256", utf8("abc"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(await hashBytes("SHA-1", utf8("abc"))).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
    const all = await hashAll(utf8("ツールひろば"));
    for (const [a, n] of [["SHA-384", "sha384"], ["SHA-512", "sha512"]] as const) expect(all[a]).toBe(createHash(n).update("ツールひろば", "utf8").digest("hex"));
    expect(sameHash("BA:78:16 BF", "ba7816bf")).toBe(true);
    expect(sameHash("", "")).toBe(false);
  });
});

describe("カラーコード", () => {
  it("相互変換", () => {
    expect(parseColor("hex", "#1e90ff")).toEqual({ r: 30, g: 144, b: 255 });
    expect(parseColor("hex", "f0a")).toEqual({ r: 255, g: 0, b: 170 });
    expect(parseColor("hex", "#12345")).toBeNull();
    expect(parseColor("rgb", "rgb(30, 144, 255)")).toEqual({ r: 30, g: 144, b: 255 });
    expect(parseColor("rgb", "30 144 300")).toBeNull();
    expect(parseColor("hsl", "hsl(0, 100%, 50%)")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hslToRgb({ h: 120, s: 100, l: 25 })).toEqual({ r: 0, g: 128, b: 0 });
    expect(formatHsl({ r: 30, g: 144, b: 255 })).toBe("hsl(210, 100%, 56%)");
    expect(formatCmyk({ r: 255, g: 0, b: 0 })).toBe("cmyk(0%, 100%, 100%, 0%)");
    expect(formatCmyk({ r: 0, g: 0, b: 0 })).toBe("cmyk(0%, 0%, 0%, 100%)");
    expect(cmykToRgb({ c: 0, m: 0, y: 0, k: 50 })).toEqual({ r: 128, g: 128, b: 128 });
    expect(rgbToHex({ r: 30, g: 144, b: 255 })).toBe("#1E90FF");
  });
  it("コントラスト比", () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(21, 5);
    expect(contrastRatio({ r: 119, g: 119, b: 119 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(4.48, 2);
  });
});

describe("JWT", () => {
  it("base64url", () => {
    expect(base64UrlDecode(base64UrlEncode("山田🍣?>"))).toBe("山田🍣?>");
    expect(base64UrlEncode("??>")).toBe("Pz8-");
    expect(base64UrlDecode("@@@")).toBeNull();
  });
  it("デコードと期限", () => {
    const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const r = decodeJwt(`Bearer ${jwt}`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(r.payload).toEqual({ sub: "1234567890", name: "John Doe", iat: 1516239022 });
    const st = jwtTimes(r.payload, 1_800_000_000);
    expect(st.expired).toBeNull();
    expect(st.times[0]).toMatchObject({ claim: "iat", jst: "2018-01-18 10:30:22（JST）" });

    const s = decodeJwt(SAMPLE_JWT);
    expect(s.ok && (s.payload as { name: string }).name).toBe("山田太郎");
    if (s.ok) {
      expect(jwtTimes(s.payload, 1767229199).expired).toBe(false);
      expect(jwtTimes(s.payload, 1767229200).expired).toBe(true);
      expect(jwtTimes({ nbf: 200 }, 100).notYetValid).toBe(true);
    }
    expect(decodeJwt("abc.def").ok).toBe(false);
    expect(decodeJwt("e30.bm90IGpzb24.x").ok).toBe(false);
  });
});
