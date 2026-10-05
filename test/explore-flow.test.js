// 디스코드 버튼을 실제로 누르는 것처럼 "탐험 → 살펴보기 → 잡기"를 통째로 연습해요 🧪
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_MODE = 'memory';

const { handleInteraction, commandDefinitions } = await import('../src/router.js');
const { createPlayer, getPlayer, savePlayer } = await import('../src/db.js');
const { buildNewPlayer } = await import('../src/systems/player.js');

const user = { id: '777', username: 'tester', global_name: '테스터' };
const cmd = (name, options) => ({ type: 2, member: { user }, data: { name, options } });
const click = (customId, u = user) => ({ type: 3, member: { user: u }, data: { custom_id: customId } });
const buttons = (res) => res.data.components[0].components;
const find = (res, action) => buttons(res).find((b) => b.custom_id.startsWith(`explore:${action}:`));

test('탐험 명령어 정의가 디스코드 규칙을 지켜요', () => {
  const def = commandDefinitions.find((c) => c.name === '탐험');
  assert.ok(def);
  const opt = def.options[0];
  assert.equal(opt.type, 3);
  assert.ok(opt.choices.length >= 5 && opt.choices.length <= 25);
  for (const c of opt.choices) assert.ok(c.name.length <= 100 && c.value.length <= 100);
});

test('시작 전에는 탐험할 수 없어요', async () => {
  const r = await handleInteraction(cmd('탐험', [{ name: '장소', value: 'meadow' }]));
  assert.equal(r.data.flags, 64);
});

test('탐험 → 기다림 → 등장 → 잡기까지 한 바퀴', async () => {
  await createPlayer(user.id, buildNewPlayer(user.id, '테스터', 'leaf_bun'));

  // 잠긴 장소
  const locked = await handleInteraction(cmd('탐험', [{ name: '장소', value: 'volcano' }]));
  assert.equal(locked.data.flags, 64);

  // 탐험 시작
  const started = await handleInteraction(cmd('탐험', [{ name: '장소', value: 'meadow' }]));
  assert.equal(started.type, 4);
  const look = find(started, 'look');
  assert.ok(look && find(started, 'quit'));

  // 남이 누르면 막힘
  const blocked = await handleInteraction(click(look.custom_id, { id: '999', username: 'x' }));
  assert.equal(blocked.data.flags, 64);

  // 너무 일찍 누르면 기다리라고 해요 (메시지가 바뀌고 버튼 유지)
  const early = await handleInteraction(click(look.custom_id));
  assert.equal(early.type, 7);
  assert.match(early.data.embeds[0].description, /아직 아무것도/);
  assert.ok(find(early, 'look'));

  // 같은 장소로 /탐험 또 하면 이어서
  const resumed = await handleInteraction(cmd('탐험', [{ name: '장소', value: 'meadow' }]));
  assert.match(resumed.data.embeds[0].description, /이미 탐험 중/);

  // 시간을 앞당기기 (기다리는 시간을 건너뛰어요)
  const p = await getPlayer(user.id);
  p.exploration.appearAt = 0;
  await savePlayer(user.id, p);

  const realRandom = Math.random;
  Math.random = () => 0; // 항상 첫 번째 펫, 항상 잡기 성공
  try {
    const appeared = await handleInteraction(click(look.custom_id));
    assert.equal(appeared.type, 7);
    assert.match(appeared.data.embeds[0].title, /나타났다/);
    assert.equal(buttons(appeared).length, 3);

    // 싸우기는 아직 준비 중
    const fight = await handleInteraction(click(find(appeared, 'fight').custom_id));
    assert.equal(fight.data.flags, 64);
    assert.ok((await getPlayer(user.id)).exploration.encounter);

    // 잡기!
    const caught = await handleInteraction(click(find(appeared, 'catch').custom_id));
    assert.match(caught.data.embeds[0].title, /잡았다/);
    assert.deepEqual(caught.data.components, []);
  } finally {
    Math.random = realRandom;
  }

  const after = await getPlayer(user.id);
  assert.equal(after.exploration, null);
  assert.equal(after.pets.length, 2);
  assert.equal(after.inventory.haejeong_ball, 4);
  assert.ok(after.level > 1 || after.exp > 0);

  // 예전 버튼을 또 누르면 "이미 지나간 탐험"
  const stale = await handleInteraction(click(look.custom_id));
  assert.match(stale.data.embeds[0].title, /지나간 탐험/);
  assert.equal(after.pets.length, (await getPlayer(user.id)).pets.length);
});

test('무시하기와 그만두기', async () => {
  const p = await getPlayer(user.id);
  p.level = 5; // 숲도 갈 수 있게
  await savePlayer(user.id, p);

  const s = await handleInteraction(cmd('탐험', [{ name: '장소', value: 'forest' }]));
  const quit = await handleInteraction(click(find(s, 'quit').custom_id));
  assert.match(quit.data.embeds[0].title, /탐험을 마쳤어요/);
  assert.equal((await getPlayer(user.id)).exploration, null);
});

test('해정볼이 0개면 안내만 하고 펫은 그대로예요', async () => {
  const p = await getPlayer(user.id);
  p.inventory.haejeong_ball = 0;
  await savePlayer(user.id, p);

  const s = await handleInteraction(cmd('탐험', [{ name: '장소', value: 'meadow' }]));
  const id = find(s, 'look').custom_id.split(':')[3];
  const p2 = await getPlayer(user.id);
  p2.exploration.appearAt = 0;
  p2.exploration.encounter = { petId: 'slime', level: 1 };
  await savePlayer(user.id, p2);

  const r = await handleInteraction(click(`explore:catch:${user.id}:${id}`));
  assert.equal(r.data.flags, 64);
  assert.match(r.data.content, /없어요/);
  assert.ok((await getPlayer(user.id)).exploration.encounter);
});
