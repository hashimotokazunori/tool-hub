import type { Article, Tool } from "@/lib/types";
import { ArticleCard, ToolCard } from "./Cards";
import { ui } from "./styles";

/** 関連するツール・記事。公開済みのものだけを渡すこと */
export function RelatedContent({ tools = [], articles = [], title = "関連するツール・ガイド" }: { tools?: Tool[]; articles?: Article[]; title?: string }) {
  if (tools.length === 0 && articles.length === 0) return null;
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <h2 className={ui.h2}>{title}</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
        {tools.map((t) => (
          <ToolCard key={t.id} tool={t} />
        ))}
      </div>
    </section>
  );
}
