# やること（TODO）

最終更新：2026-10-20（午後）

## 近いうちに
- [ ] **A8.net：審査中の広告が通ったら置く**
  - 2026-10-20 に提携済み7件の文字リンクを22ツールのページに設置し、A8 に掲載URL（計24件）も届け出た（data/sponsored.ts）。ページ上部に「PR」表示あり
  - 広告を置くページを増やしたら、掲載URLも届け出る：`https://media-console.a8.net/common/oauth-login?service=media_site_url_manager&programId=<プログラムID>` を開いて入力
  - 審査中3件（Bandicam・MiriCanvas・Adobe）が通ったら、data/sponsored.ts に足す（A8 の「通常広告用」をそのまま使う。1ページ2件まで）
  - Adobe は月額プランのみ対象（年額一括・アプリからの申込は対象外）。Movavi はクレカ・PayPal 決済のみ対象
- [ ] **A8 のサイト情報の URL を新しい URL に変える**：登録情報 → サイト情報の登録・修正 →「ツールひろば」の URL を https://tool.hiroba.workers.dev/ に（A8 の再ログインが要るので本人と一緒に）
- [ ] **独自ドメインを決める**（おすすめアニメサイトのチャットと相談中）。買うなら anime.〇〇.com / tool.〇〇.com のように1つにまとめる案あり。変えたら Search Console・A8 の掲載URL・楽天の許可サイト・GitHub の変数 NEXT_PUBLIC_SITE_URL・next.config の転送先を直す
- [ ] **Search Console と閲覧数を見る**（2026-10-27ごろ）：新しい URL（https://tool.hiroba.workers.dev/）のプロパティでサイトマップが読み込まれたか。閲覧数は Cloudflare の Web Analytics（Gmail の方のアカウント）

## 余裕があれば
- [ ] 広告（Google AdSense）を申し込む。審査では運営者情報・問い合わせ先があるほうが通りやすい
- [ ] 楽天の価格取得が失敗したときだけ、ビルドログに「アプリIDの先頭・キーの文字数・アプリIDと同じか」を出している（`lib/rakuten.ts`）。安定したら消してよい

## 済み
- [x] Cloudflare に引っ越し（2026-10-20）：https://tool.hiroba.workers.dev
  - Cloudflare は Gmail の方のアカウント（iCloud の方は別アカウント）。workers.dev の名前は「hiroba」
  - 全ページを書き出して Workers の静的ファイル置き場に置く。GitHub Actions（.github/workflows/deploy.yml）が push 時と6時間ごとに公開（楽天の価格もこのとき取り直す）
  - GitHub の Secrets：CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID / RAKUTEN_*、Variables：NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_CF_BEACON_TOKEN
  - 古い Vercel の URL は新しい URL へ 301 転送（next.config.ts）。Vercel では中身を出さないので、Vercel の商用利用の心配はなくなった
  - Search Console に新 URL を登録・サイトマップ送信。A8 の掲載URLも新 URL で出し直した。楽天アプリの許可サイトに追加
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
