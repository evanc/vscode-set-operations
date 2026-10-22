/**
 * Splits text into lines. Lines are kept exactly as written (no trimming,
 * blank lines included, case-sensitive). A trailing newline terminates the
 * last line rather than starting an extra empty one.
 */
export function toLines(text: string): string[] {
  const lines = text.split(/\r?\n/);
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines;
}

/** Lines present in both `a` and `b`, in the order they first appear in `a`. */
export function intersection(a: string[], b: string[]): string[] {
  const inB = new Set(b);
  return unique(a.filter((line) => inB.has(line)));
}

/** Lines present in either `a` or `b`: all of `a`'s lines, then `b`'s new ones. */
export function union(a: string[], b: string[]): string[] {
  return unique([...a, ...b]);
}

/** Lines present in `a` but not in `b`, in the order they first appear in `a`. */
export function difference(a: string[], b: string[]): string[] {
  const inB = new Set(b);
  return unique(a.filter((line) => !inB.has(line)));
}

/** Lines present in exactly one of `a` and `b`: those only in `a` first, then those only in `b`. */
export function symmetricDifference(a: string[], b: string[]): string[] {
  return [...difference(a, b), ...difference(b, a)];
}

/** Each distinct line once, in the order it first appears. */
export function unique(lines: string[]): string[] {
  return [...new Set(lines)];
}

/** Lines that appear more than once, each listed once, in the order they first appear. */
export function duplicates(lines: string[]): string[] {
  const counts = new Map<string, number>();
  for (const line of lines) {
    counts.set(line, (counts.get(line) ?? 0) + 1);
  }
  return [...counts].filter(([, count]) => count > 1).map(([line]) => line);
}
