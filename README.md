# ツールひろば（仮称）

無料Webツールと便利グッズの選び方・比較ガイドをまとめた総合サイトです。設計は [docs/DESIGN.md](docs/DESIGN.md) を参照してください。

## 必要なもの

- Node.js 24 以上

## よく使うコマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発用サーバー（http://localhost:3000） |
| `npm run build` | 本番用にビルド（全ページを静的生成） |
| `npm run start` | ビルドしたサイトを起動 |
| `npm run lint` | ESLint |
| `npm run typecheck` | ルートの型を生成して型チェック |
| `npm test` | 計算ロジックとデータの整合性のテスト |
| `npm run check` | 上の4つ（lint・型・テスト・ビルド）をまとめて実行 |

下書きの記事や選び方も表示して確認したいときは、`SHOW_DRAFTS=1` を付けて起動します。

## 環境変数

| 名前 | 内容 |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | 本番のURL。未設定でも Vercel の本番環境では本番ドメインを使い、検索エンジンへの登録も許可する。プレビューと手元では robots.txt で登録させない |
| `SHOW_DRAFTS` | `1` で下書きも表示（本番では設定しない） |

## 閲覧数

Vercel Web Analytics で計測する（`app/layout.tsx` の `<Analytics />`）。Vercel のプロジェクト画面の「Analytics」タブで有効にすると、ページごとの閲覧数・訪問者数・参照元・国・端末を見られる。Cookie は使わない。

## ツールを追加する手順

1. `features/tools/<分類>/<ツール>/logic.ts` に計算ロジックを書き、`tests/` にテストを追加する。
2. 同じフォルダに `Tool.tsx`（`"use client"`）で画面を作る。
3. `features/tools/keys.ts` にキーを、`features/tools/registry.tsx` に画面を登録する。
4. `data/tools.ts` の `PUBLISHED` に「slug: キー」を追加する。
5. `npm run check` が通ったら公開できる。

## 公開前に設定するもの

- `NEXT_PUBLIC_SITE_URL`（本番のURL。Vercel で公開する場合は不要）
- 任意：`data/site.ts` の運営者名・問い合わせ先・プライバシーポリシーの制定日（空のままなら表示しない。問い合わせ先が空なら問い合わせページも出さない）
