// /훈련 — 골드를 내고 펫을 훈련시켜 경험치를 줘요 🏋️ (대표 펫이 아닌 펫도 키울 수 있어요!)
import { PETS, GRADES } from '../data/pets.js';
import { EMBED_COLOR } from '../config.js';
import { expToNext, expBar } from '../systems/level.js';
import { trainCost, trainExp, levelCap, trainPet, TRAIN_AMOUNTS } from '../systems/care.js';
import { getPlayer, updatePlayer } from '../db.js';
import { reply, update, getUser, getOption, button, row } from '../utils/discord.js';

export const data = {
  name: '훈련',
  description: '골드를 내고 해정펫을 훈련시켜요.',
  type: 1,
  options: [{ type: 4, name: '번호', description: '/펫 목록에 나온 번호', required: true, min_value: 1 }],
};

const NOT_STARTED = '아직 모험을 시작하지 않았어요! `/시작` 을 먼저 해주세요 🐣';

function viewTrain(player, userId, inst, note) {
  const pet = PETS[inst.petId];
  const cap = levelCap(player);
  const atCap = inst.level >= cap;
  const cost = trainCost(inst.level);
  const need = expToNext(inst.level);
  const lines = [
    `${GRADES[pet.grade].emoji} ${pet.emoji} **${inst.nickname ?? pet.name}** Lv.${inst.level}`,
    `⭐ ${expBar(inst.exp, need)}  ${inst.exp}/${need}`,
    '',
    atCap
      ? `🔒 지금은 **Lv.${cap}** 까지만 훈련할 수 있어요. 트레이너 레벨을 올리면 더 키울 수 있어요!`
      : `🏋️ 1회: 💰 ${cost} 골드 → ⭐ 경험치 +${trainExp(inst.level)}\n(훈련은 트레이너 레벨 기준 **Lv.${cap}** 까지)`,
  ];
  return {
    embeds: [
      {
        title: '🏋️ 훈련장',
        description: `${note ? note + '\n\n' : ''}${lines.join('\n')}`,
        color: EMBED_COLOR,
        footer: { text: `내 골드: ${player.gold.toLocaleString('ko-KR')}` },
      },
    ],
    components: [
      row(
        ...TRAIN_AMOUNTS.map((n) =>
          button({
            label: `훈련 ${n}회`,
            emoji: '🏋️',
            customId: `train:go:${userId}:${inst.uid}:${n}`,
            style: 1,
            disabled: atCap || player.gold < cost,
          }),
        ),
      ),
    ],
  };
}

export async function execute(interaction) {
  const user = getUser(interaction);
  const player = await getPlayer(user.id);
  if (!player) return reply({ content: NOT_STARTED }, { ephemeral: true });

  const inst = player.pets[getOption(interaction, '번호') - 1];
  if (!inst) return reply({ content: '그 번호의 펫이 없어요 🤔 `/펫` 에서 번호를 확인해주세요!' }, { ephemeral: true });
  return reply(viewTrain(player, user.id, inst));
}

async function handleTrain(interaction, args) {
  const [action, ownerId, uid, timesStr] = args;
  const user = getUser(interaction);

  if (user.id !== ownerId) {
    return reply({ content: '이 훈련장은 연 사람만 쓸 수 있어요 🙅 `/훈련` 으로 직접 열어보세요!' }, { ephemeral: true });
  }
  if (action !== 'go') return reply({ content: '이 버튼은 이제 쓸 수 없어요 🥲' }, { ephemeral: true });

  let latest = null;
  const out = await updatePlayer(user.id, (p) => {
    const r = trainPet(p, uid, Number(timesStr));
    latest = p;
    return { commit: r.commit === true, value: r };
  });
  if (out === null) return reply({ content: NOT_STARTED }, { ephemeral: true });
  if (out.kind === 'not_found') return reply({ content: '그 펫을 찾을 수 없어요 🤔 `/펫` 으로 다시 확인해주세요!' }, { ephemeral: true });
  if (out.kind === 'in_battle') return reply({ content: '⚔️ 전투 중인 대표 펫은 훈련할 수 없어요! 전투를 끝내고 와주세요.' }, { ephemeral: true });
  if (out.kind === 'no_gold') return reply({ content: '💸 골드가 부족해요! 전투나 방생으로 모아보세요.' }, { ephemeral: true });
  if (out.kind === 'cap') return reply({ content: '🔒 더 이상 훈련할 수 없어요! 트레이너 레벨을 올려보세요.' }, { ephemeral: true });

  const inst = latest.pets.find((x) => x.uid === uid);
  const parts = [`✅ ${out.done}회 훈련! 💰 -${out.spent} · ⭐ +${out.expGained}`];
  if (out.levelsGained > 0) parts.push(`🎊 **레벨 업!** → Lv.${out.newLevel}`);
  if (out.stop === 'no_gold') parts.push('골드가 모자라서 여기까지만 했어요.');
  if (out.stop === 'cap') parts.push('레벨 상한에 도달해서 여기까지만 했어요.');
  return update(viewTrain(latest, user.id, inst, parts.join('\n')));
}

export const components = { train: handleTrain };
