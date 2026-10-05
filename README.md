# 🐾 해정펫 봇 (2단계)

디스코드에서 즐기는 포켓몬 느낌 게임이에요!
**기능:** `/시작`(스타팅 펫 고르기) · `/내정보`(레벨·재화·대표 펫) · `/장소`(지도 보기) · 레벨 시스템
**2단계 추가:** `/탐험`(장소 고르기 → 랜덤 시간 뒤 야생 펫 등장 → 잡기/무시하기. 싸우기는 3~4단계에서 열려요)

## 📁 폴더 구조

```
haejeong-pet-bot/
├─ api/interactions.js        ← 디스코드가 노크하는 문 (Vercel이 실행)
├─ scripts/register-commands.js ← 명령어를 디스코드에 알려주는 스크립트
├─ src/
│  ├─ router.js               ← 안내 데스크 (명령어/버튼 나눠주기)
│  ├─ config.js               ← 기본 설정 숫자들
│  ├─ db.js                   ← 저장소 (Firebase)
│  ├─ commands/               ← 명령어 하나당 파일 하나
│  │  ├─ start.js  profile.js  places.js  explore.js
│  ├─ data/                   ← 펫·장소·아이템 목록 (여기만 고쳐도 게임이 바뀌어요!)
│  │  ├─ pets.js  locations.js  items.js
│  ├─ systems/                ← 게임 규칙 (레벨, 펫 능력치, 플레이어 만들기, 탐험·포획)
│  └─ utils/                  ← discord.js(답장 도우미), random.js(주사위)
├─ test/                      ← 자동 검사 (npm test)
├─ package.json  vercel.json  .env.example  .gitignore
```

## 🚀 처음 한 번만 하는 준비 (순서대로!)

### 1. 디스코드 봇 만들기
1. https://discord.com/developers/applications → **New Application**
2. **General Information** 에서 `APPLICATION ID`, `PUBLIC KEY` 복사
3. **Bot** 메뉴 → **Reset Token** → 토큰 복사 (비밀번호예요, 남에게 보여주면 안 돼요!)
4. `.env.example` 을 복사해서 `.env` 로 이름 바꾸고 위 3개 값을 채워요

### 2. Firebase 저장소 만들기
1. Firebase 콘솔 → 프로젝트 → **Firestore Database** 만들기 (위치: `asia-northeast3 (서울)` 추천)
2. 규칙(Rules)은 아래처럼 "아무도 직접 못 들어와요"로 바꿔요 (봇은 열쇠로 들어가요)
   ```
   rules_version = '2';
   service cloud.firestore { match /databases/{db}/documents { match /{doc=**} { allow read, write: if false; } } }
   ```
3. **프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성** → 내려받은 JSON 파일 내용을 통째로 복사 (이게 Vercel에 넣을 `FIREBASE_SERVICE_ACCOUNT` 값이에요)

### 3. 깃허브에 올리기
```
git init
git add .
git commit -m "해정펫 봇 1단계"
git branch -M main
git remote add origin https://github.com/내아이디/haejeong-pet-bot.git
git push -u origin main
```
`.env` 는 `.gitignore` 덕분에 자동으로 안 올라가요 👍

### 4. Vercel에 연결하기
1. https://vercel.com → **Add New → Project** → 방금 올린 깃허브 저장소 선택 → Deploy
2. **Settings → Environment Variables** 에 3개를 넣어요
   - `DISCORD_PUBLIC_KEY`
   - `FIREBASE_SERVICE_ACCOUNT` (JSON 통째로)
   - (`DISCORD_BOT_TOKEN` 은 내 컴퓨터에서만 쓰니까 안 넣어도 돼요)
3. 환경변수를 넣은 뒤 **Deployments → Redeploy** 한 번 해주세요
4. `https://내프로젝트.vercel.app/api/interactions` 에 들어가서 "🐾 해정펫 봇 서버가 잘 켜져 있어요!" 가 보이면 성공!

### 5. 디스코드와 Vercel 이어주기
- 개발자 포털 → General Information → **Interactions Endpoint URL** 에
  `https://내프로젝트.vercel.app/api/interactions` 를 넣고 Save
  (초록색으로 저장되면 연결 성공!)

### 6. 명령어 등록 & 봇 초대
```
npm install
npm run register
```
초대 링크 (APP_ID 부분만 바꿔서 주소창에 넣어요):
`https://discord.com/oauth2/authorize?client_id=APP_ID&scope=bot%20applications.commands`

이제 디스코드에서 `/시작` 을 입력해보세요! 🎉

## 🧪 검사하기
```
npm test
```
디스코드 없이도 "시작 → 버튼 → 내정보" 흐름과 서명 확인이 잘 되는지 자동으로 검사해요.

## ✏️ 자주 고치는 곳
| 바꾸고 싶은 것 | 파일 |
|---|---|
| 펫 이름·능력치·등급 | `src/data/pets.js` |
| 장소·나오는 펫·확률 | `src/data/locations.js` |
| 해정볼 이름·가격 | `src/data/items.js` |
| 시작 골드·시작 볼 개수 | `src/config.js` |
| 레벨업에 필요한 경험치 | `src/systems/level.js` 의 `expToNext` |

## 🔄 2단계로 업데이트하는 법 (이미 1단계를 올린 사람)
1. 이 압축 파일을 **내 `haejeong-pet-bot` 폴더 안에 풀고, 덮어쓰기**를 해요. (`.env`와 `node_modules`는 압축에 없으니 안전해요)
2. 새 명령어(`/탐험`)를 디스코드에 알려줘요: `npm run register`
3. 깃허브에 올려요: `git add .` → `git commit -m "2단계 탐험"` → `git push`
4. Vercel이 자동으로 다시 배포해요. **Ready**가 되면 디스코드에서 `/탐험`!

## 🎮 탐험 규칙
| 규칙 | 내용 |
|---|---|
| 기다리는 시간 | 장소마다 정해둔 범위(예: 초원 5~20초) 안에서 랜덤 |
| 잡을 확률 | 펫마다 다름 × (내 대표 펫보다 너무 높은 레벨이면 조금 어려워짐) |
| 실패하면 | 해정볼은 사라지고, 4번 중 1번은 펫이 도망가요 |
| 잡으면 | 펫 추가 · 도감 등록 · 트레이너 경험치 (새 종류면 보너스!) |
