// 전투 규칙 ⚔️ (디스코드와 상관없는 "순수한 게임 규칙")
//
// 전투 흐름: 야생 펫 등장 → [싸우기] → (턴마다 [공격] / [잡기] / [회복] / [도망]) → 승리 / 패배 / 무승부
// player.exploration.battle = { myHp, myMax, wildHp, wildMax, round }
// 한 턴 = 속도가 빠른 쪽이 먼저 때리고, 이어서 상대가 때려요 (속도가 같으면 내 펫이 먼저!)
//
// ❤️ 체력은 전투가 끝나도 이어져요! 매 턴 끝에 대표 펫의 체력(hp)을 저장해요.
//    체력이 0이면 싸울 수 없어요 → 회복약, 시간 경과(자동 회복), 다른 펫로 교체로 해결해요.

import { LOCATIONS, LOCATION_LIST } from '../data/locations.js';
import { PETS } from '../data/pets.js';
import { BATTLE_MAX_ROUNDS, CRIT_CHANCE, GOLD_PER_YIELD, WIN_TRAINER_EXP_MULT, WIN_PET_EXP_MULT } from '../config.js';
import { addExp } from './level.js';
import { calcStats, currentHp, maxHp, setHp } from './pet.js';
import { getMainPet } from './player.js';
import { snapshot } from './explore.js';
import { pickPotion } from './use.js';

// 데미지 = 공격력 - 방어력의 절반 (최소 공격력의 25%) × 랜덤(0.85~1.15), 가끔 급소(×1.5)
export function calcDamage(atk, def, rng = Math.random) {
  const base = Math.max(atk * 0.25, atk - def * 0.5);
  const variance = 0.85 + rng() * 0.3;
  const crit = rng() < CRIT_CHANCE;
  return { dmg: Math.max(1, Math.round(base * variance * (crit ? 1.5 : 1))), crit };
}

// 이번 전투에 필요한 정보를 한곳에 모아요
function context(player, ex) {
  const main = getMainPet(player);
  const myPet = PETS[main.petId];
  const wildInfo = ex.encounter;
  return {
    main,
    myPet,
    myName: main.nickname ?? myPet.name,
    wildInfo,
    wildPet: PETS[wildInfo.petId],
    mine: calcStats(main.petId, main.level),
    wild: calcStats(wildInfo.petId, wildInfo.level),
  };
}

function myAttack(c, b, log, rng) {
  const { dmg, crit } = calcDamage(c.mine.atk, c.wild.def, rng);
  b.wildHp = Math.max(0, b.wildHp - dmg);
  log.push(`${c.myPet.emoji} ${c.myName}의 공격! ${crit ? '💥 급소! ' : ''}${c.wildPet.name}에게 **${dmg}** 데미지`);
}

function wildAttack(c, b, log, rng) {
  const { dmg, crit } = calcDamage(c.wild.atk, c.mine.def, rng);
  b.myHp = Math.max(0, b.myHp - dmg);
  log.push(`${c.wildPet.emoji} ${c.wildPet.name}의 공격! ${crit ? '💥 급소! ' : ''}${c.myName}에게 **${dmg}** 데미지`);
}

// 한 턴이 끝났을 때: 체력 저장 → 승리/패배/무승부/계속 판정
function finishTurn(player, ex, c, log, now, rng) {
  const b = ex.battle;
  const { main, wildPet, wildInfo, myName } = c;
  b.round += 1;
  setHp(main, b.myHp, now); // ❤️ 전투가 끝나도 체력이 이어져요

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
    if (p.levelsGained > 0) setHp(main, maxHp(main), now); // 레벨업 보너스: 체력 가득!
    const unlocked = LOCATION_LIST.filter((l) => l.minLevel > before && l.minLevel <= player.level);

    player.exploration = null;
    return {
      kind: 'won', commit: true, log,
      wildPetId: wildInfo.petId, wildLevel: wildInfo.level,
      myPetId: main.petId, myName,
      gold, trainerExp, petExp,
      levelsGained: t.levelsGained, newLevel: player.level,
      petLevelsGained: p.levelsGained, petNewLevel: main.level,
      petHp: currentHp(main, now), petMaxHp: maxHp(main),
      unlocked,
    };
  }

  // 패배... (골드는 잃지 않지만, 펫이 기절해서 회복이 필요해요)
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

// [싸우기] — 전투 시작 (이미 시작했으면 이어서)
export function startBattle(player, id, now = Date.now()) {
  const ex = player.exploration;
  if (!ex || ex.id !== id || !ex.encounter) return { kind: 'expired' };
  if (ex.battle) return { kind: 'continue', snap: snapshot(player, now) };

  const c = context(player, ex);
  const hp = currentHp(c.main, now);
  if (hp <= 0) return { kind: 'fainted', name: c.myName, petId: c.main.petId };

  ex.battle = { myHp: hp, myMax: c.mine.hp, wildHp: c.wild.hp, wildMax: c.wild.hp, round: 0 };
  return { kind: 'started', commit: true, snap: snapshot(player, now) };
}

// [공격] — 한 턴 진행
export function battleTurn(player, id, now = Date.now(), rng = Math.random) {
  const ex = player.exploration;
  if (!ex || ex.id !== id || !ex.encounter) return { kind: 'expired' };
  if (!ex.battle) return { kind: 'no_battle' };

  const b = ex.battle;
  const c = context(player, ex);
  const log = [];
  const order = c.mine.spd >= c.wild.spd ? ['me', 'wild'] : ['wild', 'me'];
  for (const who of order) {
    if (b.myHp <= 0 || b.wildHp <= 0) break; // 이미 쓰러졌으면 반격 못 해요
    if (who === 'me') myAttack(c, b, log, rng);
    else wildAttack(c, b, log, rng);
  }
  return finishTurn(player, ex, c, log, now, rng);
}

// [회복] — 가방의 회복약을 써요. 약을 먹는 동안 야생 펫이 한 번 공격해요 (한 턴을 써요!)
export function battleHeal(player, id, now = Date.now(), rng = Math.random) {
  const ex = player.exploration;
  if (!ex || ex.id !== id || !ex.encounter) return { kind: 'expired' };
  if (!ex.battle) return { kind: 'no_battle' };

  const b = ex.battle;
  if (b.myHp >= b.myMax) return { kind: 'full_hp' };
  const potion = pickPotion(player, b.myMax - b.myHp);
  if (!potion) return { kind: 'no_potion' };

  const c = context(player, ex);
  player.inventory[potion.id] -= 1;
  const before = b.myHp;
  b.myHp = Math.min(b.myMax, b.myHp + potion.heal);
  const log = [`${potion.emoji} ${potion.name}을(를) 썼어요! ${c.myName} 체력 +${b.myHp - before}`];
  wildAttack(c, b, log, rng);
  return finishTurn(player, ex, c, log, now, rng);
}
