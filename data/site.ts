/** サイト全体の設定。サイト名や運営者情報はここだけで管理する */
export const site = {
  name: "ツールひろば",
  tagline: "暮らしと仕事の「困った」を、すぐ解決",
  description:
    "登録不要で使える無料Webツールと、便利グッズの選び方・比較ガイドをまとめた総合サイト。ツールはブラウザの中だけで動き、入力した内容やファイルを送信しません。",
  /**
   * 本番のURL。環境変数 NEXT_PUBLIC_SITE_URL で上書きできる。
   * 未設定でも Vercel 上では本番ドメインを使う（独自ドメインを追加すると自動でそちらになる）
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  /**
   * Cloudflare Web Analytics のトークン（公開してよい値）。
   * 入っていれば Cloudflare の計測を、空なら Vercel Web Analytics を使う
   */
  cloudflareBeacon: process.env.NEXT_PUBLIC_CF_BEACON_TOKEN ?? "",
  locale: "ja_JP",
  operator: {
    /** 運営者名。空なら運営者名は表示しない */
    name: "" as string,
    /** 問い合わせ先のメールアドレスまたはフォームのURL。空なら問い合わせページとリンクを出さない */
    contact: "" as string,
  },
  /** プライバシーポリシーの制定日（例: "2026年11月1日"）。空なら表示しない */
  privacyPolicyDate: "" as string,
  /** Google AdSense のパブリッシャーID（公開してよい値）。全ページの head にコードを入れる。ads.txt は public/ads.txt */
  adsenseClient: "ca-pub-8509241257297550",
  ads: {
    /** 広告を出すかどうか。審査・規約の確認が終わるまで false */
    enabled: false,
  },
} as const;

export type Site = typeof site;
