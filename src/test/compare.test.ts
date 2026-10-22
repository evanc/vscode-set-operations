import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { compare, describeComparison } from '../compare';

test('compare counts distinct lines, ignoring repeats', () => {
  assert.deepEqual(compare(['a', 'b', 'c', 'b'], ['b', 'c', 'd', 'd']), { shared: 2, onlyA: 1, onlyB: 1 });
  assert.deepEqual(compare([], []), { shared: 0, onlyA: 0, onlyB: 0 });
});

test('describeComparison names the relationship, then the counts', () => {
  const describe = (a: string[], b: string[]) => describeComparison(compare(a, b), 'a.txt', 'b.txt');

  assert.equal(
    describe(['x', 'y'], ['y', 'z']),
    '"a.txt" and "b.txt" share some lines. 1 shared · 1 only in "a.txt" · 1 only in "b.txt".'
  );
  assert.match(describe(['x', 'y'], ['y', 'x', 'x']), /^"a\.txt" and "b\.txt" have the same lines/);
  assert.match(describe(['x'], ['x', 'y']), /^Every line in "a\.txt" is also in "b\.txt"\./);
  assert.match(describe(['x', 'y'], ['x']), /^Every line in "b\.txt" is also in "a\.txt"\./);
  assert.match(describe(['x'], ['y']), /^"a\.txt" and "b\.txt" have no lines in common\./);
  assert.match(describe([], ['y']), /^"a\.txt" is empty\./);
  assert.match(describe(['x'], []), /^"b\.txt" is empty\./);
  assert.match(describe([], []), /^Both are empty\./);
});
