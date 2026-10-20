import { describe, expect, it } from "vitest";
import { FURUSATO_POINT_RULE, FURUSATO_PORTALS, type Fact, type FurusatoPortal, type FurusatoPortalField } from "@/data/furusato-portals";

const FIELDS: FurusatoPortalField[] = ["operator", "listingCount", "paymentMethods", "oneStopOnline", "simulator", "app"];

function factsOf(p: FurusatoPortal): Fact<unknown>[] {
  const single = FIELDS.map((k) => p[k]).filter((x): x is NonNullable<typeof x> => x !== null);
  return [...single, ...p.features, ...p.pointRuleNotes, ...p.notes] as Fact<unknown>[];
}

describe("ふるさと納税ポータルの事実データ", () => {
  it("すべてのポータルに https の公式URLがある", () => {
    for (const p of FURUSATO_PORTALS) expect(p.officialUrl, p.id).toMatch(/^https:\/\//);
  });

  it("id は ASCII のスラッグで重複しない", () => {
    const ids = FURUSATO_PORTALS.map((p) => p.id);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("null でない事実はすべて https の出典URLと確認日を持つ", () => {
    for (const p of FURUSATO_PORTALS) {
      for (const fact of factsOf(p)) {
        expect(fact.source, p.id).toMatch(/^https:\/\//);
        expect(fact.checkedAt, p.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it("null にした項目には理由が書いてある", () => {
    for (const p of FURUSATO_PORTALS) {
      for (const k of FIELDS) if (p[k] === null) expect(p.unknownReasons[k], `${p.id}.${k}`).toBeTruthy();
    }
  });

  it("特徴は4点まで", () => {
    for (const p of FURUSATO_PORTALS) expect(p.features.length, p.id).toBeLessThanOrEqual(4);
  });

  it("総務省のポイント付与禁止ルールは総務省の公式ページを出典にする", () => {
    expect(FURUSATO_POINT_RULE.source).toMatch(/^https:\/\/www\.soumu\.go\.jp\//);
    expect(FURUSATO_POINT_RULE.effectiveFrom).toBe("2025-10-01");
  });
});
