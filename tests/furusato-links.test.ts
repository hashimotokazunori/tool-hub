import { describe, expect, it } from "vitest";
import { a8DeepLink, municipalityKeyword, municipalitySearchLinks } from "@/lib/furusato-links";

describe("ふるさと納税：自治体で探すリンク", () => {
  it("都道府県名を外して自治体名だけにする", () => {
    expect(municipalityKeyword("北海道別海町")).toBe("別海町");
    expect(municipalityKeyword("宮崎県都城市")).toBe("都城市");
    expect(municipalityKeyword("鹿児島県志布志市")).toBe("志布志市");
    expect(municipalityKeyword("京都府舞鶴市")).toBe("舞鶴市");
    expect(municipalityKeyword("福岡県飯塚市（ふるさと納税）")).toBe("飯塚市");
  });

  it("A8 の商品リンクの形で、飛び先をURLエンコードする", () => {
    const [au, honpo] = municipalitySearchLinks("北海道別海町");
    expect(au.href).toBe(
      "https://px.a8.net/svt/ejp?a8mat=4BEL1P+3NKU8Q+54OC+BW0YB&a8ejpredirect=" +
        encodeURIComponent("https://furusato.wowma.jp/products/list.php?search_word=" + encodeURIComponent("別海町")),
    );
    expect(decodeURIComponent(honpo.href.split("a8ejpredirect=")[1])).toBe(
      "https://furusatohonpo.jp/donate/s/?keyword=" + encodeURIComponent("別海町"),
    );
  });

  it("広告主のサイトの外には飛ばさない", () => {
    expect(a8DeepLink("X", "https://furusatohonpo.jp/", "https://example.com/")).toBeNull();
  });
});
