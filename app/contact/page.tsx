import { notFound } from "next/navigation";
import { StaticPage } from "@/components/StaticPage";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "お問い合わせ", description: `${site.name}へのお問い合わせ窓口。ツールの不具合や、掲載内容の誤りのご指摘もこちらから。`, path: "/contact/" });

/** 問い合わせ先（data/site.ts の operator.contact）が空のあいだは、このページを出さない */
export default function ContactPage() {
  const c = site.operator.contact;
  if (!c) notFound();
  return (
    <StaticPage title="お問い合わせ">
      <p>ツールの不具合、掲載内容の誤り、ご要望などは、次の窓口からお知らせください。内容を確認のうえ、必要に応じて返信します。</p>
      <p>
        {c.startsWith("http") ? (
          <a href={c} rel="noopener noreferrer" target="_blank">
            お問い合わせフォームを開く
          </a>
        ) : (
          <span className="select-all font-mono">{c}</span>
        )}
      </p>
      <p className="text-sm text-muted">商品の在庫や配送については、各販売店にお問い合わせください。</p>
    </StaticPage>
  );
}
