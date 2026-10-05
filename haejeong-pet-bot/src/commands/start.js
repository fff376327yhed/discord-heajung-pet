// /시작 — 첫 해정펫을 고르고 모험을 시작해요! 🎉
import { PETS, GRADES, STARTER_IDS } from '../data/pets.js';
import { EMBED_COLOR } from '../config.js';
import { buildNewPlayer } from '../systems/player.js';
import { calcStats } from '../systems/pet.js';
import { createPlayer, getPlayer } from '../db.js';
import { reply, update, getUser, button, row } from '../utils/discord.js';

export const data = {
  name: '시작',
  description: '모험을 시작하고 첫 해정펫을 받아요!',
  type: 1,
};

export async function execute(interaction) {
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
            customId: `start:${id}:${user.id}`, // 누가 만든 메시지인지 같이 적어둬요
            style: 1,
          }),
        ),
      ),
    ],
  });
}

async function pickStarter(interaction, args) {
  const [petId, ownerId] = args;
  const user = getUser(interaction);

  // 다른 사람이 남의 버튼을 누르면 막아요
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
}

export const components = { start: pickStarter };
