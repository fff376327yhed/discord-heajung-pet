// 데이터를 저장하고 꺼내오는 곳이에요 🗄️ (Firebase Firestore)
// DB_MODE=memory 로 켜면 연습용 임시 저장소를 써요 (테스트 전용, 껐다 켜면 사라져요!)
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const memoryStore = new Map();
const useMemory = () => process.env.DB_MODE === 'memory';

let firestore;
function getDb() {
  if (firestore) return firestore;
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT 환경변수가 없어요!');
  }
  if (getApps().length === 0) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  firestore = getFirestore();
  firestore.settings({ ignoreUndefinedProperties: true });
  return firestore;
}

const players = () => getDb().collection('players');

export async function getPlayer(userId) {
  if (useMemory()) {
    const found = memoryStore.get(userId);
    return found ? structuredClone(found) : null;
  }
  const snap = await players().doc(userId).get();
  return snap.exists ? snap.data() : null;
}

// 새 플레이어 만들기. 이미 있으면 false (두 번 눌러도 안전해요!)
export async function createPlayer(userId, data) {
  if (useMemory()) {
    if (memoryStore.has(userId)) return false;
    memoryStore.set(userId, structuredClone(data));
    return true;
  }
  try {
    await players().doc(userId).create(data);
    return true;
  } catch (error) {
    if (error.code === 6) return false; // ALREADY_EXISTS
    throw error;
  }
}

export async function savePlayer(userId, data) {
  if (useMemory()) {
    memoryStore.set(userId, structuredClone(data));
    return;
  }
  await players().doc(userId).set(data);
}
