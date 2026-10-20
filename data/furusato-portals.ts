/**
 * ふるさと納税ポータルサイトの事実データベース
 *
 * 設計方針:
 * - 各事実は `Fact<T>`（value / source / checkedAt / quote?）で持つ。
 *   - value: 日本語で記述した値（要約は自分の言葉。誇張なし）
 *   - source: その事実を読んだ公式ページの URL（ポータル自身・運営会社の公式ページ、ルールは総務省のみ）
 *   - checkedAt: 確認日（YYYY-MM-DD）
 *   - quote: 判断の根拠になった公式ページの文言（短い抜粋。任意）
 * - 公式ページで確認できなかった事実は `null`。理由は `unknownReasons` に書く。
 *   記憶や第三者サイト（ブログ・比較サイト等）で埋めない。
 * - `features` / `pointRuleNotes` / `notes` は Fact の配列（確認できたものだけ）。
 * - 2025年10月1日からのポイント付与禁止ルールそのものは `FURUSATO_POINT_RULE` に1回だけ記録する。
 */

export type Fact<T> = {
  value: T;
  /** 公式ページの URL（https） */
  source: string;
  /** 確認日 YYYY-MM-DD */
  checkedAt: string;
  /** 公式ページの文言の抜粋（任意） */
  quote?: string;
};

export type OneStopOnline = {
  /** ポータル経由（またはポータルが案内する方法）でオンライン申請ができると公式に書かれているか */
  supported: boolean;
  /** 公式ページに名前が出ている申請サービス */
  services: string[];
};

export type FurusatoPortalField =
  | "operator"
  | "listingCount"
  | "paymentMethods"
  | "oneStopOnline"
  | "simulator"
  | "app";

/**
 * - available: 公式ページを読めて、サービスが通常どおり提供されている
 * - suspended: 公式に「サービス停止中」と告知されている
 * - unverified: こちらから公式ページを読めず、内容を確認できていない
 */
export type PortalStatus = "available" | "suspended" | "unverified";

export type FurusatoPortal = {
  /** ASCII のスラッグ */
  id: string;
  name: string;
  officialUrl: string;
  status: PortalStatus;
  /** 運営会社（公式ページの表記どおり） */
  operator: Fact<string> | null;
  /** 掲載自治体数・返礼品数（公式ページの文言どおり。時点の記載があればそれも） */
  listingCount: Fact<string> | null;
  /** 支払い方法（公式ページの表記どおり） */
  paymentMethods: Fact<string[]> | null;
  /** ワンストップ特例のオンライン申請 */
  oneStopOnline: Fact<OneStopOnline> | null;
  /** 控除上限額シミュレーターがあるか */
  simulator: Fact<boolean> | null;
  /** アプリ（公式ページの記載） */
  app: Fact<string> | null;
  /** 特徴（2〜4点。公式ページの内容を自分の言葉で） */
  features: Fact<string>[];
  /** 2025年10月1日のポイント付与禁止ルールに関して、ポータルが公式に書いていること */
  pointRuleNotes: Fact<string>[];
  /** その他の重要なお知らせ（サービス停止など） */
  notes: Fact<string>[];
  /** null にした項目とその理由 */
  unknownReasons: Partial<Record<FurusatoPortalField, string>>;
};

const CHECKED = "2026-10-20";

/** 総務省のルール（ポイント付与を行う者を通じた募集の禁止） */
export const FURUSATO_POINT_RULE = {
  title: "ふるさと納税の指定基準の見直し等（募集適正基準の改正）",
  rule: "寄附に伴いポイント等の付与を行う者を通じた募集を禁止すること。（募集適正基準の改正）",
  announcedOn: "2024-06-28",
  announcedOnWareki: "令和6年6月28日",
  effectiveFrom: "2025-10-01",
  effectiveFromWording: "【令和7年10月1日から適用】",
  notice: "改正告示：令和6年総務省告示第203号",
  source: "https://www.soumu.go.jp/menu_news/s-news/01zeimu04_02000126.html",
  checkedAt: CHECKED,
} as const;

const RK_TOP = "https://event.rakuten.co.jp/furusato/";
const RK_FAQ = "https://event.rakuten.co.jp/furusato/faq/";
const RK_ABOUT = "https://event.rakuten.co.jp/furusato/guide/about/";
const RK_ONLINE = "https://event.rakuten.co.jp/furusato/guide/tax/onestop_online/";

const FN_TOP = "https://furunavi.jp/";
const FN_PAY = "https://furunavi.jp/Guide/Payment";
const FN_COMPANY = "https://furunavi.jp/company.aspx";
const FN_COIN = "https://furunavi.jp/incentive.aspx";
const FN_ONLINE = "https://furunavi.jp/Guide/OneStop/Online";
const FN_APP = "https://furunavi.jp/c/about_app";
const FN_ABOUT = "https://furunavi.jp/about.aspx";

const AU_TOP = "https://furusato.wowma.jp/";
const AU_FAQ = "https://furusato.wowma.jp/faq/";
const AU_FLOW = "https://furusato.wowma.jp/guide/flow.php";
const AU_ONLINE = "https://furusato.wowma.jp/guide/onestop_online.php";
const AU_NEWS577 = "https://furusato.wowma.jp/news/detail.php?news_id=577";

const HP_TOP = "https://furusatohonpo.jp/";
const HP_PAY = "https://furusatohonpo.jp/guide/payment/";
const HP_TERMS = "https://furusatohonpo.jp/about/terms/";
const HP_SIM = "https://furusatohonpo.jp/simulation/";
const HP_ABOUT = "https://furusatohonpo.jp/news/about/";

const PK_TOP = "https://poke-m.com/furusato";
const PK_ABOUT = "https://poke-m.com/furusato/about";
const PK_LAW = "https://poke-m.com/specified_commercial_law";
const PK_PAY = "https://poke-m.zendesk.com/hc/ja/articles/4405472610585";
const PK_POINT = "https://poke-m.zendesk.com/hc/ja/articles/4407836029593";

const AM_HELP_ABOUT = "https://www.amazon.co.jp/gp/help/customer/display.html?nodeId=TH51It3I135Wx0fypy";
const AM_HELP_TAX = "https://www.amazon.co.jp/gp/help/customer/display.html?nodeId=ToXIclwREhl1MyHaxB";
const AM_TERMS = "https://www.amazon.co.jp/gp/help/customer/display.html?nodeId=T3lt9GYcvcbGpjhuxT";

const JAL_TOP = "https://furusato.jal.co.jp/";
const JAL_FAQ = "https://furusato.jal.co.jp/faq/";
const JAL_ABOUT = "https://furusato.jal.co.jp/about/";
const JAL_TERMS = "https://furusato.jal.co.jp/terms/";
const JAL_GUIDE = "https://furusato.jal.co.jp/guide/";

const ANA_TOP = "https://furusato.ana.co.jp/";
const ANA_FAQ = "https://furusato.ana.co.jp/guide/faq/";
const ANA_TERMS = "https://furusato.ana.co.jp/terms/";
const ANA_ONLINE = "https://furusato.ana.co.jp/guide/onestop_online/";
const ANA_ABOUT = "https://furusato.ana.co.jp/guide/about/";
const ANA_NOTICE_1019 = "https://furusato.ana.co.jp/donation/t/t8101/";

const YH_TOP = "https://furusato.shopping.yahoo.co.jp/y-furusato/";
const YH_GUIDE = "https://furusato.shopping.yahoo.co.jp/y-furusato/guide/?seller_id=y-furusato";
const YH_INFO = "https://furusato.shopping.yahoo.co.jp/info.html";
const YH_PAY = "https://furusato.shopping.yahoo.co.jp/guide.html";

const TB_NEWS_1020 = "https://www.trustbank.co.jp/newsroom/newsrelease/news261020/";
const TB_NEWS_1019 = "https://www.trustbank.co.jp/newsroom/news/news261019/";

const LM_TOP = "https://www.lifemarketing.co.jp/";

const f = <T>(value: T, source: string, quote?: string): Fact<T> =>
  quote === undefined ? { value, source, checkedAt: CHECKED } : { value, source, checkedAt: CHECKED, quote };

export const FURUSATO_PORTALS: FurusatoPortal[] = [
  {
    id: "rakuten",
    name: "楽天ふるさと納税",
    officialUrl: RK_TOP,
    status: "available",
    operator: f("楽天グループ株式会社", RK_FAQ, "楽天ふるさと納税は、特定事業者として国税庁長官より指定されている楽天グループ株式会社が運営するポータルサイトです。"),
    listingCount: null,
    paymentMethods: f(
      ["クレジットカード", "楽天ポイント", "楽天口座決済（銀行振込）"],
      RK_FAQ,
      "自治体によって利用可能な決済方法が異なります。／すべての自治体および返礼品においてクレジットカード決済をご利用いただけます",
    ),
    oneStopOnline: f(
      { supported: true, services: ["自治体マイページ", "ふるまど"] },
      RK_ONLINE,
      "対象自治体であれば、複数自治体分を一括で申請可能",
    ),
    simulator: f(true, RK_TOP, "寄付限度額シミュレーター（かんたんシミュレーター／詳細版シミュレーター）"),
    app: f("楽天市場アプリから楽天ふるさと納税のマイページを開ける旨の記載あり（ふるさと納税専用アプリの記載はなし）", RK_FAQ),
    features: [
      f("楽天市場の中のサービスで、楽天会員情報を使って通常の買い物と同じ手順で寄付できる", RK_ABOUT),
      f("寄付の支払いに楽天ポイントを使える", RK_FAQ, "なお、決済の際に楽天ポイントを使うことは可能です。"),
      f("楽天トラベルクーポン・楽天GORAクーポンなどの返礼品がある（申込みには楽天会員登録が必須）", RK_ABOUT),
      f("2026年8月から、返礼品数の表示を「品目数」（容量・個数違いや発送時期違いも個別に数える）に変更", RK_TOP),
    ],
    pointRuleNotes: [
      f(
        "2025年10月1日から、楽天ふるさと納税の寄付は原則として楽天ポイント付与の対象外。カード決済に伴うポイントは引き続きカード会社から付与される",
        RK_FAQ,
        "2025年10月1日(水)より「楽天ふるさと納税」の寄付は、原則として楽天ポイント付与の対象外となります。",
      ),
      f(
        "楽天スーパーSALEやお買い物マラソンなどのポイントキャンペーンも付与対象外",
        RK_FAQ,
      ),
      f(
        "総務省告示の施行に伴い、ポータルサイトによるポイント付与ができなくなったと告知（2025/10/01付のお知らせ）",
        RK_TOP,
        "2025年10月1日より、ポータルサイトによるふるさと納税へのポイント付与ができなくなりました。",
      ),
    ],
    notes: [],
    unknownReasons: {
      listingCount: "トップページに「参加自治体数」「品目数」の欄はあるが、数値は動的に表示されページ本文から読み取れなかった",
    },
  },
  {
    id: "furusato-choice",
    name: "ふるさとチョイス",
    officialUrl: "https://www.furusato-tax.jp/",
    status: "suspended",
    operator: f("株式会社トラストバンク", TB_NEWS_1020, "株式会社トラストバンク（本社：東京都港区…）が運営する「ふるさとチョイス」"),
    listingCount: null,
    paymentMethods: null,
    oneStopOnline: null,
    simulator: null,
    app: null,
    features: [],
    pointRuleNotes: [],
    notes: [
      f(
        "不正アクセスにより会員の個人情報が外部に流出したとして、2026年10月19日15時50分に「ふるさとチョイス」関連サービスを停止。再開時期は未定（2026年10月20日発表、流出件数は現時点で4,454,097件）",
        TB_NEWS_1020,
        "10月19日（月）15時50分、「ふるさとチョイス」関連サービスを停止いたしました。",
      ),
      f("不正アクセスの疑いに伴うサービス一時停止の告知（2026年10月19日）", TB_NEWS_1019),
    ],
    unknownReasons: {
      listingCount: "2026-10-20 時点でサイト全体がメンテナンス表示（サービス停止中）で、公式ページを読めなかった",
      paymentMethods: "同上（サービス停止中）",
      oneStopOnline: "同上（サービス停止中）",
      simulator: "同上（サービス停止中）",
      app: "同上（サービス停止中）",
    },
  },
  {
    id: "satofull",
    name: "さとふる",
    officialUrl: "https://www.satofull.jp/",
    status: "unverified",
    operator: null,
    listingCount: null,
    paymentMethods: null,
    oneStopOnline: null,
    simulator: null,
    app: null,
    features: [],
    pointRuleNotes: [],
    notes: [],
    unknownReasons: {
      operator: "2026-10-20 に公式サイト（www.satofull.jp）へ何度アクセスしても応答がなく（タイムアウト）、公式ページを読めなかった",
      listingCount: "同上（公式サイトに接続できず）",
      paymentMethods: "同上（公式サイトに接続できず）",
      oneStopOnline: "同上（公式サイトに接続できず）",
      simulator: "同上（公式サイトに接続できず）",
      app: "同上（公式サイトに接続できず）",
    },
  },
  {
    id: "furunavi",
    name: "ふるなび",
    officialUrl: FN_TOP,
    status: "available",
    operator: f("株式会社アイモバイル", FN_COMPANY, "株式会社アイモバイル （i-mobile Co.,Ltd.）"),
    listingCount: null,
    paymentMethods: f(
      ["ふるなびマネー", "クレジットカード（Visa／MasterCard／JCB／American Express／Diners Club）", "Amazon Pay", "PayPay", "楽天ペイ", "d払い", "銀行振込", "郵便振替", "現金書留", "自治体へ直接持参"],
      FN_PAY,
      "ご利用可能な決済方法は自治体によって異なります。",
    ),
    oneStopOnline: f(
      { supported: true, services: ["ふるなびワンストップ e申請", "ふるまど", "自治体マイページ"] },
      FN_ONLINE,
      "「ふるなびワンストップ e申請」「ふるまど」「自治体マイページ」いずれかのサービスを導入している自治体でご利用いただけます。",
    ),
    simulator: f(true, FN_TOP, "控除上限額シミュレーション"),
    app: f("ふるなびアプリ（iOS・Android）。寄付からワンストップ特例オンライン申請までアプリ内で完結できると案内", FN_APP, "寄附からワンストップ特例オンライン申請までアプリ内で全て完結！"),
    features: [
      f("寄附で自治体のポイントを受け取り、後から特産品を選べる「ふるなびカタログ」がある", FN_ABOUT),
      f("寄附額に応じたトラベルポイントで対象の宿に泊まれる「ふるなびトラベル」がある", FN_ABOUT),
      f("プロジェクトごとに使い道が明確な「ふるなびクラウドファンディング」がある", FN_ABOUT),
      f("災害支援の寄附では自治体から手数料を取らないと案内", FN_ABOUT, "※ふるなび災害支援では、自治体から手数料を一切いただいておりません。"),
    ],
    pointRuleNotes: [
      f(
        "寄附によるふるなびコインの付与は2025年9月末で終了（コイン自体は、ふるなびオリジナルサービスの利用など条件に応じて付与される）",
        FN_COIN,
        "2025年9月末をもって寄附によるコイン付与は終了いたしました。",
      ),
    ],
    notes: [
      f("2026年9月28日に、PayPayでの支払いとPayPay残高へのふるなびコイン交換の一時停止を告知（お知らせの見出し）", FN_TOP),
    ],
    unknownReasons: {
      listingCount: "トップページ・ふるなびとは・会社概要に掲載自治体数・返礼品数の総数の記載がなかった",
    },
  },
  {
    id: "au-pay",
    name: "au PAY ふるさと納税",
    officialUrl: AU_TOP,
    status: "available",
    operator: f("auコマース＆ライフ株式会社とKDDI株式会社の共同運営", AU_FAQ, "au PAY マーケットは auコマース＆ライフ株式会社 … と KDDI株式会社 … が共同で運営しています。"),
    listingCount: null,
    paymentMethods: f(
      ["クレジットカード（VISA、Master、JCB、Diners、AMEX）", "au PAY カード", "au PAY 残高", "au PAY（auかんたん決済）通信料金合算支払い"],
      AU_FLOW,
      "au PAY ふるさと納税では下記のお支払い方法が選択可能です。",
    ),
    oneStopOnline: f(
      { supported: true, services: ["自治体マイページ", "ふるまど"] },
      AU_ONLINE,
      "（サービス提供元：自治体マイページ、ふるまど）",
    ),
    simulator: f(true, AU_FLOW, "控除額シミュレーション（簡易版）／控除額シミュレーション（詳細版）"),
    app: null,
    features: [
      f("Pontaポイントを寄附の支払いに使える", AU_TOP, "Pontaポイントが利用できます"),
      f("「オンラインワンストップ申請」対象自治体の返礼品で絞り込める", AU_TOP),
    ],
    pointRuleNotes: [
      f(
        "ふるさと納税は買い物ではなく寄附のため、買い得メンバーズによるポイント付与の対象外と案内（2025年10月のルール変更に触れた記載は見つからなかった）",
        AU_FAQ,
        "ふるさと納税はお買い物ではなく寄附となりますので、買い得メンバーズによるポイント付与の対象とはなりません。",
      ),
    ],
    notes: [
      f(
        "連携サイト（ふるさとチョイス）のサービス停止に伴い、一部の自治体・返礼品の掲載を一時停止していると告知",
        AU_NEWS577,
        "このたび、連携サイト(ふるさとチョイス)において、不正アクセスの疑いに伴いサービスを一時停止をしたため、",
      ),
    ],
    unknownReasons: {
      listingCount: "公式ページに掲載自治体数・返礼品数の記載が見つからなかった",
      app: "ふるさと納税専用アプリの記載は見つからなかった（FAQ に au PAY マーケットアプリへの言及はあるが、対応範囲は不明）",
    },
  },
  {
    id: "d-shopping",
    name: "dショッピング ふるさと納税百選",
    officialUrl: "https://dshopping-furusato.docomo.ne.jp/",
    status: "unverified",
    operator: f(
      "dショッピングは株式会社NTTドコモと株式会社オールアバウトライフマーケティングの共同運営（運営会社側の公式サイトの記載）",
      LM_TOP,
      "株式会社NTTドコモと株式会社オールアバウトライフマーケティングが共同運営する総合通販サイト。",
    ),
    listingCount: null,
    paymentMethods: null,
    oneStopOnline: null,
    simulator: null,
    app: null,
    features: [],
    pointRuleNotes: [],
    notes: [],
    unknownReasons: {
      listingCount: "ポータル本体（dshopping-furusato.docomo.ne.jp）が 403（Access Denied）で読めなかった。運営会社サイトには過去（2024年）の自治体数突破のリリース見出しはあるが、現在の数ではないため採用しない",
      paymentMethods: "ポータル本体が 403 で読めなかった",
      oneStopOnline: "ポータル本体が 403 で読めなかった",
      simulator: "ポータル本体が 403 で読めなかった",
      app: "ポータル本体が 403 で読めなかった",
    },
  },
  {
    id: "furusato-honpo",
    name: "ふるさと本舗",
    officialUrl: HP_TOP,
    status: "available",
    operator: f("株式会社ふるさと本舗", HP_TERMS, "株式会社ふるさと本舗（以下「当社」といいます。）が提供する「ふるさと本舗」"),
    listingCount: null,
    paymentMethods: f(
      ["クレジットカード", "Amazon Pay", "PayPay"],
      HP_PAY,
      "クレジットカード 対象自治体 全ての自治体でご利用いただけます。（Amazon Pay・PayPay は対象自治体のみ）",
    ),
    oneStopOnline: null,
    simulator: f(true, HP_SIM, "ふるさと本舗の控除上限額シミュレーション"),
    app: null,
    features: [
      f("運営会社が執筆するふるさと納税の解説記事カテゴリがある", HP_ABOUT),
      f("寄付金額10万円以上の「プレミアム返礼品」や定期便などの特集がある", HP_TOP),
    ],
    pointRuleNotes: [
      f(
        "2026年10月1日〜31日に、キャンペーンコードを入力して1件8,000円以上寄付し、アンケートに回答した会員を対象にAmazonギフトカード500円分を贈る「ご利用者様アンケートキャンペーン」を掲載",
        HP_TOP,
        "アンケート回答でAmazonギフトカード500円分をプレゼント！",
      ),
    ],
    notes: [],
    unknownReasons: {
      listingCount: "公式ページに掲載自治体数・返礼品数の記載が見つからなかった",
      oneStopOnline: "FAQ はページ本文が動的に読み込まれ、オンライン申請の対応状況を読み取れなかった",
      app: "公式ページにアプリの記載が見つからなかった",
    },
  },
  {
    id: "pokemaru",
    name: "ポケマルふるさと納税",
    officialUrl: PK_TOP,
    status: "available",
    operator: f("株式会社 雨風太陽", PK_LAW, "運営会社 株式会社 雨風太陽"),
    listingCount: null,
    paymentMethods: f(["クレジットカード"], PK_PAY, "ふるさと納税としてご購入いただく際は、クレジットカード払いのみご利用可能です。"),
    oneStopOnline: null,
    simulator: f(true, PK_TOP, "控除上限シミュレーター"),
    app: null,
    features: [
      f("産直サイト「ポケットマルシェ」の生産者が自ら出品した食材を返礼品として選ぶ仕組み", PK_ABOUT),
      f("寄付の前後に、メッセージ機能で生産者と直接やりとりできる", PK_ABOUT),
      f("鮮魚や旬の短い食材、小規模生産者の食材も返礼品になっていると案内", PK_ABOUT),
    ],
    pointRuleNotes: [
      f(
        "このサービスの「返礼品」は納税額に応じて付与されるポイント（例：納税額の3割）で、あらかじめ選んだ商品の購入にその場で自動的に使われる仕組みと説明。別途ポイントが付与されるものではないと案内",
        PK_POINT,
        "当社ふるさと納税サービスにおける「返礼品」は納税額に応じてお客様に付与される「ポイント」でございます。",
      ),
    ],
    notes: [],
    unknownReasons: {
      listingCount: "公式ページに掲載自治体数・返礼品数の記載が見つからなかった",
      oneStopOnline: "ガイドページは郵送の申請書の案内のみで、オンライン申請への対応の記載が見つからなかった",
      app: "ふるさと納税での利用に関するアプリの記載が見つからなかった",
    },
  },
  {
    id: "amazon",
    name: "Amazonふるさと納税",
    officialUrl: "https://www.amazon.co.jp/fmc/furusato",
    status: "available",
    operator: f("アマゾンジャパン合同会社および／またはその関連会社", AM_TERMS, "アマゾンジャパン合同会社および／またはその関連会社（以下総称して「Amazon」といいます。）"),
    listingCount: null,
    paymentMethods: f(["クレジットカード", "デビットカード"], AM_HELP_ABOUT, "以下のお支払方法をご利用いただけます。クレジットカード デビットカード"),
    oneStopOnline: f(
      { supported: false, services: ["自治体マイページ", "ふるまど"] },
      AM_HELP_TAX,
      "Amazonふるさと納税では、オンラインでのワンストップ特例申請を受け付けておりません。（注文画面のフォームの情報を元に「自治体マイページ」または「ふるまど」でオンライン申請を行うことができる、とも案内）",
    ),
    simulator: null,
    app: null,
    features: [
      f("Amazonのアカウントで寄付でき、寄付後のフォームで郵送のワンストップ特例申請の希望や寄付金の使い途を伝える", AM_HELP_ABOUT),
      f("Amazonビジネスアカウントでは利用できず、個人用アカウントが必要", AM_HELP_ABOUT),
    ],
    pointRuleNotes: [],
    notes: [],
    unknownReasons: {
      listingCount: "公式ページに掲載自治体数・返礼品数の記載が見つからなかった",
      simulator: "ヘルプページには「控除上限額早見表」へのリンクはあるが、シミュレーターの有無は確認できなかった",
      app: "Amazonふるさと納税としてのアプリの記載が見つからなかった",
    },
  },
  {
    id: "jal",
    name: "JALふるさと納税",
    officialUrl: JAL_TOP,
    status: "available",
    operator: f("株式会社ＪＡＬＵＸ", JAL_TERMS, "株式会社ＪＡＬＵＸ（以下「当社」といいます）が運営するふるさと納税総合サイト「JALふるさと納税」"),
    listingCount: null,
    paymentMethods: f(
      ["クレジットカード", "JALお買いものポイント", "Amazon Pay", "PayPay"],
      JAL_FAQ,
      "JALふるさと納税は、クレジットカード決済、JALお買いものポイント決済、Amazon Pay、 PayPayによる寄附のみ受け付けております。※ポイント決済および Amazon PayおよびPayPayが利用できない自治体が一部ございます。",
    ),
    oneStopOnline: null,
    simulator: f(true, JAL_GUIDE, "自己負担が2,000円となる控除上限額をシミュレーションしてみましょう！"),
    app: null,
    features: [
      f("たまったマイルを1,000マイルからJALお買いものポイントに交換して寄附に使える（家族のマイルの合算も可）", JAL_ABOUT),
      f("複数の自治体への寄附をまとめて決済できる（各自治体共通の決済方法のみ）", JAL_ABOUT),
    ],
    pointRuleNotes: [
      f(
        "JALカードで寄附した場合のショッピングマイル（100円＝2マイル。ショッピングマイル・プレミアム加入時）の案内を掲載。ポータルとしてのマイル付与や2025年10月のルール変更に触れた記載は見つからなかった",
        JAL_ABOUT,
        "JALカードで寄附をした場合、100円＝2マイル",
      ),
    ],
    notes: [],
    unknownReasons: {
      listingCount: "公式ページに掲載自治体数・返礼品数の記載が見つからなかった",
      oneStopOnline: "FAQ・ガイドに郵送の申請書の案内はあるが、オンライン申請の記載が見つからなかった",
      app: "公式ページにアプリの記載が見つからなかった",
    },
  },
  {
    id: "ana",
    name: "ANAのふるさと納税",
    officialUrl: ANA_TOP,
    status: "available",
    operator: f("ANAあきんど株式会社", ANA_TERMS, "ANAあきんど株式会社（以下「当社」といいます。）が運営するふるさと納税支援ポータルサイト「ANAふるさと納税」"),
    listingCount: null,
    paymentMethods: f(
      ["クレジットカード", "ANA Pay", "Amazon Pay", "d払い"],
      ANA_FAQ,
      "クレジットカード、ANA Pay、Amazon Pay、d払いによる決済にて寄付を受け付けております。…Amazon Pay、d払いに関しましては自治体ごとに異なります",
    ),
    oneStopOnline: f(
      { supported: true, services: ["自治体マイページ・マイナポータル", "ふるまど・IAM"] },
      ANA_ONLINE,
    ),
    simulator: f(true, ANA_ABOUT, "マイページでご自身の控除上限額の詳細シミュレーションが可能！"),
    app: null,
    features: [
      f("ANAのマイルをANA Pay残高に交換して寄付に使える", ANA_FAQ, "お持ちのマイルをANA Pay残高に交換し、寄附いただく機能は10月以降もご利用いただけます。"),
      f("ANA航空券＋宿泊セットプランやANAトラベラーズホテルクーポンなどANA限定の返礼品がある", ANA_ABOUT),
      f("ANAマイレージクラブ会員なら入力項目が自動で連携される", ANA_ABOUT),
      f("寄付手続きと情報連携の一部は、業務提携先の株式会社トラストバンクが各自治体の指定納付受託者として関与すると利用規約に記載", ANA_TERMS),
    ],
    pointRuleNotes: [
      f(
        "総務省発表の制度改正に伴い、このサイトを通じた寄附のANAマイル積算サービスは2025年9月30日23:59までの寄附完了分で終了。カード会社のポイントプログラムでのANAマイルへの交換は従来どおり",
        ANA_FAQ,
        "2025年10月1日（水）以降の寄附については、マイルは積算されませんのでご注意ください。",
      ),
    ],
    notes: [
      f(
        "連携している外部提携システムでセキュリティ上の不具合が確認されたとして、2026年10月19日15:00から一部自治体のお礼の品の掲載と寄付受付を一時停止",
        ANA_NOTICE_1019,
        "該当する一部自治体のお礼の品の掲載および寄付の受付を一時的に停止させていただいております。",
      ),
    ],
    unknownReasons: {
      listingCount: "公式ページに掲載自治体数・返礼品数の記載が見つからなかった",
      app: "ANAのふるさと納税専用アプリの記載は見つからなかった（FAQ には ANA Pay アプリへの言及のみ）",
    },
  },
  {
    id: "yahoo",
    name: "Yahoo!ふるさと納税",
    officialUrl: YH_TOP,
    status: "available",
    operator: f("LINEヤフー株式会社", YH_INFO, "会社名（商号） LINEヤフー株式会社 ／ ストア名 Yahoo!ふるさと納税"),
    listingCount: null,
    paymentMethods: f(["クレジットカード", "PayPay残高等", "PayPayクレジット"], YH_PAY),
    oneStopOnline: f(
      { supported: true, services: ["Yahoo!ショッピングアプリ（マイナンバーカードで申請）"] },
      YH_GUIDE,
      "マイナンバーカードとYahoo!ショッピングアプリだけで手続きができます。（対象は「ワンストップ電子申請可」のお礼品）",
    ),
    simulator: f(true, YH_TOP, "限度額シミュレーション"),
    app: f("Yahoo!ショッピングアプリ（ワンストップ電子申請に使える）", YH_GUIDE),
    features: [
      f("寄付手続きがYahoo!ショッピング内で完結すると案内（「かんたん手続き」の商品は外部サイトでの手続きが不要）", YH_GUIDE),
      f("商品券を寄付に使える。指定の決済で買うと増量分がつくキャンペーンを掲載", YH_TOP),
      f("Yahoo!ショッピング内の「さとふる」「ふるなび」「ふるさとチョイス」の店舗とは別のストアで、商品券はこのストアでのみ使える", YH_TOP),
    ],
    pointRuleNotes: [
      f(
        "トップページで「ポイントが付かないふるさと納税でも商品券利用で負担軽減」と案内している",
        YH_TOP,
        "ポイントが付かないふるさと納税でも 商品券利用 で 負担軽減！",
      ),
      f(
        "一方、ガイドページには「通常のお買い物と同じようにポイントが付きます」という記載が残っている（公式ページ間で記載が食い違う）",
        YH_GUIDE,
        "さらに、通常のお買い物と同じようにポイントが付きます。",
      ),
    ],
    notes: [],
    unknownReasons: {
      listingCount: "ストア情報にはカテゴリ別の件数のみで、自治体数・返礼品数の総数の記載はなかった",
    },
  },
];
