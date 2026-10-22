import { parentPort } from 'worker_threads';
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

export interface Job {
  operation: OperationId;
  a: string;
  /** Omitted for single-tab operations. */
  b?: string;
  eol: string;
}

export interface JobResult {
  content: string;
  lineCount: number;
}

parentPort?.on('message', (job: Job) => {
  const run: (a: string[], b: string[]) => string[] = operations[job.operation];
  const lines = run(toLines(job.a), job.b === undefined ? [] : toLines(job.b));
  const result: JobResult = { content: lines.join(job.eol), lineCount: lines.length };
  parentPort?.postMessage(result);
});
