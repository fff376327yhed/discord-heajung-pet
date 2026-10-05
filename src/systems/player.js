// 플레이어(트레이너) 만들기 🧑‍🎤
import { START_GOLD, START_BALLS } from '../config.js';
import { createPetInstance } from './pet.js';

export function buildNewPlayer(userId, username, starterPetId) {
  const starter = createPetInstance(starterPetId, 1);
  return {
    userId,
    name: username,
    level: 1,
    exp: 0,
    gold: START_GOLD,
    inventory: { haejeong_ball: START_BALLS },
    pets: [starter],
    mainPetUid: starter.uid,
    dex: { [starterPetId]: true }, // 도감: 만난/잡은 펫 기록
    exploration: null, // 지금 하고 있는 탐험 (없으면 null)
    createdAt: Date.now(),
  };
}

export function getMainPet(player) {
  return player.pets.find((p) => p.uid === player.mainPetUid) ?? player.pets[0] ?? null;
}

// 대표 펫 바꾸기 (전투 중에는 못 바꿔요: 체력 정보가 꼬여요!)
export function setMainPet(player, uid) {
  if (!player.pets.some((p) => p.uid === uid)) return { kind: 'not_found' };
  if (player.exploration?.battle) return { kind: 'in_battle' };
  if (player.mainPetUid === uid) return { kind: 'already' };
  player.mainPetUid = uid;
  return { kind: 'changed', commit: true };
}
