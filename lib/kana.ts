/** かな・幅の変換で共通に使う表 */

const HALF = "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ｡｢｣､･";
const FULL = "ヲァィゥェォャュョッーアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン。「」、・";

/** 半角カナ（濁点・半濁点を含む）を全角カナにする */
export function halfKanaToFull(s: string): string {
  return s.replace(/([ｦ-ﾝ｡-･])([ﾞﾟ])?/g, (_m, c: string, mark?: string) => {
    let z = FULL[HALF.indexOf(c)];
    if (mark === "ﾞ") z = z === "ウ" ? "ヴ" : String.fromCharCode(z.charCodeAt(0) + 1);
    else if (mark === "ﾟ") z = String.fromCharCode(z.charCodeAt(0) + 2);
    return z;
  });
}

const FULL_TO_HALF: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  [...FULL].forEach((z, i) => (m[z] = HALF[i]));
  for (const c of "ガギグゲゴザジズゼゾダヂヅデドバビブベボ") m[c] = m[String.fromCharCode(c.charCodeAt(0) - 1)] + "ﾞ";
  for (const c of "パピプペポ") m[c] = m[String.fromCharCode(c.charCodeAt(0) - 2)] + "ﾟ";
  m["ヴ"] = "ｳﾞ";
  return m;
})();

/** 全角カナを半角カナにする（半角にない文字はそのまま） */
export function fullKanaToHalf(s: string): string {
  return s.replace(/[ァ-ヴー。「」、・]/g, (c) => FULL_TO_HALF[c] ?? c);
}

export const hiraganaToKatakana = (s: string) => s.replace(/[ぁ-ゖゝゞ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
export const katakanaToHiragana = (s: string) => s.replace(/[ァ-ヶヽヾ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
