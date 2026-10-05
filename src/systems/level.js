// 레벨 시스템 ⭐ — 트레이너(플레이어)와 해정펫이 똑같은 규칙을 써요!
import { MAX_LEVEL } from '../config.js';

// 다음 레벨까지 필요한 경험치 (레벨이 높을수록 많이 필요해요)
export function expToNext(level) {
  return Math.floor(20 * Math.pow(level, 1.7)) + 30;
}

// 경험치를 얻고, 레벨업이 있으면 처리해요. target = { level, exp } 를 직접 바꿔요.
export function addExp(target, amount) {
  const gain = Math.max(0, Math.floor(Number(amount) || 0));
  const startLevel = target.level;

  if (target.level >= MAX_LEVEL) {
    target.level = MAX_LEVEL;
    target.exp = 0;
    return { gained: 0, levelsGained: 0, level: target.level };
  }

  target.exp += gain;
  while (target.level < MAX_LEVEL && target.exp >= expToNext(target.level)) {
    target.exp -= expToNext(target.level);
    target.level += 1;
  }
  if (target.level >= MAX_LEVEL) {
    target.level = MAX_LEVEL;
    target.exp = 0;
  }

  return { gained: gain, levelsGained: target.level - startLevel, level: target.level };
}

// 경험치 막대기 ▰▰▰▱▱▱
export function expBar(exp, need, size = 10) {
  const filled = Math.max(0, Math.min(size, Math.floor((exp / need) * size)));
  return '▰'.repeat(filled) + '▱'.repeat(size - filled);
}
