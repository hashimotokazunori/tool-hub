import { describe, expect, it } from "vitest";
import { FURUSATO_CATEGORIES, rakutenFurusatoSearchUrl } from "@/data/furusato-categories";
import { filterByPrice, matchesPrice, parseMaxParam } from "@/lib/furusato-filter";
import { MUNICIPALITY_SHOP, cleanItemName, parseFurusatoItems, searchParamsFor } from "@/lib/furusato-items";

const item = (o: Record<string, unknown>) => ({
  itemName: "【ふるさと納税】 宮崎牛 ロース 500g",
  itemCode: "f452025-miyakonojo:10000001",
  itemPrice: 13000,
  shopName: "宮崎県都城市",
  shopCode: "f452025-miyakonojo",
  itemUrl: "https://item.rakuten.co.jp/f452025-miyakonojo/a/",
  affiliateUrl: "https://hb.afl.rakuten.co.jp/hgc/x/",
  mediumImageUrls: ["https://thumbnail.image.rakuten.co.jp/@0_mall/f452025-miyakonojo/cabinet/1.jpg?_ex=128x128"],
  reviewAverage: 4.64,
  reviewCount: 6731,
  availability: 1,
  ...o,
});

describe("楽天ふるさと納税の返礼品の読み取り", () => {
  it("自治体の店舗（f＋6桁＋ローマ字）だけを残す", () => {
    expect(MUNICIPALITY_SHOP.test("f452025-miyakonojo")).toBe(true);
    expect(MUNICIPALITY_SHOP.test("f01234-x")).toBe(false);
    expect(MUNICIPALITY_SHOP.test("furusato-book")).toBe(false);
    const list = parseFurusatoItems({
      items: [item({}), item({ shopCode: "bookshop", shopName: "本の店", itemCode: "bookshop:1", itemName: "ふるさと納税の本" })],
    });
    expect(list.map((x) => x.shopCode)).toEqual(["f452025-miyakonojo"]);
  });

  it("寄附額・名前・画像・リンク・レビューを読む（名前の【ふるさと納税】は除く、画像は大きく）", () => {
    const [x] = parseFurusatoItems({ items: [item({})] });
    expect(x).toEqual({
      id: "f452025-miyakonojo:10000001",
      name: "宮崎牛 ロース 500g",
      price: 13000,
      municipality: "宮崎県都城市",
      shopCode: "f452025-miyakonojo",
      imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/f452025-miyakonojo/cabinet/1.jpg?_ex=400x400",
      url: "https://hb.afl.rakuten.co.jp/hgc/x/",
      reviewAverage: 4.64,
      reviewCount: 6731,
    });
  });

  it("formatVersion=1 の形（Items[].Item）も読める。アフィリエイトURLがなければ商品URL", () => {
    const [x] = parseFurusatoItems({ Items: [{ Item: item({ affiliateUrl: undefined }) }] });
    expect(x.url).toBe("https://item.rakuten.co.jp/f452025-miyakonojo/a/");
  });

  it("同じ自治体は1件だけ。売り切れ・画像なし・寄附額0・ポイントや還元をうたう名前は除く", () => {
    const list = parseFurusatoItems({
      items: [
        item({}),
        item({ itemCode: "f452025-miyakonojo:2" }),
        item({ shopCode: "f016918-betsukai", itemCode: "b:1", availability: 0 }),
        item({ shopCode: "f016918-betsukai", itemCode: "b:2", mediumImageUrls: [] }),
        item({ shopCode: "f016918-betsukai", itemCode: "b:3", itemPrice: 0 }),
        item({ shopCode: "f016918-betsukai", itemCode: "b:4", itemName: "【ふるさと納税】ポイント5倍 牛肉" }),
        item({ shopCode: "f016918-betsukai", itemCode: "b:5", itemName: "【ふるさと納税】高還元 牛肉" }),
        item({ shopCode: "f016918-betsukai", itemCode: "b:6", itemName: "【ふるさと納税】別海牛" }),
      ],
    });
    expect(list.map((x) => x.id)).toEqual(["f452025-miyakonojo:10000001", "b:6"]);
  });

  it("件数の上限を守る。おかしな入力では空", () => {
    const many = Array.from({ length: 10 }, (_, i) => item({ shopCode: `f0000${String(i).padStart(2, "0")}-x`, itemCode: `x:${i}` }));
    expect(parseFurusatoItems({ items: many }, 3)).toHaveLength(3);
    expect(parseFurusatoItems(null)).toEqual([]);
    expect(parseFurusatoItems({ items: "x" })).toEqual([]);
  });

  it("名前を整える", () => {
    expect(cleanItemName(" 【ふるさと納税】  近江牛　入り  ハンバーグ ")).toBe("近江牛 入り ハンバーグ");
  });

  it("検索条件：キーワード「ふるさと納税」、カテゴリのジャンルID、レビューの多い順", () => {
    const meat = FURUSATO_CATEGORIES.find((c) => c.id === "meat")!;
    expect(searchParamsFor(meat)).toMatchObject({ keyword: "ふるさと納税", genreId: "100228", sort: "-reviewCount" });
    expect(searchParamsFor(FURUSATO_CATEGORIES[0])).not.toHaveProperty("genreId");
    expect(rakutenFurusatoSearchUrl(meat)).toBe("https://search.rakuten.co.jp/search/event/%E3%81%B5%E3%82%8B%E3%81%95%E3%81%A8%E7%B4%8D%E7%A8%8E/100228/?ev=40");
  });
});

describe("寄附額の絞り込み", () => {
  it("?max= を読む", () => {
    expect(parseMaxParam("?max=52000")).toBe(52000);
    expect(parseMaxParam("max=52,000")).toBe(52000);
    expect(parseMaxParam("?max=５２０００")).toBe(52000);
    expect(parseMaxParam("?a=1&max=30000&b=2")).toBe(30000);
    expect(parseMaxParam("")).toBeNull();
    expect(parseMaxParam("?max=")).toBeNull();
    expect(parseMaxParam("?max=-5")).toBeNull();
    expect(parseMaxParam("?max=1e5")).toBeNull();
    expect(parseMaxParam("?max=12.5")).toBeNull();
    expect(parseMaxParam("?max=500")).toBeNull();
    expect(parseMaxParam("?max=999999999999")).toBeNull();
  });

  it("価格帯の境目（1万円ちょうどは「〜1万円」）", () => {
    expect(matchesPrice(10000, { kind: "band", id: "u10k" })).toBe(true);
    expect(matchesPrice(10001, { kind: "band", id: "u10k" })).toBe(false);
    expect(matchesPrice(10001, { kind: "band", id: "10-20k" })).toBe(true);
    expect(matchesPrice(20000, { kind: "band", id: "10-20k" })).toBe(true);
    expect(matchesPrice(20000, { kind: "band", id: "o20k" })).toBe(false);
    expect(matchesPrice(20001, { kind: "band", id: "o20k" })).toBe(true);
    expect(matchesPrice(500000, { kind: "band", id: "o20k" })).toBe(true);
    expect(matchesPrice(5, { kind: "band", id: "unknown" })).toBe(true);
  });

  it("上限額以内・すべて", () => {
    const list = [{ price: 8000 }, { price: 15000 }, { price: 52000 }];
    expect(filterByPrice(list, { kind: "max", value: 15000 })).toEqual([{ price: 8000 }, { price: 15000 }]);
    expect(filterByPrice(list, { kind: "all" })).toHaveLength(3);
  });
});

describe("商品名の飾りを外す", () => {
  it("【】・＼／・★★ の宣伝文句を外す", () => {
    expect(cleanItemName("【ふるさと納税】【最強翌日配送】2年連続総合1位 ホタテ 訳あり")).toBe("2年連続総合1位 ホタテ 訳あり");
    expect(cleanItemName("＼総合ランキング1位獲得／累計4000万個突破 鉄板焼ハンバーグ")).toBe("累計4000万個突破 鉄板焼ハンバーグ");
    expect(cleanItemName("★レビュー高評価★ 黒毛和牛 切り落とし 1kg")).toBe("黒毛和牛 切り落とし 1kg");
    expect(cleanItemName("【ふるさと納税】")).toBe("");
  });
});
