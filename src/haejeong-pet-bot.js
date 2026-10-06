// 해정펫 봇 — 모든 파일을 하나로 합친 버전 🐾
// (ES Module 이라서 package.json 에 "type": "module" 이 필요해요)
import { randomUUID } from 'node:crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ============================================================
// 설정값 (config.js)
// ============================================================

// 게임의 기본 설정값 모음 ⚙️ (숫자만 바꾸면 게임 느낌이 바뀌어요)
const MAX_LEVEL = 100;
const START_GOLD = 1000;
const START_BALLS = 5;
const EMBED_COLOR = 0x5865f2;

// ───────── 포획 🔴 ─────────
// 해정볼을 던질 때마다 (한 마리 조우 기준) 포획 확률이 깎이고, 도망 확률이 올라가요
const CATCH_DROP_PER_TRY = 0.10; // 던질 때마다 포획 확률 -10%p
const FLEE_BASE = 0.25; // 첫 번째 던졌을 때 실패하면 도망갈 확률 (25%)
const FLEE_RISE_PER_TRY = 0.35; // 실패할 때마다 도망 확률 +35%p
const FLEE_MAX = 0.9; // 도망 확률 상한 (90%)

// ───────── 전투 ⚔️ ─────────
const BATTLE_MAX_ROUNDS = 15; // 이 턴 안에 못 끝내면 야생 펫이 도망가요 (무승부)
const CRIT_CHANCE = 0.1; // 급소 맞힐 확률 (데미지 1.5배)
const GOLD_PER_YIELD = 3; // 승리 골드 = 펫 expYield × 이 값 (±20% 랜덤). 해정볼이 100골드라서 이 값으로 균형을 잡아요
const WIN_TRAINER_EXP_MULT = 1.5; // 승리 시 트레이너 경험치 = expYield × 장소배율 × 이 값
const WIN_PET_EXP_MULT = 2.0; // 승리 시 대표 펫 경험치 = expYield × 장소배율 × 이 값 (펫이 트레이너보다 빨리 크도록 더 크게)

// ───────── 육성 🌱 ─────────
const NICKNAME_MAX = 12; // 별명 최대 글자 수
const RELEASE_BASE_GOLD = { common: 20, rare: 50, epic: 150, legendary: 500 }; // 방생 골드 = 등급별 기본값 × (1 + 레벨 × RELEASE_LEVEL_BONUS)
const RELEASE_LEVEL_BONUS = 0.1;
const TRAIN_BASE_COST = 30; // 훈련 1회 비용 = 이 값 + 펫 레벨 × TRAIN_COST_PER_LEVEL (골드)
const TRAIN_COST_PER_LEVEL = 10;
const TRAIN_EXP_RATIO = 0.4; // 훈련 1회 경험치 = "다음 레벨까지 필요한 경험치" × 이 값
const TRAIN_LEVEL_CAP_OVER_TRAINER = 10; // 훈련으로는 펫이 트레이너 레벨 + 이 값까지만 클 수 있어요

// ───────── 체력 이어가기 ❤️ ─────────
const HP_REGEN_PCT_PER_MIN = 0.02; // 시간이 지나면 1분마다 최대 체력의 이 비율만큼 저절로 회복돼요 (0.02 = 2%, 0%에서 가득까지 약 50분)

// ============================================================
// 데이터: 해정펫 도감 (data/pets.js)
// ============================================================

// 해정펫 도감 📖 — 새 펫을 추가하려면 아래에 한 덩어리만 더 적으면 돼요!
// grade: common(일반) / rare(희귀) / epic(영웅) / legendary(전설)
// expYield: 이 펫을 이겼을 때 주는 기본 경험치, catchRate: 잡기 쉬운 정도(0~1, 클수록 쉬움)

const GRADES = {
  common: { name: '일반', emoji: '⚪', order: 1 },
  rare: { name: '희귀', emoji: '🔵', order: 2 },
  epic: { name: '영웅', emoji: '🟣', order: 3 },
  legendary: { name: '전설', emoji: '🟡', order: 4 },
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
};

// ============================================================
// 데이터: 장소 (data/locations.js)
// ============================================================

// 장소 목록 🗺️ — 레벨이 높아야 갈 수 있는 곳일수록 강하고 경험치가 많은 펫이 나와요!
// weight: 나올 확률의 "무게" (클수록 자주 나와요), lv: [최소, 최대] 펫 레벨
// delay: 펫이 나타날 때까지 걸리는 시간(초) [최소, 최대] — 이 사이에서 랜덤!

const LOCATIONS = {
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
const InteractionType = { PING: 1, COMMAND: 2, COMPONENT: 3, AUTOCOMPLETE: 4 };
const ResponseType = { PONG: 1, MESSAGE: 4, UPDATE: 7, AUTOCOMPLETE_RESULT: 8 };
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
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) console.error('새 메시지 보내기 실패:', res.status, await res.text());
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
async function updatePlayer(userId, mutate) {
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
  return {
    uid: randomUUID(),
    petId,
    level,
    exp: 0,
    nickname: null,
    caughtAt: Date.now(),
  };
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
    createdAt: Date.now(),
  };
}

function getMainPet(player) {
  return player.pets.find((p) => p.uid === player.mainPetUid) ?? player.pets[0] ?? null;
}

// 대표 펫 바꾸기 (전투 중에는 못 바꿔요: 체력 정보가 꼬여요!)
function setMainPet(player, uid) {
  if (!player.pets.some((p) => p.uid === uid)) return { kind: 'not_found' };
  if (player.exploration?.battle) return { kind: 'in_battle' };
  if (player.mainPetUid === uid) return { kind: 'already' };
  player.mainPetUid = uid;
  return { kind: 'changed', commit: true };
}

// ============================================================
// 시스템: 아이템 사용 (systems/use.js)
// ============================================================

// 아이템 사용 규칙 🧪 (디스코드와 상관없는 순수한 규칙)

// 회복약 목록 (약한 것 → 센 것 순서)
const POTIONS = Object.values(ITEMS).filter((i) => i.heal).sort((a, b) => a.heal - b.heal);

// 전투 중 쓸 약 고르기: 모자란 체력을 채울 수 있는 "가장 약한" 약, 없으면 가진 것 중 제일 센 약
function pickPotion(player, missing) {
  const owned = POTIONS.filter((p) => (player.inventory?.[p.id] ?? 0) > 0);
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
  if (byUid) return byUid;

  if (/^\d+$/.test(text)) return player.pets[Number(text) - 1] ?? null;

  const lower = text.toLowerCase();
  const label = (p) => (p.nickname ?? PETS[p.petId].name).toLowerCase();
  const exact = player.pets.find((p) => label(p) === lower);
  if (exact) return exact;

  const partial = player.pets.filter((p) => label(p).includes(lower));
  return partial.length === 1 ? partial[0] : null;
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

// ============================================================
// 시스템: 탐험 · 포획 (systems/explore.js)
// ============================================================

// 탐험 · 포획 규칙 🌿🔴 (디스코드와 상관없는 "순수한 게임 규칙"이라 테스트하기 쉬워요)
//
// 탐험 흐름:  /탐험 → (랜덤 시간 기다림) → [살펴보기] → 야생 펫 등장 → [잡기] / [싸우기] / [무시하기]
// player.exploration = { id, locationId, startedAt, appearAt, encounter: null | { petId, level }, battle?: {...} }
// (battle 은 systems/battle.js 가 만들어요. 전투 중에는 snapshot 의 state 가 'battle' 이에요)


const BALL_ID = 'haejeong_ball';

// 잡을 확률: 펫마다 정해진 값 × (내 대표 펫보다 야생 펫이 너무 높으면 조금 어려워져요)
//            × (전투로 야생 펫 체력을 깎을수록 쉬워져요: 체력이 거의 0이면 최대 2배!)
function catchChance(petId, wildLevel, mainLevel, hpRatio = 1, tries = 0) {
  const gap = Math.max(0, wildLevel - mainLevel);
  const factor = Math.max(0.3, 1 - gap * 0.02);
  const weakBonus = 1 + (1 - Math.max(0, Math.min(1, hpRatio)));
  const base = PETS[petId].catchRate * factor * weakBonus;
  const afterTries = base - CATCH_DROP_PER_TRY * tries; // 던진 횟수만큼 -10%p
  return Math.max(0.02, Math.min(0.95, afterTries));
}

// 도망 확률: 실패한 횟수만큼 +35%p (상한 90%)
function fleeChance(tries) {
  return Math.min(FLEE_MAX, FLEE_BASE + FLEE_RISE_PER_TRY * tries);
}

// 지금 탐험 상태를 한 장의 "사진"으로 찍어요 (화면 그릴 때 써요)
function snapshot(player, now = Date.now()) {
  const ex = player.exploration;
  if (!ex) return { state: 'idle' };
  const base = { id: ex.id, locationId: ex.locationId, balls: player.inventory?.[BALL_ID] ?? 0 };
  if (ex.encounter) {
    const main = getMainPet(player);
    const b = ex.battle ?? null;
    const ratio = b ? b.wildHp / b.wildMax : 1;
    const snap = {
      ...base,
      state: b ? 'battle' : 'encounter',
      encounter: { ...ex.encounter },
      chance: catchChance(ex.encounter.petId, ex.encounter.level, main?.level ?? 1, ratio, ex.catchTries ?? 0),
    };
    if (b) {
      snap.battle = {
        ...b,
        myPetId: main.petId,
        myLevel: main.level,
        myName: main.nickname ?? PETS[main.petId].name,
      };
    }
    return snap;
  }
  return { ...base, state: 'exploring', remainingSec: Math.max(0, Math.ceil((ex.appearAt - now) / 1000)) };
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

  const waitSec = randInt(loc.delay[0], loc.delay[1], rng);
  player.exploration = {
    id: randomUUID().slice(0, 8),
    locationId,
    startedAt: now,
    appearAt: now + waitSec * 1000,
    encounter: null,
  };
  return { ok: true, resumed: false, snap: snapshot(player, now), commit: true };
}

// [살펴보기]
function lookAround(player, id, now = Date.now(), rng = Math.random) {
  const ex = player.exploration;
  if (!ex || ex.id !== id) return { kind: 'expired' };
  if (ex.encounter) return { kind: 'encounter', snap: snapshot(player, now) };
  if (now < ex.appearAt) return { kind: 'waiting', snap: snapshot(player, now) };

  const loc = LOCATIONS[ex.locationId];
  const spawn = weightedPick(loc.spawns, (s) => s.weight, rng);
  ex.encounter = { petId: spawn.petId, level: randInt(spawn.lv[0], spawn.lv[1], rng) };
  ex.catchTries = 0; // 새 야생 펫이라서 던진 횟수를 0으로 되돌려요
  return { kind: 'appeared', snap: snapshot(player, now), commit: true };
}

// [잡기]
function attemptCatch(player, id, now = Date.now(), rng = Math.random) {
  const ex = player.exploration;
  if (!ex || ex.id !== id || !ex.encounter) return { kind: 'expired' };

  const balls = player.inventory?.[BALL_ID] ?? 0;
  if (balls <= 0) return { kind: 'no_ball', snap: snapshot(player, now) };

  player.inventory[BALL_ID] = balls - 1; // 던지는 순간 해정볼은 사라져요
  const { petId, level } = ex.encounter;
  const hpRatio = ex.battle ? ex.battle.wildHp / ex.battle.wildMax : 1;
  const tries = ex.catchTries ?? 0;
  const chance = catchChance(petId, level, getMainPet(player)?.level ?? 1, hpRatio, tries);

  if (rng() < chance) {
    const isNew = !player.dex?.[petId];
    player.pets.push(createPetInstance(petId, level));
    player.dex = { ...(player.dex ?? {}), [petId]: true };

    const loc = LOCATIONS[ex.locationId];
    const expGain = Math.round(PETS[petId].expYield * loc.expMultiplier * 1.5) + (isNew ? 25 : 0);
    const before = player.level;
    const result = addExp(player, expGain);
    const unlocked = LOCATION_LIST.filter((l) => l.minLevel > before && l.minLevel <= player.level);

    player.exploration = null;
    return {
      kind: 'caught', commit: true, petId, level, isNew, expGain,
      levelsGained: result.levelsGained, newLevel: player.level, unlocked, ballsLeft: balls - 1,
    };
  }

  // 실패! 던진 횟수가 늘어서 이제 도망이 더 쉬워져요
  ex.catchTries = tries + 1;
  if (rng() < fleeChance(ex.catchTries)) {
    player.exploration = null;
    return { kind: 'fled', commit: true, petId, ballsLeft: balls - 1 };
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

// [무시하기] / [그만두기] / [도망] (전투 중이면 'ran')
function leave(player, id) {
  const ex = player.exploration;
  if (!ex || ex.id !== id) return { kind: 'expired' };
  const petId = ex.encounter?.petId ?? null;
  const inBattle = Boolean(ex.battle);
  player.exploration = null;
  return { kind: petId ? (inBattle ? 'ran' : 'ignored') : 'quit', petId, commit: true };
}

// ============================================================
// 시스템: 전투 (systems/battle.js)
// ============================================================

// 전투 규칙 ⚔️ (디스코드와 상관없는 "순수한 게임 규칙")
//
// 전투 흐름: 야생 펫 등장 → [싸우기] → (턴마다 [공격] / [잡기] / [회복] / [도망]) → 승리 / 패배 / 무승부
// player.exploration.battle = { myHp, myMax, wildHp, wildMax, round }
// 한 턴 = 속도가 빠른 쪽이 먼저 때리고, 이어서 상대가 때려요 (속도가 같으면 내 펫이 먼저!)
//
// ❤️ 체력은 전투가 끝나도 이어져요! 매 턴 끝에 대표 펫의 체력(hp)을 저장해요.
//    체력이 0이면 싸울 수 없어요 → 회복약, 시간 경과(자동 회복), 다른 펫로 교체로 해결해요.


// 데미지 = 공격력 - 방어력의 절반 (최소 공격력의 25%) × 랜덤(0.85~1.15), 가끔 급소(×1.5)
function calcDamage(atk, def, rng = Math.random) {
  const base = Math.max(atk * 0.25, atk - def * 0.5);
  const variance = 0.85 + rng() * 0.3;
  const crit = rng() < CRIT_CHANCE;
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
  const { dmg, crit } = calcDamage(c.mine.atk, c.wild.def, rng);
  b.wildHp = Math.max(0, b.wildHp - dmg);
  log.push(`${c.myPet.emoji} ${c.myName}의 공격! ${crit ? '💥 급소! ' : ''}${c.wildPet.name}에게 **${dmg}** 데미지`);
}

function wildAttack(c, b, log, rng) {
  const { dmg, crit } = calcDamage(c.wild.atk, c.mine.def, rng);
  b.myHp = Math.max(0, b.myHp - dmg);
  log.push(`${c.wildPet.emoji} ${c.wildPet.name}의 공격! ${crit ? '💥 급소! ' : ''}${c.myName}에게 **${dmg}** 데미지`);
}

// 한 턴이 끝났을 때: 체력 저장 → 승리/패배/무승부/계속 판정
function finishTurn(player, ex, c, log, now, rng) {
  const b = ex.battle;
  const { main, wildPet, wildInfo, myName } = c;
  b.round += 1;
  setHp(main, b.myHp, now); // ❤️ 전투가 끝나도 체력이 이어져요

  // 승리!
  if (b.wildHp <= 0) {
    const loc = LOCATIONS[ex.locationId];
    const gold = Math.max(1, Math.round(wildPet.expYield * GOLD_PER_YIELD * (0.8 + rng() * 0.4)));
    const trainerExp = Math.round(wildPet.expYield * loc.expMultiplier * WIN_TRAINER_EXP_MULT);
    const petExp = Math.round(wildPet.expYield * loc.expMultiplier * WIN_PET_EXP_MULT);

    player.gold += gold;
    const before = player.level;
    const t = addExp(player, trainerExp);
    const p = addExp(main, petExp);
    if (p.levelsGained > 0) setHp(main, maxHp(main), now); // 레벨업 보너스: 체력 가득!
    const unlocked = LOCATION_LIST.filter((l) => l.minLevel > before && l.minLevel <= player.level);

    player.exploration = null;
    return {
      kind: 'won', commit: true, log,
      wildPetId: wildInfo.petId, wildLevel: wildInfo.level,
      myPetId: main.petId, myName,
      gold, trainerExp, petExp,
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
    return { kind: 'lost', commit: true, log, wildPetId: wildInfo.petId, myName, removedPetId, newStarterId };
  }

  // 너무 오래 끌면 야생 펫이 떠나요
  if (b.round >= BATTLE_MAX_ROUNDS) {
    player.exploration = null;
    return { kind: 'draw', commit: true, log, wildPetId: wildInfo.petId };
  }

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

  ex.battle = { myHp: hp, myMax: c.mine.hp, wildHp: c.wild.hp, wildMax: c.wild.hp, round: 0 };
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
  for (const who of order) {
    if (b.myHp <= 0 || b.wildHp <= 0) break; // 이미 쓰러졌으면 반격 못 해요
    if (who === 'me') myAttack(c, b, log, rng);
    else wildAttack(c, b, log, rng);
  }
  return finishTurn(player, ex, c, log, now, rng);
}

// [회복] — 가방의 회복약을 써요. 약을 먹는 동안 야생 펫이 한 번 공격해요 (한 턴을 써요!)
function battleHeal(player, id, now = Date.now(), rng = Math.random) {
  const ex = player.exploration;
  if (!ex || ex.id !== id || !ex.encounter) return { kind: 'expired' };
  if (!ex.battle) return { kind: 'no_battle' };

  const b = ex.battle;
  if (b.myHp >= b.myMax) return { kind: 'full_hp' };
  const potion = pickPotion(player, b.myMax - b.myHp);
  if (!potion) return { kind: 'no_potion' };

  const c = context(player, ex);
  player.inventory[potion.id] -= 1;
  const before = b.myHp;
  b.myHp = Math.min(b.myMax, b.myHp + potion.heal);
  const log = [`${potion.emoji} ${potion.name}을(를) 썼어요! ${c.myName} 체력 +${b.myHp - before}`];
  wildAttack(c, b, log, rng);
  return finishTurn(player, ex, c, log, now, rng);
}

// ============================================================
// 시스템: 상점 (systems/shop.js)
// ============================================================

// 상점 규칙 🛒 (디스코드와 상관없는 순수한 규칙)

const BUY_AMOUNTS = [1, 5, 10];

function buyItem(player, itemId, qty) {
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

// ============================================================
// 시스템: 도감 (systems/dex.js)
// ============================================================

// 도감 규칙 📖 — 스타팅 펫은 셋 중 하나만 고를 수 있어서, 전체 칸 수는 "야생 펫 + 1" 이에요.

const WILD_COUNT = Object.values(PETS).filter((p) => !p.starter).length;

function dexProgress(player) {
  const found = Object.keys(player.dex ?? {}).filter((id) => PETS[id]).length;
  return { found, total: WILD_COUNT + 1 };
}

// ============================================================
// 시스템: 펫 육성 (systems/care.js)
// ============================================================

// 펫 육성 규칙 🌱 — 별명 짓기 / 방생 / 훈련 (디스코드와 상관없는 순수한 규칙)

const TRAIN_AMOUNTS = [1, 5];

// ───────── 별명 ─────────
// 디스코드 글자 꾸미기/멘션을 깨뜨리는 문자는 막아요
const BAD_NICK = /[@<>`*_~|\\]/;

// name 이 비어 있으면 별명을 지워요. index 는 /펫 목록의 번호(1부터)
function renamePet(player, index, name) {
  const inst = player.pets[index - 1];
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

// ───────── 훈련 ─────────
const trainCost = (level) => TRAIN_BASE_COST + level * TRAIN_COST_PER_LEVEL;
const trainExp = (level) => Math.max(1, Math.round(expToNext(level) * TRAIN_EXP_RATIO));
const levelCap = (player) => Math.min(MAX_LEVEL, player.level + TRAIN_LEVEL_CAP_OVER_TRAINER);

function trainPet(player, uid, times, now = Date.now()) {
  const inst = player.pets.find((p) => p.uid === uid);
  if (!inst) return { kind: 'not_found' };
  if (!TRAIN_AMOUNTS.includes(times)) return { kind: 'not_found' };
  if (player.exploration?.battle && uid === player.mainPetUid) return { kind: 'in_battle' };

  const startLevel = inst.level;
  let done = 0, spent = 0, expGained = 0, stop = null;
  for (let i = 0; i < times; i++) {
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

// ============================================================
// 시스템 묶음 (commands 가 이 이름으로 불러써요)
// ============================================================

const exploreSys = { startExploration, lookAround, attemptCatch, leave };
const battleSys = { startBattle, battleTurn, battleHeal };
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
          : `⭐ ${expBar(main.exp, expToNext(main.level))}  ${main.exp}/${expToNext(main.level)}`);
    }

    const dex = dexProgress(player);

    return reply({
      embeds: [
        {
          title: `🪪 ${player.name}님의 정보`,
          description: levelLine,
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
    });
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
        description: '어디로 떠날까요?',
        required: true,
        choices: LOCATION_LIST.map((l) => ({ name: `${l.emoji} ${l.name} (Lv.${l.minLevel}+)`, value: l.id })),
      },
    ],
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const locationId = getOption(interaction, '장소');

    const out = await updatePlayer(user.id, (p) => {
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

// ───────── 탐험 화면 그리기 ─────────

// 채팅이 쌓여서 패널이 안 보일 때, 채널 맨 아래로 다시 올려주는 버튼이에요
function bumpButton(userId, snapId) {
  return button({ label: '아래로', emoji: '🔽', customId: `explore:bump:${userId}:${snapId}`, style: 2 });
}

function exploreViewExploring(snap, userId, note) {
  const loc = LOCATIONS[snap.locationId];
  const wait =
    snap.remainingSec > 0
      ? `주변을 살피는 중이에요... 🔍\n무언가 나타날 때까지 약 **${snap.remainingSec}초** 남았어요.\n시간이 지나면 **[살펴보기]** 를 눌러요!`
      : `수풀이 부스럭거려요... 👀\n**[살펴보기]** 를 눌러보세요!`;
  return {
    embeds: [{ title: `${loc.emoji} ${loc.name} 탐험 중`, description: `${note ? note + '\n\n' : ''}${wait}`, color: EMBED_COLOR }],
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
        description: `${note ? note + '\n\n' : ''}${grade.emoji} **${grade.name}** 등급 · **Lv.${snap.encounter.level}**`,
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
        description: `${note ? note + '\n\n' : ''}${b.round}턴째 · 약해질수록 **[잡기]** 가 쉬워져요!`,
        color: 0xed4245,
        fields: [
          { name: `${mine.emoji} ${b.myName} Lv.${b.myLevel}`, value: `${exploreHpBar(b.myHp, b.myMax)}\n${b.myHp}/${b.myMax}`, inline: true },
          { name: `${wild.emoji} ${wild.name} Lv.${snap.encounter.level}`, value: `${exploreHpBar(b.wildHp, b.wildMax)}\n${b.wildHp}/${b.wildMax}`, inline: true },
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
    ],
  };
}

function exploreViewSnap(snap, userId, note) {
  if (snap.state === 'battle') return exploreViewBattle(snap, userId, note);
  if (snap.state === 'encounter') return exploreViewEncounter(snap, userId, note);
  return exploreViewExploring(snap, userId, note);
}

const exploreViewExpired = () =>
  update({
    embeds: [{ title: '🍃 이미 지나간 탐험이에요', description: '`/탐험` 으로 새로 떠나보세요!', color: 0x99aab5 }],
    components: [],
  });

// 전투가 끝났을 때(승리/패배/무승부) 화면 — [공격]/[회복]/[잡기] 중 무엇으로 끝났든 똑같이 써요
function battleOutcomeView(out) {
  if (out.kind === 'won') {
    const wild = PETS[out.wildPetId];
    const mine = PETS[out.myPetId];
    const lines = [
      out.log.join('\n'),
      '',
      `${wild.emoji} **${wild.name}** (Lv.${out.wildLevel}) 을(를) 쓰러뜨렸어요!`,
      `💰 골드 +${out.gold}`,
      `⭐ 트레이너 경험치 +${out.trainerExp}`,
      out.levelsGained > 0 ? `🎊 **트레이너 레벨 업!** → Lv.${out.newLevel}` : null,
      `${mine.emoji} ${out.myName} 경험치 +${out.petExp}`,
      out.petLevelsGained > 0 ? `🎊 **${out.myName} 레벨 업!** → Lv.${out.petNewLevel} (체력 가득!)` : null,
      `❤️ ${out.myName} 체력 ${out.petHp}/${out.petMaxHp}`,
      ...out.unlocked.map((l) => `🔓 새 장소 열림: ${l.emoji} **${l.name}**`),
      '\n`/탐험` 으로 계속 모험해요! 체력이 모자라면 `/사용` 으로 회복해요.',
    ].filter((x) => x !== null);
    return update({ embeds: [{ title: '🏆 승리!', description: lines.join('\n'), color: 0x57f287 }], components: [] });
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
      components: [],
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
      components: [],
    });
  }

  return null; // won/lost/draw 가 아니면 이 화면을 쓰지 않아요
}

// ───────── 탐험 버튼 처리 ─────────

async function exploreHandleButton(interaction, args) {
  const [action, ownerId, id] = args;
  const user = getUser(interaction);

  if (user.id !== ownerId) {
    return reply({ content: '이 버튼은 탐험을 시작한 사람만 누를 수 있어요 🙅' }, { ephemeral: true });
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
    return update(exploreViewBattle(out.snap, user.id, '⚔️ 전투 시작! **[공격]** 으로 싸워요.'));
  }

  if (action === 'attack' || action === 'heal') {
    const out = await updatePlayer(user.id, (p) => {
      const r = action === 'attack' ? battleSys.battleTurn(p, id, Date.now()) : battleSys.battleHeal(p, id, Date.now());
      return { commit: r.commit === true, value: r };
    });
    if (!out || out.kind === 'expired') return exploreViewExpired();
    if (out.kind === 'no_battle') {
      return reply({ content: '아직 전투가 시작되지 않았어요! **[싸우기]** 를 먼저 눌러요 ⚔️' }, { ephemeral: true });
    }
    if (out.kind === 'no_potion') {
      return reply({ content: '🧪 회복약이 없어요 😭 `/상점` 에서 사올 수 있어요!' }, { ephemeral: true });
    }
    if (out.kind === 'full_hp') {
      return reply({ content: '체력이 이미 가득해요! 약을 아껴뒀어요 😊' }, { ephemeral: true });
    }
    if (out.kind === 'continue') {
      return update(exploreViewBattle(out.snap, user.id, out.log.join('\n')));
    }
    return battleOutcomeView(out); // won / lost / draw
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

  if (action === 'catch') {
    const out = await updatePlayer(user.id, (p) => {
      const r = exploreSys.attemptCatch(p, id, Date.now());
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
    if (out.kind === 'won' || out.kind === 'lost' || out.kind === 'draw') {
      return battleOutcomeView(out);
    }
    if (out.kind === 'escaped') {
      return update(exploreViewSnap(out.snap, user.id, `💨 앗! 빠져나왔어요! (남은 ${BALL.name} ${out.ballsLeft}개)`));
    }
    if (out.kind === 'fled') {
      const pet = PETS[out.petId];
      return update({
        embeds: [{ title: `💨 ${pet.emoji} ${pet.name}(이)가 도망쳤어요...`, description: `남은 ${BALL.name} ${out.ballsLeft}개\n\`/탐험\` 으로 다시 떠나봐요!`, color: 0xed4245 }],
        components: [],
      });
    }

    // 잡았다!
    const pet = PETS[out.petId];
    const lines = [
      `${GRADES[pet.grade].emoji} ${pet.emoji} **${pet.name}** (Lv.${out.level}) 을(를) 잡았어요!`,
      out.isNew ? '✨ **새로운 도감 등록!**' : null,
      `⭐ 경험치 +${out.expGain}`,
      out.levelsGained > 0 ? `🎊 **트레이너 레벨 업!** → Lv.${out.newLevel}` : null,
      ...out.unlocked.map((l) => `🔓 새 장소 열림: ${l.emoji} **${l.name}**`),
      `\n남은 ${BALL.name} ${out.ballsLeft}개 · \`/탐험\` 으로 계속 모험해요!`,
    ].filter(Boolean);
    return update({ embeds: [{ title: '🎉 잡았다!', description: lines.join('\n'), color: 0x57f287 }], components: [] });
  }

  if (action === 'bump') {
    const player = await getPlayer(user.id);
    const ex = player?.exploration;
    if (!ex || ex.id !== id) return exploreViewExpired();

    const snap = snapshot(player, Date.now());
    await postChannelMessage(interaction.channel_id, exploreViewSnap(snap, user.id));

    return update({
      embeds: [{ title: '🔽 아래로 내려갔어요!', description: '채팅 맨 아래에서 새 탐험 패널을 이어서 눌러주세요!', color: 0x99aab5 }],
      components: [],
    });
  }

  if (action === 'ignore' || action === 'quit' || action === 'run') {
    const out = await updatePlayer(user.id, (p) => {
      const r = exploreSys.leave(p, id);
      return { commit: r.commit === true, value: r };
    });
    if (!out || out.kind === 'expired') return exploreViewExpired();
    const text =
      out.kind === 'ignored'
        ? `👋 ${PETS[out.petId].emoji} ${PETS[out.petId].name}(을)를 그냥 보내줬어요.`
        : out.kind === 'ran'
          ? `🏃 ${PETS[out.petId].emoji} ${PETS[out.petId].name}에게서 도망쳤어요!`
          : '🚪 탐험을 마쳤어요.';
    return update({ embeds: [{ title: text, description: '`/탐험` 으로 다시 떠나볼 수 있어요!', color: 0x99aab5 }], components: [] });
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
    components: SHOP_ITEMS.map((i) =>
      row(
        ...BUY_AMOUNTS.map((q) =>
          button({
            label: `${i.name} ${q}개`,
            emoji: i.emoji,
            customId: `shop:buy:${userId}:${i.id}:${q}`,
            style: 3,
            disabled: player.gold < i.price * q,
          }),
        ),
      ),
    ),
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
    return reply(shopView(player, user.id));
  },

  components: {
    shop: async function shopHandleButton(interaction, args) {
      const [action, ownerId, itemId, qtyStr] = args;
      const user = getUser(interaction);

      if (user.id !== ownerId) {
        return reply({ content: '이 상점은 연 사람만 쓸 수 있어요 🙅 `/상점` 으로 직접 열어보세요!' }, { ephemeral: true });
      }
      if (action !== 'buy') return reply({ content: '이 버튼은 이제 쓸 수 없어요 🥲' }, { ephemeral: true });

      let latest = null;
      const out = await updatePlayer(user.id, (p) => {
        const r = shopSys.buyItem(p, itemId, Number(qtyStr));
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
          description: lines.length ? lines.join('\n\n') : '텅 비었어요... `/상점` 에서 사보세요!',
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
    return (
      `**${start + i + 1}.** ${crown}${GRADES[pet.grade].emoji} ${pet.emoji} **${inst.nickname ?? pet.name}** Lv.${inst.level}\n` +
      `　❤️ ${currentHp(inst)}/${s.hp} · 공격 ${s.atk} · 방어 ${s.def} · 속도 ${s.spd}`
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
      const [action, ownerId, pageStr] = args;
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

      return update({ content: '이 버튼은 이제 쓸 수 없어요 🥲', embeds: [], components: [] });
    },
  },
};

// ═════════════════════════════════════════════
// /도감
// ═════════════════════════════════════════════

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

    const found = player.dex ?? {};
    const { found: count, total } = dexProgress(player);
    const entry = (id) => {
      const pet = PETS[id];
      return found[id] ? `${GRADES[pet.grade].emoji} ${pet.emoji} **${pet.name}**` : '❔ ???';
    };

    const fields = [];
    const myStarters = STARTER_IDS.filter((id) => found[id]);
    if (myStarters.length) {
      fields.push({ name: '🐣 스타팅 펫', value: myStarters.map(entry).join('\n'), inline: true });
    }
    for (const loc of LOCATION_LIST) {
      const ids = [...new Set(loc.spawns.map((s) => s.petId))];
      const have = ids.filter((id) => found[id]).length;
      fields.push({
        name: `${loc.emoji} ${loc.name} (${have}/${ids.length})`,
        value: ids.map(entry).join('\n'),
        inline: true,
      });
    }

    return reply({
      embeds: [
        {
          title: `📖 ${player.name}님의 도감`,
          description: `${expBar(count, total)}  **${count} / ${total}**`,
          color: EMBED_COLOR,
          fields,
          footer: { text: '해정볼로 잡으면 도감에 등록돼요!' },
        },
      ],
    });
  },
};

// ═════════════════════════════════════════════
// /별명
// ═════════════════════════════════════════════

const nickname = {
  data: {
    name: '별명',
    description: '내 해정펫에게 별명을 지어줘요.',
    type: 1,
    options: [
      { type: 4, name: '번호', description: '/펫 목록에 나온 번호', required: true, min_value: 1 },
      { type: 3, name: '이름', description: `새 별명 (최대 ${NICKNAME_MAX}글자, 비우면 원래 이름으로)`, required: false, max_length: 30 },
    ],
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const index = getOption(interaction, '번호');
    const name = getOption(interaction, '이름');

    const out = await updatePlayer(user.id, (p) => {
      const r = renamePet(p, index, name);
      return { commit: r.commit === true, value: r };
    });

    if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
    if (out.kind === 'not_found') return reply({ content: '그 번호의 펫이 없어요 🤔 `/펫` 에서 번호를 확인해주세요!' }, { ephemeral: true });
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

const release = {
  data: {
    name: '방생',
    description: '안 쓰는 해정펫을 보내주고 골드를 받아요.',
    type: 1,
    options: [{ type: 4, name: '번호', description: '/펫 목록에 나온 번호', required: true, min_value: 1 }],
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const player = await getPlayer(user.id);
    if (!player) return reply({ content: NOT_STARTED }, { ephemeral: true });

    const inst = player.pets[getOption(interaction, '번호') - 1];
    if (!inst) return reply({ content: '그 번호의 펫이 없어요 🤔 `/펫` 에서 번호를 확인해주세요!' }, { ephemeral: true });
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
      ),
    ],
  };
}

const train = {
  data: {
    name: '훈련',
    description: '골드를 내고 해정펫을 훈련시켜요.',
    type: 1,
    options: [{ type: 4, name: '번호', description: '/펫 목록에 나온 번호', required: true, min_value: 1 }],
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const player = await getPlayer(user.id);
    if (!player) return reply({ content: NOT_STARTED }, { ephemeral: true });

    const inst = player.pets[getOption(interaction, '번호') - 1];
    if (!inst) return reply({ content: '그 번호의 펫이 없어요 🤔 `/펫` 에서 번호를 확인해주세요!' }, { ephemeral: true });
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
        const r = trainPet(p, uid, Number(timesStr));
        latest = p;
        return { commit: r.commit === true, value: r };
      });
      if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
      if (out.kind === 'not_found') return reply({ content: '그 펫을 찾을 수 없어요 🤔 `/펫` 으로 다시 확인해주세요!' }, { ephemeral: true });
      if (out.kind === 'in_battle') return reply({ content: '⚔️ 전투 중인 대표 펫은 훈련할 수 없어요! 전투를 끝내고 와주세요.' }, { ephemeral: true });
      if (out.kind === 'no_gold') return reply({ content: '💸 골드가 부족해요! 전투나 방생으로 모아보세요.' }, { ephemeral: true });
      if (out.kind === 'cap') return reply({ content: '🔒 더 이상 훈련할 수 없어요! 트레이너 레벨을 올려보세요.' }, { ephemeral: true });

      const inst = latest.pets.find((x) => x.uid === uid);
      const parts = [`✅ ${out.done}회 훈련! 💰 -${out.spent} · ⭐ +${out.expGained}`];
      if (out.levelsGained > 0) parts.push(`🎊 **레벨 업!** → Lv.${out.newLevel}`);
      if (out.stop === 'no_gold') parts.push('골드가 모자라서 여기까지만 했어요.');
      if (out.stop === 'cap') parts.push('레벨 상한에 도달해서 여기까지만 했어요.');
      return update(trainView(latest, user.id, inst, parts.join('\n')));
    },
  },
};

// ═════════════════════════════════════════════
// /사용
// ═════════════════════════════════════════════

const use = {
  data: {
    name: '사용',
    description: '회복약을 써서 해정펫의 체력을 채워요.',
    type: 1,
    options: [
      {
        type: 3,
        name: '아이템',
        description: '어떤 약을 쓸까요?',
        required: true,
        choices: POTIONS.map((i) => ({ name: `${i.emoji} ${i.name}`, value: i.id })),
      },
      { type: 4, name: '수량', description: '한 번에 몇 개 쓸까요? (비우면 1개, 일괄 사용 가능)', required: false, min_value: 1 },
      {
        type: 3,
        name: '대상',
        description: '펫 번호나 이름을 입력하세요 (비우면 대표 펫) — 입력하면 체력이 바로 미리 보여요',
        required: false,
        autocomplete: true,
      },
    ],
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const itemId = getOption(interaction, '아이템');
    const qty = getOption(interaction, '수량') ?? 1;
    const target = getOption(interaction, '대상');

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
    const user = getUser(interaction);
    const player = await getPlayer(user.id);
    if (!player) return autocompleteResult([]);

    const typed = String(getOption(interaction, '대상') ?? '').trim().toLowerCase();
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
          name: `${crown}${c.index}. ${PETS[c.inst.petId].emoji} ${c.label} (❤${cur}/${max})`,
          value: c.inst.uid,
        };
      });

    return autocompleteResult(choices);
  },
};

// ═════════════════════════════════════════════
// /도움말
// ═════════════════════════════════════════════

const pct = (v) => Math.round(v * 100);

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
                  '`/탐험` 으로 장소를 골라 떠나요. **[살펴보기]** 를 누르면 야생 펫이 나타나요.\n' +
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
                  `**[공격]**, **[잡기]**, **[회복]** 은 모두 한 턴을 써요. 턴 끝에는 야생 펫이 반격해요.\n` +
                  `치명타 확률 ${pct(CRIT_CHANCE)}%, ${BATTLE_MAX_ROUNDS}턴 안에 끝나지 않으면 야생 펫이 도망가요.\n` +
                  `⚠️ **체력이 0이 되면 그 펫은 영영 사라져요!** 전투 전에 체력을 꼭 확인해요.`,
              },
              {
                name: '🧪 회복',
                value:
                  '`/사용` 으로 회복약을 써요. 수량을 골라 여러 개를 한 번에 쓸 수도 있어요.\n' +
                  '전투 중에는 **[회복]** 버튼으로 한 턴에 한 개씩 써요.',
              },
              {
                name: '🐾 펫 관리',
                value:
                  '`/펫` 으로 목록과 대표 펫(👑)을 확인해요. `/별명`, `/훈련`, `/방생` 으로 키우고 정리해요.',
              },
              {
                name: '🛒 상점 · 도감 · 가방',
                value: '`/상점` 에서 골드로 아이템을 사고, `/가방` 에서 가진 물건을 봐요. `/도감` 은 만난 펫을 기록해요.',
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
// 내보내기: router.js 가 이 목록을 그대로 써요
// ═════════════════════════════════════════════

const commandModules = [start, profile, places, explore, shop, bag, pets, dexCmd, nickname, release, train, use, help];

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

export async function handleInteraction(interaction) {
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

    case InteractionType.COMPONENT: {
      const [prefix, ...args] = interaction.data.custom_id.split(':');
      const handler = componentHandlers.get(prefix);
      if (!handler) return reply({ content: '이 버튼은 이제 쓸 수 없어요 🥲' }, { ephemeral: true });
      return handler(interaction, args);
    }

    default:
      return reply({ content: '아직 모르는 종류의 요청이에요 🤔' }, { ephemeral: true });
  }
}