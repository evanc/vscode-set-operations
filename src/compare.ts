export interface Comparison {
  /** Distinct lines that appear in both A and B. */
  shared: number;
  /** Distinct lines that appear only in A. */
  onlyA: number;
  /** Distinct lines that appear only in B. */
  onlyB: number;
}

/** Counts the distinct lines shared by `a` and `b`, and those only in each. */
export function compare(a: string[], b: string[]): Comparison {
  const inA = new Set(a);
  const inB = new Set(b);
  let shared = 0;
  for (const line of inA) {
    if (inB.has(line)) {
      shared++;
    }
  }
  return { shared, onlyA: inA.size - shared, onlyB: inB.size - shared };
}

/** One sentence on how A and B relate, followed by the counts. */
export function describeComparison(comparison: Comparison, nameA: string, nameB: string): string {
  const { shared, onlyA, onlyB } = comparison;
  const a = `"${nameA}"`;
  const b = `"${nameB}"`;

  let relation: string;
  if (shared + onlyA === 0 && shared + onlyB === 0) {
    relation = 'Both are empty.';
  } else if (shared + onlyA === 0) {
    relation = `${a} is empty.`;
  } else if (shared + onlyB === 0) {
    relation = `${b} is empty.`;
  } else if (onlyA === 0 && onlyB === 0) {
    relation = `${a} and ${b} have the same lines (ignoring order and repeats).`;
  } else if (onlyA === 0) {
    relation = `Every line in ${a} is also in ${b}.`;
  } else if (onlyB === 0) {
    relation = `Every line in ${b} is also in ${a}.`;
  } else if (shared === 0) {
    relation = `${a} and ${b} have no lines in common.`;
  } else {
    relation = `${a} and ${b} share some lines.`;
  }

  const count = (n: number) => n.toLocaleString();
  return `${relation} ${count(shared)} shared · ${count(onlyA)} only in ${a} · ${count(onlyB)} only in ${b}.`;
}
