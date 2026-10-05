// 아이템 목록 🎒 (이름은 나중에 전체 갈아엎기로 했으니 여기만 고치면 돼요!)
// heal: 회복약이에요. 펫 체력을 이만큼 채워줘요 (9999 = 사실상 전부)
export const ITEMS = {
  haejeong_ball: {
    id: 'haejeong_ball',
    name: '해정볼',
    emoji: '🔴',
    price: 100,
    description: '야생 해정펫을 잡을 때 쓰는 공이에요.',
  },
  potion_small: {
    id: 'potion_small',
    name: '회복약',
    emoji: '🧪',
    price: 40,
    heal: 60,
    description: '펫 체력을 60 회복해요.',
  },
  potion_big: {
    id: 'potion_big',
    name: '고급 회복약',
    emoji: '🍶',
    price: 120,
    heal: 200,
    description: '펫 체력을 200 회복해요.',
  },
  elixir: {
    id: 'elixir',
    name: '엘릭서',
    emoji: '✨',
    price: 300,
    heal: 9999,
    description: '펫 체력을 전부 회복해요.',
  },
};
