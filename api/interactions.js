// 디스코드가 "누가 명령어를 썼어요!" 하고 알려주는 문(입구)이에요 🚪
import { verifyKey } from 'discord-interactions';
import { handleInteraction } from '../src/haejeong-pet-bot.js';

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
    const body = await handleInteraction(interaction);
    return Response.json(body);
  } catch (error) {
    console.error('처리 중 오류:', error);
    return Response.json({
      type: 4,
      data: { content: '앗! 문제가 생겼어요 😢 잠시 후 다시 해주세요.', flags: 64 },
    });
  }
}