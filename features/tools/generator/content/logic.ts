import { xWeightedCount } from "@/features/tools/text/character-counter/logic";
import { secureRandomInt } from "@/features/tools/generator/password-generator/logic";
import { WEEKDAYS } from "@/lib/date";

type Rand = (n: number) => number;
const pick = <T>(list: readonly T[], rand: Rand): T => list[rand(list.length)];
const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/* ---------- ダミーデータ ---------- */

/** [漢字, カナ, ローマ字]。よくある名字・名前を組み合わせた架空の人物にする */
const SURNAMES: [string, string, string][] = [
  ["佐藤", "サトウ", "sato"],
  ["鈴木", "スズキ", "suzuki"],
  ["高橋", "タカハシ", "takahashi"],
  ["田中", "タナカ", "tanaka"],
  ["伊藤", "イトウ", "ito"],
  ["渡辺", "ワタナベ", "watanabe"],
  ["山本", "ヤマモト", "yamamoto"],
  ["中村", "ナカムラ", "nakamura"],
  ["小林", "コバヤシ", "kobayashi"],
  ["加藤", "カトウ", "kato"],
  ["吉田", "ヨシダ", "yoshida"],
  ["山田", "ヤマダ", "yamada"],
  ["佐々木", "ササキ", "sasaki"],
  ["山口", "ヤマグチ", "yamaguchi"],
  ["松本", "マツモト", "matsumoto"],
  ["井上", "イノウエ", "inoue"],
  ["木村", "キムラ", "kimura"],
  ["林", "ハヤシ", "hayashi"],
  ["斎藤", "サイトウ", "saito"],
  ["清水", "シミズ", "shimizu"],
  ["山崎", "ヤマザキ", "yamazaki"],
  ["森", "モリ", "mori"],
  ["池田", "イケダ", "ikeda"],
  ["橋本", "ハシモト", "hashimoto"],
  ["阿部", "アベ", "abe"],
  ["石川", "イシカワ", "ishikawa"],
  ["山下", "ヤマシタ", "yamashita"],
  ["中島", "ナカジマ", "nakajima"],
  ["石井", "イシイ", "ishii"],
  ["小川", "オガワ", "ogawa"],
];
const GIVEN_NAMES: [string, string, string][] = [
  ["翔太", "ショウタ", "shota"],
  ["大輔", "ダイスケ", "daisuke"],
  ["健太", "ケンタ", "kenta"],
  ["拓也", "タクヤ", "takuya"],
  ["直樹", "ナオキ", "naoki"],
  ["陽介", "ヨウスケ", "yosuke"],
  ["悠真", "ユウマ", "yuma"],
  ["蓮", "レン", "ren"],
  ["湊", "ミナト", "minato"],
  ["大翔", "ヒロト", "hiroto"],
  ["誠", "マコト", "makoto"],
  ["健一", "ケンイチ", "kenichi"],
  ["和也", "カズヤ", "kazuya"],
  ["亮", "リョウ", "ryo"],
  ["隆", "タカシ", "takashi"],
  ["美咲", "ミサキ", "misaki"],
  ["陽菜", "ヒナ", "hina"],
  ["結衣", "ユイ", "yui"],
  ["さくら", "サクラ", "sakura"],
  ["葵", "アオイ", "aoi"],
  ["恵", "メグミ", "megumi"],
  ["由美", "ユミ", "yumi"],
  ["直子", "ナオコ", "naoko"],
  ["優子", "ユウコ", "yuko"],
  ["真由美", "マユミ", "mayumi"],
  ["彩", "アヤ", "aya"],
  ["愛", "アイ", "ai"],
  ["舞", "マイ", "mai"],
  ["千尋", "チヒロ", "chihiro"],
  ["凛", "リン", "rin"],
];
export const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
] as const;
/** 架空とわかる会社名にするための語（サンプル商事・テスト工業など） */
const COMPANY_HEAD = ["サンプル", "テスト", "ダミー", "見本", "架空", "仮置き", "例示", "試作"];
const COMPANY_TAIL = ["商事", "工業", "電機", "システム", "物産", "製作所", "食品", "建設", "企画", "ソリューションズ", "サービス", "技研"];
/** 文書の例示用に予約されたドメイン（実在の人には届かない） */
const DOMAINS = ["example.com", "example.jp"];

export type DummyColumn = "id" | "name" | "kana" | "email" | "phone" | "zip" | "prefecture" | "birthday" | "company";
export const DUMMY_COLUMNS: { key: DummyColumn; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "name", label: "氏名" },
  { key: "kana", label: "氏名（カナ）" },
  { key: "email", label: "メールアドレス" },
  { key: "phone", label: "電話番号" },
  { key: "zip", label: "郵便番号" },
  { key: "prefecture", label: "都道府県" },
  { key: "birthday", label: "生年月日" },
  { key: "company", label: "会社名" },
];
export type DummyRow = Record<DummyColumn, string>;

const BIRTH_FROM = Date.UTC(1950, 0, 1);
const BIRTH_TO = Date.UTC(2006, 11, 31);

/** 架空の人物データを n 件（1〜1000）作る */
export function generateDummyRows(count: number, rand: Rand = secureRandomInt): DummyRow[] {
  const n = Math.min(1000, Math.max(1, Math.floor(count || 1)));
  const width = Math.max(4, String(n).length);
  return Array.from({ length: n }, (_, i) => {
    const id = pad(i + 1, width);
    const [sk, skana, sr] = pick(SURNAMES, rand);
    const [gk, gkana, gr] = pick(GIVEN_NAMES, rand);
    const birth = new Date(BIRTH_FROM + rand((BIRTH_TO - BIRTH_FROM) / 86_400_000 + 1) * 86_400_000);
    const head = pick(COMPANY_HEAD, rand);
    const tail = pick(COMPANY_TAIL, rand);
    return {
      id,
      name: `${sk} ${gk}`,
      kana: `${skana} ${gkana}`,
      email: `${gr}.${sr}${id}@${pick(DOMAINS, rand)}`,
      // 真ん中を0000に固定した、テスト用の形だけの番号
      phone: `${pick(["090", "080", "070"], rand)}-0000-${pad(rand(10_000), 4)}`,
      // 先頭が000の郵便番号は使われていない
      zip: `000-${pad(rand(10_000), 4)}`,
      prefecture: pick(PREFECTURES, rand),
      birthday: `${birth.getUTCFullYear()}-${pad(birth.getUTCMonth() + 1)}-${pad(birth.getUTCDate())}`,
      company: rand(2) ? `株式会社${head}${tail}` : `${head}${tail}株式会社`,
    };
  });
}

const csvCell = (s: string, sep: string) => (sep === "," && /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : sep === "\t" ? s.replace(/[\t\n\r]/g, " ") : s);

export type DummyFormat = "csv" | "tsv" | "json";

export function formatDummy(rows: DummyRow[], cols: DummyColumn[], format: DummyFormat, header = true): string {
  if (format === "json")
    return JSON.stringify(
      rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c]]))),
      null,
      2,
    );
  const sep = format === "csv" ? "," : "\t";
  const lines = rows.map((r) => cols.map((c) => csvCell(r[c], sep)).join(sep));
  if (header) lines.unshift(cols.map((c) => csvCell(DUMMY_COLUMNS.find((d) => d.key === c)!.label, sep)).join(sep));
  return lines.join("\r\n");
}

/* ---------- ダミー文章 ---------- */

/** レイアウト確認用の、特に意味のない日本語の文 */
export const JA_SENTENCES = [
  "今日は朝から穏やかな天気が続いています。",
  "駅前の通りには新しいお店がいくつか並んでいます。",
  "この文章はレイアウトを確認するためのダミーテキストです。",
  "週末には家族で近くの公園まで散歩に出かけました。",
  "資料の内容は、来週の会議までにもう一度見直す予定です。",
  "季節の変わり目は体調を崩しやすいので気をつけましょう。",
  "窓を開けると、心地よい風が部屋の中に入ってきました。",
  "新しい企画について、チームで意見を出し合いました。",
  "図書館で借りた本を、少しずつ読み進めています。",
  "夕方になると、空の色がゆっくりと変わっていきます。",
  "手書きのメモを見返すと、思わぬ発見があるものです。",
  "文字の大きさや行間によって、読みやすさは大きく変わります。",
  "見出しと本文のバランスを整えると、全体が引き締まって見えます。",
  "休憩時間には温かいお茶を飲んでひと息つきます。",
  "商店街では毎年この時期に小さなお祭りが開かれます。",
  "電車の窓から見える景色が、少しずつ秋の色に変わってきました。",
  "ここに入る文章は、あとで正式な内容に差し替えてください。",
  "新しい道具に慣れるまでには、少し時間がかかるかもしれません。",
  "朝の通勤時間を使って、ニュースに目を通すようにしています。",
  "小さな工夫を積み重ねることで、作業の効率が上がりました。",
  "雨上がりの道には、ところどころに水たまりが残っていました。",
  "説明はできるだけ短く、わかりやすい言葉で書くよう心がけています。",
  "ひとつの段落には、ひとつの話題をまとめるのが基本です。",
  "このサンプルの文には特別な意味はありません。",
  "写真の横に短い説明文を添えると、内容が伝わりやすくなります。",
  "週に一度は机の上を片付けて、気持ちを切り替えています。",
  "遠くの山並みが、今日はいつもよりはっきりと見えます。",
  "会議の前に、話し合いたい点を三つに絞っておきました。",
  "台所からは、焼きたてのパンのよい香りがしてきます。",
  "表やグラフを使うと、数字の変化がひと目でわかります。",
];

export const LOREM_START = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
const LOREM_WORDS =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(
    " ",
  );

function loremSentence(rand: Rand): string {
  const n = 6 + rand(9);
  const words = Array.from({ length: n }, () => pick(LOREM_WORDS, rand));
  if (n > 9) words[3 + rand(n - 6)] += ",";
  const s = words.join(" ");
  return `${s[0].toUpperCase()}${s.slice(1)}.`;
}

export type DummyTextOptions = {
  lang: "ja" | "lorem";
  unit: "chars" | "sentences" | "paragraphs";
  count: number;
};

/** ダミーの文章を作る。chars は文字数ちょうど（改行を含まない）、paragraphs は空行で区切る */
export function generateDummyText(o: DummyTextOptions, rand: Rand = secureRandomInt): string {
  const max = o.unit === "chars" ? 20_000 : o.unit === "sentences" ? 1000 : 100;
  const n = Math.min(max, Math.max(1, Math.floor(o.count || 1)));
  const join = o.lang === "ja" ? "" : " ";
  let first = true;
  let last = "";
  const sentence = () => {
    let s: string;
    if (o.lang === "lorem") s = first ? LOREM_START : loremSentence(rand);
    else
      do s = pick(JA_SENTENCES, rand);
      while (s === last);
    first = false;
    last = s;
    return s;
  };
  if (o.unit === "sentences") return Array.from({ length: n }, sentence).join(join);
  if (o.unit === "paragraphs") return Array.from({ length: n }, () => Array.from({ length: 3 + rand(3) }, sentence).join(join)).join("\n\n");
  // 文字数ちょうどで切り、最後を句点にする。句読点の直後で切れるときは別の並びで作り直す
  const end = o.lang === "ja" ? "。" : ".";
  let chars: string[] = [];
  for (let attempt = 0; attempt < 20; attempt++) {
    let text = "";
    first = true;
    while ([...text].length < n) text += (text ? join : "") + sentence();
    chars = [...text].slice(0, n);
    if (n < 2 || chars[n - 1] === end || !/[\s、。,.]/.test(chars[n - 2])) break;
  }
  chars[n - 1] = end;
  // ラテン文字の決まった書き出しの途中で切れるときなど、作り直しても避けられないとき
  if (n > 2 && /[\s、。,.]/.test(chars[n - 2])) chars[n - 2] = o.lang === "ja" ? "す" : "a";
  return chars.join("");
}

/* ---------- SNSの文字数 ---------- */

export type SnsCounter = "x" | "grapheme";
export type SnsLimit = {
  id: string;
  name: string;
  limit: number;
  counter: SnsCounter;
  note: string;
};

/** 各サービスの上限（2026年時点で公式に案内されている値。変わることがある） */
export const SNS_LIMITS: SnsLimit[] = [
  {
    id: "x",
    name: "X（旧Twitter）",
    limit: 280,
    counter: "x",
    note: "全角は2、半角は1、URLは23として数えます（日本語だけなら140字）。有料プランでは長い投稿もできます。",
  },
  {
    id: "threads",
    name: "Threads",
    limit: 500,
    counter: "grapheme",
    note: "本文の上限です。",
  },
  {
    id: "bluesky",
    name: "Bluesky",
    limit: 300,
    counter: "grapheme",
    note: "絵文字なども見た目の1文字を1として数えます。",
  },
  {
    id: "instagram",
    name: "Instagram（キャプション）",
    limit: 2200,
    counter: "grapheme",
    note: "フィードなどの投稿のキャプションの上限です。",
  },
  {
    id: "youtube-title",
    name: "YouTube（動画タイトル）",
    limit: 100,
    counter: "grapheme",
    note: "動画のタイトルの上限です。",
  },
  {
    id: "youtube-description",
    name: "YouTube（説明欄）",
    limit: 5000,
    counter: "grapheme",
    note: "動画の説明の上限です（「<」「>」は使えません）。",
  },
];

/** 見た目の1文字（書記素）の数。絵文字の組み合わせも1と数える */
export function graphemeCount(text: string): number {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return [...new Intl.Segmenter("ja", { granularity: "grapheme" }).segment(text)].length;
  }
  return [...text].length;
}

/** ハッシュタグ（#・＃で始まり、文字・数字・_が続くもの）。単語の途中の # は数えない */
export function findHashtags(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/(^|[^\p{L}\p{N}_&/])[#＃]([\p{L}\p{M}\p{N}_]+)/gu)) out.push(`#${m[2]}`);
  return out;
}

export function countForSns(text: string, counter: SnsCounter): number {
  return counter === "x" ? xWeightedCount(text.replace(/\r\n?/g, "\n")) : graphemeCount(text.replace(/\r\n?/g, "\n"));
}

/* ---------- ビジネスメールのテンプレート ---------- */

export type MailFields = {
  company: string;
  name: string;
  myCompany: string;
  me: string;
  date: string;
  content: string;
};
export type MailTemplate = {
  id: string;
  label: string;
  subject: string;
  body: string;
  dateLabel: string;
  contentLabel: string;
};

/** 本文の {to}（宛名）{intro}（名乗り）{signature}（署名）は自動で作る */
export const MAIL_TEMPLATES: MailTemplate[] = [
  {
    id: "request",
    label: "依頼",
    dateLabel: "期限",
    contentLabel: "依頼する内容（例：お見積書の送付）",
    subject: "【ご依頼】{content}のお願い",
    body: `{to}

いつもお世話になっております。
{intro}

本日は、{content}についてお願いがあり、ご連絡いたしました。
お忙しいところ恐れ入りますが、{date}までにご対応いただけますと幸いです。

ご不明な点がございましたら、お気軽にお問い合わせください。
何卒よろしくお願いいたします。

{signature}`,
  },
  {
    id: "thanks",
    label: "お礼",
    dateLabel: "お世話になった日",
    contentLabel: "お礼の内容（例：お打ち合わせ）",
    subject: "【御礼】{content}のお礼",
    body: `{to}

いつもお世話になっております。
{intro}

{date}は、{content}の件で貴重なお時間をいただき、誠にありがとうございました。
いただいたご意見を踏まえ、引き続き準備を進めてまいります。

今後ともどうぞよろしくお願いいたします。
まずは略儀ながら、メールにて御礼申し上げます。

{signature}`,
  },
  {
    id: "reminder",
    label: "催促・リマインド",
    dateLabel: "もともとの期限",
    contentLabel: "確認したい件（例：ご請求書の送付）",
    subject: "【ご確認のお願い】{content}について",
    body: `{to}

いつもお世話になっております。
{intro}

{date}を期限としてお願いしておりました、{content}の件はいかがでしょうか。
お忙しいところ大変恐縮ですが、状況をご確認のうえ、ご連絡をいただけますと幸いです。

なお、本メールと行き違いでご対応いただいておりましたら、ご容赦ください。
何卒よろしくお願いいたします。

{signature}`,
  },
  {
    id: "apology",
    label: "お詫び",
    dateLabel: "改めて報告する日",
    contentLabel: "お詫びする件（例：納品の遅れ）",
    subject: "【お詫び】{content}について",
    body: `{to}

いつもお世話になっております。
{intro}

このたびは、{content}につきまして、多大なるご迷惑をおかけし、誠に申し訳ございません。
現在、原因を確認するとともに、再発防止に向けた対策を進めております。
{date}までに、改めて対応状況をご報告いたします。

今後このようなことのないよう細心の注意を払ってまいりますので、
何卒ご容赦くださいますようお願い申し上げます。

{signature}`,
  },
  {
    id: "schedule",
    label: "日程調整",
    dateLabel: "候補日",
    contentLabel: "打ち合わせの議題（例：新サービスのご提案）",
    subject: "【日程調整のお願い】{content}のお打ち合わせについて",
    body: `{to}

いつもお世話になっております。
{intro}

{content}の件で、お打ち合わせのお時間をいただきたく、ご連絡いたしました。
下記の候補のうち、ご都合のよい日時はございますでしょうか。

・{date}　〇時〜〇時
・〇月〇日（〇）　〇時〜〇時
・〇月〇日（〇）　〇時〜〇時

所要時間は1時間ほどを予定しております。
ご都合が合わない場合は、ご希望の日時をお知らせいただければ調整いたします。

何卒よろしくお願いいたします。

{signature}`,
  },
  {
    id: "decline",
    label: "お断り",
    dateLabel: "ご提案をいただいた日",
    contentLabel: "お断りする件（例：〇〇のご提案）",
    subject: "{content}の件につきまして",
    body: `{to}

いつもお世話になっております。
{intro}

{date}にいただいた{content}の件、誠にありがとうございました。
社内で慎重に検討いたしましたが、誠に恐縮ながら、今回は見送らせていただくことになりました。

せっかくお声がけいただいたにもかかわらず、ご期待に沿えず申し訳ございません。
また別の機会がございましたら、ぜひよろしくお願いいたします。

{signature}`,
  },
  {
    id: "greeting",
    label: "着任のご挨拶",
    dateLabel: "着任日",
    contentLabel: "担当する業務（例：貴社のご担当）",
    subject: "着任のご挨拶",
    body: `{to}

突然のご連絡失礼いたします。
{intro2}

このたび、{date}付で、{content}を担当させていただくことになりました。
前任者と同様に、お役に立てるよう精一杯努めてまいります。

改めてご挨拶に伺いたく存じますので、ご都合のよい日時をお知らせいただけますと幸いです。
今後ともどうぞよろしくお願いいたします。

{signature}`,
  },
];

const PLACEHOLDER = "〇〇";

/** "YYYY-MM-DD" → 「10月25日（日）」。空なら「〇月〇日」 */
export function mailDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return "〇月〇日";
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return `${Number(m[2])}月${Number(m[3])}日（${WEEKDAYS[d.getUTCDay()]}）`;
}

/** テンプレートに入力内容を入れる。空の欄は「〇〇」のまま残す */
export function fillMail(t: MailTemplate, f: MailFields): { subject: string; body: string } {
  const v = (s: string) => s.trim() || PLACEHOLDER;
  const name = f.name.trim().replace(/\s*(様|さま|殿)$/, "");
  const company = f.company.trim();
  const myCompany = f.myCompany.trim();
  const me = v(f.me);
  const to = `${company ? `${company}\n` : ""}${name || PLACEHOLDER}様`;
  const intro = `${myCompany ? `${myCompany}の` : ""}${me}です。`;
  const intro2 = `${myCompany ? `${myCompany}の` : ""}${me}と申します。`;
  const signature = `――――――――――――\n${myCompany ? `${myCompany}\n` : ""}${me}\n――――――――――――`;
  const map: Record<string, string> = {
    to,
    intro,
    intro2,
    signature,
    date: mailDate(f.date),
    content: v(f.content),
    company: company || PLACEHOLDER,
    name: name || PLACEHOLDER,
    me,
  };
  const fill = (s: string) => s.replace(/\{(\w+)\}/g, (_, k: string) => map[k] ?? "");
  return { subject: fill(t.subject), body: fill(t.body) };
}
