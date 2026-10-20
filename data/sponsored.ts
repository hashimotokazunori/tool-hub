/**
 * A8.net で提携した広告の文字リンク。
 * href・pixel・text・before は A8 の「広告リンク作成」（通常広告用）で作られたものをそのまま使う（改変禁止）。
 * note は当サイトの説明。広告主の宣伝文は書き写さない。
 * tools に書いたツールのページにだけ「PR」として表示する。1ページに置くのは2件まで。
 */
export type SponsoredLink = {
  id: string;
  /** A8 のプログラムID */
  programId: string;
  name: string;
  /** A8 の素材で、リンクの前に付く文 */
  before?: string;
  text: string;
  href: string;
  /** 表示回数を数えるための A8 の画像 */
  pixel: string;
  note: string;
  tools: string[];
};

export const sponsoredLinks: SponsoredLink[] = [
  {
    id: "languise",
    programId: "s00000026066001",
    name: "Languise",
    text: "無料で試せる！面倒な翻訳・校正・要約を自動化【Languise】",
    href: "https://px.a8.net/svt/ejp?a8mat=4BEL1K+OETCQ+5L4K+5Z6WY",
    pixel: "https://www19.a8.net/0.gif?a8mat=4BEL1K+OETCQ+5L4K+5Z6WY",
    note: "英語のPDF（論文・資料など）を、レイアウトを保ったまま翻訳できるWebサービス。無料プランと有料プランがあります。",
    tools: ["pdf-merge", "pdf-split", "pdf-organize", "pdf-to-image"],
  },
  {
    id: "aiseesoft",
    programId: "s00000015149001",
    name: "Aiseesoft",
    text: "安心のマルチメディアソフト【Aiseesoft】",
    href: "https://px.a8.net/svt/ejp?a8mat=4BEL1K+Q7462+38W2+5YRHE",
    pixel: "https://www13.a8.net/0.gif?a8mat=4BEL1K+Q7462+38W2+5YRHE",
    note: "PDF変換・動画変換・データ復元などのパソコン用ソフト（有料）。このサイトのツールより多くの形式を扱いたいときに。",
    tools: ["pdf-compress", "pdf-editor", "image-to-pdf", "audio-converter"],
  },
  {
    id: "movavi",
    programId: "s00000018520001",
    name: "Movavi",
    before: "動画を編集し忘れられないストーリーにしましょう。",
    text: "Movavi Video Suite",
    href: "https://px.a8.net/svt/ejp?a8mat=4BEL1K+PLOKA+3YWG+60H7M",
    pixel: "https://www14.a8.net/0.gif?a8mat=4BEL1K+PLOKA+3YWG+60H7M",
    note: "カット・字幕・BGMなどの動画編集ができるパソコン用ソフト（有料・試用版あり）。",
    tools: ["video-to-gif", "audio-converter"],
  },
  {
    id: "shin-server",
    programId: "s00000025450001",
    name: "シンレンタルサーバー",
    text: "新世代レンタルサーバー『シンレンタルサーバー』",
    href: "https://px.a8.net/svt/ejp?a8mat=4BEL1K+KU7Q2+5GDG+5Z6WY",
    pixel: "https://www11.a8.net/0.gif?a8mat=4BEL1K+KU7Q2+5GDG+5Z6WY",
    note: "WordPressのブログやWebサイトを公開するためのレンタルサーバー（有料）。",
    tools: ["json-formatter", "html-escape", "url-encode", "favicon", "css-unit", "box-shadow"],
  },
  {
    id: "mf-tax-return",
    programId: "s00000021185002",
    name: "マネーフォワード クラウド確定申告",
    text: "無料の確定申告自動化ソフト マネーフォワード クラウド確定申告",
    href: "https://px.a8.net/svt/ejp?a8mat=4BEL1K+LFNBU+4JGQ+BWVTE",
    pixel: "https://www19.a8.net/0.gif?a8mat=4BEL1K+LFNBU+4JGQ+BWVTE",
    note: "個人事業主・副業の人向けの確定申告ソフト。銀行やカードの明細を取り込んで帳簿を付けられます。",
    tools: ["consumption-tax", "wage-converter"],
  },
  {
    id: "misoca",
    programId: "s00000013936001",
    name: "Misoca",
    text: "無料で使える クラウド請求書・見積書・納品書管理サービス Misoca（みそか）",
    href: "https://px.a8.net/svt/ejp?a8mat=4BEL1K+MMIJE+2ZJ4+5YZ76",
    pixel: "https://www18.a8.net/0.gif?a8mat=4BEL1K+MMIJE+2ZJ4+5YZ76",
    note: "見積書・納品書・請求書をWebで作って送れる弥生のサービス。消費税の計算や区分記載にも対応しています。",
    tools: ["consumption-tax", "hanko", "rounding"],
  },
  {
    id: "coconala",
    programId: "s00000012624001",
    name: "ココナラ",
    before: "知識・スキルの販売サイト",
    text: "【ココナラ】",
    href: "https://px.a8.net/svt/ejp?a8mat=4BEL1K+N7Y56+2PEO+68U4Y",
    pixel: "https://www17.a8.net/0.gif?a8mat=4BEL1K+N7Y56+2PEO+68U4Y",
    note: "イラスト・デザイン・文章作成などのスキルを出品して販売できるサイト。",
    tools: ["color-palette", "gradient", "image-text"],
  },
  {
    id: "aupay-furusato",
    programId: "s00000023934001",
    name: "au PAY ふるさと納税",
    text: "au PAY ふるさと納税",
    href: "https://px.a8.net/svt/ejp?a8mat=4BEL1P+3NKU8Q+54OC+5YJRM",
    pixel: "https://www16.a8.net/0.gif?a8mat=4BEL1P+3NKU8Q+54OC+5YJRM",
    note: "KDDIグループのふるさと納税サイト。au PAY などで寄附できます。",
    tools: ["furusato-limit"],
  },
  {
    id: "furusato-honpo",
    programId: "s00000025743001",
    name: "ふるさと本舗",
    text: "全国の美味しい特産品に特化したふるさと納税サイト【ふるさと本舗】",
    href: "https://px.a8.net/svt/ejp?a8mat=4BEL1P+3O69UI+5IMU+5YJRM",
    pixel: "https://www12.a8.net/0.gif?a8mat=4BEL1P+3O69UI+5IMU+5YJRM",
    note: "食べ物など各地の特産品の返礼品を中心に扱うふるさと納税サイト。",
    tools: ["furusato-limit"],
  },
];

/** そのツールのページに出す広告（2件まで） */
export function sponsoredFor(toolSlug: string): SponsoredLink[] {
  return sponsoredLinks.filter((s) => s.tools.includes(toolSlug)).slice(0, 2);
}
