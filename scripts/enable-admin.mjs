// 봇 파일을 "관리자가 설정을 바꿀 수 있는" 버전으로 한 번에 바꿔주는 스크립트예요 🔧
// 실행: node scripts/enable-admin.mjs            (src/haejeong-pet-bot.js 를 고쳐요)
//       node scripts/enable-admin.mjs 파일경로    (다른 파일을 고칠 때)
// - 원본은 .bak 으로 백업해요. 두 번 실행해도 안전해요(이미 적용돼 있으면 아무것도 안 해요).
// - 하는 일: ① 설정 숫자 const → let  ② 관리자 설정 블록 삽입  ③ handleInteraction 에서 설정 불러오기
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';

const file = process.argv[2] ?? 'src/haejeong-pet-bot.js';
const raw = readFileSync(file, 'utf8');
const crlf = raw.includes('\r\n');
let src = raw.replace(/\r\n/g, '\n');

if (src.includes('[ADMIN-CONFIG]')) {
  console.log('✅ 이미 적용돼 있어요. 아무것도 바꾸지 않았어요.');
  process.exit(0);
}

const fail = (msg) => {
  console.error(`❌ ${msg}\n   파일을 바꾸지 않았어요.`);
  process.exit(1);
};

// ── 1) 설정값 구간에서 숫자/참거짓 상수를 찾아 let 으로 바꿔요
const startIdx = src.indexOf('// 설정값 (config.js)');
const endIdx = src.indexOf('// 데이터: 해정펫 도감');
if (startIdx < 0 || endIdx < 0) fail('설정값/도감 구간을 찾지 못했어요');

const SKIP = new Set(['EMBED_COLOR', 'KST_OFFSET_MS']); // 건드리면 위험하거나 의미 없는 값
const VALUE_RE = /^(?:[\d.\s*+\-/()]+|true|false)$/;
const scalars = [];
let section = '기타';
const head = src.slice(0, startIdx);
const body = src.slice(startIdx, endIdx).split('\n');
const lines = body.map((line, i) => {
  const sec = line.match(/^\/\/ ─+ (.+?) ─+$/);
  if (sec) section = sec[1].trim();
  const m = line.match(/^const ([A-Z][A-Z0-9_]*) = (.+?);(?:\s*\/\/\s*(.*))?$/);
  if (!m || SKIP.has(m[1]) || !VALUE_RE.test(m[2].trim())) return line;
  const prev = body[i - 1]?.match(/^\/\/\s*(.*)$/)?.[1];
  scalars.push({ name: m[1], section, desc: (m[3] ?? prev ?? m[1]).trim() });
  return line.replace(/^const /, 'let ');
});
if (scalars.length < 20) fail(`설정 숫자를 ${scalars.length}개만 찾았어요 (파일 모양이 달라진 것 같아요)`);
src = head + lines.join('\n') + src.slice(endIdx);

// WILD_COUNT 는 설정값 구간 밖에 있지만 펫이 바뀌면 다시 계산해야 해서 let 으로 바꿔요
if (!/^const WILD_COUNT = /m.test(src)) fail('WILD_COUNT 를 찾지 못했어요');
src = src.replace(/^const WILD_COUNT = /m, 'let WILD_COUNT = ');

// ── 2) import 추가
const impAnchor = "import { getFirestore } from 'firebase-admin/firestore';";
if (!src.includes(impAnchor)) fail('import 위치를 찾지 못했어요');
src = src.replace(impAnchor, `${impAnchor}\nimport { createConfigManager } from './admin-config.js';`);

// ── 3) 관리자 설정 블록 삽입 (라우터 바로 위)
const routerBanner = '// ============================================================\n// 라우터 (router.js)';
if (!src.includes(routerBanner)) fail('라우터 위치를 찾지 못했어요');

const scalarText = scalars
  .map((s) => `    ${s.name}: { get: () => ${s.name}, set: (v) => { ${s.name} = v; }, section: ${JSON.stringify(s.section)}, desc: ${JSON.stringify(s.desc)} },`)
  .join('\n');

const block = `// ============================================================
// 관리자 설정 (admin-config.js) [ADMIN-CONFIG]
// ============================================================

// 펫·아이템·지역이 바뀌면 이 목록들을 다시 만들어요 (배열은 그 자리에서 갈아끼워서 다른 곳의 참조가 유지돼요)
function refreshDerived() {
  const fill = (arr, items) => arr.splice(0, arr.length, ...items);
  const items = Object.values(ITEMS);
  fill(STARTER_IDS, Object.values(PETS).filter((p) => p.starter).map((p) => p.id));
  fill(LOCATION_LIST, Object.values(LOCATIONS).sort((a, b) => a.minLevel - b.minLevel));
  fill(POTIONS, items.filter((i) => i.heal).sort((a, b) => a.heal - b.heal));
  fill(CATCH_ITEMS, items.filter((i) => i.catchItem));
  fill(USABLE_ITEMS, [...POTIONS, ...items.filter((i) => i.boost || i.speedup || i.scout || i.catchItem)]);
  fill(SHOP_ITEMS, items.filter((i) => i.price));
  WILD_COUNT = Object.values(PETS).filter((p) => !p.starter).length;
}

const CONFIG_DOC = ['config', 'game'];
const admin = createConfigManager({
  scalars: {
${scalarText}
  },
  tables: { GRADES, GRADE_EFFECTS, GRADE_WAIT_MULT, RELEASE_BASE_GOLD, TRADE_GRADE_MIN_LEVEL, CATCH_GRADE_PENALTY, WAIT_TIERS, DEX_REWARD },
  entities: { pets: PETS, items: ITEMS, locations: LOCATIONS },
  refresh: refreshDerived,
  store: {
    async load() {
      if (useMemory()) return memoryStore.get('__config') ?? null;
      const snap = await getDb().collection(CONFIG_DOC[0]).doc(CONFIG_DOC[1]).get();
      return snap.exists ? snap.data() : null;
    },
    async save(doc) {
      if (useMemory()) return void memoryStore.set('__config', structuredClone(doc));
      await getDb().collection(CONFIG_DOC[0]).doc(CONFIG_DOC[1]).set(doc);
    },
  },
});
export { admin };

`;
src = src.replace(routerBanner, block + routerBanner);

// ── 4) handleInteraction 맨 앞에서 설정 불러오기
const hiHead = 'export async function handleInteraction(interaction) {\n  switch (interaction.type) {';
if (!src.includes(hiHead)) fail('handleInteraction 위치를 찾지 못했어요');
src = src.replace(
  hiHead,
  'export async function handleInteraction(interaction) {\n  if (interaction.type !== InteractionType.PING) await admin.ensure(); // 관리자 설정 (20초마다 한 번만 읽어요)\n  switch (interaction.type) {',
);

copyFileSync(file, `${file}.bak`);
writeFileSync(file, crlf ? src.replace(/\n/g, '\r\n') : src);
console.log(`✅ 적용 완료! 설정 숫자 ${scalars.length}개를 관리자에서 바꿀 수 있어요. (백업: ${file}.bak)`);
