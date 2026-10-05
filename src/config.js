// 게임의 기본 설정값 모음 ⚙️ (숫자만 바꾸면 게임 느낌이 바뀌어요)
export const MAX_LEVEL = 100;
export const START_GOLD = 1000;
export const START_BALLS = 5;
export const EMBED_COLOR = 0x5865f2;

// 해정볼 던졌는데 실패했을 때, 야생 펫이 도망가 버릴 확률 (0.25 = 4번 중 1번)
export const FLEE_CHANCE_ON_FAIL = 0.25;

// ───────── 전투 ⚔️ ─────────
export const BATTLE_MAX_ROUNDS = 15; // 이 턴 안에 못 끝내면 야생 펫이 도망가요 (무승부)
export const CRIT_CHANCE = 0.1; // 급소 맞힐 확률 (데미지 1.5배)
export const GOLD_PER_YIELD = 3; // 승리 골드 = 펫 expYield × 이 값 (±20% 랜덤). 해정볼이 100골드라서 이 값으로 균형을 잡아요
export const WIN_TRAINER_EXP_MULT = 1.5; // 승리 시 트레이너 경험치 = expYield × 장소배율 × 이 값
export const WIN_PET_EXP_MULT = 2.0; // 승리 시 대표 펫 경험치 = expYield × 장소배율 × 이 값 (펫이 트레이너보다 빨리 크도록 더 크게)
