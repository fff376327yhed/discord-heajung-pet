// 프레즌스 전용 스크립트. 슬래시 커맨드/버튼 처리는 전혀 하지 않는다.
// 하는 일은 딱 하나: 디스코드 게이트웨이에 로그인해서 봇 상태를 "오프라인(invisible)"으로 유지한다.
// 실제 명령어 처리는 그대로 Vercel의 /api/interactions 가 담당한다. (이 프로세스와는 완전히 별개)
//
// 필요한 이유:
//  - 디스코드는 HTTP 인터랙션 전용 봇(게이트웨이 미접속)을 자동으로 "온라인"으로 표시한다. (끌 수 없는 기본 동작)
//  - 멤버 목록에서 진짜로 "오프라인"으로 보이게 하려면, 게이트웨이에 실제로 접속한 뒤 상태를 invisible로
//    설정해야 한다. 그러려면 상시 켜져 있는 프로세스(WebSocket 연결)가 필요하다.
//  - Vercel 서버리스 함수는 요청이 올 때만 잠깐 실행되므로 이 역할을 할 수 없다.
//    그래서 Railway/Fly.io/Render 같은 "상시 실행" 호스팅에 이 작은 스크립트만 따로 올린다.
//
// 봇 하나당 토큰 하나. 여러 봇(주식봇/해정2033/해정펫)을 전부 오프라인으로 보이게 하려면
// DISCORD_TOKENS 에 토큰을 쉼표로 여러 개 넣으면 된다. (각 봇 토큰은 각 봇의 개발자 포털에서 그대로 복사)

import { Client, GatewayIntentBits } from 'discord.js';

// 쉼표로 구분된 여러 토큰을 지원한다. (예: "토큰1,토큰2,토큰3")
const tokens = String(process.env.DISCORD_TOKENS ?? process.env.DISCORD_TOKEN ?? '')
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean);

if (tokens.length === 0) {
  console.error('[presence-bot] DISCORD_TOKENS (또는 DISCORD_TOKEN) 환경 변수가 없습니다. 쉼표로 구분해 여러 개 넣을 수 있습니다.');
  process.exit(1);
}

// 재연결 시도 간격을 완만하게 늘려 가며 재시도한다. (디스코드/호스팅 쪽 일시적 끊김 대비)
const RECONNECT_BASE_MS = 5_000;
const RECONNECT_MAX_MS = 5 * 60_000;

function startClient(token, index) {
  const label = `[presence-bot #${index + 1}]`;
  let reconnectDelay = RECONNECT_BASE_MS;

  function connect() {
    // 프레즌스만 유지하면 되므로 인텐트는 최소로 둔다. (길드 목록만 봐도 충분)
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.once('ready', () => {
      reconnectDelay = RECONNECT_BASE_MS; // 성공하면 재연결 지연 시간 초기화
      console.log(`${label} 로그인 완료: ${client.user.tag} → 오프라인(invisible) 상태로 전환`);
      client.user.setPresence({ status: 'invisible' });
    });

    // 디스코드가 간혹 presence를 되돌리는 경우가 있어 주기적으로 다시 맞춰 준다.
    const keepInvisible = setInterval(() => {
      if (client.isReady() && client.user.presence?.status !== 'invisible') {
        client.user.setPresence({ status: 'invisible' });
      }
    }, 10 * 60_000);

    client.on('error', (err) => {
      console.error(`${label} 연결 오류`, err?.message ?? err);
    });

    client.on('shardDisconnect', () => {
      console.warn(`${label} 연결 끊김. ${Math.round(reconnectDelay / 1000)}초 후 재연결 시도`);
      clearInterval(keepInvisible);
      setTimeout(connect, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
    });

    client.login(token).catch((err) => {
      console.error(`${label} 로그인 실패`, err?.message ?? err);
      clearInterval(keepInvisible);
      setTimeout(connect, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
    });
  }

  connect();
}

tokens.forEach((token, i) => startClient(token, i));

console.log(`[presence-bot] 시작: 봇 ${tokens.length}개를 오프라인으로 유지합니다.`);
