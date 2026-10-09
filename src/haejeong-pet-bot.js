// 해정펫 봇 — 모든 파일을 하나로 합친 버전 🐾
// (ES Module 이라서 package.json 에 "type": "module" 이 필요해요)
import { randomUUID } from 'node:crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createConfigManager } from './admin-config.js';
import {
  SKILLS,
  SKILL_CFG,
  SLOT_HINT,
  grantSkills,
  slotsOpen,
  rollSkill,
  rollWildSkills, // 🆕
  maxMana,
  castSkill,
  tickSide,
  pickWildSkill,
  statusText,
  describeSkill,
  skillEffectLines,
  skillCategory,
  tierStars,
  SLOT_COUNT,
} from './skill.js';

const SLOT_IDX = Array.from({ length: SLOT_COUNT }, (_, i) => i); // 스킬 슬롯 번호들 (0~4)

// ============================================================
// 설정값 (config.js)
// ============================================================

// 게임의 기본 설정값 모음 ⚙️ (숫자만 바꾸면 게임 느낌이 바뀌어요)
const pct = (v) => Math.round(v * 100);
let MAX_LEVEL = 100;
let START_GOLD = 1000;
let START_BALLS = 5;
const EMBED_COLOR = 0x5865f2;

// ───────── 포획 🔴 ─────────
// 해정볼을 던질 때마다 (한 마리 조우 기준) 포획 확률이 깎이고, 도망 확률이 올라가요
let CATCH_DROP_PER_TRY = 0.10; // 던질 때마다 포획 확률 -10%p
let FLEE_BASE = 0.25; // 첫 번째 던졌을 때 실패하면 도망갈 확률 (25%)
let FLEE_RISE_PER_TRY = 0.35; // 실패할 때마다 도망 확률 +35%p
let FLEE_MAX = 0.9; // 도망 확률 상한 (90%)

// ───────── 전투 ⚔️ ─────────
let BATTLE_MAX_ROUNDS = 15; // 이 턴 안에 못 끝내면 야생 펫이 도망가요 (무승부)
let CRIT_CHANCE = 0.1; // 급소 맞힐 확률 (데미지 1.5배)
let EVADE_CHANCE = 0.03; // 내 펫이 야생 펫의 공격을 회피할 확률 (공격이 통째로 빗나가요, 데미지 0)
let WILD_FLEE_CHANCE = 0.01; // 매 턴 끝에 야생 펫이 겁먹고 스스로 도망칠 확률

// ───────── 등급별 위압감 😨 ─────────
// 야생 펫의 등급이 높을수록 위압감이 커져서 전투가 더 어려워져요! (숫자만 바꾸면 세기가 바뀌어요)
//   missChance: 내 공격이 빗나갈 확률 (야생 펫이 피해요)
//   critChance: 야생 펫이 나를 급소로 세게 때릴 확률 (데미지 1.5배)
//   fleeFail:   [도망] 을 눌러도 실패해서 턴을 날릴 확률
//   aura:       야생 펫이 나타났을 때 보이는 위압감 문구 (null 이면 안 보여요)
// (일반 등급은 예전 값과 똑같아요: 빗나감 3%, 급소 10%, 도망 실패 10%)
const GRADE_EFFECTS = {
  common: { missChance: 0.03, critChance: 0.1, fleeFail: 0.1, aura: null },
  uncommon: { missChance: 0.05, critChance: 0.115, fleeFail: 0.15, aura: null },
  rare: { missChance: 0.07, critChance: 0.13, fleeFail: 0.2, aura: null },
  epic: { missChance: 0.12, critChance: 0.18, fleeFail: 0.35, aura: '😨 뭔가 위압감이 든다...' },
  legendary: { missChance: 0.2, critChance: 0.25, fleeFail: 0.5, aura: '😱 뭔가 엄청난 위압감이 든다...' },
  mythic: { missChance: 0.28, critChance: 0.32, fleeFail: 0.65, aura: '😱 숨이 막힐 만큼 위압감이 든다...' },
  divine: { missChance: 0.35, critChance: 0.4, fleeFail: 0.8, aura: '💀 도저히 이길 수 없을 것 같은 위압감이 든다...' },
};
let GOLD_PER_YIELD = 3; // 승리 골드 = 펫 expYield × 이 값 (±20% 랜덤). 해정볼이 100골드라서 이 값으로 균형을 잡아요
let WIN_TRAINER_EXP_MULT = 1.5; // 승리 시 트레이너 경험치 = expYield × 장소배율 × 이 값
let WIN_PET_EXP_MULT = 2.0; // 승리 시 대표 펫 경험치 = expYield × 장소배율 × 이 값 (펫이 트레이너보다 빨리 크도록 더 크게)
let BONUS_TRIPLE_CHANCE = 0.001; // 승리 시 0.1% 확률로 경험치·골드 3배 🎰
let BONUS_DOUBLE_CHANCE = 0.005; // 승리 시 0.5% 확률로 경험치·골드 2배 (3배와 동시에 나오지 않아요)
let AUTO_HUNT_REWARD_MULT = 0.2; // 🏃 자동사냥(자리 비운 사이 대신 탐험) 보상 배율 → 골드·경험치 -80%
let AUTO_HUNT_MAX_HOURS = 8; // 한 번 켜면 최대 이 시간(시간)까지만 대신 탐험해요 (끝나면 자동으로 꺼져요)
let AUTO_HUNT_MAX_RUNS = 600; // 한 번 정산할 때 돌리는 최대 탐험 횟수 (서버 보호용)
let AUTO_HUNT_SEC_PER_ROUND = 3; // 자동 전투 1턴에 걸린 것으로 치는 시간(초)
let AUTO_HUNT_MIN_SETTLE_SEC = 20; // 이 시간(초)보다 짧게 지났으면 정산을 미뤄요
let AUTO_HUNT_RESUME_RATIO = 0.7; // 펫이 위험해지면 쉬었다가, 체력이 이 비율까지 차면 다시 나가요
let AUTO_HUNT_CATCH_HP_RATIO = 0.5; // 도감에 없는 펫은 야생 펫 체력이 이 비율 이하가 되면 해정볼을 던져요
let AUTO_HUNT_MAX_THROWS = 5; // 한 마리에게 던지는 최대 해정볼 수
let AUTO_HUNT_MIN_CATCH = 0.05; // 포획 확률이 이보다 낮으면 던지지 않고 그냥 싸워요 (볼 낭비 방지)
let AUTO_HUNT_FEED_MAX = 8; // 진행 화면에 보여줄 최근 전투 기록 수

// ───────── 편의 기능 ✨ ─────────
let HEAL_FULL_CAP = 99; // [회복 가득] / /사용 자동 모드에서 한 번에 쓸 수 있는 약 개수 상한
let MULTI_TURNS = 3; // [공격 ×3] 이 한 번에 진행하는 턴 수
let MULTI_THROWS = 3; // [잡기 ×3] 이 한 번에 던지는 해정볼 수
let MULTI_STOP_HP_RATIO = 0.3; // 연속 행동 중 내 펫 체력이 이 비율 이하가 되면 자동으로 멈춰요 (펫이 사라지지 않게!)
let MAX_BUY_AT_ONCE = 999; // 한 번에 살 수 있는 최대 개수
let MAX_TRAIN_AT_ONCE = 100; // 한 번에 할 수 있는 최대 훈련 횟수
let MAX_CUSTOM_COUNT = 99; // 전투 중 [직접 입력] 으로 넣을 수 있는 최대 숫자

// ───────── 부스트 · 탐험 시간 감소 🚀 ─────────
let BOOST_PCT = 0.3; // 경험치 부스트: 경험치 획득 1회에 +30%
let SPEEDUP_PCT = 0.3; // 탐험 시간 감소: 남은 대기 시간 -30% (1개당)
let SPEEDUP_MIN_SEC = 5; // 탐험 시간 감소로는 남은 시간이 이 값(초) 아래로 내려가지 않아요
let SPEEDUP_BLOCK_SEC = 10; // 남은 시간이 이 값(초) 이하면 탐험 시간 감소를 쓸 수 없어요 (아이템도 안 줄어요)

// ───────── 탐험 대기 시간 ⏳ ─────────
// 기본 대기 시간은 "내 트레이너 레벨"로 정해요 (maxLevel 이하일 때 min~max 초 사이에서 랜덤, 61렙부터는 마지막 줄)
const WAIT_TIERS = [
  { maxLevel: 19, min: 5, max: 30 }, // ~19렙: 5초 ~ 30초
  { maxLevel: 30, min: 10, max: 60 }, // 20~30렙: 10초 ~ 1분
  { maxLevel: 40, min: 15, max: 60 }, // 31~40렙: 15초 ~ 1분
  { maxLevel: 50, min: 15, max: 90 }, // 41~50렙: 15초 ~ 1분 30초
  { maxLevel: 60, min: 20, max: 90 }, // 51~60렙(그 이상도): 20초 ~ 1분 30초
];
// 나올 펫이 셀수록 기본 시간에 이 배수가 곱해져요 (등급 × 레벨)
const GRADE_WAIT_MULT = { common: 1.0, uncommon: 1.1, rare: 1.25, epic: 1.5, legendary: 2.0, mythic: 2.5, divine: 3.0 };
let LEVEL_WAIT_BONUS = 0.4; // 그 장소에서 나올 수 있는 레벨 중 가장 높은 레벨이면 시간이 +40%
let MAX_WAIT_SEC = 300; // 아무리 길어도 5분까지만
// 😏 훼이크: 이 확률로 "센 펫이 나올 때처럼" 오래 기다리게 해놓고, 실제로는 원래 펫이 나와요
let FAKE_OUT_CHANCE = 0.12;
let FAKE_OUT_MIN_GAP = 1.2; // 훼이크는 원래 펫보다 이 배수 이상 센 펫의 시간으로만 만들어요

// ───────── 육성 🌱 ─────────
let NICKNAME_MAX = 12; // 별명 최대 글자 수
const RELEASE_BASE_GOLD = { common: 20, uncommon: 30, rare: 50, epic: 150, legendary: 500, mythic: 1500, divine: 5000 }; // 방생 골드 = 등급별 기본값 × (1 + 레벨 × RELEASE_LEVEL_BONUS)
let RELEASE_LEVEL_BONUS = 0.1;
let TRAIN_BASE_COST = 30; // 훈련 1회 비용 = 이 값 + 펫 레벨 × TRAIN_COST_PER_LEVEL (골드)
let TRAIN_COST_PER_LEVEL = 10;
let TRAIN_EXP_RATIO = 0.4; // 훈련 1회 경험치 = "다음 레벨까지 필요한 경험치" × 이 값
let TRAIN_LEVEL_CAP_OVER_TRAINER = 10; // 훈련으로는 펫이 트레이너 레벨 + 이 값까지만 클 수 있어요

// ───────── 체력 이어가기 ❤️ ─────────
let HP_REGEN_PCT_PER_MIN = 0.02; // 시간이 지나면 1분마다 최대 체력의 이 비율만큼 저절로 회복돼요 (0.02 = 2%, 0%에서 가득까지 약 50분)

// ───────── 출석체크 📅 ─────────
let ATTENDANCE_BALLS = 5; // 출석 1회 보상: 해정볼
let ATTENDANCE_GOLD = 750; // 출석 1회 보상: 골드
const KST_OFFSET_MS = 9 * 60 * 60 * 1000; // 출석은 한국 시간(KST) 자정에 초기화돼요

// ───────── 도감 보상 🎁 ─────────
// 한 챕터(= 장소)의 도감을 모두 채우면 보상을 한 번 받아요. 챕터는 입장 레벨이 낮은 장소부터 1, 2, 3... 번이에요.
// 1챕터 기본값 + (챕터 번호 - 1) × 챕터당 추가량
const DEX_REWARD = {
  balls: { base: 20, step: 5 }, // 해정볼
  potions: { base: 20, step: 5 }, // 회복약
  speedups: { base: 3, step: 5 }, // 탐험 시간 감소
  boosts: { base: 5, step: 10 }, // 경험치 부스트 (트레이너용 · 펫용 각각 이만큼)
};
let DEX_GOLD_MULT = 5; // 골드 = (챕터에서 가장 강한 펫을 이겼을 때 평균 골드) × 이 값

// ───────── 유저 대결 🥊 ─────────
// 대표 펫끼리 자동으로 싸워요. 결과는 어디에도 저장되지 않아서, 져도 펫은 사라지지 않고 체력도 그대로예요!
let DUEL_MAX_ROUNDS = 30; // 이 라운드 안에 안 끝나면 남은 체력 비율로 승부를 가려요
let DUEL_CHALLENGE_TTL_MS = 5 * 60 * 1000; // 대결 신청은 이 시간(5분) 안에 수락해야 해요
let DUEL_USE_FULL_HP = false; // true: 항상 최대 체력으로 싸워요 / false: 지금 체력 그대로 싸워요 (끝나면 어차피 그대로 복구)
let DUEL_LOG_MAX_CHARS = 2800; // 전투 기록이 너무 길면 앞부분을 줄여요 (디스코드 글자 수 제한)

// ───────── 펫 거래 🤝 ─────────
// 펫 ↔ 펫 1:1 교환만 가능해요 (골드·아이템 직접 전달은 없어요 → 골드 팔이·부계정 몰아주기 방지)
// 초보가 전설 펫을 덥석 받아서 게임이 망가지지 않도록, 아래 제한들을 "모두" 통과해야 거래돼요.
let TRADE_DAILY_LIMIT = 3; // 하루(한국 시간 0시 기준) 거래 성사 횟수 — 보내는 쪽·받는 쪽 둘 다 각자 세요
let TRADE_MIN_TRAINER_LEVEL = 5; // 거래하려면 트레이너 레벨이 최소 이만큼 필요해요
let TRADE_MIN_ACCOUNT_AGE_MS = 24 * 60 * 60 * 1000; // 모험을 시작한 지 최소 이 시간(24시간)이 지나야 해요 (새 계정 대량 생성 방지)
// 받는 펫의 등급별로 "받는 사람"의 트레이너 레벨이 이만큼은 돼야 해요
const TRADE_GRADE_MIN_LEVEL = { common: 5, uncommon: 10, rare: 15, epic: 25, legendary: 40, mythic: 55, divine: 70 };
let TRADE_MAX_GRADE_GAP = 1; // 서로 바꾸는 펫의 등급 차이는 이 단계까지만 (예: 희귀 ↔ 영웅 OK, 희귀 ↔ 전설 불가)
let TRADE_MAX_LEVEL_GAP = 10; // 서로 바꾸는 펫의 레벨 차이는 이만큼까지만
// 받은 펫 레벨은 (받는 사람 트레이너 레벨 + TRAIN_LEVEL_CAP_OVER_TRAINER) 이하만 가능 (훈련 상한과 같은 기준)
let TRADE_PET_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 거래로 받은 펫은 이 시간(24시간) 동안 다시 거래할 수 없어요 (돌려 막기 방지)
let TRADE_FEE_RATE = 0.5; // 수수료 = 내가 보내는 펫의 방생 골드 × 이 값 (골드가 사라지는 곳이에요)
let TRADE_FEE_MIN = 50; // 수수료 최소 금액
let TRADE_TTL_MS = 5 * 60 * 1000; // 거래 신청은 이 시간(5분) 안에 수락해야 해요

// ───────── 포획 아이템 🍖 ─────────
// 야생 펫을 만난 뒤(싸우는 중에도) 써서 이번 만남의 포획 확률을 올려요. 다음 펫을 만나면 효과가 사라져요.
// 포획 확률은 "곱셈"으로 올라서, 원래 잘 안 잡히는 펫(전설·신화·초월)은 아이템을 써도 여전히 어려워요!
let CATCH_MAX_CHANCE = 0.95; // 아이템 없이 가능한 포획 확률 상한 (95%)
let CATCH_MAX_WITH_ITEMS = 0.98; // 포획 아이템을 써도 이 값을 넘지 않아요 → 100% 확정 포획은 절대 없어요 (98%)
let CATCH_BAIT_BONUS_CAP = 1.0; // 간식·꿀 효과는 이번 만남에서 합쳐서 최대 +100% (= 최대 ×2.0)
let CATCH_NET_FLEE_REDUCE = 0.3; // 끈끈이 그물: 도망 확률 -30%p
let CATCH_NET_FLEE_MIN = 0.05; // 그물을 써도 도망 확률은 이 값 아래로 안 내려가요
let CATCH_ITEM_COSTS_TURN = true; // 전투 중에 간식·꿀·부적·그물을 쓰면 한 턴을 써요 (야생 펫이 반격!) / 분석기는 공짜

// 🎯 높은 등급일수록 포획 확률에서 "깎이는 값"(%p)이 있어요. 계산 결과가 0% 아래(음수)로 내려가면 그 던지기는 확률 0%예요!
// 음수 쪽은 -30% 까지만 내려가요 (CATCH_NEG_FLOOR). 낮은 등급은 이 값이 0이라서 예전처럼 최소 2%는 남아요.
// (고등급은 원래 포획률이 아주 낮아서, 값을 너무 크게 하면 아이템을 다 써도 영원히 못 잡아요 → 아래 값은 "풀 세팅하면 아주 낮지만 가능한" 수준이에요)
const CATCH_GRADE_PENALTY = { common: 0, uncommon: 0, rare: 0, epic: 0.03, legendary: 0.06, mythic: 0.05, divine: 0.03 };
let CATCH_NEG_FLOOR = -0.3; // 고등급 포획 확률 계산값의 하한 (-30%)
let CATCH_MIN_CHANCE = 0.02; // 낮은 등급(깎이는 값이 0인 등급)의 최소 포획 확률

// ============================================================
// 데이터: 해정펫 도감 (data/pets.js)
// ============================================================

// 해정펫 도감 📖 — 새 펫을 추가하려면 아래에 한 덩어리만 더 적으면 돼요!
// grade: common(일반) / rare(희귀) / epic(영웅) / legendary(전설)
// expYield: 이 펫을 이겼을 때 주는 기본 경험치, catchRate: 잡기 쉬운 정도(0~1, 클수록 쉬움)

const GRADES = {
  common: { name: '일반', emoji: '⚪', order: 1 },
  uncommon: { name: '고급', emoji: '🟢', order: 2 },
  rare: { name: '희귀', emoji: '🔵', order: 3 },
  epic: { name: '영웅', emoji: '🟣', order: 4 },
  legendary: { name: '전설', emoji: '🟡', order: 5 },
  mythic: { name: '신화', emoji: '🔴', order: 6 },
  divine: { name: '초월', emoji: '🌈', order: 7 },
};

const stats = (hp, atk, def, spd) => ({ hp, atk, def, spd });

const PETS = {
  // ── 스타팅 펫 (처음에만 고를 수 있어요) ──
  pyro_cat: { id: 'pyro_cat', name: '불꽃냥', emoji: '🔥', grade: 'common', starter: true, baseStats: stats(45, 12, 8, 10), expYield: 20, catchRate: 0.5 },
  aqua_pup: { id: 'aqua_pup', name: '물방울이', emoji: '💧', grade: 'common', starter: true, baseStats: stats(50, 10, 10, 8), expYield: 20, catchRate: 0.5 },
  leaf_bun: { id: 'leaf_bun', name: '풀잎이', emoji: '🍃', grade: 'common', starter: true, baseStats: stats(48, 11, 9, 9), expYield: 20, catchRate: 0.5 },

  // ── 초원 ──
  slime: { id: 'slime', name: '말랑이', emoji: '🟢', grade: 'common', baseStats: stats(30, 6, 5, 5), expYield: 8, catchRate: 0.8 },
  mouse: { id: 'mouse', name: '쪼르', emoji: '🐭', grade: 'common', baseStats: stats(25, 7, 4, 12), expYield: 10, catchRate: 0.75 },
  bee: { id: 'bee', name: '윙윙이', emoji: '🐝', grade: 'rare', baseStats: stats(28, 10, 4, 14), expYield: 16, catchRate: 0.5 },
  rabbit: { id: 'rabbit', name: '깡총이', emoji: '🐰', grade: 'common', baseStats: stats(28, 6, 4, 11), expYield: 9, catchRate: 0.75 },
  ladybug: { id: 'ladybug', name: '무당이', emoji: '🐞', grade: 'common', baseStats: stats(26, 7, 7, 6), expYield: 9, catchRate: 0.75 },
  butterfly: { id: 'butterfly', name: '나비나', emoji: '🦋', grade: 'rare', baseStats: stats(24, 9, 4, 16), expYield: 15, catchRate: 0.5 },

  // ── 숲 ──
  owl: { id: 'owl', name: '부엉이', emoji: '🦉', grade: 'uncommon', baseStats: stats(40, 11, 8, 10), expYield: 22, catchRate: 0.65 },
  fox: { id: 'fox', name: '여우비', emoji: '🦊', grade: 'rare', baseStats: stats(42, 14, 9, 15), expYield: 35, catchRate: 0.4 },
  treant: { id: 'treant', name: '나무지기', emoji: '🌳', grade: 'epic', baseStats: stats(80, 15, 20, 4), expYield: 70, catchRate: 0.2 },
  deer: { id: 'deer', name: '새벽사슴', emoji: '🦌', grade: 'common', baseStats: stats(44, 12, 9, 13), expYield: 24, catchRate: 0.6 },
  squirrel: { id: 'squirrel', name: '도토리다람', emoji: '🐿️', grade: 'common', baseStats: stats(36, 11, 7, 14), expYield: 20, catchRate: 0.65 },
  mushroom: { id: 'mushroom', name: '버섯돌이', emoji: '🍄', grade: 'rare', baseStats: stats(50, 13, 12, 6), expYield: 38, catchRate: 0.4 },
  wolf: { id: 'wolf', name: '그림자늑대', emoji: '🐺', grade: 'epic', baseStats: stats(75, 22, 12, 18), expYield: 75, catchRate: 0.2 },

  // ── 동굴 ──
  bat: { id: 'bat', name: '박쥐돌', emoji: '🦇', grade: 'uncommon', baseStats: stats(45, 14, 10, 16), expYield: 45, catchRate: 0.6 },
  golem: { id: 'golem', name: '바위거인', emoji: '🪨', grade: 'epic', baseStats: stats(110, 20, 30, 3), expYield: 120, catchRate: 0.15 },
  spider: { id: 'spider', name: '거미줄이', emoji: '🕷️', grade: 'common', baseStats: stats(50, 15, 11, 12), expYield: 48, catchRate: 0.6 },
  scorpion: { id: 'scorpion', name: '전갈왕', emoji: '🦂', grade: 'rare', baseStats: stats(65, 19, 18, 10), expYield: 70, catchRate: 0.4 },
  crystal: { id: 'crystal', name: '수정정령', emoji: '💎', grade: 'epic', baseStats: stats(90, 22, 24, 9), expYield: 130, catchRate: 0.15 },

  // ── 바다 ──
  crab: { id: 'crab', name: '집게', emoji: '🦀', grade: 'rare', baseStats: stats(60, 18, 25, 6), expYield: 90, catchRate: 0.45 },
  shark: { id: 'shark', name: '상어왕', emoji: '🦈', grade: 'epic', baseStats: stats(100, 30, 15, 20), expYield: 200, catchRate: 0.15 },
  pufferfish: { id: 'pufferfish', name: '뾰족복어', emoji: '🐡', grade: 'common', baseStats: stats(50, 17, 12, 14), expYield: 70, catchRate: 0.55 },
  octopus: { id: 'octopus', name: '문어박사', emoji: '🐙', grade: 'rare', baseStats: stats(75, 22, 18, 15), expYield: 110, catchRate: 0.4 },
  whale: { id: 'whale', name: '푸른고래', emoji: '🐋', grade: 'legendary', baseStats: stats(180, 34, 28, 10), expYield: 400, catchRate: 0.06 },

  // ── 화산 ──
  baby_dragon: { id: 'baby_dragon', name: '아기용', emoji: '🐲', grade: 'epic', baseStats: stats(120, 35, 25, 14), expYield: 300, catchRate: 0.12 },
  phoenix: { id: 'phoenix', name: '불사조', emoji: '🦅', grade: 'legendary', baseStats: stats(150, 45, 30, 25), expYield: 600, catchRate: 0.05 },
  magma_slime: { id: 'magma_slime', name: '마그마말랑', emoji: '🟠', grade: 'rare', baseStats: stats(110, 32, 22, 10), expYield: 220, catchRate: 0.4 },
  salamander: { id: 'salamander', name: '불도마뱀', emoji: '🦎', grade: 'rare', baseStats: stats(100, 34, 20, 18), expYield: 240, catchRate: 0.35 },
  flame_lord: { id: 'flame_lord', name: '화염마왕', emoji: '👹', grade: 'legendary', baseStats: stats(170, 48, 32, 22), expYield: 650, catchRate: 0.04 },
  // ── 새 친구들: 기존 장소 ──
  clover_fairy: { id: 'clover_fairy', name: '네잎요정', emoji: '🧚', grade: 'uncommon', baseStats: stats(30, 8, 6, 13), expYield: 18, catchRate: 0.6 },
  boar: { id: 'boar', name: '멧돼지', emoji: '🐗', grade: 'uncommon', baseStats: stats(60, 16, 12, 8), expYield: 47, catchRate: 0.55 },
  unicorn: { id: 'unicorn', name: '숲의 유니콘', emoji: '🦄', grade: 'legendary', baseStats: stats(110, 28, 20, 22), expYield: 200, catchRate: 0.06 },
  skeleton: { id: 'skeleton', name: '해골전사', emoji: '💀', grade: 'uncommon', baseStats: stats(60, 17, 14, 9), expYield: 73, catchRate: 0.5 },
  ghost: { id: 'ghost', name: '떠도는 유령', emoji: '👻', grade: 'rare', baseStats: stats(55, 18, 6, 20), expYield: 104, catchRate: 0.35 },
  turtle: { id: 'turtle', name: '바다거북', emoji: '🐢', grade: 'uncommon', baseStats: stats(80, 16, 28, 5), expYield: 144, catchRate: 0.5 },
  mermaid: { id: 'mermaid', name: '인어', emoji: '🧜', grade: 'epic', baseStats: stats(95, 26, 20, 24), expYield: 308, catchRate: 0.12 },
  fire_dragon: { id: 'fire_dragon', name: '불의 용왕', emoji: '🐉', grade: 'mythic', baseStats: stats(200, 52, 36, 24), expYield: 1037, catchRate: 0.03 },

  // ── 안개 늪 ──
  frog: { id: 'frog', name: '개굴이', emoji: '🐸', grade: 'common', baseStats: stats(55, 14, 10, 10), expYield: 63, catchRate: 0.6 },
  snake: { id: 'snake', name: '독뱀', emoji: '🐍', grade: 'uncommon', baseStats: stats(62, 19, 11, 14), expYield: 89, catchRate: 0.5 },
  croc: { id: 'croc', name: '늪악어', emoji: '🐊', grade: 'rare', baseStats: stats(95, 24, 22, 6), expYield: 127, catchRate: 0.35 },
  wisp: { id: 'wisp', name: '도깨비불', emoji: '🕯️', grade: 'epic', baseStats: stats(80, 26, 12, 26), expYield: 190, catchRate: 0.15 },
  witch: { id: 'witch', name: '늪의 마녀', emoji: '🧙', grade: 'legendary', baseStats: stats(130, 36, 24, 20), expYield: 380, catchRate: 0.05 },

  // ── 불볕 사막 ──
  camel: { id: 'camel', name: '낙타돌이', emoji: '🐪', grade: 'common', baseStats: stats(85, 22, 18, 8), expYield: 87, catchRate: 0.55 },
  cactus: { id: 'cactus', name: '선인장이', emoji: '🌵', grade: 'uncommon', baseStats: stats(90, 24, 22, 5), expYield: 122, catchRate: 0.5 },
  scarab: { id: 'scarab', name: '황금풍뎅이', emoji: '🪲', grade: 'rare', baseStats: stats(80, 28, 30, 12), expYield: 174, catchRate: 0.35 },
  lion: { id: 'lion', name: '사막사자', emoji: '🦁', grade: 'epic', baseStats: stats(130, 38, 26, 22), expYield: 261, catchRate: 0.15 },
  mummy: { id: 'mummy', name: '파라오 미라', emoji: '⚰️', grade: 'legendary', baseStats: stats(170, 44, 36, 14), expYield: 522, catchRate: 0.05 },
  sandworm: { id: 'sandworm', name: '모래벌레', emoji: '🐛', grade: 'mythic', baseStats: stats(260, 56, 40, 10), expYield: 870, catchRate: 0.03 },

  // ── 얼음 설원 ──
  penguin: { id: 'penguin', name: '뒤뚱이', emoji: '🐧', grade: 'common', baseStats: stats(110, 28, 22, 12), expYield: 94, catchRate: 0.55 },
  bear: { id: 'bear', name: '흰곰', emoji: '🐻', grade: 'uncommon', baseStats: stats(140, 34, 28, 10), expYield: 132, catchRate: 0.45 },
  yeti: { id: 'yeti', name: '설인', emoji: '🦍', grade: 'rare', baseStats: stats(150, 38, 30, 14), expYield: 188, catchRate: 0.3 },
  ice_spirit: { id: 'ice_spirit', name: '얼음정령', emoji: '🧊', grade: 'epic', baseStats: stats(160, 44, 36, 16), expYield: 283, catchRate: 0.12 },
  frost_dragon: { id: 'frost_dragon', name: '서리용', emoji: '❄️', grade: 'legendary', baseStats: stats(230, 56, 38, 26), expYield: 566, catchRate: 0.04 },
  ice_queen: { id: 'ice_queen', name: '눈의 여왕', emoji: '👸', grade: 'mythic', baseStats: stats(300, 64, 44, 30), expYield: 943, catchRate: 0.02 },

  // ── 구름 하늘섬 ──
  cloud_sheep: { id: 'cloud_sheep', name: '구름양', emoji: '🐑', grade: 'common', baseStats: stats(140, 30, 26, 16), expYield: 109, catchRate: 0.5 },
  parrot: { id: 'parrot', name: '바람앵무', emoji: '🦜', grade: 'uncommon', baseStats: stats(150, 36, 28, 24), expYield: 153, catchRate: 0.45 },
  thunder_bird: { id: 'thunder_bird', name: '번개새', emoji: '⚡', grade: 'rare', baseStats: stats(170, 46, 32, 30), expYield: 219, catchRate: 0.3 },
  pegasus: { id: 'pegasus', name: '천마', emoji: '🐴', grade: 'epic', baseStats: stats(210, 52, 38, 34), expYield: 328, catchRate: 0.12 },
  wyvern: { id: 'wyvern', name: '하늘와이번', emoji: '🦖', grade: 'legendary', baseStats: stats(280, 62, 44, 30), expYield: 656, catchRate: 0.04 },
  angel: { id: 'angel', name: '대천사', emoji: '👼', grade: 'mythic', baseStats: stats(340, 70, 50, 38), expYield: 1093, catchRate: 0.02 },
  sun_god: { id: 'sun_god', name: '태양신', emoji: '☀️', grade: 'divine', baseStats: stats(420, 82, 58, 40), expYield: 1748, catchRate: 0.01 },

  // ── 별빛 심연 ──
  shadow: { id: 'shadow', name: '그림자', emoji: '👤', grade: 'common', baseStats: stats(180, 38, 32, 20), expYield: 97, catchRate: 0.45 },
  void_eye: { id: 'void_eye', name: '허공의 눈', emoji: '👁️', grade: 'uncommon', baseStats: stats(200, 44, 36, 22), expYield: 136, catchRate: 0.4 },
  star_whale: { id: 'star_whale', name: '별고래', emoji: '🐳', grade: 'rare', baseStats: stats(260, 52, 42, 18), expYield: 195, catchRate: 0.28 },
  comet: { id: 'comet', name: '혜성정령', emoji: '☄️', grade: 'epic', baseStats: stats(280, 60, 44, 36), expYield: 292, catchRate: 0.1 },
  void_dragon: { id: 'void_dragon', name: '공허용', emoji: '🌑', grade: 'legendary', baseStats: stats(360, 72, 52, 32), expYield: 584, catchRate: 0.035 },
  chaos_lord: { id: 'chaos_lord', name: '혼돈군주', emoji: '😈', grade: 'mythic', baseStats: stats(440, 84, 60, 40), expYield: 973, catchRate: 0.02 },
  creator: { id: 'creator', name: '태초의 별', emoji: '🌌', grade: 'divine', baseStats: stats(600, 100, 70, 45), expYield: 1556, catchRate: 0.008 },
};

const STARTER_IDS = Object.values(PETS).filter((p) => p.starter).map((p) => p.id);

// ============================================================
// 데이터: 아이템 (data/items.js)
// ============================================================

// 아이템 목록 🎒 (이름은 나중에 전체 갈아엎기로 했으니 여기만 고치면 돼요!)
// heal: 회복약이에요. 펫 체력을 이만큼 채워줘요 (9999 = 사실상 전부)
const ITEMS = {
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
  // 🚀 1회용 부스트: /사용 으로 켜두면, 경험치를 얻을 때마다 1회씩 소모되며 +30% 가 붙어요
  exp_boost_trainer: {
    id: 'exp_boost_trainer',
    name: '트레이너 경험치 부스트',
    emoji: '🌟',
    price: 1500,
    boost: 'trainerExp',
    description: '/사용 으로 켜면 전투 승리·포획 시 트레이너 경험치 +30% (1개 = 1회).',
  },
  exp_boost_pet: {
    id: 'exp_boost_pet',
    name: '펫 경험치 부스트',
    emoji: '💫',
    price: 1500,
    boost: 'petExp',
    description: '/사용 으로 켜면 전투 승리 시 대표 펫 경험치 +30% (1개 = 1회).',
  },
  // ⏩ 탐험 중 야생 펫을 기다리는 시간을 줄여요
  explore_speedup: {
    id: 'explore_speedup',
    name: '탐험 시간 감소',
    emoji: '⏩',
    price: 750,
    speedup: true,
    description: '탐험 대기 시간을 즉시 0으로 만들어 바로 야생 펫이 나타나게 해요 (1개 = 1번).',
  },

  // 🎫 스킬 아이템: /사용 의 "대상" 칸에 펫을 골라서 써요
  skill_slot_ticket: {
    id: 'skill_slot_ticket',
    name: '스킬 슬롯 개방권',
    emoji: '🎫',
    price: 2500,
    skillSlot: true,
    description: '고른 펫의 5번째(마지막) 스킬 슬롯을 열고, 랜덤 스킬 하나를 바로 배워요 (1개 = 펫 1마리). `/사용` · `/펫` · `/내정보` 에서 쓸 수 있어요.',
  },
  skill_reroll_ticket: {
    id: 'skill_reroll_ticket',
    name: '스킬 변경권',
    emoji: '🔄',
    price: 600,
    skillReroll: true,
    description: '고른 펫의 스킬 슬롯 하나(1~5번, `/사용` 의 "슬롯" 칸)를 다른 랜덤 스킬로 다시 뽑아요. 전용기도 다시 나올 수 있어요.',
  },

  // 🍖 포획 아이템: 야생 펫을 만난 뒤 써요 (전투 중엔 전투 화면 아이템 버튼). 포획 확률은 곱셈으로 올라가고, 최대 98%예요.
  catch_scanner: {
    id: 'catch_scanner',
    name: '포획 분석기',
    short: '분석기',
    emoji: '🔬',
    price: 150,
    catchItem: 'scanner',
    description: '야생 펫의 포획 확률과 난이도를 알려줘요 (이번 만남 동안 계속 표시). 턴을 안 써요.',
  },
  catch_snack: {
    id: 'catch_snack',
    name: '맛있는 간식',
    short: '간식',
    emoji: '🍖',
    price: 200,
    catchItem: 'bait',
    catchBonus: 0.2,
    description: '이번 만남의 포획 확률 ×1.2 (+20%). 중첩돼요 (최대 ×2). 전투 중엔 한 턴을 써요.',
  },
  catch_honey: {
    id: 'catch_honey',
    name: '황금 꿀',
    short: '꿀',
    emoji: '🍯',
    price: 500,
    catchItem: 'bait',
    catchBonus: 0.5,
    description: '이번 만남의 포획 확률 ×1.5 (+50%). 중첩돼요 (최대 ×2). 전투 중엔 한 턴을 써요.',
  },
  catch_charm: {
    id: 'catch_charm',
    name: '행운의 부적',
    short: '부적',
    emoji: '🍀',
    price: 400,
    catchItem: 'charm',
    catchBonus: 1.0,
    description: '다음 던지기 1번의 포획 확률 +100% (×2). 던지면 사라져요. 전투 중엔 한 턴을 써요.',
  },
  catch_net: {
    id: 'catch_net',
    name: '끈끈이 그물',
    short: '그물',
    emoji: '🕸️',
    price: 350,
    catchItem: 'net',
    description: '이번 만남 동안 해정볼이 빠져나왔을 때 도망 확률 -30%p. 전투 중엔 한 턴을 써요.',
  },
};

// ============================================================
// 데이터: 장소 (data/locations.js)
// ============================================================

// 장소 목록 🗺️ — 레벨이 높아야 갈 수 있는 곳일수록 강하고 경험치가 많은 펫이 나와요!
// weight: 나올 확률의 "무게" (클수록 자주 나와요), lv: [최소, 최대] 펫 레벨
// (기다리는 시간은 장소가 아니라 "내 트레이너 레벨"과 "나올 펫의 세기"로 정해져요 → 설정값의 '탐험 대기 시간' 참고)

const LOCATIONS = {
  meadow: {
    id: 'meadow', name: '초록 초원', emoji: '🌾', minLevel: 1, expMultiplier: 1.0,
    description: '바람이 솔솔 부는 평화로운 들판이에요.',
    spawns: [
      { petId: 'slime', weight: 40, lv: [1, 4] },
      { petId: 'mouse', weight: 35, lv: [1, 5] },
      { petId: 'rabbit', weight: 30, lv: [1, 5] },
      { petId: 'ladybug', weight: 25, lv: [2, 5] },
      { petId: 'bee', weight: 10, lv: [3, 6] },
      { petId: 'butterfly', weight: 8, lv: [3, 7] },
      { petId: 'clover_fairy', weight: 12, lv: [2, 6] },
    ],
  },
  forest: {
    id: 'forest', name: '속삭이는 숲', emoji: '🌲', minLevel: 5, expMultiplier: 1.5,
    description: '나뭇잎 사이로 무언가 지나가는 소리가 나요.',
    spawns: [
      { petId: 'owl', weight: 40, lv: [5, 10] },
      { petId: 'deer', weight: 35, lv: [5, 10] },
      { petId: 'squirrel', weight: 35, lv: [5, 9] },
      { petId: 'fox', weight: 25, lv: [6, 11] },
      { petId: 'mushroom', weight: 20, lv: [6, 11] },
      { petId: 'treant', weight: 12, lv: [8, 12] },
      { petId: 'wolf', weight: 8, lv: [9, 13] },
      { petId: 'boar', weight: 20, lv: [6, 11] },
      { petId: 'unicorn', weight: 2, lv: [12, 16] },
    ],
  },
  cave: {
    id: 'cave', name: '어두운 동굴', emoji: '🕳️', minLevel: 10, expMultiplier: 2.0,
    description: '깜깜해서 잘 안 보이지만 반짝이는 눈이 보여요.',
    spawns: [
      { petId: 'bat', weight: 60, lv: [10, 16] },
      { petId: 'spider', weight: 45, lv: [10, 16] },
      { petId: 'golem', weight: 25, lv: [13, 18] },
      { petId: 'scorpion', weight: 25, lv: [12, 17] },
      { petId: 'crystal', weight: 12, lv: [14, 19] },
      { petId: 'skeleton', weight: 25, lv: [11, 17] },
      { petId: 'ghost', weight: 15, lv: [12, 18] },
    ],
  },
  ocean: {
    id: 'ocean', name: '푸른 바다', emoji: '🌊', minLevel: 20, expMultiplier: 3.0,
    description: '파도 아래에 커다란 그림자가 보여요.',
    spawns: [
      { petId: 'pufferfish', weight: 45, lv: [20, 27] },
      { petId: 'crab', weight: 45, lv: [20, 28] },
      { petId: 'octopus', weight: 30, lv: [22, 30] },
      { petId: 'shark', weight: 22, lv: [24, 32] },
      { petId: 'whale', weight: 6, lv: [28, 35] },
      { petId: 'turtle', weight: 30, lv: [21, 28] },
      { petId: 'mermaid', weight: 10, lv: [25, 32] },
    ],
  },
  volcano: {
    id: 'volcano', name: '불타는 화산', emoji: '🌋', minLevel: 30, expMultiplier: 5.0,
    description: '뜨거운 열기 속에서 전설의 울음소리가 들려요.',
    spawns: [
      { petId: 'magma_slime', weight: 40, lv: [30, 38] },
      { petId: 'salamander', weight: 35, lv: [30, 40] },
      { petId: 'baby_dragon', weight: 55, lv: [30, 40] },
      { petId: 'phoenix', weight: 12, lv: [35, 45] },
      { petId: 'flame_lord', weight: 8, lv: [38, 48] },
      { petId: 'fire_dragon', weight: 3, lv: [40, 50] },
    ],
  },
  swamp: {
    id: 'swamp', name: '안개 늪', emoji: '🐸', minLevel: 15, expMultiplier: 2.5,
    description: '짙은 안개 속에서 첨벙첨벙 소리가 나요.',
    spawns: [
      { petId: 'frog', weight: 40, lv: [14, 19] },
      { petId: 'snake', weight: 30, lv: [15, 20] },
      { petId: 'croc', weight: 20, lv: [16, 22] },
      { petId: 'wisp', weight: 10, lv: [18, 24] },
      { petId: 'witch', weight: 3, lv: [22, 28] },
    ],
  },
  desert: {
    id: 'desert', name: '불볕 사막', emoji: '🏜️', minLevel: 25, expMultiplier: 4.0,
    description: '뜨거운 모래바람 너머로 커다란 그림자가 보여요.',
    spawns: [
      { petId: 'camel', weight: 35, lv: [24, 30] },
      { petId: 'cactus', weight: 30, lv: [25, 31] },
      { petId: 'scarab', weight: 22, lv: [26, 32] },
      { petId: 'lion', weight: 10, lv: [28, 35] },
      { petId: 'mummy', weight: 4, lv: [32, 38] },
      { petId: 'sandworm', weight: 2, lv: [36, 42] },
    ],
  },
  glacier: {
    id: 'glacier', name: '얼음 설원', emoji: '🧊', minLevel: 35, expMultiplier: 6.5,
    description: '숨을 쉴 때마다 하얀 김이 나오는 꽁꽁 언 땅이에요.',
    spawns: [
      { petId: 'penguin', weight: 35, lv: [34, 40] },
      { petId: 'bear', weight: 28, lv: [35, 42] },
      { petId: 'yeti', weight: 22, lv: [36, 44] },
      { petId: 'ice_spirit', weight: 10, lv: [38, 46] },
      { petId: 'frost_dragon', weight: 4, lv: [42, 50] },
      { petId: 'ice_queen', weight: 2, lv: [46, 54] },
    ],
  },
  sky: {
    id: 'sky', name: '구름 하늘섬', emoji: '☁️', minLevel: 45, expMultiplier: 8.0,
    description: '구름 위에 떠 있는 섬에서 천둥소리가 울려요.',
    spawns: [
      { petId: 'cloud_sheep', weight: 30, lv: [44, 50] },
      { petId: 'parrot', weight: 28, lv: [45, 51] },
      { petId: 'thunder_bird', weight: 22, lv: [46, 54] },
      { petId: 'pegasus', weight: 12, lv: [48, 56] },
      { petId: 'wyvern', weight: 5, lv: [50, 58] },
      { petId: 'angel', weight: 2, lv: [54, 62] },
      { petId: 'sun_god', weight: 0.5, lv: [58, 66] },
    ],
  },
  abyss: {
    id: 'abyss', name: '별빛 심연', emoji: '🌌', minLevel: 55, expMultiplier: 12.0,
    description: '별이 반짝이는 끝없는 어둠 속이에요. 아무도 돌아온 적이 없대요.',
    spawns: [
      { petId: 'shadow', weight: 30, lv: [54, 60] },
      { petId: 'void_eye', weight: 28, lv: [55, 61] },
      { petId: 'star_whale', weight: 22, lv: [56, 64] },
      { petId: 'comet', weight: 12, lv: [58, 66] },
      { petId: 'void_dragon', weight: 6, lv: [60, 68] },
      { petId: 'chaos_lord', weight: 3, lv: [62, 70] },
      { petId: 'creator', weight: 1, lv: [66, 75] },
    ],
  },
};

const LOCATION_LIST = Object.values(LOCATIONS).sort((a, b) => a.minLevel - b.minLevel);

// ============================================================
// 도구: 주사위 (utils/random.js)
// ============================================================

// 주사위 굴리기 🎲 (rng 자리에 가짜 주사위를 넣으면 테스트할 수 있어요)
const randInt = (min, max, rng = Math.random) => Math.floor(rng() * (max - min + 1)) + min;

// 무게(weight)가 큰 것이 더 자주 뽑혀요
function weightedPick(items, getWeight, rng = Math.random) {
  const total = items.reduce((sum, item) => sum + getWeight(item), 0);
  let r = rng() * total;
  for (const item of items) {
    r -= getWeight(item);
    if (r < 0) return item;
  }
  return items[items.length - 1];
}

// ============================================================
// 도구: 디스코드 응답 (utils/discord.js)
// ============================================================

// 디스코드에게 대답할 때 쓰는 도구 모음 💬
const InteractionType = { PING: 1, COMMAND: 2, COMPONENT: 3, AUTOCOMPLETE: 4, MODAL_SUBMIT: 5 };
const ResponseType = { PONG: 1, MESSAGE: 4, UPDATE: 7, AUTOCOMPLETE_RESULT: 8, MODAL: 9 };
const EPHEMERAL = 64; // "나한테만 보이는 메시지" 표시
const SILENT = 4096; // "알림 없이 조용히 보내기" 표시 (디스코드 알림/푸시가 안 가요)

function reply(data, { ephemeral = false } = {}) {
  const flags = SILENT | (ephemeral ? EPHEMERAL : 0);
  return {
    type: ResponseType.MESSAGE,
    data: { ...data, flags },
  };
}

// 버튼을 누른 그 메시지를 새 내용으로 바꿔요
function update(data) {
  return { type: ResponseType.UPDATE, data };
}

// 입력하는 중에 실시간으로 "미리 표시" 선택지를 보여줘요 (주식봇의 자동완성 미리보기와 같은 방식)
function autocompleteResult(choices) {
  return { type: ResponseType.AUTOCOMPLETE_RESULT, data: { choices: choices.slice(0, 25) } };
}

// 버튼 응답과 별개로 채널에 "새 메시지"를 하나 더 보내요.
// 채팅이 올라와서 탐험 패널이 위로 묻혔을 때, 패널을 맨 아래로 다시 띄우는 용도예요.
async function postChannelMessage(channelId, data) {
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
      body: JSON.stringify({ ...data, flags: SILENT }),
      signal: AbortSignal.timeout(2500), // ⚡ 디스코드가 느려도 3초 제한에 걸리지 않게 2.5초에서 포기해요
    });
    if (!res.ok) {
      // 403 = 봇이 그 채널을 못 보거나 메시지 보내기 권한이 없어요
      console.error('새 메시지 보내기 실패:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (error) {
    // 네트워크 오류 등으로 fetch 자체가 실패해도 여기서 막아서, 인터랙션 응답까지 통째로 날아가지 않게 해요
    console.error('새 메시지 보내기 실패(네트워크):', error);
    return false;
  }
}

// 숫자 한 칸짜리 입력창을 띄워요 (버튼을 누르면 뜨고, 제출하면 customId 로 다시 들어와요)
function numberModal({ customId, title, label, placeholder, maxLength = 3 }) {
  return {
    type: ResponseType.MODAL,
    data: {
      custom_id: customId,
      title,
      components: [
        { type: 1, components: [{ type: 4, custom_id: 'n', label, style: 1, min_length: 1, max_length: maxLength, required: true, placeholder }] },
      ],
    },
  };
}

function getModalValue(interaction, id) {
  for (const r of interaction.data.components ?? []) {
    for (const c of r.components ?? []) if (c.custom_id === id) return c.value;
  }
  return undefined;
}

function getUser(interaction) {
  return interaction.member?.user ?? interaction.user;
}

function getOption(interaction, name) {
  return interaction.data.options?.find((o) => o.name === name)?.value;
}

function button({ label, customId, style = 1, emoji, disabled = false }) {
  const b = { type: 2, style, label, custom_id: customId, disabled };
  if (emoji) b.emoji = { name: emoji };
  return b;
}

function row(...components) {
  return { type: 1, components };
}

// 드롭다운(선택 메뉴). options: [{ label, value, description?, emoji?, default? }] (최대 25개)
// 사용자가 고른 값은 interaction.data.values 로 들어와요.
function select({ customId, placeholder, options }) {
  return {
    type: 3,
    custom_id: customId,
    placeholder,
    options: options.map((o) => {
      const opt = { label: o.label, value: o.value, default: o.default === true };
      if (o.description) opt.description = o.description;
      if (o.emoji) opt.emoji = { name: o.emoji };
      return opt;
    }),
  };
}

// ============================================================
// 데이터베이스 (db.js)
// ============================================================

// 데이터를 저장하고 꺼내오는 곳이에요 🗄️ (Firebase Firestore)
// DB_MODE=memory 로 켜면 연습용 임시 저장소를 써요 (테스트 전용, 껐다 켜면 사라져요!)

const memoryStore = new Map();
const useMemory = () => process.env.DB_MODE === 'memory';

let firestore;
function getDb() {
  if (firestore) return firestore;
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT 환경변수가 없어요!');
  }
  if (getApps().length === 0) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  firestore = getFirestore();
  firestore.settings({ ignoreUndefinedProperties: true });
  return firestore;
}

const players = () => getDb().collection('players');

// ⚡ 자동완성(타자 칠 때마다 호출)용 짧은 읽기 캐시 — 글자 하나마다 DB 를 읽지 않게 해요.
// 저장(updatePlayer/savePlayer)이 일어나면 바로 비워서 오래된 값이 보이지 않아요.
const playerCache = new Map(); // userId -> { at, data }
const PLAYER_CACHE_MS = 4000;

async function getPlayerCached(userId) {
  const hit = playerCache.get(userId);
  if (hit && Date.now() - hit.at < PLAYER_CACHE_MS) return structuredClone(hit.data);
  const data = await getPlayer(userId);
  if (data) {
    if (playerCache.size > 500) playerCache.clear();
    playerCache.set(userId, { at: Date.now(), data: structuredClone(data) });
  }
  return data;
}

// ⚡ 같은 유저의 쓰기를 한 줄로 세워요 — 버튼을 빠르게 연타해도 DB 트랜잭션끼리 부딪혀 재시도하느라 느려지는 일이 줄어요.
const userLocks = new Map();
function withUserLock(userId, fn) {
  const prev = userLocks.get(userId) ?? Promise.resolve();
  const next = prev.catch(() => {}).then(fn);
  const tail = next.catch(() => {});
  userLocks.set(userId, tail);
  tail.then(() => {
    if (userLocks.get(userId) === tail) userLocks.delete(userId);
  });
  return next;
}

async function getPlayer(userId) {
  if (useMemory()) {
    const found = memoryStore.get(userId);
    return found ? structuredClone(found) : null;
  }
  const snap = await players().doc(userId).get();
  return snap.exists ? snap.data() : null;
}

// 새 플레이어 만들기. 이미 있으면 false (두 번 눌러도 안전해요!)
async function createPlayer(userId, data) {
  if (useMemory()) {
    if (memoryStore.has(userId)) return false;
    memoryStore.set(userId, structuredClone(data));
    return true;
  }
  try {
    await players().doc(userId).create(data);
    return true;
  } catch (error) {
    if (error.code === 6) return false; // ALREADY_EXISTS
    throw error;
  }
}

async function savePlayer(userId, data) {
  playerCache.delete(userId);
  if (useMemory()) {
    memoryStore.set(userId, structuredClone(data));
    return;
  }
  await players().doc(userId).set(data);
}

// 플레이어를 읽고 → 고치고 → 저장을 "한 덩어리"로 처리해요.
// 두 번 빠르게 눌러도 해정볼이 두 번 줄어드는 일이 없어요.
// mutate(player) 는 { commit: true/false, value: 돌려줄값 } 을 돌려줘야 해요.
// (주의: mutate 안에서는 player만 고치고, 다른 일은 하지 마세요)
function updatePlayer(userId, rawMutate) {
  return withUserLock(userId, async () => {
    try {
      return await updatePlayerNow(userId, rawMutate);
    } finally {
      playerCache.delete(userId);
    }
  });
}

async function updatePlayerNow(userId, rawMutate) {
  // 🏃 자리 비운 사이 자동사냥이 한 일을 먼저 정산하고, 원래 하려던 일을 이어서 해요
  const mutate = (player) => {
    const settled = settleAutoHunt(player);
    const out = rawMutate(player);
    if (settled && out && !out.commit) out.commit = true;
    return out;
  };
  if (useMemory()) {
    const found = memoryStore.get(userId);
    if (!found) return null;
    const copy = structuredClone(found);
    const out = mutate(copy);
    if (out.commit) memoryStore.set(userId, copy);
    return out.value;
  }
  const ref = players().doc(userId);
  return getDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const player = snap.data();
    const out = mutate(player);
    if (out.commit) tx.set(ref, player);
    return out.value;
  });
}

// 두 플레이어를 "한 덩어리"로 읽고 → 고치고 → 저장해요 (거래용).
// 둘 중 하나라도 실패하면 둘 다 저장되지 않아서, 펫이 복제되거나 사라지는 일이 없어요.
// mutate(playerA, playerB) 는 { commit: true/false, value: 돌려줄값 } 을 돌려줘야 해요.
async function updatePlayerPair(idA, idB, mutate) {
  if (useMemory()) {
    const fa = memoryStore.get(idA);
    const fb = memoryStore.get(idB);
    if (!fa || !fb) return null;
    const ca = structuredClone(fa);
    const cb = structuredClone(fb);
    const out = mutate(ca, cb);
    if (out.commit) {
      memoryStore.set(idA, ca);
      memoryStore.set(idB, cb);
    }
    return out.value;
  }
  const refA = players().doc(idA);
  const refB = players().doc(idB);
  playerCache.delete(idA);
  playerCache.delete(idB);
  return getDb().runTransaction(async (tx) => {
    const [sa, sb] = await tx.getAll(refA, refB);
    if (!sa.exists || !sb.exists) return null;
    const a = sa.data();
    const b = sb.data();
    const out = mutate(a, b);
    if (out.commit) {
      tx.set(refA, a);
      tx.set(refB, b);
    }
    return out.value;
  });
}

// 관리자: 유저 데이터 직접 편집 (관리자 웹페이지의 "유저 관리" 탭에서 써요)
// 덮어쓰기 전 값을 1단계만 백업해서 "이전 저장으로 되돌리기"가 가능해요.
const playerBackups = () => getDb().collection('player_backups');

async function getPlayerBackup(userId) {
  if (useMemory()) return memoryStore.get(`__backup:${userId}`) ?? null;
  const snap = await playerBackups().doc(userId).get();
  return snap.exists ? snap.data().data : null;
}

async function adminSavePlayer(userId, data) {
  const before = await getPlayer(userId);
  if (!before) return { ok: false, error: '그런 유저가 없어요' };
  if (useMemory()) memoryStore.set(`__backup:${userId}`, structuredClone(before));
  else await playerBackups().doc(userId).set({ data: before, savedAt: Date.now() });
  await savePlayer(userId, data);
  return { ok: true };
}

async function adminRevertPlayer(userId) {
  const backup = await getPlayerBackup(userId);
  if (!backup) return { ok: false, error: '되돌릴 이전 저장이 없어요' };
  await savePlayer(userId, backup);
  if (useMemory()) memoryStore.delete(`__backup:${userId}`);
  else await playerBackups().doc(userId).delete();
  return { ok: true, data: backup };
}

// ============================================================
// 시스템: 레벨 (systems/level.js)
// ============================================================

// 레벨 시스템 ⭐ — 트레이너(플레이어)와 해정펫이 똑같은 규칙을 써요!

// 다음 레벨까지 필요한 경험치 (레벨이 높을수록 많이 필요해요)
function expToNext(level) {
  return Math.floor(10 * Math.pow(level, 1.6)) + 20;
}

// 경험치를 얻고, 레벨업이 있으면 처리해요. target = { level, exp } 를 직접 바꿔요.
function addExp(target, amount) {
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
  // 펫(스킬 슬롯이 있는 대상)이면 레벨이 오른 만큼 열린 슬롯에 스킬을 채워요
  if (Array.isArray(target.skills)) grantSkills(target);

  return { gained: gain, levelsGained: target.level - startLevel, level: target.level };
}

// 경험치 막대기 ▰▰▰▱▱▱
function expBar(exp, need, size = 10) {
  const filled = Math.max(0, Math.min(size, Math.floor((exp / need) * size)));
  return '▰'.repeat(filled) + '▱'.repeat(size - filled);
}

// ============================================================
// 시스템: 펫 계산 (systems/pet.js)
// ============================================================

// 해정펫 계산 도우미 🐾

// 레벨에 따른 능력치 (레벨이 오르면 쑥쑥 강해져요)
function calcStats(petId, level) {
  const b = PETS[petId].baseStats;
  return {
    hp: b.hp + level * 6,
    atk: b.atk + level * 2,
    def: b.def + level * 2,
    spd: b.spd + level,
  };
}

// 내가 가진 펫 한 마리의 "정보 카드" 만들기
function createPetInstance(petId, level = 1) {
  if (!PETS[petId]) throw new Error(`없는 펫이에요: ${petId}`);
  const inst = {
    uid: randomUUID(),
    petId,
    level,
    exp: 0,
    nickname: null,
    caughtAt: Date.now(),
    skills: Array(SLOT_COUNT).fill(null), // 스킬 슬롯 5칸 (1~4번은 레벨 Lv.20/40/100/200, 5번은 상점 개방권)
  };
  grantSkills(inst); // 이미 열려 있는 슬롯이 있으면 바로 채워요
  return inst;
}

// 예전에 만들어진 펫에 스킬 슬롯이 없으면 붙여줘요 (호환용)
function ensureSkills(inst) {
  grantSkills(inst); // 옛 3칸 펫은 여기서 5칸으로 옮겨져요
  return inst;
}

function petLabel(petInstanceOrId) {
  const id = typeof petInstanceOrId === 'string' ? petInstanceOrId : petInstanceOrId.petId;
  const pet = PETS[id];
  return `${GRADES[pet.grade].emoji} ${pet.emoji} ${pet.name}`;
}

// ───────── 체력 ❤️ ─────────
// 펫 정보 카드에 hp(저장된 체력)와 hpAt(저장한 시각)이 없으면 "가득 찬 상태"예요.
// 시간이 지나면 1분마다 최대 체력의 일부씩 저절로 차올라요.
const maxHp = (inst) => calcStats(inst.petId, inst.level).hp;

function currentHp(inst, now = Date.now()) {
  const max = maxHp(inst);
  if (typeof inst.hp !== 'number') return max;
  const mins = Math.max(0, (now - (inst.hpAt ?? now)) / 60000);
  return Math.min(max, Math.max(0, Math.floor(inst.hp + max * HP_REGEN_PCT_PER_MIN * mins)));
}

function setHp(inst, hp, now = Date.now()) {
  inst.hp = Math.max(0, Math.min(maxHp(inst), Math.round(hp)));
  inst.hpAt = now;
}

// ============================================================
// 시스템: 플레이어 (systems/player.js)
// ============================================================

// 플레이어(트레이너) 만들기 🧑‍🎤

function buildNewPlayer(userId, username, starterPetId) {
  const starter = createPetInstance(starterPetId, 1);
  return {
    userId,
    name: username,
    level: 1,
    exp: 0,
    gold: START_GOLD,
    inventory: { haejeong_ball: START_BALLS },
    pets: [starter],
    mainPetUid: starter.uid,
    dex: { [starterPetId]: true }, // 도감: 만난/잡은 펫 기록
    exploration: null, // 지금 하고 있는 탐험 (없으면 null)
    autoHunt: false, // 🏃 자동사냥 (켜 두면 자리 비운 사이 대신 /탐험, 보상 -80%)
    createdAt: Date.now(),
  };
}

function getMainPet(player) {
  const main = player.pets.find((p) => p.uid === player.mainPetUid) ?? player.pets[0] ?? null;
  if (main) ensureSkills(main);
  return main;
}

// 대표 펫 바꾸기 (전투 중에는 못 바꿔요: 체력 정보가 꼬여요!)
function setMainPet(player, uid) {
  if (!player.pets.some((p) => p.uid === uid)) return { kind: 'not_found' };
  if (player.exploration?.battle) return { kind: 'in_battle' };
  if (player.mainPetUid === uid) return { kind: 'already' };
  player.mainPetUid = uid;
  return { kind: 'changed', commit: true };
}

// 🏃 자동사냥
// 켜 두면 내가 자리를 비운 동안 고른 장소를 고른 펫이 /탐험 해주고, 다음에 봇을 쓸 때(또는 [새로고침]) 한꺼번에 정산해요 (보상 -80%)
// 도감에 없는 펫은 해정볼로 잡기도 해요. 봇은 백그라운드로 못 돌아서 "지금 상태"는 지난 시간으로 계산해서 보여줘요.
function newAutoHuntReport(locationId, now) {
  return { locationId, startedAt: now, runs: 0, wins: 0, escapes: 0, caught: 0, newPets: 0, balls: 0, gold: 0, trainerExp: 0, petExp: 0, trainerLevels: 0, petLevels: 0, stopReason: null, feed: [] };
}

function pushAutoFeed(rep, line) {
  rep.feed = [...(rep.feed ?? []), line].slice(-AUTO_HUNT_FEED_MAX);
}

// 자동사냥에 나갈 펫: 직접 고른 펫 (없어졌거나 안 골랐으면 대표 펫)
function getAutoHuntPet(player) {
  const pet = player.pets.find((p) => p.uid === player.autoHuntPetUid) ?? getMainPet(player);
  if (pet) ensureSkills(pet);
  return pet;
}

// 자동사냥 장소: 직접 고른 장소 (없으면 마지막으로 탐험한 장소)
const getAutoHuntLocId = (player) => player.autoHuntLocId ?? player.lastLocationId;

// 켜기 / 설정 바꾸기 / 상태 보기. opts: { petUid, locId, catchOn } (안 준 건 그대로)
// 이미 켜져 있으면 끄지 않아요 → 끄는 건 [종료] 버튼 (stopAutoHunt)
function controlAutoHunt(player, now = Date.now(), opts = {}) {
  const { petUid = null, locId = null, catchOn = null } = opts;

  // 1) 먼저 다 확인해요 (하나라도 틀리면 아무것도 안 바꿔요)
  const pick = petUid ? player.pets.find((p) => p.uid === petUid) : null;
  if (petUid && !pick) return { kind: 'pet_not_found' };
  const wantLoc = locId ? LOCATIONS[locId] : null;
  if (locId && !wantLoc) return { kind: 'loc_not_found' };
  if (wantLoc && player.level < wantLoc.minLevel) return { kind: 'locked', minLevel: wantLoc.minLevel };

  // 2) 바꾸기 (진행 중이던 한 판은 취소돼요)
  const changed = !!(pick || wantLoc || catchOn !== null);
  if (pick) player.autoHuntPetUid = pick.uid;
  if (wantLoc) {
    player.autoHuntLocId = wantLoc.id;
    if (player.autoHuntReport) player.autoHuntReport.locationId = wantLoc.id; // 결과에는 가장 마지막 장소가 보여요
  }
  if (catchOn !== null) player.autoHuntCatch = !!catchOn;
  if (changed) player.autoHuntPending = null;

  if (player.autoHunt) return { kind: changed ? 'settings' : 'status', commit: changed };

  // 저절로 멈춘 결과가 남아 있으면 먼저 보여줘요
  if (player.autoHuntReport) {
    const report = player.autoHuntReport;
    delete player.autoHuntReport;
    return { kind: 'report', report, commit: true };
  }

  const loc = LOCATIONS[getAutoHuntLocId(player)];
  if (!loc) return { kind: 'no_location', commit: changed };
  if (player.level < loc.minLevel) return { kind: 'locked', minLevel: loc.minLevel, commit: changed };
  const main = getAutoHuntPet(player);
  if (!main) return { kind: 'no_pet', commit: changed };
  if (currentHp(main, now) / maxHp(main) <= MULTI_STOP_HP_RATIO) return { kind: 'weak_pet', commit: changed };

  player.autoHunt = true;
  player.autoHuntAt = now;
  player.autoHuntPending = null;
  player.autoHuntReport = newAutoHuntReport(loc.id, now);
  return { kind: 'on', commit: true };
}

// 끄기 (정산은 updatePlayer 에서 이미 끝났어요)
function stopAutoHunt(player) {
  if (!player.autoHunt) return { kind: 'not_running' };
  const report = player.autoHuntReport ?? null;
  player.autoHunt = false;
  player.autoHuntAt = null;
  player.autoHuntPending = null;
  delete player.autoHuntReport;
  return { kind: 'off', report, commit: true };
}

// 야생 펫 1마리와 자동으로 싸워 봐요 (스킬·회복약은 안 써요).
// opts.balls > 0 이면 해정볼도 던져요: 야생 펫 체력이 깎였거나, 다음 한 대에 쓰러질 것 같을 때. (던지는 턴엔 야생 펫이 반격해요)
// 내 펫이 위험해지면(다음 한 대에 쓰러질 수 있으면) 싸움을 멈추고 물러나서 펫이 사라지는 일은 없어요!
// timeline: 턴마다 [내 체력, 야생 체력] — 진행 화면에서 "지금 몇 턴째"를 보여줄 때 써요
function autoFight(main, enc, startHp, rng, opts = {}) {
  const mine = calcStats(main.petId, main.level);
  const wild = calcStats(enc.petId, enc.level);
  const fx = GRADE_EFFECTS[PETS[enc.petId].grade];
  // 야생 펫이 낼 수 있는 최대 한 방 / 내가 낼 수 있는 최대 한 방 (변동 +15% · 급소 ×1.5)
  const worstHit = Math.round(Math.max(wild.atk * 0.25, wild.atk - mine.def * 0.5) * 1.15 * 1.5);
  const myMaxHit = Math.round(Math.max(mine.atk * 0.25, mine.atk - wild.def * 0.5) * 1.15 * 1.5);
  const balls = opts.balls ?? 0;
  let myHp = startHp;
  let wildHp = wild.hp;
  let thrown = 0;
  const timeline = [];
  const order = mine.spd >= wild.spd ? ['me', 'wild'] : ['wild', 'me'];
  const end = (result, rounds) => ({ result, myHp, rounds, thrown, startHp, wildMax: wild.hp, timeline });

  for (let round = 1; round <= BATTLE_MAX_ROUNDS; round++) {
    if (myHp <= worstHit) return end('retreat', round - 1);

    // 🔴 포획 시도
    let threw = false;
    if (thrown < balls && thrown < AUTO_HUNT_MAX_THROWS) {
      const ratio = wildHp / wild.hp;
      if (ratio <= AUTO_HUNT_CATCH_HP_RATIO || myMaxHit >= wildHp) {
        const chance = catchChance(enc.petId, enc.level, main.level, ratio, thrown);
        if (chance >= AUTO_HUNT_MIN_CATCH) {
          threw = true;
          thrown += 1;
          if (rng() < chance) { timeline.push({ m: myHp, w: wildHp, ev: 'throw' }); return end('caught', round); }
          if (rng() < fleeChance(thrown)) { timeline.push({ m: myHp, w: wildHp, ev: 'throw' }); return end('fled', round); }
          if (rng() >= EVADE_CHANCE) myHp -= calcDamage(wild.atk, mine.def, rng, fx.critChance).dmg; // 놓치면 반격!
        }
      }
    }

    if (!threw) {
      for (const who of order) {
        if (wildHp <= 0) break;
        if (who === 'me') {
          if (rng() >= fx.missChance) wildHp -= calcDamage(mine.atk, wild.def, rng).dmg;
        } else if (rng() >= EVADE_CHANCE) {
          myHp -= calcDamage(wild.atk, mine.def, rng, fx.critChance).dmg;
        }
      }
    }
    timeline.push({ m: Math.max(0, myHp), w: Math.max(0, wildHp), ev: threw ? 'throw' : 'hit' });
    if (wildHp <= 0) return end('won', round);
    if (rng() < WILD_FLEE_CHANCE) return end('escape', round);
  }
  return end('escape', BATTLE_MAX_ROUNDS);
}

// 🏃 자리 비운 사이에 자동사냥이 한 일을 정산해요. 바뀐 게 있으면 true (저장해야 해요)
// 한 번 도는 일 = 대기(5~30초) + 전투. 걸린 시간만큼 흘러간 것으로 치고, 지난 시간이 다 쓰일 때까지 반복해요.
// 아직 안 끝난 한 판은 autoHuntPending 에 담아 두고 다음 정산 때 그대로 이어서 해요 (진행 화면이 이걸 보여줘요).
function settleAutoHunt(player, now = Date.now(), rng = Math.random) {
  if (!player.autoHunt) return false;
  const since = player.autoHuntAt ?? now;
  const elapsed = now - since;
  if (elapsed < AUTO_HUNT_MIN_SETTLE_SEC * 1000) return false;

  // 직접 탐험하던 중이면 대신 안 해요 (몇 분 넘게 방치된 화면은 정리하고 대신 해줘요)
  const ex = player.exploration;
  if (ex && (ex.battle || now - (ex.startedAt ?? 0) < 120000)) {
    player.autoHuntAt = now;
    player.autoHuntPending = null;
    return true;
  }
  if (ex) player.exploration = null;

  const cap = AUTO_HUNT_MAX_HOURS * 3600 * 1000;
  const end = since + Math.min(elapsed, cap);
  const roundMs = AUTO_HUNT_SEC_PER_ROUND * 1000;
  const rep = (player.autoHuntReport ??= newAutoHuntReport(getAutoHuntLocId(player), since));
  const stop = (reason) => { rep.stopReason = reason; player.autoHunt = false; player.autoHuntAt = null; };

  let t = since;
  let pending = player.autoHuntPending ?? null;
  player.autoHuntPending = null;
  rep.resting = false;

  for (let i = 0; i < AUTO_HUNT_MAX_RUNS; i++) {
    const loc = LOCATIONS[getAutoHuntLocId(player)];
    const main = getAutoHuntPet(player);
    if (!loc || player.level < loc.minLevel) { stop('location'); break; }
    if (!main) { stop('no_pet'); break; }

    let run = pending;
    pending = null;
    if (run && (run.locId !== loc.id || run.petUid !== main.uid)) run = null; // 장소·펫이 바뀌었으면 새로 시작해요

    if (!run) {
      const enc = rollEncounter(loc, rng);
      const waitMs = calcWaitSec(loc, player.level, enc, rng).sec * 1000;
      const fightAt = t + waitMs;
      const hp = currentHp(main, fightAt);
      if (hp / maxHp(main) <= MULTI_STOP_HP_RATIO) {
        // 🛌 체력이 위험하면 쉬어요: 저절로 회복되는 시간(체력이 RESUME 비율까지 찰 때까지)만큼 흘러가요
        const max = maxHp(main);
        const restMs = Math.ceil(((AUTO_HUNT_RESUME_RATIO * max - hp) / (max * HP_REGEN_PCT_PER_MIN)) * 60000);
        t = fightAt + restMs;
        rep.restMs = (rep.restMs ?? 0) + Math.min(restMs, Math.max(0, end - fightAt));
        if (t >= end) { t = end; rep.resting = true; break; }
        continue;
      }
      // 🔴 도감에 없는 펫이고 해정볼이 있으면 잡아 봐요
      const balls = player.inventory?.[BALL_ID] ?? 0;
      const wantCatch = (player.autoHuntCatch ?? true) && balls > 0 && !player.dex?.[enc.petId];
      const fight = autoFight(main, enc, hp, rng, { balls: wantCatch ? balls : 0 });
      run = { enc, locId: loc.id, petUid: main.uid, fightAt, doneAt: fightAt + fight.rounds * roundMs, fight };
    }
    if (run.doneAt > end) { pending = run; break; } // 아직 싸우는 중이에요 → 다음 정산 때 이어서

    // ───── 한 판 끝! 결과를 반영해요 ─────
    t = run.doneAt;
    const f = run.fight;
    const enc = run.enc;
    const pet = PETS[enc.petId];
    const tag = `${pet.emoji} ${pet.name} Lv.${enc.level}`;
    rep.runs += 1;
    player.visited = { ...(player.visited ?? {}), [loc.id]: true };
    setHp(main, f.myHp, t);
    const used = Math.min(f.thrown, player.inventory?.[BALL_ID] ?? 0);
    if (used > 0) { player.inventory[BALL_ID] -= used; rep.balls += used; }

    if (f.result === 'retreat') {
      pushAutoFeed(rep, `🩹 ${tag} — 위험해서 물러났어요`);
      if (f.rounds === 0) { stop('too_strong'); break; } // 가득 찬 체력으로도 위험하면 이 장소는 무리예요
      rep.escapes += 1;
      continue; // 다음 바퀴에서 쉬어요
    }
    if (f.result === 'caught') {
      const isNew = !player.dex?.[enc.petId];
      player.pets.push(createPetInstance(enc.petId, enc.level));
      player.dex = { ...(player.dex ?? {}), [enc.petId]: true };
      const exp = Math.max(1, Math.round((Math.round(pet.expYield * loc.expMultiplier * 1.5) + (isNew ? 25 : 0)) * AUTO_HUNT_REWARD_MULT));
      const tr = addExp(player, exp);
      rep.trainerExp += exp;
      rep.trainerLevels += tr.levelsGained;
      rep.caught += 1;
      if (isNew) rep.newPets += 1;
      pushAutoFeed(rep, `🔴 ${tag} 포획 성공!${isNew ? ' ✨NEW' : ''} (볼 ${f.thrown}개)`);
      continue;
    }
    if (f.result === 'fled') {
      rep.escapes += 1;
      pushAutoFeed(rep, `💨 ${tag} — 볼 ${f.thrown}개를 쓰고 놓쳤어요`);
      continue;
    }
    if (f.result !== 'won') {
      rep.escapes += 1;
      pushAutoFeed(rep, `💨 ${tag} — 도망쳤어요`);
      continue;
    }

    const gold = Math.max(1, Math.round(pet.expYield * GOLD_PER_YIELD * (0.8 + rng() * 0.4) * AUTO_HUNT_REWARD_MULT));
    const trainerExp = Math.max(1, Math.round(pet.expYield * loc.expMultiplier * WIN_TRAINER_EXP_MULT * AUTO_HUNT_REWARD_MULT));
    const petExp = Math.max(1, Math.round(pet.expYield * loc.expMultiplier * WIN_PET_EXP_MULT * AUTO_HUNT_REWARD_MULT));
    player.gold += gold;
    const tr = addExp(player, trainerExp);
    const pr = addExp(main, petExp);
    if (pr.levelsGained > 0) setHp(main, maxHp(main), t); // 레벨업 보너스: 체력 가득!
    rep.wins += 1;
    rep.gold += gold;
    rep.trainerExp += trainerExp;
    rep.petExp += petExp;
    rep.trainerLevels += tr.levelsGained;
    rep.petLevels += pr.levelsGained;
    pushAutoFeed(rep, `⚔️ ${tag} 승리! 💰+${gold}${f.thrown ? ` (볼 ${f.thrown}개 놓침)` : ''}${pr.levelsGained > 0 ? ' ⬆️펫 레벨업' : ''}`);
  }

  if (player.autoHunt && elapsed >= cap) stop('time'); // 최대 시간을 다 채우면 자동으로 꺼져요
  else if (player.autoHunt) {
    player.autoHuntAt = t; // 못 쓴 시간은 다음에 이어서 써요
    player.autoHuntPending = pending;
  }
  rep.endedAt = t;
  return true;
}

// ============================================================
// 시스템: 아이템 사용 (systems/use.js)
// ============================================================

// 아이템 사용 규칙 🧪 (디스코드와 상관없는 순수한 규칙)

// 회복약 목록 (약한 것 → 센 것 순서)
const POTIONS = Object.values(ITEMS).filter((i) => i.heal).sort((a, b) => a.heal - b.heal);

// /사용 으로 쓸 수 있는 것: 회복약 + 경험치 부스트 + 탐험 시간 감소
const USABLE_ITEMS = [...POTIONS, ...Object.values(ITEMS).filter((i) => i.boost || i.speedup || i.catchItem || i.skillSlot || i.skillReroll)];
const CATCH_ITEMS = Object.values(ITEMS).filter((i) => i.catchItem); // 🍖 포획 아이템 목록

// 가진 회복약 목록 (약한 것 → 센 것 순서)
function ownedPotions(player) {
  return POTIONS.filter((p) => (player.inventory?.[p.id] ?? 0) > 0);
}

// 약 하나 고르기
//  - preferred(유저가 직접 고른 약 id)가 있으면 → 그 약만 써요 (없으면 null)
//  - 없으면 자동: 모자란 체력을 채울 수 있는 "가장 약한" 약, 없으면 가진 것 중 제일 센 약
function pickPotion(player, missing, preferred = null) {
  if (preferred) {
    const chosen = POTIONS.find((p) => p.id === preferred);
    return chosen && (player.inventory?.[chosen.id] ?? 0) > 0 ? chosen : null;
  }
  const owned = ownedPotions(player);
  if (owned.length === 0) return null;
  return owned.find((p) => p.heal >= missing) ?? owned[owned.length - 1];
}

// selector 로 펫 한 마리를 찾아요. 아래 셋 중 뭐든 받아들여요:
//   1) 비어 있음 → 대표 펫
//   2) 숫자 글자 (예: "2") → /펫 목록의 번호(1부터)
//   3) 그 외 글자 → 별명/이름으로 찾기 (자동완성으로 고르면 uid 가 그대로 와서 바로 매칭돼요)
function resolvePetSelector(player, selector) {
  if (selector === undefined || selector === null || selector === '') return getMainPet(player);
  const text = String(selector).trim();
  if (text === '') return getMainPet(player);

  const byUid = player.pets.find((p) => p.uid === text);
  if (byUid) return ensureSkills(byUid);

  if (/^\d+$/.test(text)) {
    const byIndex = player.pets[Number(text) - 1];
    return byIndex ? ensureSkills(byIndex) : null;
  }

  const lower = text.toLowerCase();
  const label = (p) => (p.nickname ?? PETS[p.petId].name).toLowerCase();
  const exact = player.pets.find((p) => label(p) === lower);
  if (exact) return ensureSkills(exact);

  const partial = player.pets.filter((p) => label(p).includes(lower));
  return partial.length === 1 ? ensureSkills(partial[0]) : null;
}

// 🆕 여러 마리를 한번에 고를 때 쓰는 "목록" 글자를 풀어내요.
//   "전체" / "all" → 대표 펫을 뺀 전부
//   "2,4,7-9"      → 콤마로 번호·범위·이름을 섞어 써도 OK (범위는 숫자만)
// 중복은 한 번만 세고, 못 찾은 항목은 notFound 에 그대로 담아 돌려줘요.
function resolvePetSelectors(player, text) {
  const raw = String(text ?? '').trim();
  if (raw === '') return { insts: [], notFound: [] };

  if (/^(전체|all)$/i.test(raw)) {
    const insts = player.pets.filter((p) => p.uid !== player.mainPetUid).map((p) => ensureSkills(p));
    return { insts, notFound: [] };
  }

  const seen = new Set();
  const insts = [];
  const notFound = [];

  for (const token of raw.split(',').map((t) => t.trim()).filter(Boolean)) {
    const range = token.match(/^(\d+)-(\d+)$/);
    if (range) {
      let a = Number(range[1]);
      let b = Number(range[2]);
      if (a > b) [a, b] = [b, a];
      b = Math.min(b, a + 199); // 범위 하나로 최대 200개까지만 (안전장치)
      for (let i = a; i <= b; i++) {
        const inst = player.pets[i - 1];
        if (!inst) { notFound.push(String(i)); continue; }
        if (!seen.has(inst.uid)) { seen.add(inst.uid); insts.push(ensureSkills(inst)); }
      }
      continue;
    }
    const inst = resolvePetSelector(player, token);
    if (!inst) { notFound.push(token); continue; }
    if (!seen.has(inst.uid)) { seen.add(inst.uid); insts.push(inst); }
  }
  return { insts, notFound };
}

// selector: /펫 목록 번호, 별명/이름, 또는 비우면 대표 펫. qty: 한 번에 몇 개를 쓸지 (기본 1, 한꺼번에 일괄 사용)
function useItem(player, itemId, selector, qty = 1, now = Date.now()) {
  const item = ITEMS[itemId];
  if (!item?.heal) return { kind: 'unknown' };

  const inst = resolvePetSelector(player, selector);
  if (!inst) return { kind: 'not_found' };
  if (player.exploration?.battle && inst.uid === player.mainPetUid) return { kind: 'in_battle' };

  const owned = player.inventory?.[itemId] ?? 0;
  if (owned <= 0) return { kind: 'none', item };

  const max = maxHp(inst);
  const cur = currentHp(inst, now);
  if (cur >= max) return { kind: 'full', inst: { ...inst } };

  const want = Math.max(1, Math.floor(qty) || 1);
  const needed = Math.ceil((max - cur) / item.heal); // 가득 채우는 데 필요한 개수
  const used = Math.min(want, owned, needed);
  const next = Math.min(max, cur + item.heal * used);

  player.inventory[itemId] = owned - used;
  setHp(inst, next, now);
  return {
    kind: 'used',
    commit: true,
    item,
    inst: { ...inst },
    before: cur,
    after: next,
    max,
    used,
    left: owned - used,
  };
}

// 🆕 회복약 한 종류를 여러 마리에게 한번에 먹여요 (/사용 목록:...)
function useItemMulti(player, itemId, uids, qty, now = Date.now()) {
  const item = ITEMS[itemId];
  const results = [];
  let totalUsed = 0;
  let totalGained = 0;
  for (const uid of [...new Set(uids)]) {
    const r = useItem(player, itemId, uid, qty, now);
    results.push({ uid, ...r });
    if (r.kind === 'used') {
      totalUsed += r.used;
      totalGained += r.after - r.before;
    }
  }
  return { results, item, totalUsed, totalGained };
}

// 부스트 1회분을 꺼내 써요 (경험치를 얻을 때 호출). 켜둔 게 있으면 true
function takeBoost(player, key) {
  if ((player.boosts?.[key] ?? 0) <= 0) return false;
  player.boosts[key] -= 1;
  return true;
}

// 경험치 부스트 켜기 / 탐험 시간 감소 쓰기. qty 개수만큼 (가진 만큼까지)
function useBoostItem(player, itemId, qty = 1, now = Date.now()) {
  const item = ITEMS[itemId];
  if (!item || !(item.boost || item.speedup)) return { kind: 'unknown' };
  const owned = player.inventory?.[itemId] ?? 0;
  if (owned <= 0) return { kind: 'none', item };
  const want = Math.max(1, Math.floor(Number(qty)) || 1);

  // 경험치 부스트: 켜둔 횟수만 늘려요
  if (item.boost) {
    const n = Math.min(want, owned);
    player.boosts ??= { trainerExp: 0, petExp: 0 };
    player.boosts[item.boost] = (player.boosts[item.boost] ?? 0) + n;
    player.inventory[itemId] = owned - n;
    return { kind: 'boosted', commit: true, item, used: n, charges: player.boosts[item.boost], left: owned - n };
  }

  // 탐험 시간 감소: 야생 펫을 기다리는 중에, 1개를 쓰면 남은 시간이 전부 사라져서 바로 나타나요
  const ex = player.exploration;
  if (!ex) return { kind: 'no_explore', item };
  if (ex.encounter) return { kind: 'already_appeared', item };

  const startSec = Math.max(0, Math.ceil((ex.appearAt - now) / 1000));
  if (startSec <= 0) return { kind: 'too_short', item, remaining: 0 };

  ex.appearAt = now;
  player.inventory[itemId] = owned - 1;
  return { kind: 'sped', commit: true, item, used: 1, before: startSec, after: 0, left: owned - 1, cutShort: false };
}

// 🎫 스킬 슬롯 개방권 / 🔄 스킬 변경권 — 펫 한 마리를 골라서 써요
// slot: 스킬 변경권일 때만 써요 (1~5, 이미 열려 있는 슬롯이어야 해요)
function useSkillItem(player, itemId, selector, slot, now = Date.now()) {
  const item = ITEMS[itemId];
  if (!item || !(item.skillSlot || item.skillReroll)) return { kind: 'unknown' };

  const inst = resolvePetSelector(player, selector);
  if (!inst) return { kind: 'not_found' };

  const owned = player.inventory?.[itemId] ?? 0;
  if (owned <= 0) return { kind: 'none', item };

  // 🎫 5번 슬롯 열기
  if (item.skillSlot) {
    if (inst.slot3) return { kind: 'already_open', inst };
    inst.slot3 = true;
    const got = grantSkills(inst);
    const mine = got.find(([i]) => i === SLOT_COUNT - 1); // 방금 열린 5번 슬롯에 들어온 스킬
    if (!mine) { inst.slot3 = false; return { kind: 'no_skill_left' }; }
    player.inventory[itemId] = owned - 1;
    return { kind: 'slot_opened', commit: true, item, inst: { ...inst }, skill: SKILLS[mine[1]] };
  }

  // 🔄 지정한 슬롯(1~5)의 스킬을 다른 걸로 다시 뽑기
  const open = slotsOpen(inst);
  const idx = (Number(slot) || 0) - 1;
  if (idx < 0 || idx >= SLOT_COUNT || !open[idx]) return { kind: 'bad_slot' };
  if (!SKILLS[inst.skills?.[idx]]) return { kind: 'empty_slot' };

  const before = SKILLS[inst.skills[idx]];
  const id = rollSkill(inst, Math.random, [inst.skills[idx]]);
  if (!id) return { kind: 'no_skill_left' };
  inst.skills[idx] = id;
  player.inventory[itemId] = owned - 1;
  return { kind: 'rerolled', commit: true, item, inst: { ...inst }, before, skill: SKILLS[id] };
}

// 쓴 약 요약 글자: "🧪 회복약 ×2 · 🍶 고급 회복약 ×1"
function potionSummary(used) {
  return Object.entries(used)
    .map(([id, n]) => `${ITEMS[id].emoji} ${ITEMS[id].name} ×${n}`)
    .join(' · ');
}

// 가득 찰 때까지 가진 약을 알아서 골라 써요 (전투 밖 전용). selector 가 비어 있으면 대표 펫
// potionId 를 주면 그 약만 써요 (여러 종류를 가졌을 때 골라 쓰기). 비우면 알맞은 약을 알아서 골라요
function autoHeal(player, selector, now = Date.now(), potionId = null) {
  const inst = resolvePetSelector(player, selector);
  if (!inst) return { kind: 'not_found' };
  if (player.exploration?.battle && inst.uid === player.mainPetUid) return { kind: 'in_battle' };

  const max = maxHp(inst);
  const start = currentHp(inst, now);
  if (start >= max) return { kind: 'full', inst: { ...inst } };

  const used = {};
  let guard = 0;
  while (currentHp(inst, now) < max && guard++ < HEAL_FULL_CAP) {
    const missing = max - currentHp(inst, now);
    const potion = pickPotion(player, missing, potionId);
    if (!potion) break;
    const r = useItem(player, potion.id, inst.uid, Math.ceil(missing / potion.heal), now);
    if (r.kind !== 'used') break;
    used[potion.id] = (used[potion.id] ?? 0) + r.used;
  }
  if (Object.keys(used).length === 0) return { kind: 'none' };
  return { kind: 'healed', commit: true, inst: { ...inst }, before: start, after: currentHp(inst, now), max, used };
}

// 🆕 여러 마리를 한번에 "알아서 회복" 해요 (/사용 목록:... , 아이템을 안 골랐을 때)
function autoHealMulti(player, uids, now = Date.now()) {
  const results = [];
  const usedTotal = {};
  let healedCount = 0;
  for (const uid of [...new Set(uids)]) {
    const r = autoHeal(player, uid, now);
    results.push({ uid, ...r });
    if (r.kind === 'healed') {
      healedCount += 1;
      for (const [id, n] of Object.entries(r.used)) usedTotal[id] = (usedTotal[id] ?? 0) + n;
    }
  }
  return { results, usedTotal, healedCount };
}

// ============================================================
// 시스템: 탐험 · 포획 (systems/explore.js)
// ============================================================

// 탐험 · 포획 규칙 🌿🔴 (디스코드와 상관없는 "순수한 게임 규칙"이라 테스트하기 쉬워요)
//
// 탐험 흐름:  /탐험 → (랜덤 시간 기다림) → [살펴보기] → 야생 펫 등장 → [잡기] / [싸우기] / [무시하기]
// player.exploration = { id, locationId, startedAt, appearAt, encounter: null | { petId, level }, battle?: {...} }
// (battle 은 systems/battle.js 가 만들어요. 전투 중에는 snapshot 의 state 가 'battle' 이에요)


const BALL_ID = 'haejeong_ball';

// 이 장소에서 나올 야생 펫을 하나 뽑아요 (펫 종류 + 레벨 + 🆕 랜덤 스킬 1~3개)
function rollEncounter(loc, rng = Math.random) {
  const spawn = weightedPick(loc.spawns, (s) => s.weight, rng);
  const petId = spawn.petId;
  return { petId, level: randInt(spawn.lv[0], spawn.lv[1], rng), skills: rollWildSkills(petId, rng) };
}

// 나올 펫이 얼마나 센지에 따른 대기 시간 배수 (등급이 높을수록, 그 장소에서 높은 레벨일수록 커져요)
function waitMultiplier(loc, enc) {
  const spawn = loc.spawns.find((s) => s.petId === enc.petId);
  const [lo, hi] = spawn?.lv ?? [enc.level, enc.level];
  const t = hi > lo ? (enc.level - lo) / (hi - lo) : 0;
  return GRADE_WAIT_MULT[PETS[enc.petId].grade] * (1 + LEVEL_WAIT_BONUS * Math.max(0, Math.min(1, t)));
}

// 기다릴 시간(초) 정하기: 장소·레벨·펫 세기와 상관없이 5초 ~ 30초 사이에서 고정으로 뽑아요
function calcWaitSec(loc, trainerLevel, enc, rng = Math.random) {
  return { sec: randInt(5, 30, rng), fake: false };
}

// 이미 가 본 장소인지: 야생 펫을 만난 적이 있거나, 그 장소의 펫이 도감에 있으면 "가 본 곳"이에요
function hasVisited(player, locationId) {
  if (player.visited?.[locationId]) return true;
  const loc = LOCATIONS[locationId];
  return !!loc && loc.spawns.some((s) => player.dex?.[s.petId]);
}

// 잡을 확률: 펫마다 정해진 값 × (내 대표 펫보다 야생 펫이 너무 높으면 조금 어려워져요)
//            × (전투로 야생 펫 체력을 깎을수록 쉬워져요: 체력이 거의 0이면 최대 2배!)
//            × (포획 아이템 배수: 간식·꿀·부적) → 아이템을 써도 최대 98%, 아이템 없이는 최대 95%예요.
//            − 등급 깎임값(고등급만) → 0% 아래로 내려가면(음수) 못 잡아요. 음수는 -30% 까지만 내려가요.
function catchChanceRaw(petId, wildLevel, mainLevel, hpRatio = 1, tries = 0, itemMult = 1) {
  const gap = Math.max(0, wildLevel - mainLevel);
  const factor = Math.max(0.3, 1 - gap * 0.02);
  const weakBonus = 1 + (1 - Math.max(0, Math.min(1, hpRatio)));
  const base = PETS[petId].catchRate * factor * weakBonus * itemMult;
  const penalty = CATCH_GRADE_PENALTY[PETS[petId].grade] ?? 0;
  const raw = base - penalty - CATCH_DROP_PER_TRY * tries; // 던진 횟수만큼 -10%p
  return Math.max(penalty > 0 ? CATCH_NEG_FLOOR : CATCH_MIN_CHANCE, raw); // 계산값 (음수 가능)
}

// 실제로 굴리는 확률 = 계산값을 0% ~ 상한 사이로 맞춘 값
function catchChance(petId, wildLevel, mainLevel, hpRatio = 1, tries = 0, itemMult = 1) {
  const raw = catchChanceRaw(petId, wildLevel, mainLevel, hpRatio, tries, itemMult);
  const cap = itemMult > 1 ? CATCH_MAX_WITH_ITEMS : CATCH_MAX_CHANCE;
  return Math.max(0, Math.min(cap, raw));
}

// 도망 확률: 실패한 횟수만큼 +35%p (상한 90%). 끈끈이 그물을 쓰면 -30%p (최소 5%)
function fleeChance(tries, net = false) {
  const v = Math.min(FLEE_MAX, FLEE_BASE + FLEE_RISE_PER_TRY * tries);
  return net ? Math.max(CATCH_NET_FLEE_MIN, v - CATCH_NET_FLEE_REDUCE) : v;
}

// ───────── 포획 아이템 🍖 ─────────
// 이번 만남에 쓴 효과는 player.exploration 에 저장돼요: catchBonus(간식·꿀 합계) / charm(부적) / net(그물) / analyzed(분석기)
// (야생 펫이 새로 나타나면 탐험 정보가 새로 만들어져서 효과가 사라져요)
const CHARM_BONUS = ITEMS.catch_charm.catchBonus;

function exCatchMult(ex) {
  return 1 + (ex.catchBonus ?? 0) + (ex.charm ? CHARM_BONUS : 0);
}

// 지금 [잡기] 를 한 번 던졌을 때의 실제 포획 확률 (분석기가 보여주는 값 = 진짜 던질 때 쓰는 값)
function exCatchChance(player, ex) {
  const hpRatio = ex.battle ? ex.battle.wildHp / ex.battle.wildMax : 1;
  return catchChance(ex.encounter.petId, ex.encounter.level, getMainPet(player)?.level ?? 1, hpRatio, ex.catchTries ?? 0, exCatchMult(ex));
}

// 같은 조건의 "계산값" (0% 아래로 내려간 음수도 그대로 보여줘요 — 분석기용)
function exCatchRaw(player, ex) {
  const hpRatio = ex.battle ? ex.battle.wildHp / ex.battle.wildMax : 1;
  return catchChanceRaw(ex.encounter.petId, ex.encounter.level, getMainPet(player)?.level ?? 1, hpRatio, ex.catchTries ?? 0, exCatchMult(ex));
}

function catchItemState(player, ex) {
  const owned = {};
  for (const i of CATCH_ITEMS) {
    const n = player.inventory?.[i.id] ?? 0;
    if (n > 0) owned[i.id] = n;
  }
  return {
    bonus: ex.catchBonus ?? 0,
    charm: !!ex.charm,
    net: !!ex.net,
    analyzed: !!ex.analyzed,
    fleeNext: fleeChance((ex.catchTries ?? 0) + 1, !!ex.net),
    owned,
  };
}

// 포획 난이도 이름표
function catchDifficulty(chance, raw = chance) {
  if (raw <= 0) return { emoji: '🚫', label: '지금은 불가능' };
  if (chance >= 0.8) return { emoji: '🟢', label: '매우 쉬움' };
  if (chance >= 0.6) return { emoji: '🟩', label: '쉬움' };
  if (chance >= 0.4) return { emoji: '🟡', label: '보통' };
  if (chance >= 0.2) return { emoji: '🟠', label: '어려움' };
  if (chance >= 0.08) return { emoji: '🔴', label: '매우 어려움' };
  return { emoji: '💀', label: '극악' };
}

const chancePctText = (v) => (v < 0.1 ? (v * 100).toFixed(1) : String(Math.round(v * 100)));
const rawPctText = (v) => String(Math.round(v * 100)); // 음수도 그대로 (예: -12)
// 계산값이 0% 이하일 때 붙는 안내
const deficitText = (raw) => (raw <= 0 ? ` — 계산값 **${rawPctText(raw)}%**, 지금 던지면 100% 빠져나가요! 야생 펫을 더 약하게 만들거나 아이템으로 끌어올려요.` : '');

// 포획 아이템 쓰기. opts.viaPanel: 탐험 화면 버튼으로 눌렀는지 (전투 중 턴을 쓰는 아이템은 버튼으로만 써요)
function useCatchItem(player, itemId, now = Date.now(), rng = Math.random, opts = {}) {
  const item = ITEMS[itemId];
  if (!item?.catchItem) return { kind: 'unknown' };
  const owned = player.inventory?.[itemId] ?? 0;
  if (owned <= 0) return { kind: 'none', item };

  const ex = player.exploration;
  if (!ex) return { kind: 'no_explore', item };
  if (opts.expectId && ex.id !== opts.expectId) return { kind: 'no_explore', item };
  if (!ex.encounter) return { kind: 'no_encounter', item };

  const costsTurn = !!ex.battle && CATCH_ITEM_COSTS_TURN && item.catchItem !== 'scanner';
  if (costsTurn && !opts.viaPanel) return { kind: 'use_button', item };

  let note;
  const consume = () => {
    player.inventory[itemId] = owned - 1;
  };

  if (item.catchItem === 'scanner') {
    const chance = exCatchChance(player, ex);
    const raw = exCatchRaw(player, ex);
    const d = catchDifficulty(chance, raw);
    if (!ex.analyzed) {
      ex.analyzed = true;
      consume();
    }
    note = `${item.emoji} **${item.name}** 로 분석했어요!`; // 자세한 숫자는 탐험 화면에 계속 떠 있어요
    const detail = `${note}\n지금 포획 확률 **${chancePctText(chance)}%** (${d.emoji} ${d.label})${deficitText(raw)}`; // /사용 으로 썼을 때 보여줄 자세한 글자
    return { kind: 'item_used', commit: true, item, note, detail, left: player.inventory[itemId], snap: snapshot(player, now) };
  }

  if (item.catchItem === 'bait') {
    const cur = ex.catchBonus ?? 0;
    if (cur >= CATCH_BAIT_BONUS_CAP - 1e-9) return { kind: 'bait_max', item };
    ex.catchBonus = Math.min(CATCH_BAIT_BONUS_CAP, cur + item.catchBonus);
    consume();
    note = `${item.emoji} **${item.name}** 을(를) 줬어요! 포획 확률 ×${(1 + ex.catchBonus).toFixed(1)}${ex.catchBonus >= CATCH_BAIT_BONUS_CAP - 1e-9 ? ' (최대!)' : ''}`;
  } else if (item.catchItem === 'charm') {
    if (ex.charm) return { kind: 'charm_active', item };
    ex.charm = true;
    consume();
    note = `${item.emoji} **${item.name}** 을(를) 꼭 쥐었어요! 다음 던지기 1번의 포획 확률이 크게 올라요.`;
  } else {
    if (ex.net) return { kind: 'net_active', item };
    ex.net = true;
    consume();
    note = `${item.emoji} **${item.name}** 을(를) 쳤어요! 도망 확률이 줄어들었어요.`;
  }

  // 전투 중이면 한 턴을 써요: 야생 펫이 반격해요!
  if (costsTurn) {
    const c = context(player, ex);
    const log = [`${note} (한 턴을 썼어요)`];
    wildAttack(c, ex.battle, log, rng);
    return { ...finishTurn(player, ex, c, log, now, rng), commit: true };
  }
  return { kind: 'item_used', commit: true, item, note, left: player.inventory[itemId], snap: snapshot(player, now) };
}

// 지금 탐험 상태를 한 장의 "사진"으로 찍어요 (화면 그릴 때 써요)
function snapshot(player, now = Date.now()) {
  const ex = player.exploration;
  if (!ex) return { state: 'idle' };
  const base = { id: ex.id, locationId: ex.locationId, balls: player.inventory?.[BALL_ID] ?? 0 };
  if (ex.encounter) {
    const main = getMainPet(player);
    const b = ex.battle ?? null;
    const snap = {
      ...base,
      state: b ? 'battle' : 'encounter',
      encounter: { ...ex.encounter },
      chance: exCatchChance(player, ex),
      rawChance: exCatchRaw(player, ex),
      items: catchItemState(player, ex),
    };
    if (b) {
      snap.battle = {
        ...b,
        myPetId: main.petId,
        myLevel: main.level,
        myName: main.nickname ?? PETS[main.petId].name,
        skills: main.skills ?? Array(SLOT_COUNT).fill(null), // 🆕 스킬 슬롯 (전투 버튼에 쓰여요)
        mainRef: { manaBonus: main.manaBonus ?? 0 }, // 화면에 최대 마나를 보여줄 때 써요
      };
    }
    return snap;
  }
  return {
    ...base,
    state: 'exploring',
    remainingSec: Math.max(0, Math.ceil((ex.appearAt - now) / 1000)),
    scout: ex.scouted && ex.nextEncounter ? { ...ex.nextEncounter } : null,
  };
}

// 탐험 시작
function startExploration(player, locationId, now = Date.now(), rng = Math.random) {
  const loc = LOCATIONS[locationId];
  if (!loc) return { ok: false, reason: 'unknown_location' };
  if (player.level < loc.minLevel) return { ok: false, reason: 'locked', minLevel: loc.minLevel };

  // 이미 탐험 중이면 새로 시작하지 않고 이어서 해요 (대기 시간을 다시 뽑는 꼼수 방지!)
  if (player.exploration) {
    return {
      ok: true,
      resumed: true,
      sameLocation: player.exploration.locationId === locationId,
      snap: snapshot(player, now),
      commit: false,
    };
  }

  const enc = rollEncounter(loc, rng); // 나올 펫을 먼저 정하고
  const { sec: waitSec } = calcWaitSec(loc, player.level, enc, rng); // 그 펫이 셀수록 오래 기다려요
  player.exploration = {
    id: randomUUID().slice(0, 8),
    locationId,
    startedAt: now,
    appearAt: now + waitSec * 1000,
    encounter: null,
    nextEncounter: enc, // 곧 나올 펫을 미리 정해둬요 (🔭 망원경이 이걸 알려줘요)
  };
  player.lastLocationId = locationId; // /탐험 을 장소 없이 쓰면 여기로 가요
  return { ok: true, resumed: false, snap: snapshot(player, now), commit: true };
}

// [살펴보기]
function lookAround(player, id, now = Date.now(), rng = Math.random) {
  const ex = player.exploration;
  if (!ex || ex.id !== id) return { kind: 'expired' };
  if (ex.encounter) return { kind: 'encounter', snap: snapshot(player, now) };
  if (now < ex.appearAt) return { kind: 'waiting', snap: snapshot(player, now) };

  const loc = LOCATIONS[ex.locationId];
  ex.encounter = ex.nextEncounter ?? rollEncounter(loc, rng);
  delete ex.nextEncounter;
  delete ex.scouted;
  player.visited = { ...(player.visited ?? {}), [ex.locationId]: true }; // 이 장소는 이제 "가 본 곳"이에요
  ex.catchTries = 0; // 새 야생 펫이라서 던진 횟수를 0으로 되돌려요
  return { kind: 'appeared', snap: snapshot(player, now), commit: true };
}

// [잡기]
function attemptCatch(player, id, now = Date.now(), rng = Math.random) {
  const ex = player.exploration;
  if (!ex || ex.id !== id || !ex.encounter) return { kind: 'expired' };

  const locationId = ex.locationId;
  const balls = player.inventory?.[BALL_ID] ?? 0;
  if (balls <= 0) return { kind: 'no_ball', snap: snapshot(player, now) };

  player.inventory[BALL_ID] = balls - 1; // 던지는 순간 해정볼은 사라져요
  const { petId, level } = ex.encounter;
  const hpRatio = ex.battle ? ex.battle.wildHp / ex.battle.wildMax : 1;
  const tries = ex.catchTries ?? 0;
  const chance = exCatchChance(player, ex);
  if (ex.charm) ex.charm = false; // 🍀 부적은 한 번 던지면 사라져요

  if (rng() < chance) {
    const isNew = !player.dex?.[petId];
    player.pets.push(createPetInstance(petId, level));
    player.dex = { ...(player.dex ?? {}), [petId]: true };

    const loc = LOCATIONS[ex.locationId];
    let expGain = Math.round(PETS[petId].expYield * loc.expMultiplier * 1.5) + (isNew ? 25 : 0);
    const trainerBoost = takeBoost(player, 'trainerExp'); // 🚀 포획 경험치에도 트레이너 부스트가 붙어요
    if (trainerBoost) expGain = Math.round(expGain * (1 + BOOST_PCT));
    const before = player.level;
    const result = addExp(player, expGain);
    const unlocked = LOCATION_LIST.filter((l) => l.minLevel > before && l.minLevel <= player.level);

    player.exploration = null;
    return {
      kind: 'caught', commit: true, petId, level, isNew, expGain, locationId, trainerBoost, boostsLeft: { ...(player.boosts ?? {}) },
      levelsGained: result.levelsGained, newLevel: player.level, unlocked, ballsLeft: balls - 1,
    };
  }

  // 실패! 던진 횟수가 늘어서 이제 도망이 더 쉬워져요
  ex.catchTries = tries + 1;
  if (rng() < fleeChance(ex.catchTries, ex.net)) {
    player.exploration = null;
    return { kind: 'fled', commit: true, petId, ballsLeft: balls - 1, locationId };
  }

  // 전투 중에 던진 거라면, 공격/회복처럼 똑같이 한 턴을 써요 (야생 펫이 반격해요!)
  if (ex.battle) {
    const c = context(player, ex);
    const log = [`${BALL.emoji} ${BALL.name}을(를) 던졌지만 빠져나왔어요! (남은 ${BALL.name} ${balls - 1}개)`];
    wildAttack(c, ex.battle, log, rng);
    return { ...finishTurn(player, ex, c, log, now, rng), ballsLeft: balls - 1 };
  }

  return { kind: 'escaped', commit: true, snap: snapshot(player, now), ballsLeft: balls - 1 };
}

// [무시하기] / [그만두기] (전투 중이 아닐 때만 써요 — 전투 중 도망은 attemptFlee 를 써요)
function leave(player, id) {
  const ex = player.exploration;
  if (!ex || ex.id !== id) return { kind: 'expired' };
  const petId = ex.encounter?.petId ?? null;
  const locationId = ex.locationId;
  player.exploration = null;
  return { kind: petId ? 'ignored' : 'quit', petId, locationId, commit: true };
}

// [도망] — 전투 중 전용 버튼. 등급별 도망 실패 확률(GRADE_EFFECTS.fleeFail)로 실패해서 턴을 날려요 (야생 펫이 반격!)
function attemptFlee(player, id, now = Date.now(), rng = Math.random) {
  const ex = player.exploration;
  if (!ex || ex.id !== id || !ex.encounter) return { kind: 'expired' };

  const fleeFx = GRADE_EFFECTS[PETS[ex.encounter.petId].grade];
  if (ex.battle && rng() < fleeFx.fleeFail) {
    const c = context(player, ex);
    const log = [fleeFx.aura ? '🏃 도망치려 했지만 위압감에 다리가 풀려서 **실패했어요!**' : '🏃 도망치려 했지만 **실패했어요!**'];
    wildAttack(c, ex.battle, log, rng);
    return finishTurn(player, ex, c, log, now, rng);
  }

  const petId = ex.encounter.petId;
  const locationId = ex.locationId;
  player.exploration = null;
  return { kind: 'ran', petId, locationId, commit: true };
}

// [잡기 ×N] — 해정볼을 연달아 던져요. 잡거나/도망가거나/전투가 끝나거나/해정볼이 떨어지거나/체력이 위험하면 멈춰요
function attemptCatchMulti(player, id, now = Date.now(), rng = Math.random, times = MULTI_THROWS) {
  const logs = [];
  let last = null;
  for (let i = 0; i < times; i++) {
    const r = attemptCatch(player, id, now, rng);
    if (r.kind === 'expired') return last ? { ...last, log: logs } : r;
    if (r.kind === 'no_ball') {
      if (!last) return r;
      logs.push(`${BALL.emoji} 해정볼이 떨어져서 여기까지만 던졌어요!`);
      break;
    }
    last = r;
    if (r.kind === 'escaped') {
      logs.push(`${BALL.emoji} ${i + 1}번째: 던졌지만 빠져나왔어요!`);
      continue;
    }
    if (r.kind === 'continue') {
      logs.push(...r.log);
      const b = player.exploration?.battle;
      if (b && b.myHp / b.myMax <= MULTI_STOP_HP_RATIO) {
        logs.push('⚠️ 체력이 위험해서 연속 던지기를 멈췄어요!');
        break;
      }
      continue;
    }
    // 잡았다 / 도망쳤다 / 전투 종료: 지금까지의 기록을 앞에 붙여서 끝내요
    return { ...r, log: [...logs, ...(r.log ?? [])] };
  }
  return { ...last, log: logs };
}

// ============================================================
// 시스템: 전투 (systems/battle.js)
// ============================================================

// 전투 규칙 ⚔️ (디스코드와 상관없는 "순수한 게임 규칙")
//
// 전투 흐름: 야생 펫 등장 → [싸우기] → (턴마다 [공격] / [잡기] / [회복] / [도망] / [스킬]) → 승리 / 패배 / 무승부
// player.exploration.battle = { myHp, myMax, wildHp, wildMax, round, myMana, wildMana, mySt, wildSt }
// 한 턴 = 속도가 빠른 쪽이 먼저 때리고, 이어서 상대가 때려요 (속도가 같으면 내 펫이 먼저!)
//
// ❤️ 체력은 전투가 끝나도 이어져요! 매 턴 끝에 대표 펫의 체력(hp)을 저장해요.
//    체력이 0이면 싸울 수 없어요 → 회복약, 시간 경과(자동 회복), 다른 펫로 교체로 해결해요.


// 데미지 = 공격력 - 방어력의 절반 (최소 공격력의 25%) × 랜덤(0.85~1.15), 가끔 급소(×1.5)
function calcDamage(atk, def, rng = Math.random, critChance = CRIT_CHANCE) {
  const base = Math.max(atk * 0.25, atk - def * 0.5);
  const variance = 0.85 + rng() * 0.3;
  const crit = rng() < critChance;
  return { dmg: Math.max(1, Math.round(base * variance * (crit ? 1.5 : 1))), crit };
}

// 이번 전투에 필요한 정보를 한곳에 모아요
function context(player, ex) {
  const main = getMainPet(player);
  const myPet = PETS[main.petId];
  const wildInfo = ex.encounter;
  return {
    main,
    myPet,
    myName: main.nickname ?? myPet.name,
    wildInfo,
    wildPet: PETS[wildInfo.petId],
    mine: calcStats(main.petId, main.level),
    wild: calcStats(wildInfo.petId, wildInfo.level),
  };
}

function myAttack(c, b, log, rng) {
  const fx = GRADE_EFFECTS[c.wildPet.grade];
  if (rng() < fx.missChance) {
    log.push(
      fx.aura
        ? `😰 위압감에 손이 떨려서 공격이 **빗나갔어요!** (${c.wildPet.emoji} ${c.wildPet.name}에게 데미지 0)`
        : `${c.wildPet.emoji} ${c.wildPet.name}(이)가 **회피했다!** 공격이 빗나갔어요.`,
    );
    return;
  }
  const { dmg, crit } = calcDamage(c.mine.atk, c.wild.def, rng);
  b.wildHp = Math.max(0, b.wildHp - dmg);
  log.push(`${c.myPet.emoji} ${c.myName}의 공격! ${crit ? '💥 급소! ' : ''}${c.wildPet.name}에게 **${dmg}** 데미지`);
}

function wildAttack(c, b, log, rng) {
  if (rng() < EVADE_CHANCE) {
    log.push(`${c.myPet.emoji} ${c.myName}(이)가 **회피했다!** 공격을 피했어요.`);
    return;
  }
  const { dmg, crit } = calcDamage(c.wild.atk, c.mine.def, rng, GRADE_EFFECTS[c.wildPet.grade].critChance);
  b.myHp = Math.max(0, b.myHp - dmg);
  log.push(`${c.wildPet.emoji} ${c.wildPet.name}의 공격! ${crit ? '💥 급소! ' : ''}${c.myName}에게 **${dmg}** 데미지`);
}

// 🆕 기절 상태면 이번 행동을 건너뛰고(한 번만) 상태를 풀어줘요. true 를 돌려주면 행동을 못 한 거예요.
function stunned(st, name, log) {
  if (!st.stun) return false;
  delete st.stun;
  log.push(`💫 ${name}(이)가 기절해서 움직이지 못했어요!`);
  return true;
}

// 한 턴이 끝났을 때: 체력 저장 → 승리/패배/무승부/계속 판정
// myManaGain: 내가 이번 턴에 기본 공격을 했을 때만 true → 마나 +15 (스킬·회복·교체·잡기 턴에는 안 차요)
function finishTurn(player, ex, c, log, now, rng, myManaGain = false) {
  const b = ex.battle;
  const { main, myPet, wildPet, wildInfo, myName } = c;
  const locationId = ex.locationId;
  b.round += 1;
  setHp(main, b.myHp, now); // ❤️ 전투가 끝나도 체력이 이어져요

  // 승리!
  if (b.wildHp <= 0) {
    const loc = LOCATIONS[ex.locationId];
    // 🎰 보너스 추첨: 한 번만 굴려서 3배(0.1%) / 2배(0.5%) / 보통(나머지)
    const bonusRoll = rng();
    const bonusMult = bonusRoll < BONUS_TRIPLE_CHANCE ? 3 : bonusRoll < BONUS_TRIPLE_CHANCE + BONUS_DOUBLE_CHANCE ? 2 : 1;

    let gold = Math.max(1, Math.round(wildPet.expYield * GOLD_PER_YIELD * (0.8 + rng() * 0.4))) * bonusMult;
     let trainerExp = Math.round(wildPet.expYield * loc.expMultiplier * WIN_TRAINER_EXP_MULT) * bonusMult;
     let petExp = Math.round(wildPet.expYield * loc.expMultiplier * WIN_PET_EXP_MULT) * bonusMult;

    // 🚀 켜둔 경험치 부스트가 있으면 1회씩 쓰고 +30%
    const trainerBoost = takeBoost(player, 'trainerExp');
    const petBoost = takeBoost(player, 'petExp');
    if (trainerBoost) trainerExp = Math.round(trainerExp * (1 + BOOST_PCT));
    if (petBoost) petExp = Math.round(petExp * (1 + BOOST_PCT));

    player.gold += gold;
    const before = player.level;
    const t = addExp(player, trainerExp);
    const p = addExp(main, petExp);
    if (p.levelsGained > 0) setHp(main, maxHp(main), now); // 레벨업 보너스: 체력 가득!
    const unlocked = LOCATION_LIST.filter((l) => l.minLevel > before && l.minLevel <= player.level);

    player.exploration = null;
    return {
      kind: 'won', commit: true, log, locationId,
      wildPetId: wildInfo.petId, wildLevel: wildInfo.level,
      myPetId: main.petId, myName,
      gold, trainerExp, petExp, bonusMult, trainerBoost, petBoost, boostsLeft: { ...(player.boosts ?? {}) },
      levelsGained: t.levelsGained, newLevel: player.level,
      petLevelsGained: p.levelsGained, petNewLevel: main.level,
      petHp: currentHp(main, now), petMaxHp: maxHp(main),
      unlocked,
    };
  }

  // 패배... 탐험 중 전투에서 쓰러진 펫은 그 자리에서 영영 사라져요! (골드는 잃지 않아요)
  if (b.myHp <= 0) {
    const removedPetId = main.petId;
    player.pets = player.pets.filter((p) => p.uid !== main.uid);

    let newStarterId = null;
    if (player.pets.length === 0) {
      // 남은 펫이 하나도 없으면, 완전히 막히지 않도록 새 스타터 펫을 하나 줘요
      const fresh = createPetInstance(STARTER_IDS[Math.floor(rng() * STARTER_IDS.length)], 1);
      player.pets.push(fresh);
      player.mainPetUid = fresh.uid;
      newStarterId = fresh.petId;
    } else if (player.mainPetUid === main.uid) {
      player.mainPetUid = player.pets[0].uid;
    }

    player.exploration = null;
    return { kind: 'lost', commit: true, log, locationId, wildPetId: wildInfo.petId, myName, removedPetId, newStarterId };
  }

  // 매 턴 끝에 야생 펫이 겁먹고 스스로 도망칠 수도 있어요
  if (rng() < WILD_FLEE_CHANCE) {
    player.exploration = null;
    return { kind: 'wild_flee', commit: true, log, locationId, wildPetId: wildInfo.petId };
  }

  // 너무 오래 끌면 야생 펫이 떠나요
  if (b.round >= BATTLE_MAX_ROUNDS) {
    player.exploration = null;
    return { kind: 'draw', commit: true, log, locationId, wildPetId: wildInfo.petId };
  }

  // 🆕 턴 끝: 지속 피해 · 재생 · 상태이상 턴 감소는 항상 적용돼요. 내 마나는 기본 공격을 한 턴에만 차요!
  const tMe = { name: myName, emoji: myPet.emoji, hp: b.myHp, max: c.mine.hp, mana: b.myMana, manaMax: maxMana(main), st: b.mySt };
  const tWild = { name: wildPet.name, emoji: wildPet.emoji, hp: b.wildHp, max: c.wild.hp, mana: b.wildMana, manaMax: SKILL_CFG.manaMax, st: b.wildSt };
  tickSide(tMe, log, myManaGain);
  tickSide(tWild, log);
  b.myHp = tMe.hp; b.myMana = tMe.mana;
  b.wildHp = tWild.hp; b.wildMana = tWild.mana;

  return { kind: 'continue', commit: true, log, snap: snapshot(player, now) };
}

// [싸우기] — 전투 시작 (이미 시작했으면 이어서)
function startBattle(player, id, now = Date.now()) {
  const ex = player.exploration;
  if (!ex || ex.id !== id || !ex.encounter) return { kind: 'expired' };
  if (ex.battle) return { kind: 'continue', snap: snapshot(player, now) };
  if (!getMainPet(player)) return { kind: 'no_pet' };

  const c = context(player, ex);
  const hp = currentHp(c.main, now);
  if (hp <= 0) return { kind: 'fainted', name: c.myName, petId: c.main.petId };

  ex.battle = {
    myHp: hp,
    myMax: c.mine.hp,
    wildHp: c.wild.hp,
    wildMax: c.wild.hp,
    round: 0,
    myMana: SKILL_CFG.manaStart, // 🆕 전투 시작 마나
    wildMana: SKILL_CFG.manaStart,
    mySt: {}, // 🆕 내 펫 상태이상 (화상·공격↑ 등)
    wildSt: {}, // 🆕 야생 펫 상태이상
  };
  return { kind: 'started', commit: true, snap: snapshot(player, now) };
}

// [공격] — 한 턴 진행
function battleTurn(player, id, now = Date.now(), rng = Math.random) {
  const ex = player.exploration;
  if (!ex || ex.id !== id || !ex.encounter) return { kind: 'expired' };
  if (!ex.battle) return { kind: 'no_battle' };

  const b = ex.battle;
  const c = context(player, ex);
  const log = [];
  const order = c.mine.spd >= c.wild.spd ? ['me', 'wild'] : ['wild', 'me'];
  let attacked = false; // 내가 실제로 기본 공격을 했는지 (기절하면 못 해요)
  for (const who of order) {
    if (b.myHp <= 0 || b.wildHp <= 0) break; // 이미 쓰러졌으면 반격 못 해요
    if (who === 'me') { if (!stunned(b.mySt, c.myName, log)) { myAttack(c, b, log, rng); attacked = true; } }
    else { if (!stunned(b.wildSt, c.wildPet.name, log)) wildAttack(c, b, log, rng); }
  }
  if (attacked && b.myHp > 0 && b.wildHp > 0) log.push(`🔋 기본 공격으로 마나 **+${SKILL_CFG.manaPerTurn}** 회복!`);
  return finishTurn(player, ex, c, log, now, rng, attacked);
}

// [공격 ×N] — 한 번 눌러서 여러 턴을 진행해요 (끝나거나, 내 체력이 위험해지면 멈춰요)
function battleTurns(player, id, now = Date.now(), rng = Math.random, times = MULTI_TURNS) {
  const logs = [];
  let last = null;
  for (let i = 0; i < times; i++) {
    const round = player.exploration?.battle?.round;
    last = battleTurn(player, id, now, rng);
    if (last.kind === 'expired' || last.kind === 'no_battle') return last;
    logs.push(`**── ${round + 1}턴째 ──**`, ...last.log);
    if (last.kind !== 'continue') break;
    const b = player.exploration.battle;
    if (i < times - 1 && b.myHp / b.myMax <= MULTI_STOP_HP_RATIO) {
      logs.push('⚠️ 체력이 위험해서 연속 공격을 멈췄어요!');
      break;
    }
  }
  return { ...last, log: logs };
}

// [회복] — 가방의 회복약을 써요. 약을 몇 개 쓰든 야생 펫은 딱 한 번만 공격해요 (한 턴을 써요!)
// qty: 개수(기본 1) 또는 'full'(가득 찰 때까지)
// potionId: 직접 고른 약 id (비우면 알맞은 약을 알아서 골라요)
function battleHeal(player, id, now = Date.now(), rng = Math.random, qty = 1, potionId = null) {
  const ex = player.exploration;
  if (!ex || ex.id !== id || !ex.encounter) return { kind: 'expired' };
  if (!ex.battle) return { kind: 'no_battle' };

  const b = ex.battle;
  if (b.myHp >= b.myMax) return { kind: 'full_hp' };
  if (!pickPotion(player, b.myMax - b.myHp, potionId)) return { kind: 'no_potion' };

  const want = qty === 'full' ? HEAL_FULL_CAP : Math.max(1, Math.floor(Number(qty)) || 1);
  const c = context(player, ex);
  const before = b.myHp;
  const used = {};
  let total = 0;
  while (total < want && b.myHp < b.myMax) {
    const potion = pickPotion(player, b.myMax - b.myHp, potionId);
    if (!potion) break;
    player.inventory[potion.id] -= 1;
    b.myHp = Math.min(b.myMax, b.myHp + potion.heal);
    used[potion.id] = (used[potion.id] ?? 0) + 1;
    total += 1;
  }

  const log = [
    total === 1
      ? `${ITEMS[Object.keys(used)[0]].emoji} ${ITEMS[Object.keys(used)[0]].name}을(를) 썼어요! ${c.myName} 체력 +${b.myHp - before}`
      : `🧪 ${potionSummary(used)} 를 썼어요! ${c.myName} 체력 +${b.myHp - before}`,
  ];
  if (qty !== 'full' && total < want && b.myHp < b.myMax) log.push(`(회복약이 모자라서 ${total}개만 썼어요)`);
  if (!stunned(b.wildSt, c.wildPet.name, log)) wildAttack(c, b, log, rng);
  return finishTurn(player, ex, c, log, now, rng);
}

// [교체] — 대표 펫을 다른 펫(체력이 남은 펫)으로 바꿔요. 한 턴을 쓰고, 새로 나온 펫이 야생 펫의 공격을 맞아요!
// (물러난 펫의 체력은 그대로 저장돼요)
function battleSwap(player, id, uid, now = Date.now(), rng = Math.random) {
  const ex = player.exploration;
  if (!ex || ex.id !== id || !ex.encounter) return { kind: 'expired' };
  if (!ex.battle) return { kind: 'no_battle' };

  const b = ex.battle;
  const next = player.pets.find((p) => p.uid === uid);
  if (!next) return { kind: 'swap_not_found' };
  if (next.uid === player.mainPetUid) return { kind: 'swap_same' };
  const hp = currentHp(next, now);
  if (hp <= 0) return { kind: 'swap_fainted' };

  const old = getMainPet(player);
  const oldName = old.nickname ?? PETS[old.petId].name;
  setHp(old, b.myHp, now); // 물러나는 펫의 체력을 저장해요
  player.mainPetUid = next.uid;
  b.myHp = hp;
  b.myMax = maxHp(next);
  b.mySt = {}; // 교체하면 이전 펫의 상태이상은 사라져요

  const c = context(player, ex);
  const log = [
    `🔄 ${oldName}(이)가 물러나고 ${c.myPet.emoji} ${c.myName}(이)가 나왔어요! (한 턴을 써요)`,
    `교체하는 틈을 노려 ${c.wildPet.emoji} ${c.wildPet.name}(이)가 공격해요!`,
  ];
  if (!stunned(b.wildSt, c.wildPet.name, log)) wildAttack(c, b, log, rng);
  return finishTurn(player, ex, c, log, now, rng);
}

// [스킬] — 슬롯 번호(0~4)의 스킬을 써요. 한 턴을 쓰고, 야생 펫이 반격해요.
// 마나가 모자라면 못 써요. 야생 펫도 가끔 전용기를 써요.
function battleSkill(player, id, slot, now = Date.now(), rng = Math.random) {
  const ex = player.exploration;
  if (!ex || ex.id !== id || !ex.encounter) return { kind: 'expired' };
  if (!ex.battle) return { kind: 'no_battle' };

  const main = getMainPet(player);
  const sid = main.skills?.[slot];
  const sk = SKILLS[sid];
  if (!sk) return { kind: 'no_skill' };

  const b = ex.battle;
  if (b.myMana < sk.cost) return { kind: 'no_mana', need: sk.cost, have: b.myMana };

  const c = context(player, ex);
  const log = [];
  const me = { name: c.myName, emoji: c.myPet.emoji, hp: b.myHp, max: c.mine.hp, atk: c.mine.atk, def: c.mine.def, crit: CRIT_CHANCE, mana: b.myMana, manaMax: maxMana(main), st: b.mySt };
  const wild = { name: c.wildPet.name, emoji: c.wildPet.emoji, hp: b.wildHp, max: c.wild.hp, atk: c.wild.atk, def: c.wild.def, crit: GRADE_EFFECTS[c.wildPet.grade].critChance, mana: b.wildMana, manaMax: SKILL_CFG.manaMax, st: b.wildSt };

  // 1) 내가 스킬을 써요 (기절 중이면 못 써요 — 마나는 그대로예요)
  if (!stunned(b.mySt, c.myName, log)) {
    castSkill(sk, me, wild, rng, log);
    b.myHp = me.hp; b.myMana = me.mana;
    b.wildHp = wild.hp; b.wildMana = wild.mana;
  }

  // 2) 야생 펫이 반격해요: 배운 스킬 중 상황에 맞는 걸 우선 써요 (마나만 되면 거의 항상 스킬)
  if (b.wildHp > 0 && b.myHp > 0 && !stunned(b.wildSt, c.wildPet.name, log)) {
    const wsk = pickWildSkill(c.wildInfo.skills, wild, me, rng);
    if (wsk) {
      castSkill(wsk, wild, me, rng, log);
      b.wildHp = wild.hp; b.wildMana = wild.mana;
      b.myHp = me.hp; b.myMana = me.mana;
    } else {
      wildAttack(c, b, log, rng);
    }
  }

  return finishTurn(player, ex, c, log, now, rng);
}

// ============================================================
// 시스템: 상점 (systems/shop.js)
// ============================================================

// 상점 규칙 🛒 (디스코드와 상관없는 순수한 규칙)

const BUY_AMOUNTS = [1, 5, 10];

// qty: 1~MAX_BUY_AT_ONCE 사이 정수, 또는 'max'(가진 골드로 살 수 있는 만큼)
function buyItem(player, itemId, qty) {
  const item = ITEMS[itemId];
  if (!item || !item.price) return { kind: 'unknown' };

  let n = qty === 'max' ? Math.min(MAX_BUY_AT_ONCE, Math.floor(player.gold / item.price)) : Math.floor(Number(qty));
  if (qty === 'max' && n < 1) return { kind: 'no_gold', cost: item.price, gold: player.gold };
  if (!Number.isFinite(n) || n < 1 || n > MAX_BUY_AT_ONCE) return { kind: 'unknown' };

  const cost = item.price * n;
  if (player.gold < cost) return { kind: 'no_gold', cost, gold: player.gold };

  player.gold -= cost;
  player.inventory ??= {};
  player.inventory[itemId] = (player.inventory[itemId] ?? 0) + n;
  return { kind: 'bought', commit: true, itemId, qty: n, cost, gold: player.gold, owned: player.inventory[itemId] };
}

// ============================================================
// 시스템: 도감 (systems/dex.js)
// ============================================================

// 도감 규칙 📖 — 스타팅 펫은 셋 중 하나만 고를 수 있어서, 전체 칸 수는 "야생 펫 + 1" 이에요.

let WILD_COUNT = Object.values(PETS).filter((p) => !p.starter).length;

function dexProgress(player) {
  const found = Object.keys(player.dex ?? {}).filter((id) => PETS[id]).length;
  return { found, total: WILD_COUNT + 1 };
}

// ============================================================
// 시스템: 출석체크 · 도감 보상 (systems/reward.js)
// ============================================================

// 출석체크 📅 — 하루(한국 시간 기준)에 한 번!
const kstDate = (now = Date.now()) => new Date(now + KST_OFFSET_MS).toISOString().slice(0, 10);

function claimAttendance(player, now = Date.now()) {
  const today = kstDate(now);
  const last = player.attendance?.lastDate;
  if (last === today) {
    return { kind: 'already', streak: player.attendance.streak ?? 1, total: player.attendance.total ?? 1 };
  }

  const streak = last === kstDate(now - 24 * 60 * 60 * 1000) ? (player.attendance?.streak ?? 0) + 1 : 1;
  const total = (player.attendance?.total ?? 0) + 1;
  player.attendance = { lastDate: today, streak, total };

  player.inventory ??= {};
  player.inventory[BALL_ID] = (player.inventory[BALL_ID] ?? 0) + ATTENDANCE_BALLS;
  player.gold += ATTENDANCE_GOLD;
  return { kind: 'claimed', commit: true, balls: ATTENDANCE_BALLS, gold: ATTENDANCE_GOLD, streak, total, owned: player.inventory[BALL_ID] };
}

// 도감 보상 🎁 — 챕터 번호(1부터)에 따라 보상이 커져요
const chapterPetIds = (loc) => [...new Set(loc.spawns.map((s) => s.petId))];

function chapterReward(index, loc) {
  const n = index; // 0부터: 1챕터 = 0
  const grow = (r) => r.base + r.step * n;
  const strongest = chapterPetIds(loc).reduce((a, id) => (PETS[id].expYield > PETS[a].expYield ? id : a));
  // 승리 골드 = expYield × GOLD_PER_YIELD (±20% 랜덤) → 평균은 expYield × GOLD_PER_YIELD
  const avgGold = PETS[strongest].expYield * GOLD_PER_YIELD;
  return {
    balls: grow(DEX_REWARD.balls),
    potions: grow(DEX_REWARD.potions),
    speedups: grow(DEX_REWARD.speedups),
    boosts: grow(DEX_REWARD.boosts),
    gold: Math.round(avgGold * DEX_GOLD_MULT),
    strongest,
  };
}

function chapterProgress(player, loc) {
  const ids = chapterPetIds(loc);
  const have = ids.filter((id) => player.dex?.[id]).length;
  return { have, total: ids.length, complete: have === ids.length };
}

const rewardText = (r) =>
  `🔴 해정볼 ${r.balls}개 · 🧪 회복약 ${r.potions}개 · ⏩ 탐험 시간 감소 ${r.speedups}개\n` +
  `🌟 트레이너 경험치 부스트 ${r.boosts}개 · 💫 펫 경험치 부스트 ${r.boosts}개 · 💰 ${r.gold.toLocaleString('ko-KR')} 골드`;

// 다 채웠는데 아직 안 받은 챕터의 보상을 한꺼번에 받아요
function claimDexRewards(player) {
  const claimed = player.dexClaimed ?? {};
  const got = [];
  const total = { balls: 0, potions: 0, speedups: 0, boosts: 0, gold: 0 };

  LOCATION_LIST.forEach((loc, index) => {
    if (claimed[loc.id] || !chapterProgress(player, loc).complete) return;
    const r = chapterReward(index, loc);
    claimed[loc.id] = true;
    got.push({ loc, index, reward: r });
    for (const k of Object.keys(total)) total[k] += r[k];
  });

  if (got.length === 0) return { kind: 'nothing' };

  player.dexClaimed = claimed;
  player.inventory ??= {};
  const give = (id, n) => {
    if (n > 0) player.inventory[id] = (player.inventory[id] ?? 0) + n;
  };
  give(BALL_ID, total.balls);
  give('potion_small', total.potions);
  give('explore_speedup', total.speedups);
  give('exp_boost_trainer', total.boosts);
  give('exp_boost_pet', total.boosts);
  player.gold += total.gold;
  return { kind: 'claimed', commit: true, got, total };
}

// ============================================================
// 시스템: 유저 대결 (systems/duel.js)
// ============================================================

// 유저 대결 규칙 🥊 — 저장을 전혀 안 하는 "연습 경기"예요. 펫이 쓰러져도 사라지지 않고, 체력도 그대로예요.
// 한 라운드 = 속도가 빠른 쪽이 먼저 때리고, 이어서 상대가 때려요 (속도가 같으면 랜덤).

// 같은 신청이면 같은 결과가 나오도록 "씨앗 주사위"를 써요 (버튼을 여러 번 눌러도 결과를 다시 뽑을 수 없어요)
function seededRng(seedText) {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i++) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 대결에 나갈 선수(대표 펫) 정보 만들기
function duelFighter(player, now = Date.now()) {
  const main = getMainPet(player);
  if (!main) return null;
  const pet = PETS[main.petId];
  const s = calcStats(main.petId, main.level);
  const max = s.hp;
  return {
    owner: player.name,
    name: main.nickname ?? pet.name,
    emoji: pet.emoji,
    grade: pet.grade,
    level: main.level,
    stats: s,
    max,
    hp: DUEL_USE_FULL_HP ? max : Math.max(1, currentHp(main, now)),
  };
}

// 대결을 끝까지 시뮬레이션해요 (a = 신청한 사람, b = 받은 사람). 어떤 데이터도 바꾸지 않아요.
function simulateDuel(a, b, rng) {
  const log = [];
  const A = { ...a };
  const B = { ...b };
  const aFirst = A.stats.spd === B.stats.spd ? rng() < 0.5 : A.stats.spd > B.stats.spd;
  const order = aFirst ? [A, B] : [B, A];
  let rounds = 0;

  while (rounds < DUEL_MAX_ROUNDS && A.hp > 0 && B.hp > 0) {
    rounds += 1;
    log.push(`**— ${rounds}라운드 —**`);
    for (const atk of order) {
      const def = atk === A ? B : A;
      if (atk.hp <= 0 || def.hp <= 0) break;
      if (rng() < EVADE_CHANCE) {
        log.push(`${def.emoji} ${def.name}(이)가 **회피!**`);
        continue;
      }
      const { dmg, crit } = calcDamage(atk.stats.atk, def.stats.def, rng, CRIT_CHANCE);
      def.hp = Math.max(0, def.hp - dmg);
      log.push(`${atk.emoji} ${atk.name} → ${def.emoji} ${def.name} ${crit ? '💥' : ''}**${dmg}** (남은 ❤️ ${def.hp})`);
    }
  }

  let winner = null; // 'a' | 'b' | null(무승부)
  let timeout = false;
  if (A.hp <= 0 && B.hp > 0) winner = 'b';
  else if (B.hp <= 0 && A.hp > 0) winner = 'a';
  else {
    timeout = true;
    const ra = A.hp / A.max;
    const rb = B.hp / B.max;
    winner = ra === rb ? null : ra > rb ? 'a' : 'b';
  }
  return { winner, timeout, rounds, log, aHp: A.hp, bHp: B.hp };
}

// ============================================================
// 시스템: 펫 거래 (systems/trade.js)
// ============================================================

// 펫 거래 규칙 🤝 (디스코드와 상관없는 순수한 규칙) — 펫 ↔ 펫 1:1 교환
// 신청할 때와 수락할 때 "같은 검사"를 한 번씩 해요 (그 사이에 상황이 바뀔 수 있어서!)

const tradeCountToday = (player, now = Date.now()) =>
  player.trade?.date === kstDate(now) ? (player.trade.count ?? 0) : 0;

// uid 앞 8글자로 펫 찾기 (버튼 이름표에 uid 전체를 못 넣어서 앞부분만 써요)
function findPetByUidPrefix(player, prefix) {
  if (!prefix) return null;
  const hits = player.pets.filter((p) => p.uid.startsWith(prefix));
  return hits.length === 1 ? hits[0] : null;
}

const tradeFee = (inst) => Math.max(TRADE_FEE_MIN, Math.round(releaseValue(inst) * TRADE_FEE_RATE));
const petGradeOrder = (inst) => GRADES[PETS[inst.petId].grade].order;
const tradeNameOf = (inst) => inst.nickname ?? PETS[inst.petId].name;

function tradeCooldownLeftMs(inst, now = Date.now()) {
  return Math.max(0, (inst.tradedAt ?? 0) + TRADE_PET_COOLDOWN_MS - now);
}

const fmtCooldown = (ms) => {
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? (m > 0 ? `${h}시간 ${m}분` : `${h}시간`) : `${m}분`;
};

// 한쪽 사람이 거래할 자격이 되는지 (gives: 내가 보내는 펫, gets: 내가 받는 펫)
function checkTradeSide(p, gives, gets, now) {
  const who = `**${p.name}**님은`;
  if (p.level < TRADE_MIN_TRAINER_LEVEL) return `${who} 트레이너 레벨 **${TRADE_MIN_TRAINER_LEVEL}** 이상부터 거래할 수 있어요.`;
  if (p.createdAt && now - p.createdAt < TRADE_MIN_ACCOUNT_AGE_MS) {
    const left = TRADE_MIN_ACCOUNT_AGE_MS - (now - p.createdAt);
    return `${who} 모험을 시작한 지 얼마 안 돼서 **${fmtCooldown(left)}** 뒤부터 거래할 수 있어요.`;
  }
  if (p.exploration?.battle) return `${who} 지금 전투 중이라 거래할 수 없어요.`;
  if (tradeCountToday(p, now) >= TRADE_DAILY_LIMIT) return `${who} 오늘 거래 횟수(**${TRADE_DAILY_LIMIT}회**)를 다 썼어요. 한국 시간 0시에 초기화돼요.`;
  if (gives.uid === p.mainPetUid) return `${who} 대표 펫(👑)은 내보낼 수 없어요. \`/펫\` 에서 대표 펫을 바꿔주세요.`;
  const cd = tradeCooldownLeftMs(gives, now);
  if (cd > 0) return `${who} **${tradeNameOf(gives)}**(이)가 거래로 받은 지 얼마 안 돼서 **${fmtCooldown(cd)}** 뒤에 다시 거래할 수 있어요.`;
  const gotPet = PETS[gets.petId];
  const need = TRADE_GRADE_MIN_LEVEL[gotPet.grade] ?? 0;
  if (p.level < need) return `${who} ${GRADES[gotPet.grade].emoji}${GRADES[gotPet.grade].name} 등급 펫을 받으려면 트레이너 레벨 **${need}** 이상이어야 해요. (현재 Lv.${p.level})`;
  const cap = Math.min(MAX_LEVEL, p.level + TRAIN_LEVEL_CAP_OVER_TRAINER);
  if (gets.level > cap) return `${who} 트레이너 레벨보다 너무 높은 펫은 받을 수 없어요. (받을 수 있는 최대 펫 레벨 **${cap}**, 상대 펫 Lv.${gets.level})`;
  const fee = tradeFee(gives);
  if (p.gold < fee) return `${who} 거래 수수료 **${fee.toLocaleString('ko-KR')}** 골드가 모자라요. (보유 ${p.gold.toLocaleString('ko-KR')})`;
  return null;
}

// 거래가 성사될 수 있는지 전부 검사해요 (아무것도 바꾸지 않아요)
function validateTrade(a, instA, b, instB, now = Date.now()) {
  if (!instA || !instB) return { ok: false, msg: '거래할 펫을 찾을 수 없어요 🤔 (이미 거래됐거나 방생했을 수 있어요)' };
  const gap = Math.abs(petGradeOrder(instA) - petGradeOrder(instB));
  if (gap > TRADE_MAX_GRADE_GAP) {
    return { ok: false, msg: `등급 차이가 너무 커요! 서로 바꾸는 펫의 등급은 **${TRADE_MAX_GRADE_GAP}단계** 안쪽이어야 해요.` };
  }
  const lvGap = Math.abs(instA.level - instB.level);
  if (lvGap > TRADE_MAX_LEVEL_GAP) {
    return { ok: false, msg: `레벨 차이가 너무 커요! 서로 바꾸는 펫의 레벨 차이는 **${TRADE_MAX_LEVEL_GAP}** 이하여야 해요. (지금 ${lvGap})` };
  }
  const errA = checkTradeSide(a, instA, instB, now);
  if (errA) return { ok: false, msg: errA };
  const errB = checkTradeSide(b, instB, instA, now);
  if (errB) return { ok: false, msg: errB };
  return { ok: true, feeA: tradeFee(instA), feeB: tradeFee(instB) };
}

// 거래 성사 — updatePlayerPair 안에서 불러요. 검증 → 맞교환 → 수수료 → 횟수 기록 (도감에는 등록되지 않아요!)
function executeTrade(a, prefixA, b, prefixB, now = Date.now()) {
  const instA = findPetByUidPrefix(a, prefixA);
  const instB = findPetByUidPrefix(b, prefixB);
  const v = validateTrade(a, instA, b, instB, now);
  if (!v.ok) return { commit: false, value: { kind: 'invalid', msg: v.msg } };

  a.pets = a.pets.filter((p) => p.uid !== instA.uid);
  b.pets = b.pets.filter((p) => p.uid !== instB.uid);
  a.pets.push({ ...instB, tradedAt: now });
  b.pets.push({ ...instA, tradedAt: now });

  a.gold -= v.feeA;
  b.gold -= v.feeB;

  const today = kstDate(now);
  a.trade = { date: today, count: tradeCountToday(a, now) + 1 };
  b.trade = { date: today, count: tradeCountToday(b, now) + 1 };

  return {
    commit: true,
    value: {
      kind: 'traded', instA, instB, feeA: v.feeA, feeB: v.feeB,
      leftA: TRADE_DAILY_LIMIT - a.trade.count, leftB: TRADE_DAILY_LIMIT - b.trade.count,
    },
  };
}

// ============================================================
// 시스템: 펫 육성 (systems/care.js)
// ============================================================

// 펫 육성 규칙 🌱 — 별명 짓기 / 방생 / 훈련 (디스코드와 상관없는 순수한 규칙)

const TRAIN_AMOUNTS = [1, 5, 10];

// ───────── 별명 ─────────
// 디스코드 글자 꾸미기/멘션을 깨뜨리는 문자는 막아요
const BAD_NICK = /[@<>`*_~|\\]/;

// name 이 비어 있으면 별명을 지워요. selector 는 /펫 번호 · 이름 · 자동완성 값 모두 OK
function renamePet(player, selector, name) {
  const inst = resolvePetSelector(player, selector);
  if (!inst) return { kind: 'not_found' };
  const nick = (name ?? '').trim();
  if (nick === '') {
    inst.nickname = null;
    return { kind: 'cleared', commit: true, inst: { ...inst } };
  }
  if ([...nick].length > NICKNAME_MAX) return { kind: 'too_long' };
  if (BAD_NICK.test(nick)) return { kind: 'bad_chars' };
  inst.nickname = nick;
  return { kind: 'renamed', commit: true, inst: { ...inst } };
}

// ───────── 방생 ─────────
function releaseValue(inst) {
  const base = RELEASE_BASE_GOLD[PETS[inst.petId].grade] ?? 10;
  return Math.round(base * (1 + inst.level * RELEASE_LEVEL_BONUS));
}

function releasePet(player, uid) {
  const inst = player.pets.find((p) => p.uid === uid);
  if (!inst) return { kind: 'not_found' };
  if (uid === player.mainPetUid) return { kind: 'is_main' };
  const gold = releaseValue(inst);
  player.pets = player.pets.filter((p) => p.uid !== uid);
  player.gold += gold;
  return { kind: 'released', commit: true, petId: inst.petId, nickname: inst.nickname, level: inst.level, gold, total: player.gold };
}

// 🆕 여러 마리를 한번에 보내줘요. 대표 펫은 섞여 있어도 자동으로 건너뛰어요.
function releasePetsBulk(player, uids) {
  let skippedMain = false;
  let totalGold = 0;
  const released = [];
  for (const uid of [...new Set(uids)]) {
    if (uid === player.mainPetUid) { skippedMain = true; continue; }
    const inst = player.pets.find((p) => p.uid === uid);
    if (!inst) continue;
    const gold = releaseValue(inst);
    player.pets = player.pets.filter((p) => p.uid !== uid);
    player.gold += gold;
    totalGold += gold;
    released.push({ petId: inst.petId, nickname: inst.nickname, level: inst.level, gold });
  }
  return { released, totalGold, total: player.gold, skippedMain };
}

// ───────── 훈련 ─────────
const trainCost = (level) => TRAIN_BASE_COST + level * TRAIN_COST_PER_LEVEL;
const trainExp = (level) => Math.max(1, Math.round(expToNext(level) * TRAIN_EXP_RATIO));
const levelCap = (player) => Math.min(MAX_LEVEL, player.level + TRAIN_LEVEL_CAP_OVER_TRAINER);

function trainPet(player, uid, times, now = Date.now()) {
  const inst = player.pets.find((p) => p.uid === uid);
  if (!inst) return { kind: 'not_found' };
  // times: 1~MAX_TRAIN_AT_ONCE 사이 정수, 또는 'max'(골드/레벨 상한이 허락하는 만큼)
  const n = times === 'max' ? MAX_TRAIN_AT_ONCE : Math.floor(Number(times));
  if (!Number.isFinite(n) || n < 1 || n > MAX_TRAIN_AT_ONCE) return { kind: 'not_found' };
  if (player.exploration?.battle && uid === player.mainPetUid) return { kind: 'in_battle' };

  const startLevel = inst.level;
  let done = 0, spent = 0, expGained = 0, stop = null;
  for (let i = 0; i < n; i++) {
    if (inst.level >= levelCap(player)) { stop = 'cap'; break; }
    const cost = trainCost(inst.level);
    if (player.gold < cost) { stop = 'no_gold'; break; }
    const exp = trainExp(inst.level);
    player.gold -= cost;
    addExp(inst, exp);
    done += 1; spent += cost; expGained += exp;
  }
  if (done === 0) return { kind: stop ?? 'cap' };
  if (inst.level > startLevel) setHp(inst, maxHp(inst), now); // 레벨업 보너스: 체력 가득!
  return { kind: 'trained', commit: true, done, spent, expGained, stop, levelsGained: inst.level - startLevel, newLevel: inst.level };
}

// 🆕 여러 마리를 한번에 훈련시켜요 (/훈련 목록:...)
function trainPetsBulk(player, uids, times, now = Date.now()) {
  const results = [];
  let totalDone = 0;
  let totalSpent = 0;
  let totalExp = 0;
  for (const uid of [...new Set(uids)]) {
    const r = trainPet(player, uid, times, now);
    results.push({ uid, ...r });
    if (r.kind === 'trained') {
      totalDone += r.done;
      totalSpent += r.spent;
      totalExp += r.expGained;
    }
  }
  return { results, totalDone, totalSpent, totalExp };
}

// ============================================================
// 시스템 묶음 (commands 가 이 이름으로 불러써요)
// ============================================================

const exploreSys = { startExploration, lookAround, attemptCatch, attemptCatchMulti, leave, attemptFlee };
const battleSys = { startBattle, battleTurn, battleTurns, battleHeal, battleSwap, battleSkill };
const shopSys = { buyItem };

// ============================================================
// 명령어 (commands/index.js)
// ============================================================

// commands/index.js — 모든 명령어를 한 파일에 모았어요 📚

const NOT_STARTED = '아직 모험을 시작하지 않았어요! `/시작` 을 먼저 해주세요 🐣';
const BALL = ITEMS.haejeong_ball;

// ═════════════════════════════════════════════
// /시작
// ═════════════════════════════════════════════

const start = {
  data: {
    name: '시작',
    description: '모험을 시작하고 첫 해정펫을 받아요!',
    type: 1,
  },

  async execute(interaction) {
    const user = getUser(interaction);

    if (await getPlayer(user.id)) {
      return reply({ content: '이미 모험을 시작했어요! `/내정보` 로 확인해보세요 😊' }, { ephemeral: true });
    }

    const lines = STARTER_IDS.map((id) => {
      const pet = PETS[id];
      const s = calcStats(id, 1);
      return `${pet.emoji} **${pet.name}** — 체력 ${s.hp} / 공격 ${s.atk} / 방어 ${s.def} / 속도 ${s.spd}`;
    });

    return reply({
      embeds: [
        {
          title: '🐾 해정펫 월드에 오신 걸 환영해요!',
          description: `처음 함께할 친구를 골라주세요.\n한 번 고르면 바꿀 수 없어요!\n\n${lines.join('\n')}`,
          color: EMBED_COLOR,
        },
      ],
      components: [
        row(
          ...STARTER_IDS.map((id) =>
            button({
              label: PETS[id].name,
              emoji: PETS[id].emoji,
              customId: `start:${id}:${user.id}`,
              style: 1,
            }),
          ),
        ),
      ],
    });
  },

  components: {
    start: async function pickStarter(interaction, args) {
      const [petId, ownerId] = args;
      const user = getUser(interaction);

      if (user.id !== ownerId) {
        return reply({ content: '이 버튼은 `/시작`을 쓴 사람만 누를 수 있어요 🙅' }, { ephemeral: true });
      }
      if (!STARTER_IDS.includes(petId)) {
        return reply({ content: '그런 스타팅 펫은 없어요 🤔' }, { ephemeral: true });
      }

      const player = buildNewPlayer(user.id, user.global_name ?? user.username, petId);
      const created = await createPlayer(user.id, player);
      if (!created) {
        return reply({ content: '이미 모험을 시작했어요! `/내정보` 를 써보세요 😊' }, { ephemeral: true });
      }

      const pet = PETS[petId];
      return update({
        embeds: [
          {
            title: '🎉 모험 시작!',
            description:
              `${pet.emoji} **${pet.name}** (${GRADES[pet.grade].name})와(과) 함께하게 됐어요!\n\n` +
              `🔴 해정볼 5개와 💰 1000 골드를 선물로 받았어요.\n` +
              `\`/내정보\` 로 내 모습을, \`/장소\` 로 갈 수 있는 곳을 확인해보세요.`,
            color: 0x57f287,
          },
        ],
        components: [],
      });
    },
  },
};

// ═════════════════════════════════════════════
// /내정보
// ═════════════════════════════════════════════

// ═════════════════════════════════════════════
// 🎫 스킬 슬롯 개방권 — /내정보 · /펫 에서 쓰는 공용 도우미
// ═════════════════════════════════════════════

const TICKET_ID = 'skill_slot_ticket';
const ticketCount = (player) => player.inventory?.[TICKET_ID] ?? 0;

// 펫 한 마리의 스킬 칸 5개를 글자로 보여줘요
function skillSlotLines(inst) {
  return SLOT_IDX.map((i) => {
    const sk = SKILLS[inst.skills?.[i]];
    if (sk) return `　${i + 1}번 ${sk.emoji} **${sk.name}** (마나 ${sk.cost}) ${tierStars(sk.tier)}`;
    return `　${i + 1}번 🔒 ${SLOT_HINT()[i]}`;
  }).join('\n');
}

// "정말 개방권을 쓸까요?" 확인 화면 (goId = 쓰기, backId = 취소)
function ticketConfirmView(player, inst, { goId, backId }) {
  const pet = PETS[inst.petId];
  const name = inst.nickname ?? pet.name;
  const item = ITEMS[TICKET_ID];
  return {
    embeds: [
      {
        title: `${item.emoji} ${item.name} 사용`,
        description:
          `${GRADES[pet.grade].emoji} ${pet.emoji} **${name}** Lv.${inst.level} 의 **${SLOT_COUNT}번 스킬 슬롯**을 열까요?\n\n` +
          `${item.emoji} ${item.name} **1개**를 써요 (지금 ${ticketCount(player)}개).\n` +
          `열리면 랜덤 스킬 하나를 바로 배워요 (전용기가 나올 수도 있어요).\n\n` +
          `✨ **지금 스킬**\n${skillSlotLines(inst)}`,
        color: EMBED_COLOR,
      },
    ],
    components: [
      row(
        button({ label: '개방하기', emoji: item.emoji, customId: goId, style: 3 }),
        button({ label: '취소', emoji: '❌', customId: backId, style: 2 }),
      ),
    ],
  };
}

function profileView(player, viewerId, isMe, note) {
  const need = expToNext(player.level);
  const levelLine =
    player.level >= MAX_LEVEL
      ? `⭐ **Lv.${player.level}** (MAX)`
      : `⭐ **Lv.${player.level}**  ${expBar(player.exp, need)}  ${player.exp}/${need}`;

  const main = getMainPet(player);
  let mainText = '없음';
  if (main) {
    const pet = PETS[main.petId];
    const s = calcStats(main.petId, main.level);
    const name = main.nickname ?? pet.name;
    mainText =
      `${GRADES[pet.grade].emoji} ${pet.emoji} **${name}** Lv.${main.level}\n` +
      `❤️ ${currentHp(main)}/${s.hp} · 공격 ${s.atk} · 방어 ${s.def} · 속도 ${s.spd}\n` +
      (main.level >= MAX_LEVEL
        ? '⭐ MAX'
        : `⭐ ${expBar(main.exp, expToNext(main.level))}  ${main.exp}/${expToNext(main.level)}`) +
      `\n✨ **스킬** (전투 마나 최대 ${maxMana(main)})\n${skillSlotLines(main)}`;
  }

  const dex = dexProgress(player);

  // 🎫 내 정보를 볼 때만, 개방권이 있고 대표 펫의 5번 슬롯이 아직 잠겨 있으면 버튼을 보여줘요
  const components = [];
  if (isMe && main && !main.slot3 && ticketCount(player) > 0) {
    components.push(
      row(
        button({
          label: `대표 펫 스킬 슬롯 개방 (${ticketCount(player)}개)`,
          emoji: ITEMS[TICKET_ID].emoji,
          customId: `profile:ticket:${viewerId}`,
          style: 1,
        }),
      ),
    );
  }

  return {
    embeds: [
      {
        title: `🪪 ${player.name}님의 정보`,
        description: `${note ? note + '\n\n' : ''}${levelLine}`,
        color: EMBED_COLOR,
        fields: [
          { name: '💰 골드', value: `${player.gold.toLocaleString('ko-KR')}`, inline: true },
          { name: `${BALL.emoji} ${BALL.name}`, value: `${player.inventory?.[BALL.id] ?? 0}개`, inline: true },
          { name: '📖 도감', value: `${dex.found} / ${dex.total}`, inline: true },
          { name: '🐾 보유 펫', value: `${player.pets.length}마리`, inline: true },
          { name: '👑 대표 펫', value: mainText },
        ],
      },
    ],
    components,
  };
}

const profile = {
  data: {
    name: '내정보',
    description: '내 레벨, 재화, 해정펫 정보를 볼 수 있어요.',
    type: 1,
    options: [
      { type: 6, name: '유저', description: '다른 사람의 정보를 보고 싶을 때 선택하세요 (비우면 내 정보)', required: false },
    ],
  },

  async execute(interaction) {
    const me = getUser(interaction);
    const targetId = getOption(interaction, '유저') ?? me.id;
    const isMe = targetId === me.id;

    const player = await getPlayer(targetId);
    if (!player) {
      return reply(
        { content: isMe ? NOT_STARTED : '그 사람은 아직 모험을 시작하지 않았어요.' },
        { ephemeral: true },
      );
    }
    return reply(profileView(player, me.id, isMe));
  },

  components: {
    profile: async function profileHandleButton(interaction, args) {
      const [action, ownerId, uid] = args;
      const user = getUser(interaction);

      if (user.id !== ownerId) {
        return reply({ content: '이 버튼은 연 사람만 쓸 수 있어요 🙅 `/내정보` 로 직접 열어보세요!' }, { ephemeral: true });
      }

      const player = await getPlayer(user.id);
      if (!player) return reply({ content: NOT_STARTED }, { ephemeral: true });

      if (action === 'back') return update(profileView(player, user.id, true));

      // 🎫 [대표 펫 스킬 슬롯 개방] → 확인 화면
      if (action === 'ticket') {
        const main = getMainPet(player);
        if (!main) return reply({ content: '대표 펫이 없어요 🤔' }, { ephemeral: true });
        if (ticketCount(player) <= 0) {
          return reply({ content: `${ITEMS[TICKET_ID].emoji} ${ITEMS[TICKET_ID].name}이(가) 없어요 😭 \`/상점\` 에서 사올 수 있어요!` }, { ephemeral: true });
        }
        if (main.slot3) return update(profileView(player, user.id, true, '이미 5번 슬롯이 열려 있어요!'));
        return update(
          ticketConfirmView(player, main, {
            goId: `profile:ticketgo:${user.id}:${main.uid}`,
            backId: `profile:back:${user.id}`,
          }),
        );
      }

      // ✅ [개방하기] → 실제로 쓰기
      if (action === 'ticketgo') {
        let latest = null;
        const out = await updatePlayer(user.id, (p) => {
          const r = useSkillItem(p, TICKET_ID, uid, null, Date.now());
          latest = p;
          return { commit: r.commit === true, value: r };
        });
        if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
        return update(profileView(latest, user.id, true, skillItemResultText(out)));
      }

      return update({ content: '이 버튼은 이제 쓸 수 없어요 🥲', embeds: [], components: [] });
    },
  },
};

// ═════════════════════════════════════════════
// /장소
// ═════════════════════════════════════════════

const places = {
  data: {
    name: '장소',
    description: '모험할 수 있는 장소 목록을 봐요.',
    type: 1,
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const player = await getPlayer(user.id);
    if (!player) {
      return reply({ content: NOT_STARTED }, { ephemeral: true });
    }

    const blocks = LOCATION_LIST.map((loc) => {
      const open = player.level >= loc.minLevel;
      if (!open) {
        return `🔒 **${loc.name}** — Lv.${loc.minLevel} 이 되면 열려요\n　어떤 펫이 있을까요? ???`;
      }
      const petNames = loc.spawns.map((s) => `${PETS[s.petId].emoji}${PETS[s.petId].name}`).join(', ');
      return (
        `🔓 ${loc.emoji} **${loc.name}** (Lv.${loc.minLevel}+) · 경험치 x${loc.expMultiplier}\n` +
        `　${loc.description}\n　만날 수 있는 펫: ${petNames}`
      );
    });

    return reply({
      embeds: [
        {
          title: '🗺️ 모험 지도',
          description: blocks.join('\n\n'),
          color: EMBED_COLOR,
          footer: { text: '`/탐험` 으로 떠나볼 수 있어요!' },
        },
      ],
    });
  },
};

// ═════════════════════════════════════════════
// /탐험 (+ 버튼 처리)
// ═════════════════════════════════════════════

const explore = {
  data: {
    name: '탐험',
    description: '장소를 골라 야생 해정펫을 찾아 나서요!',
    type: 1,
    options: [
      {
        type: 3,
        name: '장소',
        description: '어디로 떠날까요? (비우면 지난번 장소로 가요)',
        required: false,
        choices: LOCATION_LIST.map((l) => ({ name: `${l.emoji} ${l.name} (Lv.${l.minLevel}+)`, value: l.id })),
      },
    ],
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const picked = getOption(interaction, '장소');

    const out = await updatePlayer(user.id, (p) => {
      // 장소를 안 고르면: 지난번 장소 → (처음이면) 갈 수 있는 가장 좋은 곳
      const best = [...LOCATION_LIST].reverse().find((l) => l.minLevel <= p.level)?.id ?? LOCATION_LIST[0].id;
      const locationId = picked ?? (LOCATIONS[p.lastLocationId] ? p.lastLocationId : best);
      const r = exploreSys.startExploration(p, locationId, Date.now());
      return { commit: r.commit === true, value: r };
    });

    if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
    if (!out.ok) {
      const msg =
        out.reason === 'locked'
          ? `🔒 아직 갈 수 없는 곳이에요! 트레이너 **Lv.${out.minLevel}** 이 되면 열려요.`
          : '그런 장소는 없어요 🤔';
      return reply({ content: msg }, { ephemeral: true });
    }

    if (out.snap.state === 'battle') {
      return reply(exploreViewBattle(out.snap, user.id, '전투가 아직 끝나지 않았어요!'));
    }
    if (out.snap.state === 'encounter') {
      return reply(exploreViewEncounter(out.snap, user.id, '앗, 아직 결정하지 않은 야생 펫이 있어요!'));
    }
    const note = out.resumed
      ? out.sameLocation
        ? '이미 탐험 중이에요! 이어서 해볼까요?'
        : '이미 다른 곳을 탐험 중이에요! 다른 곳으로 가려면 먼저 **[그만두기]** 를 눌러요.'
      : null;
    return reply(exploreViewExploring(out.snap, user.id, note));
  },

    components: {
     explore: exploreHandleButton,
   },
 };
 
// ═════════════════════════════════════════════
// /자동사냥
// ═════════════════════════════════════════════

const autoHuntStopText = (reason) => ({
  too_strong: '⚠️ 이 장소는 나간 펫에게 너무 위험해서 멈췄어요. 펫을 키우거나 더 쉬운 곳으로 가보세요!',
  time: `⏰ 최대 ${AUTO_HUNT_MAX_HOURS}시간을 다 채워서 멈췄어요. 다시 켜면 또 해줘요!`,
  location: '🔒 갈 수 있는 장소가 아니라서 멈췄어요.',
  no_pet: '🐾 싸울 펫이 없어서 멈췄어요.',
}[reason] ?? '');

function autoHuntReportText(rep) {
  const loc = LOCATIONS[rep.locationId];
  const mins = Math.max(0, Math.round(((rep.endedAt ?? rep.startedAt) - rep.startedAt) / 60000));
  const time = mins >= 60 ? `${Math.floor(mins / 60)}시간 ${mins % 60}분` : `${mins}분`;
  const lines = [
    `${loc ? `${loc.emoji} ${loc.name}` : '탐험'} · ${time} 동안 **${rep.runs}번** 대신 탐험했어요`,
    `⚔️ 승리 ${rep.wins}번 · 💨 놓침/물러남 ${rep.runs - rep.wins - (rep.caught ?? 0)}번` + (rep.restMs ? ` · 🛌 휴식 ${Math.round(rep.restMs / 60000)}분` : ''),
    `💰 골드 +${rep.gold.toLocaleString()} · 🎓 트레이너 경험치 +${rep.trainerExp.toLocaleString()} · 🐾 펫 경험치 +${rep.petExp.toLocaleString()}`,
  ];
  if (rep.balls || rep.caught) lines.push(`🔴 포획 **${rep.caught ?? 0}마리**${rep.newPets ? ` (도감 NEW ${rep.newPets})` : ''} · 해정볼 ${rep.balls ?? 0}개 사용`);
  if (rep.trainerLevels > 0) lines.push(`⬆️ 트레이너 레벨 +${rep.trainerLevels}`);
  if (rep.petLevels > 0) lines.push(`⬆️ 펫 레벨 +${rep.petLevels}`);
  if (rep.stopReason) lines.push('', autoHuntStopText(rep.stopReason));
  return lines.join('\n');
}

function autoBar(cur, max, n = 10) {
  const f = Math.max(0, Math.min(n, Math.round((cur / Math.max(1, max)) * n)));
  return '▰'.repeat(f) + '▱'.repeat(n - f);
}

// 지금 뭘 하고 있는지 (정산 결과로 만든 "지금 모습"이에요)
function autoHuntLiveText(player, pet, loc, now) {
  const rep = player.autoHuntReport;
  const run = player.autoHuntPending;
  if (rep?.resting) return '🛌 펫이 체력을 회복하는 중이에요...';
  if (!run) return `🌿 ${loc.emoji} ${loc.name} 에서 야생 펫을 찾는 중...`;
  const w = PETS[run.enc.petId];
  const el = now - run.fightAt;
  if (el < 0) return `🌿 ${loc.emoji} ${loc.name} 에서 야생 펫을 찾는 중... (약 ${Math.ceil(-el / 1000)}초 뒤 만나요)`;
  const f = run.fight;
  const r = Math.min(f.rounds, Math.floor(el / (AUTO_HUNT_SEC_PER_ROUND * 1000)));
  const cur = r > 0 ? f.timeline[r - 1] : { m: f.startHp, w: f.wildMax, ev: null };
  const max = maxHp(pet);
  return [
    `⚔️ ${w.emoji} **${w.name}** Lv.${run.enc.level} 와(과) 전투 중! (${r + 1}턴째)${cur.ev === 'throw' ? ' 🔴 해정볼을 던졌어요!' : ''}`,
    `${PETS[pet.petId].emoji} ${autoBar(cur.m, max)} ${cur.m}/${max}`,
    `${w.emoji} ${autoBar(cur.w, f.wildMax)} ${cur.w}/${f.wildMax}`,
  ].join('\n');
}

// 자동사냥 진행 화면 (켜져 있을 때)
function autoHuntView(player, now, note = null) {
  const loc = LOCATIONS[getAutoHuntLocId(player)];
  const pet = getAutoHuntPet(player);
  const rep = player.autoHuntReport ?? newAutoHuntReport(loc?.id, now);
  if (!loc || !pet) return { embeds: [{ title: '🏃 자동사냥', description: '장소나 펫 정보를 찾을 수 없어요. `/자동사냥` 으로 다시 설정해주세요.', color: 0x99aab5 }], components: [] };

  const balls = player.inventory?.[BALL_ID] ?? 0;
  const lines = [];
  if (note) lines.push(note, '');
  lines.push(
    `${PETS[pet.petId].emoji} **${nameOf(pet)}** Lv.${pet.level} ❤${currentHp(pet, now)}/${maxHp(pet)} · ${loc.emoji} ${loc.name}`,
    `🔴 포획 ${(player.autoHuntCatch ?? true) ? '켜짐 (도감에 없는 펫만)' : '꺼짐'} · 해정볼 ${balls}개`,
    '',
    autoHuntLiveText(player, pet, loc, now),
    '',
    `📊 **${rep.runs}번** 탐험 · ⚔️ 승리 ${rep.wins} · 🔴 포획 ${rep.caught ?? 0} · 💰 +${rep.gold.toLocaleString()} · 🎓 +${rep.trainerExp.toLocaleString()} · 🐾 +${rep.petExp.toLocaleString()}`,
  );
  const feed = [...(rep.feed ?? [])].reverse();
  if (feed.length) lines.push('', '**최근 기록**', ...feed);
  return {
    embeds: [{ title: '🏃 자동사냥 진행 중', description: lines.join('\n'), color: 0xf1c40f, footer: { text: '봇은 백그라운드로 못 돌아서, [새로고침]을 누르면 지금까지의 진행을 계산해서 보여줘요' } }],
    components: [row(
      button({ label: '새로고침', emoji: '🔄', customId: `autohunt:refresh:${player.userId}`, style: 2 }),
      button({ label: '종료하고 결과 받기', emoji: '⏹', customId: `autohunt:stop:${player.userId}`, style: 4 }),
    )],
  };
}

function autoHuntEndEmbed(report) {
  return { title: '🛑 자동사냥 종료', description: report ? autoHuntReportText(report) : '자리를 비운 사이 한 일이 아직 없어요.', color: 0x99aab5 };
}

const autoHuntCmd = {
  data: {
    name: '자동사냥',
    description: '자리를 비운 동안 펫이 대신 탐험하고 도감에 없는 펫은 잡아와요 (보상 -80%).',
    type: 1,
    options: [
      { type: 3, name: '장소', description: '대신 탐험할 장소 (비우면 지난번에 고른 장소, 없으면 마지막으로 간 장소)', required: false, autocomplete: true },
      { type: 3, name: '펫', description: '대신 싸울 펫 (비우면 지난번에 고른 펫, 없으면 대표 펫)', required: false, autocomplete: true },
      { type: 5, name: '포획', description: '도감에 없는 펫을 해정볼로 잡을지 (기본: 켜짐)', required: false },
    ],
  },

  async autocomplete(interaction) {
    const focused = interaction.data.options?.find((o) => o.focused);
    if (focused?.name !== '장소') return petAutocomplete(interaction, '펫');
    const player = await getPlayer(getUser(interaction).id);
    if (!player) return autocompleteResult([]);
    const typed = String(focused.value ?? '').trim().toLowerCase();
    return autocompleteResult(
      LOCATION_LIST.filter((l) => player.level >= l.minLevel && (!typed || l.name.toLowerCase().includes(typed)))
        .map((l) => ({ name: `${l.emoji} ${l.name} (Lv.${l.minLevel}+)`, value: l.id })),
    );
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const selector = getOption(interaction, '펫');
    const locOpt = getOption(interaction, '장소');
    const catchOpt = getOption(interaction, '포획');
    const now = Date.now();

    const out = await updatePlayer(user.id, (player) => {
      const inst = selector ? resolvePetSelector(player, selector) : null;
      if (selector && !inst) return { commit: false, value: { kind: 'pet_not_found' } };
      const r = controlAutoHunt(player, now, { petUid: inst?.uid ?? null, locId: locOpt ?? null, catchOn: catchOpt ?? null });
      if (['on', 'settings', 'status'].includes(r.kind)) {
        const note = { on: `🏃 **자동사냥 시작!** 보상은 **-${pct(1 - AUTO_HUNT_REWARD_MULT)}%** 예요. (직접 \`/탐험\` 하는 건 그대로)\n최대 ${AUTO_HUNT_MAX_HOURS}시간 · 펫이 위험하면 쉬어요 · 회복약·스킬은 안 써요`, settings: '✅ 설정을 바꿨어요! 새 설정으로 이어서 해요.', status: null }[r.kind];
        r.msg = autoHuntView(player, now, note);
      }
      return { commit: !!r.commit, value: r };
    });

    if (!out) return reply({ content: NOT_STARTED }, { ephemeral: true });

    if (out.kind === 'pet_not_found') return reply({ content: PET_NOT_FOUND }, { ephemeral: true });
    if (out.kind === 'loc_not_found') return reply({ content: '🗺️ 그 장소를 찾을 수 없어요! 입력하면 목록이 떠요.' }, { ephemeral: true });
    if (out.kind === 'no_location') return reply({ content: '🌿 먼저 `/탐험` 으로 한 번 다녀오거나, `/자동사냥 장소:` 로 장소를 골라주세요!' }, { ephemeral: true });
    if (out.kind === 'locked') return reply({ content: `🔒 그 장소는 Lv.${out.minLevel} 이 되어야 갈 수 있어요.` }, { ephemeral: true });
    if (out.kind === 'no_pet') return reply({ content: '🐾 싸울 펫이 없어요!' }, { ephemeral: true });
    if (out.kind === 'weak_pet') return reply({ content: '❤️ 나갈 펫의 체력이 너무 낮아요! 회복시키거나 다른 펫을 골라주세요.' }, { ephemeral: true });
    if (out.kind === 'report') {
      return reply({ embeds: [{ title: '🏃 자동사냥 결과', description: autoHuntReportText(out.report) + '\n\n다시 켜려면 `/자동사냥` 을 한 번 더 눌러주세요!', color: 0xf1c40f }] });
    }
    return reply(out.msg); // on / settings / status
  },

  components: {
    autohunt: async function autoHuntHandleButton(interaction, args) {
      const [action, ownerId] = args;
      const user = getUser(interaction);
      if (user.id !== ownerId) {
        return reply({ content: '이 패널은 시작한 사람만 쓸 수 있어요 🙅 `/자동사냥` 으로 직접 시작해보세요!' }, { ephemeral: true });
      }
      const now = Date.now();
      const out = await updatePlayer(user.id, (player) => {
        if (action === 'stop') {
          const r = stopAutoHunt(player);
          return { commit: !!r.commit, value: r };
        }
        // 새로고침: 정산은 updatePlayer 가 이미 했어요
        return { commit: false, value: { kind: 'view', msg: player.autoHunt ? autoHuntView(player, now) : null } };
      });
      if (!out) return reply({ content: NOT_STARTED }, { ephemeral: true });

      if (out.kind === 'off') return update({ embeds: [autoHuntEndEmbed(out.report)], components: [] });
      if (out.kind === 'not_running' || !out.msg) {
        return update({ embeds: [{ title: '🏃 자동사냥', description: '자동사냥이 꺼져 있어요. 결과는 `/자동사냥` 으로 확인할 수 있어요!', color: 0x99aab5 }], components: [] });
      }
      return update(out.msg);
    },
  },
};

// ───────── 탐험 화면 그리기 ─────────

// 채팅이 쌓여서 패널이 안 보일 때, 채널 맨 아래로 다시 올려주는 버튼이에요
function bumpButton(userId, snapId) {
  return button({ label: '아래로', emoji: '🔽', customId: `explore:bump:${userId}:${snapId}`, style: 2 });
}

// 🔭 망원경으로 미리 본 펫 안내 글자
function scoutText(snap) {
  if (!snap.scout) return '';
  const pet = PETS[snap.scout.petId];
  const aura = GRADE_EFFECTS[pet.grade].aura;
  return `\n\n🔭 **예고!** ${GRADES[pet.grade].emoji} ${pet.emoji} **${pet.name}** (Lv.${snap.scout.level}) 이(가) 나올 것 같아요!${aura ? `\n${aura}` : ''}`;
}

// 🔬 분석기 결과 + ✨ 적용 중인 포획 아이템 안내 글자
function catchInfoText(snap) {
  const it = snap.items;
  if (!it) return '';
  const lines = [];
  const buffs = [];
  if (it.bonus > 0) buffs.push(`🍖 포획 ×${(1 + it.bonus).toFixed(1)}`);
  if (it.charm) buffs.push('🍀 부적 (다음 1회)');
  if (it.net) buffs.push(`🕸️ 그물 (도망 -${pct(CATCH_NET_FLEE_REDUCE)}%p)`);
  if (buffs.length) lines.push(`✨ 적용 중: ${buffs.join(' · ')}`);
  if (it.analyzed) {
    const d = catchDifficulty(snap.chance, snap.rawChance);
    lines.push(`🔬 **포획 분석** — 다음 던지기 성공 확률 **${chancePctText(snap.chance)}%** (${d.emoji} ${d.label}) · 실패하면 도망 확률 ${pct(it.fleeNext)}%${deficitText(snap.rawChance)}`);
  }
  return lines.length ? `\n\n${lines.join('\n')}` : '';
}

// 가진 포획 아이템 버튼 줄 (하나도 없으면 줄이 안 생겨요)
function catchItemRows(snap, userId) {
  const owned = snap.items?.owned ?? {};
  const btns = CATCH_ITEMS.filter((i) => owned[i.id] > 0).map((i) =>
    button({ label: `${i.short} ×${owned[i.id]}`, emoji: i.emoji, customId: `explore:citem:${userId}:${snap.id}:${i.id}`, style: 2 }),
  );
  return btns.length ? [row(...btns)] : [];
}

// 🆕 전투 중 스킬 버튼 줄 (비어 있지 않은 슬롯만 보여줘요, 마나가 모자라면 회색)
function skillRows(snap, userId) {
  const b = snap.battle;
  if (!b) return [];
  const btns = SLOT_IDX
    .filter((i) => SKILLS[b.skills?.[i]])
    .map((i) => {
      const sk = SKILLS[b.skills[i]];
      return button({
        label: `${sk.name} (${sk.cost})`,
        emoji: sk.emoji,
        customId: `explore:skillask:${userId}:${snap.id}:${i}`, // 누르면 설명 + 사용 확인창이 먼저 떠요
        style: 1,
        disabled: b.myMana < sk.cost,
      });
    });
  return btns.length ? [row(...btns)] : [];
}

// 포획 아이템을 못 썼을 때 안내
function catchItemFailText(out) {
  switch (out.kind) {
    case 'unknown': return '그런 건 쓸 수 없어요 🤔';
    case 'none': return `${out.item.emoji} ${out.item.name}이(가) 없어요 😭 \`/상점\` 에서 사올 수 있어요!`;
    case 'no_explore': return '🌿 탐험 중일 때만 쓸 수 있어요! `/탐험` 으로 먼저 떠나요.';
    case 'no_encounter': return '아직 야생 펫이 나타나지 않았어요! 펫을 만난 뒤에 쓸 수 있어요. (아이템은 안 줄었어요)';
    case 'bait_max': return `${out.item.emoji} 이번 만남의 미끼 효과가 이미 **최대**예요! 더 줘도 소용없어서 아껴뒀어요 😊`;
    case 'charm_active': return `${out.item.emoji} 부적이 이미 켜져 있어요! 한 번 던진 뒤에 다시 쓸 수 있어요. (아이템은 안 줄었어요)`;
    case 'net_active': return `${out.item.emoji} 그물이 이미 쳐져 있어요! (아이템은 안 줄었어요)`;
    case 'use_button': return '⚔️ 전투 중에는 전투 화면 아래의 **아이템 버튼**으로 써요! (한 턴을 써요)';
    default: return '지금은 쓸 수 없어요 🤔';
  }
}

function exploreViewExploring(snap, userId, note) {
  const loc = LOCATIONS[snap.locationId];
  const wait =
    snap.remainingSec > 0
      ? `주변을 살피는 중이에요... 🔍\n무언가 나타날 때까지 약 **${snap.remainingSec}초** 남았어요.\n시간이 지나면 **[살펴보기]** 를 눌러요!`
      : `수풀이 부스럭거려요... 👀\n**[살펴보기]** 를 눌러보세요!`;
  return {
    embeds: [{ title: `${loc.emoji} ${loc.name} 탐험 중`, description: `${note ? note + '\n\n' : ''}${wait}${scoutText(snap)}`, color: EMBED_COLOR }],
    components: [
      row(
        button({ label: '살펴보기', emoji: '👀', customId: `explore:look:${userId}:${snap.id}`, style: 1 }),
        button({ label: '그만두기', emoji: '🚪', customId: `explore:quit:${userId}:${snap.id}`, style: 2 }),
        bumpButton(userId, snap.id),
      ),
    ],
  };
}

function exploreViewEncounter(snap, userId, note) {
  const pet = PETS[snap.encounter.petId];
  const grade = GRADES[pet.grade];
  const loc = LOCATIONS[snap.locationId];
  return {
    embeds: [
      {
        title: `❗ 야생의 ${pet.emoji} ${pet.name}(이)가 나타났다!`,
        description:
          `${note ? note + '\n\n' : ''}${grade.emoji} **${grade.name}** 등급 · **Lv.${snap.encounter.level}**` +
          (GRADE_EFFECTS[pet.grade].aura ? `\n\n**${GRADE_EFFECTS[pet.grade].aura}**\n(내 공격이 빗나가기 쉽고, 도망치기도 어려워요!)` : '') +
          catchInfoText(snap),
        color: 0xfee75c,
        fields: [
          { name: `${BALL.emoji} ${BALL.name}`, value: `${snap.balls}개`, inline: true },
          { name: '📍 장소', value: `${loc.emoji} ${loc.name}`, inline: true },
        ],
      },
    ],
    components: [
      row(
        button({ label: '잡기', emoji: BALL.emoji, customId: `explore:catch:${userId}:${snap.id}`, style: 3 }),
        button({ label: '싸우기', emoji: '⚔️', customId: `explore:fight:${userId}:${snap.id}`, style: 4 }),
        button({ label: '무시하기', emoji: '👋', customId: `explore:ignore:${userId}:${snap.id}`, style: 2 }),
        bumpButton(userId, snap.id),
      ),
      ...catchItemRows(snap, userId),
    ],
  };
}

function exploreHpBar(cur, max, size = 10) {
  const filled = cur <= 0 ? 0 : Math.max(1, Math.min(size, Math.ceil((cur / max) * size)));
  return '▰'.repeat(filled) + '▱'.repeat(size - filled);
}

function exploreViewBattle(snap, userId, note) {
  const wild = PETS[snap.encounter.petId];
  const mine = PETS[snap.battle.myPetId];
  const b = snap.battle;
  return {
    embeds: [
      {
        title: `⚔️ ${mine.emoji} ${b.myName} VS ${wild.emoji} ${wild.name}`,
        description:
          `${note ? note + '\n\n' : ''}${b.round}턴째 · 약해질수록 **[잡기]** 가 쉬워져요!` +
          `\n🔋 내 마나 **${b.myMana}** / ${maxMana(getMainPetFromSnap(snap))}` +
          (GRADE_EFFECTS[wild.grade].aura ? `\n${GRADE_EFFECTS[wild.grade].aura}` : '') +
          catchInfoText(snap),
        color: 0xed4245,
        fields: [
          { name: `${mine.emoji} ${b.myName} Lv.${b.myLevel}`, value: `${exploreHpBar(b.myHp, b.myMax)}\n${b.myHp}/${b.myMax}${statusText(b.mySt) ? `\n${statusText(b.mySt)}` : ''}`, inline: true },
          { name: `${wild.emoji} ${wild.name} Lv.${snap.encounter.level}`, value: `${exploreHpBar(b.wildHp, b.wildMax)}\n${b.wildHp}/${b.wildMax}${statusText(b.wildSt) ? `\n${statusText(b.wildSt)}` : ''}`, inline: true },
          { name: `${BALL.emoji} ${BALL.name}`, value: `${snap.balls}개`, inline: false },
        ],
      },
    ],
    components: [
      row(
        button({ label: '공격', emoji: '⚔️', customId: `explore:attack:${userId}:${snap.id}`, style: 4 }),
        button({ label: '잡기', emoji: BALL.emoji, customId: `explore:catch:${userId}:${snap.id}`, style: 3 }),
        button({ label: '회복', emoji: '🧪', customId: `explore:heal:${userId}:${snap.id}`, style: 1 }),
        button({ label: '도망', emoji: '🏃', customId: `explore:run:${userId}:${snap.id}`, style: 2 }),
        bumpButton(userId, snap.id),
      ),
      ...skillRows(snap, userId),
      row(
        button({ label: '교체', emoji: '🔄', customId: `explore:swap:${userId}:${snap.id}`, style: 1 }),
      ),
      ...catchItemRows(snap, userId),
    ],
  };
}

// ✨ 스킬 설명 + "사용할까요?" 확인 화면 (스킬 버튼을 누르면 바로 쓰지 않고 이 화면이 먼저 떠요)
function exploreViewSkillConfirm(snap, userId, slot) {
  const b = snap.battle;
  const sk = SKILLS[b.skills?.[slot]];
  const wild = PETS[snap.encounter.petId];
  const mine = PETS[b.myPetId];
  const maxM = maxMana(getMainPetFromSnap(snap));
  const enough = b.myMana >= sk.cost;
  const after = Math.max(0, b.myMana - sk.cost);
  const effects = skillEffectLines(sk);
  return {
    embeds: [
      {
        title: `✨ ${sk.emoji} ${sk.name} — 이 스킬을 쓸까요?`,
        description:
          `${tierStars(sk.tier)} · ${skillCategory(sk)}${sk.pet ? ` · ${mine.emoji} ${b.myName} 전용기` : ''} · ${slot + 1}번 슬롯\n` +
          (sk.flavor ? `*${sk.flavor}*\n` : '') +
          `\n**📖 스킬 효과**\n${effects.length ? effects.map((t) => `• ${t}`).join('\n') : '• 효과 없음'}\n\n` +
          `🔋 마나 **${sk.cost}** 소모 (지금 ${b.myMana} → 사용 후 ${after} / 최대 ${maxM})\n` +
          `⏱️ 스킬을 쓰면 **이번 턴이 끝나고** ${wild.emoji} ${wild.name}(이)가 반격해요. 스킬을 쓴 턴에는 마나가 차지 않아요! (기본 공격을 해야 마나 +${SKILL_CFG.manaPerTurn})\n` +
          `💫 기절 중이면 스킬이 나가지 않아요 (마나는 그대로).` +
          (enough ? '' : `\n\n⚠️ **마나가 모자라요!** (필요 ${sk.cost} / 현재 ${b.myMana})`),
        color: 0x5865f2,
        fields: [
          { name: `${mine.emoji} ${b.myName} Lv.${b.myLevel}`, value: `${exploreHpBar(b.myHp, b.myMax)}\n${b.myHp}/${b.myMax}${statusText(b.mySt) ? `\n${statusText(b.mySt)}` : ''}`, inline: true },
          { name: `${wild.emoji} ${wild.name} Lv.${snap.encounter.level}`, value: `${exploreHpBar(b.wildHp, b.wildMax)}\n${b.wildHp}/${b.wildMax}${statusText(b.wildSt) ? `\n${statusText(b.wildSt)}` : ''}`, inline: true },
        ],
      },
    ],
    components: [
      row(
        button({ label: '사용하기', emoji: '✅', customId: `explore:skillgo:${userId}:${snap.id}:${slot}`, style: 3, disabled: !enough }),
        button({ label: '취소', emoji: '❌', customId: `explore:skillno:${userId}:${snap.id}`, style: 2 }),
      ),
    ],
  };
}

// 전투 화면에서 대표 펫의 최대 마나를 알려줄 때 쓰는 도우미 (스냅샷에는 펫 정보가 없어서 이름으로만 찾아요)
function getMainPetFromSnap(snap) {
  return snap.battle?.mainRef ?? { manaBonus: 0 };
}

// 🔄 교체 화면 — 대표 펫 말고, 체력이 남은 펫 중에서 골라요
function exploreViewSwap(player, snap, userId, note) {
  const now = Date.now();
  const wild = PETS[snap.encounter.petId];
  const cands = player.pets
    .map((inst, i) => ({ inst, index: i + 1 }))
    .filter((c) => c.inst.uid !== player.mainPetUid && currentHp(c.inst, now) > 0)
    .slice(0, 25);

  const header = `${note ? note + '\n\n' : ''}누구와 바꿀까요?\n⚠️ 교체도 **한 턴**을 써요! 새로 나온 펫이 ${wild.emoji} ${wild.name}의 공격을 맞아요.`;
  const cancel = button({ label: '취소', emoji: '↩️', customId: `explore:swapno:${userId}:${snap.id}`, style: 2 });

  if (cands.length === 0) {
    return {
      embeds: [{ title: '🔄 교체', description: `${header}\n\n😢 바꿀 수 있는 펫이 없어요. (대표 펫 말고 체력이 남은 펫이 있어야 해요)`, color: 0xfee75c }],
      components: [row(cancel)],
    };
  }

  const lines = cands.map(({ inst, index }) => {
    const pet = PETS[inst.petId];
    return `**${index}.** ${GRADES[pet.grade].emoji} ${pet.emoji} **${inst.nickname ?? pet.name}** Lv.${inst.level} · ❤️ ${currentHp(inst, now)}/${maxHp(inst)}`;
  });
  return {
    embeds: [{ title: '🔄 교체', description: `${header}\n\n${lines.join('\n')}`, color: 0xfee75c }],
    components: [
      row(
        select({
          customId: `explore:swapgo:${userId}:${snap.id}`,
          placeholder: '🔄 나올 펫을 골라요',
          options: cands.map(({ inst, index }) => {
            const pet = PETS[inst.petId];
            return {
              label: `${index}. ${inst.nickname ?? pet.name} Lv.${inst.level}`,
              value: inst.uid,
              description: `❤️ ${currentHp(inst, now)}/${maxHp(inst)} · ${GRADES[pet.grade].name} 등급`,
              emoji: pet.emoji,
            };
          }),
        }),
      ),
      row(cancel),
    ],
  };
}

// 🧪 회복약 고르기 — 약을 2종류 이상 가졌을 때 [회복] 을 누르면 떠요 (아직 턴은 안 써요)
// 고른 값 모양: "약id:개수" (약id 가 auto 면 알맞은 약을 알아서, 개수가 full 이면 가득 찰 때까지)
function potionPickOptions(player, missing, withCounts = true) {
  const owned = ownedPotions(player);
  const options = [
    { label: withCounts ? '🤖 알아서 (알맞은 약 1개)' : '🤖 알아서 (알맞은 약으로)', value: 'auto:1', description: '모자란 체력에 딱 맞는 약을 골라요' },
  ];
  if (withCounts) options.push({ label: '🤖 알아서 (가득 찰 때까지)', value: 'auto:full', description: `한 번에 최대 ${HEAL_FULL_CAP}개까지` });
  for (const p of owned) {
    const have = player.inventory[p.id];
    const heal = p.heal >= 9999 ? '체력 전부' : `체력 +${p.heal}`;
    options.push({ label: withCounts ? `${p.name} ×1 (가진 ${have}개)` : `${p.name} (가진 ${have}개)`, value: `${p.id}:1`, description: heal, emoji: p.emoji });
    if (withCounts && have >= 3 && p.heal < missing) {
      options.push({ label: `${p.name} ×3 (가진 ${have}개)`, value: `${p.id}:3`, description: `${heal} × 3`, emoji: p.emoji });
    }
  }
  return options.slice(0, 25);
}

function potionListText(player) {
  return ownedPotions(player)
    .map((p) => `${p.emoji} **${p.name}** ×${player.inventory[p.id]} — ${p.heal >= 9999 ? '체력 전부 회복' : `체력 +${p.heal}`}`)
    .join('\n');
}

function exploreViewHealPick(player, snap, userId, note) {
  const b = snap.battle;
  const missing = b.myMax - b.myHp;
  const wild = PETS[snap.encounter.petId];
  return {
    embeds: [
      {
        title: '🧪 어떤 약을 쓸까요?',
        description:
          `${note ? note + '\n\n' : ''}❤️ **${b.myHp}/${b.myMax}** (모자란 체력 ${missing})\n\n${potionListText(player)}\n\n` +
          `⚠️ 약을 먹는 것도 **한 턴**을 써요! ${wild.emoji} ${wild.name}이(가) 한 번 공격해요.`,
        color: 0x57f287,
      },
    ],
    components: [
      row(
        select({
          customId: `explore:healpick:${userId}:${snap.id}`,
          placeholder: '🧪 쓸 약을 골라요',
          options: potionPickOptions(player, missing),
        }),
      ),
      row(button({ label: '취소', emoji: '↩️', customId: `explore:healno:${userId}:${snap.id}`, style: 2 })),
    ],
  };
}

function exploreViewSnap(snap, userId, note) {
  if (snap.state === 'battle') return exploreViewBattle(snap, userId, note);
  if (snap.state === 'encounter') return exploreViewEncounter(snap, userId, note);
  return exploreViewExploring(snap, userId, note);
}

// 부스트 / 탐험 시간 감소 사용 결과 안내
function boostResultText(out) {
  if (out.kind === 'unknown') return '그런 건 쓸 수 없어요 🤔';
  if (out.kind === 'none') return `${out.item.emoji} ${out.item.name}이(가) 없어요 😭 \`/구매\` 나 \`/상점\` 에서 사올 수 있어요!`;
  if (out.kind === 'no_explore') return '🌿 탐험 중일 때만 쓸 수 있어요! `/탐험` 으로 먼저 떠나요.';
  if (out.kind === 'already_appeared') return '이미 야생 펫이 나타났어요! 이 아이템은 펫을 기다리는 동안에만 쓸 수 있어요.';
  if (out.kind === 'not_visited') {
    const l = LOCATIONS[out.locationId];
    return `🔭 아직 한 번도 만나보지 못한 곳이라서 미리 볼 수 없어요!\n${l.emoji} **${l.name}** 에서 야생 펫을 한 번 만나고 나면 다음부터 쓸 수 있어요. (아이템은 안 줄었어요)`;
  }
  if (out.kind === 'scouted' || out.kind === 'already_scouted') {
    const pet = PETS[out.encounter.petId];
    const aura = GRADE_EFFECTS[pet.grade].aura;
    return (
      `${out.item.emoji} **${out.item.name}** 으로 멀리 살펴봤어요!\n` +
      `${GRADES[pet.grade].emoji} ${pet.emoji} **${pet.name}** (Lv.${out.encounter.level}) 이(가) 나올 거예요!` +
      (aura ? `\n${aura}` : '') +
      (out.kind === 'scouted' ? `\n(남은 ${out.item.name} ${out.left}개)` : '\n(이미 본 예고예요. 아이템은 안 줄었어요)') +
      '\n**[살펴보기]** 를 눌러서 만나봐요!'
    );
  }
  if (out.kind === 'too_short') {
    return '⏳ 이미 다 기다렸어요! **[살펴보기]** 를 눌러서 만나봐요 😊';
  }
  if (out.kind === 'boosted') {
    const where = out.item.boost === 'trainerExp' ? '전투 승리·포획 때 트레이너 경험치' : '전투 승리 때 대표 펫 경험치';
    return `${out.item.emoji} **${out.item.name}** ${out.used}개를 켰어요!\n앞으로 **${out.charges}번** ${where}에 +${pct(BOOST_PCT)}%가 붙어요. (남은 ${out.item.name} ${out.left}개)`;
  }
  return (
    `${out.item.emoji} **${out.item.name}** 을(를) 썼어요! 남은 대기 시간 약 ${out.before}초 → **바로 나타나요!**` +
    `\n(남은 ${out.item.name} ${out.left}개) **[살펴보기]** 를 눌러봐요!`
  );
}

// 🎫 스킬 슬롯 개방권 / 🔄 스킬 변경권 사용 결과 안내
function skillItemResultText(out) {
  if (out.kind === 'unknown') return '그런 아이템은 없어요 🤔';
  if (out.kind === 'not_found') return '그 펫을 찾을 수 없어요 🤔 번호나 이름을 다시 확인해주세요! (`/펫` 에서 확인 가능)';
  if (out.kind === 'none') return `${out.item.emoji} ${out.item.name}이(가) 없어요 😭 \`/상점\` 에서 사올 수 있어요!`;
  if (out.kind === 'already_open') return '이미 5번 슬롯이 열려 있어요! 스킬을 바꾸고 싶으면 🔄 **스킬 변경권**을 써보세요.';
  if (out.kind === 'bad_slot') return '그 슬롯은 아직 안 열려 있어요! `/사용` 의 **슬롯** 칸에 이미 열린 번호(1~5)를 적어주세요. (`/펫` 에서 확인 가능)';
  if (out.kind === 'empty_slot') return '그 슬롯은 아직 비어 있어요! (스킬이 있어야 바꿀 수 있어요)';
  if (out.kind === 'no_skill_left') return '더 뽑을 수 있는 스킬이 없어요 🤔';
  const pet = PETS[out.inst.petId];
  const name = out.inst.nickname ?? pet.name;
  if (out.kind === 'slot_opened') {
    return `🎫 ${GRADES[pet.grade].emoji} ${pet.emoji} **${name}**의 **5번 스킬 슬롯**이 열렸어요!\n✨ ${out.skill.emoji} **${out.skill.name}** (마나 ${out.skill.cost}) ${tierStars(out.skill.tier)} 를 배웠어요!`;
  }
  return `🔄 ${GRADES[pet.grade].emoji} ${pet.emoji} **${name}**의 ${out.before.emoji} **${out.before.name}** 이(가) ${out.skill.emoji} **${out.skill.name}** (마나 ${out.skill.cost}) ${tierStars(out.skill.tier)} 로 바뀌었어요!`;
}

// 자동 회복(autoHeal) 결과를 한 줄 안내로 바꿔요
function healResultText(out) {
  if (out.kind === 'not_found') return '그 펫을 찾을 수 없어요 🤔 번호나 이름을 다시 확인해주세요! (`/펫` 에서 확인 가능)';
  if (out.kind === 'in_battle') return '⚔️ 전투 중에는 전투 화면의 **[회복]** 버튼으로만 쓸 수 있어요!';
  if (out.kind === 'none') return '🧪 회복약이 없어요 😭 `/구매` 나 `/상점` 에서 사올 수 있어요!';
  const pet = PETS[out.inst.petId];
  const name = `${GRADES[pet.grade].emoji} ${pet.emoji} **${out.inst.nickname ?? pet.name}**`;
  if (out.kind === 'full') return `${name}의 체력은 이미 가득해요! 약을 아껴뒀어요 😊`;
  return (
    `${potionSummary(out.used)} 를 먹였어요! (❤️ +${out.after - out.before})\n` +
    `${name} ❤️ ${out.before} → **${out.after}/${out.max}**` +
    (out.after < out.max ? '\n(약이 모자라서 여기까지 채웠어요)' : '')
  );
}

// 🧪 [체력 회복] 에서 약을 고르는 화면 (전투 밖, 나한테만 보여요)
function restPickView(player, userId, pet) {
  const pd = PETS[pet.petId];
  const name = `${GRADES[pd.grade].emoji} ${pd.emoji} **${pet.nickname ?? pd.name}**`;
  return {
    content:
      `🧪 ${name} 에게 어떤 약을 먹일까요? (❤️ ${currentHp(pet, Date.now())}/${maxHp(pet)})\n\n${potionListText(player)}\n\n` +
      '고른 약으로 **가득 찰 때까지** 먹여요.',
    components: [
      row(
        select({
          customId: `explore:restgo:${userId}:-`,
          placeholder: '🧪 쓸 약을 골라요',
          options: potionPickOptions(player, 0, false).map((o) => ({ ...o, value: o.value.replace(/:1$/, '') })),
        }),
      ),
    ],
  };
}

const exploreViewExpired = () =>
  update({
    embeds: [{ title: '🍃 이미 지나간 탐험이에요', description: '`/탐험` 으로 새로 떠나보세요!', color: 0x99aab5 }],
    components: [],
  });

// 탐험이 끝난 화면 맨 아래에 붙는 버튼: 같은 곳 다시 탐험 / 체력 한 번에 회복
function afterBattleComponents(userId, locationId) {
  const loc = LOCATIONS[locationId];
  if (!loc) return [];
  return [
    row(
      button({ label: `다시 탐험 (${loc.name})`, emoji: '🌿', customId: `explore:again:${userId}:${locationId}`, style: 3 }),
      button({ label: '체력 회복', emoji: '🧪', customId: `explore:rest:${userId}:-`, style: 1 }),
    ),
  ];
}

// 전투가 끝났을 때(승리/패배/무승부) 화면 — [공격]/[회복]/[잡기]/[스킬] 중 무엇으로 끝났든 똑같이 써요
function battleOutcomeView(out, userId) {
  if (out.kind === 'won') {
    const wild = PETS[out.wildPetId];
    const mine = PETS[out.myPetId];
    const lines = [
      out.log.join('\n'),
      '',
      `${wild.emoji} **${wild.name}** (Lv.${out.wildLevel}) 을(를) 쓰러뜨렸어요!`,
      out.bonusMult === 3 ? '🌟🎰 **대박!! 경험치·골드 3배 보너스!** 🎰🌟' : null,
      out.bonusMult === 2 ? '✨ **럭키! 경험치·골드 2배 보너스!** ✨' : null,
      `💰 골드 +${out.gold}`,
      `⭐ 트레이너 경험치 +${out.trainerExp}`,
      out.trainerBoost ? `🌟 트레이너 경험치 부스트 +${pct(BOOST_PCT)}% 적용! (남은 ${out.boostsLeft.trainerExp ?? 0}회)` : null,
      out.levelsGained > 0 ? `🎊 **트레이너 레벨 업!** → Lv.${out.newLevel}` : null,
      `${mine.emoji} ${out.myName} 경험치 +${out.petExp}`,
      out.petBoost ? `💫 펫 경험치 부스트 +${pct(BOOST_PCT)}% 적용! (남은 ${out.boostsLeft.petExp ?? 0}회)` : null,
      out.petLevelsGained > 0 ? `🎊 **${out.myName} 레벨 업!** → Lv.${out.petNewLevel} (체력 가득!)` : null,
      `❤️ ${out.myName} 체력 ${out.petHp}/${out.petMaxHp}`,
      ...out.unlocked.map((l) => `🔓 새 장소 열림: ${l.emoji} **${l.name}**`),
      '\n`/탐험` 으로 계속 모험해요! 체력이 모자라면 `/사용` 으로 회복해요.',
    ].filter((x) => x !== null);
    return update({ embeds: [{ title: '🏆 승리!', description: lines.join('\n'), color: 0x57f287 }], components: afterBattleComponents(userId, out.locationId) });
  }

  if (out.kind === 'lost') {
    const wild = PETS[out.wildPetId];
    const removed = PETS[out.removedPetId];
    const lines = [
      out.log.join('\n'),
      '',
      `${wild.emoji} ${wild.name}에게 지고 말았어요... 골드는 잃지 않았어요.`,
      `💔 ${removed.emoji} **${out.myName}**(이)가 쓰러져서 영영 떠나갔어요.`,
      out.newStarterId
        ? `\n${PETS[out.newStarterId].emoji} 다행히 새 ${PETS[out.newStarterId].name}(이)가 곁에 남아줬어요! \`/펫\` 으로 확인해보세요.`
        : '\n`/펫` 에서 다른 펫을 대표로 바꿔 계속 모험할 수 있어요!',
    ];
    return update({
      embeds: [{ title: `😵 ${removed.emoji} ${out.myName}(이)가 쓰러졌어요...`, description: lines.join('\n'), color: 0xed4245 }],
      components: afterBattleComponents(userId, out.locationId),
    });
  }

  if (out.kind === 'wild_flee') {
    const wild = PETS[out.wildPetId];
    return update({
      embeds: [{
        title: `💨 ${wild.emoji} ${wild.name}(이)가 겁에 질려 도망쳤어요!`,
        description: `${out.log.join('\n')}\n\n\`/탐험\` 으로 다시 떠나볼 수 있어요!`,
        color: 0x99aab5,
      }],
      components: afterBattleComponents(userId, out.locationId),
    });
  }

  if (out.kind === 'draw') {
    const wild = PETS[out.wildPetId];
    return update({
      embeds: [{
        title: `💨 ${wild.emoji} ${wild.name}(이)가 지쳐서 떠났어요`,
        description: `${out.log.join('\n')}\n\n승부가 나지 않았어요. \`/탐험\` 으로 다시 도전해봐요!`,
        color: 0x99aab5,
      }],
      components: afterBattleComponents(userId, out.locationId),
    });
  }

  return null; // won/lost/draw 가 아니면 이 화면을 쓰지 않아요
}

// ───────── 탐험 버튼 처리 ─────────

async function exploreHandleButton(interaction, args) {
  let [action, ownerId, id, extra] = args;
  const user = getUser(interaction);
  let count = null;

  if (user.id !== ownerId) {
    return reply({ content: '이 버튼은 탐험을 시작한 사람만 누를 수 있어요 🙅' }, { ephemeral: true });
  }

  // [✏️ 직접 입력] — 숫자 입력창을 띄워요
  if (action === 'ask') {
    const texts = {
      attack: { title: '몇 턴 공격할까요?', label: '공격할 턴 수', placeholder: `1 ~ ${BATTLE_MAX_ROUNDS}` },
      catch: { title: '해정볼을 몇 개 던질까요?', label: '던질 개수', placeholder: `1 ~ ${MAX_CUSTOM_COUNT}` },
      heal: { title: '회복약을 몇 개 쓸까요?', label: '쓸 개수', placeholder: `1 ~ ${MAX_CUSTOM_COUNT}` },
    };
    if (!Object.hasOwn(texts, extra)) return reply({ content: '이 버튼은 이제 쓸 수 없어요 🥲' }, { ephemeral: true });
    return numberModal({ customId: `explore:go:${ownerId}:${id}:${extra}`, ...texts[extra] });
  }

  // 입력창 제출 — 적은 숫자만큼 실행해요
  if (action === 'go') {
    const n = Number(String(getModalValue(interaction, 'n') ?? '').trim());
    const max = extra === 'attack' ? BATTLE_MAX_ROUNDS : MAX_CUSTOM_COUNT;
    if (!Number.isInteger(n) || n < 1 || n > max) {
      return reply({ content: `1 ~ ${max} 사이의 숫자를 적어주세요 🔢` }, { ephemeral: true });
    }
    if (!['attack', 'catch', 'heal'].includes(extra)) return reply({ content: '이 입력창은 이제 쓸 수 없어요 🥲' }, { ephemeral: true });
    count = n;
    action = extra === 'attack' ? 'attackN' : extra === 'catch' ? 'catchN' : 'healN';
  }

  if (action === 'fight') {
    const out = await updatePlayer(user.id, (p) => {
      const r = battleSys.startBattle(p, id, Date.now());
      return { commit: r.commit === true, value: r };
    });
    if (!out || out.kind === 'expired') return exploreViewExpired();
    if (out.kind === 'no_pet') {
      return reply({ content: '😢 함께 싸울 펫이 없어요! `/펫` 에서 대표 펫을 확인해주세요.' }, { ephemeral: true });
    }
    if (out.kind === 'fainted') {
      return reply(
        {
          content:
            `💫 **${out.name}**(이)가 지쳐서 싸울 수 없어요!\n` +
            '`/사용` 으로 회복약을 먹이거나, `/펫` 에서 다른 펫을 대표로 바꾸거나, 잠시 쉬면 천천히 회복돼요.\n' +
            '(싸우지 않고 **[잡기]** 는 할 수 있어요!)',
        },
        { ephemeral: true },
      );
    }
    return update(exploreViewBattle(out.snap, user.id, '⚔️ 전투 시작! **[공격]** 이나 **[스킬]** 로 싸워요.'));
  }

  // 🔄 [교체] — 교체할 펫을 고르는 화면으로 바꿔요 (아직 턴은 안 써요)
  if (action === 'swap' || action === 'swapno') {
    const player = await getPlayer(user.id);
    const ex = player?.exploration;
    if (!ex || ex.id !== id || !ex.encounter) return exploreViewExpired();
    if (!ex.battle) {
      return reply({ content: '아직 전투가 시작되지 않았어요! **[싸우기]** 를 먼저 눌러요 ⚔️' }, { ephemeral: true });
    }
    const snap = snapshot(player, Date.now());
    return update(action === 'swap' ? exploreViewSwap(player, snap, user.id) : exploreViewBattle(snap, user.id));
  }

  // 🔄 고른 펫으로 교체! (한 턴을 쓰고, 나온 펫이 공격을 맞아요)
  if (action === 'swapgo') {
    const uid = interaction.data.values?.[0];
    const out = await updatePlayer(user.id, (p) => {
      const r = battleSys.battleSwap(p, id, uid, Date.now());
      return { commit: r.commit === true, value: r };
    });
    if (!out || out.kind === 'expired') return exploreViewExpired();
    if (out.kind === 'no_battle') return reply({ content: '아직 전투가 시작되지 않았어요! **[싸우기]** 를 먼저 눌러요 ⚔️' }, { ephemeral: true });
    if (out.kind === 'swap_not_found') return reply({ content: '그 펫을 찾을 수 없어요 🤔 [교체] 를 다시 눌러주세요!' }, { ephemeral: true });
    if (out.kind === 'swap_same') return reply({ content: '👑 이미 싸우고 있는 펫이에요! 다른 펫을 골라주세요.' }, { ephemeral: true });
    if (out.kind === 'swap_fainted') return reply({ content: '💫 그 펫은 체력이 없어서 나올 수 없어요!' }, { ephemeral: true });
    if (out.kind === 'continue') return update(exploreViewBattle(out.snap, user.id, out.log.join('\n')));
    return battleOutcomeView(out, user.id); // won / lost / draw / wild_flee
  }

  // ✨ [스킬 버튼] — 바로 쓰지 않고, 스킬 설명 + "사용할까요?" 확인 화면을 먼저 보여줘요 (아직 턴은 안 써요)
  // (예전 메시지의 'skill' 버튼도 안전하게 확인창으로 보내요)
  if (action === 'skill' || action === 'skillask' || action === 'skillno') {
    const player = await getPlayer(user.id);
    const ex = player?.exploration;
    if (!ex || ex.id !== id || !ex.encounter) return exploreViewExpired();
    if (!ex.battle) {
      return reply({ content: '아직 전투가 시작되지 않았어요! **[싸우기]** 를 먼저 눌러요 ⚔️' }, { ephemeral: true });
    }
    const snap = snapshot(player, Date.now());
    if (action === 'skillno') return update(exploreViewBattle(snap, user.id));
    const slotNo = Number(extra);
    if (!Number.isInteger(slotNo) || !SKILLS[snap.battle.skills?.[slotNo]]) {
      return reply({ content: '그 슬롯에는 스킬이 없어요!' }, { ephemeral: true });
    }
    return update(exploreViewSkillConfirm(snap, user.id, slotNo));
  }

  // ✅ 확인창에서 [사용하기] 를 눌렀을 때 — 슬롯 번호(extra)의 스킬을 써요
  if (action === 'skillgo') {
    const out = await updatePlayer(user.id, (p) => {
      const r = battleSys.battleSkill(p, id, Number(extra), Date.now());
      return { commit: r.commit === true, value: r };
    });
    if (!out || out.kind === 'expired') return exploreViewExpired();
    if (out.kind === 'no_battle') return reply({ content: '아직 전투가 시작되지 않았어요! **[싸우기]** 를 먼저 눌러요 ⚔️' }, { ephemeral: true });
    if (out.kind === 'no_skill') return reply({ content: '그 슬롯에는 스킬이 없어요!' }, { ephemeral: true });
    if (out.kind === 'no_mana') {
      return reply({ content: `🔋 마나가 모자라요! (필요 ${out.need} / 현재 ${out.have}) 기본 공격을 해서 마나를 모아봐요.` }, { ephemeral: true });
    }
    if (out.kind === 'continue') return update(exploreViewBattle(out.snap, user.id, out.log.join('\n')));
    return battleOutcomeView(out, user.id); // won / lost / draw / wild_flee
  }

  // 🧪 [회복] — 약을 2종류 이상 가졌으면 고르는 화면으로 바꿔요 (아직 턴은 안 써요)
  if (action === 'heal' || action === 'healno') {
    const player = await getPlayer(user.id);
    const ex = player?.exploration;
    if (!ex || ex.id !== id || !ex.encounter) return exploreViewExpired();
    if (!ex.battle) {
      return reply({ content: '아직 전투가 시작되지 않았어요! **[싸우기]** 를 먼저 눌러요 ⚔️' }, { ephemeral: true });
    }
    const snap = snapshot(player, Date.now());
    if (action === 'healno') return update(exploreViewBattle(snap, user.id));
    if (ex.battle.myHp >= ex.battle.myMax) return reply({ content: '체력이 이미 가득해요! 약을 아껴뒀어요 😊' }, { ephemeral: true });
    const kinds = ownedPotions(player).length;
    if (kinds === 0) return reply({ content: '🧪 회복약이 없어요 😭 `/상점` 에서 사올 수 있어요!' }, { ephemeral: true });
    if (kinds >= 2) return update(exploreViewHealPick(player, snap, user.id));
    // 한 종류뿐이면 고를 게 없으니 바로 써요 (아래로 계속)
  }

  // 🧪 드롭다운에서 고른 약으로 회복! (한 턴을 써요)
  let healPotionId = null;
  if (action === 'healpick') {
    const [potionKey, amount] = String(interaction.data.values?.[0] ?? '').split(':');
    const okKey = potionKey === 'auto' || POTIONS.some((p) => p.id === potionKey);
    if (!okKey || !(amount === 'full' || /^\d+$/.test(amount))) {
      return reply({ content: '그 약은 고를 수 없어요 🤔 [회복] 을 다시 눌러주세요!' }, { ephemeral: true });
    }
    healPotionId = potionKey === 'auto' ? null : potionKey;
    count = amount === 'full' ? 'full' : Number(amount);
    action = 'healN';
  }

  const BATTLE_ACTIONS = {
    attack: (p) => battleSys.battleTurn(p, id, Date.now()),
    attack3: (p) => battleSys.battleTurns(p, id, Date.now(), Math.random, MULTI_TURNS),
    heal: (p) => battleSys.battleHeal(p, id, Date.now(), Math.random, 1),
    heal3: (p) => battleSys.battleHeal(p, id, Date.now(), Math.random, 3),
    healfull: (p) => battleSys.battleHeal(p, id, Date.now(), Math.random, 'full'),
    attackN: (p) => battleSys.battleTurns(p, id, Date.now(), Math.random, count),
    healN: (p) => battleSys.battleHeal(p, id, Date.now(), Math.random, count, healPotionId),
  };
  if (Object.hasOwn(BATTLE_ACTIONS, action)) {
    const out = await updatePlayer(user.id, (p) => {
      const r = BATTLE_ACTIONS[action](p);
      return { commit: r.commit === true, value: r };
    });
    if (!out || out.kind === 'expired') return exploreViewExpired();
    if (out.kind === 'no_battle') {
      return reply({ content: '아직 전투가 시작되지 않았어요! **[싸우기]** 를 먼저 눌러요 ⚔️' }, { ephemeral: true });
    }
    if (out.kind === 'no_potion') {
      return reply({ content: '🧪 그 회복약이 없어요 😭 `/상점` 에서 사올 수 있어요!' }, { ephemeral: true });
    }
    if (out.kind === 'full_hp') {
      return reply({ content: '체력이 이미 가득해요! 약을 아껴뒀어요 😊' }, { ephemeral: true });
    }
    if (out.kind === 'continue') {
      return update(exploreViewBattle(out.snap, user.id, out.log.join('\n')));
    }
    return battleOutcomeView(out, user.id); // won / lost / draw
  }

  // 🍖 [포획 아이템] — 간식·꿀·부적·그물·분석기 (전투 중이면 분석기 말고는 한 턴을 써요)
  if (action === 'citem') {
    const out = await updatePlayer(user.id, (p) => {
      const r = useCatchItem(p, extra, Date.now(), Math.random, { viaPanel: true, expectId: id });
      return { commit: r.commit === true, value: r };
    });
    if (!out || out.kind === 'no_explore') return exploreViewExpired();
    if (out.kind === 'item_used') return update(exploreViewSnap(out.snap, user.id, out.note));
    if (out.kind === 'continue') return update(exploreViewBattle(out.snap, user.id, out.log.join('\n')));
    if (out.kind === 'won' || out.kind === 'lost' || out.kind === 'draw' || out.kind === 'wild_flee') {
      return battleOutcomeView(out, user.id);
    }
    return reply({ content: catchItemFailText(out) }, { ephemeral: true });
  }

  if (action === 'look') {
    const out = await updatePlayer(user.id, (p) => {
      const r = exploreSys.lookAround(p, id, Date.now());
      return { commit: r.commit === true, value: r };
    });
    if (!out || out.kind === 'expired') return exploreViewExpired();
    if (out.kind === 'waiting') {
      return update(exploreViewExploring(out.snap, user.id, '아직 아무것도 안 나타났어요. 조금만 더 기다려봐요 ⏳'));
    }
    return update(exploreViewSnap(out.snap, user.id));
  }

  if (action === 'catch' || action === 'catch3' || action === 'catchN') {
    const out = await updatePlayer(user.id, (p) => {
      const r =
        action === 'catch3' || action === 'catchN'
          ? exploreSys.attemptCatchMulti(p, id, Date.now(), Math.random, action === 'catchN' ? count : MULTI_THROWS)
          : exploreSys.attemptCatch(p, id, Date.now());
      return { commit: r.commit === true, value: r };
    });
    if (!out || out.kind === 'expired') return exploreViewExpired();

    if (out.kind === 'no_ball') {
      return reply({ content: `${BALL.emoji} ${BALL.name}이(가) 없어요 😭 \`/상점\` 에서 사올 수 있어요!` }, { ephemeral: true });
    }
    // 전투 중에 잡기를 시도했다가 실패하면 공격/회복처럼 한 턴을 써요 (야생 펫이 반격해요!)
    if (out.kind === 'continue') {
      return update(exploreViewBattle(out.snap, user.id, out.log.join('\n')));
    }
    if (out.kind === 'won' || out.kind === 'lost' || out.kind === 'draw' || out.kind === 'wild_flee') {
      return battleOutcomeView(out, user.id);
    }
    if (out.kind === 'escaped') {
      const head = out.log?.length ? out.log.join('\n') : '💨 앗! 빠져나왔어요!';
      return update(exploreViewSnap(out.snap, user.id, `${head}\n(남은 ${BALL.name} ${out.ballsLeft}개)`));
    }
    if (out.kind === 'fled') {
      const pet = PETS[out.petId];
      return update({
        embeds: [{ title: `💨 ${pet.emoji} ${pet.name}(이)가 도망쳤어요...`, description: `${out.log?.length ? out.log.join('\n') + '\n\n' : ''}남은 ${BALL.name} ${out.ballsLeft}개\n\`/탐험\` 으로 다시 떠나봐요!`, color: 0xed4245 }],
        components: afterBattleComponents(user.id, out.locationId),
      });
    }

    // 잡았다!
    const pet = PETS[out.petId];
    const lines = [
      `${GRADES[pet.grade].emoji} ${pet.emoji} **${pet.name}** (Lv.${out.level}) 을(를) 잡았어요!`,
      out.isNew ? '✨ **새로운 도감 등록!**' : null,
      `⭐ 경험치 +${out.expGain}`,
      out.trainerBoost ? `🌟 트레이너 경험치 부스트 +${pct(BOOST_PCT)}% 적용! (남은 ${out.boostsLeft.trainerExp ?? 0}회)` : null,
      out.levelsGained > 0 ? `🎊 **트레이너 레벨 업!** → Lv.${out.newLevel}` : null,
      ...out.unlocked.map((l) => `🔓 새 장소 열림: ${l.emoji} **${l.name}**`),
      `\n남은 ${BALL.name} ${out.ballsLeft}개 · \`/탐험\` 으로 계속 모험해요!`,
    ].filter(Boolean);
    return update({ embeds: [{ title: '🎉 잡았다!', description: lines.join('\n'), color: 0x57f287 }], components: afterBattleComponents(user.id, out.locationId) });
  }

  // [다시 탐험] — 같은 장소로 바로 다시 떠나요 (id 자리에 장소 ID 가 들어 있어요)
  if (action === 'again') {
    const out = await updatePlayer(user.id, (p) => {
      const r = exploreSys.startExploration(p, id, Date.now());
      return { commit: r.commit === true, value: r };
    });
    if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
    if (!out.ok) {
      const msg = out.reason === 'locked' ? `🔒 아직 갈 수 없는 곳이에요! 트레이너 **Lv.${out.minLevel}** 이 되면 열려요.` : '그런 장소는 없어요 🤔';
      return reply({ content: msg }, { ephemeral: true });
    }
    return update(exploreViewSnap(out.snap, user.id, out.resumed ? '이미 탐험 중이에요! 이어서 해볼까요?' : null));
  }

  // [체력 회복] — 대표 펫이 가득 찰 때까지 가진 약을 알아서 써요 (나한테만 보이는 답장이라 패널은 그대로예요)
  // 약이 2종류 이상이면 먼저 어떤 약을 쓸지 물어봐요
  if (action === 'rest') {
    const player = await getPlayer(user.id);
    if (!player) return reply({ content: NOT_STARTED }, { ephemeral: true });
    const pet = getMainPet(player);
    const fighting = player.exploration?.battle && pet?.uid === player.mainPetUid;
    if (pet && !fighting && currentHp(pet, Date.now()) < maxHp(pet) && ownedPotions(player).length >= 2) {
      return reply(restPickView(player, user.id, pet), { ephemeral: true });
    }
    const out = await updatePlayer(user.id, (p) => {
      const r = autoHeal(p, null, Date.now());
      return { commit: r.commit === true, value: r };
    });
    if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
    return reply({ content: healResultText(out) }, { ephemeral: true });
  }

  // 🧪 [체력 회복] 에서 고른 약으로 가득 찰 때까지 먹이기
  if (action === 'restgo') {
    const key = String(interaction.data.values?.[0] ?? '');
    if (key !== 'auto' && !POTIONS.some((p) => p.id === key)) {
      return reply({ content: '그 약은 고를 수 없어요 🤔 [체력 회복] 을 다시 눌러주세요!' }, { ephemeral: true });
    }
    const out = await updatePlayer(user.id, (p) => {
      const r = autoHeal(p, null, Date.now(), key === 'auto' ? null : key);
      return { commit: r.commit === true, value: r };
    });
    if (out === null) return update({ content: NOT_STARTED, components: [] });
    return update({ content: healResultText(out), components: [] });
  }

  if (action === 'bump') {
    const player = await getPlayer(user.id);
    const ex = player?.exploration;
    if (!ex || ex.id !== id) return exploreViewExpired();

    const snap = snapshot(player, Date.now());
    const sent = await postChannelMessage(interaction.channel_id, exploreViewSnap(snap, user.id));

    // 봇이 채널에 직접 글을 못 쓰는 경우(권한 부족)에는, 버튼 응답 자체를 새 메시지로 보내서 패널을 맨 아래에 띄워요.
    // 버튼 응답은 봇 권한과 상관없이 항상 보낼 수 있어요. (이때 예전 패널은 그대로 남아요)
    if (!sent) {
      return reply(exploreViewSnap(snap, user.id));
    }

    return update({
      embeds: [{ title: '🔽 아래로 내려갔어요!', description: '채팅 맨 아래에서 새 탐험 패널을 이어서 눌러주세요!', color: 0x99aab5 }],
      components: [],
    });
  }

  if (action === 'run') {
    const out = await updatePlayer(user.id, (p) => {
      const r = exploreSys.attemptFlee(p, id, Date.now());
      return { commit: r.commit === true, value: r };
    });
    if (!out || out.kind === 'expired') return exploreViewExpired();

    // 도망 실패 → 전투가 계속돼요 (공격/회복/잡기와 똑같이 한 턴을 썼어요)
    if (out.kind === 'continue') {
      return update(exploreViewBattle(out.snap, user.id, out.log.join('\n')));
    }
    if (out.kind === 'ran') {
      return update({
        embeds: [{ title: `🏃 ${PETS[out.petId].emoji} ${PETS[out.petId].name}에게서 도망쳤어요!`, description: '`/탐험` 으로 다시 떠나볼 수 있어요!', color: 0x99aab5 }],
        components: afterBattleComponents(user.id, out.locationId),
      });
    }
    return battleOutcomeView(out, user.id); // 도망에 실패하고 그대로 승리/패배/무승부/도주로 전투가 끝난 경우
  }

  if (action === 'ignore' || action === 'quit') {
    const out = await updatePlayer(user.id, (p) => {
      const r = exploreSys.leave(p, id);
      return { commit: r.commit === true, value: r };
    });
    if (!out || out.kind === 'expired') return exploreViewExpired();
    const text =
      out.kind === 'ignored'
        ? `👋 ${PETS[out.petId].emoji} ${PETS[out.petId].name}(을)를 그냥 보내줬어요.`
        : '🚪 탐험을 마쳤어요.';
    return update({ embeds: [{ title: text, description: '`/탐험` 으로 다시 떠나볼 수 있어요!', color: 0x99aab5 }], components: afterBattleComponents(user.id, out.locationId) });
  }

  return reply({ content: '이 버튼은 이제 쓸 수 없어요 🥲' }, { ephemeral: true });
}

// ═════════════════════════════════════════════
// /상점
// ═════════════════════════════════════════════

const SHOP_ITEMS = Object.values(ITEMS).filter((i) => i.price);

function shopView(player, userId, note) {
  const lines = SHOP_ITEMS.map(
    (i) =>
      `${i.emoji} **${i.name}** — 💰 ${i.price}골드 (보유 ${player.inventory?.[i.id] ?? 0}개)\n　${i.description}`,
  );
  return {
    embeds: [
      {
        title: '🛒 해정 상점',
        description: `${note ? note + '\n\n' : ''}${lines.join('\n\n')}`,
        color: EMBED_COLOR,
        footer: { text: `내 골드: ${player.gold.toLocaleString('ko-KR')}` },
      },
    ],
    components: [
      row(
        select({
          customId: `shop:pick:${userId}`,
          placeholder: '🛒 살 물건을 골라요 (고르면 개수 입력창이 떠요)',
          options: SHOP_ITEMS.map((i) => ({
            label: `${i.name} — ${i.price.toLocaleString('ko-KR')}골드`,
            value: i.id,
            description: i.description.slice(0, 100),
            emoji: i.emoji,
          })),
        }),
      ),
    ],
    // (개수는 입력창에 숫자 또는 "최대" 로 적어요. `/구매` 명령어로도 바로 살 수 있어요)
  };
}

const shop = {
  data: {
    name: '상점',
    description: '골드로 해정볼 같은 아이템을 사요.',
    type: 1,
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const player = await getPlayer(user.id);
    if (!player) return reply({ content: NOT_STARTED }, { ephemeral: true });
    return reply(shopView(player, user.id), { ephemeral: true });
  },

  components: {
    shop: async function shopHandleButton(interaction, args) {
      let [action, ownerId, itemId, qtyStr] = args;
      const user = getUser(interaction);

      if (user.id !== ownerId) {
        return reply({ content: '이 상점은 연 사람만 쓸 수 있어요 🙅 `/상점` 으로 직접 열어보세요!' }, { ephemeral: true });
      }

      // 선택 메뉴에서 물건을 고르면 → 개수 입력창
      if (action === 'pick') {
        const picked = interaction.data.values?.[0];
        const it = ITEMS[picked];
        if (!it?.price) return reply({ content: '그런 물건은 없어요 🤔' }, { ephemeral: true });
        return numberModal({
          customId: `shop:buyN:${ownerId}:${picked}`,
          title: `${it.name} 몇 개 살까요?`.slice(0, 45),
          label: '개수 (숫자 또는 최대)',
          placeholder: `예: 5  또는  최대  (1 ~ ${MAX_BUY_AT_ONCE})`,
          maxLength: 6,
        });
      }

      // 입력창 제출 → 숫자 또는 "최대" 로 사요
      if (action === 'buyN') {
        const text = String(getModalValue(interaction, 'n') ?? '').trim().toLowerCase();
        const n = Number(text);
        if (['최대', 'max', '전부'].includes(text)) qtyStr = 'max';
        else if (Number.isInteger(n) && n >= 1 && n <= MAX_BUY_AT_ONCE) qtyStr = String(n);
        else return reply({ content: `1 ~ ${MAX_BUY_AT_ONCE} 사이의 숫자나 **최대** 를 적어주세요 🔢` }, { ephemeral: true });
        action = 'buy';
      }

      if (action !== 'buy') return reply({ content: '이 버튼은 이제 쓸 수 없어요 🥲' }, { ephemeral: true });

      let latest = null;
      const out = await updatePlayer(user.id, (p) => {
        const r = shopSys.buyItem(p, itemId, qtyStr === 'max' ? 'max' : Number(qtyStr));
        latest = p;
        return { commit: r.commit === true, value: r };
      });
      if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
      if (out.kind === 'unknown') return reply({ content: '그런 물건은 없어요 🤔' }, { ephemeral: true });

      if (out.kind === 'no_gold') {
        return reply({ content: `💸 골드가 부족해요! (필요 ${out.cost} / 보유 ${out.gold})` }, { ephemeral: true });
      }

      const item = ITEMS[out.itemId];
      return update(
        shopView(latest, user.id, `✅ ${item.emoji} **${item.name}** ${out.qty}개를 샀어요! (-${out.cost}골드, 보유 ${out.owned}개)`),
      );
    },
  },
};

// ═════════════════════════════════════════════
// /구매 — 상점을 열지 않고 원하는 개수를 바로 사요
// ═════════════════════════════════════════════

const buy = {
  data: {
    name: '구매',
    description: '상점을 열지 않고 아이템을 원하는 개수만큼 바로 사요.',
    type: 1,
    options: [
      {
        type: 3,
        name: '아이템',
        description: '무엇을 살까요?',
        required: true,
        choices: SHOP_ITEMS.map((i) => ({ name: `${i.emoji} ${i.name} (${i.price}골드)`, value: i.id })),
      },
      { type: 4, name: '수량', description: `몇 개 살까요? 칸을 누르면 살 수 있는 최대 개수가 떠요 (비우면 1개, 최대 ${MAX_BUY_AT_ONCE}개)`, required: false, autocomplete: true },
      { type: 5, name: '최대', description: '켜면 가진 골드로 살 수 있는 만큼 전부 사요', required: false },
    ],
  },

  async autocomplete(interaction) {
    return qtyAutocomplete(interaction, '구매');
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const itemId = getOption(interaction, '아이템');
    const qty = getOption(interaction, '최대') ? 'max' : (getOption(interaction, '수량') ?? 1);

    const out = await updatePlayer(user.id, (p) => {
      const r = shopSys.buyItem(p, itemId, qty);
      return { commit: r.commit === true, value: r };
    });
    if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
    if (out.kind === 'unknown') return reply({ content: '그런 물건은 없거나 수량이 이상해요 🤔' }, { ephemeral: true });
    if (out.kind === 'no_gold') {
      return reply({ content: `💸 골드가 부족해요! (필요 ${out.cost.toLocaleString('ko-KR')} / 보유 ${out.gold.toLocaleString('ko-KR')})` }, { ephemeral: true });
    }
    const item = ITEMS[out.itemId];
    return reply({
      content: `✅ ${item.emoji} **${item.name}** ${out.qty}개를 샀어요! (-${out.cost.toLocaleString('ko-KR')}골드)\n보유 ${out.owned}개 · 💰 남은 골드 ${out.gold.toLocaleString('ko-KR')}`,
    });
  },
};

// ═════════════════════════════════════════════
// /가방
// ═════════════════════════════════════════════

const bag = {
  data: {
    name: '가방',
    description: '내가 가진 아이템과 골드를 봐요.',
    type: 1,
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const player = await getPlayer(user.id);
    if (!player) {
      return reply({ content: '아직 모험을 시작하지 않았어요! `/시작` 을 먼저 해주세요 🐣' }, { ephemeral: true });
    }

    const lines = Object.values(ITEMS)
      .map((i) => ({ i, n: player.inventory?.[i.id] ?? 0 }))
      .filter((x) => x.n > 0)
      .map(({ i, n }) => `${i.emoji} **${i.name}** × ${n}\n　${i.description}`);

    return reply({
      embeds: [
        {
          title: `🎒 ${player.name}님의 가방`,
          description:
            (lines.length ? lines.join('\n\n') : '텅 비었어요... `/상점` 에서 사보세요!') +
            ((player.boosts?.trainerExp ?? 0) + (player.boosts?.petExp ?? 0) > 0
              ? `\n\n🚀 **켜둔 부스트** — 🌟 트레이너 ${player.boosts?.trainerExp ?? 0}회 · 💫 펫 ${player.boosts?.petExp ?? 0}회`
              : ''),
          color: EMBED_COLOR,
          footer: { text: `💰 ${player.gold.toLocaleString('ko-KR')} 골드` },
        },
      ],
    });
  },
};

// ═════════════════════════════════════════════
// /펫 (+ 버튼 처리)
// ═════════════════════════════════════════════

const PAGE_SIZE = 10;

function petsView(player, userId, page = 0, note) {
  const pages = Math.max(1, Math.ceil(player.pets.length / PAGE_SIZE));
  const cur = Math.max(0, Math.min(pages - 1, page));
  const start = cur * PAGE_SIZE;
  const slice = player.pets.slice(start, start + PAGE_SIZE);

  const lines = slice.map((inst, i) => {
    const pet = PETS[inst.petId];
    const s = calcStats(inst.petId, inst.level);
    const crown = inst.uid === player.mainPetUid ? '👑 ' : '';
    const learned = SLOT_IDX.filter((k) => SKILLS[inst.skills?.[k]]).length;
    return (
      `**${start + i + 1}.** ${crown}${GRADES[pet.grade].emoji} ${pet.emoji} **${inst.nickname ?? pet.name}** Lv.${inst.level}\n` +
      `　❤️ ${currentHp(inst)}/${s.hp} · 공격 ${s.atk} · 방어 ${s.def} · 속도 ${s.spd}\n` +
      `　✨ 스킬 ${learned}/${SLOT_COUNT}${inst.slot3 ? '' : ' · 🎫 5번 칸 잠김'}`
    );
  });

  const components = [
    row(
      select({
        customId: `pets:main:${userId}:${cur}`,
        placeholder: '👑 대표 펫으로 삼을 친구를 골라요',
        options: slice.map((inst, i) => {
          const pet = PETS[inst.petId];
          return {
            label: `${start + i + 1}. ${inst.nickname ?? pet.name} Lv.${inst.level}`,
            value: inst.uid,
            description: `${GRADES[pet.grade].name} 등급`,
            emoji: pet.emoji,
            default: inst.uid === player.mainPetUid,
          };
        }),
      }),
    ),
  ];
  if (pages > 1) {
    components.push(
      row(
        button({ label: '이전', emoji: '◀️', customId: `pets:page:${userId}:${cur - 1}`, style: 2, disabled: cur === 0 }),
        button({ label: `${cur + 1} / ${pages}`, customId: `pets:noop:${userId}:${cur}`, style: 2, disabled: true }),
        button({ label: '다음', emoji: '▶️', customId: `pets:page:${userId}:${cur + 1}`, style: 2, disabled: cur >= pages - 1 }),
      ),
    );
  }
  // 🎫 스킬 슬롯 개방권이 있으면 이 페이지의 펫에게 쓸 수 있는 버튼을 보여줘요
  if (ticketCount(player) > 0) {
    components.push(
      row(
        button({
          label: `스킬 슬롯 개방권 사용 (${ticketCount(player)}개)`,
          emoji: ITEMS[TICKET_ID].emoji,
          customId: `pets:ticket:${userId}:${cur}`,
          style: 1,
        }),
      ),
    );
  }

  return {
    embeds: [
      {
        title: `🐾 ${player.name}님의 해정펫 (${player.pets.length}마리)`,
        description: `${note ? note + '\n\n' : ''}${lines.join('\n')}`,
        color: EMBED_COLOR,
        footer: { text: '번호는 /별명 · /방생 · /훈련 에서 써요 · 👑 대표 펫이 전투에 나서요' },
      },
    ],
    components,
  };
}

// 🎫 개방권을 쓸 펫을 고르는 화면 (이 페이지의 펫 중 5번 칸이 아직 잠긴 펫만 나와요)
function petsTicketPickView(player, userId, page) {
  const cur = Math.max(0, page);
  const start = cur * PAGE_SIZE;
  const cands = player.pets
    .slice(start, start + PAGE_SIZE)
    .map((inst, i) => ({ inst, no: start + i + 1 }))
    .filter((c) => !c.inst.slot3);
  const item = ITEMS[TICKET_ID];
  return {
    embeds: [
      {
        title: `${item.emoji} ${item.name} — 어느 펫에게 쓸까요?`,
        description:
          `${item.emoji} **${ticketCount(player)}개** 가지고 있어요. 아래에서 펫을 고르면 **확인 화면**이 떠요.\n` +
          `5번 스킬 칸이 잠긴 펫만 보여요. (지금 보고 있는 페이지의 펫들이에요)`,
        color: EMBED_COLOR,
      },
    ],
    components: [
      row(
        select({
          customId: `pets:ticketpick:${userId}:${cur}`,
          placeholder: '🎫 스킬 칸을 열 펫을 골라요',
          options: cands.map(({ inst, no }) => {
            const pet = PETS[inst.petId];
            return {
              label: `${no}. ${inst.nickname ?? pet.name} Lv.${inst.level}`,
              value: inst.uid,
              description: `스킬 ${SLOT_IDX.filter((k) => SKILLS[inst.skills?.[k]]).length}/${SLOT_COUNT}`,
              emoji: pet.emoji,
            };
          }),
        }),
      ),
      row(button({ label: '돌아가기', emoji: '◀️', customId: `pets:page:${userId}:${cur}`, style: 2 })),
    ],
  };
}

const pets = {
  data: {
    name: '펫',
    description: '내 해정펫 목록을 보고 대표 펫을 바꿔요.',
    type: 1,
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const player = await getPlayer(user.id);
    if (!player) return reply({ content: NOT_STARTED }, { ephemeral: true });
    return reply(petsView(player, user.id, 0));
  },

  components: {
    pets: async function petsHandleButton(interaction, args) {
      const [action, ownerId, pageStr, uidArg] = args;
      const user = getUser(interaction);
      const page = Number(pageStr) || 0;

      if (user.id !== ownerId) {
        return reply({ content: '이 목록은 연 사람만 쓸 수 있어요 🙅 `/펫` 으로 직접 열어보세요!' }, { ephemeral: true });
      }

      if (action === 'page') {
        const player = await getPlayer(user.id);
        if (!player) return reply({ content: NOT_STARTED }, { ephemeral: true });
        return update(petsView(player, user.id, page));
      }

      if (action === 'main') {
        const uid = interaction.data.values?.[0];
        let latest = null;
        const out = await updatePlayer(user.id, (p) => {
          const r = setMainPet(p, uid);
          latest = p;
          return { commit: r.commit === true, value: r };
        });
        if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
        if (out.kind === 'not_found') return reply({ content: '그런 펫은 없어요 🤔 `/펫` 을 다시 열어보세요!' }, { ephemeral: true });
        if (out.kind === 'in_battle') {
          return reply({ content: '⚔️ 전투 중에는 대표 펫을 바꿀 수 없어요! 전투가 끝난 뒤에 바꿔주세요.' }, { ephemeral: true });
        }
        const chosen = latest.pets.find((x) => x.uid === uid);
        const pet = PETS[chosen.petId];
        const name = chosen.nickname ?? pet.name;
        const note =
          out.kind === 'already'
            ? `${pet.emoji} **${name}**(이)가 이미 대표 펫이에요!`
            : `👑 이제 ${pet.emoji} **${name}**(이)가 대표 펫이에요!`;
        return update(petsView(latest, user.id, page, note));
      }

      // 🎫 [스킬 슬롯 개방권 사용] → 펫 고르기
      if (action === 'ticket') {
        const player = await getPlayer(user.id);
        if (!player) return reply({ content: NOT_STARTED }, { ephemeral: true });
        if (ticketCount(player) <= 0) {
          return reply({ content: `${ITEMS[TICKET_ID].emoji} ${ITEMS[TICKET_ID].name}이(가) 없어요 😭 \`/상점\` 에서 사올 수 있어요!` }, { ephemeral: true });
        }
        const start = page * PAGE_SIZE;
        if (!player.pets.slice(start, start + PAGE_SIZE).some((x) => !x.slot3)) {
          return update(petsView(player, user.id, page, '이 페이지의 펫들은 5번 스킬 칸이 모두 열려 있어요! 다른 페이지를 확인해보세요.'));
        }
        return update(petsTicketPickView(player, user.id, page));
      }

      // 🎫 고른 펫 → 확인 화면
      if (action === 'ticketpick') {
        const uid = interaction.data.values?.[0];
        const player = await getPlayer(user.id);
        if (!player) return reply({ content: NOT_STARTED }, { ephemeral: true });
        const inst = player.pets.find((x) => x.uid === uid);
        if (!inst) return reply({ content: '그 펫을 찾을 수 없어요 🤔 `/펫` 을 다시 열어보세요!' }, { ephemeral: true });
        if (ticketCount(player) <= 0) return update(petsView(player, user.id, page, '개방권이 없어요 😭'));
        if (inst.slot3) return update(petsView(player, user.id, page, '이미 5번 슬롯이 열려 있는 펫이에요!'));
        ensureSkills(inst);
        return update(
          ticketConfirmView(player, inst, {
            goId: `pets:ticketgo:${user.id}:${page}:${inst.uid}`,
            backId: `pets:ticket:${user.id}:${page}`,
          }),
        );
      }

      // ✅ [개방하기] → 실제로 쓰기
      if (action === 'ticketgo') {
        let latest = null;
        const out = await updatePlayer(user.id, (p) => {
          const r = useSkillItem(p, TICKET_ID, uidArg, null, Date.now());
          latest = p;
          return { commit: r.commit === true, value: r };
        });
        if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
        return update(petsView(latest, user.id, page, skillItemResultText(out)));
      }

      return update({ content: '이 버튼은 이제 쓸 수 없어요 🥲', embeds: [], components: [] });
    },
  },
};

// ═════════════════════════════════════════════
// /도감
// ═════════════════════════════════════════════

// 도감 챕터 목록: 0번은 스타팅 펫, 그 뒤로는 /탐험 장소 순서 그대로예요
function dexChapters() {
  return [
    { id: 'starter', emoji: '🐣', name: '스타팅 펫', ids: [...STARTER_IDS] },
    ...LOCATION_LIST.map((loc) => ({
      id: loc.id,
      emoji: loc.emoji,
      name: loc.name,
      ids: [...new Set(loc.spawns.map((s) => s.petId))],
    })),
  ];
}

// 한 챕터만 보여주고, 나머지 챕터는 상점처럼 드롭다운으로 골라서 봐요
function dexView(player, userId, chapterId, note) {
  const found = player.dex ?? {};
  const entry = (id) => {
    const pet = PETS[id];
    return found[id] ? `${GRADES[pet.grade].emoji} ${pet.emoji} **${pet.name}**` : '❔ ???';
  };

  const chapters = dexChapters();
  const chapter = chapters.find((c) => c.id === chapterId) ?? chapters[0];
  const have = chapter.ids.filter((id) => found[id]).length;
  const { found: count, total } = dexProgress(player);

  return {
    embeds: [
      {
        title: `📖 ${player.name}님의 도감`,
        description:
          `${note ? note + '\n\n' : ''}${expBar(count, total)}  전체 **${count} / ${total}**\n\n` +
          `${chapter.emoji} **${chapter.name}** (${have}/${chapter.ids.length})\n` +
          chapter.ids.map(entry).join('\n'),
        color: EMBED_COLOR,
        footer: { text: '해정볼로 잡으면 도감에 등록돼요! 챕터를 다 채우면 /도감보상' },
      },
    ],
    components: [
      row(
        select({
          customId: `dex:pick:${userId}`,
          placeholder: '📖 볼 챕터를 골라요',
          options: chapters.map((c) => ({
            label: c.name,
            value: c.id,
            emoji: c.emoji,
            description: `${c.ids.filter((id) => found[id]).length}/${c.ids.length} 등록됨`,
            default: c.id === chapter.id,
          })),
        }),
      ),
    ],
  };
}

const dexCmd = {
  data: {
    name: '도감',
    description: '지금까지 잡은 해정펫 도감을 봐요.',
    type: 1,
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const player = await getPlayer(user.id);
    if (!player) {
      return reply({ content: NOT_STARTED }, { ephemeral: true });
    }
    return reply(dexView(player, user.id, 'starter'));
  },

  components: {
    dex: async function dexHandleButton(interaction, args) {
      const [action, ownerId] = args;
      const user = getUser(interaction);

      if (user.id !== ownerId) {
        return reply({ content: '이 도감은 연 사람만 쓸 수 있어요 🙅 `/도감` 으로 직접 열어보세요!' }, { ephemeral: true });
      }
      if (action !== 'pick') return reply({ content: '이 버튼은 이제 쓸 수 없어요 🥲' }, { ephemeral: true });

      const player = await getPlayer(user.id);
      if (!player) return reply({ content: NOT_STARTED }, { ephemeral: true });

      const picked = interaction.data.values?.[0];
      return update(dexView(player, user.id, picked));
    },
  },
};

// ═════════════════════════════════════════════
// 공용: 펫 고르기 자동완성 (/별명 · /방생 · /훈련 · /사용 이 같이 써요)
// 타이핑하는 동안 번호·이름으로 후보와 현재 체력을 미리 보여줘요
// ═════════════════════════════════════════════

async function petAutocomplete(interaction, optionName) {
  const user = getUser(interaction);
  const player = await getPlayerCached(user.id);
  if (!player) return autocompleteResult([]);

  const typed = String(getOption(interaction, optionName) ?? '').trim().toLowerCase();
  const now = Date.now();

  const choices = player.pets
    .map((inst, i) => ({ inst, index: i + 1, label: inst.nickname ?? PETS[inst.petId].name }))
    .filter((c) => !typed || `${c.index} ${c.label}`.toLowerCase().includes(typed))
    .slice(0, 25)
    .map((c) => {
      const cur = currentHp(c.inst, now);
      const max = maxHp(c.inst);
      const crown = c.inst.uid === player.mainPetUid ? '👑 ' : '';
      return {
        name: `${crown}${c.index}. ${PETS[c.inst.petId].emoji} ${c.label} Lv.${c.inst.level} (❤${cur}/${max})`,
        value: c.inst.uid,
      };
    });

  return autocompleteResult(choices);
}

// ═════════════════════════════════════════════
// 공용: "최대 몇 개까지 되는지" 수량 자동완성 (/사용 수량 · /구매 수량 · /훈련 횟수)
// 칸을 누르거나 숫자를 치는 동안 쓸 수 있는 최대치를 바로 띄워줘요.
// ═════════════════════════════════════════════

// 최대치 max 를 기준으로 고르기 쉬운 숫자 후보를 만들어요 (직접 친 숫자가 있으면 맨 위)
function qtyChoices(max, typedRaw, { unit, maxNote, labelPrefix = '' }) {
  const fmt = (n) => n.toLocaleString('ko-KR');
  const typed = Math.floor(Number(typedRaw));
  const values = [];
  if (Number.isFinite(typed) && typed >= 1 && typed <= max) values.push(typed);
  for (const n of [max, 1, 5, 10, 20, 50, 100]) {
    if (n >= 1 && n <= max && !values.includes(n)) values.push(n);
  }
  const out = values.map((n) => ({
    name: n === max ? `${labelPrefix}최대 ${fmt(n)}${unit}${maxNote ? ` (${maxNote})` : ''}` : `${labelPrefix}${fmt(n)}${unit}`,
    value: n,
  }));
  return out.slice(0, 25);
}

const qtyHint = (text) => autocompleteResult([{ name: text.slice(0, 100), value: 1 }]);

async function qtyAutocomplete(interaction, commandName) {
  const user = getUser(interaction);
  const player = await getPlayerCached(user.id);
  if (!player) return autocompleteResult([]);
  const typedRaw = getOption(interaction, interaction.data.options?.find((o) => o.focused)?.name);
  const now = Date.now();

  if (commandName === '구매') {
    const item = ITEMS[getOption(interaction, '아이템')];
    if (!item?.price) return qtyHint('👆 먼저 위에서 살 아이템을 골라주세요');
    const afford = Math.floor(player.gold / item.price);
    const max = Math.min(MAX_BUY_AT_ONCE, afford);
    if (max < 1) return qtyHint(`💸 골드가 부족해요 (${item.name} 1개 = ${item.price.toLocaleString('ko-KR')}골드 / 보유 ${player.gold.toLocaleString('ko-KR')})`);
    return autocompleteResult(
      qtyChoices(max, typedRaw, { unit: '개', maxNote: `💰 ${(max * item.price).toLocaleString('ko-KR')}골드`, labelPrefix: `${item.emoji} ` }),
    );
  }

  if (commandName === '훈련') {
    const inst = resolvePetSelector(player, getOption(interaction, '펫'));
    if (!inst) return qtyHint('🤔 펫을 찾을 수 없어요 (펫 칸을 다시 확인해주세요)');
    const sim = { level: inst.level, exp: inst.exp ?? 0 };
    let gold = player.gold;
    let n = 0;
    let spent = 0;
    while (n < MAX_TRAIN_AT_ONCE && sim.level < levelCap(player)) {
      const cost = trainCost(sim.level);
      if (gold < cost) break;
      gold -= cost;
      spent += cost;
      addExp(sim, trainExp(sim.level));
      n += 1;
    }
    if (n < 1) {
      const why = sim.level >= levelCap(player) ? '🔒 레벨 상한이에요' : `💸 골드가 부족해요 (1회 ${trainCost(sim.level).toLocaleString('ko-KR')}골드)`;
      return qtyHint(why);
    }
    return autocompleteResult(qtyChoices(n, typedRaw, { unit: '회', maxNote: `Lv.${inst.level}→${sim.level} · 💰 ${spent.toLocaleString('ko-KR')}골드` }));
  }

  // 사용
  const item = ITEMS[getOption(interaction, '아이템')];
  if (!item) return qtyHint('👆 아이템을 먼저 고르면 최대 개수가 떠요 (안 고르면 회복약을 알아서 써요)');
  const owned = player.inventory?.[item.id] ?? 0;
  if (owned < 1) return qtyHint(`${item.emoji} ${item.name}이(가) 없어요 😭`);

  let max = owned;
  let maxNote = `보유 ${owned}개`;
  if (item.heal) {
    const inst = resolvePetSelector(player, getOption(interaction, '대상'));
    if (!inst) return qtyHint('🤔 대상 펫을 찾을 수 없어요');
    const cur = currentHp(inst, now);
    const hpMax = maxHp(inst);
    if (cur >= hpMax) return qtyHint(`💚 체력이 이미 가득해요 (${cur}/${hpMax})`);
    const needed = Math.ceil((hpMax - cur) / item.heal);
    max = Math.min(owned, needed);
    maxNote = needed <= owned ? `가득 찰 때까지 · ❤${cur}→${hpMax}` : `보유 ${owned}개 전부 · ❤${cur}→${Math.min(hpMax, cur + item.heal * owned)}`;
  } else if (!item.boost) {
    max = 1; // 시간 감소·포획·스킬 아이템은 한 번에 1개씩만 써요
    maxNote = '이 아이템은 1개씩 써요';
  }
  return autocompleteResult(qtyChoices(max, typedRaw, { unit: '개', maxNote, labelPrefix: `${item.emoji} ` }));
}

const PET_OPTION = (description, required = true) => ({ type: 3, name: '펫', description, required, autocomplete: true });
const PET_NOT_FOUND = '그 펫을 찾을 수 없어요 🤔 번호나 이름을 다시 확인해주세요! (`/펫` 에서 확인 가능)';

// ═════════════════════════════════════════════
// /별명
// ═════════════════════════════════════════════

const nickname = {
  data: {
    name: '별명',
    description: '내 해정펫에게 별명을 지어줘요.',
    type: 1,
    options: [
      PET_OPTION('별명을 지어줄 펫 (번호나 이름, 입력하면 목록이 떠요)'),
      { type: 3, name: '이름', description: `새 별명 (최대 ${NICKNAME_MAX}글자, 비우면 원래 이름으로)`, required: false, max_length: 30 },
    ],
  },

  async autocomplete(interaction) {
    return petAutocomplete(interaction, '펫');
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const selector = getOption(interaction, '펫');
    const name = getOption(interaction, '이름');

    const out = await updatePlayer(user.id, (p) => {
      const r = renamePet(p, selector, name);
      return { commit: r.commit === true, value: r };
    });

    if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
    if (out.kind === 'not_found') return reply({ content: PET_NOT_FOUND }, { ephemeral: true });
    if (out.kind === 'too_long') return reply({ content: `별명은 ${NICKNAME_MAX}글자까지만 지을 수 있어요 ✂️` }, { ephemeral: true });
    if (out.kind === 'bad_chars') return reply({ content: '별명에 쓸 수 없는 기호가 들어 있어요 🙅 (@ < > ` * _ ~ | \\)' }, { ephemeral: true });

    const pet = PETS[out.inst.petId];
    const label = `${GRADES[pet.grade].emoji} ${pet.emoji}`;
    return reply({
      content:
        out.kind === 'cleared'
          ? `${label} 별명을 지웠어요. 다시 **${pet.name}** 이에요!`
          : `${label} **${pet.name}** 의 새 이름은 **${out.inst.nickname}** 💕`,
    });
  },
};

// ═════════════════════════════════════════════
// /방생 (+ 버튼 처리)
// ═════════════════════════════════════════════

const nameOf = (inst) => inst.nickname ?? PETS[inst.petId].name;

// 🆕 여러 마리 방생 미리보기 (/방생 목록:...) — 버튼을 누르기 전에 무엇을 얼마에 보내는지 보여줘요
async function releaseMultiPreview(userId, player, listText) {
  if (listText.includes(':')) {
    return reply({ content: '목록에는 `:` 글자를 쓸 수 없어요. 콤마(,)와 번호·범위(예: 2,4,7-9)로 입력해주세요!' }, { ephemeral: true });
  }

  const { insts, notFound } = resolvePetSelectors(player, listText);
  const targets = insts.filter((i) => i.uid !== player.mainPetUid);
  const skippedMain = targets.length !== insts.length;

  if (targets.length === 0) {
    const extra = notFound.length ? `\n못 찾은 항목: ${notFound.slice(0, 10).join(', ')}${notFound.length > 10 ? ' 외' : ''}` : '';
    return reply({ content: `${PET_NOT_FOUND}${extra}` }, { ephemeral: true });
  }

  const totalGold = targets.reduce((sum, inst) => sum + releaseValue(inst), 0);
  const lines = targets.slice(0, 20).map((inst) => {
    const pet = PETS[inst.petId];
    return `${GRADES[pet.grade].emoji} ${pet.emoji} **${nameOf(inst)}** Lv.${inst.level} → 💰${releaseValue(inst)}`;
  });
  if (targets.length > 20) lines.push(`...외 ${targets.length - 20}마리`);

  const notes = [];
  if (skippedMain) notes.push('👑 대표 펫은 자동으로 제외했어요.');
  if (notFound.length) notes.push(`못 찾은 항목: ${notFound.slice(0, 10).join(', ')}${notFound.length > 10 ? ' 외' : ''}`);

  return reply(
    {
      embeds: [
        {
          title: `🕊️ ${targets.length}마리를 정말 보내줄까요?`,
          description:
            `${lines.join('\n')}\n\n받을 골드 합계: 💰 **${totalGold}**\n` +
            (notes.length ? `${notes.join('\n')}\n` : '') +
            `\n⚠️ 한 번 보내면 되돌릴 수 없어요! (도감 기록은 그대로 남아요)`,
          color: 0xfee75c,
        },
      ],
      components: [
        row(
          button({ label: `${targets.length}마리 보내주기`, emoji: '🕊️', customId: `relmulti:yes:${userId}:${listText}`, style: 4 }),
          button({ label: '취소', emoji: '↩️', customId: `relmulti:no:${userId}:-`, style: 2 }),
        ),
      ],
    },
    { ephemeral: true },
  );
}

const release = {
  data: {
    name: '방생',
    description: '안 쓰는 해정펫을 보내주고 골드를 받아요.',
    type: 1,
    options: [
      PET_OPTION('보내줄 펫 (번호나 이름, 입력하면 목록이 떠요)', false),
      { type: 3, name: '목록', description: '여러 마리를 한번에: 번호를 콤마·범위로 (예: 2,4,7-9) 또는 "전체" (대표 펫 제외 전부)', required: false, max_length: 60 },
    ],
  },

  async autocomplete(interaction) {
    return petAutocomplete(interaction, '펫');
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const player = await getPlayer(user.id);
    if (!player) return reply({ content: NOT_STARTED }, { ephemeral: true });

    const listText = String(getOption(interaction, '목록') ?? '').trim();
    if (listText) return releaseMultiPreview(user.id, player, listText);

    const inst = resolvePetSelector(player, getOption(interaction, '펫'));
    if (!inst) return reply({ content: PET_NOT_FOUND }, { ephemeral: true });
    if (inst.uid === player.mainPetUid) {
      return reply({ content: '👑 대표 펫은 보내줄 수 없어요! `/펫` 에서 다른 펫을 대표로 바꾼 뒤에 해주세요.' }, { ephemeral: true });
    }

    const pet = PETS[inst.petId];
    return reply(
      {
        embeds: [
          {
            title: '🕊️ 정말 보내줄까요?',
            description:
              `${GRADES[pet.grade].emoji} ${pet.emoji} **${nameOf(inst)}** Lv.${inst.level}(을)를 자연으로 돌려보내요.\n` +
              `받을 골드: 💰 **${releaseValue(inst)}**\n\n⚠️ 한 번 보내면 되돌릴 수 없어요! (도감 기록은 그대로 남아요)`,
            color: 0xfee75c,
          },
        ],
        components: [
          row(
            button({ label: '보내주기', emoji: '🕊️', customId: `release:yes:${user.id}:${inst.uid}`, style: 4 }),
            button({ label: '취소', emoji: '↩️', customId: `release:no:${user.id}:-`, style: 2 }),
          ),
        ],
      },
      { ephemeral: true },
    );
  },

  components: {
    release: async function releaseHandleButton(interaction, args) {
      const [action, ownerId, uid] = args;
      const user = getUser(interaction);

      if (user.id !== ownerId) {
        return reply({ content: '이 버튼은 `/방생`을 쓴 사람만 누를 수 있어요 🙅' }, { ephemeral: true });
      }
      if (action === 'no') {
        return update({ embeds: [{ title: '↩️ 취소했어요', description: '아무 일도 일어나지 않았어요.', color: 0x99aab5 }], components: [] });
      }
      if (action !== 'yes') return reply({ content: '이 버튼은 이제 쓸 수 없어요 🥲' }, { ephemeral: true });

      const out = await updatePlayer(user.id, (p) => {
        const r = releasePet(p, uid);
        return { commit: r.commit === true, value: r };
      });
      if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });

      const gone = (title, desc) => update({ embeds: [{ title, description: desc, color: 0x99aab5 }], components: [] });
      if (out.kind === 'not_found') return gone('🍃 이미 없는 펫이에요', '`/펫` 으로 목록을 다시 확인해주세요!');
      if (out.kind === 'is_main') return gone('👑 대표 펫이에요', '대표 펫은 보내줄 수 없어요. 취소했어요.');

      const pet = PETS[out.petId];
      return update({
        embeds: [
          {
            title: '🕊️ 안녕, 잘 지내!',
            description: `${pet.emoji} **${out.nickname ?? pet.name}** (Lv.${out.level})(이)가 자연으로 돌아갔어요.\n💰 +${out.gold} 골드 (보유 ${out.total.toLocaleString('ko-KR')})`,
            color: 0x57f287,
          },
        ],
        components: [],
      });
    },

    // 🆕 여러 마리 방생 확인 버튼
    relmulti: async function releaseMultiButton(interaction, args) {
      const [action, ownerId, ...rest] = args;
      const listText = rest.join(':'); // 혹시 몰라 다시 이어붙여요 (콜론은 미리 막아뒀어요)
      const user = getUser(interaction);

      if (user.id !== ownerId) {
        return reply({ content: '이 버튼은 `/방생`을 쓴 사람만 누를 수 있어요 🙅' }, { ephemeral: true });
      }
      if (action === 'no') {
        return update({ embeds: [{ title: '↩️ 취소했어요', description: '아무 일도 일어나지 않았어요.', color: 0x99aab5 }], components: [] });
      }
      if (action !== 'yes') return reply({ content: '이 버튼은 이제 쓸 수 없어요 🥲' }, { ephemeral: true });

      const out = await updatePlayer(user.id, (p) => {
        const { insts } = resolvePetSelectors(p, listText);
        const r = releasePetsBulk(p, insts.map((i) => i.uid));
        return { commit: r.released.length > 0, value: r };
      });
      if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });

      if (out.released.length === 0) {
        return update({
          embeds: [{ title: '🍃 보낼 펫이 없어요', description: '이미 없어졌거나 대표 펫만 골랐을 수 있어요. `/펫` 으로 다시 확인해주세요!', color: 0x99aab5 }],
          components: [],
        });
      }

      const lines = out.released.slice(0, 20).map((r) => `${PETS[r.petId].emoji} ${r.nickname ?? PETS[r.petId].name} Lv.${r.level} → 💰${r.gold}`);
      if (out.released.length > 20) lines.push(`...외 ${out.released.length - 20}마리`);

      return update({
        embeds: [
          {
            title: '🕊️ 다 같이 안녕, 잘 지내!',
            description:
              `${lines.join('\n')}\n\n💰 받은 골드 합계: **${out.totalGold}** (보유 ${out.total.toLocaleString('ko-KR')})` +
              (out.skippedMain ? '\n👑 대표 펫은 자동으로 제외했어요.' : ''),
            color: 0x57f287,
          },
        ],
        components: [],
      });
    },
  },
};

// ═════════════════════════════════════════════
// /훈련 (+ 버튼 처리)
// ═════════════════════════════════════════════

function trainView(player, userId, inst, note) {
  const pet = PETS[inst.petId];
  const cap = levelCap(player);
  const atCap = inst.level >= cap;
  const cost = trainCost(inst.level);
  const need = expToNext(inst.level);
  const lines = [
    `${GRADES[pet.grade].emoji} ${pet.emoji} **${inst.nickname ?? pet.name}** Lv.${inst.level}`,
    `⭐ ${expBar(inst.exp, need)}  ${inst.exp}/${need}`,
    '',
    atCap
      ? `🔒 지금은 **Lv.${cap}** 까지만 훈련할 수 있어요. 트레이너 레벨을 올리면 더 키울 수 있어요!`
      : `🏋️ 1회: 💰 ${cost} 골드 → ⭐ 경험치 +${trainExp(inst.level)}\n(훈련은 트레이너 레벨 기준 **Lv.${cap}** 까지)`,
  ];
  return {
    embeds: [
      {
        title: '🏋️ 훈련장',
        description: `${note ? note + '\n\n' : ''}${lines.join('\n')}`,
        color: EMBED_COLOR,
        footer: { text: `내 골드: ${player.gold.toLocaleString('ko-KR')}` },
      },
    ],
    components: [
      row(
        ...TRAIN_AMOUNTS.map((n) =>
          button({
            label: `훈련 ${n}회`,
            emoji: '🏋️',
            customId: `train:go:${userId}:${inst.uid}:${n}`,
            style: 1,
            disabled: atCap || player.gold < cost,
          }),
        ),
        button({
          label: '훈련 최대',
          emoji: '🏋️',
          customId: `train:go:${userId}:${inst.uid}:max`,
          style: 1,
          disabled: atCap || player.gold < cost,
        }),
      ),
    ],
  };
}

// 훈련 결과가 오류일 때 보낼 답장 (없으면 null)
function trainErrorReply(out) {
  if (out.kind === 'not_found') return reply({ content: PET_NOT_FOUND }, { ephemeral: true });
  if (out.kind === 'in_battle') return reply({ content: '⚔️ 전투 중인 대표 펫은 훈련할 수 없어요! 전투를 끝내고 와주세요.' }, { ephemeral: true });
  if (out.kind === 'no_gold') return reply({ content: '💸 골드가 부족해요! 전투나 방생으로 모아보세요.' }, { ephemeral: true });
  if (out.kind === 'cap') return reply({ content: '🔒 더 이상 훈련할 수 없어요! 트레이너 레벨을 올려보세요.' }, { ephemeral: true });
  return null;
}

// 훈련 성공 안내 글자
function trainNote(out) {
  const parts = [`✅ ${out.done}회 훈련! 💰 -${out.spent} · ⭐ +${out.expGained}`];
  if (out.levelsGained > 0) parts.push(`🎊 **레벨 업!** → Lv.${out.newLevel}`);
  if (out.stop === 'no_gold') parts.push('골드가 모자라서 여기까지만 했어요.');
  if (out.stop === 'cap') parts.push('레벨 상한에 도달해서 여기까지만 했어요.');
  return parts.join('\n');
}

const train = {
  data: {
    name: '훈련',
    description: '골드를 내고 해정펫을 훈련시켜요.',
    type: 1,
    options: [
      PET_OPTION('훈련시킬 펫 (번호나 이름, 입력하면 목록이 떠요)', false),
      { type: 4, name: '횟수', description: `바로 훈련할 횟수 — 칸을 누르면 할 수 있는 최대 횟수가 떠요 (최대 ${MAX_TRAIN_AT_ONCE}회, 비우면 훈련장 화면)`, required: false, autocomplete: true },
      { type: 3, name: '목록', description: '여러 마리를 한번에: 번호를 콤마·범위로 (예: 2,4,7-9) 또는 "전체". "횟수"도 함께 입력해주세요', required: false, max_length: 60 },
    ],
  },

  async autocomplete(interaction) {
    const focused = interaction.data.options?.find((o) => o.focused)?.name;
    if (focused === '횟수') return qtyAutocomplete(interaction, '훈련');
    return petAutocomplete(interaction, '펫');
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const times = getOption(interaction, '횟수');
    if (times !== undefined && (!Number.isInteger(times) || times < 1 || times > MAX_TRAIN_AT_ONCE)) {
      return reply({ content: `횟수는 1~${MAX_TRAIN_AT_ONCE} 사이 숫자로 적어주세요!` }, { ephemeral: true });
    }
    const listText = String(getOption(interaction, '목록') ?? '').trim();

    // 🆕 목록을 적었으면 여러 마리를 한번에 훈련해요 (횟수가 꼭 필요해요)
    if (listText) {
      if (!times) return reply({ content: '여러 마리를 훈련하려면 `횟수` 도 함께 입력해주세요! (예: 목록:2,4,7-9 횟수:5)' }, { ephemeral: true });

      let notFound = [];
      let latest = null;
      const out = await updatePlayer(user.id, (p) => {
        latest = p; // ⚡ 저장 후 다시 읽지 않고 바로 이 데이터로 보여줘요
        const resolved = resolvePetSelectors(p, listText);
        notFound = resolved.notFound;
        const uids = resolved.insts.map((i) => i.uid);
        const r = trainPetsBulk(p, uids, times);
        return { commit: r.totalDone > 0, value: r };
      });
      if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
      if (out.results.length === 0) {
        const extra = notFound.length ? `\n못 찾은 항목: ${notFound.slice(0, 10).join(', ')}${notFound.length > 10 ? ' 외' : ''}` : '';
        return reply({ content: `${PET_NOT_FOUND}${extra}` }, { ephemeral: true });
      }

      const lines = out.results.slice(0, 20).map((r) => {
        const inst = latest?.pets.find((x) => x.uid === r.uid);
        const label = inst ? `${PETS[inst.petId].emoji} ${inst.nickname ?? PETS[inst.petId].name}` : '???';
        if (r.kind !== 'trained') {
          const why = r.kind === 'no_gold' ? '💸 골드 부족' : r.kind === 'cap' ? '🔒 레벨 상한' : r.kind === 'in_battle' ? '⚔️ 전투 중' : '못 함';
          return `${label}: ${why}`;
        }
        const level = r.levelsGained > 0 ? ` 🎊Lv.${r.newLevel}` : '';
        return `${label}: ${r.done}회 · ⭐+${r.expGained}${level}`;
      });
      if (out.results.length > 20) lines.push(`...외 ${out.results.length - 20}마리`);
      const notFoundNote = notFound.length ? `\n못 찾은 항목: ${notFound.slice(0, 10).join(', ')}${notFound.length > 10 ? ' 외' : ''}` : '';

      return reply({
        embeds: [
          {
            title: '🏋️ 다 같이 훈련 완료!',
            description: `${lines.join('\n')}\n\n💰 합계 -${out.totalSpent} · ⭐ 합계 +${out.totalExp}${notFoundNote}`,
            color: EMBED_COLOR,
          },
        ],
      });
    }

    // 횟수를 적었으면 훈련장 화면 없이 바로 훈련해요
    if (times) {
      let latest = null;
      let uid = null;
      const out = await updatePlayer(user.id, (p) => {
        const inst = resolvePetSelector(p, getOption(interaction, '펫'));
        if (!inst) return { commit: false, value: { kind: 'not_found' } };
        uid = inst.uid;
        const r = trainPet(p, inst.uid, times);
        latest = p;
        return { commit: r.commit === true, value: r };
      });
      if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
      const err = trainErrorReply(out);
      if (err) return err;
      return reply(trainView(latest, user.id, latest.pets.find((x) => x.uid === uid), trainNote(out)));
    }

    const player = await getPlayer(user.id);
    if (!player) return reply({ content: NOT_STARTED }, { ephemeral: true });

    const inst = resolvePetSelector(player, getOption(interaction, '펫'));
    if (!inst) return reply({ content: PET_NOT_FOUND }, { ephemeral: true });
    return reply(trainView(player, user.id, inst));
  },

  components: {
    train: async function trainHandleButton(interaction, args) {
      const [action, ownerId, uid, timesStr] = args;
      const user = getUser(interaction);

      if (user.id !== ownerId) {
        return reply({ content: '이 훈련장은 연 사람만 쓸 수 있어요 🙅 `/훈련` 으로 직접 열어보세요!' }, { ephemeral: true });
      }
      if (action !== 'go') return reply({ content: '이 버튼은 이제 쓸 수 없어요 🥲' }, { ephemeral: true });

      let latest = null;
      const out = await updatePlayer(user.id, (p) => {
        const r = trainPet(p, uid, timesStr === 'max' ? 'max' : Number(timesStr));
        latest = p;
        return { commit: r.commit === true, value: r };
      });
      if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
      const err = trainErrorReply(out);
      if (err) return err;

      const inst = latest.pets.find((x) => x.uid === uid);
      return update(trainView(latest, user.id, inst, trainNote(out)));
    },
  },
};

// ═════════════════════════════════════════════
// /사용
// ═════════════════════════════════════════════

const use = {
  data: {
    name: '사용',
    description: '회복약·부스트·시간 감소·포획 아이템을 써요. 아무것도 안 고르면 체력을 알아서 채워요!',
    type: 1,
    options: [
      {
        type: 3,
        name: '아이템',
        description: '무엇을 쓸까요? (비우면 가득 찰 때까지 회복약을 알아서 골라 써요)',
        required: false,
        choices: USABLE_ITEMS.map((i) => ({ name: `${i.emoji} ${i.name}`, value: i.id })),
      },
      { type: 4, name: '수량', description: '한 번에 몇 개 쓸까요? 칸을 누르면 쓸 수 있는 최대 개수가 떠요 (비우면 1개)', required: false, autocomplete: true },
      { type: 5, name: '최대', description: '켜면 가진 만큼 최대로 써요', required: false },
      { type: 4, name: '슬롯', description: '🔄 스킬 변경권 전용: 다시 뽑을 스킬 슬롯 번호 (1~5)', required: false, min_value: 1, max_value: SLOT_COUNT },
      {
        type: 3,
        name: '대상',
        description: '펫 번호나 이름을 입력하세요 (비우면 대표 펫) — 입력하면 체력이 바로 미리 보여요',
        required: false,
        autocomplete: true,
      },
      { type: 3, name: '목록', description: '여러 마리에게 한번에 회복약 먹이기: 번호를 콤마·범위로 (예: 2,4,7-9) 또는 "전체"', required: false, max_length: 60 },
    ],
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const itemId = getOption(interaction, '아이템');
    const wantMax = getOption(interaction, '최대') === true;
    const qty = wantMax ? 999 : (getOption(interaction, '수량') ?? 1);
    const target = getOption(interaction, '대상');
    const slot = getOption(interaction, '슬롯');
    const picked = ITEMS[itemId];
    const listText = String(getOption(interaction, '목록') ?? '').trim();

    // 🆕 목록을 적었으면 여러 마리에게 한번에 회복약을 먹여요 (부스트·포획·스킬 아이템은 지원 안 해요)
    if (listText) {
      if (picked && !picked.heal) {
        return reply({ content: '여러 마리 한번에 쓰기는 **회복약**에만 돼요. 부스트·포획·스킬 아이템은 한 마리씩 `대상` 으로 써주세요!' }, { ephemeral: true });
      }

      let notFound = [];
      let latest = null;
      const out = await updatePlayer(user.id, (p) => {
        latest = p; // ⚡ 저장 후 다시 읽지 않고 바로 이 데이터로 보여줘요
        const resolved = resolvePetSelectors(p, listText);
        notFound = resolved.notFound;
        const uids = resolved.insts.map((i) => i.uid);
        if (itemId) {
          const r = useItemMulti(p, itemId, uids, qty, Date.now());
          return { commit: r.totalUsed > 0, value: { mode: 'item', ...r } };
        }
        const r = autoHealMulti(p, uids, Date.now());
        return { commit: r.healedCount > 0, value: { mode: 'auto', ...r } };
      });
      if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });

      if (out.results.length === 0) {
        const extra = notFound.length ? `\n못 찾은 항목: ${notFound.slice(0, 10).join(', ')}${notFound.length > 10 ? ' 외' : ''}` : '';
        return reply({ content: `${PET_NOT_FOUND}${extra}` }, { ephemeral: true });
      }

      const petLabel = (uid) => {
        const inst = latest?.pets.find((x) => x.uid === uid);
        return inst ? `${PETS[inst.petId].emoji} ${inst.nickname ?? PETS[inst.petId].name}` : '???';
      };
      const lines = out.results.slice(0, 20).map((r) => {
        const label = petLabel(r.uid);
        if (r.kind === 'full') return `${label}: 체력 가득 (안 씀)`;
        if (r.kind === 'none') return `${label}: 먹일 약 없음`;
        if (r.kind === 'in_battle') return `${label}: ⚔️ 전투 중`;
        if (r.kind !== 'used' && r.kind !== 'healed') return `${label}: 못 함`;
        const gained = r.after - r.before;
        return `${label}: ❤️ +${gained} (${r.before}→${r.after}/${r.max})`;
      });
      if (out.results.length > 20) lines.push(`...외 ${out.results.length - 20}마리`);
      const notFoundNote = notFound.length ? `\n못 찾은 항목: ${notFound.slice(0, 10).join(', ')}${notFound.length > 10 ? ' 외' : ''}` : '';
      const usedSummary = out.mode === 'item' ? `${picked.emoji} ${picked.name} 총 ${out.totalUsed}개 · ❤️ 합계 +${out.totalGained}` : potionSummary(out.usedTotal) || '쓴 약 없음';

      return reply({
        embeds: [
          {
            title: '🧪 다 같이 회복!',
            description: `${lines.join('\n')}\n\n${usedSummary}${notFoundNote}`,
            color: EMBED_COLOR,
          },
        ],
      });
    }

    // 🎫 스킬 슬롯 개방권 / 🔄 스킬 변경권 (펫 한 마리를 골라서 써요)
    if (picked?.skillSlot || picked?.skillReroll) {
      const res = await updatePlayer(user.id, (p) => {
        const r = useSkillItem(p, itemId, target, slot, Date.now());
        return { commit: r.commit === true, value: r };
      });
      if (res === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
      return reply({ content: skillItemResultText(res) }, { ephemeral: true });
    }

    // 🍖 포획 아이템 (야생 펫을 만난 뒤에 써요. 전투 중에는 전투 화면의 아이템 버튼으로 써요)
    if (picked?.catchItem) {
      const res = await updatePlayer(user.id, (p) => {
        const r = useCatchItem(p, itemId, Date.now(), Math.random, { viaPanel: false });
        return { commit: r.commit === true, value: r };
      });
      if (res === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
      if (res.kind === 'item_used') {
        return reply({ content: `${res.detail ?? res.note}\n(남은 ${res.item.name} ${res.left}개) 탐험 화면의 버튼을 눌러 이어가요!` }, { ephemeral: true });
      }
      return reply({ content: catchItemFailText(res) }, { ephemeral: true });
    }

    // 🚀 경험치 부스트 / ⏩ 탐험 시간 감소
    if (picked && (picked.boost || picked.speedup || picked.scout)) {
      const res = await updatePlayer(user.id, (p) => {
        const r = useBoostItem(p, itemId, qty, Date.now());
        return { commit: r.commit === true, value: r };
      });
      if (res === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
      return reply({ content: boostResultText(res) }, { ephemeral: res.commit !== true || res.kind === 'scouted' });
    }

    // 약을 안 골랐으면: 가진 약을 알아서 섞어서 가득 찰 때까지 써요
    if (!itemId) {
      const auto = await updatePlayer(user.id, (p) => {
        const r = autoHeal(p, target, Date.now());
        return { commit: r.commit === true, value: r };
      });
      if (auto === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
      const text = healResultText(auto);
      return reply({ content: text }, { ephemeral: auto.kind !== 'healed' });
    }

    const out = await updatePlayer(user.id, (p) => {
      const r = useItem(p, itemId, target, qty);
      return { commit: r.commit === true, value: r };
    });

    if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
    if (out.kind === 'unknown') return reply({ content: '그런 약은 없어요 🤔' }, { ephemeral: true });
    if (out.kind === 'not_found') {
      return reply({ content: '그 펫을 찾을 수 없어요 🤔 번호나 이름을 다시 확인해주세요! (`/펫` 에서 확인 가능)' }, { ephemeral: true });
    }
    if (out.kind === 'in_battle') {
      return reply({ content: '⚔️ 전투 중에는 전투 화면의 **[회복]** 버튼으로만 쓸 수 있어요!' }, { ephemeral: true });
    }
    if (out.kind === 'none') {
      return reply({ content: `${out.item.emoji} ${out.item.name}이(가) 없어요 😭 \`/상점\` 에서 사올 수 있어요!` }, { ephemeral: true });
    }

    const pet = PETS[out.inst.petId];
    const name = `${GRADES[pet.grade].emoji} ${pet.emoji} **${out.inst.nickname ?? pet.name}**`;
    if (out.kind === 'full') return reply({ content: `${name}의 체력은 이미 가득해요! 약을 아껴뒀어요 😊` }, { ephemeral: true });

    const gained = out.after - out.before;
    return reply({
      content:
        `${out.item.emoji} ${out.item.name} **${out.used}개**를 먹였어요! (❤️ +${gained})\n` +
        `${name} ❤️ ${out.before} → **${out.after}/${out.max}** (남은 ${out.item.name} ${out.left}개)`,
    });
  },

  // "대상" 칸에 타이핑하는 동안 주식봇처럼 실시간으로 후보와 현재 체력을 미리 보여줘요
  async autocomplete(interaction) {
    const focused = interaction.data.options?.find((o) => o.focused)?.name;
    if (focused === '수량') return qtyAutocomplete(interaction, '사용');
    return petAutocomplete(interaction, '대상');
  },
};

// ═════════════════════════════════════════════
// /도움말
// ═════════════════════════════════════════════

const help = {
  data: {
    name: '도움말',
    description: '게임 규칙과 명령어를 알려줘요.',
    type: 1,
  },

  async execute() {
    return reply(
      {
        embeds: [
          {
            title: '📘 해정펫 도움말',
            color: EMBED_COLOR,
            fields: [
              {
                name: '🐣 시작',
                value: '`/시작` 으로 스타팅 펫을 고르고 모험을 시작해요. `/내정보` 로 내 상태를 확인해요.',
              },
              {
                name: '🌿 탐험',
                value:
                  '`/탐험` 으로 장소를 골라 떠나요 (장소를 비우면 지난번 장소로 가요). **[살펴보기]** 를 누르면 야생 펫이 나타나요.\n' +
                  '기다리는 시간은 장소·레벨과 상관없이 **5초 ~ 30초** 사이예요.\n' +
                  '탐험이 끝나면 **[다시 탐험]** · **[체력 회복]** 버튼이 떠서 명령어를 다시 안 쳐도 돼요.\n' +
                  '`/장소` 에서 갈 수 있는 곳과 만나는 펫을 볼 수 있어요.',
              },
              {
                name: '🔴 잡기',
                value:
                  `해정볼을 던질 때마다 포획 확률이 **-${pct(CATCH_DROP_PER_TRY)}%p** 줄어요.\n` +
                  `실패하면 도망 확률이 **+${pct(FLEE_RISE_PER_TRY)}%p** 올라가요 (처음 ${pct(FLEE_BASE)}%, 최대 ${pct(FLEE_MAX)}%).\n` +
                  '다른 펫을 만나면 확률이 처음으로 돌아가요.',
              },
              {
                name: '⚔️ 전투',
                value:
                  `**[공격]**, **[잡기]**, **[회복]**, **[도망]**, **[스킬]** 은 모두 한 턴을 써요. 턴 끝에는 야생 펫이 반격해요.\n` +
                  `**[공격 ×${MULTI_TURNS}]** · **[잡기 ×${MULTI_THROWS}]** 로 여러 턴을 한 번에 진행해요 (내 체력이 ${pct(MULTI_STOP_HP_RATIO)}% 이하면 자동으로 멈춰요).\n` +
                  `**[회복 ×3]** · **[회복 가득]** 은 약을 여러 개 먹어도 야생 펫은 한 번만 공격해요.\n` +
                  `**[✏️ 직접 입력]** 버튼은 숫자 입력창이 떠서 원하는 만큼(공격 최대 ${BATTLE_MAX_ROUNDS}턴, 잡기·회복 최대 ${MAX_CUSTOM_COUNT}개) 한 번에 해요.\n` +
                  `🎰 이기면 0.1% 확률로 경험치·골드 **3배**, 0.5% 확률로 **2배**!\n` +
                  `치명타 확률 ${pct(CRIT_CHANCE)}%, 회피 확률 ${pct(EVADE_CHANCE)}%(공격이 통째로 빗나가요), ` +
                  `매 턴 ${pct(WILD_FLEE_CHANCE)}% 확률로 야생 펫이 겁먹고 도망가요.\n` +
                  `**[도망]** 은 실패하면 턴을 날려요.\n` +
                  `${BATTLE_MAX_ROUNDS}턴 안에 끝나지 않아도 야생 펫이 떠나요.\n` +
                  `⚠️ **체력이 0이 되면 그 펫은 영영 사라져요!** 전투 전에 체력을 꼭 확인해요.`,
              },
              {
                name: '✨ 스킬 · 🔋 마나',
                value:
                  `전투 시작 시 마나 **${SKILL_CFG.manaStart}** 로 시작하고, **기본 공격**을 할 때만 **+${SKILL_CFG.manaPerTurn}** 씩 차요 (스킬·회복·교체 턴에는 안 차요, 최대 ${SKILL_CFG.manaMax}).\n` +
                  `스킬 칸은 총 **${SLOT_COUNT}칸**이에요. **Lv.${SKILL_CFG.slot1Level}** · **Lv.${SKILL_CFG.slot2Level}** · **Lv.${SKILL_CFG.slot3Level}** · **Lv.${SKILL_CFG.slot4Level}** 에 1~4번이 열리고, 5번은 상점의 🎫 **스킬 슬롯 개방권**으로 열어요 (\`/사용\` · \`/펫\` · \`/내정보\` 에서 쓸 수 있어요).\n` +
                  `열린 칸에는 랜덤 스킬이 들어와요. 펫마다 **전용기**가 있고, 그 펫만 배울 수 있어요. 전용기는 같은 마나의 일반 스킬보다 세요.\n` +
                  `🔄 스킬은 상점의 **스킬 변경권**(\`/사용\`)으로 다시 뽑을 수 있어요.\n` +
                  `전투에서 스킬 버튼을 누르면 **스킬 설명과 사용 확인창**이 먼저 떠요.\n` +
                  `\`/내정보\` 에서 대표 펫의 스킬 칸을 확인해요.`,
              },
              {
                name: '🍖 포획 아이템',
                value:
                  '야생 펫을 만난 뒤(싸우는 중에도) 탐험 화면 맨 아래 **아이템 버튼**이나 `/사용` 으로 써요. 다음 펫을 만나면 효과가 사라져요.\n' +
                  `🔬 **포획 분석기** — 포획 확률과 난이도(${catchDifficulty(0.9).label} ~ ${catchDifficulty(0, -0.1).label})를 보여줘요. 턴을 안 써요.\n` +
                  `🍖 **간식**(×1.2) · 🍯 **황금 꿀**(×1.5) — 포획 확률을 곱해서 올려요. 중첩되고 합쳐서 최대 ×${(1 + CATCH_BAIT_BONUS_CAP).toFixed(1)}\n` +
                  `🍀 **행운의 부적** — 다음 던지기 1번 확률 ×2 · 🕸️ **끈끈이 그물** — 도망 확률 -${pct(CATCH_NET_FLEE_REDUCE)}%p\n` +
                  `⚔️ 전투 중에 간식·꿀·부적·그물을 쓰면 **한 턴**을 써요(야생 펫이 반격!). 곱셈이라서 원래 잘 안 잡히는 펫은 여전히 어려워요.\n` +
                  `🎯 포획 확률 상한은 아이템 없이 **${pct(CATCH_MAX_CHANCE)}%**, 아이템을 써도 **${pct(CATCH_MAX_WITH_ITEMS)}%** — 100% 확정은 없어요!\n` +
                  `📉 높은 등급은 포획 확률에서 깎이는 값이 있어요 (${Object.entries(CATCH_GRADE_PENALTY).filter(([, v]) => v > 0).map(([g, v]) => `${GRADES[g].emoji}-${pct(v)}%p`).join(' ')}). ` +
                  `계산값이 **0% 아래(최대 ${pct(CATCH_NEG_FLOOR)}%)**면 못 잡아요 → 체력을 깎고 아이템을 써서 끌어올려요!`,
              },
              {
                name: '😨 등급 · 위압감 · 🔄 교체',
                value:
                  `등급: ${Object.values(GRADES).map((g) => `${g.emoji}${g.name}`).join(' › ')}\n` +
                  `등급이 높을수록 위압감이 커져요! (일반 → 초월)\n` +
                  `· 내 공격이 빗나갈 확률 ${pct(GRADE_EFFECTS.common.missChance)}% → ${pct(GRADE_EFFECTS.divine.missChance)}%\n` +
                  `· 상대가 급소로 때릴 확률 ${pct(GRADE_EFFECTS.common.critChance)}% → ${pct(GRADE_EFFECTS.divine.critChance)}%\n` +
                  `· 도망 실패 확률 ${pct(GRADE_EFFECTS.common.fleeFail)}% → ${pct(GRADE_EFFECTS.divine.fleeFail)}%\n` +
                  `🔄 **[교체]** 는 대표 펫 말고 체력이 남은 다른 펫과 바꿔요. 교체도 한 턴을 쓰고, **새로 나온 펫이 야생 펫의 공격을 맞아요!**`,
              },
              {
                name: '🧪 회복',
                value:
                  '`/사용` 으로 회복약을 써요. 수량을 골라 여러 개를 한 번에 쓸 수도 있고, 약을 안 고르면 가득 찰 때까지 알아서 써요.\n' +
                  '전투 중에는 **[회복]** 버튼으로 한 턴에 한 개씩 써요.',
              },
              {
                name: '🚀 부스트 · 탐험 시간 감소',
                value:
                  `\`/사용\` 으로 🌟 **트레이너 경험치 부스트** / 💫 **펫 경험치 부스트** 를 켜면, 경험치를 얻을 때마다 1회씩 쓰이면서 **+${pct(BOOST_PCT)}%** 가 붙어요. (트레이너는 승리·포획, 펫은 승리 때)\n` +
                  `⏩ **탐험 시간 감소** 는 탐험 중 펫을 기다릴 때 쓰면 남은 시간이 **전부 사라져서** 바로 야생 펫이 나타나요 (1개 = 1번).\n` +
                  '수량은 `/사용` 의 **수량** 칸에 적어도, 한 번에 1개만 쓰여요.',
              },
              {
                name: '🐾 펫 관리',
                value:
                  '`/펫` 으로 목록과 대표 펫(👑)을 확인해요. `/별명`, `/훈련`, `/방생` 은 번호 대신 **이름으로 골라도** 돼요 (입력하면 목록이 떠요).\n' +
                  '`/훈련` 은 횟수를 적으면 훈련장 없이 바로 훈련해요.',
              },
              {
                name: '📅 출석 · 🎁 도감 보상',
                value:
                  `\`/출석\` 은 하루(한국 시간 0시 기준)에 한 번, 🔴 해정볼 ${ATTENDANCE_BALLS}개와 💰 ${ATTENDANCE_GOLD}골드를 줘요.\n` +
                  '한 챕터(장소)의 도감을 모두 채우면 `/도감보상` 으로 큰 보상을 받아요! 챕터가 올라갈수록 보상도 커져요. (진행 상황은 `/도감보상` 에서 확인)',
              },
              {
                name: '🥊 유저 대결',
                value:
                  '`/대결 @유저` 로 대결을 신청하면, 상대가 **[수락]** 했을 때 서로의 **대표 펫**이 자동으로 싸워요.\n' +
                  '대결에서 져도 **펫은 사라지지 않고**, 대결이 끝나면 **체력도 대결 전 그대로** 예요. 보상도 손실도 없는 연습 경기예요!',
              },
              {
                name: '🤝 펫 거래',
                value:
                  '`/거래 @유저 내펫 상대펫` 으로 펫을 **1:1 교환**해요. 상대가 [수락] 하면 성사돼요. (골드·아이템 전달은 없어요)\n' +
                  `· 하루 **${TRADE_DAILY_LIMIT}회**까지 (한국 시간 0시 초기화) · 트레이너 Lv.**${TRADE_MIN_TRAINER_LEVEL}** 이상 · 시작 후 24시간 지나야 해요\n` +
                  `· 받는 펫 등급별 필요 레벨: ${Object.entries(TRADE_GRADE_MIN_LEVEL).map(([g, lv]) => `${GRADES[g].emoji}${lv}`).join(' ')}\n` +
                  `· 받는 펫 레벨은 내 트레이너 레벨 +${TRAIN_LEVEL_CAP_OVER_TRAINER} 까지 · 서로 바꾸는 펫은 등급 차이 ${TRADE_MAX_GRADE_GAP}단계, 레벨 차이 ${TRADE_MAX_LEVEL_GAP} 이내\n` +
                  `· 대표 펫은 불가 · 거래로 받은 펫은 ${fmtCooldown(TRADE_PET_COOLDOWN_MS)} 동안 재거래 불가 · 도감 등록 안 됨\n` +
                  `· 수수료: 보내는 펫 방생 골드의 ${pct(TRADE_FEE_RATE)}% (최소 ${TRADE_FEE_MIN}골드, 각자 부담)`,
              },
              {
                name: '🛒 상점 · 도감 · 가방',
                value: '`/상점` 에서 물건을 고르면 개수 입력창이 떠요 (숫자 또는 **최대**). `/구매` 는 상점을 안 열고 개수를 바로 적어서 사요. `/가방` 에서 가진 물건과 켜둔 부스트를 봐요. `/도감` 은 만난 펫을 기록해요.',
              },
            ],
            footer: { text: '잡기 규칙 숫자는 설정값에 따라 자동으로 바뀌어요.' },
          },
        ],
      },
      { ephemeral: true },
    );
  },
};

// ═════════════════════════════════════════════
// /출석
// ═════════════════════════════════════════════

const attendance = {
  data: {
    name: '출석',
    description: '하루에 한 번 출석체크하고 선물을 받아요!',
    type: 1,
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const out = await updatePlayer(user.id, (player) => {
      const r = claimAttendance(player);
      return { commit: !!r.commit, value: r };
    });

    if (!out) return reply({ content: NOT_STARTED }, { ephemeral: true });

    if (out.kind === 'already') {
      return reply(
        { content: `📅 오늘은 이미 출석했어요! (연속 **${out.streak}일** · 총 **${out.total}일**)\n내일 한국 시간 0시 이후에 다시 와주세요 😊` },
        { ephemeral: true },
      );
    }

    return reply({
      embeds: [
        {
          title: '📅 출석체크 완료!',
          description:
            `🔴 **해정볼 ${out.balls}개**와 💰 **${out.gold.toLocaleString('ko-KR')} 골드**를 받았어요!\n\n` +
            `연속 **${out.streak}일** · 총 **${out.total}일** 출석 중이에요.\n` +
            `지금 해정볼은 **${out.owned}개**예요.`,
          color: 0x57f287,
          footer: { text: '출석은 한국 시간 0시에 초기화돼요.' },
        },
      ],
    });
  },
};

// ═════════════════════════════════════════════
// /도감보상
// ═════════════════════════════════════════════

const dexReward = {
  data: {
    name: '도감보상',
    description: '챕터(장소)의 도감을 모두 채웠다면 보상을 받아요!',
    type: 1,
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const out = await updatePlayer(user.id, (player) => {
      const r = claimDexRewards(player);
      if (r.kind === 'claimed') return { commit: true, value: r };

      // 받을 게 없으면 진행 상황을 보여줘요
      const lines = LOCATION_LIST.map((loc, index) => {
        const p = chapterProgress(player, loc);
        const mark = player.dexClaimed?.[loc.id] ? '✅ 수령 완료' : p.complete ? '🎁 수령 가능' : `📖 ${p.have}/${p.total}`;
        return `**${index + 1}챕터** ${loc.emoji} ${loc.name} — ${mark}`;
      });
      const nextIndex = LOCATION_LIST.findIndex((loc) => !player.dexClaimed?.[loc.id]);
      const next = nextIndex >= 0 ? { index: nextIndex, loc: LOCATION_LIST[nextIndex], reward: chapterReward(nextIndex, LOCATION_LIST[nextIndex]) } : null;
      return { commit: false, value: { kind: 'nothing', lines, next } };
    });

    if (!out) return reply({ content: NOT_STARTED }, { ephemeral: true });

    if (out.kind === 'nothing') {
      return reply(
        {
          embeds: [
            {
              title: '🎁 도감 보상',
              description:
                `아직 받을 수 있는 보상이 없어요. 한 챕터의 도감을 모두 채우면 받을 수 있어요!\n\n${out.lines.join('\n')}` +
                (out.next ? `\n\n**다음 보상 — ${out.next.index + 1}챕터 ${out.next.loc.name}**\n${rewardText(out.next.reward)}` : '\n\n🎉 모든 챕터의 보상을 받았어요!'),
              color: EMBED_COLOR,
              footer: { text: '해정볼로 잡으면 도감에 등록돼요. 챕터는 입장 레벨 순서예요.' },
            },
          ],
        },
        { ephemeral: true },
      );
    }

    const gotLines = out.got.map((g) => `**${g.index + 1}챕터** ${g.loc.emoji} ${g.loc.name}`);
    return reply({
      embeds: [
        {
          title: '🎉 도감 보상 수령!',
          description:
            `${gotLines.join('\n')}\n\n**받은 보상${out.got.length > 1 ? ' (합계)' : ''}**\n${rewardText(out.total)}`,
          color: 0x57f287,
        },
      ],
    });
  },
};

// ═════════════════════════════════════════════
// /대결
// ═════════════════════════════════════════════

function duelFighterLine(f) {
  return (
    `${GRADES[f.grade].emoji} ${f.emoji} **${f.name}** Lv.${f.level}\n` +
    `❤️ ${f.hp}/${f.max} · 공격 ${f.stats.atk} · 방어 ${f.stats.def} · 속도 ${f.stats.spd}`
  );
}

// 전투 기록이 너무 길면 뒤쪽(승부가 갈리는 부분)만 남겨요
function trimDuelLog(lines) {
  let text = lines.join('\n');
  if (text.length <= DUEL_LOG_MAX_CHARS) return text;
  const kept = [];
  let len = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    len += lines[i].length + 1;
    if (len > DUEL_LOG_MAX_CHARS) break;
    kept.unshift(lines[i]);
  }
  return `…(앞부분 생략)\n${kept.join('\n')}`;
}

const duel = {
  data: {
    name: '대결',
    description: '다른 유저에게 대표 펫끼리의 대결을 신청해요. (펫은 사라지지 않고 체력도 그대로예요!)',
    type: 1,
    options: [{ type: 6, name: '유저', description: '대결을 신청할 상대', required: true }],
  },

  async execute(interaction) {
    const me = getUser(interaction);
    const targetId = getOption(interaction, '유저');

    if (targetId === me.id) {
      return reply({ content: '나 자신과는 대결할 수 없어요 😅' }, { ephemeral: true });
    }
    if (interaction.data.resolved?.users?.[targetId]?.bot) {
      return reply({ content: '봇과는 대결할 수 없어요 🤖' }, { ephemeral: true });
    }

    const [mine, theirs] = await Promise.all([getPlayer(me.id), getPlayer(targetId)]);
    if (!mine) return reply({ content: NOT_STARTED }, { ephemeral: true });
    if (!theirs) return reply({ content: '그 사람은 아직 모험을 시작하지 않았어요.' }, { ephemeral: true });

    const f = duelFighter(mine);
    if (!f) return reply({ content: '대결에 내보낼 펫이 없어요 😢' }, { ephemeral: true });

    const ts = Date.now();
    const key = `${me.id}:${targetId}:${ts}`;
    return reply({
      content: `<@${targetId}>`,
      embeds: [
        {
          title: '🥊 대결 신청!',
          description:
            `**${mine.name}**님이 <@${targetId}>님에게 대결을 신청했어요!\n\n` +
            `${duelFighterLine(f)}\n\n` +
            `서로의 **대표 펫**이 싸워요. 져도 펫은 사라지지 않고, 체력도 그대로예요 😊\n` +
            `⏳ ${Math.round(DUEL_CHALLENGE_TTL_MS / 60000)}분 안에 수락해주세요.`,
          color: 0xed4245,
        },
      ],
      components: [
        row(
          button({ label: '수락', emoji: '⚔️', customId: `duel:ok:${key}`, style: 3 }),
          button({ label: '거절', emoji: '🙅', customId: `duel:no:${key}`, style: 4 }),
        ),
      ],
    });
  },

  components: {
    duel: async function duelButton(interaction, args) {
      const [action, challengerId, targetId, ts] = args;
      const user = getUser(interaction);

      // 거절 / 취소 — 신청한 사람도, 받은 사람도 누를 수 있어요
      if (action === 'no') {
        if (user.id !== targetId && user.id !== challengerId) {
          return reply({ content: '이 대결과 상관없는 사람은 누를 수 없어요 🙅' }, { ephemeral: true });
        }
        const who = user.id === targetId ? '상대가 대결을 거절했어요 🙅' : '대결 신청을 취소했어요.';
        return update({
          content: '',
          embeds: [{ title: '🥊 대결 종료', description: who, color: 0x99aab5 }],
          components: [],
        });
      }

      if (user.id !== targetId) {
        return reply({ content: '신청받은 사람만 수락할 수 있어요 🙅' }, { ephemeral: true });
      }
      if (Date.now() - Number(ts) > DUEL_CHALLENGE_TTL_MS) {
        return update({
          content: '',
          embeds: [{ title: '🥊 대결 종료', description: '⏳ 신청 시간이 지났어요. 다시 신청해주세요!', color: 0x99aab5 }],
          components: [],
        });
      }

      const [challenger, target] = await Promise.all([getPlayer(challengerId), getPlayer(targetId)]);
      if (!challenger || !target) {
        return reply({ content: '대결 상대의 정보를 찾을 수 없어요 🥲' }, { ephemeral: true });
      }
      const a = duelFighter(challenger);
      const b = duelFighter(target);
      if (!a || !b) {
        return reply({ content: '대결에 내보낼 펫이 없어요 😢' }, { ephemeral: true });
      }

      const result = simulateDuel(a, b, seededRng(`${challengerId}:${targetId}:${ts}`));
      const winnerName = result.winner === 'a' ? a.owner : result.winner === 'b' ? b.owner : null;
      const title = winnerName
        ? `🏆 ${winnerName}님의 승리!`
        : '🤝 무승부!';
      const summary =
        (winnerName ? `🏆 **${winnerName}**님의 ${result.winner === 'a' ? a.emoji + ' ' + a.name : b.emoji + ' ' + b.name} 승리!` : '🤝 비겼어요!') +
        (result.timeout ? `\n⏱️ ${DUEL_MAX_ROUNDS}라운드 안에 끝나지 않아 남은 체력 비율로 가렸어요.` : '') +
        `\n(${result.rounds}라운드 · 펫은 사라지지 않고 체력도 그대로예요 ✅)`;

      return update({
        content: '',
        embeds: [
          {
            title,
            description: `${summary}`,
            color: 0xfee75c,
            fields: [
              { name: `🔴 ${a.owner}`, value: `${duelFighterLine(a)}\n**결과 ❤️ ${result.aHp}/${a.max}**`, inline: true },
              { name: `🔵 ${b.owner}`, value: `${duelFighterLine(b)}\n**결과 ❤️ ${result.bHp}/${b.max}**`, inline: true },
              { name: '📜 전투 기록', value: trimDuelLog(result.log).slice(0, 1024) },
            ],
            footer: { text: '이 결과는 저장되지 않아요. 대결 후에도 펫의 체력은 그대로예요.' },
          },
        ],
        components: [],
      });
    },
  },
};

// ═════════════════════════════════════════════
// /거래
// ═════════════════════════════════════════════

function tradePetLine(inst, now = Date.now()) {
  const pet = PETS[inst.petId];
  const s = calcStats(inst.petId, inst.level);
  return (
    `${GRADES[pet.grade].emoji} ${pet.emoji} **${tradeNameOf(inst)}** Lv.${inst.level}\n` +
    `❤️ ${currentHp(inst, now)}/${s.hp} · 공격 ${s.atk} · 방어 ${s.def} · 속도 ${s.spd}`
  );
}

// 자동완성: 거래할 수 있는 펫만 보여줘요 (대표 펫 · 방금 거래로 받은 펫은 빼요)
function tradeChoices(player, typed, now) {
  const t = String(typed ?? '').trim().toLowerCase();
  return player.pets
    .map((inst, i) => ({ inst, index: i + 1, label: tradeNameOf(inst) }))
    .filter((c) => c.inst.uid !== player.mainPetUid && tradeCooldownLeftMs(c.inst, now) === 0)
    .filter((c) => !t || `${c.index} ${c.label}`.toLowerCase().includes(t))
    .slice(0, 25)
    .map((c) => ({
      name: `${c.index}. ${GRADES[PETS[c.inst.petId].grade].emoji} ${PETS[c.inst.petId].emoji} ${c.label} Lv.${c.inst.level}`,
      value: c.inst.uid,
    }));
}

const trade = {
  data: {
    name: '거래',
    description: '다른 유저와 펫을 1:1로 교환해요. (하루 횟수 제한 · 등급/레벨 제한 · 수수료가 있어요)',
    type: 1,
    options: [
      { type: 6, name: '유저', description: '거래할 상대', required: true },
      { type: 3, name: '내펫', description: '내가 보낼 펫 (대표 펫은 불가)', required: true, autocomplete: true },
      { type: 3, name: '상대펫', description: '상대에게서 받고 싶은 펫', required: true, autocomplete: true },
    ],
  },

  async autocomplete(interaction) {
    const focused = interaction.data.options?.find((o) => o.focused);
    if (!focused) return autocompleteResult([]);
    const now = Date.now();
    const ownerId = focused.name === '내펫' ? getUser(interaction).id : getOption(interaction, '유저');
    if (!ownerId) return autocompleteResult([]);
    const owner = await getPlayer(ownerId);
    if (!owner) return autocompleteResult([]);
    return autocompleteResult(tradeChoices(owner, focused.value, now));
  },

  async execute(interaction) {
    const me = getUser(interaction);
    const targetId = getOption(interaction, '유저');
    const now = Date.now();

    if (targetId === me.id) return reply({ content: '나 자신과는 거래할 수 없어요 😅' }, { ephemeral: true });
    if (interaction.data.resolved?.users?.[targetId]?.bot) return reply({ content: '봇과는 거래할 수 없어요 🤖' }, { ephemeral: true });

    const [mine, theirs] = await Promise.all([getPlayer(me.id), getPlayer(targetId)]);
    if (!mine) return reply({ content: NOT_STARTED }, { ephemeral: true });
    if (!theirs) return reply({ content: '그 사람은 아직 모험을 시작하지 않았어요.' }, { ephemeral: true });

    const myInst = resolvePetSelector(mine, getOption(interaction, '내펫'));
    const theirInst = resolvePetSelector(theirs, getOption(interaction, '상대펫'));
    if (!myInst) return reply({ content: '내 펫을 찾을 수 없어요 🤔 입력하면 뜨는 목록에서 골라주세요!' }, { ephemeral: true });
    if (!theirInst) return reply({ content: '상대의 펫을 찾을 수 없어요 🤔 입력하면 뜨는 목록에서 골라주세요!' }, { ephemeral: true });

    const v = validateTrade(mine, myInst, theirs, theirInst, now);
    if (!v.ok) return reply({ content: `🚫 ${v.msg}` }, { ephemeral: true });

    const key = `${me.id}:${targetId}:${now}:${myInst.uid.slice(0, 8)}:${theirInst.uid.slice(0, 8)}`;
    return reply({
      content: `<@${targetId}>`,
      embeds: [
        {
          title: '🤝 펫 거래 신청!',
          description:
            `**${mine.name}**님이 <@${targetId}>님에게 펫 교환을 신청했어요!\n\n` +
            `**${mine.name}**님이 보내는 펫\n${tradePetLine(myInst, now)}\n\n` +
            `**${theirs.name}**님이 보내는 펫\n${tradePetLine(theirInst, now)}\n\n` +
            `💰 수수료: **${mine.name}** ${v.feeA.toLocaleString('ko-KR')}골드 · **${theirs.name}** ${v.feeB.toLocaleString('ko-KR')}골드 (각자 내요)\n` +
            `⚠️ 거래한 펫은 **${fmtCooldown(TRADE_PET_COOLDOWN_MS)}** 동안 다시 거래할 수 없고, **도감에는 등록되지 않아요.**\n` +
            `⏳ ${Math.round(TRADE_TTL_MS / 60000)}분 안에 수락해주세요.`,
          color: 0x3498db,
          footer: { text: `하루 거래 ${TRADE_DAILY_LIMIT}회까지 · 수락하면 되돌릴 수 없어요` },
        },
      ],
      components: [
        row(
          button({ label: '수락', emoji: '🤝', customId: `trade:ok:${key}`, style: 3 }),
          button({ label: '거절', emoji: '🙅', customId: `trade:no:${key}`, style: 4 }),
        ),
      ],
    });
  },

  components: {
    trade: async function tradeButton(interaction, args) {
      const [action, challengerId, targetId, ts, prefixA, prefixB] = args;
      const user = getUser(interaction);
      const closed = (description) =>
        update({ content: '', embeds: [{ title: '🤝 거래 종료', description, color: 0x99aab5 }], components: [] });

      if (action === 'no') {
        if (user.id !== targetId && user.id !== challengerId) {
          return reply({ content: '이 거래와 상관없는 사람은 누를 수 없어요 🙅' }, { ephemeral: true });
        }
        return closed(user.id === targetId ? '상대가 거래를 거절했어요 🙅' : '거래 신청을 취소했어요.');
      }

      if (user.id !== targetId) return reply({ content: '신청받은 사람만 수락할 수 있어요 🙅' }, { ephemeral: true });
      if (Date.now() - Number(ts) > TRADE_TTL_MS) return closed('⏳ 신청 시간이 지났어요. 다시 신청해주세요!');

      const now = Date.now();
      const out = await updatePlayerPair(challengerId, targetId, (a, b) => executeTrade(a, prefixA, b, prefixB, now));
      if (!out) return reply({ content: '거래 상대의 정보를 찾을 수 없어요 🥲' }, { ephemeral: true });
      if (out.kind === 'invalid') return reply({ content: `🚫 ${out.msg}` }, { ephemeral: true });

      const [pa, pb] = await Promise.all([getPlayer(challengerId), getPlayer(targetId)]);
      const nameA = pa?.name ?? '신청자';
      const nameB = pb?.name ?? '상대';
      return update({
        content: '',
        embeds: [
          {
            title: '🎉 거래 성사!',
            description:
              `**${nameA}**님이 받은 펫\n${tradePetLine(out.instB, now)}\n\n` +
              `**${nameB}**님이 받은 펫\n${tradePetLine(out.instA, now)}\n\n` +
              `💰 수수료: ${nameA} ${out.feeA.toLocaleString('ko-KR')}골드 · ${nameB} ${out.feeB.toLocaleString('ko-KR')}골드\n` +
              `📅 오늘 남은 거래 횟수: ${nameA} ${out.leftA}회 · ${nameB} ${out.leftB}회`,
            color: 0x57f287,
          },
        ],
        components: [],
      });
    },
  },
};

// ═════════════════════════════════════════════
// 내보내기: router.js 가 이 목록을 그대로 써요
// ═════════════════════════════════════════════

const commandModules = [start, profile, places, explore, autoHuntCmd, shop, buy, bag, pets, dexCmd, nickname, release, train, use, attendance, dexReward, duel, trade, help];

// ============================================================
// 관리자 설정 (admin-config.js) [ADMIN-CONFIG]
// ============================================================

// 펫·아이템·지역이 바뀌면 이 목록들을 다시 만들어요 (배열은 그 자리에서 갈아끼워서 다른 곳의 참조가 유지돼요)
function refreshDerived() {
  const fill = (arr, items) => arr.splice(0, arr.length, ...items);
  const items = Object.values(ITEMS);
  fill(STARTER_IDS, Object.values(PETS).filter((p) => p.starter).map((p) => p.id));
  fill(LOCATION_LIST, Object.values(LOCATIONS).sort((a, b) => a.minLevel - b.minLevel));
  fill(POTIONS, items.filter((i) => i.heal).sort((a, b) => a.heal - b.heal));
  fill(CATCH_ITEMS, items.filter((i) => i.catchItem));
  fill(USABLE_ITEMS, [...POTIONS, ...items.filter((i) => i.boost || i.speedup || i.catchItem)]);
  fill(SHOP_ITEMS, items.filter((i) => i.price));
  WILD_COUNT = Object.values(PETS).filter((p) => !p.starter).length;
}

const CONFIG_DOC = ['config', 'game'];
const admin = createConfigManager({
  scalars: {
    MAX_LEVEL: { get: () => MAX_LEVEL, set: (v) => { MAX_LEVEL = v; }, section: "기타", desc: "MAX_LEVEL" },
    START_GOLD: { get: () => START_GOLD, set: (v) => { START_GOLD = v; }, section: "기타", desc: "START_GOLD" },
    START_BALLS: { get: () => START_BALLS, set: (v) => { START_BALLS = v; }, section: "기타", desc: "START_BALLS" },
    CATCH_DROP_PER_TRY: { get: () => CATCH_DROP_PER_TRY, set: (v) => { CATCH_DROP_PER_TRY = v; }, section: "포획 🔴", desc: "던질 때마다 포획 확률 -10%p" },
    FLEE_BASE: { get: () => FLEE_BASE, set: (v) => { FLEE_BASE = v; }, section: "포획 🔴", desc: "첫 번째 던졌을 때 실패하면 도망갈 확률 (25%)" },
    FLEE_RISE_PER_TRY: { get: () => FLEE_RISE_PER_TRY, set: (v) => { FLEE_RISE_PER_TRY = v; }, section: "포획 🔴", desc: "실패할 때마다 도망 확률 +35%p" },
    FLEE_MAX: { get: () => FLEE_MAX, set: (v) => { FLEE_MAX = v; }, section: "포획 🔴", desc: "도망 확률 상한 (90%)" },
    BATTLE_MAX_ROUNDS: { get: () => BATTLE_MAX_ROUNDS, set: (v) => { BATTLE_MAX_ROUNDS = v; }, section: "전투 ⚔️", desc: "이 턴 안에 못 끝내면 야생 펫이 도망가요 (무승부)" },
    CRIT_CHANCE: { get: () => CRIT_CHANCE, set: (v) => { CRIT_CHANCE = v; }, section: "전투 ⚔️", desc: "급소 맞힐 확률 (데미지 1.5배)" },
    EVADE_CHANCE: { get: () => EVADE_CHANCE, set: (v) => { EVADE_CHANCE = v; }, section: "전투 ⚔️", desc: "내 펫이 야생 펫의 공격을 회피할 확률 (공격이 통째로 빗나가요, 데미지 0)" },
    WILD_FLEE_CHANCE: { get: () => WILD_FLEE_CHANCE, set: (v) => { WILD_FLEE_CHANCE = v; }, section: "전투 ⚔️", desc: "매 턴 끝에 야생 펫이 겁먹고 스스로 도망칠 확률" },
    GOLD_PER_YIELD: { get: () => GOLD_PER_YIELD, set: (v) => { GOLD_PER_YIELD = v; }, section: "등급별 위압감 😨", desc: "승리 골드 = 펫 expYield × 이 값 (±20% 랜덤). 해정볼이 100골드라서 이 값으로 균형을 잡아요" },
    WIN_TRAINER_EXP_MULT: { get: () => WIN_TRAINER_EXP_MULT, set: (v) => { WIN_TRAINER_EXP_MULT = v; }, section: "등급별 위압감 😨", desc: "승리 시 트레이너 경험치 = expYield × 장소배율 × 이 값" },
    WIN_PET_EXP_MULT: { get: () => WIN_PET_EXP_MULT, set: (v) => { WIN_PET_EXP_MULT = v; }, section: "등급별 위압감 😨", desc: "승리 시 대표 펫 경험치 = expYield × 장소배율 × 이 값 (펫이 트레이너보다 빨리 크도록 더 크게)" },
    BONUS_TRIPLE_CHANCE: { get: () => BONUS_TRIPLE_CHANCE, set: (v) => { BONUS_TRIPLE_CHANCE = v; }, section: "등급별 위압감 😨", desc: "승리 시 0.1% 확률로 경험치·골드 3배 🎰" },
    BONUS_DOUBLE_CHANCE: { get: () => BONUS_DOUBLE_CHANCE, set: (v) => { BONUS_DOUBLE_CHANCE = v; }, section: "등급별 위압감 😨", desc: "승리 시 0.5% 확률로 경험치·골드 2배 (3배와 동시에 나오지 않아요)" },
    HEAL_FULL_CAP: { get: () => HEAL_FULL_CAP, set: (v) => { HEAL_FULL_CAP = v; }, section: "편의 기능 ✨", desc: "[회복 가득] / /사용 자동 모드에서 한 번에 쓸 수 있는 약 개수 상한" },
    MULTI_TURNS: { get: () => MULTI_TURNS, set: (v) => { MULTI_TURNS = v; }, section: "편의 기능 ✨", desc: "[공격 ×3] 이 한 번에 진행하는 턴 수" },
    MULTI_THROWS: { get: () => MULTI_THROWS, set: (v) => { MULTI_THROWS = v; }, section: "편의 기능 ✨", desc: "[잡기 ×3] 이 한 번에 던지는 해정볼 수" },
    MULTI_STOP_HP_RATIO: { get: () => MULTI_STOP_HP_RATIO, set: (v) => { MULTI_STOP_HP_RATIO = v; }, section: "편의 기능 ✨", desc: "연속 행동 중 내 펫 체력이 이 비율 이하가 되면 자동으로 멈춰요 (펫이 사라지지 않게!)" },
    MAX_BUY_AT_ONCE: { get: () => MAX_BUY_AT_ONCE, set: (v) => { MAX_BUY_AT_ONCE = v; }, section: "편의 기능 ✨", desc: "한 번에 살 수 있는 최대 개수" },
    MAX_TRAIN_AT_ONCE: { get: () => MAX_TRAIN_AT_ONCE, set: (v) => { MAX_TRAIN_AT_ONCE = v; }, section: "편의 기능 ✨", desc: "한 번에 할 수 있는 최대 훈련 횟수" },
    MAX_CUSTOM_COUNT: { get: () => MAX_CUSTOM_COUNT, set: (v) => { MAX_CUSTOM_COUNT = v; }, section: "편의 기능 ✨", desc: "전투 중 [직접 입력] 으로 넣을 수 있는 최대 숫자" },
    BOOST_PCT: { get: () => BOOST_PCT, set: (v) => { BOOST_PCT = v; }, section: "부스트 · 탐험 시간 감소 🚀", desc: "경험치 부스트: 경험치 획득 1회에 +30%" },
    SPEEDUP_PCT: { get: () => SPEEDUP_PCT, set: (v) => { SPEEDUP_PCT = v; }, section: "부스트 · 탐험 시간 감소 🚀", desc: "탐험 시간 감소: 남은 대기 시간 -30% (1개당)" },
    SPEEDUP_MIN_SEC: { get: () => SPEEDUP_MIN_SEC, set: (v) => { SPEEDUP_MIN_SEC = v; }, section: "부스트 · 탐험 시간 감소 🚀", desc: "탐험 시간 감소로는 남은 시간이 이 값(초) 아래로 내려가지 않아요" },
    SPEEDUP_BLOCK_SEC: { get: () => SPEEDUP_BLOCK_SEC, set: (v) => { SPEEDUP_BLOCK_SEC = v; }, section: "부스트 · 탐험 시간 감소 🚀", desc: "남은 시간이 이 값(초) 이하면 탐험 시간 감소를 쓸 수 없어요 (아이템도 안 줄어요)" },
    LEVEL_WAIT_BONUS: { get: () => LEVEL_WAIT_BONUS, set: (v) => { LEVEL_WAIT_BONUS = v; }, section: "탐험 대기 시간 ⏳", desc: "그 장소에서 나올 수 있는 레벨 중 가장 높은 레벨이면 시간이 +40%" },
    MAX_WAIT_SEC: { get: () => MAX_WAIT_SEC, set: (v) => { MAX_WAIT_SEC = v; }, section: "탐험 대기 시간 ⏳", desc: "아무리 길어도 5분까지만" },
    FAKE_OUT_CHANCE: { get: () => FAKE_OUT_CHANCE, set: (v) => { FAKE_OUT_CHANCE = v; }, section: "탐험 대기 시간 ⏳", desc: "😏 훼이크: 이 확률로 \"센 펫이 나올 때처럼\" 오래 기다리게 해놓고, 실제로는 원래 펫이 나와요" },
    FAKE_OUT_MIN_GAP: { get: () => FAKE_OUT_MIN_GAP, set: (v) => { FAKE_OUT_MIN_GAP = v; }, section: "탐험 대기 시간 ⏳", desc: "훼이크는 원래 펫보다 이 배수 이상 센 펫의 시간으로만 만들어요" },
    NICKNAME_MAX: { get: () => NICKNAME_MAX, set: (v) => { NICKNAME_MAX = v; }, section: "육성 🌱", desc: "별명 최대 글자 수" },
    RELEASE_LEVEL_BONUS: { get: () => RELEASE_LEVEL_BONUS, set: (v) => { RELEASE_LEVEL_BONUS = v; }, section: "육성 🌱", desc: "RELEASE_LEVEL_BONUS" },
    TRAIN_BASE_COST: { get: () => TRAIN_BASE_COST, set: (v) => { TRAIN_BASE_COST = v; }, section: "육성 🌱", desc: "훈련 1회 비용 = 이 값 + 펫 레벨 × TRAIN_COST_PER_LEVEL (골드)" },
    TRAIN_COST_PER_LEVEL: { get: () => TRAIN_COST_PER_LEVEL, set: (v) => { TRAIN_COST_PER_LEVEL = v; }, section: "육성 🌱", desc: "TRAIN_COST_PER_LEVEL" },
    TRAIN_EXP_RATIO: { get: () => TRAIN_EXP_RATIO, set: (v) => { TRAIN_EXP_RATIO = v; }, section: "육성 🌱", desc: "훈련 1회 경험치 = \"다음 레벨까지 필요한 경험치\" × 이 값" },
    TRAIN_LEVEL_CAP_OVER_TRAINER: { get: () => TRAIN_LEVEL_CAP_OVER_TRAINER, set: (v) => { TRAIN_LEVEL_CAP_OVER_TRAINER = v; }, section: "육성 🌱", desc: "훈련으로는 펫이 트레이너 레벨 + 이 값까지만 클 수 있어요" },
    HP_REGEN_PCT_PER_MIN: { get: () => HP_REGEN_PCT_PER_MIN, set: (v) => { HP_REGEN_PCT_PER_MIN = v; }, section: "체력 이어가기 ❤️", desc: "시간이 지나면 1분마다 최대 체력의 이 비율만큼 저절로 회복돼요 (0.02 = 2%, 0%에서 가득까지 약 50분)" },
    ATTENDANCE_BALLS: { get: () => ATTENDANCE_BALLS, set: (v) => { ATTENDANCE_BALLS = v; }, section: "출석체크 📅", desc: "출석 1회 보상: 해정볼" },
    ATTENDANCE_GOLD: { get: () => ATTENDANCE_GOLD, set: (v) => { ATTENDANCE_GOLD = v; }, section: "출석체크 📅", desc: "출석 1회 보상: 골드" },
    DEX_GOLD_MULT: { get: () => DEX_GOLD_MULT, set: (v) => { DEX_GOLD_MULT = v; }, section: "도감 보상 🎁", desc: "골드 = (챕터에서 가장 강한 펫을 이겼을 때 평균 골드) × 이 값" },
    DUEL_MAX_ROUNDS: { get: () => DUEL_MAX_ROUNDS, set: (v) => { DUEL_MAX_ROUNDS = v; }, section: "유저 대결 🥊", desc: "이 라운드 안에 안 끝나면 남은 체력 비율로 승부를 가려요" },
    DUEL_CHALLENGE_TTL_MS: { get: () => DUEL_CHALLENGE_TTL_MS, set: (v) => { DUEL_CHALLENGE_TTL_MS = v; }, section: "유저 대결 🥊", desc: "대결 신청은 이 시간(5분) 안에 수락해야 해요" },
    DUEL_USE_FULL_HP: { get: () => DUEL_USE_FULL_HP, set: (v) => { DUEL_USE_FULL_HP = v; }, section: "유저 대결 🥊", desc: "true: 항상 최대 체력으로 싸워요 / false: 지금 체력 그대로 싸워요 (끝나면 어차피 그대로 복구)" },
    DUEL_LOG_MAX_CHARS: { get: () => DUEL_LOG_MAX_CHARS, set: (v) => { DUEL_LOG_MAX_CHARS = v; }, section: "유저 대결 🥊", desc: "전투 기록이 너무 길면 앞부분을 줄여요 (디스코드 글자 수 제한)" },
    TRADE_DAILY_LIMIT: { get: () => TRADE_DAILY_LIMIT, set: (v) => { TRADE_DAILY_LIMIT = v; }, section: "펫 거래 🤝", desc: "하루(한국 시간 0시 기준) 거래 성사 횟수 — 보내는 쪽·받는 쪽 둘 다 각자 세요" },
    TRADE_MIN_TRAINER_LEVEL: { get: () => TRADE_MIN_TRAINER_LEVEL, set: (v) => { TRADE_MIN_TRAINER_LEVEL = v; }, section: "펫 거래 🤝", desc: "거래하려면 트레이너 레벨이 최소 이만큼 필요해요" },
    TRADE_MIN_ACCOUNT_AGE_MS: { get: () => TRADE_MIN_ACCOUNT_AGE_MS, set: (v) => { TRADE_MIN_ACCOUNT_AGE_MS = v; }, section: "펫 거래 🤝", desc: "모험을 시작한 지 최소 이 시간(24시간)이 지나야 해요 (새 계정 대량 생성 방지)" },
    TRADE_MAX_GRADE_GAP: { get: () => TRADE_MAX_GRADE_GAP, set: (v) => { TRADE_MAX_GRADE_GAP = v; }, section: "펫 거래 🤝", desc: "서로 바꾸는 펫의 등급 차이는 이 단계까지만 (예: 희귀 ↔ 영웅 OK, 희귀 ↔ 전설 불가)" },
    TRADE_MAX_LEVEL_GAP: { get: () => TRADE_MAX_LEVEL_GAP, set: (v) => { TRADE_MAX_LEVEL_GAP = v; }, section: "펫 거래 🤝", desc: "서로 바꾸는 펫의 레벨 차이는 이만큼까지만" },
    TRADE_PET_COOLDOWN_MS: { get: () => TRADE_PET_COOLDOWN_MS, set: (v) => { TRADE_PET_COOLDOWN_MS = v; }, section: "펫 거래 🤝", desc: "거래로 받은 펫은 이 시간(24시간) 동안 다시 거래할 수 없어요 (돌려 막기 방지)" },
    TRADE_FEE_RATE: { get: () => TRADE_FEE_RATE, set: (v) => { TRADE_FEE_RATE = v; }, section: "펫 거래 🤝", desc: "수수료 = 내가 보내는 펫의 방생 골드 × 이 값 (골드가 사라지는 곳이에요)" },
    TRADE_FEE_MIN: { get: () => TRADE_FEE_MIN, set: (v) => { TRADE_FEE_MIN = v; }, section: "펫 거래 🤝", desc: "수수료 최소 금액" },
    TRADE_TTL_MS: { get: () => TRADE_TTL_MS, set: (v) => { TRADE_TTL_MS = v; }, section: "펫 거래 🤝", desc: "거래 신청은 이 시간(5분) 안에 수락해야 해요" },
    CATCH_MAX_CHANCE: { get: () => CATCH_MAX_CHANCE, set: (v) => { CATCH_MAX_CHANCE = v; }, section: "포획 아이템 🍖", desc: "아이템 없이 가능한 포획 확률 상한 (95%)" },
    CATCH_MAX_WITH_ITEMS: { get: () => CATCH_MAX_WITH_ITEMS, set: (v) => { CATCH_MAX_WITH_ITEMS = v; }, section: "포획 아이템 🍖", desc: "포획 아이템을 써도 이 값을 넘지 않아요 → 100% 확정 포획은 절대 없어요 (98%)" },
    CATCH_BAIT_BONUS_CAP: { get: () => CATCH_BAIT_BONUS_CAP, set: (v) => { CATCH_BAIT_BONUS_CAP = v; }, section: "포획 아이템 🍖", desc: "간식·꿀 효과는 이번 만남에서 합쳐서 최대 +100% (= 최대 ×2.0)" },
    CATCH_NET_FLEE_REDUCE: { get: () => CATCH_NET_FLEE_REDUCE, set: (v) => { CATCH_NET_FLEE_REDUCE = v; }, section: "포획 아이템 🍖", desc: "끈끈이 그물: 도망 확률 -30%p" },
    CATCH_NET_FLEE_MIN: { get: () => CATCH_NET_FLEE_MIN, set: (v) => { CATCH_NET_FLEE_MIN = v; }, section: "포획 아이템 🍖", desc: "그물을 써도 도망 확률은 이 값 아래로 안 내려가요" },
    CATCH_ITEM_COSTS_TURN: { get: () => CATCH_ITEM_COSTS_TURN, set: (v) => { CATCH_ITEM_COSTS_TURN = v; }, section: "포획 아이템 🍖", desc: "전투 중에 간식·꿀·부적·그물을 쓰면 한 턴을 써요 (야생 펫이 반격!) / 분석기는 공짜" },
    CATCH_NEG_FLOOR: { get: () => CATCH_NEG_FLOOR, set: (v) => { CATCH_NEG_FLOOR = v; }, section: "포획 아이템 🍖", desc: "고등급 포획 확률 계산값의 하한 (-30%)" },
    CATCH_MIN_CHANCE: { get: () => CATCH_MIN_CHANCE, set: (v) => { CATCH_MIN_CHANCE = v; }, section: "포획 아이템 🍖", desc: "낮은 등급(깎이는 값이 0인 등급)의 최소 포획 확률" },
  },
  tables: { GRADES, GRADE_EFFECTS, GRADE_WAIT_MULT, RELEASE_BASE_GOLD, TRADE_GRADE_MIN_LEVEL, CATCH_GRADE_PENALTY, WAIT_TIERS, DEX_REWARD },
  entities: { pets: PETS, items: ITEMS, locations: LOCATIONS },
  refresh: refreshDerived,
  store: {
    async load() {
      if (useMemory()) return memoryStore.get('__config') ?? null;
      const snap = await getDb().collection(CONFIG_DOC[0]).doc(CONFIG_DOC[1]).get();
      return snap.exists ? snap.data() : null;
    },
    async save(doc) {
      if (useMemory()) return void memoryStore.set('__config', structuredClone(doc));
      await getDb().collection(CONFIG_DOC[0]).doc(CONFIG_DOC[1]).set(doc);
    },
  },
});
export { admin, getPlayer, getPlayerBackup, adminSavePlayer, adminRevertPlayer };

// ============================================================
// 라우터 (router.js)
// ============================================================

// 들어온 요청을 알맞은 명령어/버튼에게 나눠주는 안내 데스크예요 🧭

// ✨ 새 명령어는 commands/index.js 의 commandModules 목록에 추가해요!
const modules = commandModules;

const commands = new Map(modules.map((m) => [m.data.name, m]));

// 버튼 이름표(custom_id 맨 앞 글자)로 담당 함수를 찾아요
const componentHandlers = new Map();
for (const m of modules) {
  for (const [prefix, fn] of Object.entries(m.components ?? {})) {
    componentHandlers.set(prefix, fn);
  }
}

export const commandDefinitions = modules.map((m) => m.data);

// ⚡ 디스코드는 3초 안에 답을 못 받으면 "애플리케이션이 응답하지 않음" 을 띄워요.
//    자동완성은 2.2초 안에 못 끝내면 빈 목록으로, 그 외는 2.7초 안에 못 끝내면 안내 메시지로 먼저 답해서
//    실패 화면 대신 "다시 눌러주세요" 가 보이게 해요 (뒤에서 진행 중인 저장은 그대로 끝나요).
export async function handleInteraction(interaction) {
  if (interaction.type === InteractionType.PING) return { type: 1 };

  const isAuto = interaction.type === InteractionType.AUTOCOMPLETE;
  const limitMs = isAuto ? 2200 : 2700;
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => {
      console.error('⏱️ 응답이 느려서 임시 답을 보냈어요:', interaction.data?.name ?? interaction.data?.custom_id);
      resolve(
        isAuto
          ? autocompleteResult([])
          : reply({ content: '⏳ 서버가 조금 느려요. 잠시 후 다시 한 번 시도해주세요! (이미 처리됐을 수도 있으니 `/내정보` 로 확인해보세요)' }, { ephemeral: true }),
      );
    }, limitMs);
  });
  try {
    return await Promise.race([handleInteractionInner(interaction), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function handleInteractionInner(interaction) {
  await admin.ensure(); // 관리자 설정 (1분마다 뒤에서 갱신해요)
  switch (interaction.type) {
    case InteractionType.PING:
      return { type: 1 };

    case InteractionType.COMMAND: {
      const cmd = commands.get(interaction.data.name);
      if (!cmd) return reply({ content: '모르는 명령어예요 🤔' }, { ephemeral: true });
      return cmd.execute(interaction);
    }

    case InteractionType.AUTOCOMPLETE: {
      const cmd = commands.get(interaction.data.name);
      if (!cmd?.autocomplete) return autocompleteResult([]);
      return cmd.autocomplete(interaction);
    }

    case InteractionType.COMPONENT:
    case InteractionType.MODAL_SUBMIT: {
      const [prefix, ...args] = interaction.data.custom_id.split(':');
      const handler = componentHandlers.get(prefix);
      if (!handler) return reply({ content: '이 버튼은 이제 쓸 수 없어요 🥲' }, { ephemeral: true });
      return handler(interaction, args);
    }

    default:
      return reply({ content: '아직 모르는 종류의 요청이에요 🤔' }, { ephemeral: true });
  }
}