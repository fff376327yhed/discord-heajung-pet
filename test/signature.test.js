// 진짜 디스코드처럼 도장(서명)을 찍어서 입구(api/interactions.js)를 시험해요 🔏
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';

process.env.DB_MODE = 'memory';

const { publicKey, privateKey } = generateKeyPairSync('ed25519');
// 디스코드는 공개키를 16진수 문자열로 줘요 (DER 끝 32바이트가 진짜 키)
process.env.DISCORD_PUBLIC_KEY = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex');

const { POST, GET } = await import('../api/interactions.js');

function signedRequest(bodyObj, { tamper = false } = {}) {
  const body = JSON.stringify(bodyObj);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = sign(null, Buffer.from(timestamp + body), privateKey).toString('hex');
  return new Request('https://example.com/api/interactions', {
    method: 'POST',
    headers: {
      'x-signature-ed25519': signature,
      'x-signature-timestamp': timestamp,
      'content-type': 'application/json',
    },
    body: tamper ? body.replace('1', '2') : body,
  });
}

test('GET은 살아있다는 인사를 해요', async () => {
  assert.equal((await GET()).status, 200);
});

test('올바른 도장이 찍힌 핑은 퐁으로 대답해요', async () => {
  const res = await POST(signedRequest({ type: 1 }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { type: 1 });
});

test('도장이 없으면 401', async () => {
  const res = await POST(new Request('https://example.com/api/interactions', { method: 'POST', body: '{"type":1}' }));
  assert.equal(res.status, 401);
});

test('내용을 몰래 바꾸면 401', async () => {
  const res = await POST(signedRequest({ type: 1 }, { tamper: true }));
  assert.equal(res.status, 401);
});
