// 관리자 페이지의 "유저 관리" 탭이 말을 거는 문이에요 👤
//   GET  ?action=user&id=<유저ID>   (Bearer 토큰) → { userId, data, hasBackup }
//   PUT  ?action=user&id=<유저ID>   { data }      → { ok } 또는 { ok:false, error }
//   POST ?action=revert&id=<유저ID> (Bearer 토큰) → { ok, data } 또는 { ok:false, error }
// admin.js 와 같은 비밀번호로 로그인한 토큰을 그대로 써요.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getPlayer, getPlayerBackup, adminSavePlayer, adminRevertPlayer } from '../src/haejeong-pet-bot.js';

const secret = () => process.env.ADMIN_SECRET || `secret:${process.env.ADMIN_PASSWORD}`;
const sign = (text) => createHmac('sha256', secret()).update(text).digest('base64url');

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

function checkToken(request) {
  const raw = (request.headers.get('authorization') ?? '').replace(/^Bearer /, '');
  const [body, sig] = raw.split('.');
  if (!body || !sig || !safeEqual(sig, sign(body))) return false;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString()).exp > Date.now();
  } catch {
    return false;
  }
}

function cors(request) {
  const allowed = process.env.ADMIN_ORIGIN?.replace(/\/$/, '');
  const origin = request.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': allowed ? (origin === allowed ? origin : allowed) : '*',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

const json = (request, body, status = 200) =>
  Response.json(body, { status, headers: { ...cors(request), 'Cache-Control': 'no-store' } });

export const OPTIONS = (request) => new Response(null, { status: 204, headers: cors(request) });

export async function GET(request) {
  if (!checkToken(request)) return json(request, { error: '로그인이 필요해요' }, 401);
  const userId = new URL(request.url).searchParams.get('id');
  if (!userId) return json(request, { error: '유저 ID를 입력해주세요' }, 400);
  try {
    const data = await getPlayer(userId);
    if (!data) return json(request, { error: '그런 유저가 없어요' }, 404);
    const backup = await getPlayerBackup(userId);
    return json(request, { userId, data, hasBackup: !!backup });
  } catch (error) {
    console.error('유저 조회 오류:', error);
    return json(request, { error: '불러오지 못했어요' }, 500);
  }
}

export async function PUT(request) {
  if (!checkToken(request)) return json(request, { error: '로그인이 필요해요' }, 401);
  const userId = new URL(request.url).searchParams.get('id');
  if (!userId) return json(request, { error: '유저 ID를 입력해주세요' }, 400);
  const { data } = await request.json().catch(() => ({}));
  if (!data || typeof data !== 'object') return json(request, { error: '데이터 형식이 올바르지 않아요' }, 400);
  try {
    const result = await adminSavePlayer(userId, data);
    return json(request, result, result.ok ? 200 : 400);
  } catch (error) {
    console.error('유저 저장 오류:', error);
    return json(request, { error: '저장에 실패했어요' }, 500);
  }
}

export async function POST(request) {
  const url = new URL(request.url);
  if (url.searchParams.get('action') !== 'revert') return json(request, { error: '알 수 없는 요청이에요' }, 400);
  if (!checkToken(request)) return json(request, { error: '로그인이 필요해요' }, 401);
  const userId = url.searchParams.get('id');
  if (!userId) return json(request, { error: '유저 ID를 입력해주세요' }, 400);
  try {
    const result = await adminRevertPlayer(userId);
    return json(request, result, result.ok ? 200 : 400);
  } catch (error) {
    console.error('유저 되돌리기 오류:', error);
    return json(request, { error: '되돌리지 못했어요' }, 500);
  }
}