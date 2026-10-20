/**
 * 「次はこちら」：ツールを使い終わったあと、作業の流れで次に使いそうなツール。
 * why は「なぜ次にこれか」を短く。公開中でないツールは表示されない。1ツール3件まで。
 */
export const nextSteps: Record<string, { slug: string; why: string }[]> = {
  // 文章
  "character-counter": [
    { slug: "manuscript-paper", why: "原稿用紙で何枚分かを見る" },
    { slug: "whitespace-remover", why: "余計な空白や改行を整える" },
    { slug: "sns-character-count", why: "SNSの文字数上限を確かめる" },
  ],
  "whitespace-remover": [
    { slug: "character-counter", why: "整えたあとの文字数を数える" },
    { slug: "text-replace", why: "言葉をまとめて置き換える" },
  ],
  "text-replace": [
    { slug: "text-diff", why: "置き換え前後の違いを確かめる" },
    { slug: "character-counter", why: "文字数を数える" },
  ],
  "text-diff": [{ slug: "text-replace", why: "直したい言葉をまとめて置き換える" }],
  "zenkaku-hankaku": [
    { slug: "hiragana-katakana", why: "ひらがな・カタカナもそろえる" },
    { slug: "whitespace-remover", why: "空白を整える" },
  ],
  "sns-character-count": [{ slug: "image-text", why: "投稿用の画像に文字を入れる" }],
  // 計算・お金
  "consumption-tax": [
    { slug: "rounding", why: "端数の処理を確かめる" },
    { slug: "discount", why: "割引後の価格を出す" },
    { slug: "hanko", why: "見積書・請求書用の電子印鑑を作る" },
  ],
  discount: [
    { slug: "consumption-tax", why: "税込・税抜を計算する" },
    { slug: "unit-price", why: "量あたりの値段で比べる" },
  ],
  percentage: [
    { slug: "achievement-rate", why: "目標に対する達成率を出す" },
    { slug: "rounding", why: "小数を四捨五入する" },
  ],
  "loan-simulator": [
    { slug: "compound-interest", why: "積み立てたらいくらになるか見る" },
    { slug: "savings-goal", why: "目標額までの貯め方を考える" },
  ],
  "compound-interest": [{ slug: "savings-goal", why: "毎月いくら積み立てればよいか出す" }],
  "wage-converter": [
    { slug: "overtime-pay", why: "残業代を計算する" },
    { slug: "budget", why: "手取りから予算を配分する" },
    { slug: "furusato-limit", why: "ふるさと納税の控除上限の目安を出す" },
  ],
  "furusato-limit": [
    { slug: "countdown", why: "12月31日の締め切りまでのカウントダウンを作る" },
    { slug: "budget", why: "寄附に回す額を家計の予算に入れる" },
  ],
  "overtime-pay": [{ slug: "wage-converter", why: "時給・月給・年収に換算する" }],
  warikan: [{ slug: "travel-expense-split", why: "立て替えが多いときの精算をする" }],
  "travel-expense-split": [{ slug: "warikan", why: "端数を考えて割り勘する" }],
  "unit-converter": [{ slug: "data-size", why: "データ容量も換算する" }],
  // 日付
  "days-between": [
    { slug: "business-days", why: "土日祝を除いた営業日で数える" },
    { slug: "date-add", why: "◯日後の日付を出す" },
    { slug: "countdown", why: "その日までのカウントダウンを作る" },
  ],
  "date-add": [
    { slug: "weekday", why: "その日の曜日と祝日を確かめる" },
    { slug: "business-days", why: "営業日で数え直す" },
  ],
  "business-days": [{ slug: "days-between", why: "カレンダー上の日数を数える" }],
  age: [{ slug: "school-years", why: "入学・卒業の年を調べる" }],
  "school-years": [{ slug: "age", why: "満年齢を確かめる" }],
  timezone: [{ slug: "meeting-planner", why: "時差のある会議の時間を決める" }],
  // 画像
  "image-resize": [
    { slug: "image-compress", why: "さらにファイルを軽くする" },
    { slug: "image-convert", why: "WebP・JPGなどに変換する" },
  ],
  "image-compress": [
    { slug: "image-convert", why: "軽い形式（WebP）に変える" },
    { slug: "image-to-pdf", why: "画像をPDFにまとめる" },
  ],
  "image-convert": [
    { slug: "image-compress", why: "変換した画像を軽くする" },
    { slug: "image-resize", why: "大きさをそろえる" },
  ],
  "image-crop": [
    { slug: "image-resize", why: "決まったサイズに縮める" },
    { slug: "image-text", why: "文字を入れる" },
  ],
  "square-image": [{ slug: "image-text", why: "SNS用に文字を入れる" }],
  "image-text": [
    { slug: "image-compress", why: "投稿用に軽くする" },
    { slug: "image-mosaic", why: "写したくない部分を隠す" },
  ],
  "image-mosaic": [{ slug: "image-compress", why: "共有用に軽くする" }],
  "background-remover": [
    { slug: "image-padding", why: "透過画像に余白を足す" },
    { slug: "favicon", why: "アイコン（ファビコン）を作る" },
  ],
  "bulk-image-resize": [{ slug: "image-to-pdf", why: "まとめて1つのPDFにする" }],
  "video-to-gif": [{ slug: "image-compress", why: "できたGIFの前後の画像を軽くする" }],
  // PDF
  "pdf-merge": [
    { slug: "pdf-compress", why: "まとめたPDFを軽くする" },
    { slug: "pdf-organize", why: "ページの順番を整える" },
  ],
  "pdf-split": [
    { slug: "pdf-merge", why: "必要なページだけ集めて1つにする" },
    { slug: "pdf-to-image", why: "ページを画像にする" },
  ],
  "pdf-organize": [
    { slug: "pdf-compress", why: "整えたPDFを軽くする" },
    { slug: "pdf-editor", why: "文字や印鑑を書き込む" },
  ],
  "pdf-rotate": [{ slug: "pdf-organize", why: "並べ替えや削除もする" }],
  "pdf-delete-pages": [{ slug: "pdf-compress", why: "PDFを軽くする" }],
  "pdf-editor": [
    { slug: "hanko", why: "押す電子印鑑を作る" },
    { slug: "pdf-compress", why: "送る前に軽くする" },
  ],
  "image-to-pdf": [
    { slug: "pdf-compress", why: "できたPDFを軽くする" },
    { slug: "pdf-merge", why: "ほかのPDFとまとめる" },
  ],
  "pdf-to-image": [{ slug: "image-compress", why: "画像を軽くする" }],
  hanko: [{ slug: "pdf-editor", why: "PDFに印鑑を押す" }],
  // データ
  "csv-encoding": [
    { slug: "excel-csv-converter", why: "Excelのファイルに変換する" },
    { slug: "csv-dedupe", why: "重複した行を消す" },
  ],
  "csv-dedupe": [{ slug: "csv-columns", why: "必要な列だけ取り出す" }],
  "csv-columns": [{ slug: "csv-to-json", why: "JSONに変換する" }],
  "excel-csv-converter": [{ slug: "csv-encoding", why: "文字化けを直す（文字コード変換）" }],
  "json-formatter": [
    { slug: "json-to-csv", why: "表（CSV）に変換する" },
    { slug: "jwt-decoder", why: "JWTの中身を見る" },
  ],
  // 生成・デザイン
  "password-generator": [{ slug: "hash-generator", why: "ハッシュ値を確かめる" }],
  "qr-code": [{ slug: "image-padding", why: "印刷用に余白を足す" }],
  "color-palette": [
    { slug: "contrast-checker", why: "文字が読みやすい色か確かめる" },
    { slug: "gradient", why: "グラデーションを作る" },
  ],
  "color-converter": [{ slug: "contrast-checker", why: "読みやすさ（コントラスト比）を確かめる" }],
  "image-color-picker": [{ slug: "color-palette", why: "その色に合う配色を作る" }],
  // ビジネス
  "presentation-time": [{ slug: "character-counter", why: "原稿の文字数を数える" }],
  "meeting-minutes": [{ slug: "task-priority", why: "宿題の優先順位を決める" }],
  "progress-rate": [{ slug: "business-days", why: "残りの営業日を数える" }],
  "study-time": [{ slug: "countdown", why: "試験日までのカウントダウンを作る" }],
};
