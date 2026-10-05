// 해정펫 계산 도우미 🐾
import { randomUUID } from 'node:crypto';
import { PETS, GRADES } from '../data/pets.js';
import { HP_REGEN_PCT_PER_MIN } from '../config.js';

// 레벨에 따른 능력치 (레벨이 오르면 쑥쑥 강해져요)
export function calcStats(petId, level) {
  const b = PETS[petId].baseStats;
  return {
    hp: b.hp + level * 6,
    atk: b.atk + level * 2,
    def: b.def + level * 2,
    spd: b.spd + level,
  };
}

// 내가 가진 펫 한 마리의 "정보 카드" 만들기
export function createPetInstance(petId, level = 1) {
  if (!PETS[petId]) throw new Error(`없는 펫이에요: ${petId}`);
  return {
    uid: randomUUID(),
    petId,
    level,
    exp: 0,
    nickname: null,
    caughtAt: Date.now(),
  };
}

export function petLabel(petInstanceOrId) {
  const id = typeof petInstanceOrId === 'string' ? petInstanceOrId : petInstanceOrId.petId;
  const pet = PETS[id];
  return `${GRADES[pet.grade].emoji} ${pet.emoji} ${pet.name}`;
}

// ───────── 체력 ❤️ ─────────
// 펫 정보 카드에 hp(저장된 체력)와 hpAt(저장한 시각)이 없으면 "가득 찬 상태"예요.
// 시간이 지나면 1분마다 최대 체력의 일부씩 저절로 차올라요.
export const maxHp = (inst) => calcStats(inst.petId, inst.level).hp;

export function currentHp(inst, now = Date.now()) {
  const max = maxHp(inst);
  if (typeof inst.hp !== 'number') return max;
  const mins = Math.max(0, (now - (inst.hpAt ?? now)) / 60000);
  return Math.min(max, Math.max(0, Math.floor(inst.hp + max * HP_REGEN_PCT_PER_MIN * mins)));
}

export function setHp(inst, hp, now = Date.now()) {
  inst.hp = Math.max(0, Math.min(maxHp(inst), Math.round(hp)));
  inst.hpAt = now;
}
