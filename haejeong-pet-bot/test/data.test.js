import test from 'node:test';
import assert from 'node:assert/strict';
import { PETS, GRADES, STARTER_IDS } from '../src/data/pets.js';
import { LOCATION_LIST } from '../src/data/locations.js';

test('스타팅 펫이 3마리 있어요', () => {
  assert.equal(STARTER_IDS.length, 3);
});

test('모든 펫의 등급이 올바르고 확률이 0~1 사이예요', () => {
  for (const pet of Object.values(PETS)) {
    assert.ok(GRADES[pet.grade], `${pet.id} 등급 이상`);
    assert.ok(pet.catchRate > 0 && pet.catchRate <= 1, `${pet.id} catchRate 이상`);
  }
});

test('장소에 나오는 펫이 모두 도감에 있어요', () => {
  for (const loc of LOCATION_LIST) {
    assert.ok(loc.spawns.length > 0);
    for (const s of loc.spawns) {
      assert.ok(PETS[s.petId], `${loc.id} 의 ${s.petId} 가 도감에 없어요`);
      assert.ok(s.weight > 0);
      assert.ok(s.lv[0] <= s.lv[1]);
    }
    assert.ok(loc.delay[0] <= loc.delay[1]);
  }
});

test('장소는 레벨이 높을수록 경험치 배율이 커요', () => {
  for (let i = 1; i < LOCATION_LIST.length; i++) {
    assert.ok(LOCATION_LIST[i].expMultiplier >= LOCATION_LIST[i - 1].expMultiplier);
  }
});
