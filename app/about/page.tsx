import Link from "next/link";
import { StaticPage, Todo } from "@/components/StaticPage";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "運営者情報", description: `${site.name}の運営者と運営方針。`, path: "/about/" });

export default function AboutPage() {
  return (
    <StaticPage title="運営者情報">
      <h2>サイトについて</h2>
      <p>{site.name}は、登録不要で使える無料Webツールと、暮らしや仕事を便利にするアイテムの選び方・比較をまとめたサイトです。</p>
      <h2>運営者</h2>
      <p>{site.operator.name || <Todo>運営者名（data/site.ts の operator.name）</Todo>}</p>
      <h2>運営方針</h2>
      <ul>
        <li>ツールは、入力した文字やファイルをサーバーに送らず、ブラウザの中だけで処理します。</li>
        <li>商品の仕様は、メーカーや販売店の公開情報で確認し、出典と確認日を記録して掲載します。</li>
        <li>記事は、人が内容を確認してから公開します。</li>
        <li>
          広告・アフィリエイトについては
          <Link href="/disclosure/">広告・PR表記</Link>
          をご覧ください。
        </li>
      </ul>
      <h2>お問い合わせ</h2>
      <p>
        <Link href="/contact/">お問い合わせページ</Link>からご連絡ください。
      </p>
    </StaticPage>
  );
}
