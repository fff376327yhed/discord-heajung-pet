// 해정펫 계산 도우미 🐾
import { randomUUID } from 'node:crypto';
import { PETS, GRADES } from '../data/pets.js';

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
