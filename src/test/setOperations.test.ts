import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  difference,
  duplicates,
  intersection,
  symmetricDifference,
  toLines,
  union,
  unique,
} from '../setOperations';

test('toLines keeps lines exactly as written', () => {
  assert.deepEqual(toLines('  a \n\nA\na'), ['  a ', '', 'A', 'a']);
});

test('toLines ends lines at CRLF, LF, or a lone CR', () => {
  assert.deepEqual(toLines('a\r\nb\rc\nd'), ['a', 'b', 'c', 'd']);
});

test('toLines treats a trailing newline as a terminator', () => {
  assert.deepEqual(toLines('a\nb\n'), ['a', 'b']);
  assert.deepEqual(toLines('a\r\nb\r\n'), ['a', 'b']);
  assert.deepEqual(toLines(''), []);
  assert.deepEqual(toLines('\n'), ['']);
});

const a = ['a', 'b', 'c', 'b'];
const b = ['b', 'c', 'd', 'd'];

test('intersection', () => {
  assert.deepEqual(intersection(a, b), ['b', 'c']);
});

test('union', () => {
  assert.deepEqual(union(a, b), ['a', 'b', 'c', 'd']);
});

test('difference', () => {
  assert.deepEqual(difference(a, b), ['a']);
  assert.deepEqual(difference(b, a), ['d']);
});

test('symmetric difference', () => {
  assert.deepEqual(symmetricDifference(a, b), ['a', 'd']);
  assert.deepEqual(symmetricDifference(b, a), ['d', 'a']);
});

test('unique', () => {
  assert.deepEqual(unique(['a', 'b', 'a', '', 'b', '']), ['a', 'b', '']);
});

test('duplicates are listed once, in order of first appearance', () => {
  assert.deepEqual(duplicates(['a', 'b', 'b', 'a', 'c', '', ' ', '']), ['a', 'b', '']);
  assert.deepEqual(duplicates(['a', 'b']), []);
});

test('comparison is exact: case and whitespace matter', () => {
  assert.deepEqual(intersection(['x', 'X', 'x '], ['x']), ['x']);
});
