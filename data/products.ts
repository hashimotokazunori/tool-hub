import type { Product } from "@/lib/types";

/**
 * 商品データ。1商品につき1件。複数の記事から productIds で参照する。
 *
 * 登録のルール（docs/DESIGN.md「公開できる条件」も参照）
 * - 実在を確認した商品だけを登録する。仕様は sourceUrls に出典を残す。
 * - price を入れるときは priceCheckedAt（確認日時）も入れる。
 * - affiliateUrl は、実際に提携登録した販売先のURLだけを入れる。
 * - imageUrl は使用条件を確認した画像だけ。条件は imageLicenseNote に書く。
 * - 下書きは reviewStatus: "pending"。公式ページで事実確認したら reviewedAt・reviewedBy を入れて "verified"。
 *
 * 2026-10-19 にメーカー公式ページで仕様・販売状況を確認し、公開している（確認：AI（Claude））。
 * 調査の記録は docs/review/product-candidates.md と docs/review/final-check.md にある。
 */
export const products: Product[] = [
  {
    "id": "sanwa-pda-stn34s",
    "slug": "sanwa-pda-stn34s",
    "name": "ノートパソコン用アルミスタンド（平置きタイプ）PDA-STN34S",
    "brand": "サンワサプライ",
    "categoryId": "desk",
    "summary": "角度を無段階で調整できる、折りたたみ式のアルミ製ノートPCスタンド。",
    "features": [
      "角度を無段階で調整できる",
      "折りたたみ式の薄型設計（折りたたみ時の高さ約33mm）",
      "放熱しやすいアルミ製で、機器が触れる部分はシリコーンゴム"
    ],
    "pros": [
      "アルミ製で放熱しやすく、滑り止めのシリコーンゴムでキー入力時のぐらつきを抑える設計",
      "折りたためるので、使わないときに片付けやすい",
      "ノートPCだけでなく、タブレットや液晶ペンタブレットにも使えると案内されている"
    ],
    "cons": [
      "重さは570g（持ち歩く場合は重さを確認）",
      "公式ページに耐荷重・角度の範囲・使用時の高さの数値が載っていない",
      "ノートPCの背面形状や排気口の位置によっては使えない場合があると公式に注記されている"
    ],
    "specifications": {
      "型番": "PDA-STN34S",
      "サイズ": "W244×D247×H33mm（折りたたんだ状態）",
      "重量": "570g",
      "材質": "アルミ、シリコーンゴム",
      "角度調整": "無段階"
    },
    "price": 6600,
    "currency": "JPY",
    "priceCheckedAt": "2026-10-19",
    "officialUrl": "https://www.sanwa.co.jp/product/syohin?code=PDA-STN34S",
    "market": {"keyword": "PDA-STN34S", "match": [["PDA-STN34S"]]},
    "sourceUrls": [
      "https://www.sanwa.co.jp/product/syohin?code=PDA-STN34S"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-19",
    "reviewedAt": "2026-10-19",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "sanwa-direct-200-ct010bk",
    "slug": "sanwa-direct-200-ct010bk",
    "name": "ケーブルトレー 幅42cm クランプ固定 ワイヤータイプ 200-CT010BK",
    "brand": "サンワダイレクト",
    "categoryId": "desk",
    "summary": "デスクの天板にクランプで後付けし、電源タップやケーブルを机の下にまとめるトレー。",
    "features": [
      "クランプ固定で、天板に穴を開けずに後付けできる",
      "対応する天板の厚さは0.5〜4.5cm",
      "スチール製のワイヤータイプ（ホコリが溜まりにくいと案内されている）"
    ],
    "pros": [
      "ネジ止め不要のクランプ式なので、穴を開けたくない机でも取り付けやすい",
      "クランプ部を起こして取り付ける方式と案内されている",
      "幅42cmで、天板の奥行や幅が小さめのデスクでも取り付けを検討しやすい"
    ],
    "cons": [
      "耐荷重は2kgまでで、大きな電源タップやACアダプターを多く載せると足りない場合がある",
      "幅約42cmなので、ケーブルが多い広いデスクでは長さが足りないことがある",
      "天板の厚さが0.5〜4.5cmの範囲外だと取り付けられない"
    ],
    "specifications": {
      "型番": "200-CT010BK（ブラック）",
      "サイズ": "約W42×D11.8×H18.2cm",
      "重量": "約710g",
      "材質": "スチール",
      "総耐荷重": "2kg",
      "対応天板厚": "0.5〜4.5cm",
      "取付方法": "クランプ固定",
      "出荷形態": "ノックダウン組立式（お客様組立）※商品説明には「組み立て不要」との記載もあり"
    },
    "currency": "JPY",
    "officialUrl": "https://direct.sanwa.co.jp/ItemPage/200-CT010BK",
    "market": {"keyword": "200-CT010", "match": [["200-CT010"]]},
    "sourceUrls": [
      "https://direct.sanwa.co.jp/ItemPage/200-CT010BK"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-19",
    "reviewedAt": "2026-10-19",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "anker-powerport-iii-3-port-65w-pod",
    "slug": "anker-powerport-iii-3-port-65w-pod",
    "name": "Anker PowerPort III 3-Port 65W Pod with USB-C & USB-C ケーブル",
    "brand": "Anker",
    "categoryId": "gadgets",
    "summary": "USB-C×2・USB-A×1の3ポートで、合計最大65W。ノートPCとスマホをまとめて充電できるGaN充電器。",
    "features": [
      "USB-C 1ポートだけ使うと最大65W（USB PD）",
      "USB-C×2・USB-A×1の3ポートで3台を同時に充電できる",
      "Anker GaN II採用の小型設計で、プラグは折りたたみ式"
    ],
    "pros": [
      "単ポートで最大65W出せるので、65W以下のノートPCも充電できる",
      "約66×38×29mm・約130g",
      "プラグを折りたためるので、カバンの中で引っかかりにくい"
    ],
    "cons": [
      "3ポート同時に使うと40W＋12W＋12Wに分かれ、2台目以降は出力が低くなる",
      "下側のUSB-CとUSB-Aを組み合わせると12W＋12W（合計24W）になる"
    ],
    "specifications": {
      "型番": "B2667N12（ブラック）/ B2667N22（ホワイト）",
      "サイズ": "約66×38×29mm",
      "重さ": "約130g",
      "合計最大出力": "65W",
      "ポート": "USB-C×2、USB-A×1",
      "USB-C出力（単ポート）": "5.0V=3.0A / 9.0V=3.0A / 15.0V=3.0A / 20.0V=3.25A（最大65W）",
      "USB-A出力（単ポート）": "最大22.5W",
      "同時使用時の出力": "USB-C 2ポート：45W＋20W／USB-C（上）＋USB-A：40W＋22.5W／USB-C（下）＋USB-A：12W＋12W／3ポート：40W＋12W＋12W",
      "技術": "Anker GaN II",
      "プラグ": "折りたたみ式",
      "付属品": "USB-C & USB-C ケーブル（0.9m）"
    },
    "price": 6990,
    "currency": "JPY",
    "priceCheckedAt": "2026-10-19",
    "officialUrl": "https://www.ankerjapan.com/products/b2667",
    "market": {"keyword": "Anker PowerPort III 3-Port 65W Pod", "match": [["B2667"], ["A2667"], ["PowerPort III", "3-Port", "65W", "Pod"]]},
    "sourceUrls": [
      "https://www.ankerjapan.com/products/b2667"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-19",
    "reviewedAt": "2026-10-19",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "anker-nano-power-bank-10000-45w",
    "slug": "anker-nano-power-bank-10000-45w",
    "name": "Anker Nano Power Bank (10000mAh, 45W, 巻取り式 USB-Cケーブル)",
    "brand": "Anker",
    "categoryId": "gadgets",
    "summary": "巻取り式USB-Cケーブルを内蔵した10,000mAhのモバイルバッテリー。ケーブル出力は最大45W。",
    "features": [
      "巻取り式USB-Cケーブル内蔵（約7cm〜約70cmの8段階で長さを調整）",
      "USB-Cケーブルで最大45W出力",
      "パススルー充電・残量ディスプレイに対応"
    ],
    "pros": [
      "ケーブルを内蔵しているので、別にケーブルを持ち歩かなくてよい",
      "1ポート使用時はケーブル出力が最大45Wで、取扱説明書ではタブレットやノートPCの充電にも対応と案内されている",
      "本体への入力は最大30W（USB-Cケーブル／USB-Cポート）"
    ],
    "cons": [
      "重さは約230g、サイズは約82×51×36mm（厚さ約36mm）",
      "合計最大出力は24Wで、2ポート同時は15W＋7.5W、3ポート同時は各7.5Wに下がる（取扱説明書）"
    ],
    "specifications": {
      "型番": "A1638N11（ブラック）/ A1638N21（ホワイト）/ A1638N61（ミントブルー）/ A1638N51（ピンク）/ A1638N31（ブルー）",
      "容量": "10000mAh",
      "サイズ": "約82×51×36mm",
      "重さ": "約230g",
      "入力（USB-C）": "5V=3A / 9V=3A / 12V=2.5A / 15V=2A（最大30W）",
      "出力（USB-Cケーブル/ポート）": "5V=3A / 9V=3A / 10V=2.25A / 15V=3A / 20V=2.25A（最大45W）",
      "出力（USB-A）": "最大22.5W",
      "合計最大出力": "24W（公式ページの表記）",
      "内蔵ケーブル": "巻取り式USB-C（約7cm〜約70cm、8段階）",
      "その他": "パススルー充電、ディスプレイ、ActiveShield 3.0",
      "発売": "2025年9月",
      "同時使用時の出力": "2ポート：15W＋7.5W／3ポート：7.5W＋7.5W＋7.5W（取扱説明書）"
    },
    "price": 7990,
    "currency": "JPY",
    "priceCheckedAt": "2026-10-19",
    "officialUrl": "https://www.ankerjapan.com/products/a1638",
    "market": {"keyword": "Anker Nano Power Bank 10000mAh 45W", "match": [["A1638"], ["Nano Power Bank", "10000", "45W"]]},
    "sourceUrls": [
      "https://www.ankerjapan.com/products/a1638",
      "https://lp.ankerjapan.com/hubfs/aoos/manual/A1638Manual.pdf"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-19",
    "reviewedAt": "2026-10-19",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "tenma-fitscase-53-39m",
    "slug": "tenma-fitscase-53-39m",
    "name": "フィッツケース 53（ホワイトクリア）53-39M",
    "brand": "天馬",
    "categoryId": "home",
    "summary": "奥行53cmのクローゼット・押入れ向け引き出し式収納ケース。幅・高さ違いで全9サイズ。",
    "features": [
      "前枠付きで、積み重ねてもたわみにくい",
      "引き出したときの前倒れを防止（53-39・53-44シリーズ）",
      "別売りキャスター「CSP-40」に対応"
    ],
    "pros": [
      "幅3種類×高さ3種類の全9サイズがあり、収納場所の寸法に合わせて選びやすい",
      "リニューアル前のフィッツケースとも積み重ねて使えると案内されている",
      "日本製で、引出しストッパー付き"
    ],
    "cons": [
      "奥行が53cmあるので、奥行の浅いクローゼットや棚には入らない場合がある",
      "外寸と有効内寸の差が大きい（53-39Mは外寸W39×D53×H23cmに対し、内寸W33.7×D48.4×H18cm）",
      "引き出しの飛び出しを防ぐ「引出しロック」は53-44シリーズのみで、53-39Mには付いていない",
      "再生材を使っているため、斑点や色むらが出る場合があると公式に注記されている"
    ],
    "specifications": {
      "品番": "53-39M",
      "最大外寸（約）": "幅39×奥行53×高さ23cm",
      "有効内寸（約）": "幅33.7×奥行48.4×高さ18cm",
      "材質": "引出・外枠・天板：ポリプロピレン、前枠：スチロール樹脂",
      "サイズ展開": "53-30S/30M/30L、53-39S/39M/39L、53-44S/44M/44L（全9サイズ）",
      "生産国": "日本",
      "対応キャスター": "CSP-40（別売）"
    },
    "price": 5480,
    "currency": "JPY",
    "priceCheckedAt": "2026-10-19",
    "officialUrl": "https://tenmafitsworld.com/SHOP/fitscase-53.html",
    "market": {"keyword": "フィッツケース 53 天馬", "match": [["53-39M"], ["フィッツケース", "53"]], "exclude": ["フィッツケースクローゼット", "ロング", "ワイド", "カプチーナ"]},
    "sourceUrls": [
      "https://tenmafitsworld.com/SHOP/fitscase-53.html"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-19",
    "reviewedAt": "2026-10-19",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "hario-kst-60-tw",
    "slug": "hario-kst-60-tw",
    "name": "耐熱ガラス製保存容器・角 600mL",
    "brand": "HARIO",
    "categoryId": "home",
    "summary": "フタをしたまま電子レンジで温められる、日本製の角型耐熱ガラス保存容器。",
    "features": [
      "本体は耐熱ガラス、フタはポリプロピレン",
      "電子レンジ・食洗機（本体・フタ）、オーブン（本体のみ）に対応",
      "半透明のフタで、上から中身が見える"
    ],
    "pros": [
      "本体は耐熱ガラスで、オーブンにも使える（フタは不可）",
      "フタも食洗機・電子レンジに対応している（公式FAQ）",
      "フタだけを公式で単品購入できるので、フタが傷んでも買い替えやすい",
      "250mL・600mL・900mL・1400mLのサイズ展開がある"
    ],
    "cons": [
      "ガラス製のため、600mLで約400g（個箱含む）と樹脂製の容器より重い",
      "割れる可能性があり、急な温度変化（耐熱温度差120℃を超える変化）にも注意が必要",
      "液体の冷凍や、満杯の状態での冷凍は避けるよう公式FAQで案内されている"
    ],
    "specifications": {
      "品番": "KST-60-TW（ページ内にKST-25-TW／KST-60-TW／KSTL-90-TW／KSTL-140-TWを掲載）",
      "満水容量": "600mL",
      "サイズ": "幅143×奥行139×高さ62mm",
      "重量（個箱含む）": "400g",
      "材質": "本体：耐熱ガラス、フタ：ポリプロピレン",
      "耐熱温度差（本体）": "120℃（公式FAQ）",
      "対応": "電子レンジ・食洗機（本体・フタ）、オーブン（本体のみ）",
      "原産国": "日本"
    },
    "currency": "JPY",
    "officialUrl": "https://shop.hariocorp.co.jp/products/kst-25-tw",
    "market": {"keyword": "HARIO KST-60-TW", "match": [["KST-60-TW"]]},
    "sourceUrls": [
      "https://shop.hariocorp.co.jp/products/kst-25-tw",
      "https://shop.hariocorp.co.jp/products/3kst-2012-ow"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-19",
    "price": 1320,
    "priceCheckedAt": "2026-10-19",
    "reviewedAt": "2026-10-19",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "milesto-mls905",
    "slug": "milesto-mls905",
    "name": "MILESTO UTILITY 圧縮パッキングオーガナイザーダブルポケット 4L×2",
    "brand": "MILESTO",
    "categoryId": "travel",
    "summary": "2つのポケットで中身を分けて入れられる、圧縮機能付きのパッキングオーガナイザー。",
    "features": [
      "4L×2の2ポケット構造",
      "圧縮機能付き",
      "6色（ネイビー・グレージュ・ブラック・ブルーグレー・テラコッタ・グリーン）。2026-10-19時点でテラコッタとグリーンは公式ストアで在庫切れ"
    ],
    "pros": [
      "ポケットが2つあり、中身を分けて入れられる",
      "圧縮機能付きで、すっきり収納できると案内されている"
    ],
    "cons": [
      "容量は4L×2で、長期旅行や冬服には足りない場合がある（上位の8L×2もある）",
      "公式ストアの商品ページに、サイズ・重さ・素材・圧縮方式の記載が見当たらない"
    ],
    "specifications": {
      "品番": "MLS905",
      "容量": "4L×2"
    },
    "price": 2530,
    "currency": "JPY",
    "priceCheckedAt": "2026-10-19",
    "officialUrl": "https://bruno-onlineshop.com/item/07643104.html",
    "market": {"keyword": "MILESTO MLS905", "match": [["MLS905"]]},
    "sourceUrls": [
      "https://bruno-onlineshop.com/item/07643104.html"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-19",
    "reviewedAt": "2026-10-19",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "kashimura-wp-113m",
    "slug": "kashimura-wp-113m",
    "name": "海外用マルチ変換プラグ USBA+C PD20W WP-113M",
    "brand": "カシムラ",
    "categoryId": "travel",
    "summary": "A/C/O/BFタイプのコンセントに対応し、USB-C（PD20W）とUSB-Aも使える海外用変換プラグ。",
    "features": [
      "A・C・O・BFの4種類のコンセント形状に対応",
      "USB-C（PD20W）とUSB-A（QC20W）を搭載",
      "Aタイプのプラグを2口差し込める"
    ],
    "pros": [
      "変換プラグとUSB充電器が1台にまとまる",
      "本体は約38.5×46.5×65mm・77g",
      "USB-CはPD20Wに対応（PD対応の機器とケーブルが必要）"
    ],
    "cons": [
      "USB-CとUSB-Aを同時に使うと合計15W（5V 3A）に下がる",
      "電圧は変換しないため、海外の電圧に対応していない家電には別売の変圧器が必要",
      "海外での使用を前提とした「例外承認対象品」で、日本国内では使用できない",
      "USBケーブルは付属しない"
    ],
    "specifications": {
      "型番": "WP-113M",
      "対応コンセント形状（海外）": "A/C/O/BFタイプ",
      "差し込めるプラグ": "Aタイプ×2口",
      "入力電圧": "100-240V 50/60Hz",
      "ACコンセント定格": "10A 250V（2口合計）",
      "USB Type-C": "PD20W（5V 3A, 9V 2.22A, 12V 1.67A）",
      "USB Type-A": "QC20W（5V 3A, 9V 2.22A, 12V 1.67A）",
      "USB 2ポート同時使用時": "合計最大15W（5V 3A）",
      "本体サイズ": "38.5W×46.5H×65Dmm",
      "本体重量": "77g",
      "使用温度範囲": "0〜40℃",
      "保証期間": "6ヶ月"
    },
    "currency": "JPY",
    "officialUrl": "https://www.kashimura.com/product/wp113m",
    "market": {"keyword": "カシムラ WP-113M", "match": [["WP-113M"]]},
    "sourceUrls": [
      "https://www.kashimura.com/product/wp113m"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-19",
    "reviewedAt": "2026-10-19",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "kingjim-tepra-pro-sr-r2500p",
    "slug": "kingjim-tepra-pro-sr-r2500p",
    "name": "ラベルプリンター「テプラ」PRO SR-R2500P",
    "brand": "キングジム",
    "categoryId": "stationery",
    "summary": "スマホのアプリでラベルを作り、Bluetoothで印刷するテプラ。電池で動く。",
    "features": [
      "スマホ専用（iOS／Android）。アプリ「Hello」「TEPRA LINK 2」で作成",
      "4〜18mm幅の「テプラ」PROテープに対応",
      "単3形電池6本で動作し、オートカッター付き"
    ],
    "pros": [
      "スマホのアプリ（「Hello」「TEPRA LINK 2」）で文字やデザインを作れる",
      "電池駆動なので、コンセントのない場所でも使える",
      "4・6・9・12・18mmの5種類のテープ幅に対応している"
    ],
    "cons": [
      "スマホ専用で、本体だけではラベルを作れない（スマホとアプリが必須）",
      "電池（単3形6本）は別売り",
      "対応テープ幅は最大18mm（最大印刷幅13.5mm）で、24mm幅以上のテープは使えない"
    ],
    "specifications": {
      "型番": "SR-R2500P",
      "対応テープ幅": "4〜18mm（PROテープカートリッジ 4・6・9・12・18mm）",
      "最大印刷可能幅": "13.5mm（18mm幅テープ使用時）",
      "ヘッド構成": "180dpi・96dot",
      "印刷方式": "熱転写PRO印刷方式",
      "外形寸法": "約54（W）×134（D）×145（H）mm",
      "質量": "約420g（電池、テープ除く）",
      "電源": "単3形アルカリ乾電池×6本（別売）、単3形ニッケル水素電池×6本（別売）",
      "接続": "Bluetooth",
      "対応OS・アプリ": "iOS、Android／「Hello」「TEPRA LINK 2」",
      "カッター": "オートカッター"
    },
    "currency": "JPY",
    "officialUrl": "https://www.kingjim.co.jp/products/tepra/sr-r2500p.html",
    "market": {"keyword": "テプラ SR-R2500P", "match": [["SR-R2500P"]], "exclude": ["テープカートリッジ", "互換", "SR-R2500P対応", "SR-R2500P 対応", "用テープ", "専用テープ", "ケースのみ", "カバー"]},
    "sourceUrls": [
      "https://www.kingjim.co.jp/products/tepra/sr-r2500p.html"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-19",
    "reviewedAt": "2026-10-19",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "kingjim-document-file-2274",
    "slug": "kingjim-document-file-2274",
    "name": "ドキュメントファイル（エコノミータイプ）2274",
    "brand": "キングジム",
    "categoryId": "stationery",
    "summary": "13ポケットに書類を分けて入れられる、A4サイズのドキュメントファイル。",
    "features": [
      "A4サイズ・13ポケット",
      "差し替え見出しシート付き",
      "PP表紙"
    ],
    "pros": [
      "13ポケットあるので、書類を種類ごとに分けて保管できる",
      "見出しシートを差し替えられる",
      "背幅33mm（外寸法 幅240×高さ330mm）"
    ],
    "cons": [
      "適正収納枚数は260枚（1ポケット20枚が目安）",
      "色は青・黒の2色",
      "A4サイズ用のため、B4など大きい書類は折って入れる必要がある"
    ],
    "specifications": {
      "品番": "2274（青）、2274（黒）",
      "サイズ": "A4",
      "外寸法": "幅240×背幅33×高さ330mm",
      "表紙": "PP表紙",
      "ポケット数": "13",
      "適正収納枚数": "260枚（1ポケットに20枚収納した場合）"
    },
    "currency": "JPY",
    "officialUrl": "https://www.kingjim.co.jp/products/detail/2274.html",
    "market": {"keyword": "キングジム ドキュメントファイル 2274", "match": [["2274", "ドキュメントファイル"]]},
    "sourceUrls": [
      "https://www.kingjim.co.jp/products/detail/2274.html"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-19",
    "reviewedAt": "2026-10-19",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  }
];
