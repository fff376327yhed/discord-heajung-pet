// 도감 규칙 📖 — 스타팅 펫은 셋 중 하나만 고를 수 있어서, 전체 칸 수는 "야생 펫 + 1" 이에요.
import { PETS } from '../data/pets.js';

export const WILD_COUNT = Object.values(PETS).filter((p) => !p.starter).length;

export function dexProgress(player) {
  const found = Object.keys(player.dex ?? {}).filter((id) => PETS[id]).length;
  return { found, total: WILD_COUNT + 1 };
}
