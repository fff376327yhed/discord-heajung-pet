// /펫 — 내 해정펫 목록을 보고 대표 펫을 바꿔요 🐾
import { PETS, GRADES } from '../data/pets.js';
import { EMBED_COLOR } from '../config.js';
import { getPlayer, updatePlayer } from '../db.js';
import { calcStats, currentHp } from '../systems/pet.js';
import { setMainPet } from '../systems/player.js';
import { reply, update, getUser, button, row, select } from '../utils/discord.js';

export const data = {
  name: '펫',
  description: '내 해정펫 목록을 보고 대표 펫을 바꿔요.',
  type: 1,
};

const NOT_STARTED = '아직 모험을 시작하지 않았어요! `/시작` 을 먼저 해주세요 🐣';
const PAGE_SIZE = 10;

function viewPets(player, userId, page = 0, note) {
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

export async function execute(interaction) {
  const user = getUser(interaction);
  const player = await getPlayer(user.id);
  if (!player) return reply({ content: NOT_STARTED }, { ephemeral: true });
  return reply(viewPets(player, user.id, 0));
}

async function handlePets(interaction, args) {
  const [action, ownerId, pageStr] = args;
  const user = getUser(interaction);
  const page = Number(pageStr) || 0;

  if (user.id !== ownerId) {
    return reply({ content: '이 목록은 연 사람만 쓸 수 있어요 🙅 `/펫` 으로 직접 열어보세요!' }, { ephemeral: true });
  }

  if (action === 'page') {
    const player = await getPlayer(user.id);
    if (!player) return reply({ content: NOT_STARTED }, { ephemeral: true });
    return update(viewPets(player, user.id, page));
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
    return update(viewPets(latest, user.id, page, note));
  }

  return update({ content: '이 버튼은 이제 쓸 수 없어요 🥲', embeds: [], components: [] });
}

export const components = { pets: handlePets };
