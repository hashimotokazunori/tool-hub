import type { BuyingGuide } from "@/lib/types";

/**
 * 便利グッズの品目ごとの選び方（特定の商品を指さない一般的な情報）。
 * 試作版から移したAIの下書きなので、人が出典を確認するまで draft / pending。
 */
export const buyingGuides: BuyingGuide[] = [
  {
    "id": "desk-01",
    "categoryId": "desk",
    "name": "ノートPCスタンド",
    "summary": "画面が目の高さに近づき、前かがみの姿勢を減らせます。",
    "points": [
      "画面の上端が目の高さ付近に来るか（高さ調整の段階・無段階）",
      "対応する画面サイズ（インチ）と耐荷重",
      "持ち運ぶなら折りたたみ時の厚さと重さ",
      "アルミ製は放熱しやすく、ぐらつきにくい"
    ],
    "specsToCompare": [
      "高さの範囲（cm）",
      "対応インチ・耐荷重",
      "重さ・折りたたみ"
    ],
    "toolSlugs": [
      "budget",
      "unit-price"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  },
  {
    "id": "desk-02",
    "categoryId": "desk",
    "name": "ケーブル整理グッズ",
    "summary": "机の上や足元の配線をまとめ、掃除しやすくします。",
    "points": [
      "机の天板に付けるクリップか、裏に隠すトレーか",
      "ケーブルの太さ・本数に合う溝の数",
      "両面テープか、ネジ・クランプ固定か（賃貸・天板の材質）",
      "電源タップごと収納できるボックスも便利"
    ],
    "specsToCompare": [
      "対応するケーブルの太さ",
      "固定方法",
      "トレーの長さ"
    ],
    "toolSlugs": [
      "budget"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  },
  {
    "id": "desk-03",
    "categoryId": "desk",
    "name": "デスク収納（引き出し・トレー）",
    "summary": "散らかりやすい小物に「戻す場所」を作ります。",
    "points": [
      "机の上に置く前に、置き場所の幅と奥行きを測る",
      "引き出し式は中身が見えないので、ラベルで管理する",
      "よく使う物は手前、たまに使う物は奥に",
      "積み重ねられるタイプは、後から増やしやすい"
    ],
    "specsToCompare": [
      "外寸と内寸",
      "引き出しの数",
      "積み重ね可否"
    ],
    "toolSlugs": [
      "unit-converter",
      "qr-code"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  },
  {
    "id": "desk-04",
    "categoryId": "desk",
    "name": "モニター台・モニターアーム",
    "summary": "画面の高さを合わせ、机の上の空きスペースを増やします。",
    "points": [
      "モニターアームは、モニター背面のVESA規格（75×75mm・100×100mm）に対応しているか",
      "対応する重さ・画面サイズ",
      "天板の厚さとクランプの対応範囲",
      "モニター台は下にキーボードを収納できる高さか"
    ],
    "specsToCompare": [
      "VESA規格",
      "耐荷重",
      "天板の対応厚"
    ],
    "toolSlugs": [
      "css-unit"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  },
  {
    "id": "gadgets-05",
    "categoryId": "gadgets",
    "name": "USB充電器（急速充電）",
    "summary": "1台で複数の機器をまとめて、速く充電します。",
    "points": [
      "USB PD（Power Delivery）対応か。スマホは20W以上、ノートPCは45〜65W以上が目安",
      "複数ポートを同時に使うと、1ポートあたりの出力が下がる製品が多い（配分表を確認）",
      "電気用品安全法の基準を満たすPSEマークがあるか",
      "小型化しやすいGaN（窒化ガリウム）採用モデルも多い"
    ],
    "specsToCompare": [
      "最大出力（W）",
      "同時使用時の出力配分",
      "ポート数（USB-C／A）",
      "PSEマーク"
    ],
    "toolSlugs": [
      "electricity-cost"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  },
  {
    "id": "gadgets-06",
    "categoryId": "gadgets",
    "name": "モバイルバッテリー",
    "summary": "外出先や災害時に、スマホを充電できます。",
    "points": [
      "容量の目安：スマホ約2回分なら10,000mAh前後",
      "表示容量と実際に充電できる量は違う（変換ロスで6〜7割程度になることが多い）",
      "2019年2月から、モバイルバッテリーはPSEマークの表示が必要",
      "飛行機は160Wh以下が持ち込みの条件（100Wh超は個数制限あり。Wh＝mAh×3.7V÷1000）"
    ],
    "specsToCompare": [
      "容量（mAh・Wh）",
      "出力（W）・PD対応",
      "重さ",
      "PSEマーク"
    ],
    "toolSlugs": [
      "electricity-cost",
      "data-size"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  },
  {
    "id": "gadgets-07",
    "categoryId": "gadgets",
    "name": "USBハブ・ドッキングステーション",
    "summary": "ポートの少ないノートPCに、USB・HDMI・LANを増やします。",
    "points": [
      "USBの速さ（5Gbps・10Gbpsなど）",
      "HDMIの出力が4K 60Hzか30Hzか（30Hzは動きがカクつきやすい）",
      "PD給電パススルーで、ノートPCに何Wまで流せるか",
      "有線LANが必要なら、LANポート付きを選ぶ"
    ],
    "specsToCompare": [
      "ポートの種類と数",
      "映像出力の解像度・リフレッシュレート",
      "PDパススルーの最大W"
    ],
    "toolSlugs": [
      "data-size"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  },
  {
    "id": "gadgets-08",
    "categoryId": "gadgets",
    "name": "スマホスタンド",
    "summary": "ビデオ会議や動画視聴、レシピを見ながらの料理に。",
    "points": [
      "角度と高さを調整できるか",
      "充電ケーブルを挿したまま置けるか",
      "重いスマホでも倒れにくい台座の重さ",
      "ワイヤレス充電一体型は、置くだけで充電できる"
    ],
    "specsToCompare": [
      "対応サイズ",
      "角度調整",
      "ケーブル穴"
    ],
    "toolSlugs": [
      "timezone",
      "meeting-planner"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  },
  {
    "id": "home-09",
    "categoryId": "home",
    "name": "収納ボックス・ケース",
    "summary": "棚や押し入れの中を区切って、物の住所を決めます。",
    "points": [
      "先に置く場所の内寸（幅・奥行き・高さ）を測る",
      "同じシリーズでそろえると、すき間なく並べられる",
      "中身が見えない箱は、ラベルを貼る",
      "買い足せる定番品を選ぶと、後で増やしやすい"
    ],
    "specsToCompare": [
      "外寸",
      "材質（布・樹脂・紙）",
      "買い足しやすさ"
    ],
    "toolSlugs": [
      "unit-converter",
      "unit-price"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  },
  {
    "id": "home-10",
    "categoryId": "home",
    "name": "掃除グッズ",
    "summary": "「ついで掃除」ができる道具は、出しっぱなしでも邪魔にならない物を。",
    "points": [
      "使い捨てシートか、洗って使えるクロスか",
      "すき間用・高い所用など、届かない場所に合わせる",
      "壁に掛けて収納できるデザインだと、すぐ取り出せる",
      "洗剤は詰め替え用の単価も比べる"
    ],
    "specsToCompare": [
      "替えの価格",
      "収納方法",
      "対応する場所"
    ],
    "toolSlugs": [
      "unit-price"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  },
  {
    "id": "home-11",
    "categoryId": "home",
    "name": "キッチン小物・保存容器",
    "summary": "調理の手間と、食材のムダを減らします。",
    "points": [
      "電子レンジ・食洗機に対応しているか（ふたは非対応の場合も）",
      "重ねて収納できるか",
      "計量カップ・スプーンは、大さじ15mL・小さじ5mLを確認",
      "保存容器は中身と日付が分かるようにラベルを"
    ],
    "specsToCompare": [
      "耐熱温度",
      "食洗機対応",
      "容量（mL）"
    ],
    "toolSlugs": [
      "unit-converter",
      "qr-code"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  },
  {
    "id": "home-12",
    "categoryId": "home",
    "name": "省スペース用品",
    "summary": "突っ張り棒や吊り下げ収納で、使っていない空間を活用します。",
    "points": [
      "突っ張り棒は、取り付ける場所の幅と耐荷重を確認",
      "賃貸なら、穴を開けずに付けられるか",
      "扉裏・冷蔵庫の側面など、すき間の寸法を測ってから選ぶ"
    ],
    "specsToCompare": [
      "対応幅",
      "耐荷重",
      "取り付け方法"
    ],
    "toolSlugs": [
      "unit-converter"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  },
  {
    "id": "travel-13",
    "categoryId": "travel",
    "name": "圧縮袋・パッキングポーチ",
    "summary": "衣類をコンパクトにまとめ、スーツケースの中を整理します。",
    "points": [
      "手で巻いて空気を抜くタイプは、掃除機が不要で旅行先でも使える",
      "服を「日ごと」「種類ごと」に分けると、取り出しやすい",
      "航空会社の重量制限を超えないよう、圧縮しすぎに注意"
    ],
    "specsToCompare": [
      "サイズ・枚数",
      "空気の抜き方"
    ],
    "toolSlugs": [
      "travel-expense-split",
      "tip"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  },
  {
    "id": "travel-14",
    "categoryId": "travel",
    "name": "旅行用ポーチ（洗面・ガジェット）",
    "summary": "充電器やケーブル、洗面用品の迷子を防ぎます。",
    "points": [
      "中が見えるメッシュや透明素材だと、探しやすい",
      "ケーブル類は、仕切りやゴムバンド付きが便利",
      "吊り下げられる洗面ポーチは、狭い洗面所で役立つ",
      "飛行機の液体持ち込み（100mL以下の容器・1L以下の透明袋）に合わせた透明ポーチも"
    ],
    "specsToCompare": [
      "大きさ",
      "仕切りの数",
      "防水性"
    ],
    "toolSlugs": [
      "travel-expense-split"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  },
  {
    "id": "travel-15",
    "categoryId": "travel",
    "name": "変換プラグ・旅行用充電器",
    "summary": "海外でスマホやカメラを充電するために。",
    "points": [
      "行き先の国のコンセント形状（A・C・BF・Oなど）を調べる",
      "充電器が100〜240V対応なら変圧器は不要（本体の表示を確認）",
      "ドライヤーなど電熱器具は、変圧器が必要なことが多い",
      "USBポート付きのマルチ変換プラグなら1つで済む"
    ],
    "specsToCompare": [
      "対応するプラグ形状",
      "入力電圧",
      "USBポートの出力"
    ],
    "toolSlugs": [
      "timezone",
      "tip"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  },
  {
    "id": "travel-16",
    "categoryId": "travel",
    "name": "携帯用品（折りたたみ傘・エコバッグ）",
    "summary": "外出先の「急に必要」に備えます。",
    "points": [
      "折りたたみ傘は、重さと親骨の長さのバランスを見る",
      "晴雨兼用はUVカット率を確認",
      "エコバッグは、たたんだときの大きさと耐荷重"
    ],
    "specsToCompare": [
      "重さ",
      "大きさ",
      "耐荷重"
    ],
    "toolSlugs": [
      "steps-distance"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  },
  {
    "id": "stationery-17",
    "categoryId": "stationery",
    "name": "ラベルライター・ラベルシール",
    "summary": "収納や書類に名前を付けて、探す時間を減らします。",
    "points": [
      "テープ幅（9mm・12mmなど）の種類",
      "スマホから入力できるタイプは、QRコードや絵文字も印刷できる",
      "屋外・冷蔵庫に貼るなら、耐水・耐熱のテープを"
    ],
    "specsToCompare": [
      "テープ幅",
      "入力方法",
      "テープの単価"
    ],
    "toolSlugs": [
      "qr-code",
      "unit-price"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  },
  {
    "id": "stationery-18",
    "categoryId": "stationery",
    "name": "書類整理用品（ファイル・ボックス）",
    "summary": "紙の書類を分類して、必要なときにすぐ出せるようにします。",
    "points": [
      "A4がそのまま入るか（A4は210×297mm）",
      "個別フォルダーで「進行中」「保管」に分ける",
      "保管が必要な書類以外は、スキャンしてPDFにすると場所を取らない"
    ],
    "specsToCompare": [
      "対応サイズ",
      "収容枚数",
      "背幅"
    ],
    "toolSlugs": [
      "image-to-pdf",
      "bulk-rename"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  },
  {
    "id": "stationery-19",
    "categoryId": "stationery",
    "name": "手帳・カレンダー（スケジュール管理）",
    "summary": "締め切りや予定を、ひと目で見られるようにします。",
    "points": [
      "月間・週間・1日1ページなど、書く量に合ったレイアウト",
      "開始月（1月始まり・4月始まり）",
      "祝日や六曜の記載の有無"
    ],
    "specsToCompare": [
      "サイズ",
      "レイアウト",
      "開始月"
    ],
    "toolSlugs": [
      "business-days",
      "countdown",
      "days-between"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  },
  {
    "id": "stationery-20",
    "categoryId": "stationery",
    "name": "時短文具・アイデア雑貨",
    "summary": "ちょっとした作業の手間を減らします。",
    "points": [
      "多機能ペンは、よく使う色の組み合わせで選ぶ",
      "付箋は、はがれにくい強粘着や、透明タイプも便利",
      "日付印・住所印は、繰り返し書く作業を減らせる"
    ],
    "specsToCompare": [
      "替え芯・替えの入手しやすさ",
      "サイズ"
    ],
    "toolSlugs": [
      "hanko",
      "task-priority"
    ],
    "reviewStatus": "pending",
    "status": "draft"
  }
];
