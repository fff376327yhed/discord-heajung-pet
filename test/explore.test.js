import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNewPlayer } from '../src/systems/player.js';
import { startExploration, lookAround, attemptCatch, leave, catchChance, snapshot } from '../src/systems/explore.js';
import { LOCATIONS } from '../src/data/locations.js';
import { PETS } from '../src/data/pets.js';
import { weightedPick, randInt } from '../src/utils/random.js';

const newPlayer = () => buildNewPlayer('u1', '테스터', 'pyro_cat');
// 정해진 숫자만 차례로 내놓는 가짜 주사위
const dice = (...nums) => { let i = 0; return () => nums[Math.min(i++, nums.length - 1)]; };

test('탐험을 시작하면 장소의 delay 범위 안에서 대기 시간이 정해져요', () => {
  const [min, max] = LOCATIONS.meadow.delay;
  const a = newPlayer(); startExploration(a, 'meadow', 1000, dice(0));
  assert.equal(a.exploration.appearAt, 1000 + min * 1000);
  const b = newPlayer(); startExploration(b, 'meadow', 1000, dice(0.999999));
  assert.equal(b.exploration.appearAt, 1000 + max * 1000);
});

test('레벨이 모자라면 잠긴 장소는 못 가요', () => {
  const p = newPlayer();
  const r = startExploration(p, 'forest');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'locked');
  assert.equal(p.exploration, null);
  assert.equal(startExploration(p, 'nowhere').reason, 'unknown_location');
});

test('이미 탐험 중이면 대기 시간을 다시 뽑지 못해요', () => {
  const p = newPlayer();
  startExploration(p, 'meadow', 1000, dice(0));
  const before = JSON.stringify(p.exploration);
  const r = startExploration(p, 'meadow', 5000, dice(0.9));
  assert.equal(r.resumed, true);
  assert.equal(r.commit, false);
  assert.equal(JSON.stringify(p.exploration), before);
});

test('시간이 안 지났으면 waiting, 지나면 펫이 나타나고 같은 펫이 유지돼요', () => {
  const p = newPlayer();
  startExploration(p, 'meadow', 0, dice(0)); // 5초 뒤
  const id = p.exploration.id;
  assert.equal(lookAround(p, id, 1000).kind, 'waiting');
  assert.equal(lookAround(p, id, 1000).snap.remainingSec, 4);

  const r = lookAround(p, id, 6000, dice(0, 0));
  assert.equal(r.kind, 'appeared');
  const { petId, level } = p.exploration.encounter;
  assert.ok(LOCATIONS.meadow.spawns.some((s) => s.petId === petId));
  assert.ok(level >= 1);

  const again = lookAround(p, id, 7000, dice(0.99, 0.99));
  assert.equal(again.kind, 'encounter');
  assert.deepEqual(p.exploration.encounter, { petId, level });
});

test('다른 id(오래된 버튼)는 expired', () => {
  const p = newPlayer();
  startExploration(p, 'meadow', 0, dice(0));
  assert.equal(lookAround(p, 'zzzz', 99999).kind, 'expired');
  assert.equal(attemptCatch(p, 'zzzz').kind, 'expired');
  assert.equal(leave(p, 'zzzz').kind, 'expired');
  assert.equal(lookAround(newPlayer(), 'x').kind, 'expired');
});

function withEncounter(petId = 'slime', level = 1) {
  const p = newPlayer();
  startExploration(p, 'meadow', 0, dice(0));
  p.exploration.encounter = { petId, level };
  return p;
}

test('잡기 성공: 해정볼 -1, 펫 추가, 도감, 경험치, 탐험 종료', () => {
  const p = withEncounter('slime', 2);
  const r = attemptCatch(p, p.exploration.id, 0, dice(0));
  assert.equal(r.kind, 'caught');
  assert.equal(p.inventory.haejeong_ball, 4);
  assert.equal(p.pets.length, 2);
  assert.equal(p.pets[1].petId, 'slime');
  assert.equal(p.pets[1].level, 2);
  assert.equal(p.dex.slime, true);
  assert.equal(r.isNew, true);
  assert.ok(p.exp > 0 || p.level > 1);
  assert.equal(p.exploration, null);
});

test('같은 종류를 또 잡으면 새 도감이 아니에요', () => {
  const p = withEncounter('slime');
  p.dex.slime = true;
  assert.equal(attemptCatch(p, p.exploration.id, 0, dice(0)).isNew, false);
});

test('잡기 실패 + 도망 / 실패 + 남아있음', () => {
  const a = withEncounter();
  const fled = attemptCatch(a, a.exploration.id, 0, dice(0.99, 0)); // 실패, 도망
  assert.equal(fled.kind, 'fled');
  assert.equal(a.exploration, null);
  assert.equal(a.inventory.haejeong_ball, 4);
  assert.equal(a.pets.length, 1);

  const b = withEncounter();
  const esc = attemptCatch(b, b.exploration.id, 0, dice(0.99, 0.99));
  assert.equal(esc.kind, 'escaped');
  assert.ok(b.exploration.encounter);
  assert.equal(b.inventory.haejeong_ball, 4);
});

test('해정볼이 없으면 못 던지고 아무것도 안 바뀌어요', () => {
  const p = withEncounter();
  p.inventory.haejeong_ball = 0;
  const r = attemptCatch(p, p.exploration.id, 0, dice(0));
  assert.equal(r.kind, 'no_ball');
  assert.equal(p.pets.length, 1);
  assert.ok(p.exploration.encounter);
});

test('레벨업으로 새 장소가 열리면 알려줘요', () => {
  const p = withEncounter('bee', 5);
  p.exp = 250; // Lv.5 직전 근처까지 모아둔 상태
  p.level = 4;
  p.exp = 111; // Lv.4 → 5 필요 경험치(112)에서 1 모자람
  const r = attemptCatch(p, p.exploration.id, 0, dice(0));
  assert.equal(r.kind, 'caught');
  assert.equal(p.level, 5);
  assert.deepEqual(r.unlocked.map((l) => l.id), ['forest']);
});

test('무시하기 / 그만두기', () => {
  const a = withEncounter();
  assert.equal(leave(a, a.exploration.id).kind, 'ignored');
  assert.equal(a.exploration, null);
  const b = newPlayer();
  startExploration(b, 'meadow', 0, dice(0));
  assert.equal(leave(b, b.exploration.id).kind, 'quit');
});

test('잡을 확률은 0.02~0.95 사이이고, 레벨 차이가 크면 낮아져요', () => {
  for (const pet of Object.values(PETS)) {
    for (const [w, m] of [[1, 1], [50, 1], [10, 40]]) {
      const c = catchChance(pet.id, w, m);
      assert.ok(c >= 0.02 && c <= 0.95);
    }
  }
  assert.ok(catchChance('fox', 30, 1) < catchChance('fox', 5, 5));
});

test('weightedPick: 주사위 값에 따라 알맞은 칸이 뽑혀요', () => {
  const items = [{ w: 50, n: 'a' }, { w: 40, n: 'b' }, { w: 10, n: 'c' }];
  const pick = (x) => weightedPick(items, (i) => i.w, () => x).n;
  assert.equal(pick(0), 'a');
  assert.equal(pick(0.49), 'a');
  assert.equal(pick(0.5), 'b');
  assert.equal(pick(0.95), 'c');
  assert.equal(pick(0.999999), 'c');
});

test('randInt 범위', () => {
  assert.equal(randInt(3, 7, () => 0), 3);
  assert.equal(randInt(3, 7, () => 0.999999), 7);
});

test('snapshot: 탐험 안 하면 idle', () => {
  assert.equal(snapshot(newPlayer()).state, 'idle');
});
