// 전투 규칙 ⚔️ (디스코드와 상관없는 "순수한 게임 규칙")
//
// 전투 흐름: 야생 펫 등장 → [싸우기] → (턴마다 [공격] / [잡기] / [도망]) → 승리 / 패배 / 무승부
// player.exploration.battle = { myHp, myMax, wildHp, wildMax, round }
// 한 턴 = 속도가 빠른 쪽이 먼저 때리고, 이어서 상대가 때려요 (속도가 같으면 내 펫이 먼저!)

import { LOCATIONS, LOCATION_LIST } from '../data/locations.js';
import { PETS } from '../data/pets.js';
import { BATTLE_MAX_ROUNDS, CRIT_CHANCE, GOLD_PER_YIELD, WIN_TRAINER_EXP_MULT, WIN_PET_EXP_MULT } from '../config.js';
import { addExp } from './level.js';
import { calcStats } from './pet.js';
import { getMainPet } from './player.js';
import { snapshot } from './explore.js';

// 데미지 = 공격력 - 방어력의 절반 (최소 공격력의 25%) × 랜덤(0.85~1.15), 가끔 급소(×1.5)
export function calcDamage(atk, def, rng = Math.random) {
  const base = Math.max(atk * 0.25, atk - def * 0.5);
  const variance = 0.85 + rng() * 0.3;
  const crit = rng() < CRIT_CHANCE;
  return { dmg: Math.max(1, Math.round(base * variance * (crit ? 1.5 : 1))), crit };
}

// [싸우기] — 전투 시작 (이미 시작했으면 이어서)
export function startBattle(player, id, now = Date.now()) {
  const ex = player.exploration;
  if (!ex || ex.id !== id || !ex.encounter) return { kind: 'expired' };
  if (ex.battle) return { kind: 'continue', snap: snapshot(player, now) };

  const main = getMainPet(player);
  const mine = calcStats(main.petId, main.level);
  const wild = calcStats(ex.encounter.petId, ex.encounter.level);
  ex.battle = { myHp: mine.hp, myMax: mine.hp, wildHp: wild.hp, wildMax: wild.hp, round: 0 };
  return { kind: 'started', commit: true, snap: snapshot(player, now) };
}

// [공격] — 한 턴 진행
export function battleTurn(player, id, now = Date.now(), rng = Math.random) {
  const ex = player.exploration;
  if (!ex || ex.id !== id || !ex.encounter) return { kind: 'expired' };
  if (!ex.battle) return { kind: 'no_battle' };

  const b = ex.battle;
  const main = getMainPet(player);
  const myPet = PETS[main.petId];
  const myName = main.nickname ?? myPet.name;
  const wildInfo = ex.encounter;
  const wildPet = PETS[wildInfo.petId];
  const mine = calcStats(main.petId, main.level);
  const wild = calcStats(wildInfo.petId, wildInfo.level);

  const order = mine.spd >= wild.spd ? ['me', 'wild'] : ['wild', 'me'];
  const log = [];
  for (const who of order) {
    if (b.myHp <= 0 || b.wildHp <= 0) break; // 이미 쓰러졌으면 반격 못 해요
    if (who === 'me') {
      const { dmg, crit } = calcDamage(mine.atk, wild.def, rng);
      b.wildHp = Math.max(0, b.wildHp - dmg);
      log.push(`${myPet.emoji} ${myName}의 공격! ${crit ? '💥 급소! ' : ''}${wildPet.name}에게 **${dmg}** 데미지`);
    } else {
      const { dmg, crit } = calcDamage(wild.atk, mine.def, rng);
      b.myHp = Math.max(0, b.myHp - dmg);
      log.push(`${wildPet.emoji} ${wildPet.name}의 공격! ${crit ? '💥 급소! ' : ''}${myName}에게 **${dmg}** 데미지`);
    }
  }
  b.round += 1;

  // 승리!
  if (b.wildHp <= 0) {
    const loc = LOCATIONS[ex.locationId];
    const gold = Math.max(1, Math.round(wildPet.expYield * GOLD_PER_YIELD * (0.8 + rng() * 0.4)));
    const trainerExp = Math.round(wildPet.expYield * loc.expMultiplier * WIN_TRAINER_EXP_MULT);
    const petExp = Math.round(wildPet.expYield * loc.expMultiplier * WIN_PET_EXP_MULT);

    player.gold += gold;
    const before = player.level;
    const t = addExp(player, trainerExp);
    const p = addExp(main, petExp);
    const unlocked = LOCATION_LIST.filter((l) => l.minLevel > before && l.minLevel <= player.level);

    player.exploration = null;
    return {
      kind: 'won', commit: true, log,
      wildPetId: wildInfo.petId, wildLevel: wildInfo.level,
      myPetId: main.petId, myName,
      gold, trainerExp, petExp,
      levelsGained: t.levelsGained, newLevel: player.level,
      petLevelsGained: p.levelsGained, petNewLevel: main.level,
      unlocked,
    };
  }

  // 패배... (골드를 잃지는 않아요)
  if (b.myHp <= 0) {
    player.exploration = null;
    return { kind: 'lost', commit: true, log, wildPetId: wildInfo.petId, myName };
  }

  // 너무 오래 끌면 야생 펫이 떠나요
  if (b.round >= BATTLE_MAX_ROUNDS) {
    player.exploration = null;
    return { kind: 'draw', commit: true, log, wildPetId: wildInfo.petId };
  }

  return { kind: 'continue', commit: true, log, snap: snapshot(player, now) };
}
