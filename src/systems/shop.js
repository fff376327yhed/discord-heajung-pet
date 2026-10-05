// 상점 규칙 🛒 (디스코드와 상관없는 순수한 규칙)
import { ITEMS } from '../data/items.js';

export const BUY_AMOUNTS = [1, 5, 10];

export function buyItem(player, itemId, qty) {
  const item = ITEMS[itemId];
  if (!item || !item.price) return { kind: 'unknown' };
  if (!BUY_AMOUNTS.includes(qty)) return { kind: 'unknown' };

  const cost = item.price * qty;
  if (player.gold < cost) return { kind: 'no_gold', cost, gold: player.gold };

  player.gold -= cost;
  player.inventory ??= {};
  player.inventory[itemId] = (player.inventory[itemId] ?? 0) + qty;
  return { kind: 'bought', commit: true, itemId, qty, cost, gold: player.gold, owned: player.inventory[itemId] };
}
