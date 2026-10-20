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
 * 2026-10-19・2026-10-20 にメーカー公式ページで仕様・販売状況を確認し、公開している（確認：AI（Claude））。
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
    "market": {
      "keyword": "PDA-STN34S",
      "match": [
        [
          "PDA-STN34S"
        ]
      ]
    },
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
    "market": {
      "keyword": "200-CT010",
      "match": [
        [
          "200-CT010"
        ]
      ]
    },
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
    "id": "sanwa-mr-lc202bkn",
    "slug": "sanwa-mr-lc202bkn",
    "name": "電源タップ＋USBポート付き机上ラック（W600×D200 ブラック）MR-LC202BKN",
    "brand": "サンワサプライ",
    "categoryId": "desk",
    "summary": "モニターを目の高さに近づけ、下にキーボードをしまえる、電源コンセントとUSBポート付きのスチール製モニター台。",
    "features": [
      "前面左に電源コンセント2口、右にUSB 2.0ポート3つを備える",
      "天板の下にフルサイズのキーボードが入る（内寸幅568mm）",
      "奥行200mmのスリム設計で、奥行の狭いデスクにも置ける"
    ],
    "pros": [
      "手元で電源とUSB機器をつなげるので、PC本体や壁のコンセントまで手を伸ばさずに済む",
      "組立出荷なので、届いてすぐ使える",
      "スチール製（エポキシ粉体塗装）で、天板の耐荷重は7kg（均等荷重）"
    ],
    "cons": [
      "耐荷重は7kgまでなので、重いモニターや複数台を載せる場合は重さを確認する必要がある",
      "USBハブはバスパワーで全ポート合計400mAのため、電力を多く使う機器には向かない",
      "パソコンや機器によってはUSBハブが動作しない場合があると公式に注記されている",
      "幅600mm・高さ80mmで、高さの調整はできない"
    ],
    "specifications": {
      "型番": "MR-LC202BKN（ブラック）/ MR-LC202WN（ホワイト）",
      "サイズ": "W600×D200×H80mm（天板厚22mm）",
      "重量": "1.8kg",
      "材質": "スチール（エポキシ粉体塗装）",
      "耐荷重": "7kg（天板・均等荷重）",
      "電源": "2Pプラグ・2個口、ケーブル長1.8m、定格15A 125V（合計1500Wまで）",
      "USBハブ": "USB 2.0、ダウンストリームUSB Aメス×3、アップストリームケーブル1.5m、バスパワー（全ポート合計400mA）",
      "キーボード収納部内寸": "幅568mm",
      "出荷形態": "組立出荷"
    },
    "currency": "JPY",
    "officialUrl": "https://www.sanwa.co.jp/product/syohin?code=MR-LC202BKN",
    "market": {
      "keyword": "サンワサプライ MR-LC202",
      "match": [
        [
          "MR-LC202BKN"
        ],
        [
          "MR-LC202WN"
        ]
      ]
    },
    "sourceUrls": [
      "https://www.sanwa.co.jp/product/syohin?code=MR-LC202BKN"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-20",
    "reviewedAt": "2026-10-20",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "sanwa-cb-boxp3bkn2",
    "slug": "sanwa-cb-boxp3bkn2",
    "name": "ケーブル＆タップ収納ボックス（Lサイズ・ブラック）CB-BOXP3BKN2",
    "brand": "サンワサプライ",
    "categoryId": "desk",
    "summary": "床やデスクに置いた電源タップとケーブルをまとめて隠す、樹脂製の収納ボックス。",
    "features": [
      "上面と側面にケーブルの出し入れ口がある",
      "上部はラバー塗装で、スマートフォンなどを置いても傷つきにくい",
      "難燃性のABS樹脂（UL94 V-0）で、熱がこもりにくい構造と案内されている"
    ],
    "pros": [
      "電源タップとケーブルを箱にまとめて入れられ、上面・側面の口からケーブルを出せる",
      "底面にゴム足が付いていて滑りにくい",
      "S・M・Lの3サイズと白・黒があり、タップの大きさに合わせて選べる"
    ],
    "cons": [
      "公式ページに内寸と、入る電源タップの大きさが載っていない",
      "外寸W400×D160×H132mmで、置き場所に高さ・奥行の余裕が必要",
      "ケーブルを小さく束ねると発熱して危険だと公式に注意書きがある"
    ],
    "specifications": {
      "型番": "CB-BOXP3BKN2（Lサイズ・ブラック）",
      "サイズ": "W400×D160×H132mm",
      "重量": "969g",
      "材質": "ABS樹脂（UL94 V-0）",
      "ケーブル口": "上面・側面",
      "その他": "上部ラバー塗装、底面ゴム足、積み重ね可"
    },
    "currency": "JPY",
    "officialUrl": "https://www.sanwa.co.jp/product/syohin?code=CB-BOXP3BKN2",
    "market": {
      "keyword": "サンワサプライ CB-BOXP3BKN2",
      "match": [
        [
          "CB-BOXP3BKN2"
        ]
      ]
    },
    "sourceUrls": [
      "https://www.sanwa.co.jp/product/syohin?code=CB-BOXP3BKN2"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-20",
    "reviewedAt": "2026-10-20",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "sanwa-mr-fr3n",
    "slug": "sanwa-mr-fr3n",
    "name": "エルゴノミクスフットレスト（足置き台）MR-FR3N",
    "brand": "サンワサプライ",
    "categoryId": "desk",
    "summary": "デスクワーク中に足を乗せて姿勢を保ちやすくする、角度と高さを調整できるフットレスト。",
    "features": [
      "角度は水平〜±50°の無段階調整で、足の力だけで変えられる",
      "高さは115mm・140mmの2段階",
      "足をそろえて乗せられる大きめの天板（W475×D305mm）"
    ],
    "pros": [
      "椅子が高く床に足が届きにくい場合でも、高さを調整して足を置ける",
      "手を使わずに足で角度を変えられる",
      "約1.4kg（1.369kg）で、机の下で動かしやすい重さ"
    ],
    "cons": [
      "公式ページに耐荷重が載っていない",
      "仕様欄はお客様組み立て（ノックダウン組立式）だが、特長欄には「組み立て済み」とあり、記載が食い違っている",
      "材質はABS樹脂で、足裏のクッション性については公式に記載がない"
    ],
    "specifications": {
      "型番": "MR-FR3N（ブラック）",
      "サイズ": "W475×D305×H144mm",
      "高さ（水平時）": "約115・140mm",
      "角度調整": "水平〜±50°（無段階）",
      "重量": "1.369kg",
      "材質": "ABS樹脂",
      "出荷形態": "ノックダウン組立式（お客様組み立て）"
    },
    "currency": "JPY",
    "officialUrl": "https://www.sanwa.co.jp/product/syohin?code=MR-FR3N",
    "market": {
      "keyword": "サンワサプライ MR-FR3N",
      "match": [
        [
          "MR-FR3N"
        ]
      ]
    },
    "sourceUrls": [
      "https://www.sanwa.co.jp/product/syohin?code=MR-FR3N"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-20",
    "reviewedAt": "2026-10-20",
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
    "market": {
      "keyword": "Anker PowerPort III 3-Port 65W Pod",
      "match": [
        [
          "B2667"
        ],
        [
          "A2667"
        ],
        [
          "PowerPort III",
          "3-Port",
          "65W",
          "Pod"
        ]
      ]
    },
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
    "market": {
      "keyword": "Anker Nano Power Bank 10000mAh 45W",
      "match": [
        [
          "A1638"
        ],
        [
          "Nano Power Bank",
          "10000",
          "45W"
        ]
      ],
      "exclude": [
        "For Anker",
        "for Anker",
        "FOR Anker",
        "ケース",
        "カバー",
        "保護"
      ],
      "minPrice": 3000
    },
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
    "id": "sanwa-usb-3h421bk",
    "slug": "sanwa-usb-3h421bk",
    "name": "USB3.1 Gen1+USB2.0コンボハブ USB-3H421BK",
    "brand": "サンワサプライ",
    "categoryId": "gadgets",
    "summary": "USB 5Gbps×1ポートとUSB2.0×3ポートを備えた、パソコンのUSB-Aポートにつなぐバスパワー式の4ポートUSBハブ。",
    "features": [
      "USB 5Gbps（USB3.2 Gen1）×1ポート、USB2.0×3ポートの計4ポート",
      "AC電源不要のバスパワータイプで、ケーブル一体型（約10cm）",
      "約W95×D26.5×H15.5mm・約32gの小型設計"
    ],
    "pros": [
      "USB2.0ポートに機器をつないでいても、USB 5GbpsポートはSuperSpeed（5Gbps）で動作できると案内されている",
      "ワイヤレスマウスのレシーバーなど、高速通信が要らない機器をUSB2.0ポートにまとめられる",
      "約32gと軽く、ACアダプターも不要なのでノートPCと一緒に持ち歩きやすい"
    ],
    "cons": [
      "5Gbpsで使えるのは1ポートだけで、残り3ポートはUSB2.0",
      "バスパワー専用で、接続機器の消費電流は4ポート合計820mA以内（USB2.0ポート接続時は400mA以内）に限られる",
      "パソコン側の接続端子はUSB Aで、USB-Cポートしかないパソコンにはそのままではつなげない",
      "ケーブルは約10cmの一体型で、長さは変えられない"
    ],
    "specifications": {
      "型番": "USB-3H421BK（ブラック）/ USB-3H421W（ホワイト）",
      "PC接続端子": "USB A（ケーブル一体型、ケーブル長約10cm）",
      "対応規格": "USB 5Gbps（USB3.2 Gen1/3.1 Gen1/3.0）準拠",
      "ポート": "USB Aメス／USB 5Gbps×1ポート、USB Aメス／USB 2.0×3ポート",
      "最大データ転送速度（理論値）": "5Gbps",
      "供給電流": "最大820mA（全ポート合計）",
      "電源供給方式": "バスパワー",
      "サイズ": "約W95×D26.5×H15.5mm",
      "重量": "約32g",
      "対応OS": "Windows 11・10・8.1・8、macOS 11〜26、Chrome OS"
    },
    "currency": "JPY",
    "officialUrl": "https://www.sanwa.co.jp/product/syohin?code=USB-3H421BK",
    "market": {
      "keyword": "サンワサプライ USB-3H421BK",
      "match": [
        [
          "USB-3H421BK"
        ]
      ]
    },
    "sourceUrls": [
      "https://www.sanwa.co.jp/product/syohin?code=USB-3H421BK"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-20",
    "reviewedAt": "2026-10-20",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "sanwa-pda-stn79gy",
    "slug": "sanwa-pda-stn79gy",
    "name": "スマートフォンスタンド（回転式・アルミ素材）PDA-STN79GY",
    "brand": "サンワサプライ",
    "categoryId": "gadgets",
    "summary": "2つのヒンジで角度と高さを調整でき、台座が360°回転する、折りたたみ式のアルミ製スマートフォンスタンド。",
    "features": [
      "2つのヒンジで角度・高さを調整でき、折りたたんで持ち運べる",
      "台座が360°回転する",
      "エッジ部分の厚みが17mmまでのスマートフォン・タブレットに対応（タブレットは11インチ程度まで）"
    ],
    "pros": [
      "厚み17mmまで対応で、ケースを付けたままのスマートフォンも置ける",
      "背面のケーブルホールに充電ケーブルを通して、充電しながら使える",
      "台座が回転するので、向かいの相手に画面を向けるといった使い方もしやすい"
    ],
    "cons": [
      "公式ページに耐荷重・角度の範囲の数値が載っていない",
      "タブレットは11インチ程度までで、転倒の恐れがあるため横向き設置が推奨されている",
      "エッジ部分や本体の形状によっては、厚み17mm以内でも置けない場合があると注記されている",
      "折りたたみ時でも厚さ約36mmある"
    ],
    "specifications": {
      "型番": "PDA-STN79GY（グレー）",
      "材質": "アルミ、シリコーンゴム",
      "サイズ": "約W84×D105×H36mm（折りたたみ時）",
      "重量": "約134g",
      "角度調整": "無段階調整",
      "高さ調整": "無段階調整",
      "回転": "360度回転",
      "対応機器台数": "1台",
      "対応機器サイズ": "エッジ部分の厚みが17mmまでのタブレット、スマートフォン（タブレットは11インチ程度まで）"
    },
    "currency": "JPY",
    "officialUrl": "https://www.sanwa.co.jp/product/syohin?code=PDA-STN79GY",
    "market": {
      "keyword": "サンワサプライ PDA-STN79GY",
      "match": [
        [
          "PDA-STN79GY"
        ]
      ]
    },
    "sourceUrls": [
      "https://www.sanwa.co.jp/product/syohin?code=PDA-STN79GY"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-20",
    "reviewedAt": "2026-10-20",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "elecom-w-qs09bk",
    "slug": "elecom-w-qs09bk",
    "name": "Qi規格対応ワイヤレス充電器(5W・2枚コイル・スタンドタイプ) W-QS09BK",
    "brand": "エレコム",
    "categoryId": "gadgets",
    "summary": "スマートフォンを立てかけて置くだけで充電できる、Qi規格対応・最大5Wのスタンド型ワイヤレス充電器。",
    "features": [
      "Qi（BPP）の正規認証品で、最大5Wで充電できる",
      "2枚のコイルを搭載し、縦置き・横置きのどちらでも充電できる",
      "異物検知機能・温度上昇保護機能、動作確認LEDを搭載"
    ],
    "pros": [
      "横置きで充電すれば、対応するiPhoneでスタンバイモードを使えると案内されている",
      "スタンド部分に重りを内蔵し、滑り止めパッドも付いているので置いたときに安定しやすい",
      "長さ約1mの着脱式USB-C to USB-Cケーブルが付属している"
    ],
    "cons": [
      "出力は最大5Wで、ケーブルによる急速充電に比べて充電に時間がかかる",
      "USB出力アダプター（AC充電器など）は付属せず、出力5V/2A以上のものを別に用意する必要がある（付属ケーブルはUSB-C to USB-C）",
      "ケースを付けたまま充電できるのは厚さ3mm以下のケースのみで、金属・磁石を含むスマホリングやケースは使えない"
    ],
    "specifications": {
      "型番": "W-QS09BK（ブラック）/ W-QS09WH（ホワイト）",
      "対応機種": "5W(BPP)のQi規格ワイヤレス充電に対応した機器",
      "認証規格": "Qi (BPP)",
      "入力": "最大5V/2A",
      "出力": "最大5W",
      "入力端子": "USB Type-C（USB-C）ポート",
      "外形寸法": "幅約61mm×奥行約84mm×高さ約116mm",
      "重量": "約137.5g",
      "付属品": "USB Type-C - USB Type-Cケーブル（約1m）",
      "保証期間": "1年間"
    },
    "currency": "JPY",
    "officialUrl": "https://www.elecom.co.jp/products/W-QS09BK.html",
    "market": {
      "keyword": "エレコム W-QS09BK",
      "match": [
        [
          "W-QS09BK"
        ]
      ]
    },
    "sourceUrls": [
      "https://www.elecom.co.jp/products/W-QS09BK.html"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-20",
    "reviewedAt": "2026-10-20",
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
    "market": {
      "keyword": "フィッツケース 53 天馬",
      "match": [
        [
          "53-39M"
        ],
        [
          "フィッツケース",
          "53"
        ]
      ],
      "exclude": [
        "フィッツケースクローゼット",
        "ロング",
        "ワイド",
        "カプチーナ"
      ]
    },
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
    "market": {
      "keyword": "HARIO KST-60-TW",
      "match": [
        [
          "KST-60-TW"
        ]
      ]
    },
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
    "id": "yamazaki-tower-4939",
    "slug": "yamazaki-tower-4939",
    "name": "マグネットラップホルダー 3段 タワー",
    "brand": "山崎実業",
    "categoryId": "home",
    "summary": "冷蔵庫の側面などスチール面に磁石で付けて、ラップやアルミホイルを3本まとめて置けるホルダー。",
    "features": [
      "強力マグネットで冷蔵庫などに取り付け、ラップやホイルの定位置にできる",
      "ラップを3本収納でき、フリーザーバッグなど大きめの箱も置ける",
      "タオルなどを掛けて使うこともできる"
    ],
    "pros": [
      "マグネット式なので、壁や冷蔵庫に穴を開けずに取り付けられる",
      "3段で、ラップ・ホイル・フリーザーバッグなどをキッチン台に置かずにまとめられる",
      "幅15×奥行7cmと薄く、冷蔵庫の側面など狭い場所に付けやすい"
    ],
    "cons": [
      "取り付けられるのはマグネットがつく平らなスチール面だけ",
      "耐荷重は各段500gまで",
      "対応する箱は幅16cm以上・奥行6cm以内・高さ6cm以内の食品包装用ラップフィルム箱で、これより大きい箱は入らない"
    ],
    "specifications": {
      "品番": "4939 / 4940（ホワイト・ブラック）",
      "サイズ": "W15×D7×H23cm",
      "重量": "500g",
      "容量": "3本",
      "材質": "本体：スチール（粉体塗装）、マグネット",
      "耐荷重": "各500g",
      "対応サイズ": "幅16cm以上、奥行6cm以内、高さ6cm以内の食品包装用ラップフィルム箱",
      "取付可能な壁面": "マグネットがつく平らな面、スチール製の壁面",
      "生産国": "中国"
    },
    "currency": "JPY",
    "officialUrl": "https://www.yamajitsu.co.jp/products/241650",
    "market": {
      "keyword": "山崎実業 マグネットラップホルダー 3段 タワー 4939",
      "match": [
        [
          "4939",
          "ラップホルダー"
        ],
        [
          "4940",
          "ラップホルダー"
        ],
        [
          "マグネットラップホルダー3段",
          "タワー"
        ]
      ]
    },
    "sourceUrls": [
      "https://www.yamajitsu.co.jp/products/241650"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-20",
    "reviewedAt": "2026-10-20",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "nitoms-c4436",
    "slug": "nitoms-c4436",
    "name": "コロコロ フロアクリン スカットカット200 伸縮 L",
    "brand": "ニトムズ",
    "categoryId": "home",
    "summary": "フローリング・カーペット・畳などの床に使える、テープ幅200mmで長さを伸縮できる粘着クリーナー本体。",
    "features": [
      "テープ幅200mm（内径50mm）で、お掃除面積は従来比1.6倍",
      "床に貼りつきにくい弱粘着とゴミをとる強粘着のW粘着",
      "めくり口が分かるオレンジライン入りのスカットカット機能、全長630〜990mmの伸縮式"
    ],
    "pros": [
      "フローリング、カーペット、畳、ビニール床など床の種類を選ばず使えると案内されている",
      "テープ幅が200mmあるので、広い床を少ない回数で転がせる",
      "長さを630〜990mmで調整でき、取り出しやすいトレイ型のケースが付く"
    ],
    "cons": [
      "テープは消耗品で、付属は幅200mm×3mの1巻だけ（交換用は専用のスペアテープを別に買う）",
      "テープ幅160mm・内径38mmの一般的なフロアクリン用テープは取り付けられないと公式に注記されている",
      "公式ページに本体の重量が載っていない",
      "価格はオープン価格で、販売店によって差がある"
    ],
    "specifications": {
      "品番": "C4436",
      "サイズ": "全長：（最長）990mm・（最短）630mm",
      "個装入数": "1本",
      "JANコード": "4904140584368",
      "材質": "テープ：特殊すじ塗り粘着加工紙、オレンジライン：ポリプロピレン、シャフト：防錆処理鉄線（クロムメッキ）・アルミ、グリップ・テープ受け・トレイ：ポリプロピレン",
      "付属テープ": "幅200mm×3m・1巻・内径50mm",
      "使える床": "フローリング、カーペット、畳、ビニール床など",
      "交換用テープ": "スペアテープ コロコロ フロアクリン スカットカット200 2巻入（別売）"
    },
    "currency": "JPY",
    "officialUrl": "https://colocolo.nitoms.com/lineup/detail-1150/",
    "market": {
      "keyword": "ニトムズ C4436",
      "match": [
        [
          "C4436"
        ]
      ],
      "exclude": [
        "リモコン",
        "スペア"
      ]
    },
    "sourceUrls": [
      "https://colocolo.nitoms.com/lineup/detail-1150/"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-20",
    "reviewedAt": "2026-10-20",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "kai-dh3000",
    "slug": "kai-dh3000",
    "name": "SELECT100 T型ピーラー",
    "brand": "貝印",
    "categoryId": "home",
    "summary": "斜め刃とウェーブ型ハンドルのオールステンレス製T型ピーラー。食洗機で洗える。",
    "features": [
      "刃を斜めに設定し、刃にディンプル加工を施している",
      "握りやすさを考えたウェーブ型ハンドル",
      "じゃがいもの芽が取れるステンレス製のU字型芽取り付き"
    ],
    "pros": [
      "オールステンレス製で、家庭用食器洗い乾燥機で洗える",
      "芽取りが本体に付いているので、じゃがいもの芽取りに別の道具がいらない",
      "本体サイズ137×68×11mm・重量57gで、引き出しにしまいやすい"
    ],
    "cons": [
      "T型なので、I型（縦型）のピーラーに慣れていると持ち方が変わる",
      "刃だけを交換できるかどうかは公式ページに記載がない"
    ],
    "specifications": {
      "品番": "000DH3000",
      "本体サイズ": "137×68×11mm",
      "重量": "57g",
      "材質": "刃：ステンレス刃物鋼、本体：18-8ステンレススチール",
      "仕様": "オールステンレス製、食洗機対応",
      "生産国": "中国",
      "JANコード": "4901601413342"
    },
    "currency": "JPY",
    "officialUrl": "https://store.kai-group.com/shop/g/g994/",
    "market": {
      "keyword": "貝印 DH3000",
      "match": [
        [
          "DH3000"
        ]
      ]
    },
    "sourceUrls": [
      "https://store.kai-group.com/shop/g/g994/"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-20",
    "reviewedAt": "2026-10-20",
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
    "market": {
      "keyword": "MILESTO MLS905",
      "match": [
        [
          "MLS905"
        ]
      ]
    },
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
    "market": {
      "keyword": "カシムラ WP-113M",
      "match": [
        [
          "WP-113M"
        ]
      ]
    },
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
    "id": "dretec-ls-108",
    "slug": "dretec-ls-108",
    "name": "サイズもはかれるラゲッジスケール LS-108",
    "brand": "ドリテック",
    "categoryId": "travel",
    "summary": "旅行カバンや宅配荷物を吊り下げて重さをはかれ、80cmのメジャーでサイズも確かめられる、電池不要のラゲッジスケール。",
    "features": [
      "0〜50kgまで50g単位ではかれる（吊り下げ式）",
      "80cmのメジャー付きで、メジャーを引いて戻すだけで発電して使える（電池不要）",
      "風袋引き機能付き。安定すると「H」が表示されて数値が固定される（0.5kg以上のとき）"
    ],
    "pros": [
      "電池が要らないので、出発前に電池切れで使えないということがない",
      "最大50kgまで量れるので、大きめのスーツケースの重量チェックにも使える",
      "メジャー付きなので、重さと大きさを1台で確かめられる"
    ],
    "cons": [
      "電源ONから使えるのは約2分で、時間が過ぎたら再度メジャーを引いて発電する必要がある",
      "最小表示は50gで、細かい重さを量る用途には向かない",
      "数値を固定する「H」表示は0.5kg以上のときだけ",
      "公式ページに材質の記載がない"
    ],
    "specifications": {
      "型番": "LS-108BK（ブラック）",
      "寸法": "約W155×D34×H60mm",
      "質量": "約135g",
      "計量範囲": "50g〜50.00kg",
      "最小表示": "50g",
      "メジャーの長さ": "80cm",
      "電源": "電池不要（メジャーを引いて戻すと発電）",
      "使用時間": "電源ONから約2分",
      "JANコード": "4536117043983"
    },
    "currency": "JPY",
    "officialUrl": "https://www.dretec.co.jp/life_style/household_goods/ls-108/",
    "market": {
      "keyword": "ドリテック LS-108",
      "match": [
        [
          "LS-108BK"
        ],
        [
          "LS-108",
          "ラゲッジスケール"
        ]
      ]
    },
    "sourceUrls": [
      "https://www.dretec.co.jp/life_style/household_goods/ls-108/"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-20",
    "reviewedAt": "2026-10-20",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "milesto-mls909",
    "slug": "milesto-mls909",
    "name": "MILESTO UTILITY ハンギングオーガナイザー 2L",
    "brand": "MILESTO",
    "categoryId": "travel",
    "summary": "付属のフックで旅先のバスルームなどに吊るして使える、取り外し式ポーチ付きのコンパクトな洗面・小物用オーガナイザー。",
    "features": [
      "ファスナーを開いて中の付属フックを出すと、取っ手や壁に吊るして使える",
      "3段に分かれたファスナー式メッシュポケット。中段のマチ付きポケットは取り外して単体で持ち運べる",
      "表地は強度と撥水性を兼ねたCORDURA(R)ポリエステル"
    ],
    "pros": [
      "吊るして使えるので、洗面台が狭いホテルでも中身を出し入れしやすい",
      "中段のポーチを外せば、ガジェットポーチなど単体のポーチとしても使える",
      "下段のメッシュポケットは折りたたんで収納でき、使わないときはコンパクトにできる"
    ],
    "cons": [
      "容量は2Lで、家族分の洗面用具などをまとめるには小さい場合がある",
      "撥水加工は防水加工とは異なり、長時間の雨水では水が染みこむ場合があると公式に注記されている",
      "縫製製品のため、サイズ・重量・容量はおおよその値とされている"
    ],
    "specifications": {
      "型番": "MLS909",
      "サイズ": "W210×H145×D75mm",
      "重量": "190g",
      "素材": "表：ポリエステル（コーデュラ(R)）、裏：ポリエステル",
      "生産国": "中国",
      "備考": "縫製製品の為、サイズ・重量・容量はおおよその値"
    },
    "currency": "JPY",
    "officialUrl": "https://bruno-onlineshop.com/item/07643126.html",
    "market": {
      "keyword": "MILESTO MLS909",
      "match": [
        [
          "MLS909"
        ]
      ]
    },
    "sourceUrls": [
      "https://bruno-onlineshop.com/item/07643126.html",
      "https://item.rakuten.co.jp/milesto/7643124/"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-20",
    "reviewedAt": "2026-10-20",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "wpc-nt012",
    "slug": "wpc-nt012",
    "name": "トラベルスリッパ ONDOO NT012",
    "brand": "Wpc.",
    "categoryId": "travel",
    "summary": "コンパクトに折りたたんで専用のメッシュポーチに入れて持ち運べる、洗濯機で洗える旅行用スリッパ。",
    "features": [
      "そのまま履くことも、かかとを踏んで履くこともできる2way仕様",
      "折りたたんで専用メッシュポーチ（縦20×横24cm）に収納できる",
      "洗濯機で洗える（洗濯ネット使用）。生地ははっ水加工"
    ],
    "pros": [
      "ポーチに入れて持ち運べるので、旅先や出張先のホテル・機内での履き替え用に使いやすい",
      "洗濯機で洗えるので、使ったあとも清潔に保ちやすい",
      "かかとを踏んでも履ける2way仕様で、脱ぎ履きしやすい"
    ],
    "cons": [
      "室内履き専用で、屋外では使えない",
      "はっ水加工はしてあるが防水ではない",
      "サイズはM（23〜25cm）とL（25.5〜27.5cm）の2つだけで、目安とされている",
      "公式ページに重さの記載がない。乾燥機・アイロン・漂白剤は使えない"
    ],
    "specifications": {
      "品番": "NT012",
      "対応サイズ": "M：23〜25cm／L：25.5〜27.5cm（目安）",
      "素材": "本体 ポリエステル100%（はっ水加工）",
      "付属品": "収納用メッシュポーチ（縦20×横24cm）",
      "お手入れ": "洗濯機で洗濯可（洗濯ネット使用・陰干し）",
      "生産国": "中国"
    },
    "currency": "JPY",
    "officialUrl": "https://www.wpc-store.com/c/ondoo/nt012",
    "market": {
      "keyword": "Wpc トラベルスリッパ",
      "match": [
        [
          "NT012",
          "スリッパ"
        ],
        [
          "ONDOO",
          "トラベルスリッパ"
        ],
        [
          "WPC",
          "トラベルスリッパ"
        ]
      ]
    },
    "sourceUrls": [
      "https://www.wpc-store.com/c/ondoo/nt012"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-20",
    "reviewedAt": "2026-10-20",
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
    "market": {
      "keyword": "テプラ SR-R2500P",
      "match": [
        [
          "SR-R2500P"
        ]
      ],
      "exclude": [
        "テープカートリッジ",
        "互換",
        "用テープ",
        "専用テープ",
        "ケースのみ",
        "収納ケース",
        "カバー"
      ],
      "minPrice": 3000
    },
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
    "market": {
      "keyword": "キングジム ドキュメントファイル 2274",
      "match": [
        [
          "2274",
          "ドキュメントファイル"
        ]
      ]
    },
    "sourceUrls": [
      "https://www.kingjim.co.jp/products/detail/2274.html"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-19",
    "reviewedAt": "2026-10-19",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "kokuyo-sln-msh110",
    "slug": "kokuyo-sln-msh110",
    "name": "ハリナックス ハンディ針なしステープラー コピー用紙約10枚とじ SLN-MSH110",
    "brand": "コクヨ",
    "categoryId": "stationery",
    "summary": "針を使わずにコピー用紙約10枚をとじられる、片手で持って使うハンディタイプの針なしステープラー。",
    "features": [
      "針を使わずに紙をとじるので、針の補給が要らない",
      "片手で使えるスリム設計で、コピー用紙（PPC用紙）約10枚をとじられる",
      "とじ穴の位置を確かめられる確認窓付きで、角とじ・横とじの両方ができる"
    ],
    "pros": [
      "針を使わないので、とじた紙を捨てるときに針を分別する必要がない",
      "1つ穴タイプなので、角とじも横とじもできる（角とじ用の目印付き）",
      "ストラップ用の穴が付いていて、持ち歩きにも使いやすい"
    ],
    "cons": [
      "針を使うステープラーと同等の保持力はないと公式に注記されている",
      "感熱紙や複写伝票など用紙の種類によっては、とじ枚数が少なくなったり保持力が弱くなったりする",
      "とじると紙に穴があく",
      "公式ページに本体の重さが載っていない"
    ],
    "specifications": {
      "品番": "SLN-MSH110GB（ブルーグリーン）／SLN-MSH110PW（ペールホワイト）／SLN-MSH110SD（セピアブラック）／SLN-MSH110VP（サーモンピンク）※ほかに黒・緑・ライトブルー・ピンク・白（SLN-MSH110D／G／LB／P／W）",
      "とじ枚数": "コピー用紙（PPC用紙64g/㎡）約10枚",
      "外寸法": "W32×D121×H100mm",
      "材質": "上カバー・下カバー・レバー：R-ABS、とじ穴位置確認窓：ABS、本体：スチール、刃：ステンレス・スチール（SLN-MSH110PWの場合）",
      "とじ方": "1つ穴タイプ（角とじ・横とじ）",
      "その他": "とじ穴位置確認窓、ストラップ穴つき"
    },
    "currency": "JPY",
    "officialUrl": "https://www.kokuyo.com/stationery/series/harinacs/handy-10sheet/",
    "market": {
      "keyword": "コクヨ ハリナックス SLN-MSH110",
      "match": [
        [
          "SLN-MSH110"
        ]
      ]
    },
    "sourceUrls": [
      "https://www.kokuyo.com/stationery/series/harinacs/handy-10sheet/",
      "https://www.kokuyo.com/stationery/category/stapler-punch/stapler/13670/"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-20",
    "reviewedAt": "2026-10-20",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "plus-sc-175s-ab",
    "slug": "plus-sc-175s-ab",
    "name": "フィットカットカーブ スタンダード 抗菌グリップ SC-175S-AB",
    "brand": "プラス",
    "categoryId": "stationery",
    "summary": "紙から梱包用のひも、ビニール袋まで切れる、グリップに抗菌剤を配合した家庭・オフィス向けのはさみ。",
    "features": [
      "刃の開き角度を保つ、プラス独自の「ベルヌーイカーブ刃」",
      "グリップの素材に抗菌剤（銀イオン）を配合",
      "金属ピンの摩耗によるがたつきを抑える「がたつき防止リング」"
    ],
    "pros": [
      "刃の根元から刃先まで、どの位置で切っても対象物をとらえる設計と案内されている",
      "エラストマー素材の低反発グリップで、小指用の滑り止めも付いている",
      "グリップが抗菌仕様なので、家族や職場での共用に向く"
    ],
    "cons": [
      "抗菌剤が配合されているのはグリップで、刃ではない",
      "刃渡りは65mmで、長く切る作業には同シリーズのロング（SC-190S-AB、刃渡り75mm）がある",
      "右手用。左手用は別品番（SC-175SL-AB）",
      "公式ページに重さが載っていない"
    ],
    "specifications": {
      "品番": "SC-175S-AB（ホワイト／ブルー／ピンク）",
      "全長": "174mm",
      "刃渡り": "65mm",
      "板厚": "1.8mm",
      "外寸法": "W74×D13×H174mm",
      "材質": "刃・カシメピン＝ステンレス鋼、グリップ＝ABS＋TPE、がたつき防止リング＝POM",
      "グリップ": "抗菌剤（銀イオン）配合"
    },
    "currency": "JPY",
    "officialUrl": "https://bungu.plus.co.jp/product/cut/std/fcc_std_koukin/",
    "market": {
      "keyword": "プラス フィットカットカーブ SC-175S-AB",
      "match": [
        [
          "SC-175S-AB"
        ]
      ]
    },
    "sourceUrls": [
      "https://bungu.plus.co.jp/product/cut/std/fcc_std_koukin/",
      "https://bungu.plus.co.jp/product/cut/std/fcc_std_koukin/item.html"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-20",
    "reviewedAt": "2026-10-20",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  },
  {
    "id": "kokuyo-f-vbf180",
    "slug": "kokuyo-f-vbf180",
    "name": "ネオクリッツ ペンケース F-VBF180",
    "brand": "コクヨ",
    "categoryId": "stationery",
    "summary": "ファスナーを開けて上半分を折り返すと、机の上でペンスタンドとして立てて使えるペンケース。",
    "features": [
      "上半分を折り返すとペンスタンドになり、立てて使える",
      "両開きファスナーで、上部を開けるだけで中身を取り出せる",
      "前面に消しゴムなどを分けて入れられる小物スペース"
    ],
    "pros": [
      "立てて使えるので、机の上の場所を取りにくい",
      "折り返すと中が見やすく、ペンを探しやすい",
      "表材・内装はポリエステル、芯材はPP"
    ],
    "cons": [
      "公式ページに収容本数と重さが載っていない",
      "前面の小物スペースはポケットになっていないので、入れる物に注意が必要と公式に注記されている",
      "縫製品のため、寸法に差が出る場合がある"
    ],
    "specifications": {
      "品番": "F-VBF180-1（ブラック×ブラック）／F-VBF180-2（ネイビー×ブルー）／F-VBF180-3（ブルー×ネイビー）",
      "外寸法": "W85×D50×H195mm",
      "材質": "表材・内装：ポリエステル、芯材：PP",
      "ファスナー": "両開きファスナー",
      "その他": "前面に小物スペース（ポケットではない）"
    },
    "currency": "JPY",
    "officialUrl": "https://www.kokuyo.com/stationery/category/bag-pouch/pencase/13506/",
    "market": {
      "keyword": "コクヨ ネオクリッツ F-VBF180",
      "match": [
        [
          "F-VBF180"
        ]
      ]
    },
    "sourceUrls": [
      "https://www.kokuyo.com/stationery/category/bag-pouch/pencase/13506/",
      "https://www.kokuyo.com/stationery/series/neocritz/"
    ],
    "reviewStatus": "verified",
    "status": "published",
    "updatedAt": "2026-10-20",
    "reviewedAt": "2026-10-20",
    "reviewedBy": "AI（Claude）が公式ページで確認"
  }
];
