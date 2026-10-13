// 디스코드가 "누가 명령어를 썼어요!" 하고 알려주는 문(입구)이에요 🚪
import { verifyKey } from 'discord-interactions';
import { handleInteraction } from '../src/haejeong-pet-bot.js';

// 허용 채널 ID 목록 (환경 변수 ALLOWED_CHANNEL_IDS, 쉼표로 구분). 비어 있으면 모든 채널에서 허용해요.
// 환경 변수 없이 코드에 직접 박고 싶으면: const ALLOWED_CHANNEL_IDS = ['채널ID'];
const ALLOWED_CHANNEL_IDS = (process.env.ALLOWED_CHANNEL_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// 허용된 채널인지 확인해요. 스레드면 부모 채널이 허용되어 있을 때도 통과시켜요.
function isAllowedChannel(interaction) {
  // 원인 확인용 로그: 문제가 해결되면 이 부분은 지워도 돼요.
  console.log('[채널검사]', {
    list: ALLOWED_CHANNEL_IDS,
    channel: interaction.channel_id,
    parent: interaction.channel?.parent_id,
  });
  if (ALLOWED_CHANNEL_IDS.length === 0) return true;
  const ids = [interaction.channel_id, interaction.channel?.id, interaction.channel?.parent_id];
  return ids.some((id) => id && ALLOWED_CHANNEL_IDS.includes(id));
}

// 허용되지 않은 채널에서 쓴 사람에게만 보이는 안내 메시지
function blockedReply(interaction) {
  // 자동완성(type 4)에는 메시지로 답할 수 없어서 빈 목록으로 답해요.
  if (interaction.type === 4) return { type: 8, data: { choices: [] } };
  const mention = ALLOWED_CHANNEL_IDS.map((id) => `<#${id}>`).join(', ');
  return {
    type: 4,
    data: { content: `이 봇은 ${mention} 채널에서만 사용할 수 있어요! 🐾`, flags: 64 },
  };
}

export async function GET() {
  return new Response('🐾 해정펫 봇 서버가 잘 켜져 있어요!');
}

export async function POST(request) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const rawBody = await request.text();

  // 진짜 디스코드가 보낸 건지 도장(서명)을 확인해요. 가짜면 돌려보내요.
  const isValid =
    signature &&
    timestamp &&
    process.env.DISCORD_PUBLIC_KEY &&
    (await verifyKey(rawBody, signature, timestamp, process.env.DISCORD_PUBLIC_KEY));

  if (!isValid) {
    return new Response('Bad request signature', { status: 401 });
  }

  try {
    const interaction = JSON.parse(rawBody);

    // 연결 확인(PING, type 1)은 채널과 상관없이 통과시켜야 해요. (엔드포인트 URL 저장에 필요)
    if (interaction.type !== 1 && !isAllowedChannel(interaction)) {
      return Response.json(blockedReply(interaction));
    }

    const body = await handleInteraction(interaction);
    return Response.json(body);
  } catch (error) {
    console.error('처리 중 오류:', error);
    return Response.json({
      type: 4,
      data: { content: '앗! 문제가 생겼어요 😢 잠시 후 다시 해주세요.', flags: 64 | 4096 },
    });
  }
}