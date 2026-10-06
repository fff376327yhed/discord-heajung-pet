// 관리자 페이지가 말을 거는 문이에요 🔐
//   POST ?action=login   { password }      → { token }
//   GET  ?action=config  (Bearer 토큰)     → { defaults, overrides, meta }
//   PUT  ?action=config  { overrides }     → { ok } 또는 { errors }
// 환경변수: ADMIN_PASSWORD(필수), ADMIN_SECRET(선택: 토큰 서명키), ADMIN_ORIGIN(선택: 깃허브 페이지 주소)
import { createHmac, timingSafeEqual } from 'node:crypto';
import { admin } from '../src/haejeong-pet-bot.js';

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 로그인 8시간 유지
const MAX_FAILS = 5; // 10분 안에 틀릴 수 있는 횟수 (서버 인스턴스별 대략 제한)
const FAIL_WINDOW_MS = 10 * 60 * 1000;
const fails = new Map();

const secret = () => process.env.ADMIN_SECRET || `secret:${process.env.ADMIN_PASSWORD}`;
const sign = (text) => createHmac('sha256', secret()).update(text).digest('base64url');

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

const makeToken = () => {
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  return `${body}.${sign(body)}`;
};

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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

const json = (request, body, status = 200) =>
  Response.json(body, { status, headers: { ...cors(request), 'Cache-Control': 'no-store' } });

export const OPTIONS = (request) => new Response(null, { status: 204, headers: cors(request) });

export async function POST(request) {
  if (!process.env.ADMIN_PASSWORD) return json(request, { error: 'ADMIN_PASSWORD 환경변수를 먼저 설정해주세요' }, 500);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const rec = fails.get(ip);
  if (rec && rec.count >= MAX_FAILS && Date.now() - rec.at < FAIL_WINDOW_MS) {
    return json(request, { error: '너무 많이 틀렸어요. 10분 뒤에 다시 시도해주세요' }, 429);
  }
  const { password } = await request.json().catch(() => ({}));
  if (typeof password !== 'string' || !safeEqual(password, process.env.ADMIN_PASSWORD)) {
    fails.set(ip, { count: (rec && Date.now() - rec.at < FAIL_WINDOW_MS ? rec.count : 0) + 1, at: Date.now() });
    return json(request, { error: '비밀번호가 달라요' }, 401);
  }
  fails.delete(ip);
  return json(request, { token: makeToken(), expiresInMs: TOKEN_TTL_MS });
}

export async function GET(request) {
  if (!checkToken(request)) return json(request, { error: '로그인이 필요해요' }, 401);
  try {
    return json(request, await admin.getAll());
  } catch (error) {
    console.error('설정 읽기 오류:', error);
    return json(request, { error: '설정을 불러오지 못했어요' }, 500);
  }
}

export async function PUT(request) {
  if (!checkToken(request)) return json(request, { error: '로그인이 필요해요' }, 401);
  const { overrides } = await request.json().catch(() => ({}));
  try {
    const result = await admin.save(overrides);
    return json(request, result, result.ok ? 200 : 400);
  } catch (error) {
    console.error('설정 저장 오류:', error);
    return json(request, { error: '저장에 실패했어요' }, 500);
  }
}
