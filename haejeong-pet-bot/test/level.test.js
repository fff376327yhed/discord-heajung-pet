import test from 'node:test';
import assert from 'node:assert/strict';
import { addExp, expToNext, expBar } from '../src/systems/level.js';
import { MAX_LEVEL } from '../src/config.js';

test('레벨이 높을수록 필요한 경험치가 늘어나요', () => {
  assert.ok(expToNext(2) > expToNext(1));
  assert.ok(expToNext(50) > expToNext(10));
});

test('경험치가 모자라면 레벨업 안 해요', () => {
  const t = { level: 1, exp: 0 };
  const r = addExp(t, 10);
  assert.equal(t.level, 1);
  assert.equal(t.exp, 10);
  assert.equal(r.levelsGained, 0);
});

test('한 번에 여러 레벨이 올라갈 수 있어요', () => {
  const t = { level: 1, exp: 0 };
  const r = addExp(t, 100000);
  assert.ok(r.levelsGained > 3);
  assert.ok(t.level > 1);
});

test('음수/이상한 값은 0으로 처리해요', () => {
  const t = { level: 3, exp: 5 };
  addExp(t, -500);
  addExp(t, NaN);
  assert.deepEqual(t, { level: 3, exp: 5 });
});

test('최대 레벨을 넘지 않아요', () => {
  const t = { level: MAX_LEVEL - 1, exp: 0 };
  addExp(t, 1e12);
  assert.equal(t.level, MAX_LEVEL);
  assert.equal(t.exp, 0);
  addExp(t, 1000);
  assert.equal(t.level, MAX_LEVEL);
});

test('경험치 막대 길이는 항상 같아요', () => {
  assert.equal([...expBar(0, 100)].length, 10);
  assert.equal([...expBar(100, 100)].length, 10);
  assert.equal([...expBar(9999, 100)].length, 10);
});
