# やること（TODO）

最終更新：2026-10-20（午後）

## 近いうちに
- [ ] **A8.net：審査中の広告が通ったら置く**
  - 2026-10-20 に提携済み7件の文字リンクを22ツールのページに設置し、A8 に掲載URL（計24件）も届け出た（data/sponsored.ts）。ページ上部に「PR」表示あり
  - 広告を置くページを増やしたら、掲載URLも届け出る：`https://media-console.a8.net/common/oauth-login?service=media_site_url_manager&programId=<プログラムID>` を開いて入力
  - 審査中3件（Bandicam・MiriCanvas・Adobe）が通ったら、data/sponsored.ts に足す（A8 の「通常広告用」をそのまま使う。1ページ2件まで）
  - Adobe は月額プランのみ対象（年額一括・アプリからの申込は対象外）。Movavi はクレカ・PayPal 決済のみ対象
- [ ] **A8 のサイト情報の URL を https://toolhiroba.com/ に変える**（登録情報 → サイト情報の登録・修正。A8 の再ログインが要る）。掲載URLは toolhiroba.com で出し直し済み
- [ ] **Google AdSense の審査待ち**（2026-10-20 に toolhiroba.com で審査をリクエスト）。通ったら AdSense の管理画面で自動広告の置き場所を決め、data/site.ts の ads.enabled を見直す。落ちたら理由を見て直す
- [ ] **もしもアフィリエイト**：ツールひろばはメディア審査中。Yahoo!ショッピングは提携済み、Amazon は審査中。提携できたら便利グッズに Yahoo! の価格（Yahoo! の商品検索 API・開発者登録が必要）と Amazon・Yahoo! のボタンを足す
- [ ] **ふるさと納税**：控除上限の計算ツールを公開済み（au PAY ふるさと納税・ふるさと本舗の広告つき）。審査中の さとふる・ふるさとチョイス・dショッピング・ポケマル が通ったら data/sponsored.ts に足す。ポータル比較データ（data/furusato-portals.ts）を作成中 → 比較ページにする
- [ ] **Search Console と閲覧数を見る**（2026-10-27ごろ）：https://toolhiroba.com/ のプロパティでサイトマップが読み込まれたか。閲覧数は Cloudflare の Web Analytics（Gmail の方のアカウント）。Bing Webmaster Tools（Google の KAZ chaos アカウントでログイン）も同じ日に確認

## 余裕があれば
- [ ] 広告（Google AdSense）を申し込む。審査では運営者情報・問い合わせ先があるほうが通りやすい
- [ ] 楽天の価格取得が失敗したときだけ、ビルドログに「アプリIDの先頭・キーの文字数・アプリIDと同じか」を出している（`lib/rakuten.ts`）。安定したら消してよい

## 済み
- [x] 独自ドメイン toolhiroba.com に切り替え（2026-10-20）：エックスサーバーで購入 → ネームサーバーを Cloudflare に → Workers のカスタムドメイン。楽天アプリのURL・許可サイト、Search Console（サイトマップ174ページ成功）、A8 の掲載URL、Vercel からの転送先を変更。workers.dev も残し canonical は toolhiroba.com
- [x] 見つけてもらう登録（2026-10-21）：Search Console の「アドレス変更」で Vercel の URL → toolhiroba.com を届け出（移行中）。Bing Webmaster Tools に toolhiroba.com を追加（メタタグ msvalidate.01 で確認）、サイトマップ送信。トップページにも canonical
- [x] AdSense の準備：全ページにコード、ads.txt、広告と Cookie の説明、運営者名「ツールひろば編集部」、問い合わせは Google フォーム（2026-10-20）
- [x] 次はこちら・お気に入り・最近使ったツール、悩み別記事9本の補強（2026-10-20）
- [x] Cloudflare に引っ越し（2026-10-20）：https://tool.hiroba.workers.dev
  - Cloudflare は Gmail の方のアカウント（iCloud の方は別アカウント）。workers.dev の名前は「hiroba」
  - 全ページを書き出して Workers の静的ファイル置き場に置く。GitHub Actions（.github/workflows/deploy.yml）が push 時と6時間ごとに公開（楽天の価格もこのとき取り直す）
  - GitHub の Secrets：CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID / RAKUTEN_*、Variables：NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_CF_BEACON_TOKEN
  - 古い Vercel の URL は新しい URL へ 301 転送（next.config.ts）。Vercel では中身を出さないので、Vercel の商用利用の心配はなくなった
  - Search Console に新 URL を登録・サイトマップ送信。A8 のサイト情報と掲載URLも新 URL に。楽天アプリのURLと許可サイトも新 URL に
  - GitHub の定期実行は、リポジトリに60日動きがないと止まる。止まったら Actions の画面で有効にし直す
- [x] ツールひろば専用の楽天アプリを作成し、Vercel のIDとアクセスキーを入れ替え。アニメの窓口の許可サイトは元に戻した（2026-10-20）
  - 設定の控えは `tool-hub/.env.local`（GitHub には送られない）。アニメの窓口は `anime/rakuten.env`
  - 楽天のアクセスキー欄のコピーボタンはうまく動かないことがある。手で選んでコピーし、貼った値が「436cf6db」（アプリID）で始まらないことを確かめる
- [x] 便利グッズ10商品すべてで楽天の価格を表示（部品・まとめ売りを除外、MILESTO・テプラの条件を調整）（2026-10-20）
- [x] 便利グッズを各カテゴリ5商品（計25商品）に増やした（2026-10-20）
- [x] 楽天の価格・写真・評価の表示（2026-10-20）
- [x] 全109ツールの公開、使い方とよくある質問（2026-10-19）
- [x] サイトのデザイン刷新（2026-10-19）
- [x] GitHub・Vercel での公開、Search Console 登録（2026-10-19）
