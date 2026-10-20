import { describe, expect, it } from "vitest";
import { shortSub } from "@/lib/og";

describe("OGP画像：説明文を短くする", () => {
  it("題名をくり返すだけの文は飛ばし、文の区切りで切る", () => {
    const s = shortSub("文字数カウンター", "文字数カウンターの無料ツール。文字数・空白除外・全角半角・行数・原稿用紙の枚数と、目標文字数までの残り。登録不要で、入力した内容はブラウザの中だけで処理します。");
    expect(s).toBe("文字数・空白除外・全角半角・行数・原稿用紙の枚数と、目標文字数までの残り。");
  });
  it("1文目が長すぎるときは途中で切って…を付ける", () => {
    expect(shortSub("x", "あ".repeat(80), 10)).toBe("あ".repeat(9) + "…");
  });
});
