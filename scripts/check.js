// 내 .env 설정이 맞는지 검사하는 진단 도구예요 🔍
// 실행: node --env-file=.env scripts/check.js
const { DISCORD_APP_ID, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID } = process.env;

const api = (path) =>
  fetch(`https://discord.com/api/v10${path}`, {
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
  });

// 1) 값 모양 검사 (보이지 않는 공백이 있는지)
const show = (name, v) => {
  if (!v) return console.log(`❌ ${name}: 비어 있어요`);
  const clean = v.trim() === v && !/[\s"']/.test(v);
  console.log(`${clean ? '✅' : '⚠️'} ${name}: ${v.length}글자${clean ? '' : ' (공백이나 따옴표가 섞여 있어요!)'}`);
};
show('DISCORD_APP_ID', DISCORD_APP_ID);
show('DISCORD_GUILD_ID', DISCORD_GUILD_ID);
console.log(DISCORD_BOT_TOKEN ? `✅ DISCORD_BOT_TOKEN: ${DISCORD_BOT_TOKEN.length}글자` : '❌ DISCORD_BOT_TOKEN: 비어 있어요');

// 2) 토큰 주인이 누구인지
const meRes = await api('/users/@me');
if (!meRes.ok) {
  console.log(`❌ 토큰이 틀려요 (${meRes.status}). Bot 메뉴에서 Reset Token으로 새로 받아주세요.`);
  process.exit(1);
}
const me = await meRes.json();
console.log(`🤖 이 토큰의 봇: ${me.username} (ID ${me.id})`);
console.log(me.id === DISCORD_APP_ID ? '✅ APP_ID와 토큰이 같은 앱이에요' : '❌ APP_ID와 토큰이 서로 다른 앱이에요! 같은 앱의 값으로 맞춰주세요.');

// 3) 봇이 들어가 있는 서버 목록
const gRes = await api('/users/@me/guilds');
const guilds = gRes.ok ? await gRes.json() : [];
console.log(`🏠 봇이 들어가 있는 서버 ${guilds.length}개:`);
for (const g of guilds) console.log(`   - ${g.name} (ID ${g.id})`);
if (DISCORD_GUILD_ID) {
  console.log(
    guilds.some((g) => g.id === DISCORD_GUILD_ID)
      ? '✅ GUILD_ID 서버에 봇이 들어가 있어요'
      : '❌ GUILD_ID 서버에 봇이 없어요! 위 목록의 ID 중 하나로 바꾸거나, 그 서버에 봇을 다시 초대해주세요.',
  );
}