// 게임의 기본 설정값 모음 ⚙️ (숫자만 바꾸면 게임 느낌이 바뀌어요)
export const MAX_LEVEL = 100;
export const START_GOLD = 1000;
export const START_BALLS = 5;
export const EMBED_COLOR = 0x5865f2;

// ───────── 포획 🔴 ─────────
// 해정볼을 던질 때마다 (한 마리 조우 기준) 포획 확률이 깎이고, 도망 확률이 올라가요
export const CATCH_DROP_PER_TRY = 0.10; // 던질 때마다 포획 확률 -10%p
export const FLEE_BASE = 0.25; // 첫 번째 던졌을 때 실패하면 도망갈 확률 (25%)
export const FLEE_RISE_PER_TRY = 0.35; // 실패할 때마다 도망 확률 +35%p
export const FLEE_MAX = 0.9; // 도망 확률 상한 (90%)

// ───────── 전투 ⚔️ ─────────
export const BATTLE_MAX_ROUNDS = 15; // 이 턴 안에 못 끝내면 야생 펫이 도망가요 (무승부)
export const CRIT_CHANCE = 0.1; // 급소 맞힐 확률 (데미지 1.5배)
export const GOLD_PER_YIELD = 3; // 승리 골드 = 펫 expYield × 이 값 (±20% 랜덤). 해정볼이 100골드라서 이 값으로 균형을 잡아요
export const WIN_TRAINER_EXP_MULT = 1.5; // 승리 시 트레이너 경험치 = expYield × 장소배율 × 이 값
export const WIN_PET_EXP_MULT = 2.0; // 승리 시 대표 펫 경험치 = expYield × 장소배율 × 이 값 (펫이 트레이너보다 빨리 크도록 더 크게)

// ───────── 육성 🌱 ─────────
export const NICKNAME_MAX = 12; // 별명 최대 글자 수
export const RELEASE_BASE_GOLD = { common: 20, rare: 50, epic: 150, legendary: 500 }; // 방생 골드 = 등급별 기본값 × (1 + 레벨 × RELEASE_LEVEL_BONUS)
export const RELEASE_LEVEL_BONUS = 0.1;
export const TRAIN_BASE_COST = 30; // 훈련 1회 비용 = 이 값 + 펫 레벨 × TRAIN_COST_PER_LEVEL (골드)
export const TRAIN_COST_PER_LEVEL = 10;
export const TRAIN_EXP_RATIO = 0.4; // 훈련 1회 경험치 = "다음 레벨까지 필요한 경험치" × 이 값
export const TRAIN_LEVEL_CAP_OVER_TRAINER = 10; // 훈련으로는 펫이 트레이너 레벨 + 이 값까지만 클 수 있어요

// ───────── 체력 이어가기 ❤️ ─────────
export const HP_REGEN_PCT_PER_MIN = 0.02; // 시간이 지나면 1분마다 최대 체력의 이 비율만큼 저절로 회복돼요 (0.02 = 2%, 0%에서 가득까지 약 50분)
