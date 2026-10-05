// /탐험 — 장소를 골라 야생 해정펫을 만나러 가요! 🌿
import { LOCATIONS, LOCATION_LIST } from '../data/locations.js';
import { PETS, GRADES } from '../data/pets.js';
import { ITEMS } from '../data/items.js';
import { EMBED_COLOR } from '../config.js';
import { updatePlayer } from '../db.js';
import * as explore from '../systems/explore.js';
import * as battle from '../systems/battle.js';
import { reply, update, getUser, getOption, button, row } from '../utils/discord.js';

export const data = {
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
};

const BALL = ITEMS.haejeong_ball;
const NOT_STARTED = '아직 모험을 시작하지 않았어요! `/시작` 을 먼저 해주세요 🐣';

// ───────── 화면 그리기 ─────────



function viewExploring(snap, userId, note) {
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

function viewEncounter(snap, userId, note) {
  const pet = PETS[snap.encounter.petId];
  const grade = GRADES[pet.grade];
  const loc = LOCATIONS[snap.locationId];
  return {
    embeds: [
      {
        title: `❗ 야생의 ${pet.emoji} ${pet.name}(이)가 나타났다!`,
        description:
                    `${grade.emoji} **${grade.name}** 등급 · **Lv.${snap.encounter.level}**`,

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

function hpBar(cur, max, size = 10) {
  const filled = cur <= 0 ? 0 : Math.max(1, Math.min(size, Math.ceil((cur / max) * size)));
  return '▰'.repeat(filled) + '▱'.repeat(size - filled);
}

function viewBattle(snap, userId, note) {
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
          { name: `${mine.emoji} ${b.myName} Lv.${b.myLevel}`, value: `${hpBar(b.myHp, b.myMax)}\n${b.myHp}/${b.myMax}`, inline: true },
          { name: `${wild.emoji} ${wild.name} Lv.${snap.encounter.level}`, value: `${hpBar(b.wildHp, b.wildMax)}\n${b.wildHp}/${b.wildMax}`, inline: true },
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

// 지금 상태에 맞는 화면을 골라줘요 (전투 중이면 전투 화면!)
function viewSnap(snap, userId, note) {
  if (snap.state === 'battle') return viewBattle(snap, userId, note);
  if (snap.state === 'encounter') return viewEncounter(snap, userId, note);
  return viewExploring(snap, userId, note);
}

const viewExpired = () =>
  update({
    embeds: [{ title: '🍃 이미 지나간 탐험이에요', description: '`/탐험` 으로 새로 떠나보세요!', color: 0x99aab5 }],
    components: [],
  });

// ───────── /탐험 ─────────

export async function execute(interaction) {
  const user = getUser(interaction);
  const locationId = getOption(interaction, '장소');

  const out = await updatePlayer(user.id, (p) => {
    const r = explore.startExploration(p, locationId, Date.now());
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
    return reply(viewBattle(out.snap, user.id, '전투가 아직 끝나지 않았어요!'));
  }
  if (out.snap.state === 'encounter') {
    return reply(viewEncounter(out.snap, user.id, '앗, 아직 결정하지 않은 야생 펫이 있어요!'));
  }
  const note = out.resumed
    ? out.sameLocation
      ? '이미 탐험 중이에요! 이어서 해볼까요?'
      : '이미 다른 곳을 탐험 중이에요! 다른 곳으로 가려면 먼저 **[그만두기]** 를 눌러요.'
    : null;
  return reply(viewExploring(out.snap, user.id, note));
}

// ───────── 버튼 ─────────

async function handleExplore(interaction, args) {
  const [action, ownerId, id] = args;
  const user = getUser(interaction);

  if (user.id !== ownerId) {
    return reply({ content: '이 버튼은 탐험을 시작한 사람만 누를 수 있어요 🙅' }, { ephemeral: true });
  }

  if (action === 'fight') {
    const out = await updatePlayer(user.id, (p) => {
      const r = battle.startBattle(p, id, Date.now());
      return { commit: r.commit === true, value: r };
    });
    if (!out || out.kind === 'expired') return viewExpired();
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
    return update(viewBattle(out.snap, user.id, '⚔️ 전투 시작! **[공격]** 으로 싸워요.'));
  }

  if (action === 'attack' || action === 'heal') {
    const out = await updatePlayer(user.id, (p) => {
      const r = action === 'attack' ? battle.battleTurn(p, id, Date.now()) : battle.battleHeal(p, id, Date.now());
      return { commit: r.commit === true, value: r };
    });
    if (!out || out.kind === 'expired') return viewExpired();
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
      return update(viewBattle(out.snap, user.id, out.log.join('\n')));
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
      const r = explore.lookAround(p, id, Date.now());
      return { commit: r.commit === true, value: r };
    });
    if (!out || out.kind === 'expired') return viewExpired();
    if (out.kind === 'waiting') {
      return update(viewExploring(out.snap, user.id, '아직 아무것도 안 나타났어요. 조금만 더 기다려봐요 ⏳'));
    }
    return update(viewSnap(out.snap, user.id));
  }

  if (action === 'catch') {
    const out = await updatePlayer(user.id, (p) => {
      const r = explore.attemptCatch(p, id, Date.now());
      return { commit: r.commit === true, value: r };
    });
    if (!out || out.kind === 'expired') return viewExpired();

    if (out.kind === 'no_ball') {
      return reply({ content: `${BALL.emoji} ${BALL.name}이(가) 없어요 😭 \`/상점\` 에서 사올 수 있어요!` }, { ephemeral: true });
    }
    if (out.kind === 'escaped') {
      return update(viewSnap(out.snap, user.id, `💨 앗! 빠져나왔어요! (남은 ${BALL.name} ${out.ballsLeft}개)`));
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
      const r = explore.leave(p, id);
      return { commit: r.commit === true, value: r };
    });
    if (!out || out.kind === 'expired') return viewExpired();
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

export const components = { explore: handleExplore };
