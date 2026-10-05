// 펫 육성 규칙 🌱 — 별명 짓기 / 방생 / 훈련 (디스코드와 상관없는 순수한 규칙)
import { PETS } from '../data/pets.js';
import {
  MAX_LEVEL, NICKNAME_MAX, RELEASE_BASE_GOLD, RELEASE_LEVEL_BONUS,
  TRAIN_BASE_COST, TRAIN_COST_PER_LEVEL, TRAIN_EXP_RATIO, TRAIN_LEVEL_CAP_OVER_TRAINER,
} from '../config.js';
import { addExp, expToNext } from './level.js';
import { maxHp, setHp } from './pet.js';

export const TRAIN_AMOUNTS = [1, 5];

// ───────── 별명 ─────────
// 디스코드 글자 꾸미기/멘션을 깨뜨리는 문자는 막아요
const BAD_NICK = /[@<>`*_~|\\]/;

// name 이 비어 있으면 별명을 지워요. index 는 /펫 목록의 번호(1부터)
export function renamePet(player, index, name) {
  const inst = player.pets[index - 1];
  if (!inst) return { kind: 'not_found' };
  const nick = (name ?? '').trim();
  if (nick === '') {
    inst.nickname = null;
    return { kind: 'cleared', commit: true, inst: { ...inst } };
  }
  if ([...nick].length > NICKNAME_MAX) return { kind: 'too_long' };
  if (BAD_NICK.test(nick)) return { kind: 'bad_chars' };
  inst.nickname = nick;
  return { kind: 'renamed', commit: true, inst: { ...inst } };
}

// ───────── 방생 ─────────
export function releaseValue(inst) {
  const base = RELEASE_BASE_GOLD[PETS[inst.petId].grade] ?? 10;
  return Math.round(base * (1 + inst.level * RELEASE_LEVEL_BONUS));
}

export function releasePet(player, uid) {
  const inst = player.pets.find((p) => p.uid === uid);
  if (!inst) return { kind: 'not_found' };
  if (uid === player.mainPetUid) return { kind: 'is_main' };
  const gold = releaseValue(inst);
  player.pets = player.pets.filter((p) => p.uid !== uid);
  player.gold += gold;
  return { kind: 'released', commit: true, petId: inst.petId, nickname: inst.nickname, level: inst.level, gold, total: player.gold };
}

// ───────── 훈련 ─────────
export const trainCost = (level) => TRAIN_BASE_COST + level * TRAIN_COST_PER_LEVEL;
export const trainExp = (level) => Math.max(1, Math.round(expToNext(level) * TRAIN_EXP_RATIO));
export const levelCap = (player) => Math.min(MAX_LEVEL, player.level + TRAIN_LEVEL_CAP_OVER_TRAINER);

export function trainPet(player, uid, times, now = Date.now()) {
  const inst = player.pets.find((p) => p.uid === uid);
  if (!inst) return { kind: 'not_found' };
  if (!TRAIN_AMOUNTS.includes(times)) return { kind: 'not_found' };
  if (player.exploration?.battle && uid === player.mainPetUid) return { kind: 'in_battle' };

  const startLevel = inst.level;
  let done = 0, spent = 0, expGained = 0, stop = null;
  for (let i = 0; i < times; i++) {
    if (inst.level >= levelCap(player)) { stop = 'cap'; break; }
    const cost = trainCost(inst.level);
    if (player.gold < cost) { stop = 'no_gold'; break; }
    const exp = trainExp(inst.level);
    player.gold -= cost;
    addExp(inst, exp);
    done += 1; spent += cost; expGained += exp;
  }
  if (done === 0) return { kind: stop ?? 'cap' };
  if (inst.level > startLevel) setHp(inst, maxHp(inst), now); // 레벨업 보너스: 체력 가득!
  return { kind: 'trained', commit: true, done, spent, expGained, stop, levelsGained: inst.level - startLevel, newLevel: inst.level };
}
