// 디스코드에게 "내 봇은 이런 명령어가 있어요!" 하고 알려주는 스크립트예요 📣
// 실행: npm run register   (명령어를 추가/수정할 때마다 다시 실행!)
import { commandDefinitions } from '../src/router.js';

const { DISCORD_APP_ID, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_APP_ID || !DISCORD_BOT_TOKEN) {
  console.error('❌ .env 파일에 DISCORD_APP_ID 와 DISCORD_BOT_TOKEN 을 먼저 채워주세요!');
  process.exit(1);
}

// 서버 ID가 있으면 그 서버에만(바로 반영), 없으면 모든 서버에 등록해요.
const url = DISCORD_GUILD_ID
  ? `https://discord.com/api/v10/applications/${DISCORD_APP_ID}/guilds/${DISCORD_GUILD_ID}/commands`
  : `https://discord.com/api/v10/applications/${DISCORD_APP_ID}/commands`;

const response = await fetch(url, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
  },
  body: JSON.stringify(commandDefinitions),
});

if (!response.ok) {
  console.error('❌ 등록 실패:', response.status, await response.text());
  process.exit(1);
}

const registered = await response.json();
console.log(`✅ 명령어 ${registered.length}개 등록 완료!`);
for (const cmd of registered) console.log(`  /${cmd.name} - ${cmd.description}`);
