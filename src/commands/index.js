// commands/index.js — 모든 명령어를 한 파일에 모았어요 📚
import { PETS, GRADES, STARTER_IDS } from '../data/pets.js';
import { LOCATIONS, LOCATION_LIST } from '../data/locations.js';
import { ITEMS } from '../data/items.js';
import {
  EMBED_COLOR, MAX_LEVEL, NICKNAME_MAX,
  CATCH_DROP_PER_TRY, FLEE_BASE, FLEE_RISE_PER_TRY, FLEE_MAX,
  BATTLE_MAX_ROUNDS, CRIT_CHANCE,
} from '../config.js';
import { getPlayer, createPlayer, updatePlayer } from '../db.js';
import { reply, update, getUser, getOption, button, row, select } from '../utils/discord.js';
import * as exploreSys from '../systems/explore.js';
import * as battleSys from '../systems/battle.js';
import * as shopSys from '../systems/shop.js';
import * as useSys from '../systems/use.js';
import { dexProgress } from '../systems/dex.js';
import { expToNext, expBar } from '../systems/level.js';
import { calcStats, currentHp } from '../systems/pet.js';
import { buildNewPlayer, getMainPet, setMainPet } from '../systems/player.js';
import { renamePet, releaseValue, releasePet, trainCost, trainExp, levelCap, trainPet, TRAIN_AMOUNTS } from '../systems/care.js';
import { POTIONS, useItem } from '../systems/use.js';
import { buyItem, BUY_AMOUNTS } from '../systems/shop.js';

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
      return update({
        embeds: [{
          title: `😵 ${out.myName}(이)가 쓰러졌어요...`,
          description:
            `${out.log.join('\n')}\n\n${wild.emoji} ${wild.name}(이)가 떠나갔어요. 골드는 잃지 않았어요!\n` +
            '💫 기절한 펫은 `/사용` 으로 회복약을 먹이거나, 시간이 지나면 조금씩 깨어나요.\n' +
            '`/펫` 에서 다른 펫을 대표로 바꿔 계속 모험할 수도 있어요!',
          color: 0xed4245,
        }],
        components: [],
      });
    }
    // draw
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
      { type: 4, name: '번호', description: '/펫 목록의 번호 (비우면 대표 펫)', required: false, min_value: 1 },
    ],
  },

  async execute(interaction) {
    const user = getUser(interaction);
    const itemId = getOption(interaction, '아이템');
    const index = getOption(interaction, '번호');

    const out = await updatePlayer(user.id, (p) => {
      const r = useItem(p, itemId, index);
      return { commit: r.commit === true, value: r };
    });

    if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
    if (out.kind === 'unknown') return reply({ content: '그런 약은 없어요 🤔' }, { ephemeral: true });
    if (out.kind === 'not_found') return reply({ content: '그 번호의 펫이 없어요 🤔 `/펫` 에서 번호를 확인해주세요!' }, { ephemeral: true });
    if (out.kind === 'in_battle') {
      return reply({ content: '⚔️ 전투 중에는 전투 화면의 **[회복]** 버튼으로만 쓸 수 있어요!' }, { ephemeral: true });
    }
    if (out.kind === 'none') {
      return reply({ content: `${out.item.emoji} ${out.item.name}이(가) 없어요 😭 \`/상점\` 에서 사올 수 있어요!` }, { ephemeral: true });
    }

    const pet = PETS[out.inst.petId];
    const name = `${GRADES[pet.grade].emoji} ${pet.emoji} **${out.inst.nickname ?? pet.name}**`;
    if (out.kind === 'full') return reply({ content: `${name}의 체력은 이미 가득해요! 약을 아껴뒀어요 😊` }, { ephemeral: true });

    return reply({
      content: `${out.item.emoji} ${out.item.name}을(를) 먹였어요!\n${name} ❤️ ${out.before} → **${out.after}/${out.max}** (남은 ${out.item.name} ${out.left}개)`,
    });
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
                  `**[공격]**, **[잡기]**, **[회복]**, **[교체]** 는 모두 한 턴을 써요. 턴 끝에는 야생 펫이 반격해요.\n` +
                  `치명타 확률 ${pct(CRIT_CHANCE)}%, ${BATTLE_MAX_ROUNDS}턴 안에 끝나지 않으면 야생 펫이 도망가요.`,
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

export const commandModules = [start, profile, places, explore, shop, bag, pets, dexCmd, nickname, release, train, use, help];