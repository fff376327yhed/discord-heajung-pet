// 아이템 사용 규칙 🧪 (디스코드와 상관없는 순수한 규칙)
import { ITEMS } from '../data/items.js';
import { currentHp, maxHp, setHp } from './pet.js';
import { getMainPet } from './player.js';

// 회복약 목록 (약한 것 → 센 것 순서)
export const POTIONS = Object.values(ITEMS).filter((i) => i.heal).sort((a, b) => a.heal - b.heal);

// 전투 중 쓸 약 고르기: 모자란 체력을 채울 수 있는 "가장 약한" 약, 없으면 가진 것 중 제일 센 약
export function pickPotion(player, missing) {
  const owned = POTIONS.filter((p) => (player.inventory?.[p.id] ?? 0) > 0);
  if (owned.length === 0) return null;
  return owned.find((p) => p.heal >= missing) ?? owned[owned.length - 1];
}

// index: /펫 목록 번호(1부터). 비우면 대표 펫
export function useItem(player, itemId, index, now = Date.now()) {
  const item = ITEMS[itemId];
  if (!item?.heal) return { kind: 'unknown' };

  const inst = index ? player.pets[index - 1] : getMainPet(player);
  if (!inst) return { kind: 'not_found' };
  if (player.exploration?.battle && inst.uid === player.mainPetUid) return { kind: 'in_battle' };

  const owned = player.inventory?.[itemId] ?? 0;
  if (owned <= 0) return { kind: 'none', item };

  const max = maxHp(inst);
  const cur = currentHp(inst, now);
  if (cur >= max) return { kind: 'full', inst: { ...inst } };

  const next = Math.min(max, cur + item.heal);
  player.inventory[itemId] = owned - 1;
  setHp(inst, next, now);
  return { kind: 'used', commit: true, item, inst: { ...inst }, before: cur, after: next, max, left: owned - 1 };
}
