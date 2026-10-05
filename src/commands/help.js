// /도움말 — 게임 규칙과 명령어를 정리해서 보여줘요 📘
import { EMBED_COLOR, CATCH_DROP_PER_TRY, FLEE_BASE, FLEE_RISE_PER_TRY, FLEE_MAX, BATTLE_MAX_ROUNDS, CRIT_CHANCE } from '../config.js';
import { reply } from '../utils/discord.js';

export const data = {
  name: '도움말',
  description: '게임 규칙과 명령어를 알려줘요.',
  type: 1,
};

const pct = (v) => Math.round(v * 100);

export async function execute() {
  return reply(
    {
      embeds: [
        {
          title: '📘 해정펫 도움말',
          color: EMBED_COLOR,
          fields: [
            {
              name: '🐣 시작',
              value: '`/시작` 으로 스타팅 펫을 고르고 모험을 시작해요. `/내정보` 로 내 상태를 확인해요.',
            },
            {
              name: '🌿 탐험',
              value:
                '`/탐험` 으로 장소를 골라 떠나요. **[살펴보기]** 를 누르면 야생 펫이 나타나요.\n' +
                '`/장소` 에서 갈 수 있는 곳과 만나는 펫을 볼 수 있어요.',
            },
            {
              name: '🔴 잡기',
              value:
                `해정볼을 던질 때마다 포획 확률이 **-${pct(CATCH_DROP_PER_TRY)}%p** 줄어요.\n` +
                `실패하면 도망 확률이 **+${pct(FLEE_RISE_PER_TRY)}%p** 올라가요 (처음 ${pct(FLEE_BASE)}%, 최대 ${pct(FLEE_MAX)}%).\n` +
                '다른 펫을 만나면 확률이 처음으로 돌아가요.',
            },
            {
              name: '⚔️ 전투',
              value:
                `**[공격]**, **[잡기]**, **[회복]**, **[교체]** 는 모두 한 턴을 써요. 턴 끝에는 야생 펫이 반격해요.\n` +
                `치명타 확률 ${pct(CRIT_CHANCE)}%, ${BATTLE_MAX_ROUNDS}턴 안에 끝나지 않으면 야생 펫이 도망가요.`,
            },
            {
              name: '🧪 회복',
              value:
                '`/사용` 으로 회복약을 써요. 수량을 골라 여러 개를 한 번에 쓸 수도 있어요.\n' +
                '전투 중에는 **[회복]** 버튼으로 한 턴에 한 개씩 써요.',
            },
            {
              name: '🐾 펫 관리',
              value:
                '`/펫` 으로 목록과 대표 펫(👑)을 확인해요. `/별명`, `/훈련`, `/방생` 으로 키우고 정리해요.',
            },
            {
              name: '🛒 상점 · 도감 · 가방',
              value: '`/상점` 에서 골드로 아이템을 사고, `/가방` 에서 가진 물건을 봐요. `/도감` 은 만난 펫을 기록해요.',
            },
          ],
          footer: { text: '잡기 규칙 숫자는 설정값에 따라 자동으로 바뀌어요.' },
        },
      ],
    },
    { ephemeral: true },
  );
}