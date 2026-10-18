import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "運営者情報", description: `${site.name}の運営方針。`, path: "/about/" });

export default function AboutPage() {
  return (
    <StaticPage title="運営者情報">
      <h2>サイトについて</h2>
      <p>{site.name}は、登録不要で使える無料Webツールと、暮らしや仕事を便利にするアイテムの選び方・比較をまとめたサイトです。</p>
      {site.operator.name && (
        <>
          <h2>運営者</h2>
          <p>{site.operator.name}</p>
        </>
      )}
      <h2>運営方針</h2>
      <ul>
        <li>ツールは、入力した文字やファイルをサーバーに送らず、ブラウザの中だけで処理します。</li>
        <li>商品の仕様は、メーカーや販売店の公開情報で確認し、出典と確認日を記録して掲載します。</li>
        <li>記事と商品の情報は、AI（Claude）が公的機関やメーカーの公式情報と照らし合わせて事実確認し、確認日と出典を載せて公開します。誤りを見つけた場合は修正します。</li>
        <li>
          広告・アフィリエイトについては
          <Link href="/disclosure/">広告・PR表記</Link>
          をご覧ください。
        </li>
      </ul>
      {site.operator.contact && (
        <>
          <h2>お問い合わせ</h2>
          <p>
            <Link href="/contact/">お問い合わせページ</Link>からご連絡ください。
          </p>
        </>
      )}
    </StaticPage>
  );
}
