// /별명 — 내 펫에게 이름을 지어줘요 🏷️
import { PETS, GRADES } from '../data/pets.js';
import { NICKNAME_MAX } from '../config.js';
import { updatePlayer } from '../db.js';
import { renamePet } from '../systems/care.js';
import { reply, getUser, getOption } from '../utils/discord.js';

export const data = {
  name: '별명',
  description: '내 해정펫에게 별명을 지어줘요.',
  type: 1,
  options: [
    { type: 4, name: '번호', description: '/펫 목록에 나온 번호', required: true, min_value: 1 },
    { type: 3, name: '이름', description: `새 별명 (최대 ${NICKNAME_MAX}글자, 비우면 원래 이름으로)`, required: false, max_length: 30 },
  ],
};

export async function execute(interaction) {
  const user = getUser(interaction);
  const index = getOption(interaction, '번호');
  const name = getOption(interaction, '이름');

  const out = await updatePlayer(user.id, (p) => {
    const r = renamePet(p, index, name);
    return { commit: r.commit === true, value: r };
  });

  if (out === null) return reply({ content: '아직 모험을 시작하지 않았어요! `/시작` 을 먼저 해주세요 🐣' }, { ephemeral: true });
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
}
