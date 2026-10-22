/**
 * Splits text into lines. Lines are kept exactly as written (no trimming,
 * blank lines included, case-sensitive). Like VS Code, CRLF, LF, and lone CR all
 * end a line. A trailing line ending terminates the last line rather than
 * starting an extra empty one.
 */
export function toLines(text: string): string[] {
  const lines = text.split(/\r\n?|\n/);
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines;
}

/** Lines present in both `a` and `b`, in the order they first appear in `a`. */
export function intersection(a: string[], b: string[]): string[] {
  const pending = new Set(b);
  const result: string[] = [];
  for (const line of a) {
    // Deleting as we go means each shared line is emitted once.
    if (pending.delete(line)) {
      result.push(line);
    }
  }
  return result;
}

/** Lines present in either `a` or `b`: all of `a`'s lines, then `b`'s new ones. */
export function union(a: string[], b: string[]): string[] {
  const all = new Set(a);
  for (const line of b) {
    all.add(line);
  }
  return [...all];
}

/** Lines present in `a` but not in `b`, in the order they first appear in `a`. */
export function difference(a: string[], b: string[]): string[] {
  // Lines to skip: everything in `b`, plus each line of `a` once it's been emitted.
  const skip = new Set(b);
  const result: string[] = [];
  for (const line of a) {
    if (!skip.has(line)) {
      skip.add(line);
      result.push(line);
    }
  }
  return result;
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
  const result: string[] = [];
  for (const [line, count] of counts) {
    if (count > 1) {
      result.push(line);
    }
  }
  return result;
}
