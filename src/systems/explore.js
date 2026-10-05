// 탐험 · 포획 규칙 🌿🔴 (디스코드와 상관없는 "순수한 게임 규칙"이라 테스트하기 쉬워요)
//
// 탐험 흐름:  /탐험 → (랜덤 시간 기다림) → [살펴보기] → 야생 펫 등장 → [잡기] / [싸우기] / [무시하기]
// player.exploration = { id, locationId, startedAt, appearAt, encounter: null | { petId, level }, battle?: {...} }
// (battle 은 systems/battle.js 가 만들어요. 전투 중에는 snapshot 의 state 가 'battle' 이에요)

import { randomUUID } from 'node:crypto';
import { LOCATIONS, LOCATION_LIST } from '../data/locations.js';
import { PETS } from '../data/pets.js';
import { CATCH_DROP_PER_TRY, FLEE_BASE, FLEE_RISE_PER_TRY, FLEE_MAX } from '../config.js';
import { randInt, weightedPick } from '../utils/random.js';
import { addExp } from './level.js';
import { createPetInstance } from './pet.js';
import { getMainPet } from './player.js';

const BALL = 'haejeong_ball';

// 잡을 확률: 펫마다 정해진 값 × (내 대표 펫보다 야생 펫이 너무 높으면 조금 어려워져요)
//            × (전투로 야생 펫 체력을 깎을수록 쉬워져요: 체력이 거의 0이면 최대 2배!)
export function catchChance(petId, wildLevel, mainLevel, hpRatio = 1, tries = 0) {
  const gap = Math.max(0, wildLevel - mainLevel);
  const factor = Math.max(0.3, 1 - gap * 0.02);
  const weakBonus = 1 + (1 - Math.max(0, Math.min(1, hpRatio)));
  const base = PETS[petId].catchRate * factor * weakBonus;
  const afterTries = base - CATCH_DROP_PER_TRY * tries; // 던진 횟수만큼 -10%p
  return Math.max(0.02, Math.min(0.95, afterTries));
}

// 도망 확률: 실패한 횟수만큼 +35%p (상한 90%)
export function fleeChance(tries) {
  return Math.min(FLEE_MAX, FLEE_BASE + FLEE_RISE_PER_TRY * tries);
}

// 지금 탐험 상태를 한 장의 "사진"으로 찍어요 (화면 그릴 때 써요)
export function snapshot(player, now = Date.now()) {
  const ex = player.exploration;
  if (!ex) return { state: 'idle' };
  const base = { id: ex.id, locationId: ex.locationId, balls: player.inventory?.[BALL] ?? 0 };
  if (ex.encounter) {
    const main = getMainPet(player);
    const b = ex.battle ?? null;
    const ratio = b ? b.wildHp / b.wildMax : 1;
    const snap = {
      ...base,
      state: b ? 'battle' : 'encounter',
      encounter: { ...ex.encounter },
      chance: catchChance(ex.encounter.petId, ex.encounter.level, main?.level ?? 1, ratio, ex.catchTries ?? 0),
    };
    if (b) {
      snap.battle = {
        ...b,
        myPetId: main.petId,
        myLevel: main.level,
        myName: main.nickname ?? PETS[main.petId].name,
      };
    }
    return snap;
  }
  return { ...base, state: 'exploring', remainingSec: Math.max(0, Math.ceil((ex.appearAt - now) / 1000)) };
}

// 탐험 시작
export function startExploration(player, locationId, now = Date.now(), rng = Math.random) {
  const loc = LOCATIONS[locationId];
  if (!loc) return { ok: false, reason: 'unknown_location' };
  if (player.level < loc.minLevel) return { ok: false, reason: 'locked', minLevel: loc.minLevel };

  // 이미 탐험 중이면 새로 시작하지 않고 이어서 해요 (대기 시간을 다시 뽑는 꼼수 방지!)
  if (player.exploration) {
    return {
      ok: true,
      resumed: true,
      sameLocation: player.exploration.locationId === locationId,
      snap: snapshot(player, now),
      commit: false,
    };
  }

  const waitSec = randInt(loc.delay[0], loc.delay[1], rng);
  player.exploration = {
    id: randomUUID().slice(0, 8),
    locationId,
    startedAt: now,
    appearAt: now + waitSec * 1000,
    encounter: null,
  };
  return { ok: true, resumed: false, snap: snapshot(player, now), commit: true };
}

// [살펴보기]
export function lookAround(player, id, now = Date.now(), rng = Math.random) {
  const ex = player.exploration;
  if (!ex || ex.id !== id) return { kind: 'expired' };
  if (ex.encounter) return { kind: 'encounter', snap: snapshot(player, now) };
  if (now < ex.appearAt) return { kind: 'waiting', snap: snapshot(player, now) };

  const loc = LOCATIONS[ex.locationId];
  const spawn = weightedPick(loc.spawns, (s) => s.weight, rng);
  ex.encounter = { petId: spawn.petId, level: randInt(spawn.lv[0], spawn.lv[1], rng) };
  ex.catchTries = 0; // 새 야생 펫이라서 던진 횟수를 0으로 되돌려요
  return { kind: 'appeared', snap: snapshot(player, now), commit: true };
}

// [잡기]
export function attemptCatch(player, id, now = Date.now(), rng = Math.random) {
  const ex = player.exploration;
  if (!ex || ex.id !== id || !ex.encounter) return { kind: 'expired' };

  const balls = player.inventory?.[BALL] ?? 0;
  if (balls <= 0) return { kind: 'no_ball', snap: snapshot(player, now) };

  player.inventory[BALL] = balls - 1; // 던지는 순간 해정볼은 사라져요
  const { petId, level } = ex.encounter;
  const hpRatio = ex.battle ? ex.battle.wildHp / ex.battle.wildMax : 1;
  const tries = ex.catchTries ?? 0;
  const chance = catchChance(petId, level, getMainPet(player)?.level ?? 1, hpRatio, tries);

  if (rng() < chance) {
    const isNew = !player.dex?.[petId];
    player.pets.push(createPetInstance(petId, level));
    player.dex = { ...(player.dex ?? {}), [petId]: true };

    const loc = LOCATIONS[ex.locationId];
    const expGain = Math.round(PETS[petId].expYield * loc.expMultiplier * 1.5) + (isNew ? 25 : 0);
    const before = player.level;
    const result = addExp(player, expGain);
    const unlocked = LOCATION_LIST.filter((l) => l.minLevel > before && l.minLevel <= player.level);

    player.exploration = null;
    return {
      kind: 'caught', commit: true, petId, level, isNew, expGain,
      levelsGained: result.levelsGained, newLevel: player.level, unlocked, ballsLeft: balls - 1,
    };
  }

  // 실패! 던진 횟수가 늘어서 이제 도망이 더 쉬워져요
  ex.catchTries = tries + 1;
  if (rng() < fleeChance(ex.catchTries)) {
    player.exploration = null;
    return { kind: 'fled', commit: true, petId, ballsLeft: balls - 1 };
  }
  return { kind: 'escaped', commit: true, snap: snapshot(player, now), ballsLeft: balls - 1 };
}

// [무시하기] / [그만두기] / [도망] (전투 중이면 'ran')
export function leave(player, id) {
  const ex = player.exploration;
  if (!ex || ex.id !== id) return { kind: 'expired' };
  const petId = ex.encounter?.petId ?? null;
  const inBattle = Boolean(ex.battle);
  player.exploration = null;
  return { kind: petId ? (inBattle ? 'ran' : 'ignored') : 'quit', petId, commit: true };
}
