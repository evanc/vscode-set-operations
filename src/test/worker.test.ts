import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import { test } from 'node:test';
import { Worker } from 'node:worker_threads';
import type { Job } from '../worker';

function run(job: Job): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, '..', 'worker.js'));
    worker.once('message', (result) => {
      resolve(result);
      void worker.terminate();
    });
    worker.once('error', reject);
    worker.postMessage(job);
  });
}

test('worker runs a two-tab operation and joins with the given line ending', async () => {
  const result = await run({ operation: 'intersection', a: 'a\nb\nc\nb\n', b: 'b\nc\nd\n', eol: '\r\n' });
  assert.deepEqual(result, { content: 'b\r\nc', lineCount: 2 });
});

test('worker runs a single-tab operation', async () => {
  const result = await run({ operation: 'duplicates', a: 'a\nb\nb\na\nc', eol: '\n' });
  assert.deepEqual(result, { content: 'a\nb', lineCount: 2 });
});

test('worker compares two tabs', async () => {
  const result = await run({ operation: 'compare', a: 'a\nb\nc\nb\n', b: 'b\nc\nd\n' });
  assert.deepEqual(result, { shared: 2, onlyA: 1, onlyB: 1 });
});
