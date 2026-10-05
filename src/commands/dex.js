// /도감 — 잡아본 펫과 아직 못 만난 펫(???)을 보여줘요 📖
import { LOCATION_LIST } from '../data/locations.js';
import { PETS, GRADES, STARTER_IDS } from '../data/pets.js';
import { EMBED_COLOR } from '../config.js';
import { expBar } from '../systems/level.js';
import { dexProgress } from '../systems/dex.js';
import { getPlayer } from '../db.js';
import { reply, getUser } from '../utils/discord.js';

export const data = {
  name: '도감',
  description: '지금까지 잡은 해정펫 도감을 봐요.',
  type: 1,
};

const entry = (found, id) => {
  const pet = PETS[id];
  return found[id] ? `${GRADES[pet.grade].emoji} ${pet.emoji} **${pet.name}**` : '❔ ???';
};

export async function execute(interaction) {
  const user = getUser(interaction);
  const player = await getPlayer(user.id);
  if (!player) {
    return reply({ content: '아직 모험을 시작하지 않았어요! `/시작` 을 먼저 해주세요 🐣' }, { ephemeral: true });
  }

  const found = player.dex ?? {};
  const { found: count, total } = dexProgress(player);

  const fields = [];
  const myStarters = STARTER_IDS.filter((id) => found[id]);
  if (myStarters.length) {
    fields.push({ name: '🐣 스타팅 펫', value: myStarters.map((id) => entry(found, id)).join('\n'), inline: true });
  }
  for (const loc of LOCATION_LIST) {
    const ids = [...new Set(loc.spawns.map((s) => s.petId))];
    const have = ids.filter((id) => found[id]).length;
    fields.push({
      name: `${loc.emoji} ${loc.name} (${have}/${ids.length})`,
      value: ids.map((id) => entry(found, id)).join('\n'),
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
}
