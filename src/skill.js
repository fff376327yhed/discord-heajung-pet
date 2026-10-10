// 해정펫 스킬 ✨ — 스킬 데이터 + 전투 규칙 (디스코드와 상관없는 순수한 규칙)
//
// 마나: 최대 SKILL_CFG.manaMax(100), 기본 공격을 한 턴에만 +manaPerTurn(15) (스킬·회복·교체·잡기 턴에는 안 차요). 스킬은 마나를 써요. 좋은 스킬일수록 마나가 많이 들어요.
// 슬롯(총 5칸): 1번 Lv.20 · 2번 Lv.40 · 3번 Lv.100 · 4번 Lv.200 · 5번 상점의 [스킬 슬롯 개방권]. 열릴 때 랜덤 스킬이 하나 들어와요 ([스킬 변경권] 으로 다시 뽑기).
// 전용기: 펫마다 1~2개. 그 펫만 배울 수 있고, 같은 마나의 일반 스킬보다 더 세요.
//
// 효과 칸 (fx) — 아래 이름만 쓰면 설명 글자는 자동으로 만들어져요:
//   pow 데미지 배율 · hits 타수 · pierce 방어무시 · crit 급소확률+ · exec 체력30%↓ 적에게 배율 · drain 흡혈 · recoil 반동
//   heal 회복 · regen [비율,턴] · shield 보호막 · guard [감소율,턴] · evade 회피 횟수 · atkUp/defUp [비율,턴] · atkDown/defDown [비율,턴]
//   stun 기절확률 · dot [종류,비율,턴,확률] · mana 마나회복 · drainMana 적 마나 감소 · cleanse 상태이상 제거
//   🆕 독창 스킬용 효과 칸:
//   bomb [배율,턴] 시한폭탄(방어 무시) · detonate 배율 화상/독/출혈 터뜨리기 · overload 계수 남은 마나 전부 쏟아붓기
//   revenge 계수 내 체력이 낮을수록 강해짐 · gamble [확률,성공배율,실패반동] 도박 · hitsRange [최소,최대] 랜덤 연타
//   stealMana 숫자 적 마나 훔치기 · swapHp 서로의 체력 비율 맞바꾸기 · echo 턴 다음 공격 스킬이 메아리침
//   🌈 속성(상성) 효과 칸:
//   elem 스킬의 속성 (fire/water/grass/electric/ice/wind/earth/light/dark/poison/normal — 안 적으면 무속성)
//   weakBonus 비율 상대 속성이 약점일 때 데미지 추가 · ignoreResist 상대가 "효과 별로"여도 반감 무시
//   convert [속성,턴] 내 속성을 바꿔요 (같은 속성 보너스 · 방어 상성도 같이 바뀌어요) · ward 턴 약점 속성으로 맞아도 추가 피해 없음
//   🆕 2차 확장 효과 칸 (배치 1):
//   manaMaxUp [수치,턴] 최대마나 증가 · manaRegenUp [수치,턴] 턴마다 차는 마나 증가
//   steal [stat,비율,턴] 상대 공격력/방어력을 훔쳐서 내 버프+상대 디버프로 (stat: 'atk'|'def')
//   turnCut 숫자 상대의 좋은 효과(공방업·보호태세·재생·보호막) 남은 턴을 깎아요
//   truePct 비율 방어 무시 고정추가피해(최대체력 비율) · mercy 이번 공격은 상대 체력을 1% 밑으로 못 내려요
//   burstAtk [배율,턴] 공격력을 배수로 (한도 없음, 예: 5 = x500%) · debuffToBuff 내 디버프(공방다운·기절)를 전부 버프로
//   coinflip 턴 그동안 받는 모든 피해가 50% 확률로 2배, 50% 확률로 0 · defToAtk 턴 방어력을 전부 공격력으로 전환
//   healCut [비율,턴] 상대가 받는 회복 효과를 비율만큼 깎아요
//   🆕 3차 확장 효과 칸 (배치 3):
//   buffXfer [모드,턴] 1회용 효과 이동 (모드: 'steal' 상대 버프 뺏기 · 'give' 내 디버프 떠넘기기 · 'swap' 둘 다) — 한 번 발동하면 사라져요
//   statRoll [모드,대상,턴] 능력치 룰렛 (모드: 'swap' 두 능력치 맞바꿈 · 'random' 랜덤 배수 / 대상: 'self'|'foe') — 등급별 상한(ROLL_CAP)
//   cdReset 숫자 내 스킬 쿨타임을 전부(99) 또는 숫자만큼 줄여요 · cd 숫자 이 스킬의 쿨타임(턴)
//   revive [비율,턴] 쓰러지면 비율만큼 체력으로 부활 (턴이 지나면 사라져요) · skillImmune 턴 스킬로 취급되는 효과 전부 무효
//   archBless [회복배율,추가피해비율] 받은 피해 × 배율 회복 + 회복량의 비율만큼 상대에게 추가 피해
//   🆕 4차 확장 효과 칸 (배치 4):
//   joker true 내 스킬 하나 ↔ 상대 스킬 하나 랜덤 맞교환 (전투 안에서만 · 전투당 1번 = ex.battle.jokerUsed) — 상대가 받는 게 조커 카드면 상대 마나 전부 삭제 + 스킬 봉인
//   curse [개수,턴] 나 자신에게 랜덤 디버프를 개수만큼 걸고, 이 스킬 칸이 curse_grant(저주부여)로 바뀌어요 · curseGrant 배수 저주로 받은 디버프를 배수 위력으로 상대에게
//   devilDeal [턴,배수] 턴 동안 내 모든 공격이 확정 급소+약점 · 턴 안에 못 쓰러뜨리면 준 피해×배수를 무효화 불가 피해로 받아요 · hidden true 슬롯 뽑기에 안 나와요
//   🆕 5차 확장 효과 칸 (배치 5 — 일부):
//   catchPro [포획률+,연장턴] 포획 전문가: 유효 14턴(★5 는 15턴, CATCH_PRO_CFG) 동안 야생 펫이 도망치려 하면 확정으로 붙잡고(처음 붙잡을 때 전투 제한 턴 +연장턴), 포획률 +N%p (st.catchPro · ex.battle.extraRounds)
//   fightBuff { catch, flee, exp, gold, petExp, equip } 전투 중 버프 — 이번 전투가 끝날 때까지 유지, 겹치면 쌓여요 (FIGHT_BUFF_CAP 한도) (st.fightBuff = ex.battle.mySt.fightBuff)
//     catch 포획률 +%p · flee 도망 확률 -%p · exp 트레이너 경험치 · gold 돈 · petExp 펫 경험치 · equip 장비 획득 확률 (모두 +%)

export const SKILL_CFG = {
  manaMax: 100, // 마나 최대치 (마나 수정으로 펫마다 더 늘릴 수 있어요)
  manaStart: 30, // 전투 시작 마나
  manaPerTurn: 15, // 기본 공격을 했을 때 차는 마나 (스킬을 쓴 턴에는 안 차요)
  slot1Level: 20, // 1번 스킬 슬롯이 열리는 펫 레벨
  slot2Level: 40, // 2번 스킬 슬롯이 열리는 펫 레벨
  slot3Level: 100, // 3번 스킬 슬롯이 열리는 펫 레벨
  slot4Level: 200, // 4번 스킬 슬롯이 열리는 펫 레벨 (MAX_LEVEL 이 200 이상이어야 닿을 수 있어요)
  sigChance: 0.01, // 슬롯이 열리거나 변경될 때 "전용기"가 나올 확률 (펫에게 전용기가 있을 때) — 1%
  wildSkillChance: 0.35, // 야생 펫이 매 턴 전용기를 쓸 확률 (마나가 될 때)
  crystalMana: 10, // 마나 수정 1개당 늘어나는 최대 마나
  crystalMaxBonus: 100, // 마나 수정으로 늘릴 수 있는 최대치
  elemAffinity: 2, // 🌈 슬롯이 열릴 때 "내 펫과 같은 속성" 스킬이 뽑힐 확률 배수 (1 이면 꺼짐, 2 면 같은 등급 안에서 2배 잘 나와요)
};
export const CLONE_SHARE = 0.5; // 👥 분신이 대신 맞아주는 피해 비율
export const CLONE_HP_PER_DEF = 6; // 👥 분신 체력 = 내 방어력 × 방어비율 × 이 값 (최소 10)
// 슬롯이 열릴 때 "등급(★)"이 뽑힐 확률 무게예요. 합이 100이라서 숫자가 곧 퍼센트(%)예요!
// 등급을 먼저 뽑고, 그 등급 안에서는 모든 스킬이 똑같은 확률이에요 (스킬을 새로 추가해도 등급 확률은 안 변해요).
// 예전: ★1 30% · ★2 28% · ★3 22% · ★4 14% · ★5 6%  →  지금: ★4·★5 가 훨씬 드물어요.
export const TIER_WEIGHT = { 1: 40, 2: 33, 3: 20, 4: 6, 5: 1 };
const TIER_COST = { 1: 10, 2: 20, 3: 35, 4: 50, 5: 70 }; // 등급별 기본 마나 (스킬마다 따로 고칠 수 있어요)

// ───────── 🌈 속성 (상성) ─────────
// 펫과 스킬은 속성을 가져요. 공격 속성이 상대 속성에게 "잘 먹히면" 약점(데미지 ×strong), "잘 안 먹히면" 반감(데미지 ×weak)!
// 두 가지 속성을 가진 펫은 두 속성의 배율이 곱해져요 (예: 약점 ×1.5 × 약점 ×1.5 = ×2.25).
// 스킬이 내 펫의 속성과 같으면 같은 속성 보너스(×stab)! 기본 공격은 내 펫의 첫 번째 속성으로 나가요.
export const ELEMENTS = {
  normal: { name: '무속성', emoji: '⚪' },
  fire: { name: '불', emoji: '🔥' },
  water: { name: '물', emoji: '💧' },
  grass: { name: '풀', emoji: '🌿' },
  electric: { name: '전기', emoji: '⚡' },
  ice: { name: '얼음', emoji: '❄️' },
  wind: { name: '바람', emoji: '🌪️' },
  earth: { name: '땅', emoji: '⛰️' },
  light: { name: '빛', emoji: '✨' },
  dark: { name: '어둠', emoji: '🌑' },
  poison: { name: '독', emoji: '☠️' },
};
export const ELEM_CFG = {
  strong: 1.5, // 약점을 찔렀을 때 데미지 배율
  weak: 0.65, // 효과가 별로일 때 데미지 배율 (반감)
  stab: 1.2, // 스킬 속성 = 내 펫 속성일 때 데미지 배율 (같은 속성 보너스)
};
// 공격 속성 → { strong: 잘 먹히는 방어 속성들, weak: 잘 안 먹히는 방어 속성들 }
export const ELEM_CHART = {
  normal: { strong: [], weak: [] },
  fire: { strong: ['grass', 'ice', 'poison'], weak: ['water', 'earth', 'fire'] },
  water: { strong: ['fire', 'earth'], weak: ['grass', 'electric', 'water'] },
  grass: { strong: ['water', 'earth', 'electric'], weak: ['fire', 'ice', 'poison', 'wind', 'grass'] },
  electric: { strong: ['water', 'wind'], weak: ['earth', 'grass', 'electric'] },
  ice: { strong: ['grass', 'wind', 'earth'], weak: ['fire', 'water', 'ice'] },
  wind: { strong: ['grass', 'poison'], weak: ['electric', 'ice'] },
  earth: { strong: ['fire', 'electric', 'poison'], weak: ['grass', 'wind'] },
  light: { strong: ['dark', 'poison'], weak: ['light', 'fire'] },
  dark: { strong: ['light', 'wind'], weak: ['dark', 'earth'] },
  poison: { strong: ['grass', 'water'], weak: ['earth', 'poison', 'dark'] },
};
// 펫마다 속성 1~2개 (맨 앞이 "첫 번째 속성" = 기본 공격 속성). 여기에 없는 펫은 무속성이에요.
export const PET_ELEMENTS = {
  pyro_cat: ['fire'], aqua_pup: ['water'], leaf_bun: ['grass'],
  slime: ['water'], mouse: ['electric'], bee: ['wind', 'poison'], rabbit: ['normal'], ladybug: ['grass'], butterfly: ['grass', 'wind'],
  owl: ['wind', 'dark'], fox: ['fire'], treant: ['grass', 'earth'], deer: ['grass', 'light'], squirrel: ['grass'], mushroom: ['grass', 'poison'], wolf: ['dark'],
  clover_fairy: ['grass', 'light'], boar: ['earth'], unicorn: ['light', 'grass'],
  bat: ['dark', 'wind'], golem: ['earth'], spider: ['poison'], scorpion: ['poison', 'earth'], crystal: ['earth', 'light'], skeleton: ['dark'], ghost: ['dark'],
  crab: ['water', 'earth'], shark: ['water', 'dark'], pufferfish: ['water', 'poison'], octopus: ['water'], whale: ['water'], turtle: ['water', 'earth'], mermaid: ['water', 'light'],
  baby_dragon: ['fire'], phoenix: ['fire', 'light'], magma_slime: ['fire', 'earth'], salamander: ['fire'], flame_lord: ['fire', 'dark'], fire_dragon: ['fire', 'wind'],
  frog: ['water', 'poison'], snake: ['poison'], croc: ['water', 'dark'], wisp: ['fire', 'dark'], witch: ['poison', 'dark'],
  camel: ['earth'], cactus: ['grass', 'earth'], scarab: ['earth'], lion: ['fire'], mummy: ['dark', 'earth'], sandworm: ['earth', 'poison'],
  penguin: ['ice', 'water'], bear: ['ice'], yeti: ['ice', 'earth'], ice_spirit: ['ice'], frost_dragon: ['ice', 'wind'], ice_queen: ['ice', 'light'],
  cloud_sheep: ['wind'], parrot: ['wind'], thunder_bird: ['electric', 'wind'], pegasus: ['wind', 'light'], wyvern: ['wind', 'poison'], angel: ['light'], sun_god: ['light', 'fire'],
  shadow: ['dark'], void_eye: ['dark'], star_whale: ['water', 'light'], comet: ['ice', 'light'], void_dragon: ['dark'], chaos_lord: ['dark', 'fire'], creator: ['light', 'dark'],
};
export const petElementsOf = (petId) => PET_ELEMENTS[petId] ?? ['normal'];

export const elemTag = (e) => `${(ELEMENTS[e] ?? ELEMENTS.normal).emoji} ${(ELEMENTS[e] ?? ELEMENTS.normal).name}`; // "🔥 불"
export const elemIcons = (elems) => (elems?.length ? elems : ['normal']).map((e) => (ELEMENTS[e] ?? ELEMENTS.normal).emoji).join(''); // "🌿🌪️"
export const elemTags = (elems) => (elems?.length ? elems : ['normal']).map(elemTag).join(' + '); // "🌿 풀 + 🌪️ 바람"
// 전투 중인 한쪽(X)의 "지금 속성" — 속성 변환(convert) 중이면 바뀐 속성이에요
export const effElems = (X) => (X?.st?.convert ? [X.st.convert.elem] : X?.elems?.length ? X.elems : ['normal']);

// 상성 계산: atkElem 으로 defender 를 때렸을 때의 배율과 안내 글자
export function elemClash(atkElem, defender, { ignoreResist = false } = {}) {
  const row = ELEM_CHART[atkElem] ?? ELEM_CHART.normal;
  let mult = 1;
  for (const d of effElems(defender)) {
    if (row.strong.includes(d)) mult *= ELEM_CFG.strong;
    else if (row.weak.includes(d)) mult *= ELEM_CFG.weak;
  }
  let ignored = false;
  let warded = false;
  if (ignoreResist && mult < 1) { mult = 1; ignored = true; }
  if (mult > 1 && defender?.st?.ward) { mult = 1; warded = true; }
  let note = '';
  if (ignored) note = ' (🔓 상성 반감을 무시했어요!)';
  else if (warded) note = ' (🔮 속성 방벽이 약점을 막아냈어요!)';
  else if (mult >= 2) note = ' 🌟 **약점 적중!!** (효과가 아주 굉장해요)';
  else if (mult >= 1.1) note = ' ✨ **효과가 굉장했다!**';
  else if (mult <= 0.5) note = ' 💨 효과가 거의 없는 듯하다…';
  else if (mult <= 0.9) note = ' 💧 효과가 별로인 듯하다…';
  return { mult, note, ignored, warded };
}
// 상성 한 줄 요약 (확인창 · 전투 화면용)
export function clashLabel(mult) {
  if (mult >= 2) return `🌟 약점! 아주 굉장해요 (×${+mult.toFixed(2)})`;
  if (mult >= 1.1) return `✨ 효과가 굉장해요 (×${+mult.toFixed(2)})`;
  if (mult <= 0.5) return `💨 효과가 거의 없어요 (×${+mult.toFixed(2)})`;
  if (mult <= 0.9) return `💧 효과가 별로예요 (×${+mult.toFixed(2)})`;
  return '보통 (×1)';
}
export const skillElement = (sk) => sk?.elem ?? 'normal';

export const SKILLS = {};
const add = (id, name, emoji, tier, fx, extra = {}) => {
  SKILLS[id] = { id, name, emoji, tier, cost: TIER_COST[tier], ...fx, ...extra };
};
const G = (id, name, emoji, tier, fx) => add(id, name, emoji, tier, fx); // 일반 스킬 (모든 펫)
const sigCount = {};
const P = (pet, id, name, emoji, tier, fx, flavor) => {
  // 🌈 전용기의 속성은 펫의 속성을 따라가요 (속성이 2개인 펫은 첫 번째 전용기 = 첫 속성, 두 번째 전용기 = 둘째 속성)
  const el = petElementsOf(pet);
  const idx = sigCount[pet] ?? 0;
  sigCount[pet] = idx + 1;
  add(id, name, emoji, tier, fx, { pet, flavor, elem: el[idx % el.length] });
}; // 전용기
const U = (id, name, emoji, tier, fx, flavor) => add(id, name, emoji, tier, fx, { flavor, unique: true }); // 🆕 독창 스킬 (모든 펫, 특이한 규칙)

// ───────── 일반 스킬: 속성 공격 (속성마다 ★1 · ★3 · ★5) ─────────
G('fire_spark', '불씨', '🔥', 1, { pow: 1.4, dot: ['burn', 0.05, 2, 0.3] });
G('fireball', '화염구', '☄️', 3, { pow: 1.9, dot: ['burn', 0.06, 3, 0.5] });
G('inferno', '업화', '🌋', 5, { pow: 2.7, dot: ['burn', 0.08, 3, 1] });
G('ember_jab', '불찌르기', '🔥', 1, { pow: 1.25, dot: ['burn', 0.04, 2, 0.4] });
G('flame_wheel', '화륜', '🛞', 2, { pow: 1.5, dot: ['burn', 0.05, 3, 0.5] });
G('sear', '지지기', '🍳', 2, { pow: 1.2, dot: ['burn', 0.05, 3, 0.6] });
G('blazing_kick', '작열차기', '🦶', 3, { pow: 2.0, dot: ['burn', 0.06, 3, 0.4] });
G('magma_burst', '용암분출', '🌋', 4, { pow: 2.4, dot: ['burn', 0.07, 3, 0.6] });
G('water_gun', '물총', '💧', 1, { pow: 1.35, atkDown: [0.1, 2] });
G('tidal_wave', '파도타기', '🏄', 3, { pow: 1.8, atkDown: [0.15, 3] });
G('tsunami', '해일', '🌊', 5, { pow: 2.6, atkDown: [0.25, 3], stun: 0.25 });
G('bubble_burst', '거품폭발', '🫧', 1, { pow: 1.25, stun: 0.1 });
G('tide_crash', '조수충돌', '🌊', 2, { pow: 1.6, atkDown: [0.12, 2] });
G('geyser', '간헐천', '⛲', 4, { pow: 2.3, stun: 0.2 });
G('whirlpool', '소용돌이', '🌀', 3, { pow: 1.4, hits: 2, atkDown: [0.2, 2] });
G('vine_whip', '덩굴채찍', '🌿', 1, { pow: 1.3, drain: 0.3 });
G('thorn_storm', '가시폭풍', '🌵', 3, { pow: 0.95, hits: 2, dot: ['bleed', 0.04, 3, 0.4] });
G('thorn_lash', '가시채찍', '🌹', 1, { pow: 1.2, dot: ['bleed', 0.03, 2, 0.3] });
G('root_crush', '뿌리짓밟기', '🌱', 3, { pow: 1.9, stun: 0.2 });
G('spore_cloud', '포자구름', '🍄', 2, { pow: 0.9, dot: ['poison', 0.05, 3, 0.8] });
G('pollen_storm', '꽃가루폭풍', '🌼', 3, { pow: 1.0, hits: 2, atkDown: [0.25, 2] });
G('solar_beam', '태양광선', '☀️', 5, { pow: 2.8, pierce: 0.3 });
G('spark', '스파크', '⚡', 1, { pow: 1.4, stun: 0.15 });
G('thunder', '번개', '🌩️', 3, { pow: 1.9, stun: 0.25 });
G('thunderstorm', '뇌우', '⛈️', 5, { pow: 2.5, stun: 0.4 });
G('lightning_fang', '번개송곳니', '⚡', 2, { pow: 1.5, stun: 0.2 });
G('static_field', '정전기장', '🔌', 2, { pow: 0.9, hits: 2, stun: 0.1 });
G('thunder_hammer', '뇌격망치', '🔨', 4, { pow: 2.6, stun: 0.35 });
G('ion_burst', '이온폭발', '💥', 3, { pow: 1.7, drainMana: 20 });
G('frost_touch', '서리손', '❄️', 1, { pow: 1.3, defDown: [0.1, 2] });
G('ice_shard', '얼음송곳', '🧊', 3, { pow: 1.9, defDown: [0.2, 3] });
G('blizzard', '눈보라', '🌨️', 5, { pow: 2.5, stun: 0.3, defDown: [0.25, 3] });
G('ice_fang', '얼음송곳니', '🦷', 2, { pow: 1.5, defDown: [0.2, 2] });
G('frozen_spike', '얼음가시', '🧊', 2, { pow: 1.4, stun: 0.15 });
G('hail_storm', '우박폭풍', '🌨', 4, { pow: 1.2, hits: 4, defDown: [0.1, 2] });
G('glacier_crush', '빙하붕괴', '🏔️', 5, { pow: 3.1, defDown: [0.3, 3], stun: 0.2 });
G('gust', '돌풍', '💨', 1, { pow: 1.3, crit: 0.15 });
G('wind_blade', '바람칼날', '🍃', 3, { pow: 0.85, hits: 2, crit: 0.1 });
G('tornado', '토네이도', '🌪️', 5, { pow: 0.95, hits: 3, crit: 0.1 });
G('gale_slash', '질풍베기', '⚡', 2, { pow: 1.6, crit: 0.15 });
G('cyclone', '회오리', '🌪', 3, { pow: 1.5, hits: 2 });
G('feather_dart', '깃털화살', '🪶', 2, { pow: 1.3, hits: 3 });
G('talon_dive', '급강하발톱', '🦅', 3, { pow: 2.2, crit: 0.1 });
G('gale_wing', '날개강타', '🪽', 3, { pow: 1.9, crit: 0.15 });
G('pebble', '자갈던지기', '🪨', 1, { pow: 1.45 });
G('earthquake', '지진', '🌍', 3, { pow: 2.0 });
G('meteor_fall', '운석낙하', '🌠', 5, { pow: 3.0, stun: 0.2 });
G('boulder_toss', '바위던지기', '🪨', 2, { pow: 1.8 });
G('stone_fist', '돌주먹', '✊', 1, { pow: 1.5, defDown: [0.1, 2] });
G('quake_stomp', '지각밟기', '👣', 3, { pow: 1.9, stun: 0.2 });
G('sand_blast', '모래폭풍', '🏜️', 2, { pow: 1.2, hits: 2, atkDown: [0.15, 2] });
G('dune_crush', '모래언덕', '🏝️', 3, { pow: 2.0, defDown: [0.2, 3] });
G('flash', '섬광', '✨', 1, { pow: 1.3, atkDown: [0.1, 2] });
G('holy_ray', '성스러운 빛', '🌟', 3, { pow: 1.8, heal: 0.1 });
G('judgement', '심판', '⚖️', 5, { pow: 2.4, exec: 1.6 });
G('shadow_claw', '그림자발톱', '🌑', 1, { pow: 1.4, dot: ['bleed', 0.04, 2, 0.3] });
G('shadow_bite', '그림자깨물기', '🌚', 2, { pow: 1.5, drain: 0.25 });
G('dark_pulse', '어둠의파동', '🌘', 3, { pow: 1.9, drain: 0.25 });
G('night_slash', '밤의베기', '🌃', 3, { pow: 1.9, crit: 0.2 });
G('soul_strike', '영혼타격', '💠', 3, { pow: 1.6, drainMana: 15 });
G('eclipse_ray', '일식광선', '🌘', 5, { pow: 2.9, pierce: 0.4, atkDown: [0.2, 3] });
G('void_collapse', '공허붕괴', '🕳️', 5, { pow: 2.9, pierce: 0.5 });
G('void_shot', '공허탄', '🌑', 3, { pow: 1.8, pierce: 0.3 });
G('poison_sting', '독침', '☠️', 1, { pow: 1.1, dot: ['poison', 0.05, 3, 0.6] });
G('toxic_fog', '독안개', '🧪', 3, { pow: 1.3, dot: ['poison', 0.07, 4, 0.8] });
G('plague', '대역병', '🦠', 5, { pow: 1.6, dot: ['poison', 0.09, 4, 1], atkDown: [0.2, 3] });
G('acid_spit', '산성침', '🧪', 2, { pow: 1.1, defDown: [0.2, 3], dot: ['poison', 0.04, 3, 0.4] });
G('hex_bolt', '저주탄', '🪄', 2, { pow: 1.2, dot: ['poison', 0.05, 3, 0.5] });
G('spirit_siphon', '영혼흡수', '👻', 3, { pow: 1.2, drain: 0.5 });
G('prism_ray', '프리즘광선', '🔺', 4, { pow: 2.2, crit: 0.25 });
G('echo_burst', '메아리', '📯', 3, { pow: 1.3, hits: 2, stun: 0.2 });
G('bounce_ball', '튀는공', '⚽', 1, { pow: 1.1, hits: 2 });
G('shard_storm', '파편폭풍', '🪨', 4, { pow: 1.1, hits: 3, pierce: 0.2 });
G('frenzy', '광란', '😵', 4, { pow: 1.0, hits: 5, recoil: 0.05 });

// ───────── 일반 스킬: 몸으로 부딪히기 · 연타 ─────────
G('quick_jab', '빠른 찌르기', '🥊', 1, { pow: 0.8, hits: 2 });
G('double_kick', '이단차기', '🦵', 2, { pow: 1.0, hits: 2 });
G('triple_slash', '삼연참', '🗡️', 3, { pow: 0.9, hits: 3 });
G('fury_swipes', '난타', '🐾', 3, { pow: 0.7, hits: 4 });
G('rush', '돌진', '🐗', 2, { pow: 1.7, recoil: 0.08 });
G('body_slam', '몸통박치기', '🏋️', 2, { pow: 1.7, stun: 0.15 });
G('headbutt', '박치기', '🤕', 3, { pow: 2.1, recoil: 0.1 });
G('heavy_strike', '강타', '🔨', 2, { pow: 1.9 });
G('execute', '마무리일격', '💀', 4, { pow: 1.6, exec: 2.2 });
G('piercing_shot', '관통사격', '🏹', 4, { pow: 2.0, pierce: 0.6 });
G('sniper', '저격', '🎯', 4, { pow: 2.2, crit: 0.4 });
G('armor_break', '방어파괴', '🪓', 2, { pow: 1.2, defDown: [0.3, 3] });
G('berserk', '광폭화', '😤', 3, { pow: 2.4, recoil: 0.15 });
G('reckless', '무모한 돌격', '🐂', 2, { pow: 2.2, recoil: 0.12 });
G('last_stand', '배수진', '🏴', 4, { pow: 3.0, recoil: 0.25 });
G('all_in', '전력투구', '💥', 5, { pow: 3.6, recoil: 0.3 });
G('bleed_slash', '출혈참', '🩸', 2, { pow: 1.2, dot: ['bleed', 0.05, 3, 0.6] });
G('pufferburst', '가시부풀기', '🐡', 2, { pow: 1.1, recoil: 0.03, dot: ['bleed', 0.04, 3, 0.5] });
G('counter_claw', '반격발톱', '🐾', 2, { pow: 1.4, recoil: 0.04 });
G('bone_crack', '뼈부수기', '🦴', 3, { pow: 2.0, defDown: [0.2, 2] });

// ───────── 일반 스킬: 회복 · 흡혈 ─────────
G('first_aid', '응급처치', '🩹', 1, { heal: 0.2 });
G('bandage', '붕대', '🧻', 1, { heal: 0.15, cleanse: true });
G('moss_cure', '이끼치료', '🌿', 1, { heal: 0.15 });
G('dew_drop', '이슬방울', '💧', 1, { heal: 0.12, mana: 5 });
G('deep_breath', '심호흡', '😮‍💨', 2, { heal: 0.3 });
G('honey_heal', '꿀치유', '🍯', 2, { heal: 0.25, mana: 5 });
G('nectar', '꿀물', '🍯', 2, { heal: 0.2, atkUp: [0.2, 2] });
G('cloud_nap', '구름낮잠', '💤', 2, { heal: 0.3, evade: 1 });
G('healing_light', '치유의 빛', '💖', 3, { heal: 0.45 });
G('lunar_rest', '달빛휴식', '🌙', 3, { heal: 0.3, cleanse: true });
G('fairy_dust', '요정가루', '🧚', 3, { heal: 0.2, cleanse: true, atkUp: [0.2, 2] });
G('sanctuary', '성역', '⛪', 4, { heal: 0.35, shield: 0.2 });
G('rejuvenate', '회춘', '✨', 4, { heal: 0.4, regen: [0.05, 3] });
G('phoenix_tears', '불사조의 눈물', '🕊️', 5, { heal: 0.7, cleanse: true });
G('regen_seed', '회복의 씨앗', '🌱', 2, { regen: [0.08, 4] });
G('rain_mend', '빗물회복', '🌧️', 2, { regen: [0.05, 3] });
G('spring_water', '샘물', '⛲', 3, { regen: [0.1, 4], cleanse: true });
G('hot_spring', '온천욕', '♨️', 3, { regen: [0.08, 3], cleanse: true });
G('vampire_bite', '흡혈', '🧛', 2, { pow: 1.5, drain: 0.4 });
G('life_drain', '생명흡수', '🩸', 3, { pow: 1.4, drain: 0.6 });
G('soul_feast', '영혼연회', '👻', 5, { pow: 2.2, drain: 0.8 });
G('blood_pact', '피의계약', '🩸', 4, { drain: 0.7, recoil: 0.05 });

// ───────── 일반 스킬: 방어 ─────────
G('guard', '방어태세', '🛡️', 1, { guard: [0.4, 2] });
G('harden', '단단해지기', '🧱', 1, { defUp: [0.3, 3] });
G('mud_wall', '진흙벽', '🧱', 2, { guard: [0.35, 2] });
G('barrier', '보호막', '🔰', 2, { shield: 0.2 });
G('stone_skin', '돌피부', '⛰️', 2, { defUp: [0.5, 3] });
G('thick_fur', '두꺼운털', '🐻', 2, { defUp: [0.35, 3] });
G('dodge_stance', '회피태세', '🌀', 2, { evade: 1 });
G('sand_cloak', '모래망토', '🧣', 2, { evade: 1, heal: 0.1 });
G('sunshade', '그늘막', '⛱️', 2, { shield: 0.15, heal: 0.1 });
G('shell_hide', '껍질숨기', '🐚', 2, { defUp: [0.3, 2], evade: 1 });
G('iron_wall', '철벽', '🏯', 3, { guard: [0.6, 3] });
G('crystal_shield', '수정방패', '💠', 3, { shield: 0.35 });
G('shadow_step', '그림자걸음', '👣', 3, { evade: 2 });
G('coral_guard', '산호방패', '🪸', 3, { guard: [0.45, 3] });
G('ice_armor', '얼음갑옷', '🥶', 3, { defUp: [0.4, 3], shield: 0.1 });
G('oak_bark', '참나무껍질', '🌳', 3, { shield: 0.25 });
G('feather_veil', '깃털베일', '🪶', 3, { evade: 2 });
G('bone_plate', '뼈갑옷', '🦴', 3, { defUp: [0.45, 3], shield: 0.15 });
G('fortress', '요새화', '🏰', 4, { guard: [0.7, 3], defUp: [0.3, 3] });
G('mirror_shield', '거울방패', '🪞', 4, { shield: 0.3, guard: [0.3, 2] });
G('steel_scale', '강철비늘', '🔩', 4, { defUp: [0.6, 3] });
G('bubble_dome', '물방울돔', '🔵', 4, { shield: 0.3, regen: [0.04, 3] });
G('adamant', '금강불괴', '💎', 5, { guard: [0.8, 3], shield: 0.3 });

// ───────── 일반 스킬: 강화 ─────────
G('power_up', '힘주기', '💪', 1, { atkUp: [0.3, 3] });
G('sharpen', '날갈기', '🗡️', 1, { atkUp: [0.25, 3] });
G('war_cry', '함성', '📣', 2, { atkUp: [0.45, 3] });
G('battle_roar', '전투함성', '📢', 2, { atkUp: [0.35, 3] });
G('adrenaline', '아드레날린', '💉', 2, { mana: 25 });
G('rage', '분노', '😡', 3, { atkUp: [0.7, 3] });
G('bulk_up', '벌크업', '🏋️‍♂️', 3, { atkUp: [0.3, 3], defUp: [0.3, 3] });
G('blessing', '축복', '🙏', 3, { atkUp: [0.3, 4], defUp: [0.3, 4], heal: 0.1 });
G('iron_will', '강철의 의지', '🧠', 3, { defUp: [0.3, 3], heal: 0.1 });
G('sun_blessing', '햇살축복', '🌞', 3, { atkUp: [0.3, 4], heal: 0.1 });
G('mana_surge', '마나폭주', '🔋', 3, { mana: 45, heal: 0.1 });
G('heart_drum', '심장북', '🥁', 3, { atkUp: [0.5, 2], mana: 10 });
G('dragon_dance', '용의 춤', '🐉', 4, { atkUp: [0.6, 4], mana: 15 });
G('deep_focus', '심상', '🔮', 4, { mana: 60 });
G('ancient_power', '고대의힘', '🏺', 4, { atkUp: [0.5, 4], defUp: [0.2, 4] });
G('overdrive', '오버드라이브', '⚙️', 5, { atkUp: [0.9, 3], defUp: [0.5, 3] });
G('charge_up', '충전', '🔋', 2, { mana: 20 });
G('focus_breath', '기마심호흡', '🫁', 2, { mana: 15, heal: 0.1 });
G('meditate', '명상', '🧘', 3, { mana: 30 });

// ───────── 일반 스킬: 약화 · 상태이상 ─────────
G('growl', '으르렁', '😾', 1, { atkDown: [0.2, 3] });
G('mocking_song', '놀림노래', '🎶', 1, { atkDown: [0.15, 2] });
G('intimidate', '위협', '👿', 2, { atkDown: [0.35, 3] });
G('weaken', '약화', '🔻', 3, { atkDown: [0.5, 3] });
G('sunder', '갑옷가르기', '⚔️', 2, { defDown: [0.3, 3] });
G('crumble', '와르르', '🧱', 2, { defDown: [0.25, 3] });
G('rust_touch', '녹스는 손', '🔩', 2, { defDown: [0.3, 2] });
G('corrode', '부식', '🧫', 3, { defDown: [0.5, 3] });
G('stun_strike', '기절타', '💫', 2, { pow: 0.6, stun: 0.5 });
G('paralyze', '마비가루', '🍄', 3, { stun: 0.65 });
G('sleep_dust', '수면가루', '😴', 3, { stun: 0.55 });
G('lullaby', '자장가', '🎵', 3, { stun: 0.4, atkDown: [0.15, 2] });
G('confusion_ray', '혼란광선', '🌀', 3, { stun: 0.3, atkDown: [0.2, 2] });
G('hypnosis', '최면', '😵‍💫', 4, { stun: 0.85 });
G('terror_gaze', '공포의 눈', '😱', 4, { atkDown: [0.4, 3], stun: 0.3 });
G('mana_burn', '마나연소', '🔥', 3, { pow: 1.2, drainMana: 30 });
G('curse', '저주', '🧿', 4, { atkDown: [0.3, 4], defDown: [0.3, 4] });
G('ember_curse', '불씨저주', '🕯️', 2, { dot: ['burn', 0.06, 3, 1] });
G('ember_brand', '불씨낙인', '🔥', 3, { dot: ['burn', 0.09, 3, 0.9], defDown: [0.2, 2] });
G('toxic_mist', '독무', '☁️', 3, { dot: ['poison', 0.06, 3, 0.6], atkDown: [0.15, 2] });
G('venom_fang', '맹독니', '🐍', 3, { pow: 1.3, dot: ['poison', 0.08, 4, 0.9] });
G('frostbite', '동상', '🥶', 3, { pow: 1.3, dot: ['burn', 0.06, 3, 0.7], atkDown: [0.2, 3] });
G('scorch', '그을림', '♨️', 2, { pow: 1.2, dot: ['burn', 0.05, 3, 0.8] });
G('soul_curse', '영혼저주', '☯️', 4, { dot: ['poison', 0.1, 4, 1], defDown: [0.25, 4] });

// ───────── 🆕 독창 스킬 (모든 펫이 배울 수 있어요 · 다른 게임에 잘 없는 특이한 규칙들) ─────────
// ★1
U('pillow_fight', '베개싸움', '🛏️', 1, { pow: 1.0, stun: 0.2, heal: 0.05 }, '푹신푹신 퍽! 아프진 않은데 눈이 스르르 감겨요.');
U('confetti', '색종이 폭죽', '🎊', 1, { pow: 1.2, atkDown: [0.1, 2], mana: 5 }, '팡! 하고 터지면 다들 눈이 휘둥그레져요.');
U('tickle', '간지럼 공격', '🪶', 1, { pow: 0.8, hits: 2, atkDown: [0.1, 2] }, '깃털로 살살… 웃음이 터져서 힘이 빠져요.');
U('lucky_penny', '행운의 동전', '🪙', 1, { pow: 1.0, gamble: [0.5, 2.0, 0.05] }, '동전 던지기! 앞면이면 두 배, 뒷면이면 아야.');
// ★2
U('dice_fury', '주사위 난타', '🎲', 2, { pow: 0.55, hitsRange: [1, 5] }, '몇 번 때릴지는 주사위만 알아요 (1~5번).');
U('comeback', '오기', '😤', 2, { pow: 1.3, revenge: 1.5 }, '아프면 아플수록 더 세게 때려요!');
U('mana_thief', '마나 도둑', '🧤', 2, { pow: 0.8, stealMana: 20, cost: 15 }, '슬쩍~ 상대 마나를 내 주머니로.');
U('piggy_bank', '저금통 깨기', '🐷', 2, { pow: 1.5, mana: 15 }, '쨍그랑! 마나 동전이 와르르 쏟아져요.');
U('hot_potato', '뜨거운 감자', '🥔', 2, { pow: 1.2, dot: ['burn', 0.05, 3, 0.9], atkDown: [0.15, 2] }, '앗 뜨거! 던졌더니 상대가 데어요.');
U('ghost_prank', '도깨비 장난', '🎭', 2, { atkDown: [0.25, 3], defDown: [0.2, 3] }, '"왁!" 깜짝 놀라서 온몸에 힘이 빠져요.');
// ★3
U('time_bomb', '시한폭탄', '💣', 3, { bomb: [3.0, 3] }, '똑딱똑딱… 3턴 뒤에 쾅! 방어도 소용없어요.');
U('fireworks', '불꽃놀이', '🎆', 3, { pow: 0.9, detonate: 1.5, dot: ['burn', 0.05, 3, 1] }, '이미 걸린 불씨를 한꺼번에 팡팡! 터뜨리고 새 불씨를 심어요.');
U('lucky_seven', '럭키 세븐', '🎰', 3, { pow: 0.75, hitsRange: [1, 7] }, '1번일까 7번일까? 7번 나오면 대박이에요.');
U('mana_vampire', '마나 흡혈', '🧛‍♂️', 3, { pow: 1.3, stealMana: 40, drain: 0.2 }, '피와 마나를 한꺼번에 쪽쪽 빨아요.');
U('echo_chamber', '메아리 방', '🔊', 3, { echo: 3, cost: 20 }, '3턴 안에 쓰는 다음 공격 스킬이 한 번 더 울려 퍼져요.');
U('dance_battle', '댄스 배틀', '💃', 3, { atkUp: [0.4, 3], mana: 20, heal: 0.1 }, '흥이 오르면 힘도 마나도 솟아요!');
U('sugar_rush', '설탕 폭주', '🍬', 3, { atkUp: [0.5, 3], mana: 25, recoil: 0.08 }, '당이 확 올라서 신나지만… 뒤가 좀 무서워요.');
// ★4
U('all_in_gamble', '올인 도박', '🎰', 4, { pow: 1.6, gamble: [0.4, 3.6, 0.2] }, '40%에 모든 걸 걸어요. 터지면 엄청난 한 방!');
U('last_gasp', '마지막 발악', '🩸', 4, { pow: 1.8, revenge: 2.0 }, '체력이 바닥일수록 무서운 한 방이 나가요.');
U('mana_flood', '마나 대방출', '🌊', 4, { pow: 1.0, overload: 0.025, cost: 20 }, '남은 마나를 전부 쏟아부어요. 모아둘수록 세져요!');
U('chain_reaction', '연쇄반응', '⛓️', 4, { pow: 1.2, detonate: 2.0 }, '화상·독·출혈이 걸려 있으면 남은 피해를 한꺼번에 폭발시켜요.');
// ★5
U('fate_swap', '운명 교환', '🔀', 5, { swapHp: true }, '"당신의 건강은 이제 내 것." 내 체력이 더 낮으면 서로의 체력 비율을 바꿔요.');
U('doomsday_clock', '종말의 시계', '🕰️', 5, { bomb: [5.5, 4], defDown: [0.2, 4] }, '시곗바늘이 12를 가리키면 모든 게 끝나요.');
U('mana_nova', '마나 초신성', '🌟', 5, { pow: 1.2, overload: 0.035, pierce: 0.3, cost: 30 }, '쌓아둔 마나가 별처럼 폭발해요. 방어도 뚫어요!');
U('devil_dice', '악마의 주사위', '😈', 5, { pow: 1.8, gamble: [0.3, 5.0, 0.3] }, '30%의 기적에 나를 걸어요. 실패하면 많이 아파요.');

// ───────── 🆕 2차 확장 스킬 (배치 1 — manaMaxUp·manaRegenUp·steal·turnCut·truePct·mercy·burstAtk·debuffToBuff·coinflip·defToAtk·healCut 예시) ─────────
U('mana_surge', '마나증폭', '🔷', 2, { manaMaxUp: [30, 3] }, '그릇이 커져서 마나를 더 담을 수 있어요.');
U('mana_spring', '마나샘', '💧', 2, { manaRegenUp: [10, 3] }, '퐁퐁 솟아나는 마나샘이 생겨요.');
U('power_steal', '힘흡수', '🧲', 3, { steal: ['atk', 0.3, 3] }, '상대의 힘을 쭉 빨아들여요.');
U('iron_steal', '철벽흡수', '🧲', 3, { steal: ['def', 0.3, 3] }, '상대의 단단함을 내 것으로!');
U('time_cut', '시간깎기', '⏳', 2, { turnCut: 2 }, '상대에게 걸린 좋은 효과의 시간을 싹둑 잘라요.');
U('true_strike', '필중가격', '🎯', 3, { pow: 1.2, truePct: 0.1 }, '방어를 뚫는 확정 타격이 추가로 꽂혀요.');
U('mercy_blow', '자비의일격', '🕊️', 2, { pow: 1.5, mercy: true }, '세게 때리지만 상대는 체력 1%로 꼭 살아남아요.');
U('overdrive', '초출력', '🔥', 4, { burstAtk: [5, 1] }, '한계를 넘어 공격력이 폭주해요! (×500%)');
U('silver_lining', '전화위복', '🔄', 3, { debuffToBuff: true }, '나쁜 일도 생각하기 나름! 디버프가 전부 버프로.');
U('all_or_nothing', '모아니면도', '🎲', 3, { coinflip: 2 }, '이판사판! 받는 공격이 2배 아니면 0이 돼요.');
U('berserk_wall', '벽격투', '⚔️', 3, { defToAtk: 3 }, '방패를 내려놓고 그 힘을 전부 주먹에 실어요.');
U('plague_touch', '역병손길', '🚑', 3, { pow: 1.3, healCut: [0.5, 3] }, '손이 닿으면 회복이 잘 안 돼요…');

// ───────── 🆕 3차 확장 스킬 (배치 2: 스피드·복사·분신·반사·공포·선공) ─────────
U('speed_steal', '속도흡수', '👟', 3, { steal: ['spd', 0.3, 3] }, '상대의 발걸음을 훔쳐서 내 것으로!');
U('quick_step', '선수필승', '⏱️', 2, { priority: 1 }, '다음 턴, 스피드와 상관없이 내가 먼저 움직여요.');
U('time_leap', '시간 도약', '⏩', 4, { priority: 2, atkUp: [0.3, 3] }, '시간이 멈춘 듯 2턴 동안 항상 먼저! 힘도 솟아요.');
U('copycat', '따라하기', '🦜', 3, { copy: true, cost: 25 }, '상대가 방금 쓴 그 스킬, 나도 쓸 수 있어요!');
U('shadow_clone', '분신술', '👥', 3, { clone: [0.5, 0.6, 3] }, '내가 둘이 됐어요! 같이 때리고 대신 맞아줘요.');
U('mirror_coat', '반사의 갑옷', '🪞', 3, { reflect: [1.0, 2] }, '맞은 만큼 그대로 돌려줘요.');
U('mirror_veil', '거울 장막', '🔮', 3, { reflectDebuff: 2 }, '나쁜 기운은 전부 튕겨서 보낸 사람에게!');
U('dread_counter', '공포의 반격', '😱', 4, { pow: 1.4, fear: 0.8 }, '맞은 아픔이 두려움이 되고, 두려움이 힘이 돼요.');

// ───────── 🌈 속성 상성 스킬 (약점 노리기 · 반감 무시 · 방벽 · 속성 변환) ─────────
G('weak_point', '약점 찌르기', '🎯', 2, { pow: 1.2, weakBonus: 0.5 });
G('keen_eye', '약점 간파', '👁️', 3, { pow: 1.6, weakBonus: 0.8 });
G('adapt_strike', '적응 타격', '🧬', 3, { pow: 1.6, ignoreResist: true });
G('resist_breaker', '상성 파괴', '🔓', 4, { pow: 2.0, ignoreResist: true, weakBonus: 0.3 });
G('prism_crash', '프리즘 파열', '🌈', 4, { pow: 1.8, ignoreResist: true, weakBonus: 0.5 });
G('elem_collapse', '속성 붕괴', '💠', 5, { pow: 2.6, ignoreResist: true, weakBonus: 0.8, pierce: 0.2 });
G('elem_ward', '속성 방벽', '🔮', 2, { ward: 3 });
G('prism_barrier', '프리즘 방벽', '🪩', 4, { ward: 4, shield: 0.2 });
// 속성 변환: 몇 턴 동안 내 펫이 그 속성으로 변해요 (같은 속성 스킬 보너스 + 방어 상성도 같이 바뀌어요)
const ATTUNE = {
  fire: ['불꽃 변신', '🔥', '온몸이 활활! 불의 기운을 두른다.'],
  water: ['물결 변신', '💧', '몸이 찰랑찰랑 물처럼 흘러요.'],
  grass: ['숲의 변신', '🌿', '덩굴과 잎사귀가 온몸을 감싸요.'],
  electric: ['번개 변신', '⚡', '털끝이 파직파직 곤두서요.'],
  ice: ['서리 변신', '❄️', '숨결이 하얗게 얼어붙어요.'],
  wind: ['바람 변신', '🌪️', '몸이 깃털처럼 가벼워져요.'],
  earth: ['대지 변신', '⛰️', '몸이 바위처럼 단단해져요.'],
  light: ['빛의 변신', '✨', '온몸이 눈부시게 반짝여요.'],
  dark: ['그림자 변신', '🌑', '그림자 속으로 스르륵 스며들어요.'],
  poison: ['독안개 변신', '☠️', '보라색 안개가 몸을 감싸요.'],
};
for (const [e, [name, emoji, flavor]] of Object.entries(ATTUNE)) add(`attune_${e}`, name, emoji, 2, { convert: [e, 3] }, { elem: e, flavor });
// 속성별 새 공격·보조 스킬
G('sunbeam', '햇살화살', '🌅', 1, { pow: 1.35, heal: 0.05 });
G('aurora', '오로라', '🌌', 3, { pow: 1.7, cleanse: true });
G('starfall', '별똥비', '🌠', 4, { pow: 0.9, hits: 3, pierce: 0.2 });
G('nightmare', '악몽', '😈', 2, { pow: 1.2, stun: 0.25 });
G('abyss_maw', '심연의 아가리', '🕳️', 4, { pow: 2.3, exec: 1.6, drain: 0.2 });
G('toxic_spore', '독포자', '🍄', 1, { pow: 1.1, dot: ['poison', 0.04, 3, 0.5] });
G('acid_rain', '산성비', '🌧️', 4, { pow: 1.3, hits: 2, defDown: [0.25, 3], dot: ['poison', 0.05, 3, 0.6] });
G('rockslide', '낙석', '🪨', 2, { pow: 0.8, hits: 3 });
G('tremor', '지진파', '📳', 4, { pow: 2.2, defDown: [0.2, 3] });
G('chain_lightning', '연쇄번개', '🔗', 4, { pow: 1.1, hits: 3, stun: 0.2 });
G('ice_wall', '얼음벽', '🧊', 2, { guard: [0.4, 2], defUp: [0.2, 2] });
G('tailwind', '순풍', '🍃', 2, { atkUp: [0.3, 3], evade: 1 });
G('purify_water', '정화수', '🫗', 3, { heal: 0.2, cleanse: true });
G('photosynth', '광합성', '🌱', 2, { heal: 0.15, regen: [0.05, 3] });
G('wildfire', '들불', '🔥', 4, { pow: 1.2, hits: 2, dot: ['burn', 0.07, 3, 0.8] });

// ───────── 🆕 3차 확장 (배치 3): 효과 이동 · 능력치 룰렛 · 쿨타임 · 부활 · 스킬 면역 · 대천사 ─────────
U('buff_thief', '버프 도둑', '🦹', 3, { buffXfer: ['steal', 3] }, '상대가 두른 좋은 기운을 슬쩍 가로채요. 한 번만!');
U('curse_dump', '저주 떠넘기기', '🎁', 3, { buffXfer: ['give', 3] }, '내가 맞은 나쁜 기운을 예쁘게 포장해서 상대에게 선물해요.');
U('fate_trade', '운명 교환', '🔁', 4, { buffXfer: ['swap', 3] }, '좋은 건 내 거, 나쁜 건 네 거!');
U('stat_shake', '능력치 뒤섞기', '🎰', 2, { statRoll: ['swap', 'self', 3] }, '내 힘과 방어와 속도를 흔들어 두 개를 바꿔요.');
U('stat_roulette', '능력치 룰렛', '🎡', 3, { statRoll: ['random', 'self', 3] }, '돌아라 돌아라~ 어떤 능력치가 멈출까?');
U('foe_roulette', '상대 룰렛', '🌀', 3, { statRoll: ['random', 'foe', 3] }, '상대의 능력치 판을 빙글빙글 흔들어요.');
U('chaos_swap', '혼돈의 맞바꿈', '🌪️', 4, { statRoll: ['swap', 'foe', 3] }, '상대의 힘과 방어와 속도가 뒤죽박죽!');
U('time_rewind', '시간 되감기', '⏪', 3, { cdReset: 99, mana: 10 }, '시계를 거꾸로 돌려 모든 스킬을 다시 쓸 수 있게 해요.');
U('revival', '부활', '🪽', 5, { revive: [0.5, 3], cd: 6, elem: 'light' }, '3턴 동안, 쓰러져도 날개를 펴고 다시 일어나요.');
U('skill_ward', '스킬 면역', '🧿', 4, { skillImmune: 2, cd: 4, elem: 'light' }, '어떤 스킬도 통하지 않는 투명한 막이 둘러싸요.');
U('void_veil', '무효의 장막', '🕳️', 5, { skillImmune: 3, cd: 6, elem: 'dark' }, '스킬이라는 스킬은 전부 허공으로 사라져요.');
U('archangel_bless', '대천사의 축복', '👼', 5, { archBless: [2, 0.3], cd: 3, elem: 'light' }, '맞은 아픔을 두 배의 빛으로 돌려받고, 그 빛이 상대를 꿰뚫어요.');


// ───────── 🆕 4차 확장 (배치 4): 조커 · 금단의 저주 · 저주부여 · 악마와의 거래 ─────────
// (기존 일반 스킬 '저주'(curse)와 이름이 겹치지 않게 새 저주는 '금단의 저주'(forbidden_curse) 예요)
U('joker', '조커', '🃏', 5, { joker: true, cost: 50, elem: 'dark' }, '내 카드 한 장과 상대 카드 한 장을 슬쩍 바꿔치기! 상대 손에 조커가 들어가면… 큰일이에요.');
U('forbidden_curse', '금단의 저주', '🧿', 4, { curse: [2, 4], cost: 25, cd: 5, elem: 'dark' }, '나 자신에게 저주를 걸어요. 아프지만, 그 저주는 곧 누군가에게 돌아가요.');
U('curse_grant', '저주부여', '🪬', 4, { curseGrant: 3, cost: 20, elem: 'dark', hidden: true }, '내가 받은 저주를 세 배로 키워서 선물해요. (금단의 저주를 쓴 다음 턴에만 나타나요)');
U('devil_deal', '악마와의 거래', '😈', 5, { devilDeal: [2, 3], cost: 60, cd: 6, elem: 'dark' }, '"2턴 안에 끝내면 공짜, 못 끝내면… 준 만큼의 세 배를 받아가지."');

// ───────── 🆕 5차 확장 (배치 5 — 일부): 포획 전문가 · 전투 중 버프 ─────────
// 포획 전문가: 14턴(★5 는 15턴) 동안 도망을 막고 잡기 쉬워져요. 처음 붙잡을 때 제한 턴 +15.
U('catch_expert', '포획 전문가', '🪢', 4, { catchPro: [0.2, 15], cost: 35, cd: 8, elem: 'normal' }, '도망칠 틈은 없어요. 한 번 노린 사냥감은 놓치지 않아요.');
U('catch_master', '포획 대가', '🪢', 5, { catchPro: [0.2, 15], cost: 55, cd: 8, elem: 'normal' }, '전설의 사냥꾼. 하늘 끝까지 쫓아가서라도 붙잡아요.');
// 전투 중 버프 (이번 전투가 끝날 때까지 · 겹쳐 쓰면 쌓여요)
U('catch_aura', '포획의 기운', '🎯', 2, { fightBuff: { catch: 0.15 } }, '야생 펫이 왠지 순해져요. 볼이 더 잘 들어가요.');
U('calm_wild', '진정의 노래', '🕊️', 2, { fightBuff: { flee: 0.2 } }, '야생 펫이 이 자리를 떠나기 싫어져요.');
U('exp_spring', '경험의 샘', '⭐', 2, { fightBuff: { exp: 0.3 } }, '싸울수록 배움이 솟아나요.');
U('gold_touch', '황금 손', '💰', 2, { fightBuff: { gold: 0.4 } }, '손대는 곳마다 금화가 반짝여요.');
U('growth_bless', '성장의 축복', '🐾', 2, { fightBuff: { petExp: 0.3 } }, '펫이 이번 싸움에서 더 많이 자라요.');
U('treasure_sense', '보물 감각', '🎁', 3, { fightBuff: { equip: 0.5 } }, '떨어진 장비가 눈에 쏙 들어와요.');
U('hunter_blessing', '사냥꾼의 가호', '🏹', 4, { fightBuff: { catch: 0.1, flee: 0.1, exp: 0.15, gold: 0.15, petExp: 0.15, equip: 0.2 } }, '사냥에 도움이 되는 모든 행운이 조금씩.');

// ───────── 전용기 (그 펫만 배울 수 있어요 · 같은 마나의 일반 스킬보다 세요) ─────────
// 스타팅
P('pyro_cat', 'sig_pyro_cat', '불꽃 발톱', '🐾', 2, { pow: 2.1, dot: ['burn', 0.06, 3, 0.6] }, '꼬리 끝 불꽃을 발톱에 모아 할퀴어요.');
P('aqua_pup', 'sig_aqua_pup', '물방울 방패', '🫧', 2, { shield: 0.3, heal: 0.12 }, '커다란 물방울이 몸을 감싸요.');
P('leaf_bun', 'sig_leaf_bun', '잎사귀 춤', '🍃', 2, { pow: 1.6, drain: 0.5 }, '잎사귀가 빙글빙글, 맞은 상대의 기운을 쏙 빨아와요.');
// 초원
P('slime', 'sig_slime', '말랑 폭탄', '🟢', 1, { pow: 1.7, stun: 0.3 }, '온몸을 부풀렸다가 퐁! 터뜨려요.');
P('slime', 'sig_slime2', '끈적 방울', '🫧', 2, { atkDown: [0.25, 3], heal: 0.1 }, '끈적한 방울이 몸에 달라붙어요.');
P('mouse', 'sig_mouse', '번개 달리기', '🐭', 1, { pow: 0.9, hits: 3 }, '눈 깜짝할 새 세 번 부딪혀요.');
P('bee', 'sig_bee', '필살 독침', '🐝', 2, { pow: 2.0, dot: ['poison', 0.07, 4, 0.9] }, '딱 한 번 쏘는 아주 아픈 침!');
P('rabbit', 'sig_rabbit', '달토끼 발차기', '🐰', 1, { pow: 1.0, hits: 2, crit: 0.25 }, '높이 뛰어올라 두 번 걷어차요.');
P('ladybug', 'sig_ladybug', '행운의 점박이', '🐞', 2, { defUp: [0.4, 3], regen: [0.06, 3] }, '등의 점이 반짝이면 행운이 따라와요.');
P('butterfly', 'sig_butterfly', '비늘가루 춤', '🦋', 2, { pow: 1.4, atkDown: [0.25, 3], stun: 0.25 }, '반짝이는 가루에 상대가 어질어질해져요.');
P('clover_fairy', 'sig_clover_fairy', '네잎의 축복', '🍀', 2, { heal: 0.3, atkUp: [0.3, 3], mana: 10 }, '네잎클로버가 행운과 기운을 나눠줘요.');
// 숲
P('owl', 'sig_owl', '밤눈 사냥', '🦉', 2, { pow: 1.9, crit: 0.35 }, '어둠 속에서도 약점을 정확히 찔러요.');
P('owl', 'sig_owl2', '침묵의 날갯짓', '🌙', 3, { evade: 2, stun: 0.2 }, '소리 없이 날아와 방심한 틈을 노려요.');
P('fox', 'sig_fox', '여우불 홀리기', '🦊', 3, { pow: 2.2, dot: ['burn', 0.06, 3, 0.7], stun: 0.2 }, '푸른 여우불이 길을 잃게 만들어요.');
P('treant', 'sig_treant', '뿌리 감옥', '🌳', 4, { pow: 2.4, stun: 0.5, defDown: [0.3, 3] }, '땅속 뿌리가 솟아올라 꽁꽁 묶어요.');
P('treant', 'sig_treant2', '숲의 숨결', '🌲', 3, { heal: 0.4, regen: [0.08, 3] }, '오래된 숲이 상처를 감싸줘요.');
P('deer', 'sig_deer', '새벽 뿔치기', '🦌', 2, { pow: 2.0, pierce: 0.3 }, '새벽빛을 두른 뿔로 들이받아요.');
P('squirrel', 'sig_squirrel', '도토리 연발', '🐿️', 2, { pow: 0.8, hits: 4 }, '도토리를 네 개나 던져요!');
P('mushroom', 'sig_mushroom', '포자 폭발', '🍄', 3, { pow: 1.5, stun: 0.45, dot: ['poison', 0.06, 3, 0.7] }, '버섯 머리에서 포자가 퐁퐁!');
P('wolf', 'sig_wolf', '그림자 사냥', '🐺', 4, { pow: 2.7, crit: 0.3, exec: 1.5 }, '그림자 속에서 튀어나와 단숨에 물어요.');
P('wolf', 'sig_wolf2', '달빛 울음', '🌕', 3, { atkUp: [0.4, 3], drain: 0.2 }, '달을 보며 길게 울면 힘이 솟아요.');
P('boar', 'sig_boar', '멧돼지 돌진', '🐗', 2, { pow: 2.3, recoil: 0.06, stun: 0.25 }, '앞뒤 안 보고 쾅! 돌진해요.');
P('unicorn', 'sig_unicorn', '무지갯빛 뿔', '🦄', 4, { pow: 2.4, heal: 0.25, cleanse: true }, '뿔에서 번진 빛이 아픈 곳을 낫게 해줘요.');
P('unicorn', 'sig_unicorn2', '순결의 돌진', '🌈', 5, { pow: 3.1, pierce: 0.4, stun: 0.3 }, '무지개를 가르며 달려가요.');
// 동굴
P('bat', 'sig_bat', '초음파 비명', '🦇', 2, { pow: 1.5, stun: 0.4 }, '귀가 윙윙! 정신이 없어져요.');
P('golem', 'sig_golem', '바위 주먹', '🪨', 3, { pow: 2.6, stun: 0.3 }, '집채만 한 바위 주먹을 내리쳐요.');
P('golem', 'sig_golem2', '암석 갑옷', '⛰️', 3, { guard: [0.65, 3], defUp: [0.4, 3] }, '온몸에 바위를 둘러요.');
P('spider', 'sig_spider', '거미줄 포박', '🕷️', 2, { pow: 1.4, stun: 0.45, atkDown: [0.2, 3] }, '끈끈한 줄에 몸이 묶여요.');
P('scorpion', 'sig_scorpion', '왕전갈 꼬리침', '🦂', 3, { pow: 2.1, dot: ['poison', 0.08, 4, 0.9] }, '꼬리 끝 독침이 깊이 박혀요.');
P('crystal', 'sig_crystal', '수정 폭풍', '💎', 4, { pow: 1.0, hits: 3, pierce: 0.3 }, '수정 조각이 소나기처럼 쏟아져요.');
P('skeleton', 'sig_skeleton', '뼈다귀 난무', '💀', 2, { pow: 0.85, hits: 3, dot: ['bleed', 0.04, 3, 0.4] }, '뼈칼을 정신없이 휘둘러요.');
P('ghost', 'sig_ghost', '으스스 속삭임', '👻', 3, { atkDown: [0.4, 4], stun: 0.5 }, '귓가에 소름 돋는 속삭임이...');
P('ghost', 'sig_ghost2', '영혼 빨대', '🫥', 3, { pow: 1.3, drain: 0.6 }, '희미한 손이 기운을 빨아가요.');
// 바다
P('crab', 'sig_crab', '집게 가위', '🦀', 3, { pow: 2.2, defDown: [0.3, 3] }, '단단한 집게로 갑옷을 싹둑!');
P('shark', 'sig_shark', '심해 한입', '🦈', 4, { pow: 2.8, exec: 1.6, drain: 0.2 }, '피 냄새를 맡고 한입에 덥석!');
P('pufferfish', 'sig_pufferfish', '뾰족 폭발', '🐡', 2, { pow: 1.9, recoil: 0.05, dot: ['bleed', 0.04, 3, 0.5] }, '풍선처럼 부풀었다가 가시가 사방으로!');
P('octopus', 'sig_octopus', '먹물 연막', '🐙', 3, { evade: 2, atkDown: [0.3, 3], heal: 0.1 }, '새까만 먹물 속으로 쏙 숨어요.');
P('octopus', 'sig_octopus2', '빨판 조이기', '🌀', 3, { pow: 1.5, stun: 0.3, drain: 0.2 }, '여덟 개 다리로 꽁꽁 감아요.');
P('whale', 'sig_whale', '고래 노래', '🐋', 4, { heal: 0.5, regen: [0.08, 4], mana: 20 }, '깊고 느린 노래가 바다를 울려요.');
P('whale', 'sig_whale2', '대양의 꼬리치기', '🌊', 5, { pow: 3.2, stun: 0.35 }, '바다 전체가 흔들리는 꼬리치기!');
P('turtle', 'sig_turtle', '등껍질 수비', '🐢', 3, { guard: [0.7, 3], regen: [0.07, 3] }, '등껍질 속에서 천천히 숨을 골라요.');
P('mermaid', 'sig_mermaid', '인어의 자장가', '🧜', 4, { stun: 0.9, heal: 0.2, drainMana: 20 }, '달콤한 노랫소리에 스르르 잠이 와요.');
P('turtle', 'sig_turtle2', '거북 박치기', '🐢', 2, { pow: 1.6, defUp: [0.3, 2] }, '느리지만 묵직하게 들이받아요.');
// 화산
P('baby_dragon', 'sig_baby_dragon', '아기 불꽃숨', '🐲', 4, { pow: 2.7, dot: ['burn', 0.07, 3, 0.8] }, '아직 서툴지만 불꽃은 진짜예요!');
P('phoenix', 'sig_phoenix', '불사의 날갯짓', '🦅', 5, { pow: 2.4, heal: 0.4, cleanse: true }, '불꽃 날개가 상처를 태워 새로 태어나요.');
P('phoenix', 'sig_phoenix2', '환생의 불길', '🔥', 4, { regen: [0.12, 4], atkUp: [0.4, 3] }, '타오를수록 힘이 솟아요.');
P('magma_slime', 'sig_magma_slime', '용암 튀기기', '🟠', 3, { pow: 1.9, dot: ['burn', 0.08, 3, 0.9] }, '뜨거운 용암이 철퍽!');
P('salamander', 'sig_salamander', '불꽃 꼬리채찍', '🦎', 3, { pow: 2.0, hits: 2, dot: ['burn', 0.05, 3, 0.5] }, '꼬리를 두 번 휘둘러요.');
P('flame_lord', 'sig_flame_lord', '화염 군림', '👹', 5, { pow: 3.0, dot: ['burn', 0.09, 4, 1], atkDown: [0.25, 3] }, '불꽃의 왕이 내려보면 모두 움츠러들어요.');
P('flame_lord', 'sig_flame_lord2', '마왕의 포효', '😈', 4, { atkUp: [0.7, 3], stun: 0.4 }, '화산이 부르르 떨리는 포효!');
P('fire_dragon', 'sig_fire_dragon', '용왕의 업화', '🐉', 5, { pow: 3.6, dot: ['burn', 0.1, 4, 1], pierce: 0.3 }, '모든 것을 재로 만드는 용왕의 불꽃.');
P('fire_dragon', 'sig_fire_dragon2', '용의 위엄', '👑', 4, { atkUp: [0.6, 4], guard: [0.5, 3] }, '날개를 펴면 하늘이 붉게 물들어요.');
// 안개 늪
P('frog', 'sig_frog', '개굴 합창', '🐸', 2, { pow: 1.5, stun: 0.35 }, '개굴개굴! 시끄러워서 깜짝 놀라요.');
P('snake', 'sig_snake', '독니 일격', '🐍', 3, { pow: 2.1, dot: ['poison', 0.09, 4, 1] }, '송곳니에서 맹독이 퍼져요.');
P('croc', 'sig_croc', '죽음의 회전', '🐊', 3, { pow: 2.5, defDown: [0.25, 3], recoil: 0.04 }, '물고 빙글빙글! 놓치는 법이 없어요.');
P('wisp', 'sig_wisp', '길잃은 불빛', '🕯️', 4, { pow: 2.0, stun: 0.5, drainMana: 25 }, '따라가다 보면 어느새 낭떠러지...');
P('witch', 'sig_witch', '늪 마녀의 저주', '🧙', 5, { atkDown: [0.4, 4], defDown: [0.4, 4], dot: ['poison', 0.1, 4, 1] }, '보글보글 끓는 솥에서 저주가 피어올라요.');
P('witch', 'sig_witch2', '마녀의 영약', '🧪', 4, { heal: 0.45, mana: 30, cleanse: true }, '정체불명 영약, 효과는 확실해요.');
// 불볕 사막
P('camel', 'sig_camel', '혹 저장고', '🐪', 2, { heal: 0.35, mana: 15 }, '혹에 저장해 둔 영양분으로 힘을 내요.');
P('cactus', 'sig_cactus', '가시 갑옷', '🌵', 3, { guard: [0.5, 3], shield: 0.25 }, '건드리면 따끔! 가시가 곤두서요.');
P('scarab', 'sig_scarab', '황금 광택', '🪲', 3, { defUp: [0.6, 3], pow: 1.6 }, '번쩍이는 껍질이 공격을 튕겨내요.');
P('lion', 'sig_lion', '사막의 왕 포효', '🦁', 4, { pow: 2.6, atkUp: [0.4, 3], stun: 0.3 }, '사막이 쩌렁쩌렁 울려요.');
P('mummy', 'sig_mummy', '파라오의 저주', '⚰️', 5, { pow: 2.4, atkDown: [0.4, 4], dot: ['poison', 0.08, 4, 1] }, '붕대가 풀리며 오래된 저주가 퍼져요.');
P('mummy', 'sig_mummy2', '붕대 감기', '🧻', 3, { shield: 0.3, heal: 0.25 }, '다친 곳을 꽁꽁 싸매요.');
P('sandworm', 'sig_sandworm', '모래 삼키기', '🐛', 5, { pow: 3.3, exec: 1.7, stun: 0.25 }, '땅속에서 솟구쳐 통째로 삼켜요.');
// 얼음 설원
P('penguin', 'sig_penguin', '배치기 미끄럼', '🐧', 2, { pow: 1.9, stun: 0.25 }, '쭈우욱~ 미끄러져 쾅!');
P('bear', 'sig_bear', '흰곰 앞발치기', '🐻', 3, { pow: 2.5, crit: 0.2 }, '묵직한 앞발이 휙!');
P('yeti', 'sig_yeti', '설인의 눈덩이', '🦍', 4, { pow: 2.4, defDown: [0.3, 3], stun: 0.3 }, '집채만 한 눈덩이를 굴려요.');
P('ice_spirit', 'sig_ice_spirit', '얼음 감옥', '🧊', 4, { pow: 1.8, stun: 0.65, defDown: [0.25, 3] }, '순식간에 꽁꽁 얼려요.');
P('frost_dragon', 'sig_frost_dragon', '서리 숨결', '❄️', 5, { pow: 3.0, stun: 0.4, dot: ['burn', 0.07, 3, 0.8] }, '닿는 곳마다 얼음꽃이 피어요.');
P('frost_dragon', 'sig_frost_dragon2', '서리 비늘', '🛡️', 4, { guard: [0.6, 3], defUp: [0.5, 3] }, '얼음 비늘이 모든 공격을 튕겨요.');
P('ice_queen', 'sig_ice_queen', '영원한 겨울', '👸', 5, { pow: 2.8, stun: 0.5, atkDown: [0.35, 4], defDown: [0.3, 4] }, '세상이 하얗게, 아주 조용해져요.');
P('ice_queen', 'sig_ice_queen2', '여왕의 칙령', '👑', 4, { shield: 0.4, mana: 30 }, '"감히 내 앞에서."');
// 구름 하늘섬
P('cloud_sheep', 'sig_cloud_sheep', '구름 이불', '🐑', 2, { heal: 0.3, evade: 1 }, '포근한 구름이 감싸 안아요.');
P('parrot', 'sig_parrot', '따라쟁이 합창', '🦜', 3, { pow: 1.0, hits: 3, atkDown: [0.2, 3] }, '상대의 말을 따라 하며 약을 올려요.');
P('thunder_bird', 'sig_thunder_bird', '벼락 급강하', '⚡', 4, { pow: 2.8, stun: 0.45, pierce: 0.2 }, '하늘에서 벼락처럼 내리꽂아요.');
P('pegasus', 'sig_pegasus', '천마 질주', '🐴', 4, { pow: 1.2, hits: 3, crit: 0.2 }, '하늘을 가르며 세 번 스쳐 지나가요.');
P('wyvern', 'sig_wyvern', '와이번 꼬리독', '🦖', 5, { pow: 2.9, dot: ['poison', 0.1, 4, 1] }, '꼬리 끝 독침이 번쩍!');
P('wyvern', 'sig_wyvern2', '급강하 폭격', '☁️', 4, { pow: 3.2, recoil: 0.12 }, '구름을 뚫고 떨어지는 폭격!');
P('angel', 'sig_angel', '심판의 나팔', '👼', 5, { pow: 2.9, exec: 1.8, stun: 0.3 }, '나팔 소리가 울리면 심판이 시작돼요.');
P('angel', 'sig_angel2', '천사의 치유', '😇', 5, { heal: 0.6, cleanse: true, regen: [0.08, 4] }, '날개 끝에서 따뜻한 빛이 내려와요.');
P('sun_god', 'sig_sun_god', '태양의 심판', '☀️', 5, { pow: 3.9, pierce: 0.5, dot: ['burn', 0.1, 4, 1] }, '새하얀 햇빛이 모든 것을 꿰뚫어요.');
P('sun_god', 'sig_sun_god2', '일출의 가호', '🌅', 5, { heal: 0.5, atkUp: [0.8, 4], defUp: [0.5, 4] }, '해가 떠오르면 힘이 끝없이 솟아요.');
// 별빛 심연
P('shadow', 'sig_shadow', '그림자 삼키기', '👤', 3, { pow: 2.2, drain: 0.4 }, '발밑 그림자가 기운을 삼켜요.');
P('void_eye', 'sig_void_eye', '허공의 응시', '👁️', 4, { stun: 0.8, defDown: [0.35, 4], drainMana: 30 }, '눈이 마주친 순간, 몸이 굳어요.');
P('star_whale', 'sig_star_whale', '별빛 파도', '🐳', 4, { pow: 2.3, heal: 0.25, mana: 15 }, '반짝이는 파도가 아군은 안고 적은 밀어내요.');
P('comet', 'sig_comet', '혜성 충돌', '☄️', 5, { pow: 3.4, recoil: 0.1, stun: 0.3 }, '긴 꼬리를 끌고 쾅!');
P('void_dragon', 'sig_void_dragon', '공허의 숨결', '🌑', 5, { pow: 3.4, pierce: 0.6 }, '닿은 곳이 사라져요.');
P('void_dragon', 'sig_void_dragon2', '차원 비늘', '🕳️', 4, { evade: 2, guard: [0.5, 3] }, '비늘 틈으로 공격이 사라져요.');
P('chaos_lord', 'sig_chaos_lord', '혼돈의 소용돌이', '😈', 5, { pow: 1.3, hits: 4, stun: 0.3, atkDown: [0.25, 3] }, '무슨 일이 일어날지 아무도 몰라요.');
P('chaos_lord', 'sig_chaos_lord2', '군주의 오만', '👿', 5, { atkUp: [1.0, 3], mana: 40 }, '"모든 것이 내 뜻대로."');
P('creator', 'sig_creator', '천지창조', '🌌', 5, { pow: 4.2, pierce: 0.6, stun: 0.4 }, '별이 태어나는 순간의 폭발.');
P('creator', 'sig_creator2', '태초의 숨결', '✨', 5, { heal: 0.8, cleanse: true, mana: 50, regen: [0.1, 4] }, '모든 것이 처음으로 돌아가요.');

// 스킬 속성 배정 (여기에 없는 스킬은 무속성이에요 · 전용기는 펫 속성을 따라가요)
const ELEM_SKILLS = {
  fire: ['fire_spark', 'fireball', 'inferno', 'ember_jab', 'flame_wheel', 'sear', 'blazing_kick', 'magma_burst', 'ember_curse', 'ember_brand', 'scorch', 'hot_potato', 'time_bomb', 'fireworks', 'wildfire', 'berserk'],
  water: ['water_gun', 'tidal_wave', 'tsunami', 'bubble_burst', 'tide_crash', 'geyser', 'whirlpool', 'dew_drop', 'rain_mend', 'spring_water', 'hot_spring', 'bubble_dome', 'coral_guard', 'mana_flood', 'purify_water', 'shell_hide'],
  grass: ['vine_whip', 'thorn_storm', 'thorn_lash', 'root_crush', 'spore_cloud', 'pollen_storm', 'moss_cure', 'regen_seed', 'oak_bark', 'nectar', 'photosynth', 'honey_heal', 'thick_fur'],
  electric: ['spark', 'thunder', 'thunderstorm', 'lightning_fang', 'static_field', 'thunder_hammer', 'ion_burst', 'chain_lightning', 'adrenaline'],
  ice: ['frost_touch', 'ice_shard', 'blizzard', 'ice_fang', 'frozen_spike', 'hail_storm', 'glacier_crush', 'ice_armor', 'frostbite', 'ice_wall'],
  wind: ['gust', 'wind_blade', 'tornado', 'gale_slash', 'cyclone', 'feather_dart', 'talon_dive', 'gale_wing', 'feather_veil', 'tickle', 'tailwind', 'echo_burst', 'dodge_stance', 'echo_chamber'],
  earth: ['pebble', 'earthquake', 'meteor_fall', 'boulder_toss', 'stone_fist', 'quake_stomp', 'sand_blast', 'dune_crush', 'stone_skin', 'mud_wall', 'sand_cloak', 'shard_storm', 'rockslide', 'tremor', 'piggy_bank', 'bone_plate', 'iron_wall', 'harden'],
  light: ['flash', 'holy_ray', 'judgement', 'solar_beam', 'healing_light', 'sanctuary', 'phoenix_tears', 'blessing', 'sun_blessing', 'prism_ray', 'lunar_rest', 'fairy_dust', 'sunshade', 'sunbeam', 'aurora', 'starfall', 'confetti', 'dance_battle', 'mana_nova', 'crystal_shield', 'adamant', 'prism_crash', 'prism_barrier', 'elem_ward'],
  dark: ['shadow_claw', 'shadow_bite', 'dark_pulse', 'night_slash', 'soul_strike', 'eclipse_ray', 'void_collapse', 'void_shot', 'spirit_siphon', 'soul_feast', 'shadow_step', 'curse', 'terror_gaze', 'vampire_bite', 'life_drain', 'blood_pact', 'nightmare', 'abyss_maw', 'mana_thief', 'ghost_prank', 'mana_vampire', 'last_gasp', 'fate_swap', 'doomsday_clock', 'devil_dice', 'all_in_gamble', 'mana_burn', 'intimidate'],
  poison: ['poison_sting', 'toxic_fog', 'plague', 'acid_spit', 'hex_bolt', 'toxic_mist', 'venom_fang', 'soul_curse', 'corrode', 'toxic_spore', 'acid_rain', 'chain_reaction', 'pufferburst'],
};
for (const [e, ids] of Object.entries(ELEM_SKILLS)) {
  for (const id of ids) {
    if (SKILLS[id]) SKILLS[id].elem = e;
    else console.warn(`[skill.js] 속성 배정: 없는 스킬이에요 → ${id}`);
  }
}
for (const sk of Object.values(SKILLS)) sk.elem ??= 'normal';

// ───────── 설명 글자 (효과 칸으로 자동 만들어요 → 관리자에서 효과를 바꿔도 설명이 같이 바뀌어요) ─────────
const P100 = (x) => `${Math.round(x * 100)}%`;
const DOT = { burn: '🔥 화상', poison: '☠️ 독', bleed: '🩸 출혈' };

// 효과를 한 줄씩 나눠서 돌려줘요 (확인창에서 자세히 보여줄 때 써요)
export function skillEffectLines(sk) {
  const t = [];
  if (sk.pow) {
    if (sk.hitsRange) t.push(`적을 **${sk.hitsRange[0]}~${sk.hitsRange[1]}번** 랜덤 연타 (1번에 공격력의 ${P100(sk.pow)})`);
    else t.push(sk.hits > 1 ? `적을 **${sk.hits}번** 공격 (1번에 공격력의 ${P100(sk.pow)})` : `적에게 공격력의 **${P100(sk.pow)}** 데미지`);
  }
  if (sk.overload) t.push(`쓰고 남은 마나를 전부 쏟아부어요 (남은 마나 1당 데미지 +${+(sk.overload * 100).toFixed(1)}%, 쓰고 나면 마나 0)`);
  if (sk.revenge) t.push(`내 체력이 낮을수록 데미지 증가 (체력이 바닥이면 최대 +${P100(sk.revenge)})`);
  if (sk.gamble) t.push(`${P100(sk.gamble[0])} 확률로 **대박** (데미지 ×${sk.gamble[1]}) · 실패하면 데미지 ×0.4 + 반동으로 내 최대 체력의 ${P100(sk.gamble[2])} 감소`);
  if (sk.pierce) t.push(`적 방어력 ${P100(sk.pierce)} 무시`);
  if (sk.crit) t.push(`급소 확률 +${P100(sk.crit)}`);
  if (sk.exec) t.push(`적 체력 30% 이하면 데미지 ×${sk.exec}`);
  if (sk.drain) t.push(`준 데미지의 ${P100(sk.drain)}만큼 내 체력 회복`);
  if (sk.recoil) t.push(`반동으로 내 최대 체력의 ${P100(sk.recoil)} 감소 (체력 1은 남아요)`);
  if (sk.heal) t.push(`내 최대 체력의 **${P100(sk.heal)}** 회복`);
  if (sk.regen) t.push(`${sk.regen[1]}턴 동안 매 턴 최대 체력의 ${P100(sk.regen[0])} 회복`);
  if (sk.shield) t.push(`최대 체력의 ${P100(sk.shield)}만큼 보호막`);
  if (sk.guard) t.push(`${sk.guard[1]}턴 동안 받는 데미지 ${P100(sk.guard[0])} 감소`);
  if (sk.evade) t.push(`다음 공격 ${sk.evade}번 완전히 회피`);
  if (sk.atkUp) t.push(`${sk.atkUp[1]}턴 동안 내 공격력 +${P100(sk.atkUp[0])}`);
  if (sk.defUp) t.push(`${sk.defUp[1]}턴 동안 내 방어력 +${P100(sk.defUp[0])}`);
  if (sk.atkDown) t.push(`${sk.atkDown[1]}턴 동안 적 공격력 -${P100(sk.atkDown[0])}`);
  if (sk.defDown && sk.defDown[0] > 0) t.push(`${sk.defDown[1]}턴 동안 적 방어력 -${P100(sk.defDown[0])}`);
  if (sk.stun) t.push(`${P100(sk.stun)} 확률로 적 **기절** (1턴 행동 불가)`);
  if (sk.dot) t.push(`${P100(sk.dot[3])} 확률로 ${DOT[sk.dot[0]] ?? sk.dot[0]} (${sk.dot[2]}턴, 매 턴 적 최대 체력의 ${P100(sk.dot[1])})`);
  if (sk.mana) t.push(`마나 +${sk.mana}`);
  if (sk.drainMana) t.push(`적 마나 -${sk.drainMana}`);
  if (sk.bomb) t.push(`💣 적에게 **시한폭탄** 설치: 이번 턴 포함 ${sk.bomb[1]}번째 턴이 끝날 때 공격력의 ${P100(sk.bomb[0])} 피해 (방어 무시)`);
  if (sk.detonate) t.push(`적에게 걸린 화상·독·출혈을 터뜨려요: 남은 피해의 ×${sk.detonate} 를 한 번에 (방어 무시, 상태이상은 사라져요)`);
  if (sk.stealMana) t.push(`적 마나를 ${sk.stealMana}만큼 훔쳐서 내 마나로`);
  if (sk.swapHp) t.push('내 체력 비율이 더 낮으면 서로의 체력 비율을 맞바꿔요 (적은 최소 1은 남아요 · 내가 더 건강하면 아무 일도 안 일어나요)');
  if (sk.echo) t.push(`${sk.echo}턴 안에 쓰는 다음 공격 스킬이 한 번 더 울려요 (위력 75%, 마나 0)`);
  if (sk.weakBonus) t.push(`🎯 상대 속성이 **약점**이면 데미지 +${P100(sk.weakBonus)} 추가`);
  if (sk.ignoreResist) t.push('🔓 상대 속성이 "효과 별로"여도 반감 없이 정상 데미지');
  if (sk.convert) t.push(`🧬 ${sk.convert[1]}턴 동안 내 속성이 **${elemTag(sk.convert[0])}** 으로 변해요 (그 속성 스킬 보너스 · 방어 상성도 같이 바뀌어요)`);
  if (sk.ward) t.push(`🔮 ${sk.ward}턴 동안 속성 약점으로 맞아도 추가 피해를 안 받아요`);
  if (sk.steal) t.push(`🧲 적 ${{ atk: '공격력', def: '방어력', spd: '스피드' }[sk.steal[0]] ?? sk.steal[0]} ${P100(sk.steal[1])}를 훔쳐요 (${sk.steal[2]}턴)`);
  if (sk.fear) t.push(`😱 이번 턴 맞은 피해의 ${P100(sk.fear)}를 내 공격력에 더해 반격 (안 맞았으면 상대 공격력의 30%×${sk.fear})`);
  if (sk.copy) t.push('🦜 상대가 마지막에 쓴 스킬을 복사해서 마나 0으로 즉시 사용 (없으면 마나 반환)');
  if (sk.priority) t.push(`⏱️ 다음 ${sk.priority}턴 동안 스피드와 상관없이 항상 먼저 행동`);
  if (sk.clone) t.push(`👥 ${sk.clone[2]}턴 동안 분신 소환: 공격력 ${P100(sk.clone[0])}로 같이 공격, 방어력 ${P100(sk.clone[1])} 기준 체력으로 받는 피해의 ${P100(CLONE_SHARE)}를 대신 맞아요`);
  if (sk.reflect) t.push(`🪞 ${sk.reflect[1]}턴 동안 받은 피해의 ${P100(sk.reflect[0])}를 상대에게 되돌려요`);
  if (sk.reflectDebuff) t.push(`🔮 ${sk.reflectDebuff}턴 동안 걸리는 디버프를 상대에게 그대로 반사`);
  if (sk.buffXfer) t.push(`🧲 ${sk.buffXfer[1]}턴 안에 **한 번** ${{ steal: '상대의 좋은 효과(공방업·보호태세·재생·보호막…)를 뺏어요', give: '내 나쁜 효과(약화·독·화상·기절…)를 상대에게 떠넘겨요', swap: '상대의 좋은 효과를 뺏고 내 나쁜 효과를 떠넘겨요' }[sk.buffXfer[0]] ?? '효과를 옮겨요'} (발동하면 사라져요)`);
  if (sk.statRoll) t.push(`🎰 ${sk.statRoll[2]}턴 동안 ${sk.statRoll[1] === 'foe' ? '상대' : '내'} 공격력·방어력·스피드를 ${sk.statRoll[0] === 'swap' ? '두 개 골라 **랜덤으로 맞바꿔요**' : '**랜덤 배수**로 바꿔요'} (등급 상한 ×${ROLL_CAP[sk.tier] ?? 1.5})`);
  if (sk.cdReset) t.push(sk.cdReset >= 99 ? '⏪ 내 모든 스킬의 쿨타임을 없애요' : `⏪ 내 모든 스킬의 쿨타임 -${sk.cdReset}턴`);
  if (sk.revive) t.push(`🪽 ${sk.revive[1]}턴 동안 쓰러지면 최대 체력의 ${P100(sk.revive[0])}로 **부활** (${sk.revive[2] ?? 1}회 · 턴이 지나면 사라져요)`);
  if (sk.skillImmune) t.push(`🧿 ${sk.skillImmune}턴 동안 상대의 스킬 효과(피해·약화·지속피해·분신 공격…)를 전혀 안 받아요 (기본 공격은 맞아요)`);
  if (sk.archBless) t.push(`👼 받은 피해(이번 턴, 없으면 지난 턴)의 ${P100(sk.archBless[0])} 회복 + 회복량의 ${P100(sk.archBless[1])}를 상대에게 추가 피해 (방어 무시)`);
  if (sk.joker) t.push(`🃏 내 스킬 하나 ↔ 상대 스킬 하나를 **랜덤으로 맞교환** (이번 전투 동안만 · 전투당 1번) — 상대가 받는 카드가 이 **조커**면 상대 마나 전부 삭제 + 스킬 ${JOKER_CFG.sealTurns}턴 봉인`);
  if (sk.curse) t.push(`🧿 나 자신에게 랜덤 디버프 **${sk.curse[0]}개**를 ${sk.curse[1]}턴 동안 걸어요 (공격↓·방어↓·스피드↓·회복감소·화상·독·출혈 중) · 다음 턴부터 이 스킬이 **저주부여**로 바뀌어요`);
  if (sk.curseGrant) t.push(`🪬 저주로 받은 디버프를 **×${sk.curseGrant} 위력**으로 상대에게 부여해요 (쓰고 나면 다시 금단의 저주로 돌아와요)`);
  if (sk.devilDeal) t.push(`😈 ${sk.devilDeal[0]}턴 동안 내 모든 공격이 **확정 급소 + 약점 공격**! 단, ${sk.devilDeal[0]}턴 안에 상대를 쓰러뜨리지 못하면 그동안 준 피해의 **×${sk.devilDeal[1]}** 를 **무효화 불가 피해**로 나도 받아요 (부활·스킬 면역·쉴드·가드로 못 막고, 부활도 안 돼요)`);
  if (sk.catchPro) t.push(`🪢 ${catchProTurns(sk)}턴 동안 유효: 야생 펫이 도망치려 하면 **확정으로 붙잡아요** (처음 붙잡을 때 이번 전투 제한 턴 **+${sk.catchPro[1]}턴**) · 포획률 **+${P100(sk.catchPro[0])}p**`);
  if (sk.fightBuff) t.push(`📈 이번 전투가 끝날 때까지: ${fightBuffText(sk.fightBuff)} (겹쳐 쓰면 쌓이고 한도가 있어요)`);
  if (sk.cd) t.push(`⏳ 쿨타임 ${sk.cd}턴`);
  if (sk.cleanse) t.push('내 상태이상(화상·독·출혈·약화) 제거');
  return t;
}

export function describeSkill(sk) {
  return (sk.flavor ? `*${sk.flavor}*\n` : '') + `${elemTag(skillElement(sk))} 속성 · ` + (skillEffectLines(sk).join(' · ') || '효과 없음');
}

export const tierStars = (t) => '★'.repeat(Math.max(1, Math.min(5, t)));
export function skillCategory(sk) {
  if (sk.pet) return '전용기';
  if (sk.pow || sk.bomb || sk.detonate) return '공격';
  if (sk.atkUp || sk.defUp || sk.mana || sk.echo || sk.convert || sk.ward || sk.priority || sk.clone || sk.reflect || sk.reflectDebuff || sk.copy || sk.revive || sk.skillImmune || sk.cdReset || sk.devilDeal || sk.catchPro || sk.fightBuff || sk.statRoll?.[1] === 'self') return '강화';
  if (sk.atkDown || sk.defDown || sk.stun || sk.dot || sk.drainMana || sk.stealMana || sk.swapHp || sk.steal || sk.buffXfer || sk.joker || sk.curse || sk.curseGrant || sk.statRoll?.[1] === 'foe') return '약화';
  return '회복·방어';
}

// ───────── 슬롯 · 배우기 ─────────
export const maxMana = (inst) => SKILL_CFG.manaMax + (inst?.manaBonus ?? 0);
export const SLOT_COUNT = 5; // 스킬 슬롯 개수
// 5번 슬롯은 상점 개방권으로 열어요 (저장 데이터 호환을 위해 표시 이름은 예전 그대로 inst.slot3 이에요)
export const slotsOpen = (inst) => [
  inst.level >= SKILL_CFG.slot1Level,
  inst.level >= SKILL_CFG.slot2Level,
  inst.level >= SKILL_CFG.slot3Level,
  inst.level >= SKILL_CFG.slot4Level,
  !!inst.slot3,
];
export const SLOT_HINT = () => [
  `Lv.${SKILL_CFG.slot1Level} 에 열려요`,
  `Lv.${SKILL_CFG.slot2Level} 에 열려요`,
  `Lv.${SKILL_CFG.slot3Level} 에 열려요`,
  `Lv.${SKILL_CFG.slot4Level} 에 열려요`,
  '상점의 🎫 스킬 슬롯 개방권으로 열어요',
];

// 예전 3칸 펫([Lv40, Lv100, 상점])을 새 5칸([Lv20, Lv40, Lv100, Lv200, 상점])으로 옮겨줘요 (이미 배운 스킬은 그대로 유지돼요)
export function normalizeSkills(inst) {
  if (!Array.isArray(inst.skills)) inst.skills = Array(SLOT_COUNT).fill(null);
  else if (inst.skills.length < SLOT_COUNT) {
    const old = inst.skills;
    inst.skills = old.length === 3
      ? [null, old[0] ?? null, old[1] ?? null, null, old[2] ?? null]
      : [...old, ...Array(SLOT_COUNT - old.length).fill(null)];
  }
  return inst.skills;
}

export function rollSkill(inst, rng = Math.random, exclude = []) {
  const all = Object.values(SKILLS).filter((s) => !exclude.includes(s.id) && !s.hidden); // hidden(저주부여 등)은 뽑기에 안 나와요
  // 1) 전용기 판정: 펫에게 (아직 안 배운) 전용기가 있을 때만 sigChance(1%) 로 나와요. 전용기가 2개면 반반이에요.
  const sig = all.filter((s) => s.pet === inst.petId);
  if (sig.length && rng() < SKILL_CFG.sigChance) return sig[Math.floor(rng() * sig.length)].id;
  // 2) 일반 스킬: 등급(★)을 먼저 뽑고(TIER_WEIGHT), 그 등급 안에서는 모든 스킬이 똑같은 확률이에요.
  const pool = all.filter((s) => !s.pet);
  if (!pool.length) return null;
  const tiers = [...new Set(pool.map((s) => s.tier))].filter((t) => (TIER_WEIGHT[t] ?? 0) > 0);
  if (!tiers.length) return pool[Math.floor(rng() * pool.length)].id;
  let r = rng() * tiers.reduce((n, t) => n + TIER_WEIGHT[t], 0);
  let tier = tiers[tiers.length - 1];
  for (const t of tiers) { r -= TIER_WEIGHT[t]; if (r < 0) { tier = t; break; } }
  const same = pool.filter((s) => s.tier === tier);
  // 🌈 내 펫과 같은 속성의 스킬은 elemAffinity 배만큼 더 잘 나와요 (1 이면 모두 똑같은 확률)
  const aff = SKILL_CFG.elemAffinity ?? 1;
  if (aff !== 1 && inst.petId) {
    const mine = petElementsOf(inst.petId).filter((e) => e !== 'normal');
    const w = same.map((s) => (mine.includes(skillElement(s)) ? aff : 1));
    let r2 = rng() * w.reduce((n, x) => n + x, 0);
    for (let i = 0; i < same.length; i++) { r2 -= w[i]; if (r2 < 0) return same[i].id; }
    return same[same.length - 1].id;
  }
  return same[Math.floor(rng() * same.length)].id;
}

// 열려 있는데 비어 있는 슬롯에 랜덤 스킬을 채워요. 새로 생긴 [슬롯번호, 스킬id] 목록을 돌려줘요.
export function grantSkills(inst, rng = Math.random) {
  normalizeSkills(inst);
  const got = [];
  slotsOpen(inst).forEach((open, i) => {
    if (open && !SKILLS[inst.skills[i]]) {
      const id = rollSkill(inst, rng, inst.skills.filter(Boolean));
      if (id) { inst.skills[i] = id; got.push([i, id]); }
    }
  });
  return got;
}

// ───────── 전투 규칙 ─────────
// 전투에서 한쪽(나/야생)을 이렇게 표현해요: { name, emoji, hp, max, atk, def, st, mana, crit }
// st(상태): { dots:[{kind,pct,turns}], stun, atkUp, atkDown, defUp, defDown, guard, shield, evade, regen }
export const newSide = () => ({});
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const effAtk = (X) => (X.atk + (X.st.defToAtk?.amt ?? 0)) * clamp(1 + (X.st.atkUp?.pct ?? 0) - (X.st.atkDown?.pct ?? 0), 0.2, 4) * (X.st.burst?.mult ?? 1) * (X.st.statMod?.atk ?? 1);
export const effDef = (X) => (X.st.defToAtk ? 0 : X.def) * clamp(1 + (X.st.defUp?.pct ?? 0) - (X.st.defDown?.pct ?? 0), 0.2, 4) * (X.st.statMod?.def ?? 1);
export const effSpd = (X) => (X.spd ?? 0) * clamp(1 + (X.st.spdUp?.pct ?? 0) - (X.st.spdDown?.pct ?? 0), 0.2, 4) * (X.st.statMod?.spd ?? 1);

// 내가 먼저 움직이는가? (priority 가 한쪽만 있으면 그쪽이 먼저, 둘 다/둘 다 없으면 스피드 비교, 같으면 내가 먼저)
export function actsFirst(me, foe) {
  const mp = !!me.st.priority;
  const fp = !!foe.st.priority;
  if (mp !== fp) return mp;
  return effSpd(me) >= effSpd(foe);
}

// 피해를 받은 직후 호출해요: 이번 턴 받은 피해 누적(공포용) + 반사(보복) 처리
export function afterHit(X, Y, dmg, log) {
  if (dmg <= 0) return;
  X.st.turnTaken = (X.st.turnTaken ?? 0) + dmg;
  if (Y.st?.devil) Y.st.devil.dealt += dmg; // 😈 악마의 거래: 내가 준 피해 누적
  const r = X.st.reflect;
  if (r && Y.hp > 0) {
    const back = Math.max(1, Math.round(dmg * r.pct));
    Y.hp = Math.max(0, Y.hp - back);
    log.push(`　🪞 ${X.name}의 반사! ${Y.name}에게 **${back}** 피해`);
  }
}

// 맞는 쪽의 회피 · 방어 · 보호막을 적용해요
export function mitigate(X, dmg, rng = Math.random) {
  const st = X.st;
  if (st.evade > 0) { st.evade -= 1; return { dmg: 0, note: ' (🌀 회피!)' }; }
  let note = '';
  if (st.coinflip) {
    if (rng() < 0.5) { dmg = Math.round(dmg * 2); note += ' (🎲 모 아니면 도: 2배!)'; }
    else { dmg = 0; note += ' (🎲 모 아니면 도: 0!)'; }
  }
  if (st.guard && dmg > 0) { dmg = Math.max(1, Math.round(dmg * (1 - st.guard.pct))); note += ' (🛡️ 방어)'; }
  if (st.clone?.hp > 0 && dmg > 0) {
    const take = Math.min(st.clone.hp, Math.round(dmg * CLONE_SHARE));
    st.clone.hp -= take; dmg -= take; note += ` (👥 분신이 ${take} 대신 맞음)`;
    if (st.clone.hp <= 0) { delete st.clone; note += ' (분신 소멸!)'; }
  }
  if (st.shield > 0 && dmg > 0) {
    const ab = Math.min(st.shield, dmg);
    st.shield -= ab; dmg -= ab; note += ` (🔰 ${ab} 흡수)`;
  }
  return { dmg, note };
}

const heal = (X, n) => {
  if (X.st?.healCut) n *= 1 - X.st.healCut.pct;
  const real = Math.min(X.max - X.hp, Math.max(0, Math.round(n)));
  X.hp += real;
  return real;
};

// ───────── 🆕 배치 3 헬퍼 ─────────
// 스킬로 "적에게 가는" 효과 칸들 — 상대가 스킬 면역이면 castSkill 이 이 칸들을 지워요
const HOSTILE_KEYS = ['pow', 'truePct', 'bomb', 'detonate', 'stealMana', 'steal', 'turnCut', 'healCut', 'atkDown', 'defDown', 'stun', 'dot', 'drainMana', 'swapHp', 'buffXfer', 'joker', 'curseGrant'];
export const ROLL_CAP = { 1: 1.3, 2: 1.5, 3: 1.8, 4: 2.2, 5: 3 }; // 🎰 등급별 능력치 변동 상한 (배수)
const STAT_LABEL = { atk: '⚔️ 공격력', def: '🧱 방어력', spd: '👟 스피드' };
export const cdLeft = (st, id) => st?.cds?.[id] ?? 0; // ⏳ 남은 쿨타임 (0 이면 쓸 수 있어요)

// 🎰 능력치 룰렛: swap = 두 능력치를 랜덤으로 맞바꿔요 / random = 세 능력치에 랜덤 배수
function rollStats(sk, T, rng, log) {
  const [mode, who, turns] = sk.statRoll;
  const cap = ROLL_CAP[sk.tier] ?? 1.5;
  const mod = { atk: 1, def: 1, spd: 1, turns };
  const keys = ['atk', 'def', 'spd'];
  if (mode === 'swap') {
    const pool = keys.slice();
    const a = pool.splice(Math.floor(rng() * 3), 1)[0];
    const b = pool[Math.floor(rng() * 2)];
    const va = Math.max(1, T[a] ?? 1);
    const vb = Math.max(1, T[b] ?? 1);
    mod[a] = clamp(vb / va, 1 / cap, cap);
    mod[b] = clamp(va / vb, 1 / cap, cap);
    log.push(`　🔀 ${T.name}의 ${STAT_LABEL[a]} ↔ ${STAT_LABEL[b]} 맞바꿈! (×${mod[a].toFixed(2)} / ×${mod[b].toFixed(2)}, ${turns}턴)`);
  } else {
    const lo = who === 'foe' ? 1 / cap : 0.7; // 상대에게 쓰면 약해지는 쪽으로, 나에게 쓰면 도박(0.7 ~ 상한)
    const hi = who === 'foe' ? 1 : cap;
    for (const k of keys) mod[k] = lo + rng() * (hi - lo);
    log.push(`　🎡 ${T.name}의 능력치 룰렛! ⚔️×${mod.atk.toFixed(2)} 🧱×${mod.def.toFixed(2)} 👟×${mod.spd.toFixed(2)} (${turns}턴, 상한 ×${cap})`);
  }
  T.st.statMod = mod;
}

// 🧲 1회용 효과 이동: X(건 쪽) ↔ foe. 옮길 효과가 있으면 true (= 한 번 발동하고 사라져요)
const XFER_BUFFS = ['atkUp', 'defUp', 'spdUp', 'guard', 'regen', 'burst'];
const XFER_DEBUFFS = ['atkDown', 'defDown', 'spdDown', 'healCut'];
const moveKeys = (from, to, keys) => {
  let n = 0;
  for (const k of keys) {
    const v = from.st[k];
    if (!v) continue;
    const cur = to.st[k];
    to.st[k] = cur && v.pct != null && cur.pct != null ? { ...v, pct: cur.pct + v.pct, turns: Math.max(cur.turns, v.turns) } : { ...v };
    delete from.st[k];
    n++;
  }
  return n;
};
function applyXfer(X, foe, mode, log) {
  let n = 0;
  if (mode === 'steal' || mode === 'swap') {
    n += moveKeys(foe, X, XFER_BUFFS);
    if (foe.st.shield > 0) { X.st.shield = (X.st.shield ?? 0) + foe.st.shield; delete foe.st.shield; n++; }
    if (n) log.push(`　🧲 ${foe.name}의 좋은 효과를 ${X.name}(이)가 가로챘어요!`);
  }
  if (mode === 'give' || mode === 'swap') {
    let m = moveKeys(X, foe, XFER_DEBUFFS);
    if (X.st.dots?.length) {
      foe.st.dots = [...(foe.st.dots ?? []).filter((d) => !X.st.dots.some((o) => o.kind === d.kind)), ...X.st.dots];
      X.st.dots = [];
      m++;
    }
    if (X.st.stun) { foe.st.stun = 1; delete X.st.stun; m++; }
    if (m) log.push(`　🎁 ${X.name}의 나쁜 효과를 ${foe.name}에게 떠넘겼어요!`);
    n += m;
  }
  return n > 0;
}

// 🃏 조커 설정: 상대가 조커 카드를 받으면 마나 전부 삭제 + sealTurns 턴 동안 스킬 봉인 / forceGive true 면 조커 카드가 항상 상대에게 가요
export const JOKER_CFG = { sealTurns: 3, forceGive: false };

// 🪢 포획 전문가 · 📈 전투 중 버프 설정 (배치 5)
export const CATCH_PRO_CFG = { duration: 14, topTierDuration: 15 }; // 유효 턴 (최고등급 ★5 는 topTierDuration)
export const catchProTurns = (sk) => (sk.tier >= 5 ? CATCH_PRO_CFG.topTierDuration : CATCH_PRO_CFG.duration);
export const FIGHT_BUFF_CAP = { catch: 0.5, flee: 0.5, exp: 1, gold: 1, petExp: 1, equip: 1 }; // 겹쳐도 넘지 못하는 한도
export const FIGHT_BUFF_LABEL = { catch: '🎯 포획률', flee: '🕊️ 도망률', exp: '⭐ 경험치', gold: '💰 돈', petExp: '🐾 펫 경험치', equip: '🎁 장비 획득률' };
export const fightBuffOf = (st, key) => st?.fightBuff?.[key] ?? 0; // 전투 중 버프 값 (없으면 0)
// 전투 중 버프를 글자로: "🎯 포획률 +15% · 🕊️ 도망률 -20%" (keys 로 보여줄 항목만 고를 수 있어요)
export function fightBuffText(fb, keys = null) {
  return Object.entries(fb ?? {})
    .filter(([k, v]) => v > 0 && FIGHT_BUFF_LABEL[k] && (!keys || keys.includes(k)))
    .map(([k, v]) => `${FIGHT_BUFF_LABEL[k]} ${k === 'flee' ? '-' : '+'}${Math.round(v * 100)}%`)
    .join(' · ');
}
// 🪢 야생 펫이 도망치려 할 때 호출해요 (fight = ex.battle). 붙잡았으면 true.
// onlyFirst true 면 아직 한 번도 안 붙잡았을 때만 붙잡아요 (제한 턴 도망이 끝없이 이어지는 걸 막아요)
export function catchProHold(fight, log, { onlyFirst = false } = {}) {
  const cp = fight?.mySt?.catchPro;
  if (!cp) return false;
  if (cp.held && onlyFirst) return false;
  if (!cp.held) {
    cp.held = true;
    fight.extraRounds = (fight.extraRounds ?? 0) + cp.extra;
    log.push(`🪢 도망치려던 야생 펫을 **확정으로 붙잡았어요!** 이번 전투의 제한 턴이 **+${cp.extra}턴** 늘었어요!`);
  } else log.push('🪢 도망치려던 야생 펫을 다시 **붙잡았어요!**');
  return true;
}

// 🧿 저주: 자신에게 거는 디버프 후보 (pct = 1배 위력, dot = 지속피해)
const CURSE_POOL = [
  { k: 'atkDown', pct: 0.25 },
  { k: 'defDown', pct: 0.25 },
  { k: 'spdDown', pct: 0.25 },
  { k: 'healCut', pct: 0.4 },
  { k: 'burn', pct: 0.05, dot: true },
  { k: 'poison', pct: 0.05, dot: true },
  { k: 'bleed', pct: 0.05, dot: true },
];
const CURSE_LABEL = { atkDown: '🔻 공격력↓', defDown: '🔻 방어력↓', spdDown: '🐌 스피드↓', healCut: '🚑 회복감소', burn: '🔥 화상', poison: '☠️ 독', bleed: '🩸 출혈' };
const CURSE_CAP = 0.9; // 능력치 디버프 · 회복감소 최대 비율
const CURSE_DOT_CAP = 0.25; // 지속 피해 최대 비율 (매 턴 최대 체력의)
function putCurse(T, c, mult, turns) {
  if (c.dot) {
    T.st.dots = (T.st.dots ?? []).filter((d) => d.kind !== c.k);
    T.st.dots.push({ kind: c.k, pct: Math.min(CURSE_DOT_CAP, c.pct * mult), turns });
  } else T.st[c.k] = { pct: Math.min(CURSE_CAP, c.pct * mult), turns };
}
// 저주가 끝났는데 칸이 아직 저주부여로 남아 있으면 금단의 저주로 되돌려요 (바뀐 게 있으면 true)
export function revertCurseSlots(skills, st) {
  if (!Array.isArray(skills) || st?.cursed) return false;
  let changed = false;
  for (let i = 0; i < skills.length; i++) if (skills[i] === 'curse_grant') { skills[i] = 'forbidden_curse'; changed = true; }
  return changed;
}

// 🪽 부활: 쓰러졌고 부활 효과가 남아 있으면 되살려요 (남은 횟수가 0 이 되면 효과 사라짐)
export function tryRevive(X, log) {
  const r = X.st?.revive;
  if (!r || X.hp > 0) return false;
  X.hp = Math.max(1, Math.round(X.max * r.pct));
  X.st.dots = [];
  delete X.st.bomb;
  delete X.st.stun;
  if (--r.left <= 0) delete X.st.revive;
  log.push(`🪽 ${X.name}(이)가 **부활**했어요! 체력 ${X.hp}/${X.max}`);
  return true;
}

// 스킬 한 번 쓰기. A = 쓰는 쪽, B = 맞는 쪽
export function castSkill(sk, A, B, rng, log) {
  A.mana = Math.max(0, A.mana - sk.cost);
  log.push(`✨ ${A.emoji} ${A.name}의 ${sk.emoji} **${sk.name}**!`);
  // 🆕 배치 4: 못 쓰는 상황이면 마나를 돌려주고 불발 (쿨타임·마지막 스킬 기록 전에 걸러요)
  const fizzle = (why) => { A.mana += sk.cost; log.push(`　💨 ${why} (마나는 돌려받았어요)`); };
  if (sk.joker && (A.fight ?? B.fight)?.jokerUsed) return fizzle('조커는 이번 전투에서 이미 쓰였어요…');
  if (sk.devilDeal && A.st.devil) return fizzle('이미 악마와 거래 중이에요…');
  if ((sk.catchPro || sk.fightBuff) && !(A.fight && A.st === A.fight.mySt)) return fizzle('이 스킬은 트레이너의 펫만 쓸 수 있어요…'); // 🆕 배치 5: 포획·보상 스킬은 내 쪽만
  if (sk.curseGrant && !A.st.cursed) { revertCurseSlots(A.skills, A.st); return fizzle('부여할 저주가 사라졌어요…'); }
  if (!sk.echoed) A.st.last = sk.copied ? sk.srcId : sk.id; // 🆕 "마지막에 쓴 스킬" 기록 (복사용)
  if (sk.cd && !sk.copied && !sk.echoed) (A.st.cds ??= {})[sk.id] = sk.cd + 1; // ⏳ 쿨타임 시작 (+1: 이번 턴 끝 감소분)
  if (sk.copy) { // 🦜 상대가 마지막에 쓴 스킬을 복사해서 마나 0으로 즉시 사용
    const src = SKILLS[B.st.last];
    if (!src || src.copy || src.joker) { A.mana += sk.cost; log.push('　💨 복사할 스킬이 없어요… (마나는 돌려받았어요)'); return; }
    log.push(`　🦜 ${B.name}의 ${src.emoji} **${src.name}** 을(를) 복사했어요!`);
    castSkill({ ...src, name: `${src.name} (복사)`, cost: 0, copied: true, srcId: src.id }, A, B, rng, log);
    return;
  }
  // 🧿 스킬 면역: 상대가 면역이면 "적에게 가는 효과"가 전부 사라져요 (내게 쓰는 효과는 그대로)
  let immune = false;
  if (B.st.skillImmune && (HOSTILE_KEYS.some((k) => sk[k]) || sk.archBless || sk.statRoll?.[1] === 'foe')) {
    immune = true;
    sk = { ...sk };
    for (const k of HOSTILE_KEYS) delete sk[k];
    log.push(`　🧿 ${B.name}은(는) **스킬 면역** 상태! 적에게 가는 스킬 효과가 전부 막혔어요`);
  }
  if (sk.joker) { // 🃏 조커: 내 스킬 하나 ↔ 상대 스킬 하나 랜덤 맞교환 (전투 안에서만 · 전투당 1번)
    const fight = A.fight ?? B.fight ?? (A.fight = B.fight = {});
    A.fight ??= fight;
    B.fight ??= fight;
    const idxOf = (X) => (X.skills ?? []).map((id, i) => (SKILLS[id] ? i : -1)).filter((i) => i >= 0);
    const ai = idxOf(A);
    const bi = idxOf(B);
    if (!ai.length || !bi.length) return fizzle('맞바꿀 스킬이 없어요…');
    const jokerAt = ai.find((i) => A.skills[i] === sk.id);
    const a = JOKER_CFG.forceGive && jokerAt != null ? jokerAt : ai[Math.floor(rng() * ai.length)];
    const b = bi[Math.floor(rng() * bi.length)];
    const mine = A.skills[a];
    const theirs = B.skills[b];
    A.skills[a] = theirs;
    B.skills[b] = mine;
    fight.jokerUsed = true;
    log.push(`　🃏 **조커!** ${A.name}의 ${SKILLS[mine].emoji} ${SKILLS[mine].name} ↔ ${B.name}의 ${SKILLS[theirs].emoji} ${SKILLS[theirs].name} 맞교환! (이번 전투 동안만)`);
    if (mine === sk.id) { // 조커 카드가 상대 손에 들어갔어요
      const lost = Math.round(B.mana);
      B.mana = 0;
      B.st.sealed = { turns: JOKER_CFG.sealTurns + 1 }; // +1: 이번 턴 끝 감소분
      log.push(`　😈 ${B.name}(이)가 **조커 카드**를 받았어요! 마나 ${lost} 전부 삭제 + 스킬 ${JOKER_CFG.sealTurns}턴 봉인!`);
    }
  }
  let dealt = 0;

  // 🌈 속성 상성: 약점(×1.5) / 반감(×0.65) / 같은 속성 보너스(×1.2)
  const skElem = skillElement(sk);
  let elemMul = 1;
  if (sk.pow || sk.bomb) {
    const clash = elemClash(skElem, B, { ignoreResist: sk.ignoreResist });
    const devilWeak = !!A.st.devil && clash.mult < ELEM_CFG.strong; // 😈 악마의 거래: 약점 확정
    const cmult = devilWeak ? ELEM_CFG.strong : clash.mult;
    elemMul = cmult;
    if (sk.weakBonus && cmult > 1) elemMul *= 1 + sk.weakBonus;
    const stab = skElem !== 'normal' && effElems(A).includes(skElem) ? ELEM_CFG.stab : 1;
    elemMul *= stab;
    const tags = [];
    if (devilWeak) tags.push(`😈 악마의 거래: 약점 확정! (×${ELEM_CFG.strong})`);
    else if (clash.note) tags.push(clash.note.trim());
    if (sk.weakBonus && cmult > 1) tags.push(`🎯 약점 공략! (+${P100(sk.weakBonus)})`);
    if (stab > 1) tags.push(`🔰 같은 속성 보너스! (×${ELEM_CFG.stab})`);
    if (tags.length) log.push(`　${elemTag(skElem)} 속성 → ${effElems(B).map(elemTag).join(' + ')}: ${tags.join(' ')}`);
  }

  // 🆕 독창 스킬: 이번 한 번의 데미지 배율 (마나 쏟아붓기 · 오기/발악 · 도박이 여기에 곱해져요)
  let mult = elemMul;
  if (sk.overload) {
    const spent = Math.round(A.mana);
    mult *= 1 + spent * sk.overload;
    A.mana = 0;
    log.push(`　🔥 남은 마나 ${spent} 을(를) 전부 쏟아부었어요! (데미지 ×${mult.toFixed(2)})`);
  }
  if (sk.revenge) {
    const lost = Math.max(0, 1 - A.hp / A.max);
    if (lost >= 0.05) {
      const m = 1 + lost * sk.revenge;
      mult *= m;
      log.push(`　😤 아플수록 강해져요! (데미지 ×${m.toFixed(2)})`);
    }
  }
  if (sk.gamble) {
    if (rng() < sk.gamble[0]) {
      mult *= sk.gamble[1];
      log.push(`　🎲 **대박!** (데미지 ×${sk.gamble[1]})`);
    } else {
      mult *= 0.4;
      const n = Math.max(0, Math.min(A.hp - 1, Math.round(A.max * sk.gamble[2])));
      A.hp -= n;
      log.push(`　🎲 쪽박… 반동으로 -${n}`);
    }
  }
  const hits = sk.hitsRange ? sk.hitsRange[0] + Math.floor(rng() * (sk.hitsRange[1] - sk.hitsRange[0] + 1)) : (sk.hits ?? 1);
  if (sk.hitsRange && sk.pow) log.push(`　🎰 ${hits}연타가 나왔어요!`);

  let fearBonus = 0;
  if (sk.fear) { // 😱 이번 턴 맞은 피해 × 비율을 내 공격력에 더해요 (안 맞았으면 상대 공격력의 30% × 비율)
    const taken = A.st.turnTaken ?? 0;
    fearBonus = taken > 0 ? taken * sk.fear : effAtk(B) * 0.3 * sk.fear;
    log.push(`　😱 공포가 힘이 돼요! 공격력 **+${Math.round(fearBonus)}**`);
  }
  if (sk.pow) {
    for (let i = 0; i < hits && B.hp > 0; i++) {
      const atk = effAtk(A) + fearBonus;
      const def = effDef(B) * (1 - (sk.pierce ?? 0));
      let dmg = Math.max(atk * 0.25, atk - def * 0.5) * sk.pow * mult * (0.85 + rng() * 0.3);
      const crit = !!A.st.devil || rng() < (A.crit ?? 0.1) + (sk.crit ?? 0); // 😈 악마의 거래 중엔 확정 급소
      if (crit) dmg *= 1.5;
      if (sk.exec && B.hp / B.max <= 0.3) dmg *= sk.exec;
      const hit = mitigate(B, Math.max(1, Math.round(dmg)), rng);
      if (sk.mercy) {
        const floor = Math.max(1, Math.round(B.max * 0.01));
        if (B.hp - hit.dmg < floor) { hit.dmg = Math.max(0, B.hp - floor); hit.note += ' (🕊 상대가 1%는 버텼어요)'; }
      }
      B.hp = Math.max(0, B.hp - hit.dmg);
      dealt += hit.dmg;
      log.push(`　${hits > 1 ? `${i + 1}타 ` : ''}${crit ? '💥 급소! ' : ''}${B.name}에게 **${hit.dmg}** 데미지${hit.note}`);
      afterHit(B, A, hit.dmg, log); // 🆕 반사·받은 피해 기록
    }
  }
  if (sk.truePct && B.hp > 0) {
    const n = Math.max(1, Math.round(B.max * sk.truePct));
    B.hp = Math.max(0, B.hp - n);
    dealt += n;
    log.push(`　🎯 방어 무시 고정 피해 **${n}** (최대체력의 ${P100(sk.truePct)})`);
  }
  if (sk.drain && dealt > 0) { const n = heal(A, dealt * sk.drain); if (n) log.push(`　🩸 체력 +${n}`); }
  if (sk.recoil) {
    const n = Math.min(A.hp - 1, Math.round(A.max * sk.recoil));
    if (n > 0) { A.hp -= n; log.push(`　💢 반동으로 -${n}`); }
  }
  if (sk.heal) { const n = heal(A, A.max * sk.heal); log.push(`　💖 체력 +${n}`); }
  if (sk.archBless) { // 👼 받은 피해(이번 턴, 없으면 지난 턴) × 배율 회복 + 회복량의 일부를 상대에게 추가 피해 (방어 무시)
    const [hr, sr] = sk.archBless;
    const basis = (A.st.turnTaken ?? 0) > 0 ? A.st.turnTaken : (A.st.prevTaken ?? 0);
    if (basis > 0) {
      const intended = Math.round(basis * hr * (1 - (A.st.healCut?.pct ?? 0)));
      const got = heal(A, basis * hr);
      log.push(`　👼 받은 피해 ${basis}의 ${P100(hr)}를 회복! 체력 +${got}`);
      if (!immune && B.hp > 0) {
        const smite = Math.max(1, Math.round(intended * sr));
        B.hp = Math.max(0, B.hp - smite);
        dealt += smite;
        log.push(`　⚡ 축복의 빛이 ${B.name}에게 **${smite}** 추가 피해! (회복량의 ${P100(sr)})`);
      }
    } else {
      log.push('　💨 아직 받은 피해가 없어서 축복이 흩어졌어요…');
    }
  }
  if (sk.regen) { A.st.regen = { pct: sk.regen[0], turns: sk.regen[1] }; log.push(`　🌱 ${sk.regen[1]}턴 동안 체력이 차올라요`); }
  if (sk.shield) { A.st.shield = (A.st.shield ?? 0) + Math.round(A.max * sk.shield); log.push(`　🔰 보호막 ${A.st.shield}`); }
  if (sk.guard) { A.st.guard = { pct: sk.guard[0], turns: sk.guard[1] }; log.push(`　🛡️ ${sk.guard[1]}턴 동안 받는 데미지 -${P100(sk.guard[0])}`); }
  if (sk.evade) { A.st.evade = (A.st.evade ?? 0) + sk.evade; log.push(`　🌀 다음 공격 ${A.st.evade}번 회피`); }
  if (sk.atkUp) { A.st.atkUp = { pct: sk.atkUp[0], turns: sk.atkUp[1] }; log.push(`　💪 ${sk.atkUp[1]}턴 동안 공격력 +${P100(sk.atkUp[0])}`); }
  if (sk.defUp) { A.st.defUp = { pct: sk.defUp[0], turns: sk.defUp[1] }; log.push(`　🧱 ${sk.defUp[1]}턴 동안 방어력 +${P100(sk.defUp[0])}`); }
  if (sk.convert) { A.st.convert = { elem: sk.convert[0], turns: sk.convert[1] }; log.push(`　🧬 ${sk.convert[1]}턴 동안 ${A.name}의 속성이 **${elemTag(sk.convert[0])}** 으로 변했어요!`); }
  if (sk.ward) { A.st.ward = { turns: sk.ward }; log.push(`　🔮 ${sk.ward}턴 동안 속성 약점을 막아주는 방벽이 쳐졌어요`); }
  // 🆕 2차 확장: 마나 늘리기 · 공격력 폭주 · 디버프→버프 · 모아니면도 · 방어력→공격력
  if (sk.manaMaxUp) {
    A.manaMax += sk.manaMaxUp[0];
    A.st.manaMaxUp = { amt: sk.manaMaxUp[0], turns: sk.manaMaxUp[1] };
    log.push(`　🔷 ${sk.manaMaxUp[1]}턴 동안 최대 마나 +${sk.manaMaxUp[0]}`);
  }
  if (sk.manaRegenUp) { A.st.manaRegenUp = { amt: sk.manaRegenUp[0], turns: sk.manaRegenUp[1] }; log.push(`　🔋 ${sk.manaRegenUp[1]}턴 동안 턴마다 차는 마나 +${sk.manaRegenUp[0]}`); }
  if (sk.burstAtk) { A.st.burst = { mult: sk.burstAtk[0], turns: sk.burstAtk[1] }; log.push(`　🔥 ${sk.burstAtk[1]}턴 동안 공격력이 **×${sk.burstAtk[0]}배**가 돼요!`); }
  if (sk.debuffToBuff) {
    let n = 0;
    if (A.st.atkDown) { A.st.atkUp = { pct: (A.st.atkUp?.pct ?? 0) + A.st.atkDown.pct, turns: A.st.atkDown.turns }; delete A.st.atkDown; n++; }
    if (A.st.defDown) { A.st.defUp = { pct: (A.st.defUp?.pct ?? 0) + A.st.defDown.pct, turns: A.st.defDown.turns }; delete A.st.defDown; n++; }
    if (A.st.stun) { delete A.st.stun; n++; }
    log.push(n ? '　🔄 나쁜 효과가 전부 좋은 효과로 바뀌었어요!' : '　💨 바꿀 나쁜 효과가 없었어요…');
  }
  if (sk.coinflip) { A.st.coinflip = { turns: sk.coinflip }; log.push(`　🎲 ${sk.coinflip}턴 동안 받는 피해가 50% 확률로 2배, 50% 확률로 0이 돼요!`); }
  if (sk.defToAtk) { A.st.defToAtk = { amt: A.def, turns: sk.defToAtk }; log.push(`　⚔️ ${sk.defToAtk}턴 동안 방어력을 전부 공격력으로 바꿨어요!`); }
  if (sk.priority) { A.st.priority = { turns: sk.priority + 1 }; log.push(`　⏱️ 다음 ${sk.priority}턴 동안 무조건 먼저 움직여요!`); } // +1: 이번 턴 끝 감소분
  if (sk.clone) {
    const [ar, dr, turns] = sk.clone;
    A.st.clone = { atk: Math.round(effAtk(A) * ar), hp: Math.max(10, Math.round(effDef(A) * dr * CLONE_HP_PER_DEF)), turns };
    log.push(`　👥 분신 소환! (공격력 ${A.st.clone.atk} · 체력 ${A.st.clone.hp} · ${turns}턴) — 같이 공격하고 받는 피해의 ${P100(CLONE_SHARE)}를 대신 맞아요`);
  }
  if (sk.reflect) { A.st.reflect = { pct: sk.reflect[0], turns: sk.reflect[1] }; log.push(`　🪞 ${sk.reflect[1]}턴 동안 받은 피해의 ${P100(sk.reflect[0])}를 되돌려줘요`); }
  if (sk.reflectDebuff) { A.st.reflectDebuff = { turns: sk.reflectDebuff }; log.push(`　🔮 ${sk.reflectDebuff}턴 동안 걸리는 디버프를 상대에게 되돌려요`); }
  if (sk.devilDeal) { // 😈 악마와의 거래: 턴 동안 확정 급소+약점, 못 쓰러뜨리면 준 피해 × 배수를 무효화 불가 피해로 (tickSide 에서 정산)
    A.st.devil = { turns: sk.devilDeal[0] + 1, mult: sk.devilDeal[1], dealt: 0 }; // +1: 이번 턴 끝 감소분
    log.push(`　😈 **악마와 거래했어요!** ${sk.devilDeal[0]}턴 동안 모든 공격이 확정 급소 + 약점! 하지만 못 쓰러뜨리면 준 피해의 ×${sk.devilDeal[1]} 를 무효화 불가 피해로 받아요…`);
  }
  if (sk.catchPro) { // 🪢 포획 전문가: 유효 턴 동안 도망을 막고 포획률 상승 (붙잡았을 때의 제한 턴 연장은 catchProHold 가 해요)
    const dur = catchProTurns(sk);
    A.st.catchPro = { bonus: sk.catchPro[0], extra: sk.catchPro[1], turns: dur + 1, held: A.st.catchPro?.held ?? false }; // +1: 이번 턴 끝 감소분
    log.push(`　🪢 ${dur}턴 동안 야생 펫이 도망치려 하면 확정으로 붙잡아요! 포획률 **+${P100(sk.catchPro[0])}p**`);
  }
  if (sk.fightBuff) { // 📈 전투 중 버프: 이번 전투가 끝날 때까지 쌓여요 (한도 FIGHT_BUFF_CAP)
    const fb = (A.st.fightBuff ??= {});
    for (const [k, v] of Object.entries(sk.fightBuff)) fb[k] = Math.min(FIGHT_BUFF_CAP[k] ?? 1, (fb[k] ?? 0) + v);
    log.push(`　📈 이번 전투 동안 ${fightBuffText(sk.fightBuff)}! (지금까지 쌓인 효과: ${fightBuffText(fb)})`);
  }
  if (sk.curse) { // 🧿 금단의 저주: 나 자신에게 랜덤 디버프 N개 · 이 칸이 저주부여로 바뀌어요
    const [cnt, turns] = sk.curse;
    const pool = CURSE_POOL.slice();
    const picked = [];
    for (let i = 0; i < cnt && pool.length; i++) picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    for (const c of picked) putCurse(A, c, 1, turns);
    A.st.cursed = { list: picked, turns, dur: turns };
    const slot = (A.skills ?? []).indexOf(sk.id);
    if (slot >= 0) A.skills[slot] = 'curse_grant';
    log.push(`　🧿 ${A.name}에게 저주가 걸렸어요! ${picked.map((c) => CURSE_LABEL[c.k]).join(' · ')} (${turns}턴)${slot >= 0 ? ' — 다음 턴, 이 스킬이 **저주부여**로 바뀌어요' : ''}`);
  }
  if (sk.mana) { const n = Math.min(sk.mana, SKILL_CFG.manaMax + 1000); A.mana += n; log.push(`　🔋 마나 +${n}`); }
  if (sk.cleanse) { A.st.dots = []; delete A.st.atkDown; delete A.st.defDown; delete A.st.stun; log.push('　✨ 나쁜 상태가 사라졌어요'); }
  // 🆕 배치 3: 쿨타임 삭제 · 부활 · 스킬 면역 · 능력치 룰렛 · 1회용 효과 이동(대기)
  if (sk.cdReset) {
    const had = Object.keys(A.st.cds ?? {}).length;
    if (sk.cdReset >= 99) delete A.st.cds;
    else for (const id of Object.keys(A.st.cds ?? {})) if ((A.st.cds[id] -= sk.cdReset) <= 0) delete A.st.cds[id];
    log.push(had ? '　⏪ 스킬 쿨타임이 줄어들었어요!' : '　💨 줄일 쿨타임이 없었어요…');
  }
  if (sk.revive) { A.st.revive = { pct: sk.revive[0], turns: sk.revive[1] + 1, left: sk.revive[2] ?? 1 }; log.push(`　🪽 ${sk.revive[1]}턴 동안 쓰러져도 체력 ${P100(sk.revive[0])}로 부활해요!`); }
  if (sk.skillImmune) { A.st.skillImmune = { turns: sk.skillImmune + 1 }; log.push(`　🧿 ${sk.skillImmune}턴 동안 스킬로 취급되는 효과를 전혀 받지 않아요!`); }
  if (sk.statRoll && (sk.statRoll[1] !== 'foe' || (!immune && B.hp > 0))) rollStats(sk, sk.statRoll[1] === 'foe' ? B : A, rng, log);
  if (sk.buffXfer && B.hp > 0) { A.st.xfer = { mode: sk.buffXfer[0], turns: sk.buffXfer[1] }; log.push(`　🧲 1회용 효과 이동을 준비했어요! (${sk.buffXfer[1]}턴 안에 한 번 발동)`); }
  // 🆕 독창 스킬: 상태이상 터뜨리기 (새 상태이상을 걸기 전에 먼저 터뜨려요)
  if (sk.detonate && B.hp > 0) {
    const left = (B.st.dots ?? []).reduce((n, d) => n + Math.max(1, Math.round(B.max * d.pct)) * d.turns, 0);
    if (left > 0) {
      const n = Math.max(1, Math.round(left * sk.detonate));
      B.hp = Math.max(0, B.hp - n);
      dealt += n;
      B.st.dots = [];
      log.push(`　💥 ${B.name}의 상태이상이 **폭발**해서 **${n}** 피해!`);
    } else {
      log.push('　💨 터뜨릴 상태이상이 없어요…');
    }
  }
  if (sk.swapHp && B.hp > 0) {
    const ra = A.hp / A.max;
    const rb = B.hp / B.max;
    if (ra < rb) {
      A.hp = Math.min(A.max, Math.max(1, Math.round(A.max * rb)));
      B.hp = Math.max(1, Math.round(B.max * ra));
      log.push(`　🔀 서로의 체력이 뒤바뀌었어요! ${A.name} ${A.hp}/${A.max} · ${B.name} ${B.hp}/${B.max}`);
    } else {
      log.push('　💨 내가 더 건강해서 아무 일도 일어나지 않았어요…');
    }
  }
  if (B.hp > 0) {
    if (sk.bomb) {
      B.st.bomb = { dmg: Math.max(1, Math.round(effAtk(A) * sk.bomb[0] * elemMul)), turns: sk.bomb[1] };
      log.push(`　💣 ${B.name}에게 **시한폭탄**을 달았어요! (${sk.bomb[1]}턴 뒤 폭발)`);
    }
    if (sk.stealMana) {
      const n = Math.min(B.mana, sk.stealMana);
      B.mana -= n;
      A.mana += n;
      log.push(`　🧤 ${B.name}의 마나 ${n}을(를) 훔쳤어요!`);
    }
    if (sk.steal) {
      const [stat, pct, turns] = sk.steal;
      const [upKey, downKey, label] = { atk: ['atkUp', 'atkDown', '공격력'], def: ['defUp', 'defDown', '방어력'], spd: ['spdUp', 'spdDown', '스피드'] }[stat] ?? [];
      if (upKey) {
        A.st[upKey] = { pct: (A.st[upKey]?.pct ?? 0) + pct, turns };
        B.st[downKey] = { pct: (B.st[downKey]?.pct ?? 0) + pct, turns };
        log.push(`　🧲 ${B.name}의 ${label} ${P100(pct)}을(를) 훔쳤어요! (${turns}턴)`);
      }
    }
    if (sk.turnCut) {
      let cut = 0;
      for (const k of ['atkUp', 'defUp', 'guard', 'regen']) {
        if (B.st[k]?.turns) { B.st[k].turns = Math.max(0, B.st[k].turns - sk.turnCut); if (B.st[k].turns <= 0) delete B.st[k]; cut++; }
      }
      log.push(cut ? `　⏳ ${B.name}의 좋은 효과 지속시간이 ${sk.turnCut}턴 줄었어요!` : '　💨 줄일 효과가 없었어요…');
    }
    // 🔮 거울 장막: 디버프를 쓴 쪽에게 되돌려요
    const hasDebuff = sk.healCut || sk.atkDown || (sk.defDown && sk.defDown[0] > 0) || sk.stun || sk.dot || sk.drainMana || sk.curseGrant;
    const T = B.st.reflectDebuff && hasDebuff ? A : B;
    if (T !== B) log.push(`　🔮 ${B.name}의 거울 장막! 디버프가 ${A.name}에게 되돌아가요!`);
    if (sk.healCut) { T.st.healCut = { pct: sk.healCut[0], turns: sk.healCut[1] }; log.push(`　🚑 ${T.name}의 회복 효과 -${P100(sk.healCut[0])} (${sk.healCut[1]}턴)`); }
    if (sk.atkDown) { T.st.atkDown = { pct: sk.atkDown[0], turns: sk.atkDown[1] }; log.push(`　🔻 ${T.name} 공격력 -${P100(sk.atkDown[0])} (${sk.atkDown[1]}턴)`); }
    if (sk.defDown && sk.defDown[0] > 0) { T.st.defDown = { pct: sk.defDown[0], turns: sk.defDown[1] }; log.push(`　🔻 ${T.name} 방어력 -${P100(sk.defDown[0])} (${sk.defDown[1]}턴)`); }
    if (sk.stun && rng() < sk.stun) { T.st.stun = 1; log.push(`　💫 ${T.name}(이)가 **기절**했어요!`); }
    if (sk.dot && rng() < sk.dot[3]) {
      T.st.dots = (T.st.dots ?? []).filter((d) => d.kind !== sk.dot[0]);
      T.st.dots.push({ kind: sk.dot[0], pct: sk.dot[1], turns: sk.dot[2] });
      log.push(`　${DOT[sk.dot[0]] ?? sk.dot[0]} ${T.name}에게 ${sk.dot[2]}턴 동안!`);
    }
    if (sk.drainMana) { const n = Math.min(T.mana, sk.drainMana); T.mana -= n; if (n) log.push(`　🔻 ${T.name} 마나 -${n}`); }
    if (sk.curseGrant && A.st.cursed) { // 🪬 저주부여: 저주로 받은 디버프를 ×배수 위력으로
      const rec = A.st.cursed;
      for (const c of rec.list) putCurse(T, c, sk.curseGrant, rec.dur);
      log.push(`　🪬 저주가 **×${sk.curseGrant}** 로 커져서 ${T.name}에게! ${rec.list.map((c) => CURSE_LABEL[c.k]).join(' · ')} (${rec.dur}턴)`);
      delete A.st.cursed;
      revertCurseSlots(A.skills, A.st); // 칸이 다시 금단의 저주로
    }
  }
  if (sk.echo) { A.st.echo = { turns: sk.echo }; log.push(`　🔊 ${sk.echo}턴 안에 쓰는 다음 공격 스킬이 메아리쳐요`); }
  // 🆕 메아리: 메아리가 켜진 상태에서 공격 스킬을 쓰면 위력 75% 로 한 번 더 (마나 0)
  if (A.st.echo && sk.pow && !sk.echoed && A.hp > 0 && B.hp > 0) {
    delete A.st.echo;
    log.push('　🔊 메아리가 울려 퍼져요!');
    castSkill({ id: sk.id, name: `${sk.name} (메아리)`, emoji: sk.emoji, tier: sk.tier, cost: 0, pow: sk.pow * 0.75, hits: sk.hits, hitsRange: sk.hitsRange, pierce: sk.pierce, crit: sk.crit, exec: sk.exec, elem: sk.elem, weakBonus: sk.weakBonus, ignoreResist: sk.ignoreResist, echoed: true }, A, B, rng, log);
  }
  tryRevive(A, log); // 🪽 이번 스킬로 쓰러졌다면 부활 판정
  tryRevive(B, log);
  A.mana = Math.min(A.mana, A.manaMax);
}

// 턴이 끝날 때 한쪽에게 일어나는 일: 지속 피해 · 회복 · 남은 턴 줄이기 · (gainMana 일 때만) 마나 +manaPerTurn
// gainMana: 이번 턴에 기본 공격을 했을 때만 true 로 넘겨요. 스킬을 쓴 턴에는 마나가 안 차요.
export function tickSide(X, log, gainMana = true, foe = null) {
  const st = X.st;
  const immune = !!st.skillImmune; // 🧿 스킬 면역이면 스킬로 걸린 지속 피해·폭탄은 효과가 없어요
  for (const d of st.dots ?? []) {
    if (immune) log.push(`🧿 ${X.name}은(는) 스킬 면역! ${DOT[d.kind] ?? d.kind} 피해를 안 받아요`);
    else {
      const n = Math.max(1, Math.round(X.max * d.pct));
      X.hp = Math.max(0, X.hp - n);
      log.push(`${DOT[d.kind] ?? d.kind} ${X.name}(이)가 **${n}** 피해`);
    }
    d.turns -= 1;
  }
  st.dots = (st.dots ?? []).filter((d) => d.turns > 0);
  if (st.bomb) {
    st.bomb.turns -= 1;
    if (st.bomb.turns <= 0) {
      if (immune) log.push(`🧿 ${X.name}은(는) 스킬 면역! 시한폭탄이 불발됐어요`);
      else {
        const n = Math.max(1, Math.round(st.bomb.dmg));
        X.hp = Math.max(0, X.hp - n);
        log.push(`💣 ${X.name}에게 **시한폭탄**이 터졌어요! **${n}** 피해`);
      }
      delete st.bomb;
    }
  }
  tryRevive(X, log); // 🪽 지속 피해로 쓰러졌다면 부활
  if (st.devil && --st.devil.turns <= 0) { // 😈 악마의 거래 정산: 못 쓰러뜨렸다면 준 피해 × 배수를 "무효화 불가"로 받아요
    const d = st.devil;
    delete st.devil;
    if (X.hp > 0 && foe && foe.hp > 0) {
      if (d.dealt > 0) {
        const toll = Math.max(1, Math.round(d.dealt * d.mult));
        X.hp = Math.max(0, X.hp - toll); // 쉴드·가드·회피·분신·스킬 면역을 거치지 않고 체력에 바로 들어가요
        log.push(`😈 **거래의 대가!** ${X.name}(이)가 준 피해 ${d.dealt}의 ×${d.mult} = **${toll}** 무효화 불가 피해를 받았어요!`);
        if (X.hp <= 0) { delete st.revive; log.push(`😈 부활의 힘도 거래 앞에서는 소용없어요…`); }
      } else log.push(`😈 ${X.name}은(는) 거래 기간 동안 피해를 못 줘서 대가를 치르지 않았어요`);
    }
  }
  if (st.clone && foe && foe.hp > 0 && X.hp > 0 && !foe.st.skillImmune) { // 👥 분신이 같이 공격해요 (상대가 스킬 면역이면 못 때려요)
    const base = Math.max(st.clone.atk * 0.25, st.clone.atk - effDef(foe) * 0.5) * (0.85 + Math.random() * 0.3);
    const hit = mitigate(foe, Math.max(1, Math.round(base)));
    foe.hp = Math.max(0, foe.hp - hit.dmg);
    log.push(`👥 ${X.name}의 분신이 ${foe.name}에게 **${hit.dmg}** 데미지${hit.note}`);
    afterHit(foe, X, hit.dmg, log);
  }
  if (st.xfer && foe && foe.hp > 0 && X.hp > 0) { // 🧲 1회용 효과 이동: 옮길 게 생기면 한 번 발동하고 사라져요
    if (!foe.st.skillImmune && applyXfer(X, foe, st.xfer.mode, log)) delete st.xfer;
    else if (--st.xfer.turns <= 0) { delete st.xfer; log.push(`💨 ${X.name}의 효과 이동이 아무 일 없이 사라졌어요`); }
  }
  if (st.regen && X.hp > 0) {
    const n = heal(X, X.max * st.regen.pct);
    if (n) log.push(`🌱 ${X.name} 체력 +${n}`);
    if (--st.regen.turns <= 0) delete st.regen;
  }
  // 🆕 최대마나 증가 효과가 끝나면 늘렸던 만큼 되돌려요
  if (st.manaMaxUp && --st.manaMaxUp.turns <= 0) {
    X.manaMax = Math.max(SKILL_CFG.manaMax, X.manaMax - st.manaMaxUp.amt);
    X.mana = Math.min(X.mana, X.manaMax);
    delete st.manaMaxUp;
  }
  if (st.revive && --st.revive.turns <= 0) { delete st.revive; log.push(`🪽 ${X.name}의 부활 효과가 사라졌어요`); }
  for (const k of ['atkUp', 'atkDown', 'defUp', 'defDown', 'guard', 'echo', 'convert', 'ward', 'manaRegenUp', 'burst', 'coinflip', 'defToAtk', 'healCut', 'spdUp', 'spdDown', 'priority', 'reflect', 'reflectDebuff', 'clone', 'statMod', 'skillImmune', 'sealed', 'cursed', 'catchPro']) {
    if (st[k] && --st[k].turns <= 0) delete st[k];
  }
  for (const id of Object.keys(st.cds ?? {})) if (--st.cds[id] <= 0) delete st.cds[id]; // ⏳ 쿨타임 감소
  st.prevTaken = st.turnTaken ?? 0; // 👼 지난 턴 받은 피해 기억 (대천사의 축복용)
  delete st.turnTaken; // 이번 턴 받은 피해는 턴이 끝나면 초기화
  if (gainMana) X.mana = Math.min(X.manaMax, X.mana + SKILL_CFG.manaPerTurn + (st.manaRegenUp?.amt ?? 0));
}

// 🆕 야생 펫도 아군처럼 만날 때 랜덤 스킬을 1~3개 배워서 나와요
export function rollWildSkills(petId, rng = Math.random) {
  const count = 1 + Math.floor(rng() * 3); // 1~3개
  const skills = [];
  for (let i = 0; i < count; i++) {
    const id = rollSkill({ petId }, rng, skills); // sigChance(1%)로 전용기가 섞여 나올 수도 있어요
    if (id) skills.push(id);
  }
  return skills;
}

// 야생 펫의 스킬 고르기: 배운 스킬 중 "지금 상황에 가장 쓸모 있는" 걸 점수로 골라요.
// 마나만 되면 거의 항상 스킬을 써요 (활용률 100%) — 예전처럼 35%로 거르지 않아요.
export function pickWildSkill(skillIds, wild, me, rng = Math.random) {
  if (wild.st?.sealed) return null; // 🔒 조커로 봉인되면 기본 공격만 해요
  const options = (skillIds ?? []).map((id) => SKILLS[id]).filter((sk) => sk && sk.cost <= wild.mana && cdLeft(wild.st, sk.id) <= 0
    && !(sk.joker && wild.fight?.jokerUsed) && !(sk.devilDeal && wild.st?.devil) && !(sk.curseGrant && !wild.st?.cursed) && !sk.catchPro && !sk.fightBuff);
  if (!options.length) return null; // 배운 스킬이 없거나 마나가 모자라면 기본 공격

  const myRatio = wild.hp / wild.max;
  const foeRatio = me.hp / me.max;

  const score = (sk) => {
    let s = 1 + rng() * 0.5; // 동점일 땐 랜덤하게
    if (myRatio <= 0.4 && (sk.heal || sk.regen || sk.shield || sk.guard || sk.cleanse)) s += 6; // 위험하면 회복·방어 최우선
    if (foeRatio <= 0.3 && (sk.exec || (sk.pow ?? 0) >= 2)) s += 5; // 상대가 빈사면 마무리기 우선
    if (sk.stun || sk.atkDown || sk.defDown || sk.dot) s += 2; // 방해 효과는 언제나 쓸모 있어요
    if (sk.pow) s += sk.pow; // 순수 세기도 반영
    if (sk.pow) { // 🌈 상성이 좋은 스킬을 더 골라요 (약점이면 +2.5, 반감이면 -2)
      const cl = elemClash(skillElement(sk), me, { ignoreResist: sk.ignoreResist });
      if (cl.mult >= 1.1) s += 2.5;
      else if (cl.mult <= 0.9) s -= 2;
    }
    if (sk.curseGrant) s += 5; // 🪬 저주부여는 기회가 한 번이라 바로 써요
    else if (sk.curse) s -= 2; // 🧿 자기 저주는 살짝 꺼려요
    if (sk.devilDeal || sk.joker) s += 1;
    if (sk.cost > wild.mana * 0.8) s -= 1; // 너무 비싸면 살짝 아껴요
    return s;
  };

  return options.sort((a, b) => score(b) - score(a))[0];
}

// 상태 줄 글자: "🔥화상 2턴 · 💪공격↑ 3턴"
export function statusText(st = {}) {
  const t = [];
  for (const d of st.dots ?? []) t.push(`${DOT[d.kind] ?? d.kind} ${d.turns}턴`);
  if (st.stun) t.push('💫 기절');
  if (st.atkUp) t.push(`💪 공격↑ ${st.atkUp.turns}턴`);
  if (st.atkDown) t.push(`🔻 공격↓ ${st.atkDown.turns}턴`);
  if (st.defUp) t.push(`🧱 방어↑ ${st.defUp.turns}턴`);
  if (st.defDown) t.push(`🔻 방어↓ ${st.defDown.turns}턴`);
  if (st.guard) t.push(`🛡️ 방어태세 ${st.guard.turns}턴`);
  if (st.shield > 0) t.push(`🔰 보호막 ${st.shield}`);
  if (st.evade > 0) t.push(`🌀 회피 ${st.evade}회`);
  if (st.regen) t.push(`🌱 재생 ${st.regen.turns}턴`);
  if (st.bomb) t.push(`💣 시한폭탄 ${st.bomb.turns}턴`);
  if (st.echo) t.push(`🔊 메아리 ${st.echo.turns}턴`);
  if (st.convert) t.push(`🧬 ${elemTag(st.convert.elem)} 변신 ${st.convert.turns}턴`);
  if (st.ward) t.push(`🔮 속성방벽 ${st.ward.turns}턴`);
  if (st.manaMaxUp) t.push(`🔷 최대마나+${st.manaMaxUp.amt} ${st.manaMaxUp.turns}턴`);
  if (st.manaRegenUp) t.push(`🔋 마나회복+${st.manaRegenUp.amt} ${st.manaRegenUp.turns}턴`);
  if (st.burst) t.push(`🔥 공격력×${st.burst.mult} ${st.burst.turns}턴`);
  if (st.coinflip) t.push(`🎲 모아니면도 ${st.coinflip.turns}턴`);
  if (st.defToAtk) t.push(`⚔️ 방어→공격 ${st.defToAtk.turns}턴`);
  if (st.healCut) t.push(`🚑 회복감소 ${st.healCut.turns}턴`);
  if (st.spdUp) t.push(`👟 스피드↑ ${st.spdUp.turns}턴`);
  if (st.spdDown) t.push(`🐌 스피드↓ ${st.spdDown.turns}턴`);
  if (st.priority) t.push(`⏱️ 선공 ${st.priority.turns}턴`);
  if (st.clone) t.push(`👥 분신 ❤${st.clone.hp} ${st.clone.turns}턴`);
  if (st.reflect) t.push(`🪞 반사 ${st.reflect.turns}턴`);
  if (st.reflectDebuff) t.push(`🔮 디버프반사 ${st.reflectDebuff.turns}턴`);
  if (st.xfer) t.push(`🧲 ${{ steal: '버프 약탈', give: '디버프 떠넘기기', swap: '효과 교환' }[st.xfer.mode] ?? '효과 이동'} 대기 ${st.xfer.turns}턴`);
  if (st.statMod) t.push(`🎰 능력치 ⚔️×${+st.statMod.atk.toFixed(2)} 🧱×${+st.statMod.def.toFixed(2)} 👟×${+st.statMod.spd.toFixed(2)} ${st.statMod.turns}턴`);
  if (st.skillImmune) t.push(`🧿 스킬면역 ${st.skillImmune.turns}턴`);
  if (st.revive) t.push(`🪽 부활대기 ${st.revive.turns}턴`);
  if (st.sealed) t.push(`🔒 스킬봉인 ${st.sealed.turns}턴`);
  if (st.cursed) t.push(`🧿 저주 ${st.cursed.turns}턴`);
  if (st.catchPro) t.push(`🪢 포획전문가 ${st.catchPro.turns}턴 (포획률 +${Math.round(st.catchPro.bonus * 100)}%p${st.catchPro.held ? ' · 붙잡음' : ''})`);
  if (st.fightBuff && fightBuffText(st.fightBuff)) t.push(`📈 ${fightBuffText(st.fightBuff)}`);
  if (st.devil) t.push(`😈 악마의 거래 ${st.devil.turns}턴 · 준 피해 ${st.devil.dealt} (×${st.devil.mult})`);
  for (const [id, n] of Object.entries(st.cds ?? {})) if (SKILLS[id]) t.push(`⏳ ${SKILLS[id].name} 쿨 ${n}턴`);
  return t.join(' · ');
}

// 펫마다 전용기 목록 (도감·상점 안내용). 예: sigOf('wolf') → [sig_wolf, sig_wolf2]
export const sigOf = (petId) => Object.values(SKILLS).filter((s) => s.pet === petId);