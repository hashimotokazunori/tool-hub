/** QRコードの文字列づくりと、SVG の組み立て */

/** Wi-Fi 接続用 QR の文字列。\ ; , : " は前に \ を付ける */
export function wifiPayload(ssid: string, password: string, security: "WPA" | "WEP" | "nopass", hidden = false): string {
  const esc = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");
  return `WIFI:T:${security};S:${esc(ssid)};${security === "nopass" ? "" : `P:${esc(password)};`}${hidden ? "H:true;" : ""};`;
}

/** 黒いマスを横につながった線として描く SVG（ファイルが小さくなる） */
export function qrSvg(size: number, isDark: (row: number, col: number) => boolean, opts: { margin: number; fg: string; bg: string }): string {
  const m = opts.margin;
  const full = size + m * 2;
  let d = "";
  for (let r = 0; r < size; r++) {
    let c = 0;
    while (c < size) {
      if (!isDark(r, c)) {
        c++;
        continue;
      }
      const start = c;
      while (c < size && isDark(r, c)) c++;
      d += `M${start + m} ${r + m}h${c - start}v1h-${c - start}z`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${full} ${full}" shape-rendering="crispEdges"><rect width="${full}" height="${full}" fill="${opts.bg}"/><path d="${d}" fill="${opts.fg}"/></svg>`;
}

/** 色の明るさの差（WCAG のコントラスト比）。読み取りやすさの目安に使う */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const n = parseInt(hex.replace("#", ""), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
