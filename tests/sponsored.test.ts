import { describe, expect, it } from "vitest";
import { sponsoredFor, sponsoredLinks } from "@/data/sponsored";
import { tools } from "@/data/tools";

describe("A8.net の広告リンク", () => {
  it("割り当て先は公開中のツールだけ", () => {
    const published = new Set(tools.filter((t) => t.componentKey).map((t) => t.slug));
    for (const s of sponsoredLinks) for (const slug of s.tools) expect(published.has(slug), `${s.id} → ${slug}`).toBe(true);
  });
  it("リンクと計測画像は A8 のもので、同じ素材を指す", () => {
    for (const s of sponsoredLinks) {
      expect(s.href).toMatch(/^https:\/\/px\.a8\.net\/svt\/ejp\?a8mat=/);
      expect(s.pixel).toMatch(/^https:\/\/www\d+\.a8\.net\/0\.gif\?a8mat=/);
      expect(new URL(s.href).searchParams.get("a8mat")).toBe(new URL(s.pixel).searchParams.get("a8mat"));
    }
  });
  it("1ページに出すのは2件まで", () => {
    for (const t of tools) expect(sponsoredFor(t.slug).length).toBeLessThanOrEqual(2);
    expect(sponsoredFor("consumption-tax").map((s) => s.id)).toEqual(["mf-tax-return", "misoca"]);
    expect(sponsoredFor("character-counter")).toEqual([]);
  });
});
