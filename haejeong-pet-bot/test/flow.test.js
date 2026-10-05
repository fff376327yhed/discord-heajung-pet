// 디스코드 없이 "시작 → 버튼 → 내정보 → 장소"를 통째로 연습해보는 테스트예요 🧪
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';

process.env.DB_MODE = 'memory';

const { handleInteraction, commandDefinitions } = await import('../src/router.js');

const user = { id: '111', username: 'tester', global_name: '테스터' };
const cmd = (name, options) => ({ type: 2, member: { user }, data: { name, options } });
const click = (customId, u = user) => ({ type: 3, member: { user: u }, data: { custom_id: customId } });

test('핑에는 퐁으로 대답해요', async () => {
  assert.deepEqual(await handleInteraction({ type: 1 }), { type: 1 });
});

test('명령어 정의가 디스코드 규칙(이름 1~32자, 설명 1~100자)을 지켜요', () => {
  for (const c of commandDefinitions) {
    assert.ok(c.name.length >= 1 && c.name.length <= 32);
    assert.ok(c.description.length >= 1 && c.description.length <= 100);
  }
});

test('시작 전에는 내정보/장소가 안내만 해줘요', async () => {
  const r1 = await handleInteraction(cmd('내정보'));
  assert.equal(r1.data.flags, 64);
  const r2 = await handleInteraction(cmd('장소'));
  assert.equal(r2.data.flags, 64);
});

test('시작 → 남이 버튼 누르면 막힘 → 내가 누르면 성공 → 두 번 못 함', async () => {
  const start = await handleInteraction(cmd('시작'));
  assert.equal(start.data.components[0].components.length, 3);

  const customId = start.data.components[0].components[0].custom_id;
  const stranger = { id: '999', username: 'other' };
  const blocked = await handleInteraction(click(customId, stranger));
  assert.equal(blocked.data.flags, 64);

  const ok = await handleInteraction(click(customId));
  assert.equal(ok.type, 7);
  assert.deepEqual(ok.data.components, []);

  const again = await handleInteraction(click(customId));
  assert.equal(again.data.flags, 64);
  const again2 = await handleInteraction(cmd('시작'));
  assert.equal(again2.data.flags, 64);
});

test('시작 후 내정보에 레벨/골드/대표 펫이 나와요', async () => {
  const r = await handleInteraction(cmd('내정보'));
  const embed = r.data.embeds[0];
  assert.match(embed.title, /테스터/);
  assert.match(embed.description, /Lv\.1/);
  const names = embed.fields.map((f) => f.name).join(' ');
  assert.match(names, /골드/);
  assert.match(names, /대표 펫/);
});

test('다른 사람 정보 보기: 모험 전인 사람은 안내만', async () => {
  const r = await handleInteraction(cmd('내정보', [{ name: '유저', value: '555' }]));
  assert.equal(r.data.flags, 64);
});

test('장소: Lv.1에는 초원만 열려 있어요', async () => {
  const r = await handleInteraction(cmd('장소'));
  const text = r.data.embeds[0].description;
  assert.match(text, /🔓.*초록 초원/);
  assert.match(text, /🔒.*속삭이는 숲/);
  assert.ok(text.length < 4096);
});

test('모르는 버튼은 정중하게 거절해요', async () => {
  const r = await handleInteraction(click('nope:1'));
  assert.equal(r.data.flags, 64);
});
