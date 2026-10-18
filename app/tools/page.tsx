import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ToolCard } from "@/components/Cards";
import { Icon, toolCategoryIcon } from "@/components/icons";
import { PageHeading } from "@/components/PageHeading";
import { ui } from "@/components/styles";
import { toolCategories } from "@/data/categories";
import { getPublicTools, getToolsByCategory, sortCategories } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "無料Webツール一覧",
  description: "文章・計算・日付・画像・PDFなど、登録不要で使える無料Webツールの一覧。入力した内容はブラウザの中だけで処理します。",
  path: "/tools/",
});

export default function ToolsPage() {
  const total = getPublicTools().length;
  const cats = sortCategories(toolCategories).filter((c) => getToolsByCategory(c.id).length > 0);
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "無料Webツール" }]} />
      <PageHeading title="無料Webツール" lead={`登録不要で使えるツールが ${total} 種類あります。順次追加しています。`}>
        <div className="flex flex-wrap gap-2">
          {sortCategories(toolCategories).map((c) => (
            <Link key={c.id} href={`/tools/category/${c.slug}/`} className={ui.chip}>
              {c.name}
              <small className="font-mono text-muted">{getToolsByCategory(c.id).length}</small>
            </Link>
          ))}
        </div>
      </PageHeading>
      {cats.map((c) => (
        <section key={c.id} className="flex flex-col gap-3">
          <h2 className={`${ui.h2} flex items-center gap-2`}>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-tool-soft text-tool">
              <Icon name={toolCategoryIcon[c.id] ?? "tool"} size={20} />
            </span>
            <Link href={`/tools/category/${c.slug}/`} className="text-ink hover:underline">
              {c.name}
            </Link>
          </h2>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {getToolsByCategory(c.id).map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
