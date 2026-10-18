import { describe, expect, it } from "vitest";
import { articles } from "@/data/articles";
import { toolCategories } from "@/data/categories";
import { tools } from "@/data/tools";
import { TOOL_COMPONENT_KEYS } from "@/features/tools/keys";
import { getPublicArticles, getPublicTools, isToolPublic } from "@/lib/content";
import { validateData } from "@/lib/validation";

describe("データの整合性", () => {
  it("検査で問題が見つからない", () => {
    expect(validateData()).toEqual([]);
  });

  it("100件以上のツールが登録され、すべてのカテゴリにツールがある", () => {
    expect(tools.length).toBeGreaterThanOrEqual(100);
    for (const c of toolCategories) expect(tools.some((t) => t.categoryId === c.id)).toBe(true);
  });

  it("画面が登録されたツールだけが公開され、画面はすべて使われている", () => {
    const published = getPublicTools();
    expect(published.every(isToolPublic)).toBe(true);
    expect(new Set(published.map((t) => t.componentKey))).toEqual(new Set(TOOL_COMPONENT_KEYS));
    expect(tools.filter((t) => t.componentKey === null).every((t) => t.status === "draft")).toBe(true);
  });

  it("公開ページの説明文はすべて固有", () => {
    const ds = getPublicTools().map((t) => t.description);
    expect(new Set(ds).size).toBe(ds.length);
  });

  it("人の確認前の記事は公開一覧に出ない", () => {
    const pending = articles.filter((a) => a.reviewStatus !== "verified");
    if (process.env.SHOW_DRAFTS !== "1") for (const a of pending) expect(getPublicArticles()).not.toContain(a);
  });
});
