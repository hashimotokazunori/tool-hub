import { StaticPage } from "@/components/StaticPage";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "広告・PR表記", description: `${site.name}の広告・アフィリエイトの取り扱いと、商品紹介の方針。`, path: "/disclosure/" });

export default function DisclosurePage() {
  return (
    <StaticPage title="広告・PR表記">
      <p>{site.name}では、サイトの運営費をまかなうため、広告の掲載や、アフィリエイトプログラムを利用した商品の紹介を行うことがあります。</p>
      <h2>アフィリエイトについて</h2>
      <ul>
        <li>商品ページや記事のリンクから商品を購入すると、販売店から当サイトに報酬が支払われる場合があります。購入する方の支払額は変わりません。</li>
        <li>アフィリエイトリンクを含むページや商品カードには「PR」と表示します。</li>
        <li>楽天市場の商品は、楽天アフィリエイトのリンクで紹介しています。</li>
        <li>報酬の有無や金額によって、商品の評価や順位を変えることはありません。比較する場合は、比べた条件を記事の中に示します。</li>
      </ul>
      <h2>価格と仕様について</h2>
      <ul>
        <li>価格は、確認した日時とあわせて表示します。最新の価格や在庫は、販売ページで確認してください。</li>
        <li>便利グッズの価格・評価・商品写真は、楽天ウェブサービスのAPIで楽天市場から自動で取得し、数時間ごとに更新しています。型番などが一致した商品だけを安い順に並べ、中古品・互換品は除いています。並び順に報酬の有無は関係しません。</li>
        <li>仕様は、メーカーや販売店の公開情報をもとに確認し、出典を記載します。</li>
      </ul>
      <h2>広告について</h2>
      <p>広告を掲載する場合は、ツールの操作の邪魔にならない位置に表示します。広告配信のためにCookieなどを使う場合は、プライバシーポリシーでお知らせします。</p>
      <p className="text-sm text-muted">{site.ads.enabled ? "現在、広告を掲載しています。" : "現在、広告は掲載していません。"}</p>
    </StaticPage>
  );
}
