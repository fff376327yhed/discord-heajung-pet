// /내정보 — 내(또는 친구) 정보를 보여줘요 🪪
import { PETS, GRADES } from '../data/pets.js';
import { ITEMS } from '../data/items.js';
import { EMBED_COLOR, MAX_LEVEL } from '../config.js';
import { expToNext, expBar } from '../systems/level.js';
import { calcStats, currentHp } from '../systems/pet.js';
import { dexProgress } from '../systems/dex.js';
import { getMainPet } from '../systems/player.js';
import { getPlayer } from '../db.js';
import { reply, getUser, getOption } from '../utils/discord.js';

export const data = {
  name: '내정보',
  description: '내 레벨, 재화, 해정펫 정보를 볼 수 있어요.',
  type: 1,
  options: [
    { type: 6, name: '유저', description: '다른 사람의 정보를 보고 싶을 때 선택하세요 (비우면 내 정보)', required: false },
  ],
};

export async function execute(interaction) {
  const me = getUser(interaction);
  const targetId = getOption(interaction, '유저') ?? me.id;
  const isMe = targetId === me.id;

  const player = await getPlayer(targetId);
  if (!player) {
    return reply(
      { content: isMe ? '아직 모험을 시작하지 않았어요! `/시작` 을 먼저 해주세요 🐣' : '그 사람은 아직 모험을 시작하지 않았어요.' },
      { ephemeral: true },
    );
  }

  const need = expToNext(player.level);
  const levelLine =
    player.level >= MAX_LEVEL
      ? `⭐ **Lv.${player.level}** (MAX)`
      : `⭐ **Lv.${player.level}**  ${expBar(player.exp, need)}  ${player.exp}/${need}`;

  const main = getMainPet(player);
  let mainText = '없음';
  if (main) {
    const pet = PETS[main.petId];
    const s = calcStats(main.petId, main.level);
    const name = main.nickname ?? pet.name;
    mainText =
      `${GRADES[pet.grade].emoji} ${pet.emoji} **${name}** Lv.${main.level}\n` +
      `❤️ ${currentHp(main)}/${s.hp} · 공격 ${s.atk} · 방어 ${s.def} · 속도 ${s.spd}\n` +
      (main.level >= MAX_LEVEL
        ? '⭐ MAX'
        : `⭐ ${expBar(main.exp, expToNext(main.level))}  ${main.exp}/${expToNext(main.level)}`);
  }

  const ball = ITEMS.haejeong_ball;
  const dex = dexProgress(player);

  return reply({
    embeds: [
      {
        title: `🪪 ${player.name}님의 정보`,
        description: levelLine,
        color: EMBED_COLOR,
        fields: [
          { name: '💰 골드', value: `${player.gold.toLocaleString('ko-KR')}`, inline: true },
          { name: `${ball.emoji} ${ball.name}`, value: `${player.inventory?.[ball.id] ?? 0}개`, inline: true },
          { name: '📖 도감', value: `${dex.found} / ${dex.total}`, inline: true },
          { name: '🐾 보유 펫', value: `${player.pets.length}마리`, inline: true },
          { name: '👑 대표 펫', value: mainText },
        ],
      },
    ],
  });
}
