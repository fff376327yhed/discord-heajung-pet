// /장소 — 갈 수 있는 곳과 아직 잠긴 곳을 보여줘요 🗺️
import { LOCATION_LIST } from '../data/locations.js';
import { PETS } from '../data/pets.js';
import { EMBED_COLOR } from '../config.js';
import { getPlayer } from '../db.js';
import { reply, getUser } from '../utils/discord.js';

export const data = {
  name: '장소',
  description: '모험할 수 있는 장소 목록을 봐요.',
  type: 1,
};

export async function execute(interaction) {
  const user = getUser(interaction);
  const player = await getPlayer(user.id);
  if (!player) {
    return reply({ content: '아직 모험을 시작하지 않았어요! `/시작` 을 먼저 해주세요 🐣' }, { ephemeral: true });
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
}
