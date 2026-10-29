import { describe, expect, it } from "vitest";
import { articles } from "@/data/articles";
import { toolGuides } from "@/data/tool-guides";
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
    // 非公開（retired）にしたツールの画面も、戻せるように残してある
    const kept = tools.filter((t) => t.status === "published" || t.status === "retired");
    expect(new Set(kept.map((t) => t.componentKey))).toEqual(new Set(TOOL_COMPONENT_KEYS));
    expect(tools.filter((t) => t.componentKey === null).every((t) => t.status === "draft")).toBe(true);
  });

  it("公開ツールにはすべて使い方とよくある質問がある", () => {
    for (const t of getPublicTools()) {
      const g = toolGuides[t.slug];
      expect(g, t.slug).toBeDefined();
      expect(g.steps.length, t.slug).toBeGreaterThanOrEqual(2);
      expect(g.faq.length, t.slug).toBeGreaterThanOrEqual(2);
      for (const f of g.faq) expect(f.q.length * f.a.length, t.slug).toBeGreaterThan(0);
    }
    // 公開していないツールの使い方は置かない（古い説明が残らないように）。非公開（retired）にしたツールは戻せるように残す
    for (const slug of Object.keys(toolGuides)) expect(tools.some((t) => t.slug === slug && (t.status === "published" || t.status === "retired")), slug).toBe(true);
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
