import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "プライバシーポリシー", description: `${site.name}での個人情報・入力データ・Cookieの取り扱い。`, path: "/privacy/" });

export default function PrivacyPage() {
  return (
    <StaticPage title="プライバシーポリシー">
      <p>
        {site.operator.name ? `${site.operator.name}（以下「運営者」）` : "当サイトの運営者（以下「運営者」）"}は、{site.name}（以下「当サイト」）での情報の取り扱いを、次のとおり定めます。
      </p>
      <h2>ツールに入力した内容</h2>
      <p>当サイトのツールは、入力した文字・数値・ファイルをブラウザの中だけで処理し、運営者のサーバーには送信しません。</p>
      <h2>アクセス解析・広告</h2>
      <p>現在、アクセス解析ツールや広告配信サービスは使用していません。今後導入する場合は、利用するサービス名、Cookieなどで取得する情報、その目的と、無効にする方法を、このページに記載してから導入します。</p>
      {site.operator.contact && (
        <>
          <h2>お問い合わせでいただいた情報</h2>
          <p>お問い合わせでいただいたお名前・連絡先などは、返信のためだけに使い、法令にもとづく場合を除いて第三者に提供しません。</p>
        </>
      )}
      <h2>外部サイトへのリンク</h2>
      <p>当サイトから移動した販売店などの外部サイトでの情報の取り扱いは、それぞれのサイトの方針に従います。</p>
      {site.operator.contact && (
        <>
          <h2>お問い合わせ窓口</h2>
          <p>
            <Link href="/contact/">お問い合わせページ</Link>をご覧ください。
          </p>
        </>
      )}
      {site.privacyPolicyDate && <p className="text-sm text-muted">制定日：{site.privacyPolicyDate}</p>}
    </StaticPage>
  );
}
