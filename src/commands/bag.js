// /가방 — 내가 가진 물건을 봐요 🎒
import { ITEMS } from '../data/items.js';
import { EMBED_COLOR } from '../config.js';
import { getPlayer } from '../db.js';
import { reply, getUser } from '../utils/discord.js';

export const data = {
  name: '가방',
  description: '내가 가진 아이템과 골드를 봐요.',
  type: 1,
};

export async function execute(interaction) {
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
}
