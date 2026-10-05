// /방생 — 안 쓰는 펫을 자연으로 보내주고 골드를 받아요 🕊️
import { PETS, GRADES } from '../data/pets.js';
import { getPlayer, updatePlayer } from '../db.js';
import { releaseValue, releasePet } from '../systems/care.js';
import { reply, update, getUser, getOption, button, row } from '../utils/discord.js';

export const data = {
  name: '방생',
  description: '안 쓰는 해정펫을 보내주고 골드를 받아요.',
  type: 1,
  options: [{ type: 4, name: '번호', description: '/펫 목록에 나온 번호', required: true, min_value: 1 }],
};

const NOT_STARTED = '아직 모험을 시작하지 않았어요! `/시작` 을 먼저 해주세요 🐣';
const nameOf = (inst) => inst.nickname ?? PETS[inst.petId].name;

export async function execute(interaction) {
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
}

async function handleRelease(interaction, args) {
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
}

export const components = { release: handleRelease };
