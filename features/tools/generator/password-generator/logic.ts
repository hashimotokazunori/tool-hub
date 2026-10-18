export type PasswordOptions = {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  /** 0 O o l 1 I など紛らわしい文字を除く */
  excludeAmbiguous: boolean;
};

const AMBIGUOUS = /[0Oo1lI]/g;
const SETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*-_=+?",
};

export function charsets(o: PasswordOptions): string[] {
  const strip = (s: string) => (o.excludeAmbiguous ? s.replace(AMBIGUOUS, "") : s);
  const out: string[] = [];
  if (o.upper) out.push(strip(SETS.upper));
  if (o.lower) out.push(strip(SETS.lower));
  if (o.digits) out.push(strip(SETS.digits));
  if (o.symbols) out.push(SETS.symbols);
  return out;
}

/** 0以上 n未満の整数を偏りなく返す（暗号論的乱数） */
export function secureRandomInt(n: number): number {
  const a = new Uint32Array(1);
  const limit = Math.floor(2 ** 32 / n) * n;
  do crypto.getRandomValues(a);
  while (a[0] >= limit);
  return a[0] % n;
}

/** 選んだ文字種を必ず1文字以上含むパスワードを作る */
export function generatePassword(o: PasswordOptions, randomInt: (n: number) => number = secureRandomInt): string {
  const sets = charsets(o);
  if (sets.length === 0) return "";
  const length = Math.max(sets.length, Math.min(128, Math.floor(o.length)));
  const all = sets.join("");
  const chars = sets.map((s) => s[randomInt(s.length)]);
  while (chars.length < length) chars.push(all[randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

/** 強さの目安（ビット数） */
export function entropyBits(o: PasswordOptions): number {
  const size = charsets(o).join("").length;
  return size ? Math.round(Math.max(1, Math.floor(o.length)) * Math.log2(size)) : 0;
}

export function strengthLabel(bits: number): "弱い" | "ふつう" | "強い" | "とても強い" {
  return bits < 40 ? "弱い" : bits < 64 ? "ふつう" : bits < 100 ? "強い" : "とても強い";
}
