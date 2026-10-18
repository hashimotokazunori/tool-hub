import { articles } from "@/data/articles";
import { buyingGuides } from "@/data/buying-guides";
import { allCategories, goodsCategories, toolCategories } from "@/data/categories";
import { products } from "@/data/products";
import { site } from "@/data/site";
import { tools } from "@/data/tools";
import { hasToolComponent } from "@/features/tools/keys";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** データの整合性を検査し、問題の一覧を返す（空なら問題なし） */
export function validateData(): string[] {
  const errors: string[] = [];
  const dup = (label: string, values: string[]) => {
    const seen = new Set<string>();
    for (const v of values) {
      if (seen.has(v)) errors.push(`${label} が重複しています: ${v}`);
      seen.add(v);
    }
  };

  dup("カテゴリID", allCategories.map((c) => c.id));
  dup("ツールのslug", tools.map((t) => t.slug));
  dup("商品のslug", products.map((p) => p.slug));
  dup("記事のslug", articles.map((a) => `${a.type}/${a.slug}`));

  const toolCat = new Set(toolCategories.map((c) => c.id));
  const goodsCat = new Set(goodsCategories.map((c) => c.id));
  const toolSlugs = new Set(tools.map((t) => t.slug));
  const productIds = new Set(products.map((p) => p.id));

  for (const c of allCategories) if (!SLUG.test(c.slug)) errors.push(`カテゴリのslugが不正です: ${c.slug}`);

  for (const t of tools) {
    if (!SLUG.test(t.slug)) errors.push(`ツールのslugが不正です: ${t.slug}`);
    if (!toolCat.has(t.categoryId)) errors.push(`ツール ${t.slug} のカテゴリがありません: ${t.categoryId}`);
    if (t.status === "published") {
      if (!t.componentKey || !hasToolComponent(t.componentKey)) errors.push(`公開中のツール ${t.slug} に画面が登録されていません`);
      if (!t.description) errors.push(`公開中のツール ${t.slug} に説明文がありません`);
    }
  }

  for (const p of products) {
    if (!SLUG.test(p.slug)) errors.push(`商品のslugが不正です: ${p.slug}`);
    if (!goodsCat.has(p.categoryId)) errors.push(`商品 ${p.slug} のカテゴリがありません: ${p.categoryId}`);
    if (p.price !== undefined && !p.priceCheckedAt) errors.push(`商品 ${p.slug} は価格があるのに確認日時がありません`);
    if (p.status === "published") {
      if (p.reviewStatus !== "verified") errors.push(`商品 ${p.slug} は確認前なのに公開になっています`);
      if (p.sourceUrls.length === 0) errors.push(`商品 ${p.slug} に仕様の出典がありません`);
      if (!p.affiliateUrl && !p.officialUrl) errors.push(`商品 ${p.slug} にリンク先がありません`);
      if (p.imageUrl && !p.imageLicenseNote) errors.push(`商品 ${p.slug} の画像に使用条件のメモがありません`);
    }
  }

  for (const a of articles) {
    if (!SLUG.test(a.slug)) errors.push(`記事のslugが不正です: ${a.slug}`);
    for (const s of a.toolSlugs) if (!toolSlugs.has(s)) errors.push(`記事 ${a.slug} の関連ツールがありません: ${s}`);
    for (const id of a.productIds) if (!productIds.has(id)) errors.push(`記事 ${a.slug} の商品がありません: ${id}`);
    for (const id of a.goodsCategoryIds) if (!goodsCat.has(id)) errors.push(`記事 ${a.slug} のグッズカテゴリがありません: ${id}`);
    if (a.status === "published" && (a.reviewStatus !== "verified" || !a.reviewedAt)) errors.push(`記事 ${a.slug} は人の確認前なのに公開になっています`);
  }

  for (const g of buyingGuides) {
    if (!goodsCat.has(g.categoryId)) errors.push(`選び方 ${g.id} のカテゴリがありません: ${g.categoryId}`);
    for (const s of g.toolSlugs) if (!toolSlugs.has(s)) errors.push(`選び方 ${g.id} の関連ツールがありません: ${s}`);
    if (g.status === "published" && g.reviewStatus !== "verified") errors.push(`選び方 ${g.id} は確認前なのに公開になっています`);
  }

  return errors;
}

/** 本番公開の前に埋める必要がある設定（警告として扱う） */
export function launchChecklist(): string[] {
  const todo: string[] = [];
  if (!site.operator.name) todo.push("data/site.ts の運営者名（operator.name）");
  if (!site.operator.contact) todo.push("data/site.ts の問い合わせ先（operator.contact）");
  if (!process.env.NEXT_PUBLIC_SITE_URL) todo.push("環境変数 NEXT_PUBLIC_SITE_URL（本番のURL）");
  return todo;
}
