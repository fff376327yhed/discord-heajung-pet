// 해정펫 스킬 ✨ — 스킬 데이터 + 전투 규칙 (디스코드와 상관없는 순수한 규칙)
//
// 마나: 최대 SKILL_CFG.manaMax(100), 매 턴 +manaPerTurn(5). 스킬은 마나를 써요. 좋은 스킬일수록 마나가 많이 들어요.
// 슬롯: 1번 Lv.40 · 2번 Lv.100 · 3번 상점의 [스킬 슬롯 개방권]. 열릴 때 랜덤 스킬이 하나 들어와요 ([스킬 변경권] 으로 다시 뽑기).
// 전용기: 펫마다 1~2개. 그 펫만 배울 수 있고, 같은 마나의 일반 스킬보다 더 세요.
//
// 효과 칸 (fx) — 아래 이름만 쓰면 설명 글자는 자동으로 만들어져요:
//   pow 데미지 배율 · hits 타수 · pierce 방어무시 · crit 급소확률+ · exec 체력30%↓ 적에게 배율 · drain 흡혈 · recoil 반동
//   heal 회복 · regen [비율,턴] · shield 보호막 · guard [감소율,턴] · evade 회피 횟수 · atkUp/defUp [비율,턴] · atkDown/defDown [비율,턴]
//   stun 기절확률 · dot [종류,비율,턴,확률] · mana 마나회복 · drainMana 적 마나 감소 · cleanse 상태이상 제거

export const SKILL_CFG = {
  manaMax: 100, // 마나 최대치 (마나 수정으로 펫마다 더 늘릴 수 있어요)
  manaStart: 30, // 전투 시작 마나
  manaPerTurn: 5, // 한 턴마다 차는 마나
  slot1Level: 40, // 첫 스킬 슬롯이 열리는 펫 레벨
  slot2Level: 100, // 두 번째 스킬 슬롯이 열리는 펫 레벨
  sigChance: 0.25, // 슬롯이 열리거나 변경될 때 "전용기"가 나올 확률 (펫에게 전용기가 있을 때)
  wildSkillChance: 0.35, // 야생 펫이 매 턴 전용기를 쓸 확률 (마나가 될 때)
  crystalMana: 10, // 마나 수정 1개당 늘어나는 최대 마나
  crystalMaxBonus: 100, // 마나 수정으로 늘릴 수 있는 최대치
};
// 슬롯이 열릴 때 등급(★)별로 뽑힐 무게 (클수록 자주 나와요)
export const TIER_WEIGHT = { 1: 30, 2: 28, 3: 22, 4: 14, 5: 6 };
const TIER_COST = { 1: 10, 2: 20, 3: 35, 4: 50, 5: 70 }; // 등급별 기본 마나 (스킬마다 따로 고칠 수 있어요)

export const SKILLS = {};
const add = (id, name, emoji, tier, fx, extra = {}) => {
  SKILLS[id] = { id, name, emoji, tier, cost: TIER_COST[tier], ...fx, ...extra };
};
const G = (id, name, emoji, tier, fx) => add(id, name, emoji, tier, fx); // 일반 스킬 (모든 펫)
const P = (pet, id, name, emoji, tier, fx, flavor) => add(id, name, emoji, tier, fx, { pet, flavor }); // 전용기

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

// ───────── 설명 글자 (효과 칸으로 자동 만들어요 → 관리자에서 효과를 바꿔도 설명이 같이 바뀌어요) ─────────
const P100 = (x) => `${Math.round(x * 100)}%`;
const DOT = { burn: '🔥 화상', poison: '☠️ 독', bleed: '🩸 출혈' };

export function describeSkill(sk) {
  const t = [];
  if (sk.pow) t.push(sk.hits > 1 ? `적을 **${sk.hits}번** 공격 (1번에 공격력의 ${P100(sk.pow)})` : `적에게 공격력의 **${P100(sk.pow)}** 데미지`);
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
  if (sk.cleanse) t.push('내 상태이상(화상·독·출혈·약화) 제거');
  return (sk.flavor ? `*${sk.flavor}*\n` : '') + (t.join(' · ') || '효과 없음');
}

export const tierStars = (t) => '★'.repeat(Math.max(1, Math.min(5, t)));
export function skillCategory(sk) {
  if (sk.pet) return '전용기';
  if (sk.pow) return '공격';
  if (sk.atkUp || sk.defUp || sk.mana) return '강화';
  if (sk.atkDown || sk.defDown || sk.stun || sk.dot || sk.drainMana) return '약화';
  return '회복·방어';
}

// ───────── 슬롯 · 배우기 ─────────
export const maxMana = (inst) => SKILL_CFG.manaMax + (inst?.manaBonus ?? 0);
export const slotsOpen = (inst) => [inst.level >= SKILL_CFG.slot1Level, inst.level >= SKILL_CFG.slot2Level, !!inst.slot3];
export const SLOT_HINT = () => [`Lv.${SKILL_CFG.slot1Level} 에 열려요`, `Lv.${SKILL_CFG.slot2Level} 에 열려요`, '상점의 🎫 스킬 슬롯 개방권으로 열어요'];

export function rollSkill(inst, rng = Math.random, exclude = []) {
  const all = Object.values(SKILLS).filter((s) => !exclude.includes(s.id));
  const sig = all.filter((s) => s.pet === inst.petId);
  const pool = sig.length && rng() < SKILL_CFG.sigChance ? sig : all.filter((s) => !s.pet);
  if (!pool.length) return null;
  const w = (s) => Math.max(0.01, TIER_WEIGHT[s.tier] ?? 10);
  let r = rng() * pool.reduce((n, s) => n + w(s), 0);
  for (const s of pool) { r -= w(s); if (r < 0) return s.id; }
  return pool[pool.length - 1].id;
}

// 열려 있는데 비어 있는 슬롯에 랜덤 스킬을 채워요. 새로 생긴 [슬롯번호, 스킬id] 목록을 돌려줘요.
export function grantSkills(inst, rng = Math.random) {
  inst.skills = Array.isArray(inst.skills) ? inst.skills : [null, null, null];
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
export const effAtk = (X) => X.atk * clamp(1 + (X.st.atkUp?.pct ?? 0) - (X.st.atkDown?.pct ?? 0), 0.2, 4);
export const effDef = (X) => X.def * clamp(1 + (X.st.defUp?.pct ?? 0) - (X.st.defDown?.pct ?? 0), 0.2, 4);

// 맞는 쪽의 회피 · 방어 · 보호막을 적용해요
export function mitigate(X, dmg) {
  const st = X.st;
  if (st.evade > 0) { st.evade -= 1; return { dmg: 0, note: ' (🌀 회피!)' }; }
  let note = '';
  if (st.guard) { dmg = Math.max(1, Math.round(dmg * (1 - st.guard.pct))); note += ' (🛡️ 방어)'; }
  if (st.shield > 0) {
    const ab = Math.min(st.shield, dmg);
    st.shield -= ab; dmg -= ab; note += ` (🔰 ${ab} 흡수)`;
  }
  return { dmg, note };
}

const heal = (X, n) => { const real = Math.min(X.max - X.hp, Math.max(0, Math.round(n))); X.hp += real; return real; };

// 스킬 한 번 쓰기. A = 쓰는 쪽, B = 맞는 쪽
export function castSkill(sk, A, B, rng, log) {
  A.mana = Math.max(0, A.mana - sk.cost);
  log.push(`✨ ${A.emoji} ${A.name}의 ${sk.emoji} **${sk.name}**!`);
  let dealt = 0;
  if (sk.pow) {
    const hits = sk.hits ?? 1;
    for (let i = 0; i < hits && B.hp > 0; i++) {
      const atk = effAtk(A);
      const def = effDef(B) * (1 - (sk.pierce ?? 0));
      let dmg = Math.max(atk * 0.25, atk - def * 0.5) * sk.pow * (0.85 + rng() * 0.3);
      const crit = rng() < (A.crit ?? 0.1) + (sk.crit ?? 0);
      if (crit) dmg *= 1.5;
      if (sk.exec && B.hp / B.max <= 0.3) dmg *= sk.exec;
      const hit = mitigate(B, Math.max(1, Math.round(dmg)));
      B.hp = Math.max(0, B.hp - hit.dmg);
      dealt += hit.dmg;
      log.push(`　${hits > 1 ? `${i + 1}타 ` : ''}${crit ? '💥 급소! ' : ''}${B.name}에게 **${hit.dmg}** 데미지${hit.note}`);
    }
  }
  if (sk.drain && dealt > 0) { const n = heal(A, dealt * sk.drain); if (n) log.push(`　🩸 체력 +${n}`); }
  if (sk.recoil) {
    const n = Math.min(A.hp - 1, Math.round(A.max * sk.recoil));
    if (n > 0) { A.hp -= n; log.push(`　💢 반동으로 -${n}`); }
  }
  if (sk.heal) { const n = heal(A, A.max * sk.heal); log.push(`　💖 체력 +${n}`); }
  if (sk.regen) { A.st.regen = { pct: sk.regen[0], turns: sk.regen[1] }; log.push(`　🌱 ${sk.regen[1]}턴 동안 체력이 차올라요`); }
  if (sk.shield) { A.st.shield = (A.st.shield ?? 0) + Math.round(A.max * sk.shield); log.push(`　🔰 보호막 ${A.st.shield}`); }
  if (sk.guard) { A.st.guard = { pct: sk.guard[0], turns: sk.guard[1] }; log.push(`　🛡️ ${sk.guard[1]}턴 동안 받는 데미지 -${P100(sk.guard[0])}`); }
  if (sk.evade) { A.st.evade = (A.st.evade ?? 0) + sk.evade; log.push(`　🌀 다음 공격 ${A.st.evade}번 회피`); }
  if (sk.atkUp) { A.st.atkUp = { pct: sk.atkUp[0], turns: sk.atkUp[1] }; log.push(`　💪 ${sk.atkUp[1]}턴 동안 공격력 +${P100(sk.atkUp[0])}`); }
  if (sk.defUp) { A.st.defUp = { pct: sk.defUp[0], turns: sk.defUp[1] }; log.push(`　🧱 ${sk.defUp[1]}턴 동안 방어력 +${P100(sk.defUp[0])}`); }
  if (sk.mana) { const n = Math.min(sk.mana, SKILL_CFG.manaMax + 1000); A.mana += n; log.push(`　🔋 마나 +${n}`); }
  if (sk.cleanse) { A.st.dots = []; delete A.st.atkDown; delete A.st.defDown; delete A.st.stun; log.push('　✨ 나쁜 상태가 사라졌어요'); }
  if (B.hp > 0) {
    if (sk.atkDown) { B.st.atkDown = { pct: sk.atkDown[0], turns: sk.atkDown[1] }; log.push(`　🔻 ${B.name} 공격력 -${P100(sk.atkDown[0])} (${sk.atkDown[1]}턴)`); }
    if (sk.defDown && sk.defDown[0] > 0) { B.st.defDown = { pct: sk.defDown[0], turns: sk.defDown[1] }; log.push(`　🔻 ${B.name} 방어력 -${P100(sk.defDown[0])} (${sk.defDown[1]}턴)`); }
    if (sk.stun && rng() < sk.stun) { B.st.stun = 1; log.push(`　💫 ${B.name}(이)가 **기절**했어요!`); }
    if (sk.dot && rng() < sk.dot[3]) {
      B.st.dots = (B.st.dots ?? []).filter((d) => d.kind !== sk.dot[0]);
      B.st.dots.push({ kind: sk.dot[0], pct: sk.dot[1], turns: sk.dot[2] });
      log.push(`　${DOT[sk.dot[0]] ?? sk.dot[0]} ${B.name}에게 ${sk.dot[2]}턴 동안!`);
    }
    if (sk.drainMana) { const n = Math.min(B.mana, sk.drainMana); B.mana -= n; if (n) log.push(`　🔻 ${B.name} 마나 -${n}`); }
  }
  A.mana = Math.min(A.mana, A.manaMax);
}

// 턴이 끝날 때 한쪽에게 일어나는 일: 지속 피해 · 회복 · 남은 턴 줄이기 · 마나 +5
export function tickSide(X, log) {
  const st = X.st;
  for (const d of st.dots ?? []) {
    const n = Math.max(1, Math.round(X.max * d.pct));
    X.hp = Math.max(0, X.hp - n);
    log.push(`${DOT[d.kind] ?? d.kind} ${X.name}(이)가 **${n}** 피해`);
    d.turns -= 1;
  }
  st.dots = (st.dots ?? []).filter((d) => d.turns > 0);
  if (st.regen && X.hp > 0) {
    const n = heal(X, X.max * st.regen.pct);
    if (n) log.push(`🌱 ${X.name} 체력 +${n}`);
    if (--st.regen.turns <= 0) delete st.regen;
  }
  for (const k of ['atkUp', 'atkDown', 'defUp', 'defDown', 'guard']) {
    if (st[k] && --st[k].turns <= 0) delete st[k];
  }
  X.mana = Math.min(X.manaMax, X.mana + SKILL_CFG.manaPerTurn);
}

// 야생 펫의 스킬 고르기: 전용기 중 마나가 되는 것 (가끔만 써요)
export function pickWildSkill(petId, mana, rng = Math.random) {
  if (rng() >= SKILL_CFG.wildSkillChance) return null;
  const ok = Object.values(SKILLS).filter((s) => s.pet === petId && s.cost <= mana);
  return ok.length ? ok[Math.floor(rng() * ok.length)] : null;
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
  return t.join(' · ');
}

// 펫마다 전용기 목록 (도감·상점 안내용). 예: sigOf('wolf') → [sig_wolf, sig_wolf2]
export const sigOf = (petId) => Object.values(SKILLS).filter((s) => s.pet === petId);