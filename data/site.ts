/** サイト全体の設定。サイト名や運営者情報はここだけで管理する */
export const site = {
  name: "ツールひろば",
  tagline: "暮らしと仕事の「困った」を、すぐ解決",
  description:
    "登録不要で使える無料Webツールと、便利グッズの選び方・比較ガイドをまとめた総合サイト。ツールはブラウザの中だけで動き、入力した内容やファイルを送信しません。",
  /** 本番のURL。環境変数 NEXT_PUBLIC_SITE_URL で上書きできる */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "ja_JP",
  operator: {
    /** 運営者名。空なら運営者名は表示しない */
    name: "" as string,
    /** 問い合わせ先のメールアドレスまたはフォームのURL。空なら問い合わせページとリンクを出さない */
    contact: "" as string,
  },
  /** プライバシーポリシーの制定日（例: "2026年11月1日"）。空なら表示しない */
  privacyPolicyDate: "" as string,
  ads: {
    /** 広告を出すかどうか。審査・規約の確認が終わるまで false */
    enabled: false,
  },
} as const;

export type Site = typeof site;
