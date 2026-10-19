# ツールひろば 設計メモ

サイト名は仮称です。表示名・URL・運営者情報は `data/site.ts` だけで管理し、画面のコードには書きません。

## 1. 方針

- **無料Webツール**で検索流入とリピーターを集め、**便利グッズ**の選び方・比較から商品購入につなげる総合ポータル。
- **処理はブラウザ内で完結**させる。サーバーにファイルや入力を送らない。
- **データと表示を分ける**。ツール・商品・記事・カテゴリは `data/` に置き、画面は `app/` と `components/` に置く。
- **公開状態を管理する**。`status: "published"` のものだけを一覧・検索・サイトマップに出す。
  - 未実装のツールや未確認の商品・記事は、URLを直接開いても表示しない（404）。
  - 開発中は `SHOW_DRAFTS=1` で下書きを確認できる。
- **確認していない情報は公開しない**。記事と商品には `reviewStatus` を持たせ、事実確認して `verified` にしたものだけを公開対象にする。
  - 2026-10-19 に運営者の判断で、事実確認は AI（Claude）が行い、問題がなければそのまま公開する運用にした（それまでは人が確認してから公開）。
  - 確認は公的機関・メーカーの公式情報との照合で行い、確認日（`reviewedAt`）と確認方法（`reviewedBy`、例：「AI（Claude）による事実確認」）をページに表示する。
  - 確認の記録は `docs/review/` に残す。

## 2. 技術構成

| 項目 | 採用 | 補足 |
|---|---|---|
| フレームワーク | Next.js 16.4（App Router） | `cacheComponents` 有効。全ページ静的生成 |
| 言語 | TypeScript（strict） | |
| スタイル | Tailwind CSS v4 | 色やフォントは `app/globals.css` の `@theme` で定義 |
| テスト | Vitest | ツールの計算ロジックとデータ検証 |
| データ | 型付きTSファイル | 将来PostgreSQLへ移す前提で、IDと形をそろえる |
| ホスティング | Vercelなどを想定 | |

## 3. URL

| ページ | URL | ファイル |
|---|---|---|
| トップ | `/` | `app/page.tsx` |
| ツール一覧 | `/tools/` | `app/tools/page.tsx` |
| ツールカテゴリ | `/tools/category/[slug]/` | `app/tools/category/[slug]/page.tsx` |
| 個別ツール | `/tools/[slug]/` | `app/tools/[slug]/page.tsx` |
| グッズトップ | `/goods/` | `app/goods/page.tsx` |
| グッズカテゴリ | `/goods/category/[slug]/` | `app/goods/category/[slug]/page.tsx` |
| 商品 | `/goods/items/[slug]/` | `app/goods/items/[slug]/page.tsx` |
| 比較ガイド | `/guides/[slug]/` | `app/guides/[slug]/page.tsx` |
| 悩み別 | `/solutions/[slug]/` | `app/solutions/[slug]/page.tsx` |
| 運営者情報・広告表記・プライバシー・問い合わせ | `/about/` `/disclosure/` `/privacy/` `/contact/` | 各 `page.tsx`（問い合わせは `operator.contact` を設定したときだけ表示） |
| サイトマップ・robots | `/sitemap.xml` `/robots.txt` | `app/sitemap.ts` `app/robots.ts` |

## 4. ディレクトリ

```
app/                  ルーティングと各ページ（データを読んで表示するだけ）
components/           共通部品（Header, Footer, GlobalSearch, Breadcrumbs, ToolLayout, ToolCard, ProductCard, RelatedContent, AdSlot …）
features/tools/
  registry.ts         componentKey → ツール画面（クライアント部品）の対応表
  <分類>/<ツール>/
    logic.ts          計算ロジック（純粋関数・テスト対象）
    Tool.tsx          画面（'use client'）
data/
  site.ts             サイト名・URL・運営者情報・広告設定
  categories.ts       ツールと商品のカテゴリ
  tools.ts            ツールの登録データ（112件。実装済みだけ published）
  products.ts         商品データ（出典・価格確認日・確認状態つき）
  articles.ts         比較ガイド・悩み別ガイドの登録データ
content/guides/       記事本文（Markdown）
content/solutions/    悩み別ガイドの本文（Markdown）
lib/
  types.ts            データ型
  content.ts          公開判定と取得（published だけを返す）
  seo.ts              メタデータの組み立て
  search.ts           サイト内検索の索引
  validation.ts       データの整合性チェック
  affiliate.ts        購入リンクの組み立て（rel="sponsored" など）
tests/                Vitest
```

## 5. データ型

型は `lib/types.ts` にあります。主なものは次のとおりです。

- **Tool**：id, slug, name, categoryId, summary, description, keywords, componentKey, status, priority（P0/P1/P2）, updatedAt
- **Product**：id, slug, name, brand, categoryId, summary, features, pros, cons, specifications, price, priceCheckedAt, merchantName, affiliateUrl, officialUrl, imageUrl, imageLicenseNote, sourceUrls, reviewStatus, status
- **Article**：id, slug, type（guide / solution）, title, description, productIds, toolSlugs, sources, author, reviewedAt, publishedAt, reviewStatus, status
- **Category**：id, slug, kind（tool / goods）, name, description, order

### 公開できる条件

| 種類 | 条件 |
|---|---|
| ツール | `status: "published"` で、`componentKey` が `features/tools/registry.ts` に登録されている |
| 商品 | `status: "published"`、`reviewStatus: "verified"`、`sourceUrls` が1件以上、`affiliateUrl` または `officialUrl` がある。価格を載せるなら `priceCheckedAt` が必須 |
| 記事 | `status: "published"`、`reviewStatus: "verified"`、`reviewedAt` がある |

この条件は `lib/validation.ts` で検査します。`npm test` で失敗するので、条件を満たさないまま公開することはできません。

## 6. 広告・アフィリエイト

- `components/AdSlot.tsx` は、`data/site.ts` の `ads.enabled` が true のときだけ枠を出す。初期値は false。
  - ツールページでは、結果と解説の下にだけ置く。
- 購入リンクは `lib/affiliate.ts` で組み立て、`rel="sponsored noopener"` を付ける。
- 商品カードには、PR表記と価格の確認日を必ず表示する。
- `/disclosure/` に広告・PRの方針を掲載する。

## 6.5 デザイン（2026-10-19 改訂）

- 明るい背景（#f6f7fb）に白いカード、薄い影。アクセントは藍〜紫のグラデーション（`--c-accent` → `--c-accent-2`）。
- 文字は英数字 Inter、日本語 Noto Sans JP。
- ヘッダーはすりガラスで上に固定。スマホのメニューは画面下のタブバー（ヘッダーの外に置く。backdrop-filter の中では fixed が効かないため）。
- ツールのカテゴリごとにアイコンの色を変える（`components/styles.ts` の `categoryGradient`）。
- ダークモードは同じ役割の色を差し替えるだけで対応する。

## 7. 試作版からの移植

`prototype/dougubako.html`（Claude上の試作）にある112ツールは、計算部分を `features/tools/*/logic.ts` に移し、画面をReactで作り直す。

- 公開中（109種・計画したツールはすべて公開）：
  - 第6弾（2026-10-19）：行数・段落、時間単位、cron、ダミーデータ、ダミー文章、SNS文字数、メール文面、議事録、会議時間、グラデーション、配色、ボックスシャドウ、CSS単位、ファビコン、CSV重複削除・列抽出・区切り文字・比較、色の抽出、背景透過、画像に文字入れ、動画→GIF、動画から音声（WAV）、電子印鑑、PDF編集、テキスト結合、ファイル名一括変更、Excel・CSV変換、PDFページ回転・削除（ページ整理の画面を使う）
  - 「タイムスタンプ変換」は「Unix時間変換」と同じ内容のため削除した
  - 第5弾（2026-10-19）：カウントダウン、タイムゾーン、Unix時間、営業日、週番号、ハッシュ、カラーコード、JWT、複利、貯金目標、残業代、歩数・距離、達成率、進捗率、学習時間、PDF画像化、正方形画像、余白追加、モザイク、コントラスト比、CSV→JSON、JSON→CSV
  - 第4弾（2026-10-19）：QRコード、ローン返済、単位変換、BMI、入学・卒業年、画像トリミング、画像回転・反転、PDFページ整理
  - （以下は第3弾までの49種）
  - 画像：形式変換（HEIC対応）、リサイズ、圧縮、一括リサイズ
  - PDF：結合、分割、画像からPDF、圧縮
  - データ：CSV文字コード変換
  - お金：旅行費用の分担、買い物単価比較、予算配分、電気料金、チップ、データ容量
  - 生成・ビジネス：抽選、ビンゴ、タスク優先順位
  - （以下は第2弾までの31種）
  - 文章：文字数、原稿用紙、ひらがな・カタカナ、全角・半角、大文字・小文字、改行・空白、置換、重複行、テキスト比較
  - 計算：消費税、割引、割合、比率、平均、四捨五入
  - 日付：日数、日付加算、曜日、年齢
  - 生成：パスワード、乱数、UUID
  - 開発者向け：JSON、URL、Base64、HTML、正規表現
  - お金：割り勘、時給・月給
  - ビジネス：プレゼン時間、読書時間
  - ほかはすべて `draft`。
- すべての公開ツールに「使い方」と「よくある質問」を付ける（`data/tool-guides/`。ツールの実際の動きに合わせ、確かな一般知識だけを書く）。
- 文章・割り勘・精算など入力が長いツールは、入力をその端末のブラウザ（localStorage）に保存する（`components/useStoredState.ts`）。割り勘と精算は、結果をURLの「#」以降に入れて共有できる（サーバーには送られない）。
- 似た画面のツールは、1つのフォルダに `logic.ts`（複数の純粋関数）と `Tools.tsx`（複数の画面）をまとめてよい。例：`text/convert/`、`calculator/basic/`、`developer/encode/`。
- 試作の記事・グッズ解説の文章はAIが書いた下書きなので、`content/` に `reviewStatus: "pending"` で置き、確認後に公開する。
