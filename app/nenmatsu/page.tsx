import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArticleCard, ToolCard } from "@/components/Cards";
import { PageHeading } from "@/components/PageHeading";
import { Section } from "@/components/Section";
import { ui } from "@/components/styles";
import { getPublicArticles, getToolBySlug } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import type { Article, Tool } from "@/lib/types";

export const metadata = pageMetadata({
  title: "年末にやることと、役立つ無料ツール",
  description: "ふるさと納税の駆け込み、大掃除・片付け、年末年始の予定、お金の見直し、帰省・旅行の精算。年末にやることごとに、使える無料ツールと記事をまとめました。",
  path: "/nenmatsu/",
});

/** 年末のテーマごとに、使うツールと記事（公開中のものだけ出す） */
const THEMES: { id: string; title: string; lead: string; tools: string[]; articles: string[]; extra?: { href: string; label: string } }[] = [
  {
    id: "furusato",
    title: "ふるさと納税の駆け込み",
    lead: "12月31日までの寄附がその年の分。上限の目安を出して、残りの枠で選びます。",
    tools: ["furusato-limit"],
    articles: ["furusato-how-much", "furusato-deadline", "furusato-one-stop"],
    extra: { href: "/furusato/", label: "返礼品を見る" },
  },
  {
    id: "cleaning",
    title: "大掃除・片付け",
    lead: "やることを書き出して優先順位を付けると、短い休みでも終わらせやすくなります。",
    tools: ["task-priority", "unit-price"],
    articles: ["desk-organizing-steps", "desk-cable-clutter", "reduce-paper"],
  },
  {
    id: "schedule",
    title: "年末年始の予定・締め切り",
    lead: "仕事納めまでの営業日や、休み明けの締め切りを先に数えておきます。",
    tools: ["business-days", "countdown", "days-between"],
    articles: ["manage-deadlines"],
  },
  {
    id: "money",
    title: "1年のお金の見直し",
    lead: "来年の予算を決めるなら、年末が区切りのよいタイミングです。",
    tools: ["budget", "savings-goal", "compound-interest"],
    articles: ["review-monthly-spending"],
  },
  {
    id: "travel",
    title: "帰省・旅行・忘年会",
    lead: "荷物を減らすコツと、割り勘・立て替えの精算。",
    tools: ["warikan", "travel-expense-split"],
    articles: ["pack-light", "split-costs", "warikan-tips"],
  },
];

export default function NenmatsuPage() {
  const articles = getPublicArticles();
  const bySlug = new Map(articles.map((a) => [a.slug, a]));
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <Breadcrumbs items={[{ label: "年末にやること" }]} />
        <PageHeading title="年末にやることと、役立つ無料ツール" lead="年末にやることを5つに分けて、使える無料ツールと記事をまとめました。ツールは登録不要で、入力した内容はブラウザの中だけで処理します。" />
        <nav aria-label="テーマ" className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <a key={t.id} href={`#${t.id}`} className="rounded-full border border-line bg-panel px-3 py-1.5 text-sm font-semibold text-ink no-underline shadow-card">
              {t.title}
            </a>
          ))}
        </nav>
      </div>
      {THEMES.map((t) => {
        const tools = t.tools.map(getToolBySlug).filter((x): x is Tool => x !== undefined);
        const arts = t.articles.map((s) => bySlug.get(s)).filter((x): x is Article => x !== undefined);
        if (tools.length + arts.length === 0) return null;
        return (
          <Section key={t.id} id={t.id} eyebrow="Year-end" icon="date" tone="tool" title={t.title} lead={t.lead} more={t.extra}>
            <div className="flex flex-col gap-4">
              {tools.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              )}
              {arts.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {arts.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              )}
            </div>
          </Section>
        );
      })}
      <p className={ui.note}>
        セールで買い物をするなら、
        <Link href="/sale/" className="text-accent underline">
          ブラックフライデー・年末セールで買う候補
        </Link>
        もどうぞ。
      </p>
    </div>
  );
}
