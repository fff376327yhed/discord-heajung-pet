// 해정펫 도감 📖 — 새 펫을 추가하려면 아래에 한 덩어리만 더 적으면 돼요!
// grade: common(일반) / rare(희귀) / epic(영웅) / legendary(전설)
// expYield: 이 펫을 이겼을 때 주는 기본 경험치, catchRate: 잡기 쉬운 정도(0~1, 클수록 쉬움)

export const GRADES = {
  common: { name: '일반', emoji: '⚪', order: 1 },
  rare: { name: '희귀', emoji: '🔵', order: 2 },
  epic: { name: '영웅', emoji: '🟣', order: 3 },
  legendary: { name: '전설', emoji: '🟡', order: 4 },
};

const stats = (hp, atk, def, spd) => ({ hp, atk, def, spd });

export const PETS = {
  // ── 스타팅 펫 (처음에만 고를 수 있어요) ──
  pyro_cat: { id: 'pyro_cat', name: '불꽃냥', emoji: '🔥', grade: 'common', starter: true, baseStats: stats(45, 12, 8, 10), expYield: 20, catchRate: 0.5 },
  aqua_pup: { id: 'aqua_pup', name: '물방울이', emoji: '💧', grade: 'common', starter: true, baseStats: stats(50, 10, 10, 8), expYield: 20, catchRate: 0.5 },
  leaf_bun: { id: 'leaf_bun', name: '풀잎이', emoji: '🍃', grade: 'common', starter: true, baseStats: stats(48, 11, 9, 9), expYield: 20, catchRate: 0.5 },

  // ── 초원 ──
  slime: { id: 'slime', name: '말랑이', emoji: '🟢', grade: 'common', baseStats: stats(30, 6, 5, 5), expYield: 8, catchRate: 0.8 },
  mouse: { id: 'mouse', name: '쪼르', emoji: '🐭', grade: 'common', baseStats: stats(25, 7, 4, 12), expYield: 10, catchRate: 0.75 },
  bee: { id: 'bee', name: '윙윙이', emoji: '🐝', grade: 'rare', baseStats: stats(28, 10, 4, 14), expYield: 16, catchRate: 0.5 },

  // ── 숲 ──
  owl: { id: 'owl', name: '부엉이', emoji: '🦉', grade: 'common', baseStats: stats(40, 11, 8, 10), expYield: 22, catchRate: 0.65 },
  fox: { id: 'fox', name: '여우비', emoji: '🦊', grade: 'rare', baseStats: stats(42, 14, 9, 15), expYield: 35, catchRate: 0.4 },
  treant: { id: 'treant', name: '나무지기', emoji: '🌳', grade: 'epic', baseStats: stats(80, 15, 20, 4), expYield: 70, catchRate: 0.2 },

  // ── 동굴 ──
  bat: { id: 'bat', name: '박쥐돌', emoji: '🦇', grade: 'common', baseStats: stats(45, 14, 10, 16), expYield: 45, catchRate: 0.6 },
  golem: { id: 'golem', name: '바위거인', emoji: '🪨', grade: 'epic', baseStats: stats(110, 20, 30, 3), expYield: 120, catchRate: 0.15 },

  // ── 바다 ──
  crab: { id: 'crab', name: '집게', emoji: '🦀', grade: 'rare', baseStats: stats(60, 18, 25, 6), expYield: 90, catchRate: 0.45 },
  shark: { id: 'shark', name: '상어왕', emoji: '🦈', grade: 'epic', baseStats: stats(100, 30, 15, 20), expYield: 200, catchRate: 0.15 },

  // ── 화산 ──
  baby_dragon: { id: 'baby_dragon', name: '아기용', emoji: '🐲', grade: 'epic', baseStats: stats(120, 35, 25, 14), expYield: 300, catchRate: 0.12 },
  phoenix: { id: 'phoenix', name: '불사조', emoji: '🦅', grade: 'legendary', baseStats: stats(150, 45, 30, 25), expYield: 600, catchRate: 0.05 },
};

export const STARTER_IDS = Object.values(PETS).filter((p) => p.starter).map((p) => p.id);
