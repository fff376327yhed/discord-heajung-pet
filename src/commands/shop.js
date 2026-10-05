// /상점 — 골드로 아이템을 사요! 🛒
import { ITEMS } from '../data/items.js';
import { EMBED_COLOR } from '../config.js';
import { getPlayer, updatePlayer } from '../db.js';
import { buyItem, BUY_AMOUNTS } from '../systems/shop.js';
import { reply, update, getUser, button, row } from '../utils/discord.js';

export const data = {
  name: '상점',
  description: '골드로 해정볼 같은 아이템을 사요.',
  type: 1,
};

const NOT_STARTED = '아직 모험을 시작하지 않았어요! `/시작` 을 먼저 해주세요 🐣';
const SHOP_ITEMS = Object.values(ITEMS).filter((i) => i.price);

function viewShop(player, userId, note) {
  const lines = SHOP_ITEMS.map(
    (i) =>
      `${i.emoji} **${i.name}** — 💰 ${i.price}골드 (보유 ${player.inventory?.[i.id] ?? 0}개)\n　${i.description}`,
  );
  return {
    embeds: [
      {
        title: '🛒 해정 상점',
        description: `${note ? note + '\n\n' : ''}${lines.join('\n\n')}`,
        color: EMBED_COLOR,
        footer: { text: `내 골드: ${player.gold.toLocaleString('ko-KR')}` },
      },
    ],
    components: SHOP_ITEMS.map((i) =>
      row(
        ...BUY_AMOUNTS.map((q) =>
          button({
            label: `${i.name} ${q}개`,
            emoji: i.emoji,
            customId: `shop:buy:${userId}:${i.id}:${q}`,
            style: 3,
            disabled: player.gold < i.price * q,
          }),
        ),
      ),
    ),
  };
}

export async function execute(interaction) {
  const user = getUser(interaction);
  const player = await getPlayer(user.id);
  if (!player) return reply({ content: NOT_STARTED }, { ephemeral: true });
  return reply(viewShop(player, user.id));
}

async function handleShop(interaction, args) {
  const [action, ownerId, itemId, qtyStr] = args;
  const user = getUser(interaction);

  if (user.id !== ownerId) {
    return reply({ content: '이 상점은 연 사람만 쓸 수 있어요 🙅 `/상점` 으로 직접 열어보세요!' }, { ephemeral: true });
  }
  if (action !== 'buy') return reply({ content: '이 버튼은 이제 쓸 수 없어요 🥲' }, { ephemeral: true });

  let latest = null;
  const out = await updatePlayer(user.id, (p) => {
    const r = buyItem(p, itemId, Number(qtyStr));
    latest = p;
    return { commit: r.commit === true, value: r };
  });
  if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
  if (out.kind === 'unknown') return reply({ content: '그런 물건은 없어요 🤔' }, { ephemeral: true });

  if (out.kind === 'no_gold') {
    return reply({ content: `💸 골드가 부족해요! (필요 ${out.cost} / 보유 ${out.gold})` }, { ephemeral: true });
  }

  const item = ITEMS[out.itemId];
  return update(
    viewShop(latest, user.id, `✅ ${item.emoji} **${item.name}** ${out.qty}개를 샀어요! (-${out.cost}골드, 보유 ${out.owned}개)`),
  );
}

export const components = { shop: handleShop };
