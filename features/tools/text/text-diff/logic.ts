export type DiffOp = { type: "same" | "added" | "removed"; text: string };

/** 行単位の差分（最長共通部分列）。それぞれ4,000行程度まで */
export function diffLines(before: string, after: string, ignoreWhitespace = false): DiffOp[] | null {
  const A = before.replace(/\r/g, "").split("\n");
  const B = after.replace(/\r/g, "").split("\n");
  const n = A.length;
  const m = B.length;
  if (n * m > 16_000_000) return null;
  const key = (s: string) => (ignoreWhitespace ? s.trim() : s);
  const W = m + 1;
  const L = new Uint32Array((n + 1) * (m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) L[i * W + j] = key(A[i]) === key(B[j]) ? L[(i + 1) * W + j + 1] + 1 : Math.max(L[(i + 1) * W + j], L[i * W + j + 1]);
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (key(A[i]) === key(B[j])) {
      ops.push({ type: "same", text: B[j] });
      i++;
      j++;
    } else if (L[(i + 1) * W + j] >= L[i * W + j + 1]) ops.push({ type: "removed", text: A[i++] });
    else ops.push({ type: "added", text: B[j++] });
  }
  while (i < n) ops.push({ type: "removed", text: A[i++] });
  while (j < m) ops.push({ type: "added", text: B[j++] });
  return ops;
}

/** 書き換えられた1行の、変わった部分の位置（先頭と末尾の一致を除いた範囲） */
export function changedRange(a: string, b: string): { a: [number, number]; b: [number, number] } {
  const x = [...a];
  const y = [...b];
  let p = 0;
  while (p < x.length && p < y.length && x[p] === y[p]) p++;
  let s = 0;
  while (s < x.length - p && s < y.length - p && x[x.length - 1 - s] === y[y.length - 1 - s]) s++;
  return { a: [p, x.length - s], b: [p, y.length - s] };
}
