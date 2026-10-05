// /탐험 — 장소를 골라 야생 해정펫을 만나러 가요! 🌿
import { LOCATIONS, LOCATION_LIST } from '../data/locations.js';
import { PETS, GRADES } from '../data/pets.js';
import { ITEMS } from '../data/items.js';
import { EMBED_COLOR } from '../config.js';
import { updatePlayer } from '../db.js';
import * as explore from '../systems/explore.js';
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

function chanceLabel(chance) {
  if (chance >= 0.6) return '쉬움 😄';
  if (chance >= 0.3) return '보통 🙂';
  if (chance >= 0.1) return '어려움 😰';
  return '아주 어려움 😱';
}

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
          `${note ? note + '\n\n' : ''}${grade.emoji} **${grade.name}** 등급 · **Lv.${snap.encounter.level}**\n` +
          `잡기 난이도: **${chanceLabel(snap.chance)}**`,
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
    return reply(
      { content: '⚔️ 전투는 아직 준비 중이에요! 지금은 **[잡기]** 나 **[무시하기]** 를 골라주세요.' },
      { ephemeral: true },
    );
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
    return update(viewEncounter(out.snap, user.id));
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
      return update(viewEncounter(out.snap, user.id, `💨 앗! 빠져나왔어요! (남은 ${BALL.name} ${out.ballsLeft}개)`));
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

  if (action === 'ignore' || action === 'quit') {
    const out = await updatePlayer(user.id, (p) => {
      const r = explore.leave(p, id);
      return { commit: r.commit === true, value: r };
    });
    if (!out || out.kind === 'expired') return viewExpired();
    const text =
      out.kind === 'ignored'
        ? `👋 ${PETS[out.petId].emoji} ${PETS[out.petId].name}(을)를 그냥 보내줬어요.`
        : '🚪 탐험을 마쳤어요.';
    return update({ embeds: [{ title: text, description: '`/탐험` 으로 다시 떠나볼 수 있어요!', color: 0x99aab5 }], components: [] });
  }

  return reply({ content: '이 버튼은 이제 쓸 수 없어요 🥲' }, { ephemeral: true });
}

export const components = { explore: handleExplore };
