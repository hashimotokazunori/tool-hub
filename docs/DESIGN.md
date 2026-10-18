# ツールひろば 設計メモ

サイト名は仮称です。表示名・URL・運営者情報は `data/site.ts` だけで管理し、画面のコードには書きません。

## 1. 方針

- **無料Webツール**で検索流入とリピーターを集め、**便利グッズ**の選び方・比較から商品購入につなげる総合ポータル。
- **処理はブラウザ内で完結**させる。サーバーにファイルや入力を送らない。
- **データと表示を分ける**。ツール・商品・記事・カテゴリは `data/` に置き、画面は `app/` と `components/` に置く。
- **公開状態を管理する**。`status: "published"` のものだけを一覧・検索・サイトマップに出す。
  - 未実装のツールや未確認の商品・記事は、URLを直接開いても表示しない（404）。
  - 開発中は `SHOW_DRAFTS=1` で下書きを確認できる。
- **AIが書いた文章は自動で公開しない**。記事と商品には `reviewStatus` を持たせ、人が確認して `verified` にしたものだけを公開対象にする。

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

## 7. 試作版からの移植

`prototype/dougubako.html`（Claude上の試作）にある112ツールは、計算部分を `features/tools/*/logic.ts` に移し、画面をReactで作り直す。

- 公開中（31種）：
  - 文章：文字数、原稿用紙、ひらがな・カタカナ、全角・半角、大文字・小文字、改行・空白、置換、重複行、テキスト比較
  - 計算：消費税、割引、割合、比率、平均、四捨五入
  - 日付：日数、日付加算、曜日、年齢
  - 生成：パスワード、乱数、UUID
  - 開発者向け：JSON、URL、Base64、HTML、正規表現
  - お金：割り勘、時給・月給
  - ビジネス：プレゼン時間、読書時間
  - ほかはすべて `draft`。
- 似た画面のツールは、1つのフォルダに `logic.ts`（複数の純粋関数）と `Tools.tsx`（複数の画面）をまとめてよい。例：`text/convert/`、`calculator/basic/`、`developer/encode/`。
- 試作の記事・グッズ解説の文章はAIが書いた下書きなので、`content/` に `reviewStatus: "pending"` で置き、確認後に公開する。
