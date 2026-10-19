import { afterEach, describe, expect, it, vi } from "vitest";
import { dropOutliers, getMarketData, largerImage, matchesProduct, normalizeName, parseItemResult, parseProductResult } from "@/lib/rakuten";
import type { Product } from "@/lib/types";

// 楽天ウェブサービスの説明ページにある項目名どおりの、形だけの試験データ（formatVersion=2）
const itemJson = {
  count: 5,
  Items: [
    { itemName: "【送料無料】サンワサプライ PDA-STN34S ノートPCスタンド", itemPrice: 6200, itemUrl: "https://item.rakuten.co.jp/a/1/", affiliateUrl: "https://hb.afl.rakuten.co.jp/a1", shopName: "A店", postageFlag: 0, pointRate: 5, reviewAverage: 4.5, reviewCount: 12, mediumImageUrls: ["https://thumbnail.image.rakuten.co.jp/@0_mall/a/cabinet/1.jpg?_ex=128x128"], availability: 1 },
    { itemName: "サンワサプライ PDA-STN34S", itemPrice: 5980, itemUrl: "https://item.rakuten.co.jp/b/1/", shopName: "B店", postageFlag: 1, pointRate: 1, reviewAverage: 0, reviewCount: 0, mediumImageUrls: [], availability: 1 },
    { itemName: "サンワサプライ PDA-STN34S 2個目", itemPrice: 7000, itemUrl: "https://item.rakuten.co.jp/b/2/", shopName: "B店", postageFlag: 1, pointRate: 1, reviewAverage: 0, reviewCount: 0, availability: 1 },
    { itemName: "【中古】PDA-STN34S", itemPrice: 2000, itemUrl: "https://item.rakuten.co.jp/c/1/", shopName: "C店", postageFlag: 1, pointRate: 1, availability: 1 },
    { itemName: "別のスタンド PDA-STN99", itemPrice: 1000, itemUrl: "https://item.rakuten.co.jp/d/1/", shopName: "D店", postageFlag: 1, pointRate: 1, availability: 1 },
  ],
};
const productJson = {
  count: 2,
  Products: [
    { productName: "関係ない製品", productNo: "X-1", minPrice: 10, itemCount: 1 },
    {
      productName: "ノートパソコン用アルミスタンド PDA-STN34S",
      productNo: "PDA-STN34S",
      minPrice: 5980,
      maxPrice: 7980,
      averagePrice: 6600,
      usedExcludeMinPrice: 5980,
      usedExcludeMaxPrice: 7500,
      usedExcludeCount: 8,
      itemCount: 9,
      reviewAverage: 4.31,
      reviewCount: 42,
      mediumImageUrl: "https://thumbnail.image.rakuten.co.jp/@0_pc/x.jpg?_ex=128x128",
      productUrlPC: "https://product.rakuten.co.jp/product/-/abc/",
      ProductDetails: [{ name: "素材", value: "アルミ" }],
    },
  ],
};
const match = [["PDA-STN34S"]];

describe("楽天の価格データの読み取り", () => {
  it("名前の比べ方（全角・記号・大文字小文字をそろえる）", () => {
    expect(normalizeName("ＰＤＡ－ｓｔｎ３４Ｓ（ブラック）")).toBe("PDASTN34Sブラック");
    expect(matchesProduct("Anker Nano Power Bank (10000mAh, 45W)", [["A1638"], ["Nano Power Bank", "10000", "45W"]])).toBe(true);
    expect(matchesProduct("Anker Nano Charger 45W", [["A1638"], ["Nano Power Bank", "10000", "45W"]])).toBe(false);
    expect(matchesProduct("SR-R2500P対応 テープ", [["SR-R2500P"]], ["対応"])).toBe(false);
  });
  it("店舗ごとの価格：型番が合う商品だけを安い順に、同じ店は1件、中古は除く", () => {
    const o = parseItemResult(itemJson, match);
    expect(o.map((x) => [x.shopName, x.price])).toEqual([
      ["B店", 5980],
      ["A店", 6200],
    ]);
    expect(o[1]).toMatchObject({ postageIncluded: true, pointRate: 5, url: "https://hb.afl.rakuten.co.jp/a1" });
    expect(o[1].imageUrl).toBe("https://thumbnail.image.rakuten.co.jp/@0_mall/a/cabinet/1.jpg?_ex=400x400");
    expect(o[0].postageIncluded).toBe(false);
  });
  it("formatVersion=1 の形（Item で包まれている）でも読める", () => {
    const v1 = { Items: itemJson.Items.map((Item) => ({ Item: { ...Item, mediumImageUrls: (Item.mediumImageUrls ?? []).map((imageUrl) => ({ imageUrl })) } })) };
    expect(parseItemResult(v1, match)).toHaveLength(2);
  });
  it("製品検索：型番が合う製品の最安値・評価・スペック（中古を除いた値を優先）", () => {
    const p = parseProductResult(productJson, match)!;
    expect(p).toMatchObject({ minPrice: 5980, maxPrice: 7500, itemCount: 8, reviewAverage: 4.31, reviewCount: 42, productUrl: "https://product.rakuten.co.jp/product/-/abc/" });
    expect(p.specs).toEqual([{ name: "素材", value: "アルミ" }]);
    expect(p.imageUrl).toContain("_ex=400x400");
    expect(parseProductResult({ Products: [] }, match)).toBeNull();
  });
  it("部品・まとめ売り・相場から大きく外れた価格は除く", () => {
    expect(matchesProduct("部品HARIO 保存容器・角型600ml用蓋 対応製品：KST-60-TW", [["KST-60-TW"]])).toBe(false);
    expect(matchesProduct("HARIO 保存容器 KST60TW(2366714)×24[法人限定]", [["KST-60-TW"]])).toBe(false);
    expect(matchesProduct("ハリオ 保存容器 KST-60-TW 【24個セット】", [["KST-60-TW"]])).toBe(false);
    expect(matchesProduct("ハリオ 耐熱ガラス製保存容器・角600 KST-60-TW", [["KST-60-TW"]])).toBe(true);
    const o = dropOutliers([{ price: 100 }, { price: 900 }, { price: 1000 }, { price: 1100 }, { price: 5000 }]);
    expect(o.map((x) => x.price)).toEqual([900, 1000, 1100]);
    // 実際の例：627円〜2,566円の幅はそのまま残す
    expect(dropOutliers([627, 773, 836, 1605, 2120, 2566].map((price) => ({ price }))).length).toBe(6);
  });
  it("画像URLの大きさ", () => {
    expect(largerImage("http://thumbnail.image.rakuten.co.jp/a.jpg")).toBe("https://thumbnail.image.rakuten.co.jp/a.jpg?_ex=400x400");
    expect(largerImage(undefined)).toBeUndefined();
  });
});

describe("楽天APIの呼び出し", () => {
  const product = { id: "p", slug: "p", market: { keyword: "PDA-STN34S", match } } as unknown as Product;
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  it("IDが設定されていなければ取りに行かない（作り物の価格は出さない）", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "");
    expect(await getMarketData(product)).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
  it("アクセスキーをヘッダーとURLで送り、新しいエンドポイントを使う", async () => {
    vi.stubEnv("RAKUTEN_APPLICATION_ID", "app");
    vi.stubEnv("RAKUTEN_ACCESS_KEY", " key\n");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "aff");
    const calls: { url: string; headers: Record<string, string> }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: { headers: Record<string, string> }) => {
      calls.push({ url, headers: init.headers });
      return new Response(JSON.stringify(url.includes("Product") ? productJson : itemJson), { status: 200 });
    });
    const d = (await getMarketData(product))!;
    expect(d.minPrice).toBe(5980);
    expect(d.offers).toHaveLength(2);
    expect(calls.map((c) => new URL(c.url).pathname).sort()).toEqual(["/ichibams/api/IchibaItem/Search/20260701", "/ichibaproduct/api/Product/Search/20250801"]);
    expect(calls.every((c) => c.headers.accessKey === "key" && new URL(c.url).searchParams.get("accessKey") === "key")).toBe(true);
    expect(calls.every((c) => new URL(c.url).searchParams.get("affiliateId") === "aff")).toBe(true);
  });
});
