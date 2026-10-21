import type { Article } from "@/lib/types";

/**
 * 比較ガイド・悩み別ガイドの登録データ。本文は content/ 以下のMarkdown。
 * 2026-10-19 にAI（Claude）が公的機関・メーカーの情報と照らし合わせて事実確認し、すべて公開している（記録：docs/review/）。
 * 事実・リンク・表記を確認したら reviewedAt・reviewedBy を入れ、verified / published にする。
 */
const AUTHOR = "ツールひろば編集部";

const article = (a: Omit<Article, "author" | "reviewStatus" | "status" | "productIds" | "sources" | "reviewedAt" | "reviewedBy" | "publishedAt"> & Partial<Pick<Article, "productIds" | "sources" | "reviewedAt" | "publishedAt">>): Article => ({
  author: AUTHOR,
  reviewStatus: "verified",
  status: "published",
  reviewedAt: "2026-10-19",
  reviewedBy: "AI（Claude）による事実確認",
  publishedAt: "2026-10-19",
  productIds: [],
  sources: [],
  ...a,
});

export const articles: Article[] = [
  // 比較ガイド・使い方ガイド
  article({ id: "heic-to-jpg", slug: "heic-to-jpg", type: "guide", title: "iPhoneの写真（HEIC）をJPGに変換する方法", description: "WindowsやWebのフォームで開けないHEIC写真を、JPGに変換する方法と、これから撮る写真をJPGにする設定。", bodyFile: "guides/heic-to-jpg.md", toolSlugs: ["image-convert", "image-resize"], goodsCategoryIds: [], sources: [{ title: "Apple サポート「Apple製のデバイスでHEIF／HEVCメディアを扱う」", url: "https://support.apple.com/ja-jp/116944" }] }),
  article({ id: "compress-pdf-for-email", slug: "compress-pdf-for-email", type: "guide", title: "メールで送れないPDFを軽くする方法", description: "容量オーバーのPDFを、圧縮・分割・画像の縮小で小さくする3つの方法。", bodyFile: "guides/compress-pdf-for-email.md", toolSlugs: ["pdf-compress", "pdf-split", "image-compress", "image-to-pdf"], goodsCategoryIds: [], sources: [{ title: "Gmail ヘルプ「Gmail のメールにファイルを添付して送信する」", url: "https://support.google.com/mail/answer/6584?hl=ja" }, { title: "Microsoft Learn「添付ファイルのサイズが最大値を越えています」エラー（Outlook）", url: "https://learn.microsoft.com/ja-jp/troubleshoot/outlook/message-body/attachment-size-exceeds-the-allowable-limit-error" }] }),
  article({ id: "warikan-tips", slug: "warikan-tips", type: "guide", title: "幹事が楽になる割り勘・精算のコツ", description: "集める単位、多めに払う人がいる場合、立て替えが複数人いる旅行の精算まで。", bodyFile: "guides/warikan-tips.md", toolSlugs: ["warikan", "travel-expense-split", "tip", "bingo", "lottery"], goodsCategoryIds: ["travel"] }),
  article({ id: "choose-charger-mobile-battery", slug: "choose-charger-mobile-battery", type: "guide", title: "充電器・モバイルバッテリーの選び方", description: "W数・USB PD・PSEマークから、飛行機の持ち込みルール（Wh・個数・機内での充電禁止）まで、数字の読み方を解説。", bodyFile: "guides/choose-charger-mobile-battery.md", toolSlugs: ["electricity-cost", "data-size"], goodsCategoryIds: ["gadgets"],
    sources: [
      { title: "国土交通省「モバイルバッテリーの機内持込みの新たなルールについて」（2026年4月14日）", url: "https://www.mlit.go.jp/report/press/kouku10_hh_000310.html" },
      { title: "国土交通省「【旅客の皆様へ】モバイルバッテリーの持込みについて」（PDF）", url: "https://www.mlit.go.jp/report/press/content/001995959.pdf" },
      { title: "国土交通省「モバイルバッテリーを収納棚に入れないで！」（2025年7月1日）", url: "https://www.mlit.go.jp/report/press/kouku10_hh_000284.html" },
      { title: "経済産業省「モバイルバッテリーに関するFAQ」", url: "https://www.meti.go.jp/policy/consumer/seian/denan/mlb_faq.html" },
      { title: "Apple サポート「iPhoneを高速充電する」", url: "https://support.apple.com/ja-jp/102574" },
      { title: "JAL「モバイルバッテリーの機内持ち込みについて」", url: "https://www.jal.co.jp/jp/ja/info/2026/other/260330/" },
      { title: "IATA「Passengers travelling with lithium batteries」（PDF・英語）", url: "https://www.iata.org/contentassets/6fea26dd84d24b26a7a1fd5788561d6e/passengers_travelling_with_lithium_batteries.pdf" },
    ] }),
  article({ id: "csv-mojibake", slug: "csv-mojibake", type: "guide", title: "CSVが文字化けする理由と直し方", description: "Shift_JISとUTF-8の違い、Excelで開くときのBOM、古いシステムに渡すときの注意点。", bodyFile: "guides/csv-mojibake.md", toolSlugs: ["csv-encoding", "excel-csv-converter", "csv-delimiter"], goodsCategoryIds: [], sources: [{ title: "Microsoft サポート「Excel で CSV UTF-8 ファイルを正しく開くには」", url: "https://support.microsoft.com/ja-jp/office/8a935af5-3416-4edd-ba7e-3dfd2bc4a032" }, { title: "Unicode.org「cp932 to Unicode table」（Microsoft）", url: "https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP932.TXT" }] }),
  article({ id: "desk-organizing-steps", slug: "desk-organizing-steps", type: "guide", title: "デスクを片付ける3ステップ", description: "使う頻度で分ける、置き場所を決める、配線をまとめる。収納用品を買う前の予算の決め方も。", bodyFile: "guides/desk-organizing-steps.md", toolSlugs: ["task-priority", "budget", "unit-price"], goodsCategoryIds: ["desk"] }),
  article({ reviewedAt: "2026-10-21", publishedAt: "2026-10-21", id: "pack-small-bag", slug: "pack-small-bag", type: "guide", title: "身軽に出かけるときに持っていく小物の選び方", description: "小さいバッグひとつで出かけるときの財布・エコバッグ・水筒・傘・カラビナ・スマホストラップ・耳栓・モバイルバッテリーの選び方と、確認したい数字。", bodyFile: "guides/pack-small-bag.md", toolSlugs: ["unit-converter", "unit-price"], goodsCategoryIds: ["travel"],
    productIds: ["abrasus-small-wallet", "marna-shupatto-compact-bag-s", "thermos-joj-151", "muji-light-folding-umbrella-50cm", "niteize-s-biner-2-stainless", "elecom-p-sthzero", "loop-quiet-2", "anker-nano-power-bank-10000-45w"],
    sources: [
      { title: "SUPER CLASSIC「小さい財布 メンズ abrAsus」", url: "https://superclassic.jp/products/31812710" },
      { title: "マーナ「Shupatto コンパクトバッグ S」", url: "https://marna.jp/shop/g/gS514PU/" },
      { title: "サーモス「真空断熱ポケットマグ／JOJ-151」", url: "https://www.thermos.jp/product/detail/joj-151.html" },
      { title: "サーモス「真空断熱ポケットマグ/JOJ-151･181」", url: "https://www.thermos.jp/product/series/joj-01.html" },
      { title: "無印良品「晴雨兼用 軽量 折りたたみ傘」", url: "https://www.muji.com/jp/ja/store/cmdty/detail/4550723156158" },
      { title: "Nite Ize「S-Biner Stainless Steel Dual Carabiner」（英語）", url: "https://niteize.com/s-biner-stainless-steel-dual-carabiner" },
      { title: "Nite Ize「S-Biner MicroLock Stainless Steel」（英語）", url: "https://niteize.com/s-biner-microlock-stainless-steel" },
      { title: "エレコム「ZEROSHOCK ハンドストラップ P-STHZEROBK」", url: "https://www.elecom.co.jp/products/P-STHZEROBK.html" },
      { title: "Loop「Loop Quiet 2」（英語）", url: "https://www.loopearplugs.com/products/quiet" },
      { title: "Anker Japan「Anker Nano Power Bank (10000mAh, 45W, 巻取り式 USB-Cケーブル)」", url: "https://www.ankerjapan.com/products/a1638" },
      { title: "国土交通省「モバイルバッテリーの機内持込みの新たなルールについて」（2026年4月14日）", url: "https://www.mlit.go.jp/report/press/kouku10_hh_000310.html" },
    ] }),
  // 悩み別
  article({ reviewedAt: "2026-10-20", id: "desk-cable-clutter", slug: "desk-cable-clutter", type: "solution", title: "デスクを片付けたい", description: "物や配線が散らかって作業に集中できないときの解決のヒントと、使えるツール・便利グッズ。", bodyFile: "solutions/desk-cable-clutter.md", toolSlugs: ["task-priority", "budget", "unit-price"], goodsCategoryIds: ["desk"], sources: [{ title: "東京消防庁「コンセントの掃除を心掛けましょう。」", url: "https://www.tfd.metro.tokyo.lg.jp/lfe/kasai/10_kokoroe/chapter06.html" }, { title: "厚生労働省「情報機器作業における労働衛生管理のためのガイドラインについて」の一部改正について（令和3年12月1日）", url: "https://www.mhlw.go.jp/web/t_doc?dataId=00tc6314&dataType=1&pageNo=1" }] }),
  article({ reviewedAt: "2026-10-20", id: "easier-charging", slug: "easier-charging", type: "solution", title: "充電を楽にしたい", description: "充電器やケーブルが多くて面倒なときに、まとめ方と選び方のヒント。", bodyFile: "solutions/easier-charging.md", toolSlugs: ["electricity-cost"], goodsCategoryIds: ["gadgets"], sources: [{ title: "Apple サポート「iPhoneを高速充電する」", url: "https://support.apple.com/ja-jp/102574" }, { title: "Apple サポート「iPhoneのUSB-Cコネクタで充電および接続する」", url: "https://support.apple.com/ja-jp/105099" }, { title: "NITE 製品安全情報マガジン Vol.506「リチウムイオン電池搭載製品の事故」（2026年8月7日）", url: "https://www.nite.go.jp/jiko/chuikanki/mailmagazin/2026fy/vol506_260807.html" }, { title: "全国家庭電気製品公正取引協議会「よくある質問 Q&A」（電力料金の目安単価）", url: "https://www.eftc.or.jp/qa/" }] }),
  article({ reviewedAt: "2026-10-20", id: "photos-too-large", slug: "photos-too-large", type: "solution", title: "写真が重くて送れない・開けない", description: "メールやフォームで容量オーバーになる写真や、開けないHEICの対処法。", bodyFile: "solutions/photos-too-large.md", toolSlugs: ["image-convert", "image-resize", "image-to-pdf", "pdf-compress"], goodsCategoryIds: [], sources: [{ title: "Apple サポート「Apple製のデバイスでHEIF／HEVCメディアを扱う」", url: "https://support.apple.com/ja-jp/116944" }, { title: "Gmail ヘルプ「Gmail のメールにファイルを添付して送信する」", url: "https://support.google.com/mail/answer/6584?hl=ja" }] }),
  article({ reviewedAt: "2026-10-20", id: "reduce-paper", slug: "reduce-paper", type: "solution", title: "紙の書類を減らしたい", description: "書類をスマホで撮ってPDFにまとめ、探しやすく保存する方法。", bodyFile: "solutions/reduce-paper.md", toolSlugs: ["image-to-pdf", "pdf-merge", "bulk-rename", "pdf-editor"], goodsCategoryIds: ["stationery"], sources: [{ title: "Apple サポート「iPhoneやiPadで書類をスキャンする方法」", url: "https://support.apple.com/ja-jp/108963" }, { title: "Google ドライブ ヘルプ「Google ドライブでドキュメントをスキャンする」（Android）", url: "https://support.google.com/drive/answer/3145835?hl=ja&co=GENIE.Platform%3DAndroid" }, { title: "国税庁 タックスアンサー No.1119「医療費控除に関する手続について」", url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1119.htm" }] }),
  article({ reviewedAt: "2026-10-20", id: "split-costs", slug: "split-costs", type: "solution", title: "飲み会・旅行の精算が面倒", description: "割り勘や立て替えの計算を楽にする方法。", bodyFile: "solutions/split-costs.md", toolSlugs: ["warikan", "travel-expense-split", "tip", "lottery", "bingo"], goodsCategoryIds: ["travel"] }),
  article({ reviewedAt: "2026-10-20", id: "mojibake-files", slug: "mojibake-files", type: "solution", title: "CSVやファイルが文字化けする", description: "Excelで開くと文字化けする、システムに取り込めないときの確認ポイント。", bodyFile: "solutions/mojibake-files.md", toolSlugs: ["csv-encoding", "excel-csv-converter", "csv-delimiter", "csv-dedupe"], goodsCategoryIds: [], sources: [{ title: "Microsoft サポート「Excel で CSV UTF-8 ファイルを正しく開くには」", url: "https://support.microsoft.com/ja-jp/office/8a935af5-3416-4edd-ba7e-3dfd2bc4a032" }, { title: "Microsoft サポート「先頭のゼロおよび大きい数値の保持」", url: "https://support.microsoft.com/ja-jp/excel/keeping-leading-zeros-and-large-numbers" }, { title: "Microsoft サポート「自動データ変換を設定する」", url: "https://support.microsoft.com/ja-jp/excel/set-automatic-data-conversions" }, { title: "Unicode.org「cp932 to Unicode table」（Microsoft）", url: "https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP932.TXT" }] }),
  article({ reviewedAt: "2026-10-20", id: "manage-deadlines", slug: "manage-deadlines", type: "solution", title: "締め切りや予定を管理したい", description: "納期の計算や、やることの整理を楽にする方法。", bodyFile: "solutions/manage-deadlines.md", toolSlugs: ["business-days", "countdown", "task-priority", "progress-rate", "days-between"], goodsCategoryIds: ["stationery"], sources: [{ title: "内閣府「国民の祝日について」", url: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" }] }),
  article({ reviewedAt: "2026-10-20", id: "review-monthly-spending", slug: "review-monthly-spending", type: "solution", title: "毎月のお金を見直したい", description: "家計の配分、電気代、日用品の単価を見直すヒント。", bodyFile: "solutions/review-monthly-spending.md", toolSlugs: ["budget", "savings-goal", "electricity-cost", "unit-price", "loan-simulator", "compound-interest"], goodsCategoryIds: ["home"], sources: [{ title: "全国家庭電気製品公正取引協議会「よくある質問 Q&A」（電力料金の目安単価）", url: "https://www.eftc.or.jp/qa/" }] }),
  article({ reviewedAt: "2026-10-20", id: "pack-light", slug: "pack-light", type: "solution", title: "旅行の荷物を減らしたい", description: "衣類・充電器・変換プラグをまとめて、スーツケースを軽くするヒント。", bodyFile: "solutions/pack-light.md", toolSlugs: ["timezone", "tip", "travel-expense-split"], goodsCategoryIds: ["travel", "gadgets"], sources: [{ title: "国土交通省「モバイルバッテリーの機内持込みの新たなルールについて」（2026年4月14日）", url: "https://www.mlit.go.jp/report/press/kouku10_hh_000310.html" }, { title: "国土交通省「【旅客の皆様へ】モバイルバッテリーの持込みについて」（PDF）", url: "https://www.mlit.go.jp/report/press/content/001995959.pdf" }, { title: "国土交通省「モバイルバッテリーを収納棚に入れないで！」（2025年7月1日）", url: "https://www.mlit.go.jp/report/press/kouku10_hh_000284.html" }, { title: "Apple サポート「Apple USB 電源アダプタについて」", url: "https://support.apple.com/ja-jp/120548" }] }),
  article({ reviewedAt: "2026-10-21", id: "furusato-how-much", slug: "furusato-how-much", type: "solution", title: "ふるさと納税をいくらまでしていいか知りたい", description: "自己負担2,000円で収まる上限の決まり方と、住民税の通知書の所得割額から目安を出す手順。", bodyFile: "solutions/furusato-how-much.md", toolSlugs: ["furusato-limit"], goodsCategoryIds: [],
    sources: [
      { title: "総務省 ふるさと納税ポータルサイト「税金の控除について」", url: "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/mechanism/deduction.html" },
      { title: "総務省 ふるさと納税ポータルサイト「よくある質問」", url: "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/faq/" },
      { title: "総務省「ふるさと納税制度の適正な運用について」（令和8年4月1日・地方税法等の一部を改正する法律（抄）を含む）（PDF）", url: "https://www.soumu.go.jp/main_content/001067617.pdf" },
      { title: "国税庁 タックスアンサー No.2260「所得税の税率」（令和8年4月1日現在法令等）", url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm" },
      { title: "横浜市「寄附金税額控除（ふるさと納税）について」（2026年10月13日更新）", url: "https://www.city.yokohama.lg.jp/kurashi/koseki-zei-hoken/zeikin/y-shizei/kojin-shiminzei-kenminzei/kihukin.html" },
    ] }),
  article({ reviewedAt: "2026-10-21", id: "furusato-one-stop", slug: "furusato-one-stop", type: "solution", title: "確定申告なしでふるさと納税の控除を受けたい", description: "ワンストップ特例を使える条件、申請書の出し方と期限、オンライン申請、確定申告が必要になったときの対応。", bodyFile: "solutions/furusato-one-stop.md", toolSlugs: ["furusato-limit"], goodsCategoryIds: [],
    sources: [
      { title: "総務省 ふるさと納税ポータルサイト「ふるさと納税の流れ」", url: "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/mechanism/procedure.html" },
      { title: "総務省 ふるさと納税ポータルサイト「制度改正について（2015年4月1日）」", url: "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/topics/20150401.html" },
      { title: "総務省 ふるさと納税ポータルサイト「よくある質問」", url: "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/faq/" },
      { title: "総務省「寄附金税額控除に係る申告特例申請書」様式（PDF）", url: "https://www.soumu.go.jp/main_content/000397109.pdf" },
      { title: "総務省「ふるさと納税ワンストップ特例の取扱いについて」（PDF）", url: "https://www.soumu.go.jp/main_content/000362730.pdf" },
      { title: "総務省「＜ワンストップ特例を申請する皆様へ＞【ご注意ください】」（PDF）", url: "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/file/20160818.pdf" },
      { title: "デジタル庁「マイナンバーカードを活用した『ふるさと納税ワンストップ特例』のオンライン申請サービスのご紹介」（令和5年12月12日・PDF）", url: "https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/ac595a69-2a4f-48a1-9857-3b0e33c90a9a/0f9c09c5/20231212_policies_mynumber_local-government_reference_01.pdf" },
      { title: "国税庁「ふるさと納税をされた方へ｜令和7年分 確定申告特集」", url: "https://www.nta.go.jp/taxes/shiraberu/shinkoku/tokushu/keisubetsu/furusato.htm" },
      { title: "国税庁 タックスアンサー No.1150「一定の寄附金を支払ったとき（寄附金控除）」（令和8年4月1日現在法令等）", url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1150.htm" },
    ] }),
  article({ reviewedAt: "2026-10-21", id: "furusato-deadline", slug: "furusato-deadline", type: "solution", title: "年末のふるさと納税で失敗したくない", description: "12月31日までの寄附、ワンストップ特例の1月10日必着、ポイント付与の禁止、上限を超えないための確認。", bodyFile: "solutions/furusato-deadline.md", toolSlugs: ["furusato-limit"], goodsCategoryIds: [],
    sources: [
      { title: "総務省 ふるさと納税ポータルサイト「よくある質問」", url: "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/faq/" },
      { title: "総務省 ふるさと納税ポータルサイト「税金の控除について」", url: "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/mechanism/deduction.html" },
      { title: "総務省「ふるさと納税の指定基準の見直し等」（令和6年6月28日）", url: "https://www.soumu.go.jp/menu_news/s-news/01zeimu04_02000126.html" },
      { title: "国税庁 タックスアンサー No.1150「一定の寄附金を支払ったとき（寄附金控除）」（令和8年4月1日現在法令等）", url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1150.htm" },
      { title: "デジタル庁「マイナンバーカードを活用した『ふるさと納税ワンストップ特例』のオンライン申請サービスのご紹介」（令和5年12月12日・PDF）", url: "https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/ac595a69-2a4f-48a1-9857-3b0e33c90a9a/0f9c09c5/20231212_policies_mynumber_local-government_reference_01.pdf" },
      { title: "総務省「＜ワンストップ特例を申請する皆様へ＞【ご注意ください】」（PDF）", url: "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/file/20160818.pdf" },
    ] }),
  article({ reviewedAt: "2026-10-21", publishedAt: "2026-10-21", id: "furusato-tax-notice", slug: "furusato-tax-notice", type: "solution", title: "住民税決定通知書のどこを見ればいいかわからない", description: "ふるさと納税の上限に使う所得割額は通知書のどこにあるか、控除が反映されたかの確かめ方、控除されていないときの対応。", bodyFile: "solutions/furusato-tax-notice.md", toolSlugs: ["furusato-limit"], goodsCategoryIds: [],
    sources: [
      { title: "横浜市「寄附金税額控除（ふるさと納税）について」（2026年10月13日更新）", url: "https://www.city.yokohama.lg.jp/kurashi/koseki-zei-hoken/zeikin/y-shizei/kojin-shiminzei-kenminzei/kihukin.html" },
      { title: "仙台市「ふるさと納税の控除・還付状況の確認の仕方」（2025年10月23日更新）", url: "https://www.city.sendai.jp/zaiseikikaku-somu/shise/zaise/zaimu/zaise/sendaishi/oenkifu/kuwashiku/10.html" },
      { title: "中央区（東京都）「ふるさと納税の税額控除が適用されていないとき」", url: "https://www.city.chuo.lg.jp/a0009/kurashi/zeikin/furusato/furusatonozei_kojo/hurusatozeigakukouzilyotekiyou.html" },
      { title: "総務省 ふるさと納税ポータルサイト「よくある質問」", url: "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/faq/" },
    ] }),
  article({ reviewedAt: "2026-10-21", publishedAt: "2026-10-21", id: "furusato-one-stop-late", slug: "furusato-one-stop-late", type: "solution", title: "ワンストップ特例の申請が1月10日に間に合わない", description: "期限を過ぎたら確定申告で控除を受ける手順。間に合った分も含めて全部申告する理由と、還付申告ができる期間。", bodyFile: "solutions/furusato-one-stop-late.md", toolSlugs: ["furusato-limit"], goodsCategoryIds: [],
    sources: [
      { title: "デジタル庁「マイナンバーカードを活用した『ふるさと納税ワンストップ特例』のオンライン申請サービスのご紹介」（令和5年12月12日・PDF）", url: "https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/ac595a69-2a4f-48a1-9857-3b0e33c90a9a/0f9c09c5/20231212_policies_mynumber_local-government_reference_01.pdf" },
      { title: "港区（東京都）「ふるさと納税ワンストップ特例制度のご案内」（PDF）", url: "https://www.city.minato.tokyo.jp/documents/81793/20260227105020.pdf" },
      { title: "総務省「＜ワンストップ特例を申請する皆様へ＞【ご注意ください】」（PDF）", url: "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/file/20160818.pdf" },
      { title: "総務省「ふるさと納税ワンストップ特例の取扱いについて」（PDF）", url: "https://www.soumu.go.jp/main_content/000362730.pdf" },
      { title: "総務省 ふるさと納税ポータルサイト「よくある質問」", url: "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/faq/" },
      { title: "国税庁「ふるさと納税をされた方へ｜令和7年分 確定申告特集」", url: "https://www.nta.go.jp/taxes/shiraberu/shinkoku/tokushu/keisubetsu/furusato.htm" },
      { title: "国税庁 タックスアンサー No.1150「一定の寄附金を支払ったとき（寄附金控除）」（令和8年4月1日現在法令等）", url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1150.htm" },
      { title: "国税庁 タックスアンサー No.2030「還付申告」（令和8年4月1日現在法令等）", url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2030.htm" },
      { title: "中央区（東京都）「ふるさと納税の税額控除が適用されていないとき」", url: "https://www.city.chuo.lg.jp/a0009/kurashi/zeikin/furusato/furusatonozei_kojo/hurusatozeigakukouzilyotekiyou.html" },
    ] }),
  article({ reviewedAt: "2026-10-21", publishedAt: "2026-10-21", id: "furusato-income-change", slug: "furusato-income-change", type: "solution", title: "年の途中で収入が変わる年のふるさと納税", description: "転職・退職・副業などで収入が変わる年の上限の考え方と、確定申告が必要になってワンストップ特例が使えなくなる場合。", bodyFile: "solutions/furusato-income-change.md", toolSlugs: ["furusato-limit"], goodsCategoryIds: [],
    sources: [
      { title: "総務省 ふるさと納税ポータルサイト「よくある質問」", url: "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/faq/" },
      { title: "横浜市「寄附金税額控除（ふるさと納税）について」（2026年10月13日更新）", url: "https://www.city.yokohama.lg.jp/kurashi/koseki-zei-hoken/zeikin/y-shizei/kojin-shiminzei-kenminzei/kihukin.html" },
      { title: "国税庁 タックスアンサー No.1910「中途退職で年末調整を受けていないとき」（令和8年4月1日現在法令等）", url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1910.htm" },
      { title: "国税庁 タックスアンサー No.2665「年末調整の対象となる人」（令和8年4月1日現在法令等）", url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/gensen/2665.htm" },
      { title: "国税庁 タックスアンサー No.1900「給与所得者で確定申告が必要な人」（令和8年4月1日現在法令等）", url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1900.htm" },
      { title: "総務省「＜ワンストップ特例を申請する皆様へ＞【ご注意ください】」（PDF）", url: "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/file/20160818.pdf" },
      { title: "仙台市「ふるさと納税の控除・還付状況の確認の仕方」（2025年10月23日更新）", url: "https://www.city.sendai.jp/zaiseikikaku-somu/shise/zaise/zaimu/zaise/sendaishi/oenkifu/kuwashiku/10.html" },
      { title: "国税庁 タックスアンサー No.1150「一定の寄附金を支払ったとき（寄附金控除）」（令和8年4月1日現在法令等）", url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1150.htm" },
      { title: "国税庁 タックスアンサー No.2030「還付申告」（令和8年4月1日現在法令等）", url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2030.htm" },
    ] }),
];
