import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "プライバシーポリシー", description: `${site.name}での個人情報・入力データ・アクセス解析の取り扱い。`, path: "/privacy/" });

export default function PrivacyPage() {
  return (
    <StaticPage title="プライバシーポリシー">
      <p>
        {site.operator.name ? `${site.operator.name}（以下「運営者」）` : "当サイトの運営者（以下「運営者」）"}は、{site.name}（以下「当サイト」）での情報の取り扱いを、次のとおり定めます。
      </p>
      <h2>ツールに入力した内容</h2>
      <p>当サイトのツールは、入力した文字・数値・ファイルをブラウザの中だけで処理し、運営者のサーバーには送信しません。</p>
      <p>
        文字数カウンターや割り勘計算など一部のツールは、次に開いたときのために入力内容をお使いのブラウザ（localStorage）に保存します。保存先はその端末の中だけで、運営者には送られません。各ツールの「消す」ボタンや、ブラウザのサイトデータの削除で消せます。
      </p>
      <p>「結果をリンクで共有」を使うと、入力内容がリンク（URLの「#」より後ろ）に含まれます。この部分はサーバーに送られませんが、リンクを受け取った人は内容を見られるため、共有する相手にご注意ください。</p>
      <h2>アクセス解析・広告</h2>
      {site.cloudflareBeacon ? (
        <p>
          当サイトは、閲覧数の把握とサイトの改善のために、Cloudflare, Inc. の「Cloudflare Web Analytics」を使っています。取得するのは、見られたページのURL、参照元、国・地域、ブラウザやOS・端末の種類、表示の速さなどで、Cookieは使わず、個人を特定できる情報は集めません。詳しくは
          <a href="https://www.cloudflare.com/web-analytics/" target="_blank" rel="noopener noreferrer">
            Cloudflare Web Analytics の説明
          </a>
          をご覧ください。
        </p>
      ) : (
        <p>
          当サイトは、閲覧数の把握とサイトの改善のために、Vercel Inc. の「Vercel Web Analytics」を使っています。取得するのは、見られたページのURL、参照元、国・地域、ブラウザやOS・端末の種類などで、Cookieは使わず、個人を特定できる情報は集めません。訪問者の識別に使う値は、日ごとに破棄されます。詳しくは
          <a href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noopener noreferrer">
            Vercel のプライバシーに関する説明
          </a>
          をご覧ください。
        </p>
      )}
      <p>便利グッズのページでは、楽天市場の商品写真を楽天のサーバーから読み込んで表示します。このとき、お使いのブラウザから楽天のサーバーに通信が発生します。楽天市場へのリンクから移動した先での情報の取り扱いは、楽天グループのプライバシーポリシーに従います。</p>
      <p>
        当サイトは、アフィリエイトサービス「A8.net」（株式会社ファンコミュニケーションズ）を利用しています。A8.netの広告を表示すると、表示回数の計測のためにA8.netのサーバーへ通信が発生します。リンクを押すと、成果の計測のためにCookieなどが使われることがあります。詳しくは
        <a href="https://www.fancs.com/privacy/" target="_blank" rel="noopener noreferrer">
          株式会社ファンコミュニケーションズのプライバシーポリシー
        </a>
        をご覧ください。
      </p>
      <p>このほかの広告配信サービスは使用していません。今後導入する場合は、利用するサービス名、Cookieなどで取得する情報、その目的と、無効にする方法を、このページに記載してから導入します。</p>
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
