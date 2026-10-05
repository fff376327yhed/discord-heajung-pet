// /사용 — 회복약으로 펫 체력을 채워요 🧪
import { PETS, GRADES } from '../data/pets.js';
import { updatePlayer } from '../db.js';
import { POTIONS, useItem } from '../systems/use.js';
import { reply, getUser, getOption } from '../utils/discord.js';

export const data = {
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
};

export async function execute(interaction) {
  const user = getUser(interaction);
  const itemId = getOption(interaction, '아이템');
  const index = getOption(interaction, '번호');

  const out = await updatePlayer(user.id, (p) => {
    const r = useItem(p, itemId, index);
    return { commit: r.commit === true, value: r };
  });

  if (out === null) return reply({ content: '아직 모험을 시작하지 않았어요! `/시작` 을 먼저 해주세요 🐣' }, { ephemeral: true });
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
}
