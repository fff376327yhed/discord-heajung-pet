// 장소 목록 🗺️ — 레벨이 높아야 갈 수 있는 곳일수록 강하고 경험치가 많은 펫이 나와요!
// weight: 나올 확률의 "무게" (클수록 자주 나와요), lv: [최소, 최대] 펫 레벨
// delay: 펫이 나타날 때까지 걸리는 시간(초) [최소, 최대] — 이 사이에서 랜덤!

export const LOCATIONS = {
  meadow: {
    id: 'meadow', name: '초록 초원', emoji: '🌾', minLevel: 1, expMultiplier: 1.0, delay: [5, 20],
    description: '바람이 솔솔 부는 평화로운 들판이에요.',
    spawns: [
      { petId: 'slime', weight: 50, lv: [1, 4] },
      { petId: 'mouse', weight: 40, lv: [1, 5] },
      { petId: 'bee', weight: 10, lv: [3, 6] },
    ],
  },
  forest: {
    id: 'forest', name: '속삭이는 숲', emoji: '🌲', minLevel: 5, expMultiplier: 1.5, delay: [5, 25],
    description: '나뭇잎 사이로 무언가 지나가는 소리가 나요.',
    spawns: [
      { petId: 'owl', weight: 50, lv: [5, 10] },
      { petId: 'fox', weight: 35, lv: [6, 11] },
      { petId: 'treant', weight: 15, lv: [8, 12] },
    ],
  },
  cave: {
    id: 'cave', name: '어두운 동굴', emoji: '🕳️', minLevel: 10, expMultiplier: 2.0, delay: [8, 30],
    description: '깜깜해서 잘 안 보이지만 반짝이는 눈이 보여요.',
    spawns: [
      { petId: 'bat', weight: 70, lv: [10, 16] },
      { petId: 'golem', weight: 30, lv: [13, 18] },
    ],
  },
  ocean: {
    id: 'ocean', name: '푸른 바다', emoji: '🌊', minLevel: 20, expMultiplier: 3.0, delay: [8, 30],
    description: '파도 아래에 커다란 그림자가 보여요.',
    spawns: [
      { petId: 'crab', weight: 70, lv: [20, 28] },
      { petId: 'shark', weight: 30, lv: [24, 32] },
    ],
  },
  volcano: {
    id: 'volcano', name: '불타는 화산', emoji: '🌋', minLevel: 30, expMultiplier: 5.0, delay: [10, 40],
    description: '뜨거운 열기 속에서 전설의 울음소리가 들려요.',
    spawns: [
      { petId: 'baby_dragon', weight: 85, lv: [30, 40] },
      { petId: 'phoenix', weight: 15, lv: [35, 45] },
    ],
  },
};

export const LOCATION_LIST = Object.values(LOCATIONS).sort((a, b) => a.minLevel - b.minLevel);
