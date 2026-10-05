// 주사위 굴리기 🎲 (rng 자리에 가짜 주사위를 넣으면 테스트할 수 있어요)
export const randInt = (min, max, rng = Math.random) => Math.floor(rng() * (max - min + 1)) + min;

// 무게(weight)가 큰 것이 더 자주 뽑혀요
export function weightedPick(items, getWeight, rng = Math.random) {
  const total = items.reduce((sum, item) => sum + getWeight(item), 0);
  let r = rng() * total;
  for (const item of items) {
    r -= getWeight(item);
    if (r < 0) return item;
  }
  return items[items.length - 1];
}
