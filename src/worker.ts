import { parentPort } from 'worker_threads';
import { compare, Comparison } from './compare';
import {
  difference,
  duplicates,
  intersection,
  symmetricDifference,
  toLines,
  union,
  unique,
} from './setOperations';

// Runs one set operation off the extension host's main thread, which every
// extension shares, so large inputs don't freeze the rest of VS Code.

const operations = {
  intersection,
  union,
  difference,
  symmetricDifference,
  unique,
  duplicates,
} satisfies Record<string, (a: string[], b: string[]) => string[]>;

export type OperationId = keyof typeof operations;

/** Produces the lines of a result. */
export interface LinesJob {
  operation: OperationId;
  a: string;
  /** Omitted for single-tab operations. */
  b?: string;
  eol: string;
}

export interface LinesResult {
  content: string;
  lineCount: number;
}

/** Produces a Comparison of A and B. */
export interface CompareJob {
  operation: 'compare';
  a: string;
  b: string;
}

export type Job = LinesJob | CompareJob;

parentPort?.on('message', (job: Job) => {
  if (job.operation === 'compare') {
    const result: Comparison = compare(toLines(job.a), toLines(job.b));
    parentPort?.postMessage(result);
    return;
  }
  const run: (a: string[], b: string[]) => string[] = operations[job.operation];
  const lines = run(toLines(job.a), job.b === undefined ? [] : toLines(job.b));
  const result: LinesResult = { content: lines.join(job.eol), lineCount: lines.length };
  parentPort?.postMessage(result);
});
