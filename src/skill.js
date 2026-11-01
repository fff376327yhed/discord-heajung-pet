// 해정펫 스킬 ✨ — 스킬 데이터 + 전투 규칙 (디스코드와 상관없는 순수한 규칙)
// 🪐 외계행성 제타-9 (Lv.100) 추가 (2026-10-25) — 새 펫 7마리 + 전용기 11개, 보스는 액괴 정아영 (아래 "외계행성" 구역)
// 🛠️ 밸런스 조정판 (2026-10-11)
//   · 낮은 등급인데 사기였던 연타기·전용기·방어기 하향
//   · 높은 등급인데 약했던 ★4·★5 공격기 상향, 쓸모없던 스킬(피의계약·프리즘 방벽·마나증폭 등) 보강
//   · 같은 id 로 두 번 정의돼 덮어써지던 스킬(마나폭주 · 오버드라이브) 분리
// 🛠️ 2차 밸런스 (2026-10-11) — 실제 레벨100 펫 능력치로 "스킬 1번 쓰면 상대 체력이 몇 % 깎이나"를 재서 같은 등급끼리 비교했어요
//   · ★2·★3 의 너무 센 전용기·연타기·지속피해 스킬 하향 (예: 필살 독침 · 독니 일격 · 난타 · 낙석 · 화염구)
//   · ★2~★5 의 너무 약했던 스킬 상향 (예: 불씨저주 · 독무 · 마나연소 · 피의계약 · 연쇄반응 · 늪 마녀의 저주 · 악마의 주사위 · 심판)
//   · 사기였는데 등급이 어중간했던 시한폭탄 ★3 → ★4 (마나 35 → 50, 위력도 낮춤) · 종말의 시계 하향
//   · ★5 회복보다 셌던 고래 노래 · 숲의 숨결 하향, 마나 회복 스킬(아드레날린 · 명상 · 심상) 효율을 등급 순서에 맞게 정리
//   · 스킬 id 는 하나도 안 바꿨어요 (저장된 펫 스킬 그대로 써도 돼요)
//
// 마나: 최대 SKILL_CFG.manaMax(100), 기본 공격을 한 턴에만 +manaPerTurn(15) (스킬·회복·교체·잡기 턴에는 안 차요). 스킬은 마나를 써요. 좋은 스킬일수록 마나가 많이 들어요.
// 슬롯(총 5칸): 1번 Lv.20 · 2번 Lv.40 · 3번 Lv.100 · 4번 Lv.200 · 5번 상점의 [스킬 슬롯 개방권]. 열릴 때 랜덤 스킬이 하나 들어와요 ([스킬 변경권] 으로 다시 뽑기).
// 전용기: 펫마다 1~2개. 그 펫만 배울 수 있고, 같은 마나의 일반 스킬보다 더 세요.
//
// 효과 칸 (fx) — 아래 이름만 쓰면 설명 글자는 자동으로 만들어져요:
//   pow 데미지 배율 · hits 타수 · pierce 방어무시 · crit 급소확률+ · exec 체력30%↓ 적에게 배율 · drain 흡혈 · recoil 반동
//   heal 회복 · regen [비율,턴] · shield 보호막 · guard [감소율,턴] · evade 회피 횟수 · atkUp/defUp [비율,턴] · atkDown/defDown [비율,턴]
//   stun 기절확률 · dot [종류,비율,턴,확률] · mana 마나회복 · drainMana 적 마나 감소 · cleanse 상태이상 제거
//   🆕 독창 스킬용 효과 칸:
//   bomb [배율,턴] 시한폭탄(방어 무시) · detonate 배율 화상/독/출혈 터뜨리기 · overload 계수 남은 마나 전부 쏟아붓기
//   revenge 계수 내 체력이 낮을수록 강해짐 · gamble [확률,성공배율,실패반동] 도박 · hitsRange [최소,최대] 랜덤 연타
//   stealMana 숫자 적 마나 훔치기 · swapHp 서로의 체력 비율 맞바꾸기 · echo 턴 다음 공격 스킬이 메아리침
//   🌈 속성(상성) 효과 칸:
//   elem 스킬의 속성 (fire/water/grass/electric/ice/wind/earth/light/dark/poison/normal — 안 적으면 무속성)
//   weakBonus 비율 상대 속성이 약점일 때 데미지 추가 · ignoreResist 상대가 "효과 별로"여도 반감 무시
//   convert [속성,턴] 내 속성을 바꿔요 (같은 속성 보너스 · 방어 상성도 같이 바뀌어요) · ward 턴 약점 속성으로 맞아도 추가 피해 없음
//   🆕 2차 확장 효과 칸 (배치 1):
//   manaMaxUp [수치,턴] 최대마나 증가 · manaRegenUp [수치,턴] 턴마다 차는 마나 증가
//   steal [stat,비율,턴] 상대 공격력/방어력을 훔쳐서 내 버프+상대 디버프로 (stat: 'atk'|'def')
//   turnCut 숫자 상대의 좋은 효과(공방업·보호태세·재생·보호막) 남은 턴을 깎아요
//   truePct 비율 방어 무시 고정추가피해(최대체력 비율) · mercy 이번 공격은 상대 체력을 1% 밑으로 못 내려요
//   burstAtk [배율,턴] 공격력을 배수로 (한도 없음) · debuffToBuff 내 디버프(공방다운·기절)를 전부 버프로
//   coinflip 턴 그동안 받는 모든 피해가 50% 확률로 1.5배, 50% 확률로 0 · defToAtk 턴 방어력을 전부 공격력으로 전환
//   healCut [비율,턴] 상대가 받는 회복 효과를 비율만큼 깎아요
//   🆕 3차 확장 효과 칸 (배치 3):
//   buffXfer [모드,턴] 1회용 효과 이동 (모드: 'steal' 상대 버프 뺏기 · 'give' 내 디버프 떠넘기기 · 'swap' 둘 다) — 한 번 발동하면 사라져요
//   statRoll [모드,대상,턴] 능력치 룰렛 (모드: 'swap' 두 능력치 맞바꿈 · 'random' 랜덤 배수 / 대상: 'self'|'foe') — 등급별 상한(ROLL_CAP)
//   cdReset 숫자 내 스킬 쿨타임을 전부(99) 또는 숫자만큼 줄여요 · cd 숫자 이 스킬의 쿨타임(턴)
//   revive [비율,턴] 쓰러지면 비율만큼 체력으로 부활 (턴이 지나면 사라져요) · skillImmune 턴 스킬로 취급되는 효과 전부 무효
//   archBless [회복배율,추가피해비율,넘친배수] 받은 피해 × 배율 회복 + 회복량의 비율만큼 상대에게 추가 피해 (넘친 회복량은 비율 × 넘친배수 만큼)
//   🆕 4차 확장 효과 칸 (배치 4):
//   joker true 내 스킬 하나 ↔ 상대 스킬 하나 랜덤 맞교환 (전투 안에서만 · 전투당 1번 = ex.battle.jokerUsed) — 상대가 받는 게 조커 카드면 상대 마나 전부 삭제 + 스킬 봉인
//   curse [개수,턴] 나 자신에게 랜덤 디버프를 개수만큼 걸고, 이 스킬 칸이 curse_grant(저주부여)로 바뀌어요 · curseGrant 배수 저주로 받은 디버프를 배수 위력으로 상대에게
//   devilDeal [턴,배수] 턴 동안 내 모든 공격이 확정 급소+약점 · 턴 안에 못 쓰러뜨리면 준 피해×배수를 무효화 불가 피해로 받아요 · hidden true 슬롯 뽑기에 안 나와요
//   🆕 5차 확장 효과 칸 (배치 5 — 일부):
//   catchPro [포획률+,연장턴] 포획 전문가: 유효 14턴(★5 는 15턴, CATCH_PRO_CFG) 동안 야생 펫이 도망치려 하면 확정으로 붙잡고(처음 붙잡을 때 전투 제한 턴 +연장턴), 포획률 +N%p (st.catchPro · ex.battle.extraRounds)
//   fightBuff { catch, flee, exp, gold, petExp, equip } 전투 중 버프 — 이번 전투가 끝날 때까지 유지, 겹치면 쌓여요 (FIGHT_BUFF_CAP 한도) (st.fightBuff = ex.battle.mySt.fightBuff)
//     catch 포획률 +%p · flee 도망 확률 -%p · exp 트레이너 경험치 · gold 돈 · petExp 펫 경험치 · equip 장비 획득 확률 (모두 +%)
//   🆕 6차 확장 효과 칸 (배치 6):
//   allElem [모드,턴] 속성 전체 부여 (st.allElem) — 모드: 'attack' 모든 속성으로 공격(약점은 살리고 "효과 별로"는 없애요) · 'defend' 몸에 모든 속성이 깃들어 받는 상성이 전부 곱해져요 · 'both' 둘 다 (ALL_ELEM_CFG 로 배율 상한/하한)
//   whoIs [확률,턴] "누구게?" — 턴 동안 상대가 나를 때리는 공격(스킬 타격 · 기본 공격)이 확률로 상대 자신에게 들어가요 (st.whoIs)
//   lockSkills true 상대의 스킬을 이번 전투 동안 영구 봉인 (st.sealed.perm · 야생 펫은 못 써요)

//   🆕 7차 확장 효과 칸 (★4 전용기 설계서 — 일부만 구현):
//   hitPows [위력,…] 연타마다 위력이 다른 연타 (hits 는 배열 길이와 같게, pow 는 평균값으로 적어 두면 자동사냥 계산이 맞아요)
//   needHit true dot 은 한 대라도 실제로 맞았을 때(회피 제외)만 걸려요
//   snowball [시작배율,회당증가,최대배율] 이번 전투에서 쓸 때마다 위력이 눈덩이처럼 커져요 (st.snowCount, 전투가 끝날 때까지 유지)
//   shieldDrain [비율,상한] 준 피해(실제로 체력에 들어간 양)의 비율만큼 내 보호막으로 (상한 = 내 최대 체력 비율)
//   healOverflow 상한 회복하고 넘친 회복량을 보호막으로 (상한 = 내 최대 체력 비율, 회복감소를 먼저 적용해요)
//   jackBox true 깜짝 상자: 카드 4장 중 하나가 같은 확률로 나와요 (♠폭죽 추가 150% · ♥선물 체력 35% · ♦마나 도둑 40 · ♣깜짝 기절 확정)
//   🆕 8차 확장 효과 칸 (★4 전용기 설계서 2번째 묶음):
//   rage [회당,최대] 이번 전투에서 내가 맞은 횟수 × 회당 만큼 위력 추가 (최대 비율까지 · st.hitCount 는 afterHit 에서 셈)
//   cleanseBoost [개당,최대개수] 내 나쁜 효과를 먼저 정화하고 지운 개수(화상·독·출혈은 종류별 1개)당 위력 추가
//   weakElems true 연타마다 상대의 약점 속성 중 무작위 하나로 공격 (약점 없으면 무속성 · 반감 · 같은 속성 보너스 없음)
//   lamp [비율,마나,턴] 상대에게 "불빛"을 달아요: 불빛 중 상대가 스킬을 쓸 때마다 최대 체력 비율 고정 피해 + 마나 감소 (st.lamp)
//   maskSwap 턴 상대의 약점 속성 중 하나로 변신 (상대 공격 속성이 내게 반감되는 쪽 우선, 상대가 무속성이면 불발)
//   potion 개수 마녀의 영약: 6가지 중 서로 다른 N개가 무작위로 터져요
//   🆕 9차 확장 효과 칸 (★4 전용기 설계서 3번째 묶음):
//   revive [비율,턴] 에 reviveBlast 배수 를 더하면: 부활하는 순간 상대에게 공격력 × 배수 폭발 피해(방어 적용) + 내 약화(공격↓·방어↓) 정화 (환생의 불길)
//   shieldCounter [반격배율,방어감소,감소턴,유효턴] 보호막이 깨지는 순간 상대에게 반격 + 상대 방어 감소 (유효턴 안에 깨져야 해요 · 1회) (서리 비늘)
//   mark [턴,스택수,비율] 상대에게 "사냥 표식": 표식 중 상대가 직접 피해를 맞을 때마다 스택 +1, 스택이 차면 최대 체력 비율 고정 피해 (한 턴 최대 2번) (그림자 사냥)
//   transfer [비율,턴] 턴 동안 내가 받는 피해의 비율을 상대에게 방어 무시로 전이 (나는 나머지만 받아요) (차원 비늘)
//   dive [배율,방어무시,기절확률,턴] 낙하 예약: 이번 턴 포함 N번째 턴이 끝날 때 자동 낙하 공격 (시한폭탄처럼 내 다음 행동과 별개 · 낙하 전에 쓰러지면 취소) (벼락 급강하)
//   🆕 10차 확장 효과 칸 (★4 전용기 설계서 4번째 묶음):
//   spdDown [비율,턴] 상대 스피드 감소 (뿌리 감옥 · priority 와 같이 쓰면 "선공 + 느려짐")
//   speedRev 턴 속도 역전: 양쪽 모두 스피드가 낮은 쪽이 먼저 움직여요 (선공 스킬 priority 는 여전히 우선) (얼음 감옥)
//   firstBonus [선공배율,후공배율,선공마나] 내가 먼저 움직이는 턴이면 위력 × 선공배율 + 마나, 늦게 움직이면 × 후공배율 (사막의 왕 포효 · actsFirst 로 판정)
//   drowsy 턴 상대에게 "졸음": 턴째 끝에 잠들어 다음 행동 1회 불가, 그 전에 직접 피해를 맞으면 졸음이 깨져요 (이미 기절 중이면 불발) (인어의 자장가)
//   readBonus 배수 "읽기": 상대가 직전에 회복·방어·버프 스킬을 썼으면(st.act) 위력 × 배수 + 상대의 좋은 효과를 전부 지워요 (급강하 폭격)
//   cloneBoom 배수 clone 과 같이 쓰면 분신이 쓰러지거나 끝날 때 공격력 × 배수 방어 무시 폭발, 분신이 남아 있는 동안은 다시 못 써요 (채찍 신호)
//   🆕 11차 확장 효과 칸 (★5 개편):
//   pigeon [체력비율(상대 최대체력),스킬피해 대신 맞는 비율,턴마다 마나 강탈,기본공격 도발 배수,턴] 비둘기를 소환해요: 상대 스킬 피해의 일부를 대신 맞고, 기본 공격은 전부 배수 위력으로 대신 맞아요 (mitigate 의 opts.basic · 비둘기 마술)
//   freeze 턴 적을 얼려요: 행동이 막히고 받는 피해 ×2, 행동하려 할 때마다 35% 확률로 깨져요 (FROZEN_CFG · 서리 숨결)
//   berserk 턴 상대가 살아 있으면 내게 광폭화: 최대 체력 30% 이하 피해 무시 · 다음 기본 공격/공격 스킬 위력 +60% · 공격마다 5% 확률로 상대 체력 5 (BERSERK_CFG · 공허의 숨결)
//   stealSpd [빠를 때 능력치, 같거나 느릴 때 능력치, 비율, 턴] 상대 스피드가 나보다 빠르면 앞의 능력치, 같거나 느리면 뒤의 능력치(atk|def)를 훔쳐요 (불의 링 통과)
//   powDown [비율,턴] 적이 쓰는 스킬 위력(공격 스킬의 타격 배율)을 비율만큼 깎아요 · manaDown [비율,턴] 적의 현재 마나를 비율만큼 깎고, 턴 동안 최대 마나도 비율만큼 깎아요 (st.manaDown.cut · 봇이 매 턴 manaMax 에서 빼줘요) (늪 마녀의 저주)
//   atkRegen [비율,턴] 턴 동안 매 턴 끝에 내 공격력 × 비율 만큼 회복 (회복감소 적용 · 불사의 날갯짓은 healCut [1,턴] 과 같이 써서 상대 회복 차단)
//   lastLaugh [맞은횟수당 최대마나,연속시전 최대] 이번 전투 최대마나 += 맞은 횟수(st.hitCount) × 값 (st.manaBonus · 봇이 매 턴 manaMax 에 더해줘요) → 마나 가득 → 마나가 되는 한 내 스킬을 랜덤으로 연속 시전 (최대 N번) · 전투당 1회, 이 칸은 조커로 바뀌어요 (mySkillOv 라 전투가 끝나면 원래대로) (광대의 마지막 웃음)
//   pride [무시턴,반사턴,반사 최대 개수,되돌릴 횟수] 전투당 1회. 무시턴 동안 상대의 방어·공격력은 0 으로 취급(내 공격은 방어 관통 · 상대 공격은 최소 피해)하고 나는 항상 선공 (st.prideNull 은 상대에게, st.priority 는 내게) → 이후 반사턴(사용 후 N턴) 동안 상대가 내게 건 스킬을 최대 개수만큼 0마나로 상대에게 횟수만큼 되돌려 시전 (st.prideReflect · 군주의 오만)
//   swallow [턴,최대체력 증가,체력 비율] 내 공격 스킬 중 위력이 가장 높은 것을 삼켜서, 사용 다음 턴부터 N턴 동안 매 턴 끝에 마나·쿨타임 없이 "스킬이 아닌 공격"(스킬 면역 무시)으로 발동 · 삼킨 동안 쓰러지기 직전에 전투당 1회 최대체력 +비율, 체력 비율로 일어나요 (부활이 먼저) (st.swallow · 모래 삼키기)
//   reviveMaxUp 비율 revive 와 같이 쓰면: 부활하는 순간 이번 전투 동안 최대 체력이 비율만큼 늘고, 늘어난 최대 체력 기준으로 채워요 (st.maxBonus · 봇이 매 턴 max 에 더해줘요) (부활)

export const SKILL_CFG = {
  manaMax: 100, // 마나 최대치 (마나 수정으로 펫마다 더 늘릴 수 있어요)
  manaStart: 30, // 전투 시작 마나
  manaPerTurn: 15, // 기본 공격을 했을 때 차는 마나 (스킬을 쓴 턴에는 안 차요)
  slot1Level: 20, // 1번 스킬 슬롯이 열리는 펫 레벨
  slot2Level: 40, // 2번 스킬 슬롯이 열리는 펫 레벨
  slot3Level: 100, // 3번 스킬 슬롯이 열리는 펫 레벨
  slot4Level: 200, // 4번 스킬 슬롯이 열리는 펫 레벨 (MAX_LEVEL 이 200 이상이어야 닿을 수 있어요)
  sigChance: 0.01, // 슬롯이 열리거나 변경될 때 "전용기"가 나올 확률 (펫에게 전용기가 있을 때) — 1%
  wildSkillChance: 0.35, // 야생 펫이 매 턴 전용기를 쓸 확률 (마나가 될 때)
  crystalMana: 10, // 마나 수정 1개당 늘어나는 최대 마나
  crystalMaxBonus: 100, // 마나 수정으로 늘릴 수 있는 최대치
  elemAffinity: 2, // 🌈 슬롯이 열릴 때 "내 펫과 같은 속성" 스킬이 뽑힐 확률 배수 (1 이면 꺼짐, 2 면 같은 등급 안에서 2배 잘 나와요)
};
const MANA_DOWN_MIN = 10; // 🔽 마나 감소로 최대 마나가 이 밑으로는 안 내려가요
export const CLONE_SHARE = 0.5; // 👥 분신이 대신 맞아주는 피해 비율
export const CLONE_HP_PER_DEF = 6; // 👥 분신 체력 = 내 방어력 × 방어비율 × 이 값 (최소 10)
// 슬롯이 열릴 때 "등급(★)"이 뽑힐 확률 무게예요. 합이 100이라서 숫자가 곧 퍼센트(%)예요!
// 등급을 먼저 뽑고, 그 등급 안에서는 모든 스킬이 똑같은 확률이에요 (스킬을 새로 추가해도 등급 확률은 안 변해요).
export const TIER_WEIGHT = { 1: 40, 2: 33, 3: 20, 4: 6, 5: 1 };
const TIER_COST = { 1: 10, 2: 20, 3: 35, 4: 50, 5: 70 }; // 등급별 기본 마나 (스킬마다 따로 고칠 수 있어요)

// 🌟 펫 등급(일반~초월, 1~7단계)에 따라 TIER_WEIGHT 를 이렇게 곱해서 비틀어요.
// 숫자가 1보다 크면 그 스킬 등급(★)이 더 잘 나오고, 1보다 작으면 덜 나와요.
// 예) 전설(5)은 ★4·★5 배율이 높아서 "높은 등급 펫일수록 높은 등급 스킬이 더 잘 나옴" 이 돼요.
// GRADE_TIER_MULT 에 없는 등급(order)이 오면 baseGrade(3, 희귀) 배율을 써요.
export const GRADE_TIER_MULT = {
  1: { 1: 1.3, 2: 1.1, 3: 0.85, 4: 0.5, 5: 0.2 }, // 일반
  2: { 1: 1.15, 2: 1.05, 3: 0.95, 4: 0.7, 5: 0.4 }, // 고급
  3: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }, // 희귀 (기준, TIER_WEIGHT 그대로)
  4: { 1: 0.8, 2: 0.9, 3: 1.15, 4: 1.5, 5: 2 }, // 영웅
  5: { 1: 0.6, 2: 0.75, 3: 1.25, 4: 2, 5: 3.2 }, // 전설
  6: { 1: 0.45, 2: 0.6, 3: 1.2, 4: 2.4, 5: 4.2 }, // 신화
  7: { 1: 0.3, 2: 0.45, 3: 1.1, 4: 2.8, 5: 5.5 }, // 초월
};
const GRADE_TIER_BASE = 3; // GRADE_TIER_MULT 에 없는 등급일 때 쓸 기본값

// ───────── 🌈 속성 (상성) ─────────
// 펫과 스킬은 속성을 가져요. 공격 속성이 상대 속성에게 "잘 먹히면" 약점(데미지 ×strong), "잘 안 먹히면" 반감(데미지 ×weak)!
// 두 가지 속성을 가진 펫은 두 속성의 배율이 곱해져요 (예: 약점 ×1.5 × 약점 ×1.5 = ×2.25).
// 스킬이 내 펫의 속성과 같으면 같은 속성 보너스(×stab)! 기본 공격은 내 펫의 첫 번째 속성으로 나가요.
export const ELEMENTS = {
  normal: { name: '무속성', emoji: '⚪' },
  fire: { name: '불', emoji: '🔥' },
  water: { name: '물', emoji: '💧' },
  grass: { name: '풀', emoji: '🌿' },
  electric: { name: '전기', emoji: '⚡' },
  ice: { name: '얼음', emoji: '❄️' },
  wind: { name: '바람', emoji: '🌪️' },
  earth: { name: '땅', emoji: '⛰️' },
  light: { name: '빛', emoji: '✨' },
  dark: { name: '어둠', emoji: '🌑' },
  poison: { name: '독', emoji: '☠️' },
};
export const ELEM_CFG = {
  strong: 1.5, // 약점을 찔렀을 때 데미지 배율
  weak: 0.65, // 효과가 별로일 때 데미지 배율 (반감)
  stab: 1.2, // 스킬 속성 = 내 펫 속성일 때 데미지 배율 (같은 속성 보너스)
};
// 공격 속성 → { strong: 잘 먹히는 방어 속성들, weak: 잘 안 먹히는 방어 속성들 }
export const ELEM_CHART = {
  normal: { strong: [], weak: [] },
  fire: { strong: ['grass', 'ice', 'poison'], weak: ['water', 'earth', 'fire'] },
  water: { strong: ['fire', 'earth'], weak: ['grass', 'electric', 'water'] },
  grass: { strong: ['water', 'earth', 'electric'], weak: ['fire', 'ice', 'poison', 'wind', 'grass'] },
  electric: { strong: ['water', 'wind'], weak: ['earth', 'grass', 'electric'] },
  ice: { strong: ['grass', 'wind', 'earth'], weak: ['fire', 'water', 'ice'] },
  wind: { strong: ['grass', 'poison'], weak: ['electric', 'ice'] },
  earth: { strong: ['fire', 'electric', 'poison'], weak: ['grass', 'wind'] },
  light: { strong: ['dark', 'poison'], weak: ['light', 'fire'] },
  dark: { strong: ['light', 'wind'], weak: ['dark', 'earth'] },
  poison: { strong: ['grass', 'water'], weak: ['earth', 'poison', 'dark'] },
};
// 펫마다 속성 1~2개 (맨 앞이 "첫 번째 속성" = 기본 공격 속성). 여기에 없는 펫은 무속성이에요.
export const PET_ELEMENTS = {
  pyro_cat: ['fire'], aqua_pup: ['water'], leaf_bun: ['grass'],
  slime: ['water'], mouse: ['electric'], bee: ['wind', 'poison'], rabbit: ['normal'], ladybug: ['grass'], butterfly: ['grass', 'wind'],
  owl: ['wind', 'dark'], fox: ['fire'], treant: ['grass', 'earth'], deer: ['grass', 'light'], squirrel: ['grass'], mushroom: ['grass', 'poison'], wolf: ['dark'],
  clover_fairy: ['grass', 'light'], boar: ['earth'], unicorn: ['light', 'grass'],
  bat: ['dark', 'wind'], golem: ['earth'], spider: ['poison'], scorpion: ['poison', 'earth'], crystal: ['earth', 'light'], skeleton: ['dark'], ghost: ['dark'],
  crab: ['water', 'earth'], shark: ['water', 'dark'], pufferfish: ['water', 'poison'], octopus: ['water'], whale: ['water'], turtle: ['water', 'earth'], mermaid: ['water', 'light'],
  baby_dragon: ['fire'], phoenix: ['fire', 'light'], magma_slime: ['fire', 'earth'], salamander: ['fire'], flame_lord: ['fire', 'dark'], fire_dragon: ['fire', 'wind'],
  frog: ['water', 'poison'], snake: ['poison'], croc: ['water', 'dark'], wisp: ['fire', 'dark'], witch: ['poison', 'dark'],
  camel: ['earth'], cactus: ['grass', 'earth'], scarab: ['earth'], lion: ['fire'], mummy: ['dark', 'earth'], sandworm: ['earth', 'poison'],
  penguin: ['ice', 'water'], bear: ['ice'], yeti: ['ice', 'earth'], ice_spirit: ['ice'], frost_dragon: ['ice', 'wind'], ice_queen: ['ice', 'light'],
  cloud_sheep: ['wind'], parrot: ['wind'], thunder_bird: ['electric', 'wind'], pegasus: ['wind', 'light'], wyvern: ['wind', 'poison'], angel: ['light'], sun_god: ['light', 'fire'],
  shadow: ['dark'], void_eye: ['dark'], star_whale: ['water', 'light'], comet: ['ice', 'light'], void_dragon: ['dark'], chaos_lord: ['dark', 'fire'], creator: ['light', 'dark'],
  puppet: ['normal'], mask_actor: ['dark'], clown: ['dark', 'poison'], magician: ['light', 'dark'], ringmaster: ['fire', 'dark'], joker: ['dark', 'poison'],
  zeta_larva: ['poison'], ufo_drone: ['electric'], tentacle: ['water', 'dark'], gray_alien: ['light', 'electric'], xeno_queen: ['poison', 'earth'], star_devourer: ['dark', 'electric'], slime_ayoung: ['poison', 'water'],
  piglet: ['earth'], mud_boar: ['earth', 'water'], golden_hog: ['earth', 'light'], jewel_boar: ['earth', 'light'], treasure_hog: ['light'], pig_general: ['earth', 'dark'], golden_pig_boss: ['light', 'earth'],
};
export const petElementsOf = (petId) => PET_ELEMENTS[petId] ?? ['normal'];

export const elemTag = (e) => `${(ELEMENTS[e] ?? ELEMENTS.normal).emoji} ${(ELEMENTS[e] ?? ELEMENTS.normal).name}`; // "🔥 불"
export const elemIcons = (elems) => (elems?.length ? elems : ['normal']).map((e) => (ELEMENTS[e] ?? ELEMENTS.normal).emoji).join(''); // "🌿🌪️"
export const elemTags = (elems) => (elems?.length ? elems : ['normal']).map(elemTag).join(' + '); // "🌿 풀 + 🌪️ 바람"
// 전투 중인 한쪽(X)의 "지금 속성" — 속성 변환(convert) 중이면 바뀐 속성이에요
// 🌈 속성 전체 부여(allElem): 공격 쪽이면 모든 속성으로 때리고, 방어 쪽이면 몸에 모든 속성이 깃들어요
export const ALL_ELEMS = Object.keys(ELEMENTS).filter((e) => e !== 'normal');
export const ALL_ELEM_CFG = { maxMult: 3, minMult: 0.4 }; // 전속성이 얽힌 상성 배율의 상한/하한 (곱셈이 너무 커지거나 작아지지 않게)
const allElemMode = (X) => X?.st?.allElem?.mode;
export const isAllElemAtk = (X) => allElemMode(X) === 'attack' || allElemMode(X) === 'both';
export const isAllElemDef = (X) => allElemMode(X) === 'defend' || allElemMode(X) === 'both';
export const effElems = (X) => (isAllElemDef(X) ? ALL_ELEMS : X?.st?.convert ? [X.st.convert.elem] : X?.elems?.length ? X.elems : ['normal']);
// 화면용: 전속성이면 한 글자로 짧게 보여줘요
export const elemIconsOf = (X) => (isAllElemDef(X) ? '🌈' : elemIcons(effElems(X)));
export const elemTagsOf = (X) => (isAllElemDef(X) ? '🌈 전속성' : elemTags(effElems(X)));

// 상성 계산: atkElem 으로 defender 를 때렸을 때의 배율과 안내 글자
// attacker 를 넘기면 공격 쪽의 속성 전체 부여(allElem)도 반영해요 (모든 속성으로 때려서 약점은 살리고 반감은 없어요)
export function elemClash(atkElem, defender, { ignoreResist = false, attacker = null } = {}) {
  const row = ELEM_CHART[atkElem] ?? ELEM_CHART.normal;
  const allAtk = isAllElemAtk(attacker);
  let mult = 1;
  for (const d of effElems(defender)) {
    if (allAtk) { if (ALL_ELEMS.some((e) => ELEM_CHART[e].strong.includes(d))) mult *= ELEM_CFG.strong; }
    else if (row.strong.includes(d)) mult *= ELEM_CFG.strong;
    else if (row.weak.includes(d)) mult *= ELEM_CFG.weak;
  }
  if (allAtk || isAllElemDef(defender)) mult = clamp(mult, ALL_ELEM_CFG.minMult, ALL_ELEM_CFG.maxMult);
  let ignored = false;
  let warded = false;
  if (ignoreResist && mult < 1) { mult = 1; ignored = true; }
  if (mult > 1 && defender?.st?.ward) { mult = 1; warded = true; }
  let genesis = false; // 🌌 천지창조: 내 공격은 약점 확정, 내가 맞는 약점은 사라져요
  if (attacker?.st?.genesis && mult < ELEM_CFG.strong) { mult = ELEM_CFG.strong; genesis = true; warded = false; ignored = false; }
  else if (defender?.st?.genesis && mult > 1) { mult = 1; genesis = true; }
  let note = '';
  if (ignored) note = ' (🔓 상성 반감을 무시했어요!)';
  else if (warded) note = ' (🔮 속성 방벽이 약점을 막아냈어요!)';
  else if (mult >= 2) note = ' 🌟 **약점 적중!!** (효과가 아주 굉장해요)';
  else if (mult >= 1.1) note = ' ✨ **효과가 굉장했다!**';
  else if (mult <= 0.5) note = ' 💨 효과가 거의 없는 듯하다…';
  else if (mult <= 0.9) note = ' 💧 효과가 별로인 듯하다…';
  if (genesis) note += mult > 1 ? ' 🌌 천지창조: 약점 확정!' : ' 🌌 천지창조의 장막이 약점을 지웠어요!';
  return { mult, note, ignored, warded };
}
// 상성 한 줄 요약 (확인창 · 전투 화면용)
export function clashLabel(mult) {
  if (mult >= 2) return `🌟 약점! 아주 굉장해요 (×${+mult.toFixed(2)})`;
  if (mult >= 1.1) return `✨ 효과가 굉장해요 (×${+mult.toFixed(2)})`;
  if (mult <= 0.5) return `💨 효과가 거의 없어요 (×${+mult.toFixed(2)})`;
  if (mult <= 0.9) return `💧 효과가 별로예요 (×${+mult.toFixed(2)})`;
  return '보통 (×1)';
}
export const skillElement = (sk) => sk?.elem ?? 'normal';

export const SKILLS = {};
const add = (id, name, emoji, tier, fx, extra = {}) => {
  SKILLS[id] = { id, name, emoji, tier, cost: TIER_COST[tier], ...fx, ...extra };
};
const G = (id, name, emoji, tier, fx) => add(id, name, emoji, tier, fx); // 일반 스킬 (모든 펫)
const sigCount = {};
const P = (pet, id, name, emoji, tier, fx, flavor) => {
  // 🌈 전용기의 속성은 펫의 속성을 따라가요 (속성이 2개인 펫은 첫 번째 전용기 = 첫 속성, 두 번째 전용기 = 둘째 속성)
  const el = petElementsOf(pet);
  const idx = sigCount[pet] ?? 0;
  sigCount[pet] = idx + 1;
  add(id, name, emoji, tier, fx, { pet, flavor, elem: el[idx % el.length] });
}; // 전용기
const U = (id, name, emoji, tier, fx, flavor) => add(id, name, emoji, tier, fx, { flavor, unique: true }); // 🆕 독창 스킬 (모든 펫, 특이한 규칙)

// ───────── 일반 스킬: 속성 공격 (속성마다 ★1 · ★3 · ★5) ─────────
// 📏 위력 기준: ★1 1.3~1.45 · ★2 1.5~1.8 · ★3 2.0~2.3 · ★4 2.5~3.0 · ★5 3.1~3.8 (연타기는 총 배율 기준, 부가 효과가 붙으면 조금 낮아요)
G('fire_spark', '불씨', '🔥', 1, { pow: 1.4, dot: ['burn', 0.05, 2, 0.3] });
G('fireball', '화염구', '☄️', 3, { pow: 2.0, dot: ['burn', 0.05, 3, 0.5] });
G('inferno', '업화', '🌋', 5, { pow: 2.8, dot: ['burn', 0.08, 3, 1], flashover: 0.8 });
G('ember_jab', '불찌르기', '🔥', 1, { pow: 1.25, dot: ['burn', 0.04, 2, 0.4] });
G('flame_wheel', '화륜', '🛞', 2, { pow: 1.5, dot: ['burn', 0.04, 3, 0.5] });
G('sear', '지지기', '🍳', 2, { pow: 1.2, dot: ['burn', 0.05, 3, 0.6] });
G('blazing_kick', '작열차기', '🦶', 3, { pow: 2.1, dot: ['burn', 0.05, 3, 0.4] });
G('magma_burst', '용암분출', '🌋', 4, { pow: 2.8, dot: ['burn', 0.07, 3, 0.6] });
G('water_gun', '물총', '💧', 1, { pow: 1.35, atkDown: [0.1, 2] });
G('tidal_wave', '파도타기', '🏄', 3, { pow: 2.0, atkDown: [0.15, 3] });
G('tsunami', '해일', '🌊', 5, { pow: 2.8, atkDown: [0.25, 3], stun: 0.25, wash: 1 });
G('bubble_burst', '거품폭발', '🫧', 1, { pow: 1.25, stun: 0.1 });
G('tide_crash', '조수충돌', '🌊', 2, { pow: 1.6, atkDown: [0.12, 2] });
G('geyser', '간헐천', '⛲', 4, { pow: 2.7, stun: 0.2 });
G('whirlpool', '소용돌이', '🌀', 3, { pow: 1.1, hits: 2, atkDown: [0.2, 2] });
G('vine_whip', '덩굴채찍', '🌿', 1, { pow: 1.3, drain: 0.3 });
G('thorn_storm', '가시폭풍', '🌵', 3, { pow: 1.0, hits: 2, dot: ['bleed', 0.04, 3, 0.4] });
G('thorn_lash', '가시채찍', '🌹', 1, { pow: 1.2, dot: ['bleed', 0.03, 2, 0.3] });
G('root_crush', '뿌리짓밟기', '🌱', 3, { pow: 2.1, stun: 0.2 });
G('spore_cloud', '포자구름', '🍄', 2, { pow: 0.9, dot: ['poison', 0.05, 3, 0.8] });
G('pollen_storm', '꽃가루폭풍', '🌼', 3, { pow: 1.0, hits: 2, atkDown: [0.25, 2] });
G('solar_beam', '태양광선', '☀️', 5, { pow: 3.0, pierce: 0.3, melt: [0.1, 0.4, 4] });
G('spark', '스파크', '⚡', 1, { pow: 1.4, stun: 0.15 });
G('thunder', '번개', '🌩️', 3, { pow: 2.1, stun: 0.25 });
G('thunderstorm', '뇌우', '⛈️', 5, { pow: 2.6, stun: 0.4, shock: [0.5, 0.12] });
G('lightning_fang', '번개송곳니', '⚡', 2, { pow: 1.5, stun: 0.2 });
G('static_field', '정전기장', '🔌', 2, { pow: 0.9, hits: 2, stun: 0.1 });
G('thunder_hammer', '뇌격망치', '🔨', 4, { pow: 2.9, stun: 0.35 });
G('ion_burst', '이온폭발', '💥', 3, { pow: 1.9, drainMana: 20 });
G('frost_touch', '서리손', '❄️', 1, { pow: 1.3, defDown: [0.1, 2] });
G('ice_shard', '얼음송곳', '🧊', 3, { pow: 2.1, defDown: [0.2, 3] });
G('blizzard', '눈보라', '🌨️', 5, { pow: 3.0, stun: 0.2, defDown: [0.25, 3], coldSnap: true });
G('ice_fang', '얼음송곳니', '🦷', 2, { pow: 1.5, defDown: [0.2, 2] });
G('frozen_spike', '얼음가시', '🧊', 2, { pow: 1.4, stun: 0.15 });
G('hail_storm', '우박폭풍', '🌨', 4, { pow: 0.8, hits: 4, defDown: [0.1, 2] });
G('glacier_crush', '빙하붕괴', '🏔️', 5, { pow: 3.2, defDown: [0.3, 3], stun: 0.2, iceArmor: 0.3 });
G('gust', '돌풍', '💨', 1, { pow: 1.3, crit: 0.15 });
G('wind_blade', '바람칼날', '🍃', 3, { pow: 0.95, hits: 2, crit: 0.1 });
G('tornado', '토네이도', '🌪️', 5, { pow: 0.7, hitsRange: [3, 6], hitPows: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0], crit: 0.1 });
G('gale_slash', '질풍베기', '⚡', 2, { pow: 1.5, crit: 0.15 });
G('cyclone', '회오리', '🌪', 3, { pow: 1.1, hits: 2 });
G('feather_dart', '깃털화살', '🪶', 2, { pow: 0.55, hits: 3 });
G('talon_dive', '급강하발톱', '🦅', 3, { pow: 2.3, crit: 0.1 });
G('gale_wing', '날개강타', '🪽', 3, { pow: 2.1, crit: 0.15 });
G('pebble', '자갈던지기', '🪨', 1, { pow: 1.35 });
G('earthquake', '지진', '🌍', 3, { pow: 2.2 });
G('meteor_fall', '운석낙하', '🌠', 5, { pow: 2.6, stun: 0.2, shards: [1.1, 2] });
G('boulder_toss', '바위던지기', '🪨', 2, { pow: 1.6 });
G('stone_fist', '돌주먹', '✊', 1, { pow: 1.5, defDown: [0.1, 2] });
G('quake_stomp', '지각밟기', '👣', 3, { pow: 2.1, stun: 0.2 });
G('sand_blast', '모래폭풍', '🏜️', 2, { pow: 0.85, hits: 2, atkDown: [0.15, 2] });
G('dune_crush', '모래언덕', '🏝️', 3, { pow: 2.2, defDown: [0.2, 3] });
G('flash', '섬광', '✨', 1, { pow: 1.3, atkDown: [0.1, 2] });
G('holy_ray', '성스러운 빛', '🌟', 3, { pow: 2.0, heal: 0.1 });
G('judgement', '심판', '⚖️', 5, { pow: 3.3, exec: 1.6 });
G('shadow_claw', '그림자발톱', '🌑', 1, { pow: 1.4, dot: ['bleed', 0.04, 2, 0.3] });
G('shadow_bite', '그림자깨물기', '🌚', 2, { pow: 1.5, drain: 0.25 });
G('dark_pulse', '어둠의파동', '🌘', 3, { pow: 2.1, drain: 0.25 });
G('night_slash', '밤의베기', '🌃', 3, { pow: 2.1, crit: 0.2 });
G('soul_strike', '영혼타격', '💠', 3, { pow: 1.8, drainMana: 15 });
G('eclipse_ray', '일식광선', '🌘', 5, { pow: 3.0, pierce: 0.4, atkDown: [0.2, 3], eclipse: 3 });
G('void_collapse', '공허붕괴', '🕳️', 5, { pow: 2.8, pierce: 0.5, voidEat: 0.12 });
G('void_shot', '공허탄', '🌑', 3, { pow: 2.0, pierce: 0.3 });
G('poison_sting', '독침', '☠️', 1, { pow: 1.1, dot: ['poison', 0.05, 3, 0.6] });
G('toxic_fog', '독안개', '🧪', 3, { pow: 1.2, dot: ['poison', 0.06, 4, 0.7] });
G('plague', '대역병', '🦠', 5, { pow: 2.0, dot: ['poison', 0.08, 4, 1], atkDown: [0.2, 3], plagueScale: 0.3 });
G('acid_spit', '산성침', '🧪', 2, { pow: 1.1, defDown: [0.2, 3], dot: ['poison', 0.04, 3, 0.4] });
G('hex_bolt', '저주탄', '🪄', 2, { pow: 1.2, dot: ['poison', 0.05, 3, 0.5] });
G('spirit_siphon', '영혼흡수', '👻', 3, { pow: 1.7, drain: 0.5 });
G('prism_ray', '프리즘광선', '🔺', 4, { pow: 2.6, crit: 0.25 });
G('echo_burst', '메아리', '📯', 3, { pow: 1.1, hits: 2, stun: 0.2 });
G('bounce_ball', '튀는공', '⚽', 1, { pow: 0.75, hits: 2 });
G('shard_storm', '파편폭풍', '🪨', 4, { pow: 1.0, hits: 3, pierce: 0.2 });
G('frenzy', '광란', '😵', 4, { pow: 0.65, hits: 5, recoil: 0.05 });

// ───────── 일반 스킬: 몸으로 부딪히기 · 연타 ─────────
G('quick_jab', '빠른 찌르기', '🥊', 1, { pow: 0.75, hits: 2 });
G('double_kick', '이단차기', '🦵', 2, { pow: 0.9, hits: 2 });
G('triple_slash', '삼연참', '🗡️', 3, { pow: 0.75, hits: 3 });
G('fury_swipes', '난타', '🐾', 3, { pow: 0.55, hits: 4 });
G('rush', '돌진', '🐗', 2, { pow: 1.6, recoil: 0.08 });
G('body_slam', '몸통박치기', '🏋️', 2, { pow: 1.5, stun: 0.15 });
G('headbutt', '박치기', '🤕', 3, { pow: 2.3, recoil: 0.1 });
G('heavy_strike', '강타', '🔨', 2, { pow: 1.7 });
G('execute', '마무리일격', '💀', 4, { pow: 2.3, exec: 2.2 });
G('piercing_shot', '관통사격', '🏹', 4, { pow: 2.2, pierce: 0.5 });
G('sniper', '저격', '🎯', 4, { pow: 2.6, crit: 0.4 });
G('armor_break', '방어파괴', '🪓', 2, { pow: 1.4, defDown: [0.3, 3] });
G('berserk', '광폭화', '😤', 3, { pow: 2.5, recoil: 0.15 });
G('reckless', '무모한 돌격', '🐂', 2, { pow: 1.8, recoil: 0.12 });
G('last_stand', '배수진', '🏴', 4, { pow: 3.2, recoil: 0.25 });
G('all_in', '전력투구', '💥', 5, { pow: 3.4, allIn: [0.6, 0.3, 3] });
G('bleed_slash', '출혈참', '🩸', 2, { pow: 1.2, dot: ['bleed', 0.05, 3, 0.6] });
G('pufferburst', '가시부풀기', '🐡', 2, { pow: 1.1, recoil: 0.03, dot: ['bleed', 0.04, 3, 0.5] });
G('counter_claw', '반격발톱', '🐾', 2, { pow: 1.4, recoil: 0.04 });
G('bone_crack', '뼈부수기', '🦴', 3, { pow: 2.2, defDown: [0.2, 2] });

// ───────── 일반 스킬: 회복 · 흡혈 ─────────
G('first_aid', '응급처치', '🩹', 1, { heal: 0.2 });
G('bandage', '붕대', '🧻', 1, { heal: 0.15, cleanse: true });
G('moss_cure', '이끼치료', '🌿', 1, { heal: 0.15 });
G('dew_drop', '이슬방울', '💧', 1, { heal: 0.12, mana: 5 });
G('deep_breath', '심호흡', '😮‍💨', 2, { heal: 0.3 });
G('honey_heal', '꿀치유', '🍯', 2, { heal: 0.25, mana: 5 });
G('nectar', '꿀물', '🍯', 2, { heal: 0.2, atkUp: [0.2, 2] });
G('cloud_nap', '구름낮잠', '💤', 2, { heal: 0.25, evade: 1 });
G('healing_light', '치유의 빛', '💖', 3, { heal: 0.45 });
G('lunar_rest', '달빛휴식', '🌙', 3, { heal: 0.3, cleanse: true });
G('fairy_dust', '요정가루', '🧚', 3, { heal: 0.2, cleanse: true, atkUp: [0.2, 2] });
G('sanctuary', '성역', '⛪', 4, { heal: 0.4, shield: 0.25 });
G('rejuvenate', '회춘', '✨', 4, { heal: 0.4, regen: [0.06, 3] });
G('phoenix_tears', '불사조의 눈물', '🕊️', 5, { heal: 0.5, cleanse: true, cleanseHeal: 0.1 });
G('regen_seed', '회복의 씨앗', '🌱', 2, { regen: [0.08, 4] });
G('rain_mend', '빗물회복', '🌧️', 2, { regen: [0.05, 3] });
G('spring_water', '샘물', '⛲', 3, { regen: [0.1, 4], cleanse: true });
G('hot_spring', '온천욕', '♨️', 3, { regen: [0.08, 3], cleanse: true });
G('vampire_bite', '흡혈', '🧛', 2, { pow: 1.5, drain: 0.4 });
G('life_drain', '생명흡수', '🩸', 3, { pow: 1.6, drain: 0.6 });
G('soul_feast', '영혼연회', '👻', 5, { pow: 2.8, drain: 1.0, feastMax: [0.5, 0.3], feastAtk: [0.08, 0.3, 5] });
G('blood_pact', '피의계약', '🩸', 4, { pow: 2.2, drain: 0.6, recoil: 0.05 }); // 🛠️ 예전엔 pow 가 없어서 흡혈이 안 되는 버그가 있었어요

// ───────── 일반 스킬: 방어 ─────────
G('guard', '방어태세', '🛡️', 1, { guard: [0.4, 2] });
G('harden', '단단해지기', '🧱', 1, { defUp: [0.3, 3] });
G('mud_wall', '진흙벽', '🧱', 2, { guard: [0.35, 2] });
G('barrier', '보호막', '🔰', 2, { shield: 0.2 });
G('stone_skin', '돌피부', '⛰️', 2, { defUp: [0.4, 3] });
G('thick_fur', '두꺼운털', '🐻', 2, { defUp: [0.35, 3] });
G('dodge_stance', '회피태세', '🌀', 2, { evade: 1 });
G('sand_cloak', '모래망토', '🧣', 2, { evade: 1, heal: 0.1 });
G('sunshade', '그늘막', '⛱️', 2, { shield: 0.15, heal: 0.1 });
G('shell_hide', '껍질숨기', '🐚', 2, { defUp: [0.3, 2], evade: 1 });
G('iron_wall', '철벽', '🏯', 3, { guard: [0.5, 3] });
G('crystal_shield', '수정방패', '💠', 3, { shield: 0.35 });
G('shadow_step', '그림자걸음', '👣', 3, { evade: 2 });
G('coral_guard', '산호방패', '🪸', 3, { guard: [0.45, 3] });
G('ice_armor', '얼음갑옷', '🥶', 3, { defUp: [0.4, 3], shield: 0.1 });
G('oak_bark', '참나무껍질', '🌳', 3, { shield: 0.25 });
G('feather_veil', '깃털베일', '🪶', 3, { evade: 2 });
G('bone_plate', '뼈갑옷', '🦴', 3, { defUp: [0.45, 3], shield: 0.15 });
G('fortress', '요새화', '🏰', 4, { guard: [0.65, 3], defUp: [0.3, 3] });
G('mirror_shield', '거울방패', '🪞', 4, { shield: 0.3, guard: [0.3, 2] });
G('steel_scale', '강철비늘', '🔩', 4, { defUp: [0.6, 3] });
G('bubble_dome', '물방울돔', '🔵', 4, { shield: 0.3, regen: [0.04, 3] });
G('adamant', '금강불괴', '💎', 5, { guard: [0.4, 3], shield: 0.3, ironSkin: [0.1, 3] });

// ───────── 일반 스킬: 강화 ─────────
G('power_up', '힘주기', '💪', 1, { atkUp: [0.3, 3] });
G('sharpen', '날갈기', '🗡️', 1, { atkUp: [0.25, 3] });
G('war_cry', '함성', '📣', 2, { atkUp: [0.45, 3] });
G('battle_roar', '전투함성', '📢', 2, { atkUp: [0.35, 3] });
// 🛠️ 마나 스킬: 기본 공격이 공짜로 +15 를 주기 때문에, (얻는 마나 − 드는 마나)가 15 보다 확실히 커야 쓸 이유가 있어요
G('adrenaline', '아드레날린', '💉', 2, { mana: 45 }); // 순이득 +25
G('rage', '분노', '😡', 3, { atkUp: [0.7, 3] });
G('bulk_up', '벌크업', '🏋️‍♂️', 3, { atkUp: [0.3, 3], defUp: [0.3, 3] });
G('blessing', '축복', '🙏', 3, { atkUp: [0.3, 4], defUp: [0.3, 4], heal: 0.1 });
G('iron_will', '강철의 의지', '🧠', 3, { defUp: [0.3, 3], heal: 0.1 });
G('sun_blessing', '햇살축복', '🌞', 3, { atkUp: [0.3, 4], heal: 0.1 });
G('mana_rush', '마나폭주', '🔋', 3, { mana: 70, heal: 0.1 }); // 🛠️ id 변경 (mana_surge → mana_rush: 독창 스킬 '마나증폭'과 id 가 겹쳐 사라지던 문제)
G('heart_drum', '심장북', '🥁', 3, { atkUp: [0.5, 2], mana: 10 });
G('dragon_dance', '용의 춤', '🐉', 4, { atkUp: [0.6, 4], mana: 15 });
G('deep_focus', '심상', '🔮', 4, { mana: 100 }); // 순이득 +50
G('ancient_power', '고대의힘', '🏺', 4, { atkUp: [0.5, 4], defUp: [0.2, 4] });
G('overclock', '오버드라이브', '⚙️', 5, { atkUp: [1.2, 3], defUp: [0.6, 3], heal: 0.2 }); // 🛠️ id 변경 (overdrive → overclock: 독창 스킬 '초출력'과 id 겹침) + 피해 없는 ★5 라서 효과 상향
G('charge_up', '충전', '🔋', 2, { mana: 40 }); // 순이득 +20
G('focus_breath', '기마심호흡', '🫁', 2, { mana: 38, heal: 0.1 }); // 순이득 +18 + 회복
G('meditate', '명상', '🧘', 3, { mana: 70 }); // 순이득 +35

// ───────── 일반 스킬: 약화 · 상태이상 ─────────
G('growl', '으르렁', '😾', 1, { atkDown: [0.2, 3] });
G('mocking_song', '놀림노래', '🎶', 1, { atkDown: [0.15, 2] });
G('intimidate', '위협', '👿', 2, { atkDown: [0.35, 3] });
G('weaken', '약화', '🔻', 3, { atkDown: [0.5, 3] });
G('sunder', '갑옷가르기', '⚔️', 2, { defDown: [0.3, 3] });
G('crumble', '와르르', '🧱', 2, { defDown: [0.25, 3] });
G('rust_touch', '녹스는 손', '🔩', 2, { defDown: [0.3, 2] });
G('corrode', '부식', '🧫', 3, { defDown: [0.5, 3] });
G('stun_strike', '기절타', '💫', 2, { pow: 0.9, stun: 0.5 });
G('paralyze', '마비가루', '🍄', 3, { stun: 0.6 });
G('sleep_dust', '수면가루', '😴', 3, { stun: 0.5 });
G('lullaby', '자장가', '🎵', 3, { stun: 0.4, atkDown: [0.15, 2] });
G('confusion_ray', '혼란광선', '🌀', 3, { stun: 0.3, atkDown: [0.2, 2] });
G('hypnosis', '최면', '😵‍💫', 4, { stun: 0.8 });
G('terror_gaze', '공포의 눈', '😱', 4, { atkDown: [0.4, 3], stun: 0.3 });
G('mana_burn', '마나연소', '🔥', 3, { pow: 1.9, drainMana: 30 });
G('curse', '저주', '🧿', 4, { atkDown: [0.4, 4], defDown: [0.4, 4] });
G('ember_curse', '불씨저주', '🕯️', 2, { dot: ['burn', 0.09, 3, 1] });
G('ember_brand', '불씨낙인', '🔥', 3, { dot: ['burn', 0.13, 3, 1], defDown: [0.25, 3] });
G('toxic_mist', '독무', '☁️', 3, { dot: ['poison', 0.1, 4, 0.9], atkDown: [0.2, 3] });
G('venom_fang', '맹독니', '🐍', 3, { pow: 1.3, dot: ['poison', 0.06, 4, 0.8] });
G('frostbite', '동상', '🥶', 3, { pow: 1.3, dot: ['burn', 0.06, 3, 0.7], atkDown: [0.2, 3] });
G('scorch', '그을림', '♨️', 2, { pow: 1.2, dot: ['burn', 0.05, 3, 0.8] });
G('soul_curse', '영혼저주', '☯️', 4, { dot: ['poison', 0.13, 4, 1], defDown: [0.3, 4] });

// ───────── 🆕 독창 스킬 (모든 펫이 배울 수 있어요 · 다른 게임에 잘 없는 특이한 규칙들) ─────────
// ★1
U('pillow_fight', '베개싸움', '🛏️', 1, { pow: 1.2, stun: 0.2, heal: 0.05 }, '푹신푹신 퍽! 아프진 않은데 눈이 스르르 감겨요.');
U('confetti', '색종이 폭죽', '🎊', 1, { pow: 1.2, atkDown: [0.1, 2], mana: 5 }, '팡! 하고 터지면 다들 눈이 휘둥그레져요.');
U('tickle', '간지럼 공격', '🪶', 1, { pow: 0.7, hits: 2, atkDown: [0.1, 2] }, '깃털로 살살… 웃음이 터져서 힘이 빠져요.');
U('lucky_penny', '행운의 동전', '🪙', 1, { pow: 1.0, gamble: [0.5, 2.0, 0.05] }, '동전 던지기! 앞면이면 두 배, 뒷면이면 아야.');
// ★2
U('dice_fury', '주사위 난타', '🎲', 2, { pow: 0.6, hitsRange: [1, 5] }, '몇 번 때릴지는 주사위만 알아요 (1~5번).');
U('comeback', '오기', '😤', 2, { pow: 1.2, revenge: 1.2 }, '아프면 아플수록 더 세게 때려요!');
U('mana_thief', '마나 도둑', '🧤', 2, { pow: 1.2, stealMana: 20, cost: 15 }, '슬쩍~ 상대 마나를 내 주머니로.');
U('piggy_bank', '저금통 깨기', '🐷', 2, { pow: 1.5, mana: 15 }, '쨍그랑! 마나 동전이 와르르 쏟아져요.');
U('hot_potato', '뜨거운 감자', '🥔', 2, { pow: 1.2, dot: ['burn', 0.05, 3, 0.9], atkDown: [0.15, 2] }, '앗 뜨거! 던졌더니 상대가 데어요.');
U('ghost_prank', '도깨비 장난', '🎭', 2, { atkDown: [0.2, 3], defDown: [0.15, 3] }, '"왁!" 깜짝 놀라서 온몸에 힘이 빠져요.');
// ★3
U('time_bomb', '시한폭탄', '💣', 4, { bomb: [2.0, 3] }, '똑딱똑딱… 3턴 뒤에 쾅! 방어도 소용없어요.');
U('fireworks', '불꽃놀이', '🎆', 3, { pow: 0.9, detonate: 1.5, dot: ['burn', 0.05, 3, 1] }, '이미 걸린 불씨를 한꺼번에 팡팡! 터뜨리고 새 불씨를 심어요.');
U('lucky_seven', '럭키 세븐', '🎰', 3, { pow: 0.65, hitsRange: [1, 7] }, '1번일까 7번일까? 7번 나오면 대박이에요.');
U('mana_vampire', '마나 흡혈', '🧛‍♂️', 3, { pow: 1.7, stealMana: 30, drain: 0.2 }, '피와 마나를 한꺼번에 쪽쪽 빨아요.');
U('echo_chamber', '메아리 방', '🔊', 3, { echo: 3 }, '3턴 안에 쓰는 다음 공격 스킬이 한 번 더 울려 퍼져요.'); // 🛠️ 마나 20 → 35 (★5 스킬을 반값에 두 번 쓰는 문제)
U('dance_battle', '댄스 배틀', '💃', 3, { atkUp: [0.4, 3], mana: 20, heal: 0.1 }, '흥이 오르면 힘도 마나도 솟아요!');
U('sugar_rush', '설탕 폭주', '🍬', 3, { atkUp: [0.5, 3], mana: 25, recoil: 0.08 }, '당이 확 올라서 신나지만… 뒤가 좀 무서워요.');
// ★4
U('all_in_gamble', '올인 도박', '🎰', 4, { pow: 1.6, gamble: [0.4, 3.6, 0.2] }, '40%에 모든 걸 걸어요. 터지면 엄청난 한 방!');
U('last_gasp', '마지막 발악', '🩸', 4, { pow: 2.0, revenge: 2.0 }, '체력이 바닥일수록 무서운 한 방이 나가요.');
U('mana_flood', '마나 대방출', '🌊', 4, { pow: 1.0, overload: 0.025, cost: 20 }, '남은 마나를 전부 쏟아부어요. 모아둘수록 세져요!');
U('chain_reaction', '연쇄반응', '⛓️', 4, { pow: 1.6, detonate: 2.5 }, '화상·독·출혈이 걸려 있으면 남은 피해를 한꺼번에 폭발시켜요.');
// ★5
U('fate_swap', '운명 교환', '🔀', 5, { swapHp: true }, '"당신의 건강은 이제 내 것." 내 체력이 더 낮으면 서로의 체력 비율을 바꿔요.');
U('doomsday_clock', '종말의 시계', '🕰️', 5, { bomb: [2.8, 4], defDown: [0.2, 4] }, '시곗바늘이 12를 가리키면 모든 게 끝나요.');
U('mana_nova', '마나 초신성', '🌟', 5, { pow: 1.2, overload: 0.03, pierce: 0.3, cost: 30 }, '쌓아둔 마나가 별처럼 폭발해요. 방어도 뚫어요!');
U('devil_dice', '악마의 주사위', '😈', 5, { pow: 2.4, gamble: [0.4, 5.0, 0.25] }, '40%의 기적에 나를 걸어요. 실패하면 많이 아파요.');

// ───────── 🆕 2차 확장 스킬 (배치 1 — manaMaxUp·manaRegenUp·steal·turnCut·truePct·mercy·burstAtk·debuffToBuff·coinflip·defToAtk·healCut 예시) ─────────
U('mana_surge', '마나증폭', '🔷', 2, { manaMaxUp: [30, 4], mana: 30 }, '그릇이 커져서 마나를 더 담을 수 있어요. 그릇을 키우면서 마나도 채워요.'); // 🛠️ 마나를 못 채워서 쓸모없던 스킬 → 마나 +30
U('mana_spring', '마나샘', '💧', 2, { manaRegenUp: [12, 4] }, '퐁퐁 솟아나는 마나샘이 생겨요.');
U('power_steal', '힘흡수', '🧲', 3, { steal: ['atk', 0.3, 3] }, '상대의 힘을 쭉 빨아들여요.');
U('iron_steal', '철벽흡수', '🧲', 3, { steal: ['def', 0.3, 3] }, '상대의 단단함을 내 것으로!');
U('time_cut', '시간깎기', '⏳', 2, { turnCut: 2 }, '상대에게 걸린 좋은 효과의 시간을 싹둑 잘라요.');
U('true_strike', '필중가격', '🎯', 3, { pow: 1.2, truePct: 0.1 }, '방어를 뚫는 확정 타격이 추가로 꽂혀요.');
U('mercy_blow', '자비의일격', '🕊️', 3, { pow: 1.8, mercy: true }, '세게 때리지만 상대는 체력 1%로 꼭 살아남아요.'); // 🛠️ 포획용으로 너무 좋아서 ★2 → ★3
U('overdrive', '초출력', '🔥', 4, { burstAtk: [2.5, 2] }, '한계를 넘어 다음 턴 공격력이 폭주해요! (×250%)'); // 🛠️ 예전 [5,1] 은 시전 턴에 바로 끝나서 효과가 0턴이었어요
U('silver_lining', '전화위복', '🔄', 3, { debuffToBuff: true }, '나쁜 일도 생각하기 나름! 디버프가 전부 버프로.');
U('all_or_nothing', '모아니면도', '🎲', 3, { coinflip: 2 }, '이판사판! 받는 공격이 1.5배 아니면 0이 돼요.'); // 🛠️ 2배/0 은 기댓값이 ×1 이라 득이 없었어요 → 1.5배/0
U('berserk_wall', '벽격투', '⚔️', 3, { defToAtk: 3 }, '방패를 내려놓고 그 힘을 전부 주먹에 실어요.');
U('plague_touch', '역병손길', '🚑', 3, { pow: 1.7, healCut: [0.5, 3] }, '손이 닿으면 회복이 잘 안 돼요…');

// ───────── 🆕 3차 확장 스킬 (배치 2: 스피드·복사·분신·반사·공포·선공) ─────────
U('speed_steal', '속도흡수', '👟', 3, { steal: ['spd', 0.3, 3] }, '상대의 발걸음을 훔쳐서 내 것으로!');
U('quick_step', '선수필승', '⏱️', 2, { priority: 1 }, '다음 턴, 스피드와 상관없이 내가 먼저 움직여요.');
U('time_leap', '시간 도약', '⏩', 4, { priority: 2, atkUp: [0.3, 3] }, '시간이 멈춘 듯 2턴 동안 항상 먼저! 힘도 솟아요.');
U('copycat', '따라하기', '🦜', 3, { copy: true }, '상대가 방금 쓴 그 스킬, 나도 쓸 수 있어요!'); // 🛠️ 마나 25 → 35
U('shadow_clone', '분신술', '👥', 3, { clone: [0.5, 0.6, 3] }, '내가 둘이 됐어요! 같이 때리고 대신 맞아줘요.');
U('mirror_coat', '반사의 갑옷', '🪞', 3, { reflect: [0.6, 2] }, '맞은 만큼 되돌려줘요.'); // 🛠️ 100% 반사는 너무 셌어요 → 60%
U('mirror_veil', '거울 장막', '🔮', 3, { reflectDebuff: 2 }, '나쁜 기운은 전부 튕겨서 보낸 사람에게!');
U('dread_counter', '공포의 반격', '😱', 4, { pow: 1.8, fear: 0.8 }, '맞은 아픔이 두려움이 되고, 두려움이 힘이 돼요.');

// ───────── 🌈 속성 상성 스킬 (약점 노리기 · 반감 무시 · 방벽 · 속성 변환) ─────────
G('weak_point', '약점 찌르기', '🎯', 2, { pow: 1.4, weakBonus: 0.5 });
G('keen_eye', '약점 간파', '👁️', 3, { pow: 1.8, weakBonus: 0.8 });
G('adapt_strike', '적응 타격', '🧬', 3, { pow: 1.7, ignoreResist: true });
G('resist_breaker', '상성 파괴', '🔓', 4, { pow: 2.5, ignoreResist: true, weakBonus: 0.3 });
G('prism_crash', '프리즘 파열', '🌈', 4, { pow: 2.4, ignoreResist: true, weakBonus: 0.5 });
G('elem_collapse', '속성 붕괴', '💠', 5, { pow: 3.1, ignoreResist: true, weakBonus: 0.8, pierce: 0.2 });
G('elem_ward', '속성 방벽', '🔮', 2, { ward: 3 });
G('prism_barrier', '프리즘 방벽', '🪩', 4, { ward: 4, shield: 0.3, guard: [0.3, 2] }); // 🛠️ ★4 인데 효과가 약해서 보강
// 속성 변환: 몇 턴 동안 내 펫이 그 속성으로 변해요 (같은 속성 스킬 보너스 + 방어 상성도 같이 바뀌어요)
const ATTUNE = {
  fire: ['불꽃 변신', '🔥', '온몸이 활활! 불의 기운을 두른다.'],
  water: ['물결 변신', '💧', '몸이 찰랑찰랑 물처럼 흘러요.'],
  grass: ['숲의 변신', '🌿', '덩굴과 잎사귀가 온몸을 감싸요.'],
  electric: ['번개 변신', '⚡', '털끝이 파직파직 곤두서요.'],
  ice: ['서리 변신', '❄️', '숨결이 하얗게 얼어붙어요.'],
  wind: ['바람 변신', '🌪️', '몸이 깃털처럼 가벼워져요.'],
  earth: ['대지 변신', '⛰️', '몸이 바위처럼 단단해져요.'],
  light: ['빛의 변신', '✨', '온몸이 눈부시게 반짝여요.'],
  dark: ['그림자 변신', '🌑', '그림자 속으로 스르륵 스며들어요.'],
  poison: ['독안개 변신', '☠️', '보라색 안개가 몸을 감싸요.'],
};
for (const [e, [name, emoji, flavor]] of Object.entries(ATTUNE)) add(`attune_${e}`, name, emoji, 2, { convert: [e, 3] }, { elem: e, flavor });
// 속성별 새 공격·보조 스킬
G('sunbeam', '햇살화살', '🌅', 1, { pow: 1.35, heal: 0.05 });
G('aurora', '오로라', '🌌', 3, { pow: 1.9, cleanse: true });
G('starfall', '별똥비', '🌠', 4, { pow: 1.0, hits: 3, pierce: 0.2 });
G('nightmare', '악몽', '😈', 2, { pow: 1.4, stun: 0.25 });
G('abyss_maw', '심연의 아가리', '🕳️', 4, { pow: 2.6, exec: 1.6, drain: 0.2 });
G('toxic_spore', '독포자', '🍄', 1, { pow: 1.1, dot: ['poison', 0.04, 3, 0.5] });
G('acid_rain', '산성비', '🌧️', 4, { pow: 1.5, hits: 2, defDown: [0.25, 3], dot: ['poison', 0.05, 3, 0.6] });
G('rockslide', '낙석', '🪨', 2, { pow: 0.6, hits: 3 });
G('tremor', '지진파', '📳', 4, { pow: 2.6, defDown: [0.2, 3] });
G('chain_lightning', '연쇄번개', '🔗', 4, { pow: 1.0, hits: 3, stun: 0.2 });
G('ice_wall', '얼음벽', '🧊', 2, { guard: [0.4, 2], defUp: [0.2, 2] });
G('tailwind', '순풍', '🍃', 2, { atkUp: [0.3, 3], evade: 1 });
G('purify_water', '정화수', '🫗', 3, { heal: 0.2, cleanse: true });
G('photosynth', '광합성', '🌱', 2, { heal: 0.15, regen: [0.05, 3] });
G('wildfire', '들불', '🔥', 4, { pow: 1.3, hits: 2, dot: ['burn', 0.06, 3, 0.8] });

// ───────── 🆕 3차 확장 (배치 3): 효과 이동 · 능력치 룰렛 · 쿨타임 · 부활 · 스킬 면역 · 대천사 ─────────
U('buff_thief', '버프 도둑', '🦹', 3, { buffXfer: ['steal', 3] }, '상대가 두른 좋은 기운을 슬쩍 가로채요. 한 번만!');
U('curse_dump', '저주 떠넘기기', '🎁', 3, { buffXfer: ['give', 3] }, '내가 맞은 나쁜 기운을 예쁘게 포장해서 상대에게 선물해요.');
U('fate_trade', '효과 맞교환', '🔁', 4, { buffXfer: ['swap', 3] }, '좋은 건 내 거, 나쁜 건 네 거!'); // 🛠️ 이름 변경 (★5 '운명 교환'과 이름이 같았어요)
U('stat_shake', '능력치 뒤섞기', '🎰', 2, { statRoll: ['swap', 'self', 3] }, '내 힘과 방어와 속도를 흔들어 두 개를 바꿔요.');
U('stat_roulette', '능력치 룰렛', '🎡', 3, { statRoll: ['random', 'self', 3] }, '돌아라 돌아라~ 어떤 능력치가 멈출까?');
U('foe_roulette', '상대 룰렛', '🌀', 3, { statRoll: ['random', 'foe', 3] }, '상대의 능력치 판을 빙글빙글 흔들어요.');
U('chaos_swap', '혼돈의 맞바꿈', '🌪️', 4, { statRoll: ['swap', 'foe', 3] }, '상대의 힘과 방어와 속도가 뒤죽박죽!');
U('time_rewind', '시간 되감기', '⏪', 3, { cdReset: 99, mana: 10 }, '시계를 거꾸로 돌려 모든 스킬을 다시 쓸 수 있게 해요.');
U('revival', '부활', '🪽', 5, { revive: [1, 3], reviveMaxUp: 0.7, cd: 8, elem: 'light' }, '3턴 동안, 쓰러져도 더 커진 몸으로 체력을 가득 채우고 다시 일어나요.');
U('skill_ward', '스킬 면역', '🧿', 4, { skillImmune: 2, cd: 4, elem: 'light' }, '어떤 스킬도 통하지 않는 투명한 막이 둘러싸요.');
U('void_veil', '무효의 장막', '🕳️', 5, { skillImmune: 3, cd: 6, elem: 'dark' }, '스킬이라는 스킬은 전부 허공으로 사라져요.');
U('archangel_bless', '대천사의 축복', '👼', 5, { archBless: [2, 0.3, 5], cd: 5, elem: 'light' }, '맞은 아픔을 두 배의 빛으로 돌려받고, 몸에 담지 못하고 넘친 빛은 다섯 배로 상대를 꿰뚫어요.');


// ───────── 🆕 4차 확장 (배치 4): 조커 · 금단의 저주 · 저주부여 · 악마와의 거래 ─────────
// (기존 일반 스킬 '저주'(curse)와 이름이 겹치지 않게 새 저주는 '금단의 저주'(forbidden_curse) 예요)
U('joker', '조커', '🃏', 5, { joker: true, cost: 50, elem: 'dark' }, '내 카드 한 장과 상대 카드 한 장을 슬쩍 바꿔치기! 상대 손에 조커가 들어가면… 큰일이에요.');
U('joker_dud', '조커 카드', '🃏', 1, { dud: true, cost: 0, hidden: true, elem: 'normal' }, '속임수에 걸려 바뀐 카드… 쓸 수 없어요.');
U('forbidden_curse', '금단의 저주', '🧿', 4, { curse: [2, 4], cost: 25, cd: 5, elem: 'dark' }, '나 자신에게 저주를 걸어요. 아프지만, 그 저주는 곧 누군가에게 돌아가요.');
U('curse_grant', '저주부여', '🪬', 4, { curseGrant: 3, cost: 20, elem: 'dark', hidden: true }, '내가 받은 저주를 세 배로 키워서 선물해요. (금단의 저주를 쓴 다음 턴에만 나타나요)');
U('devil_deal', '악마와의 거래', '😈', 5, { devilDeal: [2, 3], cost: 60, cd: 6, elem: 'dark' }, '"2턴 안에 끝내면 공짜, 못 끝내면… 준 만큼의 세 배를 받아가지."');

// ───────── 🆕 5차 확장 (배치 5 — 일부): 포획 전문가 · 전투 중 버프 ─────────
// 포획 전문가: 14턴(★5 는 15턴) 동안 도망을 막고 잡기 쉬워져요. 처음 붙잡을 때 제한 턴 +15.
U('catch_expert', '포획 전문가', '🪢', 4, { catchPro: [0.2, 15], cost: 35, cd: 8, elem: 'normal' }, '도망칠 틈은 없어요. 한 번 노린 사냥감은 놓치지 않아요.');
U('catch_master', '포획 대가', '🪢', 5, { catchPro: [0.2, 15], cost: 55, cd: 8, elem: 'normal' }, '전설의 사냥꾼. 하늘 끝까지 쫓아가서라도 붙잡아요.');
// 전투 중 버프 (이번 전투가 끝날 때까지 · 겹쳐 쓰면 쌓여요)
U('catch_aura', '포획의 기운', '🎯', 2, { fightBuff: { catch: 0.15 } }, '야생 펫이 왠지 순해져요. 볼이 더 잘 들어가요.');
U('calm_wild', '진정의 노래', '🕊️', 2, { fightBuff: { flee: 0.2 } }, '야생 펫이 이 자리를 떠나기 싫어져요.');
U('exp_spring', '경험의 샘', '⭐', 2, { fightBuff: { exp: 0.3 } }, '싸울수록 배움이 솟아나요.');
U('gold_touch', '황금 손', '💰', 2, { fightBuff: { gold: 0.4 } }, '손대는 곳마다 금화가 반짝여요.');
U('growth_bless', '성장의 축복', '🐾', 2, { fightBuff: { petExp: 0.3 } }, '펫이 이번 싸움에서 더 많이 자라요.');
U('treasure_sense', '보물 감각', '🎁', 3, { fightBuff: { equip: 0.5 } }, '떨어진 장비가 눈에 쏙 들어와요.');
U('hunter_blessing', '사냥꾼의 가호', '🏹', 4, { fightBuff: { catch: 0.2, flee: 0.2, exp: 0.3, gold: 0.3, petExp: 0.3, equip: 0.4 } }, '사냥에 도움이 되는 모든 행운이 한꺼번에.'); // 🛠️ ★2 한 장 효과의 합보다 약했어요 → 상향

// ───────── 🆕 6차 확장 (배치 6): 속성 전체 부여 · 누구게? · 영구 잠금 ─────────
// 속성 전체 부여: 공격 = 모든 속성으로 때려요(약점만 살고 반감 없음) / 방어 = 몸에 모든 속성이 깃들어요(받는 상성 전부 적용)
U('all_elem_strike', '만능 속성 공격', '🌈', 3, { allElem: ['attack', 3], cost: 30 }, '모든 속성을 한꺼번에 두르고 때려요. 약점은 정확히 찌르고, 반감은 사라져요.');
U('all_elem_body', '만물의 몸', '🪩', 3, { allElem: ['defend', 3], cost: 30 }, '온갖 속성이 몸에 깃들어요. 받는 속성 상성이 전부 한꺼번에 적용돼요.');
U('prism_avatar', '프리즘 화신', '🔆', 5, { allElem: ['both', 4], cost: 55, cd: 6, elem: 'light' }, '모든 속성의 화신이 돼요. 때릴 땐 약점만 남고, 맞을 땐 모든 상성이 적용돼요.');
// 누구게?: 상대의 공격이 확률로 상대 자신에게
U('who_is', '누구게?', '🎭', 3, { whoIs: [0.3, 3], cost: 35 }, '"어? 누구를 때린 거지?" 상대의 공격이 가끔 자기 자신에게 날아가요.'); // 🛠️ 40% → 30%
U('who_is_grand', '대혼란: 누구게?', '🎪', 5, { whoIs: [0.55, 3], cost: 55, cd: 7, elem: 'dark' }, '완전히 뒤죽박죽! 상대의 공격 절반 이상이 자기 자신에게 되돌아가요.'); // 🛠️ 70% → 55%, 쿨 6 → 7
// 영구 잠금: 이번 전투 동안 상대 스킬 전부 봉인 (조커 봉인은 3턴)
U('seal_brand', '봉인의 낙인', '🔏', 5, { lockSkills: true, cost: 60, cd: 10, elem: 'dark' }, '낙인이 찍힌 순간, 이번 싸움 내내 상대는 스킬을 쓸 수 없어요.');

// ───────── 전용기 (그 펫만 배울 수 있어요 · 같은 마나의 일반 스킬보다 세요) ─────────
// 스타팅
P('pyro_cat', 'sig_pyro_cat', '불꽃 발톱', '🐾', 2, { pow: 1.8, dot: ['burn', 0.05, 3, 0.5] }, '꼬리 끝 불꽃을 발톱에 모아 할퀴어요.');
P('aqua_pup', 'sig_aqua_pup', '물방울 방패', '🫧', 2, { shield: 0.3, heal: 0.12 }, '커다란 물방울이 몸을 감싸요.');
P('leaf_bun', 'sig_leaf_bun', '잎사귀 춤', '🍃', 2, { pow: 1.6, drain: 0.5 }, '잎사귀가 빙글빙글, 맞은 상대의 기운을 쏙 빨아와요.');
// 초원
P('slime', 'sig_slime', '말랑 폭탄', '🟢', 1, { pow: 1.5, stun: 0.25 }, '온몸을 부풀렸다가 퐁! 터뜨려요.');
P('slime', 'sig_slime2', '끈끈 방울', '🫧', 2, { atkDown: [0.25, 3], heal: 0.1 }, '끈끈한 방울이 몸에 달라붙어요.');
P('mouse', 'sig_mouse', '번개 달리기', '🐭', 1, { pow: 0.55, hits: 3 }, '눈 깜짝할 새 세 번 부딪혀요.');
P('bee', 'sig_bee', '필살 독침', '🐝', 2, { pow: 1.6, dot: ['poison', 0.05, 3, 0.7] }, '딱 한 번 쏘는 아주 아픈 침!');
P('rabbit', 'sig_rabbit', '달토끼 발차기', '🐰', 1, { pow: 0.7, hits: 2, crit: 0.25 }, '높이 뛰어올라 두 번 걷어차요.');
P('ladybug', 'sig_ladybug', '행운의 점박이', '🐞', 2, { defUp: [0.4, 3], regen: [0.06, 3] }, '등의 점이 반짝이면 행운이 따라와요.');
P('butterfly', 'sig_butterfly', '비늘가루 춤', '🦋', 2, { pow: 1.4, atkDown: [0.25, 3], stun: 0.25 }, '반짝이는 가루에 상대가 어질어질해져요.');
P('clover_fairy', 'sig_clover_fairy', '네잎의 축복', '🍀', 2, { heal: 0.3, atkUp: [0.3, 3], mana: 10 }, '네잎클로버가 행운과 기운을 나눠줘요.');
// 숲
P('owl', 'sig_owl', '밤눈 사냥', '🦉', 2, { pow: 1.9, crit: 0.35 }, '어둠 속에서도 약점을 정확히 찔러요.');
P('owl', 'sig_owl2', '침묵의 날갯짓', '🌙', 3, { evade: 2, stun: 0.2 }, '소리 없이 날아와 방심한 틈을 노려요.');
P('fox', 'sig_fox', '여우불 홀리기', '🦊', 3, { pow: 2.0, dot: ['burn', 0.05, 3, 0.6], stun: 0.2 }, '푸른 여우불이 길을 잃게 만들어요.');
P('treant', 'sig_treant', '뿌리 감옥', '🌳', 4, { pow: 1.8, spdDown: [0.4, 2], priority: 2, cd: 5 }, '땅속 뿌리가 솟아올라 꽁꽁 묶어요.');
P('treant', 'sig_treant2', '숲의 숨결', '🌲', 3, { heal: 0.35, regen: [0.06, 3] }, '오래된 숲이 상처를 감싸줘요.');
P('deer', 'sig_deer', '새벽 뿔치기', '🦌', 2, { pow: 1.8, pierce: 0.3 }, '새벽빛을 두른 뿔로 들이받아요.');
P('squirrel', 'sig_squirrel', '도토리 연발', '🐿️', 2, { pow: 0.5, hits: 4 }, '도토리를 네 개나 던져요!');
P('mushroom', 'sig_mushroom', '포자 폭발', '🍄', 3, { pow: 1.6, stun: 0.4, dot: ['poison', 0.06, 3, 0.7] }, '버섯 머리에서 포자가 퐁퐁!');
P('wolf', 'sig_wolf', '그림자 사냥', '🐺', 4, { pow: 1.2, mark: [3, 3, 0.06], cd: 5 }, '그림자 속에서 튀어나와 단숨에 물어요.');
P('wolf', 'sig_wolf2', '달빛 울음', '🌕', 3, { atkUp: [0.4, 3], drain: 0.2 }, '달을 보며 길게 울면 힘이 솟아요.');
P('boar', 'sig_boar', '멧돼지 돌진', '🐗', 2, { pow: 2.1, recoil: 0.06, stun: 0.25 }, '앞뒤 안 보고 쾅! 돌진해요.');
P('unicorn', 'sig_unicorn', '무지갯빛 뿔', '🦄', 4, { pow: 1.8, cleanseBoost: [0.35, 2], heal: 0.15, cd: 4 }, '뿔에서 번진 빛이 아픈 곳을 낫게 해줘요.');
P('unicorn', 'sig_unicorn2', '순결의 돌진', '🌈', 5, { pow: 2.6, pierce: 0.3, stun: 0.25, pureCharge: { step: 0.25, cap: 4, noneBreak: 2, def: 0.3 }, cd: 6 }, '무지개를 가르며 달려가요. 몸의 얼룩을 떨칠수록 더 세져요.');
// 동굴
P('bat', 'sig_bat', '초음파 비명', '🦇', 2, { pow: 1.5, stun: 0.4 }, '귀가 윙윙! 정신이 없어져요.');
P('golem', 'sig_golem', '바위 주먹', '🪨', 3, { pow: 2.4, stun: 0.3 }, '집채만 한 바위 주먹을 내리쳐요.');
P('golem', 'sig_golem2', '암석 갑옷', '⛰️', 3, { guard: [0.6, 3], defUp: [0.4, 3] }, '온몸에 바위를 둘러요.');
P('spider', 'sig_spider', '거미줄 포박', '🕷️', 2, { pow: 1.4, stun: 0.4, atkDown: [0.2, 3] }, '끈끈한 줄에 몸이 묶여요.');
P('scorpion', 'sig_scorpion', '왕전갈 꼬리침', '🦂', 3, { pow: 1.8, dot: ['poison', 0.05, 4, 0.8] }, '꼬리 끝 독침이 깊이 박혀요.');
P('crystal', 'sig_crystal', '수정 폭풍', '💎', 4, { pow: 0.85, hits: 3, weakElems: true, cd: 5 }, '수정 조각이 소나기처럼 쏟아져요.');
P('skeleton', 'sig_skeleton', '뼈다귀 난무', '💀', 2, { pow: 0.6, hits: 3, dot: ['bleed', 0.04, 3, 0.4] }, '뼈칼을 정신없이 휘둘러요.');
P('ghost', 'sig_ghost', '으스스 속삭임', '👻', 3, { atkDown: [0.4, 4], stun: 0.45 }, '귓가에 소름 돋는 속삭임이...');
P('ghost', 'sig_ghost2', '영혼 빨대', '🫥', 3, { pow: 1.7, drain: 0.6 }, '희미한 손이 기운을 빨아가요.');
// 바다
P('crab', 'sig_crab', '집게 가위', '🦀', 3, { pow: 2.2, defDown: [0.3, 3] }, '단단한 집게로 갑옷을 싹둑!');
P('shark', 'sig_shark', '심해 한입', '🦈', 4, { pow: 1.8, dot: ['bleed', 0.08, 3, 1], healCut: [0.5, 3], mana: 10, cd: 4 }, '피 냄새를 맡고 한입에 덥석!');
P('pufferfish', 'sig_pufferfish', '뾰족 폭발', '🐡', 2, { pow: 1.7, recoil: 0.05, dot: ['bleed', 0.04, 3, 0.5] }, '풍선처럼 부풀었다가 가시가 사방으로!');
P('octopus', 'sig_octopus', '먹물 연막', '🐙', 3, { evade: 2, atkDown: [0.3, 3], heal: 0.1 }, '새까만 먹물 속으로 쏙 숨어요.');
P('octopus', 'sig_octopus2', '빨판 조이기', '🌀', 3, { pow: 1.9, stun: 0.3, drain: 0.2 }, '여덟 개 다리로 꽁꽁 감아요.');
P('whale', 'sig_whale', '고래 노래', '🐋', 4, { heal: 0.45, healOverflow: 0.4, regen: [0.06, 3], mana: 15, cd: 4 }, '깊고 느린 노래가 바다를 울려요.');
P('whale', 'sig_whale2', '대양의 꼬리치기', '🌊', 5, { pow: 2.4, deep: 0.006, spdDown: [0.6, 2], manaSiphon: [0.5, 50, 0.5], cd: 6 }, '바다의 깊이만큼 묵직해요. 내 마나가 많이 남아 있을수록 꼬리치기가 세지고, 상대의 기운도 파도에 쓸려가요.');
P('turtle', 'sig_turtle', '등껍질 수비', '🐢', 3, { guard: [0.6, 3], regen: [0.07, 3] }, '등껍질 속에서 천천히 숨을 골라요.');
P('mermaid', 'sig_mermaid', '인어의 자장가', '🧜', 4, { drowsy: 2, drainMana: 20, heal: 0.15, cd: 4 }, '달콤한 노랫소리에 스르르 잠이 와요.');
P('turtle', 'sig_turtle2', '거북 박치기', '🐢', 2, { pow: 1.6, defUp: [0.3, 2] }, '느리지만 묵직하게 들이받아요.');
// 화산
P('baby_dragon', 'sig_baby_dragon', '아기 불꽃숨', '🐲', 4, { pow: 0.9, hitsRange: [1, 4], dot: ['burn', 0.06, 3, 1], needHit: true, mana: 10, cd: 4 }, '아직 서툴지만 불꽃은 진짜예요!');
P('phoenix', 'sig_phoenix', '불사의 날갯짓', '🦅', 5, { pow: 2.8, heal: 0.4, cleanse: true, healCut: [1, 5], atkRegen: [0.7, 5], cd: 8 }, '불꽃 날개가 상처를 태워 새로 태어나요. 5턴 동안 상대는 회복할 수 없고, 나는 매 턴 공격력만큼 차올라요.');
P('phoenix', 'sig_phoenix2', '환생의 불길', '🔥', 4, { revive: [0.3, 2], reviveBlast: 1.5, cd: 6 }, '타오를수록 힘이 솟아요.');
P('magma_slime', 'sig_magma_slime', '용암 튀기기', '🟠', 3, { pow: 1.7, dot: ['burn', 0.06, 3, 0.8] }, '뜨거운 용암이 철퍽!');
P('salamander', 'sig_salamander', '불꽃 꼬리채찍', '🦎', 3, { pow: 1.2, hits: 2, dot: ['burn', 0.04, 3, 0.5] }, '꼬리를 두 번 휘둘러요.');
P('flame_lord', 'sig_flame_lord', '화염 군림', '👹', 5, { pow: 2.2, dot: ['burn', 0.03, 2, 1], reign: { turns: 3, max: 3, pct: 0.02, fire: 0.2 }, cd: 6 }, '불꽃의 왕이 내려보면 움직일 때마다 타올라요.');
P('flame_lord', 'sig_flame_lord2', '마왕의 포효', '😈', 4, { pow: 2.0, rage: [0.15, 0.9], stun: 0.3, cd: 4 }, '화산이 부르르 떨리는 포효!');
P('flame_lord', 'sig_flame_lord3', '낙인의 연쇄', '🔗', 5, { pow: 1.6, dot: ['burn', 0.05, 3, 1], brandChain: { hitPow: 0.5, cap: 5 }, cd: 5 }, '불로 지진 낙인은 조용히 쌓이다가, 어느 순간 한꺼번에 터져요.');
P('fire_dragon', 'sig_fire_dragon', '용왕의 업화', '🐉', 5, { pow: 2.8, pierce: 0.3, dot: ['burn', 0.08, 3, 1], dragonFlame: { burn: 0.15, trueMul: 1.5, low: 0.3, lowMult: 1.6, minHp: 0.25 }, cd: 7 }, '내 체력을 태워서라도 모든 것을 재로 만드는 용왕의 불꽃.');
P('fire_dragon', 'sig_fire_dragon2', '용의 위엄', '👑', 4, { atkUp: [0.6, 4], guard: [0.5, 3], reflect: [0.3, 3], cd: 5 }, '날개를 펴면 하늘이 붉게 물들어요.');
// 안개 늪
P('frog', 'sig_frog', '개굴 합창', '🐸', 2, { pow: 1.5, stun: 0.35 }, '개굴개굴! 시끄러워서 깜짝 놀라요.');
P('snake', 'sig_snake', '독니 일격', '🐍', 3, { pow: 1.8, dot: ['poison', 0.05, 4, 0.9] }, '송곳니에서 맹독이 퍼져요.');
P('croc', 'sig_croc', '죽음의 회전', '🐊', 3, { pow: 2.3, defDown: [0.25, 3], recoil: 0.04 }, '물고 빙글빙글! 놓치는 법이 없어요.');
P('wisp', 'sig_wisp', '길잃은 불빛', '🕯️', 4, { lamp: [0.05, 25, 3], cd: 4 }, '따라가다 보면 어느새 낭떠러지...');
P('witch', 'sig_witch', '늪 마녀의 저주', '🧙', 5, { atkDown: [0.3, 4], defDown: [0.3, 4], spdDown: [0.3, 4], powDown: [0.3, 4], dot: ['poison', 0.1, 3, 0.8], swampBloom: [2, 0.025], cd: 8 }, '늪은 한번 빠지면 점점 깊어져요. 상대에게 걸린 나쁜 효과가 전부 더 오래가고, 많이 걸릴수록 늪에서 독기가 피어올라요.');
P('witch', 'sig_witch2', '마녀의 영약', '🧪', 4, { potion: 2, cleanse: true, cd: 4 }, '정체불명 영약, 효과는 확실해요.');
// 불볕 사막
P('camel', 'sig_camel', '혹 저장고', '🐪', 2, { heal: 0.35, mana: 15 }, '혹에 저장해 둔 영양분으로 힘을 내요.');
P('cactus', 'sig_cactus', '가시 갑옷', '🌵', 3, { guard: [0.5, 3], shield: 0.25 }, '건드리면 따끔! 가시가 곤두서요.');
P('scarab', 'sig_scarab', '황금 광택', '🪲', 3, { defUp: [0.6, 3], pow: 2.0 }, '번쩍이는 껍질이 공격을 튕겨내요.');
P('lion', 'sig_lion', '사막의 왕 포효', '🦁', 4, { pow: 2.0, firstBonus: [1.5, 0.9, 10], cd: 4 }, '사막이 쩌렁쩌렁 울려요.');
P('mummy', 'sig_mummy', '파라오의 저주', '⚰️', 5, { pow: 1.8, pharaoh: { turns: 5, flip: 0.8, rot: 0.02, shield: 0.5 }, cd: 7 }, '붕대가 풀리며 오래된 저주가 퍼져요. 치유는 상처가 되어요.');
P('mummy', 'sig_mummy2', '붕대 감기', '🧻', 3, { shield: 0.3, heal: 0.25 }, '다친 곳을 꽁꽁 싸매요.');
P('mummy', 'sig_mummy3', '불멸의 저주', '🧟', 5, { undyingHex: [0.25, 0.2, 4], cd: 6 }, '오래된 저주는 시간이 지나도 풀리지 않아요. 직접 나서서 때려야만 풀려요.');
P('sandworm', 'sig_sandworm', '모래 삼키기', '🐛', 5, { pow: 3.2, exec: 1.7, stun: 0.25, swallow: [3, 0.3, 0.7], cd: 8 }, '땅속에서 솟구쳐 통째로 삼켜요. 내 스킬 하나까지 삼켜서 3턴 동안 매 턴 저절로 터뜨려요.');
// 얼음 설원
P('penguin', 'sig_penguin', '배치기 미끄럼', '🐧', 2, { pow: 1.9, stun: 0.25 }, '쭈우욱~ 미끄러져 쾅!');
P('bear', 'sig_bear', '흰곰 앞발치기', '🐻', 3, { pow: 2.4, crit: 0.2 }, '묵직한 앞발이 휙!');
P('yeti', 'sig_yeti', '설인의 눈덩이', '🦍', 4, { pow: 1.6, snowball: [1.0, 0.35, 2.4], cd: 3 }, '집채만 한 눈덩이를 굴려요.');
P('ice_spirit', 'sig_ice_spirit', '얼음 감옥', '🧊', 4, { pow: 2.0, defDown: [0.2, 3], speedRev: 3, cd: 5 }, '순식간에 꽁꽁 얼려요.');
P('frost_dragon', 'sig_frost_dragon', '서리 숨결', '❄️', 5, { pow: 3.2, dot: ['burn', 0.07, 3, 0.8], freeze: 3, cd: 8 }, '닿는 곳마다 얼음꽃이 피어요. 얼음에 갇힌 상대는 꼼짝 못 해요.');
P('frost_dragon', 'sig_frost_dragon2', '서리 비늘', '🛡️', 4, { shield: 0.4, shieldCounter: [1.8, 0.35, 3, 4], mana: 10, cd: 4 }, '얼음 비늘이 모든 공격을 튕겨요.');
P('ice_queen', 'sig_ice_queen', '영원한 겨울', '👸', 5, { winter: { turns: 5, mana: 10, spd: 0.08, max: 3, freeze: 2, immune: 3 }, cd: 8 }, '세상이 하얗게, 아주 조용해져요.');
P('ice_queen', 'sig_ice_queen2', '여왕의 칙령', '👑', 4, { shield: 0.4, mana: 30, reflectDebuff: 3, cd: 4 }, '"감히 내 앞에서."');
// 구름 하늘섬
P('cloud_sheep', 'sig_cloud_sheep', '구름 이불', '🐑', 2, { heal: 0.3, evade: 1 }, '포근한 구름이 감싸 안아요.');
P('parrot', 'sig_parrot', '따라쟁이 합창', '🦜', 3, { pow: 0.8, hits: 3, atkDown: [0.2, 3] }, '상대의 말을 따라 하며 약을 올려요.');
P('thunder_bird', 'sig_thunder_bird', '벼락 급강하', '⚡', 4, { evade: 1, dive: [3.0, 0.3, 0.35, 2], cd: 5 }, '하늘에서 벼락처럼 내리꽂아요.');
P('pegasus', 'sig_pegasus', '천마 질주', '🐴', 4, { pow: 1.35, hits: 3, hitPows: [1.0, 1.35, 1.7], crit: 0.2, cd: 4 }, '하늘을 가르며 세 번 스쳐 지나가요.');
P('wyvern', 'sig_wyvern', '와이번 꼬리독', '🦖', 5, { pow: 2.4, venom: { turns: 5, basic: 1, skill: 2, pop: 5, popMult: 1.5, per: 0.008, dotTurns: 4, healCut: [0.5, 3] }, cd: 5 }, '꼬리 끝 독침이 번쩍! 쌓이고 쌓인 독이 한꺼번에 터져요.');
P('wyvern', 'sig_wyvern2', '급강하 폭격', '☁️', 4, { pow: 2.2, dot: ['poison', 0.08, 3, 1], readBonus: 1.5, cd: 4 }, '구름을 뚫고 떨어지는 폭격!');
P('angel', 'sig_angel', '심판의 나팔', '👼', 5, { trumpet: { turns: 2, pow: 3.2, per: 0.35, cap: 1.0, guard: 0.5 }, cd: 7 }, '나팔 소리가 울리면 심판이 시작돼요. 그동안 지은 죄만큼.');
P('angel', 'sig_angel2', '천사의 치유', '😇', 5, { angelRefund: { turns: 3, rate: 0.4, cap: 0.5, shield: 0.2 }, cleanse: true, cd: 7 }, '날개 끝에서 따뜻한 빛이 내려와 아픔을 되돌려줘요.');
P('sun_god', 'sig_sun_god', '태양의 심판', '☀️', 5, { sunVerdict: { charge: 2, hp: 0.28, cap: 6, atk: 2.4, burn: [0.06, 3], guard: 0.3 }, cd: 9 }, '새하얀 햇빛을 모아 단 한 번에 내리쳐요.');
P('sun_god', 'sig_sun_god2', '일출의 가호', '🌅', 5, { sunrise: { turns: 5, step: 0.12, cap: 0.6, regen: 0.04, guard: 0.15, after: 3 }, cd: 9 }, '해가 떠오르면 힘이 솟아요. 하지만 영원하진 않아요.');
// 별빛 심연
P('shadow', 'sig_shadow', '그림자 삼키기', '👤', 3, { pow: 2.2, drain: 0.4 }, '발밑 그림자가 기운을 삼켜요.');
P('void_eye', 'sig_void_eye', '허공의 응시', '👁️', 4, { stun: 0.65, defDown: [0.35, 4], drainMana: 30, truePct: 0.06, cd: 4 }, '눈이 마주친 순간, 몸이 굳어요.');
P('star_whale', 'sig_star_whale', '별빛 파도', '🐳', 4, { pow: 2.4, shieldDrain: [0.5, 0.4], mana: 15, cd: 3 }, '반짝이는 파도가 아군은 안고 적은 밀어내요.');
P('comet', 'sig_comet', '혜성 충돌', '☄️', 5, { pow: 2.4, impact: [0.6, 1.5], recoil: 0.1, stun: 0.3 }, '속도가 곧 위력! 상대보다 빠를수록 충돌이 커지고, 느리면 불꽃이 꺼져요.');
P('comet', 'sig_comet2', '귀환 궤도', '🛰️', 5, { orbit: [1.1, 0.25, 0.2, 3], cd: 6 }, '한 번 궤도에 오르면, 잊고 있어도 때가 되면 또 떨어져요.');
P('void_dragon', 'sig_void_dragon', '공허의 숨결', '🌑', 5, { truePct: 0.35, drainMana: 9999, berserk: 2, cd: 7 }, '닿은 곳이 사라져요. 사라진 자리에서 광기가 깨어나요.');
P('void_dragon', 'sig_void_dragon2', '차원 비늘', '🕳️', 4, { transfer: [0.35, 3], evade: 2, cd: 5 }, '비늘 틈으로 공격이 사라져요.');
P('chaos_lord', 'sig_chaos_lord', '혼돈의 소용돌이', '😈', 5, { pow: 0.8, hits: 2, chaos: { count: 3, hp: 0.05 }, cd: 7 }, '무슨 일이 일어날지 아무도 몰라요. 최소한 하나는 내 편이에요.');
P('chaos_lord', 'sig_chaos_lord2', '군주의 오만', '👿', 5, { pride: [2, 5, 3, 2] }, '"모든 것이 내 뜻대로." 2턴 동안 상대의 방어·스피드·공격력은 의미가 없고, 그 뒤 5턴 동안 나를 향한 스킬은 되돌아가요.');
P('chaos_lord', 'sig_chaos_lord3', '운명 재현', '🎲', 5, { fateReplay: true, cost: 60, cd: 6 }, '운이 좋았던 그 순간을, 한 번 더. 이번 싸움에서 가장 행운이었던 장면을 그대로 되살려요.');
P('creator', 'sig_creator', '천지창조', '🌌', 5, { genesis: { turns: 3, convert: 5, manaUp: 30 }, cd: 99 }, '별이 태어나는 순간, 세상의 상성이 뒤집혀요.');
P('creator', 'sig_creator2', '태초의 숨결', '✨', 5, { rewind: { back: 3, cap: 0.7, cdTop: 3, immune: 2 }, cd: 99 }, '모든 것이 처음으로 돌아가요.');
// 트릭스터 극장
P('puppet', 'sig_puppet', '줄 끊기', '🪆', 3, { pow: 2.0, defDown: [0.2, 3] }, '보이지 않는 줄에 매달려 춤추듯 달려들어요.');
P('mask_actor', 'sig_mask_actor', '가면 바꿔쓰기', '🎭', 4, { maskSwap: 3, atkUp: [0.4, 3], evade: 1, mana: 10, cd: 4 }, '새 가면을 쓰면 새 사람이 돼요.');
P('clown', 'sig_clown', '깜짝 상자', '🤡', 4, { pow: 1.5, jackBox: true, mana: 10, cd: 3 }, '뚜껑을 열면… 으악!');
P('magician', 'sig_magician', '비둘기 마술', '🕊️', 5, { pow: 3.1, stun: 0.3, pigeon: [0.7, 0.8, 10, 1.5, 2], cd: 6 }, '모자 속에서 하얀 비둘기가 쏟아져 나와요. 한 마리는 대신 맞아 주고, 상대 마나를 쪼아 가요.');
P('magician', 'sig_magician2', '손재주 부리기', '🎩', 4, { stealMana: 30, atkDown: [0.2, 3], buffXfer: ['swap', 3], cd: 4 }, '어? 내 마나가 어디 갔지?');
P('ringmaster', 'sig_ringmaster', '불의 링 통과', '🎪', 5, { pow: 3.2, dot: ['burn', 0.08, 3, 1], stealSpd: ['def', 'atk', 0.7, 3], cd: 6 }, '활활 타는 링 사이로 돌진해요! 빠른 상대에겐 방패를, 느린 상대에겐 힘을 빼앗아요.');
P('ringmaster', 'sig_ringmaster2', '채찍 신호', '🪄', 4, { clone: [0.6, 0.78, 3], cloneBoom: 2.3, cd: 5 }, '짝! 소리에 모두가 한 몸처럼 움직여요.');
P('joker', 'sig_joker', '광대의 마지막 웃음', '🃏', 5, { lastLaugh: [10, 8] }, '맞은 만큼 무대가 커지고, 마지막에 웃는 자가 이기는 거예요. 한 번 웃고 나면 이 카드는 조커가 돼요.');
P('joker', 'sig_joker2', '속임수 패', '🂡', 5, { trickster: { boost: 1.2 }, cd: 99 }, '카드는 이미 바뀌어 있었어요. 상대의 마지막 수를 그대로 돌려주고, 가장 아끼던 카드를 빈 조커로 바꿔 놓아요.');

// ───────── 🪐 외계행성 제타-9 (Lv.100) 전용기 ─────────
// 📏 Lv.100 능력치로 "스킬 1번 쓰면 속성 없는 상대 체력이 몇 % 깎이나"를 재서 기존 전용기와 맞췄어요 (3턴 지속피해 포함)
//    ★3 제타 유충 ≈26% (줄 끊기 18 · 그림자 삼키기 22) / ★4 비행접시·촉수 ≈22~30% (깜짝 상자 24 · 별빛 파도 28) / ★5 그레이 ≈44% (비둘기 마술 42)
//    ★5 제노 여왕 ≈60% + 방깎·회복감소·독 터뜨리기 / ★5 성운 포식자 ≈57% + 흡혈·마나흡수·공격력 훔치기 / ★5 액괴 정아영 ≈85% + 체력 회복 · 점액막은 분신 포함 6턴 ≈51% (용왕의 업화 82 · 반동 -15%, 태양의 심판 97 · 2턴 충전)
P('zeta_larva', 'sig_zeta_larva', '산성 침', '🧪', 3, { pow: 1.8, dot: ['poison', 0.03, 3, 0.5] }, '꿈틀꿈틀 기어와서 따끔한 산성 침을 톡! 쏘아요.');
P('ufo_drone', 'sig_ufo_drone', '광선 납치', '🛸', 4, { pow: 1.8, stun: 0.4, drainMana: 20, cd: 3 }, '푸른 빛줄기가 내려오면 몸이 둥실… 기운까지 쏙 빨려 올라가요.');
P('tentacle', 'sig_tentacle', '촉수 휘감기', '🦑', 4, { pow: 2.2, spdDown: [0.3, 3], defDown: [0.2, 3], cd: 3 }, '끈적한 촉수가 다리를 칭칭! 움직임도 방어도 둔해져요.');
P('gray_alien', 'sig_gray_alien', '정신 지배 광선', '👽', 5, { pow: 2.4, drainMana: 25, mindCtl: [1, 3], cd: 6 }, '커다란 까만 눈이 번쩍! 상대가 다음에 쓰는 공격 스킬은 엉뚱하게 자기 자신을 향해요.');
P('gray_alien', 'sig_gray_alien2', '기억 조작', '🧠', 4, { pow: 1.4, stealMana: 25, atkDown: [0.3, 3], cd: 4 }, '어? 내가 뭘 하려고 했더라… 마나를 슬쩍 가져가요.');
P('gray_alien', 'sig_gray_alien3', '영혼 교환', '👽', 5, { soulSwap: 2, cd: 7 }, '몸이 바뀌면, 싸우는 방식도 바뀌어요.');
P('xeno_queen', 'sig_xeno_queen', '여왕의 산성 폭풍', '👾', 5, { pow: 2.4, dot: ['poison', 0.07, 3, 1], defDown: [0.3, 3], healCut: [0.5, 3], detonate: 1, cd: 7 }, '여왕이 포효하면 하늘에서 초록 산성비가 쏟아져요. 이미 스며든 독은 한꺼번에 터지고, 갑옷은 녹아내리고, 상처는 아물지 않아요.');
P('xeno_queen', 'sig_xeno_queen2', '알 부화', '🥚', 4, { pow: 0.8, dot: ['poison', 0.05, 4, 1], clone: [0.35, 0.7, 3], cloneBoom: 1.0, cd: 5 }, '톡, 톡! 알에서 독을 품은 새끼들이 쏟아져 나와 같이 싸워요. 마지막엔 펑!');
P('xeno_queen', 'sig_xeno_queen3', '불멸의 알', '🥚', 5, { dot: ['poison', 0.04, 5, 1], parasiteEgg: [0.22, 5], cd: 6 }, '가만히 두면 조용한 독이지만, 지우려 드는 순간 되레 터져버려요.');
P('star_devourer', 'sig_star_devourer', '성운 삼키기', '🌀', 5, { pow: 2.8, drain: 0.25, stun: 0.2, manaSiphon: [0.6, 60, 0.4], manaShield: 1.5, steal: ['atk', 0.3, 3], cd: 7 }, '별빛 구름을 통째로 꿀꺽! 삼킨 상대의 마나는 별빛 보호막이 돼요.');
P('star_devourer', 'sig_star_devourer2', '중력 붕괴', '🕳️', 4, { spdDown: [0.4, 3], defDown: [0.3, 3], powDown: [0.3, 3], drainMana: 30, cd: 4 }, '몸이 무겁게 짓눌려요. 발도, 방패도, 스킬의 힘도 가라앉아요.');
P('slime_ayoung', 'sig_ayoung', '외계 액괴 대폭주', '🫠', 5, { pow: 3.2, drain: 0.3, dot: ['poison', 0.08, 3, 1], steal: ['def', 0.4, 3], truePct: 0.05, healCut: [0.5, 3], cd: 9 }, '우주 끝에서 밀려온 보랏빛 액괴가 와르르! 닿는 순간 방어가 녹아내리고, 녹은 기운은 전부 아영의 힘이 돼요.');
P('slime_ayoung', 'sig_ayoung2', '분열 점액막', '🫧', 5, { shield: 0.25, regen: [0.05, 4], guard: [0.3, 3], cleanse: true, clone: [0.45, 0.9, 4], cloneBoom: 1.5, reflectDebuff: 3, cd: 9 }, '말랑한 몸이 둘로 셋으로 갈라졌다가 다시 합쳐져요. 나쁜 기운은 쏙 녹여 상대에게 되돌리고, 분열체는 마지막에 펑!');

// 🐷 황금 돼지 섬 (Lv.125) 전용기 — 보스는 황금 돼지 양승민
P('piglet', 'sig_piglet', '꿀꿀 박치기', '🐽', 3, { pow: 1.9, stun: 0.2 }, '작은 몸이지만 박치기는 진심이에요! 꽥!');
P('mud_boar', 'sig_mud_boar', '진흙 투척', '🐗', 4, { pow: 1.8, defDown: [0.25, 3], cd: 3 }, '철벅! 진흙을 끼얹어 미끌미끌하게 만들어요.');
P('golden_hog', 'sig_golden_hog', '황금 돌진', '🥇', 4, { pow: 2.2, pierce: 0.2, cd: 3 }, '반짝이는 엄니로 그대로 들이받아요. 광이 나서 눈이 부셔요!');
P('jewel_boar', 'sig_jewel_boar', '보석 가시', '💎', 5, { pow: 2.2, crit: 0.25, thorns: { n: 3, per: 0.03, turns: 4 }, cd: 5 }, '등의 보석 가시가 상대 몸에 박혀요. 가시 박힌 상대는 나를 때릴 때마다 스스로 다쳐요.');
P('jewel_boar', 'sig_jewel_boar2', '보석 광택', '✨', 4, { shield: 0.3, defUp: [0.3, 3] }, '몸의 보석이 빛나며 단단한 막을 둘러요.');
P('jewel_boar', 'sig_jewel_boar3', '결정 흡수', '💎', 5, { crystalVault: [3, 0.1], cd: 6 }, '맞을수록 세지는 역설. 디버프는 전부 결정 속으로.');
P('treasure_hog', 'sig_treasure_hog', '보물 눈사태', '💰', 5, { pow: 1.5, hits: 2, stun: 0.25, coinRain: 0.04, cd: 4 }, '쏟아진 금화는 주워 담아야죠! 맞힌 만큼 이번 전투 골드 보상이 쌓여요 (트레이너의 펫만).');
P('treasure_hog', 'sig_treasure_hog2', '보물 수호', '🛡️', 4, { shield: 0.35, regen: [0.06, 3], cd: 4 }, '보물 더미 속에 몸을 숨기고 천천히 회복해요.');
P('treasure_hog', 'sig_treasure_hog3', '보물 각성', '🎁', 5, { lootReserve: true, cost: 60, cd: 99 }, '이긴 뒤에 받을 첫 보상을 미리 찜해 둬요. 쌓아둔 보물이 두 배로 늘어나요.');
P('pig_general', 'sig_pig_general', '돈가 돌격', '⚔️', 5, { pow: 2.6, trample: [3, 0.2], recoil: 0.08, stun: 0.3, cd: 5 }, '장군의 돌진은 방어진부터 짓밟아요. 상대의 좋은 효과를 깨뜨릴수록 돌격이 세져요.');
P('pig_general', 'sig_pig_general2', '장군의 호령', '📯', 4, { atkUp: [0.5, 3], mana: 15 }, '우렁찬 꿀꿀 호령에 사기가 치솟아요.');
P('pig_general', 'sig_pig_general3', '결사의 불꽃', '🔥', 5, { burnPact: [0.08, 0.15], cd: 99 }, '한 번 불이 붙으면, 꺼질 때까지 멈추지 않아요.');
P('golden_pig_boss', 'sig_golden_pig_boss', '황금의 포효', '👑', 5, { pow: 2.8, pierce: 0.35, gapTrue: [0.35, 0.2, 0.03], cd: 8 }, '황금빛 포효가 체력의 격차를 그대로 꿰뚫어요. 상대가 나보다 튼튼할수록 방어 무시 피해가 커져요.');
P('golden_pig_boss', 'sig_golden_pig_boss2', '양승민의 재림', '🐷', 5, { healLost: 0.5, hitCap: [0.2, 4], cd: 8 }, '전설의 돼지가 다시 일어나요. 잃은 체력의 절반을 되찾고, 황금 갑옷이 한 방에 큰 피해를 막아줘요.');
P('golden_pig_boss', 'sig_golden_pig_boss3', '최후의 황금', '🏆', 5, { goldSave: true, cost: 70, cd: 99 }, '가장 빛나던 순간을 황금 속에 가둬 둬요. 쓰러지는 순간, 그때로 통째로 돌아가요.');

// 스킬 속성 배정 (여기에 없는 스킬은 무속성이에요 · 전용기는 펫 속성을 따라가요)
const ELEM_SKILLS = {
  fire: ['fire_spark', 'fireball', 'inferno', 'ember_jab', 'flame_wheel', 'sear', 'blazing_kick', 'magma_burst', 'ember_curse', 'ember_brand', 'scorch', 'hot_potato', 'time_bomb', 'fireworks', 'wildfire', 'berserk'],
  water: ['water_gun', 'tidal_wave', 'tsunami', 'bubble_burst', 'tide_crash', 'geyser', 'whirlpool', 'dew_drop', 'rain_mend', 'spring_water', 'hot_spring', 'bubble_dome', 'coral_guard', 'mana_flood', 'purify_water', 'shell_hide'],
  grass: ['vine_whip', 'thorn_storm', 'thorn_lash', 'root_crush', 'spore_cloud', 'pollen_storm', 'moss_cure', 'regen_seed', 'oak_bark', 'nectar', 'photosynth', 'honey_heal', 'thick_fur'],
  electric: ['spark', 'thunder', 'thunderstorm', 'lightning_fang', 'static_field', 'thunder_hammer', 'ion_burst', 'chain_lightning', 'adrenaline'],
  ice: ['frost_touch', 'ice_shard', 'blizzard', 'ice_fang', 'frozen_spike', 'hail_storm', 'glacier_crush', 'ice_armor', 'frostbite', 'ice_wall'],
  wind: ['gust', 'wind_blade', 'tornado', 'gale_slash', 'cyclone', 'feather_dart', 'talon_dive', 'gale_wing', 'feather_veil', 'tickle', 'tailwind', 'echo_burst', 'dodge_stance', 'echo_chamber'],
  earth: ['pebble', 'earthquake', 'meteor_fall', 'boulder_toss', 'stone_fist', 'quake_stomp', 'sand_blast', 'dune_crush', 'stone_skin', 'mud_wall', 'sand_cloak', 'shard_storm', 'rockslide', 'tremor', 'piggy_bank', 'bone_plate', 'iron_wall', 'harden'],
  light: ['flash', 'holy_ray', 'judgement', 'solar_beam', 'healing_light', 'sanctuary', 'phoenix_tears', 'blessing', 'sun_blessing', 'prism_ray', 'lunar_rest', 'fairy_dust', 'sunshade', 'sunbeam', 'aurora', 'starfall', 'confetti', 'dance_battle', 'mana_nova', 'crystal_shield', 'adamant', 'prism_crash', 'prism_barrier', 'elem_ward'],
  dark: ['shadow_claw', 'shadow_bite', 'dark_pulse', 'night_slash', 'soul_strike', 'eclipse_ray', 'void_collapse', 'void_shot', 'spirit_siphon', 'soul_feast', 'shadow_step', 'curse', 'terror_gaze', 'vampire_bite', 'life_drain', 'blood_pact', 'nightmare', 'abyss_maw', 'mana_thief', 'ghost_prank', 'mana_vampire', 'last_gasp', 'fate_swap', 'doomsday_clock', 'devil_dice', 'all_in_gamble', 'mana_burn', 'intimidate'],
  poison: ['poison_sting', 'toxic_fog', 'plague', 'acid_spit', 'hex_bolt', 'toxic_mist', 'venom_fang', 'soul_curse', 'corrode', 'toxic_spore', 'acid_rain', 'chain_reaction', 'pufferburst'],
};
for (const [e, ids] of Object.entries(ELEM_SKILLS)) {
  for (const id of ids) {
    if (SKILLS[id]) SKILLS[id].elem = e;
    else console.warn(`[skill.js] 속성 배정: 없는 스킬이에요 → ${id}`);
  }
}
for (const sk of Object.values(SKILLS)) sk.elem ??= 'normal';

// ───────── 설명 글자 (효과 칸으로 자동 만들어요 → 관리자에서 효과를 바꿔도 설명이 같이 바뀌어요) ─────────
const P100 = (x) => `${Math.round(x * 100)}%`;
const DOT = { burn: '🔥 화상', poison: '☠️ 독', bleed: '🩸 출혈' };

// 효과를 한 줄씩 나눠서 돌려줘요 (확인창에서 자세히 보여줄 때 써요)
export function skillEffectLines(sk) {
  const t = [];
  if (sk.pow) {
    if (sk.hitsRange) t.push(`적을 **${sk.hitsRange[0]}~${sk.hitsRange[1]}번** 랜덤 연타 (1번에 공격력의 ${P100(sk.pow)})`);
    else if (sk.hitPows) t.push(`적을 **${sk.hitPows.length}번** 연타: ${sk.hitPows.map(P100).join(' → ')} (합계 ${P100(sk.hitPows.reduce((a, b) => a + b, 0))})`);
    else t.push(sk.hits > 1 ? `적을 **${sk.hits}번** 공격 (1번에 공격력의 ${P100(sk.pow)})` : `적에게 공격력의 **${P100(sk.pow)}** 데미지`);
  }
  if (sk.snowball) t.push(`⛄ 이번 전투에서 쓸 때마다 위력이 눈덩이처럼 커져요: ×${sk.snowball[0]} → ×${+(sk.snowball[0] + sk.snowball[1]).toFixed(2)} → ×${+(sk.snowball[0] + sk.snowball[1] * 2).toFixed(2)} … (최대 ×${sk.snowball[2]}, 전투가 끝날 때까지 유지)`);
  if (sk.cleanseBoost) t.push(`✨ 먼저 내 나쁜 효과를 정화하고, 지운 개수 1개당 위력 +${P100(sk.cleanseBoost[0])} (최대 ${sk.cleanseBoost[1]}개까지 · 화상·독·출혈은 종류별 1개)`);
  if (sk.rage) t.push(`😈 이번 전투에서 내가 **맞은 횟수** × ${P100(sk.rage[0])} 만큼 위력 추가 (최대 +${P100(sk.rage[1])})`);
  if (sk.weakElems) t.push('💎 타마다 상대의 **약점 속성** 중 무작위 하나로 공격 (약점이 없으면 무속성 · 반감과 같은 속성 보너스는 없어요)');
  if (sk.reviveBlast) t.push(`💥 부활하는 순간 상대에게 공격력의 **${P100(sk.reviveBlast)}** 폭발 피해(방어 적용) + 내 공격력↓·방어력↓ 정화`);
  if (sk.shieldCounter) t.push(`🛡️ ${sk.shieldCounter[3]}턴 안에 이 보호막이 **깨지는 순간** 상대에게 공격력의 ${P100(sk.shieldCounter[0])} 반격 + 상대 방어력 -${P100(sk.shieldCounter[1])} (${sk.shieldCounter[2]}턴) · 반격은 1회`);
  if (sk.mark) t.push(`🎯 상대에게 **사냥 표식** ${sk.mark[0]}턴: 표식 중 상대가 직접 피해를 맞을 때마다 스택 +1, ${sk.mark[1]}스택이 되면 최대 체력의 ${P100(sk.mark[2])} 고정 피해 (한 턴 최대 2번 · 지속 피해·고정 피해는 안 세요)`);
  if (sk.transfer) t.push(`🕳️ ${sk.transfer[1]}턴 동안 내가 받는 피해의 ${P100(sk.transfer[0])}를 **상대에게 전이** (나는 ${P100(1 - sk.transfer[0])}만 받고 상대는 방어 무시로 받아요)`);
  if (sk.dive) t.push(`🦅 날아올랐다가 이번 턴 포함 ${sk.dive[3]}번째 턴이 끝날 때 **낙하**: 공격력의 ${P100(sk.dive[0])} 피해 (상대 방어력 ${P100(sk.dive[1])} 무시, 기절 ${P100(sk.dive[2])}) · 낙하 전에 쓰러지면 취소`);
  if (sk.firstBonus) t.push(`🦁 내가 **먼저 움직이는 턴**이면 위력 ×${sk.firstBonus[0]} (+마나 ${sk.firstBonus[2]}), 늦게 움직이면 위력 ×${sk.firstBonus[1]} (스피드와 선공 스킬을 모두 반영한 실제 순서)`);
  if (sk.readBonus) t.push(`👁️ **읽기**: 상대가 직전에 회복·방어·버프를 썼으면 위력 ×${sk.readBonus} + 상대의 좋은 효과를 전부 지워요`);
  if (sk.overload) t.push(`쓰고 남은 마나를 전부 쏟아부어요 (남은 마나 1당 데미지 +${+(sk.overload * 100).toFixed(1)}%, 쓰고 나면 마나 0)`);
  if (sk.revenge) t.push(`내 체력이 낮을수록 데미지 증가 (체력이 바닥이면 최대 +${P100(sk.revenge)})`);
  if (sk.gamble) t.push(`${P100(sk.gamble[0])} 확률로 **대박** (데미지 ×${sk.gamble[1]}) · 실패하면 데미지 ×0.4 + 반동으로 내 최대 체력의 ${P100(sk.gamble[2])} 감소`);
  if (sk.pierce) t.push(`적 방어력 ${P100(sk.pierce)} 무시`);
  if (sk.crit) t.push(`급소 확률 +${P100(sk.crit)}`);
  if (sk.exec) t.push(`적 체력 30% 이하면 데미지 ×${sk.exec}`);
  if (sk.shieldDrain) t.push(`🔰 준 피해(실제로 체력에 들어간 양)의 ${P100(sk.shieldDrain[0])}를 내 보호막으로 (보호막은 최대 체력의 ${P100(sk.shieldDrain[1])}까지)`);
  if (sk.drain) t.push(`준 데미지의 ${P100(sk.drain)}만큼 내 체력 회복`);
  if (sk.recoil) t.push(`반동으로 내 최대 체력의 ${P100(sk.recoil)} 감소 (체력 1은 남아요)`);
  if (sk.heal) t.push(`내 최대 체력의 **${P100(sk.heal)}** 회복`);
  if (sk.healOverflow) t.push(`🔰 회복하고 **넘친 양은 보호막**으로 (보호막은 최대 체력의 ${P100(sk.healOverflow)}까지 · 체력이 가득 차 있어도 쓸모가 있어요)`);
  if (sk.atkRegen) t.push(`🔥 ${sk.atkRegen[1]}턴 동안 매 턴 내 공격력의 ${P100(sk.atkRegen[0])}만큼 회복`);
  if (sk.regen) t.push(`${sk.regen[1]}턴 동안 매 턴 최대 체력의 ${P100(sk.regen[0])} 회복`);
  if (sk.shield) t.push(`최대 체력의 ${P100(sk.shield)}만큼 보호막`);
  if (sk.guard) t.push(`${sk.guard[1]}턴 동안 받는 데미지 ${P100(sk.guard[0])} 감소`);
  if (sk.evade) t.push(`다음 공격 ${sk.evade}번 완전히 회피`);
  if (sk.atkUp) t.push(`${sk.atkUp[1]}턴 동안 내 공격력 +${P100(sk.atkUp[0])}`);
  if (sk.defUp) t.push(`${sk.defUp[1]}턴 동안 내 방어력 +${P100(sk.defUp[0])}`);
  if (sk.atkDown) t.push(`${sk.atkDown[1]}턴 동안 적 공격력 -${P100(sk.atkDown[0])}`);
  if (sk.defDown && sk.defDown[0] > 0) t.push(`${sk.defDown[1]}턴 동안 적 방어력 -${P100(sk.defDown[0])}`);
  if (sk.stun) t.push(`${P100(sk.stun)} 확률로 적 **기절** (1턴 행동 불가)`);
  if (sk.dot) t.push(`${sk.needHit ? '한 대라도 맞으면 ' : ''}${P100(sk.dot[3])} 확률로 ${DOT[sk.dot[0]] ?? sk.dot[0]} (${sk.dot[2]}턴, 매 턴 적 최대 체력의 ${P100(sk.dot[1])})`);
  if (sk.lamp) t.push(`🕯️ 적에게 **불빛**을 ${sk.lamp[2]}턴 달아요: 그동안 적이 스킬을 쓸 때마다 적 최대 체력의 ${P100(sk.lamp[0])} 고정 피해 + 적 마나 -${sk.lamp[1]} (스킬을 안 쓰면 아무 일도 없어요)`);
  if (sk.maskSwap) t.push(`🎭 ${sk.maskSwap}턴 동안 상대의 약점 속성 중 하나로 변신 (상대의 공격 속성이 내게 반감되는 쪽 우선 · 상대가 무속성이면 변신은 불발)`);
  if (sk.potion) t.push(`🧪 영약 6가지 중 서로 다른 ${sk.potion}개가 무작위로 터져요: 체력 45% 회복 / 공격 +60%(3턴) / 방어 +50%(3턴) / 적에게 독 8%(3턴) / 마나 +40 / 적 기절`);
  if (sk.spdDown) t.push(`🐌 ${sk.spdDown[1]}턴 동안 적 스피드 -${P100(sk.spdDown[0])}`);
  if (sk.speedRev) t.push(`🔁 ${sk.speedRev}턴 동안 **속도 역전**: 양쪽 모두 스피드가 낮은 쪽이 먼저 움직여요 (선공 스킬은 여전히 우선 · 빠른 펫이 쓰면 오히려 손해예요)`);
  if (sk.drowsy) t.push(`😴 적에게 **졸음**: ${sk.drowsy}번째 턴이 끝날 때 잠들어 다음 행동 1회 불가 (기절과 같아요) · 그 전에 내가 직접 피해를 주면 졸음이 깨져요 (이미 기절 중이면 불발)`);
  if (sk.cloneBoom) t.push(`🎆 분신이 쓰러지거나 끝나는 순간 **폭발**: 공격력의 ${P100(sk.cloneBoom)} 방어 무시 피해 (분신이 남아 있는 동안은 다시 못 써요)`);
  if (sk.jackBox) t.push('🎁 카드 1장이 같은 확률(25%)로 나와요: ♠폭죽(추가 공격력 150%) / ♥선물(체력 35% 회복) / ♦마나 도둑(상대 마나 40 훔치기) / ♣깜짝(상대 기절 확정)');
  if (sk.mana) t.push(`마나 +${sk.mana}`);
  if (sk.drainMana) t.push(sk.drainMana >= 999 ? '🔻 적 마나를 **전부** 없애요' : `적 마나 -${sk.drainMana}`);
  if (sk.bomb) t.push(`💣 적에게 **시한폭탄** 설치: 이번 턴 포함 ${sk.bomb[1]}번째 턴이 끝날 때 공격력의 ${P100(sk.bomb[0])} 피해 (방어 무시)`);
  if (sk.detonate) t.push(`적에게 걸린 화상·독·출혈을 터뜨려요: 남은 피해의 ×${sk.detonate} 를 한 번에 (방어 무시, 상태이상은 사라져요)`);
  if (sk.stealMana) t.push(`적 마나를 ${sk.stealMana}만큼 훔쳐서 내 마나로`);
  if (sk.swapHp) t.push('내 체력 비율이 더 낮으면 서로의 체력 비율을 맞바꿔요 (적은 최소 1은 남아요 · 내가 더 건강하면 아무 일도 안 일어나요)');
  if (sk.echo) t.push(`${sk.echo}턴 안에 쓰는 다음 공격 스킬이 한 번 더 울려요 (위력 75%, 마나 0)`);
  if (sk.weakBonus) t.push(`🎯 상대 속성이 **약점**이면 데미지 +${P100(sk.weakBonus)} 추가`);
  if (sk.ignoreResist) t.push('🔓 상대 속성이 "효과 별로"여도 반감 없이 정상 데미지');
  if (sk.convert) t.push(`🧬 ${sk.convert[1]}턴 동안 내 속성이 **${elemTag(sk.convert[0])}** 으로 변해요 (그 속성 스킬 보너스 · 방어 상성도 같이 바뀌어요)`);
  if (sk.ward) t.push(`🔮 ${sk.ward}턴 동안 속성 약점으로 맞아도 추가 피해를 안 받아요`);
  if (sk.steal) t.push(`🧲 적 ${{ atk: '공격력', def: '방어력', spd: '스피드' }[sk.steal[0]] ?? sk.steal[0]} ${P100(sk.steal[1])}를 훔쳐요 (${sk.steal[2]}턴)`);
  if (sk.stealSpd) { const L = { atk: '공격력', def: '방어력' }; t.push(`🎪 적이 나보다 **빠르면** ${L[sk.stealSpd[0]]}, **같거나 느리면** ${L[sk.stealSpd[1]]} ${P100(sk.stealSpd[2])}를 훔쳐요 (${sk.stealSpd[3]}턴)`); }
  // 🛠️ 아래 10줄은 예전에 설명이 비어 있어서 확인창에 "효과 없음"으로 뜨던 스킬들이에요
  if (sk.manaMaxUp) t.push(`🔷 ${sk.manaMaxUp[1]}턴 동안 최대 마나 +${sk.manaMaxUp[0]}`);
  if (sk.manaRegenUp) t.push(`🔋 ${sk.manaRegenUp[1]}턴 동안 기본 공격으로 차는 마나 +${sk.manaRegenUp[0]}`);
  if (sk.truePct) t.push(`🎯 방어 무시 고정 피해: 적 최대 체력의 ${P100(sk.truePct)}`);
  if (sk.mercy) t.push('🕊️ 이번 공격으로는 적 체력이 1% 밑으로 내려가지 않아요');
  if (sk.turnCut) t.push(`⏳ 적의 좋은 효과(공방업·보호태세·재생) 남은 턴 -${sk.turnCut}`);
  if (sk.burstAtk) t.push(`🔥 다음 ${Math.max(1, sk.burstAtk[1] - 1)}턴 동안 내 공격력 ×${sk.burstAtk[0]}`);
  if (sk.debuffToBuff) t.push('🔄 내 공격력↓·방어력↓·기절을 전부 좋은 효과로 바꿔요');
  if (sk.coinflip) t.push(`🎲 ${sk.coinflip}턴 동안 받는 피해가 50% 확률로 ×1.5, 50% 확률로 0`);
  if (sk.defToAtk) t.push(`⚔️ ${sk.defToAtk}턴 동안 방어력을 전부 공격력으로 (방어력은 0)`);
  if (sk.healCut) t.push(`🚑 ${sk.healCut[1]}턴 동안 적이 받는 회복 -${P100(sk.healCut[0])}`);
  if (sk.pigeon) t.push(`🕊️ **비둘기** 소환: 체력은 상대 최대 체력의 ${P100(sk.pigeon[0])} · 상대 스킬 피해의 ${P100(sk.pigeon[1])}를 대신 맞고 **도발**로 기본 공격은 전부(위력 ×${sk.pigeon[3]}) 대신 맞아요 · 매 턴 상대 마나 ${sk.pigeon[2]} 강탈 (이번 턴 남은 행동 + 다음 턴 · 쓰러지면 퇴장)`);
  if (sk.freeze) t.push(`🧊 적을 **얼려요** (최대 ${sk.freeze}턴): 얼어 있는 동안 적의 행동이 막히고 받는 피해 ×${FROZEN_CFG.dmgMult} · 적이 행동하려 할 때마다 ${P100(FROZEN_CFG.breakChance)} 확률로 얼음이 깨져요`);
  if (sk.berserk) t.push(`🔥 (적이 살아 있으면) ${sk.berserk}턴 동안 **광폭화**: 최대 체력의 ${P100(BERSERK_CFG.ignore)} 이하 피해는 무시 · 다음 기본 공격과 다음 공격 스킬의 위력 +${P100(BERSERK_CFG.bonus)} · 공격할 때마다 ${P100(BERSERK_CFG.hpChance)} 확률로 상대 체력이 ${BERSERK_CFG.hpTo}만 남아요`);
  if (sk.powDown) t.push(`🔻 ${sk.powDown[1]}턴 동안 적 스킬 위력 -${P100(sk.powDown[0])}`);
  if (sk.manaDown) t.push(`🔽 적의 현재 마나 -${P100(sk.manaDown[0])} · ${sk.manaDown[1]}턴 동안 최대 마나 -${P100(sk.manaDown[0])}`);
  if (sk.fear) t.push(`😱 이번 턴 맞은 피해의 ${P100(sk.fear)}를 내 공격력에 더해 반격 (안 맞았으면 상대 공격력의 30%×${sk.fear})`);
  if (sk.copy) t.push('🦜 상대가 마지막에 쓴 스킬을 복사해서 마나 0으로 즉시 사용 (없으면 마나 반환)');
  if (sk.priority) t.push(`⏱️ 다음 ${sk.priority}턴 동안 스피드와 상관없이 항상 먼저 행동`);
  if (sk.clone) t.push(`👥 ${sk.clone[2]}턴 동안 분신 소환: 공격력 ${P100(sk.clone[0])}로 같이 공격, 방어력 ${P100(sk.clone[1])} 기준 체력으로 받는 피해의 ${P100(CLONE_SHARE)}를 대신 맞아요`);
  if (sk.reflect) t.push(`🪞 ${sk.reflect[1]}턴 동안 받은 피해의 ${P100(sk.reflect[0])}를 상대에게 되돌려요`);
  if (sk.reflectDebuff) t.push(`🔮 ${sk.reflectDebuff}턴 동안 걸리는 디버프를 상대에게 그대로 반사`);
  if (sk.buffXfer) t.push(`🧲 ${sk.buffXfer[1]}턴 안에 **한 번** ${{ steal: '상대의 좋은 효과(공방업·보호태세·재생·보호막…)를 뺏어요', give: '내 나쁜 효과(약화·독·화상·기절…)를 상대에게 떠넘겨요', swap: '상대의 좋은 효과를 뺏고 내 나쁜 효과를 떠넘겨요' }[sk.buffXfer[0]] ?? '효과를 옮겨요'} (발동하면 사라져요)`);
  if (sk.statRoll) t.push(`🎰 ${sk.statRoll[2]}턴 동안 ${sk.statRoll[1] === 'foe' ? '상대' : '내'} 공격력·방어력·스피드를 ${sk.statRoll[0] === 'swap' ? '두 개 골라 **랜덤으로 맞바꿔요**' : '**랜덤 배수**로 바꿔요'} (등급 상한 ×${ROLL_CAP[sk.tier] ?? 1.5})`);
  if (sk.cdReset) t.push(sk.cdReset >= 99 ? '⏪ 내 모든 스킬의 쿨타임을 없애요' : `⏪ 내 모든 스킬의 쿨타임 -${sk.cdReset}턴`);
  if (sk.revive) t.push(`🪽 ${sk.revive[1]}턴 동안 쓰러지면 최대 체력의 ${P100(sk.revive[0])}로 **부활** (${sk.revive[2] ?? 1}회 · 턴이 지나면 사라져요)`);
  if (sk.lastLaugh) t.push(`🃏 이번 전투에서 **맞은 횟수 × ${sk.lastLaugh[0]}** 만큼 최대 마나가 늘고 마나가 가득 차요 → 마나가 되는 한 내 스킬을 **연속으로 최대 ${sk.lastLaugh[1]}번** 시전 (전투당 1회 · 쓰고 나면 이 칸은 조커로 바뀌어요)`);
  if (sk.pride) t.push(`👿 (전투당 1회) ${sk.pride[0]}턴 동안 상대의 **방어력·스피드·공격력을 무시**: 내 공격은 방어 관통 · 항상 선공 · 상대 공격은 최소 피해 → 사용 후 ${sk.pride[1]}턴 동안 상대가 내게 건 스킬을 최대 ${sk.pride[2]}개까지 **마나 0으로 ${sk.pride[3]}번씩** 상대에게 되돌려 시전`);
  if (sk.swallow) t.push(`🐛 내 공격 스킬 중 **위력이 가장 높은 것을 삼켜서**, 다음 턴부터 ${sk.swallow[0]}턴 동안 매 턴 마나·쿨타임 없이 **스킬이 아닌 공격**(스킬 면역 무시)으로 발동 · 삼킨 동안 쓰러지기 직전에 (전투당 1회) 최대 체력 +${P100(sk.swallow[1])}, 체력 ${P100(sk.swallow[2])}로 일어나요 (부활이 먼저)`);
  if (sk.reviveMaxUp) t.push(`⬆️ 부활하는 순간 이번 전투 동안 최대 체력 **+${P100(sk.reviveMaxUp)}** (늘어난 최대 체력 기준으로 채워요)`);
  if (sk.skillImmune) t.push(`🧿 ${sk.skillImmune}턴 동안 상대의 스킬 효과(피해·약화·지속피해·분신 공격…)를 전혀 안 받아요 (기본 공격은 맞아요)`);
  if (sk.archBless) t.push(`👼 받은 피해(이번 턴, 없으면 지난 턴)의 ${P100(sk.archBless[0])} 회복 + 회복량의 ${P100(sk.archBless[1])}를 상대에게 추가 피해 (방어 무시)${sk.archBless[2] > 1 ? ` · 체력이 가득 차 **넘친 회복량**은 ×${sk.archBless[2]}배 위력(${P100(sk.archBless[1] * sk.archBless[2])})으로!` : ''}`);
  if (sk.joker) t.push(`🃏 내 스킬 하나 ↔ 상대 스킬 하나를 **랜덤으로 맞교환** (이번 전투 동안만 · 전투당 1번) — 상대가 받는 카드가 이 **조커**면 상대 마나 전부 삭제 + 스킬 ${JOKER_CFG.sealTurns}턴 봉인`);
  if (sk.curse) t.push(`🧿 나 자신에게 랜덤 디버프 **${sk.curse[0]}개**를 ${sk.curse[1]}턴 동안 걸어요 (공격↓·방어↓·스피드↓·회복감소·화상·독·출혈 중) · 다음 턴부터 이 스킬이 **저주부여**로 바뀌어요`);
  if (sk.curseGrant) t.push(`🪬 저주로 받은 디버프를 **×${sk.curseGrant} 위력**으로 상대에게 부여해요 (쓰고 나면 다시 금단의 저주로 돌아와요)`);
  if (sk.devilDeal) t.push(`😈 ${sk.devilDeal[0]}턴 동안 내 모든 공격이 **확정 급소 + 약점 공격**! 단, ${sk.devilDeal[0]}턴 안에 상대를 쓰러뜨리지 못하면 그동안 준 피해의 **×${sk.devilDeal[1]}** 를 **무효화 불가 피해**로 나도 받아요 (부활·스킬 면역·쉴드·가드로 못 막고, 부활도 안 돼요)`);
  if (sk.catchPro) t.push(`🪢 ${catchProTurns(sk)}턴 동안 유효: 야생 펫이 도망치려 하면 **확정으로 붙잡아요** (처음 붙잡을 때 이번 전투 제한 턴 **+${sk.catchPro[1]}턴**) · 포획률 **+${P100(sk.catchPro[0])}p**`);
  if (sk.fightBuff) t.push(`📈 이번 전투가 끝날 때까지: ${fightBuffText(sk.fightBuff)} (겹쳐 쓰면 쌓이고 한도가 있어요)`);
  if (sk.allElem) {
    const [mode, turns] = sk.allElem;
    const all = ALL_ELEMS.map((e) => ELEMENTS[e].emoji).join('');
    if (mode !== 'defend') t.push(`🌈 ${turns}턴 동안 **모든 속성으로 공격**: 상대 속성의 약점은 그대로 찌르고 "효과 별로"는 사라져요 (모든 속성 스킬이 같은 속성 보너스도 받아요)`);
    if (mode !== 'attack') t.push(`🪩 ${turns}턴 동안 몸에 **모든 속성**(${all})이 깃들어요: 받는 공격의 속성 상성이 전부 곱해져서 적용돼요`);
    t.push(`⚖️ 전속성이 얽힌 상성 배율은 ×${ALL_ELEM_CFG.minMult} ~ ×${ALL_ELEM_CFG.maxMult} 안으로 맞춰져요`);
  }
  if (sk.whoIs) t.push(`🎭 ${sk.whoIs[1]}턴 동안 상대가 나를 때리는 공격(스킬 타격 · 기본 공격)이 ${P100(sk.whoIs[0])} 확률로 **상대 자신에게** 들어가요 (시한폭탄 · 고정 피해는 제외)`);
  if (sk.lockSkills) t.push('🔏 상대의 스킬을 **이번 전투 동안 영구 봉인**해요 (조커 봉인은 3턴, 이건 끝날 때까지)');
  if (sk.dud) t.push('🃏 쓸 수 없는 카드예요');
  if (sk.trickster) t.push(`🂡 상대가 마지막에 쓴 스킬을 **위력 ×${sk.trickster.boost}** 로 마나 0에 복제해 되돌려요 (전투당 1회 스킬은 복제 불가) · 상대 스킬 칸 중 **마나가 가장 큰 하나를 조커 카드로** 바꿔 이번 전투 동안 못 쓰게 해요 · 내 쿨타임 초기화 (전투당 1회 스킬 제외)`);
  if (sk.genesis) t.push(`🌌 내 속성을 상대 공격에 가장 강한 속성으로, 상대 속성을 내 공격에 가장 약한 속성으로 ${sk.genesis.convert}턴 바꿔요 · ${sk.genesis.turns}턴간 내 공격은 **약점 확정**, 상대 공격의 약점 보너스는 사라져요 · 최대 마나 +${sk.genesis.manaUp} (이번 전투 동안) · 마나 +${sk.genesis.manaUp}`);
  if (sk.rewind) t.push(`⏪ ${sk.rewind.back}턴 전의 체력·마나로 되돌려요 (지금이 더 좋으면 그대로 · 체력은 최대 체력의 ${P100(sk.rewind.cap)}까지만) · 쿨타임이 긴 스킬 ${sk.rewind.cdTop}개 초기화 · 나쁜 효과 전부 정화 · ${sk.rewind.immune}턴간 새 나쁜 효과 면역 · 다음 턴 선공`);
  if (sk.sunVerdict) { const c = sk.sunVerdict; t.push(`☀️ ${c.charge}번째 턴이 끝날 때 내리쳐요: **방어력 무시** · 상대 최대 체력의 ${P100(c.hp)} (상한: 내 공격력의 ${c.cap}배) + 공격력 ×${c.atk} (속성 상성 적용) · ${c.burn[1]}턴 화상 · 상대의 좋은 효과 전부 소멸 · 충전 중엔 받는 피해 -${P100(c.guard)}, 기절하지 않아요 (쓰러지면 취소)`); }
  if (sk.sunrise) { const c = sk.sunrise; t.push(`🌅 ${c.turns}턴간 매 턴 공격력 +${P100(c.step)}씩 쌓이고(최대 +${P100(c.cap)}) 매 턴 최대 체력의 ${P100(c.regen)} 회복 · 받는 피해 -${P100(c.guard)} · 끝나면 쌓인 공격력의 절반이 ${c.after}턴 더 남아요 · 쓰러지면 누적이 사라져요`); }
  if (sk.dragonFlame) { const c = sk.dragonFlame; t.push(`🔥 체력 ${P100(c.burn)}를 태워 그 ×${c.trueMul} 를 방어 무시 피해로 더해요 (체력 ${P100(c.minHp)} 이하면 못 써요) · 상대 체력이 ${P100(c.low)} 이하면 위력 ×${c.lowMult}`); }
  if (sk.winter) { const c = sk.winter; t.push(`❄️ ${c.turns}턴간 매 턴 상대에게 서리 +1 (내 공격이 맞아도 턴당 +1) · 상대 마나 -${c.mana} · 서리당 스피드 -${P100(c.spd)} · 마나가 가장 큰 스킬 하나의 쿨타임 +1 · 서리 ${c.max}스택이면 **동결**(최대 ${c.freeze}턴) 후 서리 초기화 · 이후 ${c.immune}턴간 동결 면역`); }
  if (sk.trumpet) { const c = sk.trumpet; t.push(`👼 ${c.turns}번째 턴이 끝날 때 심판: 위력 ${c.pow} · 그동안 상대가 쓴 스킬 1개당 피해 +${P100(c.per)} (최대 +${P100(c.cap)}) · 상대의 좋은 효과 전부 소멸 · 기다리는 동안 내가 받는 첫 피해 -${P100(c.guard)}`); }
  if (sk.angelRefund) { const c = sk.angelRefund; t.push(`😇 ${c.turns}턴간 받은 피해의 ${P100(c.rate)}를 돌려받아요 (총 최대 체력의 ${P100(c.cap)}까지) · 넘친 회복은 보호막 (최대 체력의 ${P100(c.shield)}까지) · 그동안 회복 감소 면역`); }
  if (sk.chaos) t.push(`😈 매 시전 무작위 효과 ${sk.chaos.count}개 (같은 효과 없음 · 좋은 효과 최소 1개 · 내게 불리한 효과 최대 1개) · 최대 체력의 ${P100(sk.chaos.hp)} 소모`);
  if (sk.pureCharge) { const c = sk.pureCharge; t.push(`🌈 내 나쁜 효과를 전부 정화하고 지운 개수당 위력 +${P100(c.step)} (최대 ${c.cap}개) · 지운 게 있으면 상대의 좋은 효과 1개 파괴, 없으면 ${c.noneBreak}개 파괴 · 시전 후 방어력 +${P100(c.def)} (1턴)`); }
  if (sk.manaSiphon) t.push(`🌊 상대 마나의 ${P100(sk.manaSiphon[0])}를 내 마나로 흡수 (최대 ${sk.manaSiphon[1]}) · 상대 마나가 0이면 대신 위력 +${P100(sk.manaSiphon[2])}`);
  if (sk.reign) { const c = sk.reign; t.push(`👹 ${c.turns}턴간 상대가 스킬을 쓸 때마다 화상 스택 +1 (최대 ${c.max}스택 · 스택당 최대 체력의 ${P100(c.pct)}) · 화상 걸린 상대에게 내 불 속성 스킬 피해 +${P100(c.fire)}`); }
  if (sk.pharaoh) { const c = sk.pharaoh; t.push(`⚰️ ${c.turns}턴간 상대 회복량의 ${P100(c.flip)}를 피해로 뒤집어요 · 상대 보호막은 매 턴 ${P100(c.shield)}씩 부식 · 회복하지 못한 턴이 끝날 때 상대 최대 체력의 ${P100(c.rot)} 저주 피해`); }
  if (sk.venom) { const c = sk.venom; t.push(`🦖 ${c.turns}턴간 내 공격마다 독 스택 (기본 공격 +${c.basic} · 스킬 +${c.skill}) · ${c.pop}스택이면 **맹독 폭발**: 쌓인 독이 앞으로 줄 피해의 ×${c.popMult} 를 한 번에 (방어 무시) + 회복 -${P100(c.healCut[0])} (${c.healCut[1]}턴)`); }
  if (sk.cd) t.push(sk.cd >= 90 ? '⏳ 전투당 1회' : `⏳ 쿨타임 ${sk.cd}턴`);
  if (sk.cleanse) t.push('내 상태이상(화상·독·출혈·약화) 제거');
  // 🆕 12차 확장 (완전 신규 매커니즘 1차 배치)
  if (sk.melt) t.push(`☀️ 맞힐 때마다 상대 **방어력이 녹아내려요**: 방어력 -${P100(sk.melt[0])}씩 쌓여요 (최대 -${P100(sk.melt[1])} · ${sk.melt[2]}턴 · 연속으로 쓸수록 상대가 무너져요)`);
  if (sk.feastAtk) t.push(`👻 쓸 때마다 **영혼이 쌓여 공격력 +${P100(sk.feastAtk[0])}** (최대 +${P100(sk.feastAtk[1])} · ${sk.feastAtk[2]}턴)`);
  if (sk.flashover) t.push('🌋 상대에게 **화상이 없으면 불씨를 깊게(×1.5 · +1턴) 심어요** → 다음에 쓰면 그 화상이 한꺼번에 폭발해요 (깔고 → 터뜨리는 콤보)');
  if (sk.wash) t.push('🌊 상대에게 **보호막이 없으면 파도가 발을 묶어요** (스피드 -40% 3턴 · 내 마나 +15)');
  if (sk.coldSnap) t.push('🌨️ 방어가 멀쩡한 상대는 **발이 묶여요** (스피드 -25% 3턴) → 방어가 깎인 상대엔 기절 확정');
  if (sk.eclipse) t.push('🌘 상대가 쓴 스킬이 없으면 **어둠이 상대 마나 25를 삼켜요**');
  if (sk.plagueScale) t.push('🦠 상대에게 나쁜 효과가 하나도 없으면 **상처가 곪아 회복 -30%** (3턴)');
  if (sk.cleanseHeal) t.push('🕊️ 정화할 나쁜 효과가 없으면 눈물이 **최대 체력 15% 보호막**이 돼요');
  if (sk.voidEat) t.push('🕳️ 삼킬 좋은 효과가 없으면 **상대 마나 30을 삼키고 위력 +10%**');
  if (sk.trample) t.push('⚔️ 짓밟을 좋은 효과가 없으면 **기세를 올려 방어력 +25%** (3턴)');
  if (sk.lens) t.push(`☀️ 상대 **방어력이 단단할수록 더 깊이 꿰뚫어요**: 관통 = 기본 + (상대 방어 ÷ 내 공격) × ${P100(sk.lens[0])} (최대 ${P100(sk.lens[1])})`);
  if (sk.coldSnap) t.push('🌨️ 이미 **방어력이 깎인 상대는 얼어붙어 기절 확정**');
  if (sk.iceArmor) t.push(`🏔️ 준 피해의 **${P100(sk.iceArmor)}**가 부서진 얼음 보호막으로 내게 돌아와요 (최대 체력의 30%까지)`);
  if (sk.shards) t.push(`🌠 **${sk.shards[1]}턴 뒤** 운석 파편이 한 번 더 떨어져요 (위력 ${P100(sk.shards[0])} · 전투가 끝나기 전까지)`);
  if (sk.eclipse) t.push(`🌘 상대가 **방금 쓴 스킬의 쿨타임 +${sk.eclipse}** (어둠으로 덮어 봉인)`);
  if (sk.allIn) t.push(`💥 내 **체력 비율만큼 위력 +${P100(sk.allIn[0])}까지** · 쓰고 나면 ${sk.allIn[2]}턴 동안 탈진(공격력 -${P100(sk.allIn[1])})`);
  if (sk.feastMax) t.push(`👻 흡수가 **최대 체력을 넘치면 넘친 양의 ${P100(sk.feastMax[0])}만큼 최대 체력이 늘어요** (전투 중 최대 +${P100(sk.feastMax[1])})`);
  if (sk.ironSkin) t.push(`💎 ${sk.ironSkin[1]}턴 동안 **최대 체력의 ${P100(sk.ironSkin[0])} 이하 피해는 완전히 튕겨내요**`);
  if (sk.flashover) t.push(`🌋 상대에게 걸린 **화상의 남은 피해 ${P100(sk.flashover)}를 지금 한꺼번에** 입히고 화상을 태워 없애요 (그 뒤 새 화상을 걸어요)`);
  if (sk.wash) t.push(`🌊 상대의 **보호막을 씻어내고**, 씻어낸 양의 ${P100(sk.wash)}만큼 방어 무시 피해를 추가로 줘요`);
  if (sk.shock) t.push(`⚡ 상대 **마나의 ${P100(sk.shock[0])}**만큼 방어 무시 감전 피해 (최대 체력의 ${P100(sk.shock[1])}까지) · 마나가 많은 상대일수록 아파요 · 상대 마나 -30%`);
  if (sk.voidEat) t.push(`🕳️ 상대의 **좋은 효과·분신·비둘기를 전부 삼켜요** · 삼킨 개수당 위력 +${P100(sk.voidEat)} (최대 5개)`);
  if (sk.plagueScale) t.push(`🦠 상대에게 걸린 **나쁜 효과 종류 1개당 독 피해 +${P100(sk.plagueScale)}**`);
  if (sk.cleanseHeal) t.push(`🕊️ 내게 걸린 **나쁜 효과 1종류당 추가 회복 +${P100(sk.cleanseHeal)}** (정화는 회복 뒤에)`);
  if (sk.swampBloom) t.push(`🧙 상대에게 걸린 나쁜 효과(약화·지속피해)의 지속시간이 전부 **+${sk.swampBloom[0]}턴**, 걸린 종류당 최대 체력의 ${P100(sk.swampBloom[1])} 방어 무시 피해`);
  if (sk.deep) t.push(`🌊 **남은 마나가 많을수록** 위력 증가 (마나 1당 +${P100(sk.deep)}, 최대 150까지)`);
  if (sk.manaShield) t.push(`🌀 빨아들인 상대 마나 × ${sk.manaShield} 만큼 **보호막** (최대 체력의 35%까지)`);
  if (sk.impact) t.push(`☄️ 위력이 **내 스피드 ÷ 상대 스피드** 비율로 변해요 (×${sk.impact[0]} ~ ×${sk.impact[1]}) · 빠를수록 세요`);
  if (sk.thorns) t.push(`🌵 상대 몸에 **가시 ${sk.thorns.n}개**를 박아요 · ${sk.thorns.turns}턴 동안 상대가 나를 때릴 때마다 최대 체력의 ${P100(sk.thorns.per)} **방어 무시 자해** (가시 1개 소모)`);
  if (sk.coinRain) t.push(`💰 맞힌 타마다 **이번 전투 골드 보상 +${P100(sk.coinRain)}** (트레이너의 펫만 · 한도 있음)`);
  if (sk.trample) t.push(`⚔️ 먼저 상대의 좋은 효과를 **최대 ${sk.trample[0]}개** 짓밟고, 깨뜨린 개수당 위력 +${P100(sk.trample[1])}`);
  if (sk.gapTrue) t.push(`👑 **체력 격차 × ${P100(sk.gapTrue[0])}** 만큼 방어 무시 피해 (최소 최대 체력의 ${P100(sk.gapTrue[2])} · 최대 ${P100(sk.gapTrue[1])}) — 상대 체력이 내 체력보다 많을수록 커져요`);
  if (sk.healLost) t.push(`🐷 **잃은 체력의 ${P100(sk.healLost)}**를 회복해요 (많이 다쳤을수록 많이 나아요)`);
  if (sk.hitCap) t.push(`👑 ${sk.hitCap[1]}턴 동안 **한 번에 받는 피해가 최대 체력의 ${P100(sk.hitCap[0])}를 넘지 못해요**`);
  if (sk.mindCtl) t.push(`👽 ${sk.mindCtl[1]}턴 안에 상대가 쓰는 **다음 공격 스킬 ${sk.mindCtl[0]}번**이 상대 자신을 향해요`);
  if (sk.crystalVault) t.push(`💎 ${sk.crystalVault[0]}턴 동안 나에게 들어오는 기절·약화·지속피해를 **저장**(적용 안 됨) · 끝나면 저장된 개수 × 상대 최대 체력의 ${P100(sk.crystalVault[1])} 방어 무시 피해로 되돌려요`);
  if (sk.orbit) t.push(`☄️ 이후 ${sk.orbit[3]}턴마다 **저절로 낙하**(전투가 끝날 때까지 반복): 공격력의 ${P100(sk.orbit[0])} 피해 (방어 ${P100(sk.orbit[1])} 무시, 기절 ${P100(sk.orbit[2])})`);
  if (sk.brandChain) t.push(`🔗 쌓인 **낙인 스택**만큼 지금 동시에 터뜨려요 (1스택당 공격력의 ${P100(sk.brandChain.hitPow)}, 최대 ${sk.brandChain.cap}연타) · 화상을 걸 때마다 스택 +1`);
  if (sk.undyingHex) t.push(`🧟 적 공격력 -${P100(sk.undyingHex[0])} · 방어력 -${P100(sk.undyingHex[1])} — 턴으로는 안 풀리고, 적이 나를 **${sk.undyingHex[2]}번** 때려야 풀려요`);
  if (sk.parasiteEgg) t.push(`🥚 적이 정화 효과를 쓰면 **즉시 부화**해 방어 무시로 최대 체력의 ${P100(sk.parasiteEgg[0])} 피해 (${sk.parasiteEgg[1]}턴 안에 안 터지면 사라져요)`);
  if (sk.lootReserve) t.push(`🎁 이번 전투에서 **다음에 얻는 보상 하나**(가장 먼저 들어오는 것: 승리하면 골드, 포획하면 경험치)가 **${LOOT_RESERVE_MULT}배**가 돼요 (전투 중에만 쓸 수 있어요 · 이기거나 잡아야 받아요)`);
  if (sk.goldSave) t.push(`🏆 시전 순간의 체력·마나·버프·디버프를 통째로 **저장**해 둬요 → 이번 전투에서 내가 쓰러지면 부활 대신 그 상태 그대로 **되돌아가요** (1회 · 체력은 최대 체력의 ${P100(GOLD_SAVE_CFG.minHp)} 아래로는 안 내려가요)`);
  if (sk.fateReplay) t.push(`🎲 이번 전투에서 나에게 일어난 **행운**(급소·대박·기절 성공·지속피해 성공·회피) 중 가장 값어치 큰 것 하나를 골라 **그대로 재현**해요 (피해는 상대 최대 체력의 ${P100(FATE_CFG.dmgCap)}까지 · 한 번 재현한 행운은 사라져요)`);
  // 🆕 12차 확장 (완전 신규 매커니즘 2차 배치)
  if (sk.burnPact) t.push(`🔥 **멈출 수 없는 도화선**: 매 턴 최대 체력의 ${P100(sk.burnPact[0])}씩 자해하는 대신, 매 턴 공격력이 ${P100(sk.burnPact[1])}씩 **복리로** 불어나요 (전투가 끝나거나 쓰러질 때까지 계속)`);
  if (sk.soulSwap) t.push(`👽 **신체 강탈**: ${sk.soulSwap}턴 동안 나와 상대의 공격력·방어력·스피드를 **완전히** 맞바꿔요 (서로의 스킬 위력도 바뀐 스탯 기준)`);
  return t;
}

export function describeSkill(sk) {
  return (sk.flavor ? `*${sk.flavor}*\n` : '') + `${elemTag(skillElement(sk))} 속성 · ` + (skillEffectLines(sk).join(' · ') || '효과 없음');
}

export const tierStars = (t) => '★'.repeat(Math.max(1, Math.min(5, t)));
export function skillCategory(sk) {
  if (sk.pet) return '전용기';
  if (sk.pow || sk.bomb || sk.detonate) return '공격';
  if (sk.atkUp || sk.defUp || sk.mana || sk.echo || sk.convert || sk.ward || sk.priority || sk.clone || sk.reflect || sk.reflectDebuff || sk.copy || sk.revive || sk.skillImmune || sk.cdReset || sk.devilDeal || sk.catchPro || sk.fightBuff || sk.allElem || sk.whoIs || sk.statRoll?.[1] === 'self' || sk.crystalVault || sk.ironSkin || sk.healLost || sk.hitCap || sk.orbit || sk.brandChain || sk.burnPact || sk.soulSwap || sk.lootReserve || sk.goldSave || sk.fateReplay) return '강화';
  if (sk.atkDown || sk.defDown || sk.stun || sk.dot || sk.drainMana || sk.stealMana || sk.swapHp || sk.steal || sk.buffXfer || sk.joker || sk.curse || sk.curseGrant || sk.lockSkills || sk.statRoll?.[1] === 'foe' || sk.undyingHex || sk.parasiteEgg) return '약화';
  return '회복·방어';
}

// ───────── 슬롯 · 배우기 ─────────
export const maxMana = (inst) => SKILL_CFG.manaMax + (inst?.manaBonus ?? 0);
export const SLOT_COUNT = 5; // 스킬 슬롯 개수
// 5번 슬롯은 상점 개방권으로 열어요 (저장 데이터 호환을 위해 표시 이름은 예전 그대로 inst.slot3 이에요)
export const slotsOpen = (inst) => [
  inst.level >= SKILL_CFG.slot1Level,
  inst.level >= SKILL_CFG.slot2Level,
  inst.level >= SKILL_CFG.slot3Level,
  inst.level >= SKILL_CFG.slot4Level,
  !!inst.slot3,
];
export const SLOT_HINT = () => [
  `Lv.${SKILL_CFG.slot1Level} 에 열려요`,
  `Lv.${SKILL_CFG.slot2Level} 에 열려요`,
  `Lv.${SKILL_CFG.slot3Level} 에 열려요`,
  `Lv.${SKILL_CFG.slot4Level} 에 열려요`,
  '상점의 🎫 스킬 슬롯 개방권으로 열어요',
];

// 예전 3칸 펫([Lv40, Lv100, 상점])을 새 5칸([Lv20, Lv40, Lv100, Lv200, 상점])으로 옮겨줘요 (이미 배운 스킬은 그대로 유지돼요)
export function normalizeSkills(inst) {
  if (!Array.isArray(inst.skills)) inst.skills = Array(SLOT_COUNT).fill(null);
  else if (inst.skills.length < SLOT_COUNT) {
    const old = inst.skills;
    inst.skills = old.length === 3
      ? [null, old[0] ?? null, old[1] ?? null, null, old[2] ?? null]
      : [...old, ...Array(SLOT_COUNT - old.length).fill(null)];
  }
  return inst.skills;
}

export function rollSkill(inst, rng = Math.random, exclude = [], gradeOrder = GRADE_TIER_BASE) {
  const all = Object.values(SKILLS).filter((s) => !exclude.includes(s.id) && !s.hidden); // hidden(저주부여 등)은 뽑기에 안 나와요
  // 1) 전용기 판정: 펫에게 (아직 안 배운) 전용기가 있을 때만 sigChance(1%) 로 나와요. 전용기가 2개면 반반이에요.
  const sig = all.filter((s) => s.pet === inst.petId);
  if (sig.length && rng() < SKILL_CFG.sigChance) return sig[Math.floor(rng() * sig.length)].id;
  // 2) 일반 스킬: 등급(★)을 먼저 뽑고(TIER_WEIGHT × 펫 등급 배율 GRADE_TIER_MULT), 그 등급 안에서는 모든 스킬이 똑같은 확률이에요.
  const pool = all.filter((s) => !s.pet);
  if (!pool.length) return null;
  const gMult = GRADE_TIER_MULT[gradeOrder] ?? GRADE_TIER_MULT[GRADE_TIER_BASE];
  const weightOf = (t) => (TIER_WEIGHT[t] ?? 0) * (gMult[t] ?? 1);
  const tiers = [...new Set(pool.map((s) => s.tier))].filter((t) => weightOf(t) > 0);
  if (!tiers.length) return pool[Math.floor(rng() * pool.length)].id;
  let r = rng() * tiers.reduce((n, t) => n + weightOf(t), 0);
  let tier = tiers[tiers.length - 1];
  for (const t of tiers) { r -= weightOf(t); if (r < 0) { tier = t; break; } }
  const same = pool.filter((s) => s.tier === tier);
  // 🌈 내 펫과 같은 속성의 스킬은 elemAffinity 배만큼 더 잘 나와요 (1 이면 모두 똑같은 확률)
  const aff = SKILL_CFG.elemAffinity ?? 1;
  if (aff !== 1 && inst.petId) {
    const mine = petElementsOf(inst.petId).filter((e) => e !== 'normal');
    const w = same.map((s) => (mine.includes(skillElement(s)) ? aff : 1));
    let r2 = rng() * w.reduce((n, x) => n + x, 0);
    for (let i = 0; i < same.length; i++) { r2 -= w[i]; if (r2 < 0) return same[i].id; }
    return same[same.length - 1].id;
  }
  return same[Math.floor(rng() * same.length)].id;
}

// 열려 있는데 비어 있는 슬롯에 랜덤 스킬을 채워요. 새로 생긴 [슬롯번호, 스킬id] 목록을 돌려줘요.
// gradeOrder: 펫 등급 단계(1=일반 ~ 7=초월). 안 넘기면 희귀(3) 기준으로 뽑아요.
export function grantSkills(inst, rng = Math.random, gradeOrder = GRADE_TIER_BASE) {
  normalizeSkills(inst);
  const got = [];
  slotsOpen(inst).forEach((open, i) => {
    if (open && !SKILLS[inst.skills[i]]) {
      const id = rollSkill(inst, rng, inst.skills.filter(Boolean), gradeOrder);
      if (id) { inst.skills[i] = id; got.push([i, id]); }
    }
  });
  return got;
}

// ───────── 전투 규칙 ─────────
// 전투에서 한쪽(나/야생)을 이렇게 표현해요: { name, emoji, hp, max, atk, def, st, mana, crit }
// st(상태): { dots:[{kind,pct,turns}], stun, atkUp, atkDown, defUp, defDown, guard, shield, evade, regen }
export const newSide = () => ({});
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export const effAtk = (X) => (X.atk + (X.st.defToAtk?.amt ?? 0)) * clamp(1 + (X.st.atkUp?.pct ?? 0) - (X.st.atkDown?.pct ?? 0) - (X.st.undyingHex?.atk ?? 0), 0.2, 4) * (X.st.burst?.mult ?? 1) * (X.st.statMod?.atk ?? 1) * (1 + (X.st.sunrise?.atk ?? X.st.sunset?.atk ?? 0)) * (X.st.prideNull ? 0 : 1) * (X.st.burnPact?.mult ?? 1); // 👿 군주의 오만에 무시당하면 공격력 0 · 🌅 일출의 가호 누적 · ⚰️ 불멸의 저주(undyingHex) · 🔥 결사의 불꽃(burnPact)
export const effDef = (X) => (X.st.defToAtk || X.st.prideNull ? 0 : X.def) * clamp(1 + (X.st.defUp?.pct ?? 0) - (X.st.defDown?.pct ?? 0) - (X.st.undyingHex?.def ?? 0), 0.2, 4) * (X.st.statMod?.def ?? 1);
export const effSpd = (X) => (X.spd ?? 0) * clamp(1 + (X.st.spdUp?.pct ?? 0) - (X.st.spdDown?.pct ?? 0) - (X.st.frost ? X.st.frost.n * X.st.frost.spd : 0), 0.2, 4) * (X.st.statMod?.spd ?? 1); // ❄️ 서리: 스택당 스피드 감소

// 내가 먼저 움직이는가? (priority 가 한쪽만 있으면 그쪽이 먼저, 둘 다/둘 다 없으면 스피드 비교, 같으면 내가 먼저)
export const prideAtk = (st, atk) => (st?.prideNull ? 0 : atk); // 👿 기본 공격용: 오만에 무시당한 쪽의 공격력은 0
export const prideDef = (st, def) => (st?.prideNull ? 0 : def); // 👿 기본 공격용: 오만에 무시당한 쪽의 방어력은 0
export function actsFirst(me, foe) {
  const mp = !!me.st.priority;
  const fp = !!foe.st.priority;
  if (mp !== fp) return mp;
  if (me.st.speedRev || foe.st.speedRev) return effSpd(me) <= effSpd(foe); // 🔁 속도 역전: 느린 쪽이 먼저
  return effSpd(me) >= effSpd(foe);
}

// 🎆 채찍 신호 분신 폭발: foe 에게 방어 무시 피해 (스킬 면역이면 막혀요)
function cloneBoomOn(owner, foe, n, log) {
  if (!foe || foe.hp <= 0 || n <= 0) return;
  if (foe.st?.skillImmune) { log.push(`　🧿 ${foe.name}은(는) 스킬 면역! ${owner.name}의 폭죽 폭발이 막혔어요`); return; }
  foe.hp = Math.max(0, foe.hp - n);
  log.push(`　🎆 ${owner.name}의 폭죽 분신이 **펑!** ${foe.name}에게 **${n}** 폭발 피해 (방어 무시)`);
}

// 피해를 받은 직후 호출해요: 이번 턴 받은 피해 누적(공포용) + 반사(보복) 처리
export function afterHit(X, Y, dmg, log, viaSkill = false) {
  // 🛡️ 서리 비늘: 보호막이 깨진 직후 반격 (mitigate 가 shieldBroke 표시를 달아줘요 · 피해가 전부 흡수돼 dmg 0 이어도 발동해요)
  if (X.st.shieldBroke) {
    delete X.st.shieldBroke;
    const c = X.st.shieldCounter;
    if (c && Y.hp > 0) {
      delete X.st.shieldCounter;
      if (Y.st?.skillImmune) log.push(`　🧿 ${Y.name}은(는) 스킬 면역! 서리 반격이 막혔어요`);
      else {
        const atk = effAtk(X);
        const base = Math.max(atk * 0.25, atk - effDef(Y) * 0.5) * c.pow * elemClash(c.elem ?? 'normal', Y, { attacker: X }).mult * (0.85 + Math.random() * 0.3);
        const hit = mitigate(Y, Math.max(1, Math.round(base)));
        Y.hp = Math.max(0, Y.hp - hit.dmg);
        Y.st.defDown = { pct: c.def, turns: c.dturns };
        log.push(`　❄️ ${X.name}의 보호막이 깨지며 **서리 반격**! ${Y.name}에게 **${hit.dmg}** 데미지${hit.note} · 방어력 -${P100(c.def)} (${c.dturns}턴)`);
      }
    }
  }
  // 🕳️ 차원 비늘: mitigate 가 모아둔 "전이된 피해"를 공격한 쪽에게 (방어 무시 · 사냥 표식 등에는 기록 안 돼요)
  const tf = X.st.transfer;
  if (tf?.pending > 0) {
    const n = tf.pending;
    tf.pending = 0;
    if (Y.hp > 0 && !Y.st?.skillImmune) {
      Y.hp = Math.max(0, Y.hp - n);
      log.push(`　🕳️ 피해의 일부가 차원을 건너 ${Y.name}에게 **${n}** 전이!`);
    } else if (Y.st?.skillImmune) log.push(`　🧿 ${Y.name}은(는) 스킬 면역! 전이된 피해가 막혔어요`);
  }
  if (X.st.pendingBoom) { // 🎆 분신이 쓰러지면서 모아둔 폭발 (방어 무시)
    const n = X.st.pendingBoom;
    delete X.st.pendingBoom;
    cloneBoomOn(X, Y, n, log);
  }
  if (dmg <= 0) return;
  const vn = Y.st?.venom; // 🦖 와이번 꼬리독: 내 공격이 맞을 때마다 독 스택 (스킬은 한 번 쓸 때 최대 skill 스택)
  if (vn && X.hp > 0 && !X.st?.skillImmune && !X.st?.debuffImmune) {
    let add = vn.basic;
    if (viaSkill) { add = Math.min(vn.skill, vn.budget ?? vn.skill); vn.budget = (vn.budget ?? vn.skill) - add; }
    if (add > 0) addVenom(Y, X, add, log);
  }
  const wn = X.st?.winter; // ❄️ 영원한 겨울: 내가 맞으면 서리 (턴당 한 번)
  if (wn && !wn.hitDone && X.hp > 0 && !X.st.skillImmune) { wn.hitDone = true; addFrost(X, 1, log); }
  const ar = X.st?.angelRefund; // 😇 천사의 치유: 받은 피해의 일부를 돌려받아요
  if (ar && ar.left > 0 && X.hp > 0) {
    const want = Math.min(ar.left, Math.max(1, Math.round(dmg * ar.rate)));
    ar.left -= want;
    const got = heal(X, want);
    log.push(`　😇 받은 피해의 ${P100(ar.rate)}가 되돌아와요! 체력 +${got}`);
    const over = Math.max(0, want - got);
    if (over > 0 && !X.st.pharaoh) { // 넘친 회복은 보호막으로
      const capAmt = Math.round(X.max * ar.shield);
      const before = X.st.shield ?? 0;
      const next = Math.max(before, Math.min(capAmt, before + over));
      if (next > before) { X.st.shield = next; log.push(`　🔰 넘친 회복이 보호막으로! +${next - before} (보호막 ${next}/${capAmt})`); }
    }
  }
  if (X.st.drowsy) { delete X.st.drowsy; log.push(`　💥 맞은 충격에 ${X.name}의 졸음이 깨졌어요!`); } // 😴 졸음은 직접 피해를 맞으면 깨져요
  const mk = X.st.huntMark; // 🎯 사냥 표식: 직접 피해를 맞을 때마다 스택 +1
  if (mk && X.hp > 0 && mk.bursts < 2) {
    mk.stack += 1;
    if (mk.stack >= mk.need) {
      mk.stack = 0;
      mk.bursts += 1;
      const n = Math.max(1, Math.round(X.max * mk.pct));
      X.hp = Math.max(0, X.hp - n);
      log.push(`　🎯 **사냥 표식 폭발!** ${X.name}에게 최대 체력의 ${P100(mk.pct)} **${n}** 고정 피해`);
    }
  }
  if (Y.st.thorns && Y.hp > 0 && dmg > 0 && !Y.st.skillImmune) { // 🌵 보석 가시: 가시 박힌 쪽이 때릴 때마다 스스로 다쳐요
    const th = Y.st.thorns;
    const n = Math.max(1, Math.round(Y.max * th.per));
    Y.hp = Math.max(0, Y.hp - n);
    th.n -= 1;
    log.push(`　🌵 ${Y.name}의 몸에 박힌 보석 가시가 파고들어요! **${n}** 방어 무시 피해 (남은 가시 ${Math.max(0, th.n)}개)`);
    if (th.n <= 0) delete Y.st.thorns;
  }
  if (Y.st.undyingHex) { // 🧟 불멸의 저주: Y가 X를 때릴 때마다(=시전자가 맞을 때마다) Y에게 걸린 저주가 옅어져요
    const u = Y.st.undyingHex;
    if (--u.hitsLeft <= 0) { delete Y.st.undyingHex; log.push(`　🧟 ${Y.name}에게 걸렸던 불멸의 저주가 드디어 풀렸어요!`); }
  }
  X.st.turnTaken = (X.st.turnTaken ?? 0) + dmg;
  X.st.hitCount = (X.st.hitCount ?? 0) + 1; // 😈 이번 전투에서 맞은 횟수 (마왕의 포효)
  if (Y.st?.devil) Y.st.devil.dealt += dmg; // 😈 악마의 거래: 내가 준 피해 누적
  const r = X.st.reflect;
  if (r && Y.hp > 0) {
    const back = Math.max(1, Math.round(dmg * r.pct));
    Y.hp = Math.max(0, Y.hp - back);
    log.push(`　🪞 ${X.name}의 반사! ${Y.name}에게 **${back}** 피해`);
  }
}

// 맞는 쪽의 회피 · 방어 · 보호막을 적용해요
// 🧊 동결 (서리 숨결): 얼어 있는 동안 행동이 막히고, 행동하려 할 때마다 확률로 얼음이 깨져요 · 받는 피해는 배수만큼 커져요
export const FROZEN_CFG = { breakChance: 0.35, dmgMult: 2 };
// 얼어 있는 쪽이 행동하려 할 때 불러요. true 면 이번 행동은 막혀요 (막은 뒤에 확률로 얼음이 깨져요)
export function frozenBlocks(st, name, log, rng = Math.random) {
  if (!st?.frozen) return false;
  if (rng() < FROZEN_CFG.breakChance) { delete st.frozen; log.push(`🧊 ${name}(이)가 얼음을 깨고 나왔어요! (이번 행동은 얼음을 깨느라 끝났어요)`); }
  else log.push(`🧊 ${name}(이)가 얼음 속에 갇혀서 움직이지 못했어요!`);
  return true;
}

// 🔥 광폭화 (공허의 숨결): 약한 피해 무시 · 다음 기본 공격과 다음 공격 스킬의 위력 보너스 · 공격할 때마다 낮은 확률로 상대 체력을 hpTo 로
export const BERSERK_CFG = { ignore: 0.3, bonus: 0.6, hpChance: 0.05, hpTo: 5 };
// 기본 공격/공격 스킬을 쓰기 직전에 불러요: 이번 행동에 곱할 배수를 돌려주고, 쓴 보너스는 소모해요 (kind: 'atk' | 'skill')
export function berserkMult(st, kind) {
  const bz = st?.berserk;
  const key = kind === 'atk' ? 'atkLeft' : 'skillLeft';
  if (!bz || !bz[key]) return 1;
  bz[key] = false;
  return 1 + BERSERK_CFG.bonus;
}
// 공격이 끝난 뒤에 불러요: 광폭화 중이면 확률로 상대 체력이 hpTo 만 남아요 (foe: { name, hp, st })
export function berserkFinish(st, foe, rng, log, viaSkill = false) {
  if (!st?.berserk || foe.hp <= BERSERK_CFG.hpTo) return;
  if (viaSkill && foe.st?.skillImmune) return;
  if (rng() < BERSERK_CFG.hpChance) { foe.hp = BERSERK_CFG.hpTo; log.push(`　🔥💀 광폭화의 일격! ${foe.name}의 체력이 **${BERSERK_CFG.hpTo}** 만 남았어요!`); }
}

export function mitigate(X, dmg, rng = Math.random, opts = {}) { // opts.basic: 기본 공격이면 true (비둘기의 도발이 달라져요)
  const st = X.st;
  if (st.evade > 0) { st.evade -= 1; recordLuck(st, 'evade', dmg); return { dmg: 0, note: ' (🌀 회피!)' }; }
  if (st.berserk && dmg > 0 && dmg <= st.berserk.cap) return { dmg: 0, note: ' (🔥 광폭화: 약한 피해 무시!)' }; // 한 번에 들어오는 피해가 한도(최대 체력의 30%) 이하면 통째로 무시
  let note = '';
  if (st.frozen && dmg > 0) { dmg = Math.round(dmg * FROZEN_CFG.dmgMult); note += ` (🧊 얼음: ×${FROZEN_CFG.dmgMult})`; } // 얼어 있으면 받는 피해가 커져요
  if (st.pigeon && st.pigeon.hp > 0 && dmg > 0) { // 🕊️ 비둘기: 스킬 피해는 일부를, 기본 공격은 전부(도발 · 위력 ×배수) 대신 맞아요
    const pg = st.pigeon;
    if (opts.basic) {
      const want = Math.round(dmg * pg.taunt);
      if (want <= pg.hp) { pg.hp -= want; dmg = 0; note += ` (🕊️ 비둘기가 도발에 걸려 ${want} 대신 맞음)`; }
      else { const used = Math.ceil(pg.hp / pg.taunt); note += ` (🕊️ 비둘기가 ${pg.hp} 대신 맞음)`; pg.hp = 0; dmg = Math.max(0, dmg - used); }
    } else {
      const take = Math.min(pg.hp, Math.round(dmg * pg.share));
      pg.hp -= take; dmg -= take; note += ` (🕊️ 비둘기가 ${take} 대신 맞음)`;
    }
    if (pg.hp <= 0) { delete st.pigeon; note += ' (🕊️ 비둘기 퇴장!)'; }
  }
  if (st.transfer && dmg > 0) { // 🕳️ 차원 비늘: 받는 피해의 일부를 상대에게 넘겨요 (afterHit 에서 상대에게 들어가요)
    const part = Math.min(dmg - 1, Math.round(dmg * st.transfer.pct));
    if (part > 0) { st.transfer.pending = (st.transfer.pending ?? 0) + part; dmg -= part; note += ` (🕳️ ${part} 전이)`; }
  }
  if (st.coinflip) {
    if (rng() < 0.5) { dmg = Math.round(dmg * 1.5); note += ' (🎲 모 아니면 도: 1.5배!)'; } // 🛠️ 2배 → 1.5배 (기댓값 ×0.75 가 되는 도박형 방어)
    else { recordLuck(st, 'evade', dmg); dmg = 0; note += ' (🎲 모 아니면 도: 0!)'; }
  }
  if (st.ironSkin && dmg > 0 && dmg <= Math.round(X.max * st.ironSkin.pct)) return { dmg: 0, note: ' (💎 금강불괴: 튕겨냈어요!)' }; // 약한 피해는 통째로 무효
  if (st.hitCap && dmg > 0) { // 👑 황금 갑옷: 한 번에 들어오는 피해에 상한
    const cap = Math.max(1, Math.round(X.max * st.hitCap.pct));
    if (dmg > cap) { note += ` (👑 황금 갑옷: ${dmg} → ${cap})`; dmg = cap; }
  }
  if (st.guard && dmg > 0) { dmg = Math.max(1, Math.round(dmg * (1 - st.guard.pct))); note += ' (🛡️ 방어)'; }
  if (st.sunCharge && dmg > 0) { dmg = Math.max(1, Math.round(dmg * (1 - st.sunCharge.guard))); note += ' (☀️ 충전 중 감쇄)'; }
  if (st.sunrise && dmg > 0) { dmg = Math.max(1, Math.round(dmg * (1 - st.sunrise.guard))); note += ' (🌅 가호)'; }
  if (st.trumpet?.firstGuard && dmg > 0) { dmg = Math.max(1, Math.round(dmg * (1 - st.trumpet.firstGuard))); delete st.trumpet.firstGuard; note += ' (👼 나팔의 보호)'; }
  if (st.clone?.hp > 0 && dmg > 0) {
    const take = Math.min(st.clone.hp, Math.round(dmg * CLONE_SHARE));
    st.clone.hp -= take; dmg -= take; note += ` (👥 분신이 ${take} 대신 맞음)`;
    if (st.clone.hp <= 0) { if (st.clone.boom) st.pendingBoom = (st.pendingBoom ?? 0) + st.clone.boom; delete st.clone; note += ' (분신 소멸!)'; }
  }
  if (st.shield > 0 && dmg > 0) {
    const ab = Math.min(st.shield, dmg);
    st.shield -= ab; dmg -= ab; note += ` (🔰 ${ab} 흡수)`;
    if (st.shield <= 0 && st.shieldCounter) st.shieldBroke = true; // 🛡️ 서리 비늘: 깨지는 순간 표시
  }
  return { dmg, note };
}

const heal = (X, n) => {
  if (X.st?.pharaoh && !X.st.skillImmune && n > 0) { // ⚰️ 파라오의 저주: 회복이 피해로 뒤집혀요
    const p = X.st.pharaoh;
    p.healed = true;
    const d = Math.max(1, Math.round(n * p.flip));
    X.hp = Math.max(0, X.hp - d);
    (X.st.logQ ??= []).push(`⚰️ ${X.name}의 회복이 저주로 뒤집혀 **${d}** 피해!`);
    return 0;
  }
  if (X.st?.healCut && !X.st.angelRefund) n *= 1 - X.st.healCut.pct; // 😇 천사의 치유 중엔 회복 감소 면역
  const real = Math.min(X.max - X.hp, Math.max(0, Math.round(n)));
  X.hp += real;
  return real;
};

// ───────── 🆕 배치 3 헬퍼 ─────────
// 스킬로 "적에게 가는" 효과 칸들 — 상대가 스킬 면역이면 castSkill 이 이 칸들을 지워요
const HOSTILE_KEYS = ['winter', 'pharaoh', 'reign', 'manaSiphon', 'dragonFlame', 'spdDown', 'drowsy', 'mark', 'lamp', 'pow', 'truePct', 'bomb', 'detonate', 'stealMana', 'steal', 'stealSpd', 'turnCut', 'healCut', 'atkDown', 'defDown', 'powDown', 'manaDown', 'stun', 'dot', 'drainMana', 'freeze', 'swapHp', 'buffXfer', 'joker', 'curseGrant', 'lockSkills', 'thorns', 'mindCtl', 'swampBloom', 'melt', 'eclipse', 'shards', 'voidEat', 'wash', 'shock', 'flashover', 'plagueScale'];
export const ROLL_CAP = { 1: 1.3, 2: 1.5, 3: 1.8, 4: 2.2, 5: 3 }; // 🎰 등급별 능력치 변동 상한 (배수)
const STAT_LABEL = { atk: '⚔️ 공격력', def: '🧱 방어력', spd: '👟 스피드' };
export const cdLeft = (st, id) => st?.cds?.[id] ?? 0; // ⏳ 남은 쿨타임 (0 이면 쓸 수 있어요)

// 🎰 능력치 룰렛: swap = 두 능력치를 랜덤으로 맞바꿔요 / random = 세 능력치에 랜덤 배수
function rollStats(sk, T, rng, log) {
  const [mode, who, turns] = sk.statRoll;
  const cap = ROLL_CAP[sk.tier] ?? 1.5;
  const mod = { atk: 1, def: 1, spd: 1, turns };
  const keys = ['atk', 'def', 'spd'];
  if (mode === 'swap') {
    const pool = keys.slice();
    const a = pool.splice(Math.floor(rng() * 3), 1)[0];
    const b = pool[Math.floor(rng() * 2)];
    const va = Math.max(1, T[a] ?? 1);
    const vb = Math.max(1, T[b] ?? 1);
    mod[a] = clamp(vb / va, 1 / cap, cap);
    mod[b] = clamp(va / vb, 1 / cap, cap);
    log.push(`　🔀 ${T.name}의 ${STAT_LABEL[a]} ↔ ${STAT_LABEL[b]} 맞바꿈! (×${mod[a].toFixed(2)} / ×${mod[b].toFixed(2)}, ${turns}턴)`);
  } else {
    const lo = who === 'foe' ? 1 / cap : 0.7; // 상대에게 쓰면 약해지는 쪽으로, 나에게 쓰면 도박(0.7 ~ 상한)
    const hi = who === 'foe' ? 1 : cap;
    for (const k of keys) mod[k] = lo + rng() * (hi - lo);
    log.push(`　🎡 ${T.name}의 능력치 룰렛! ⚔️×${mod.atk.toFixed(2)} 🧱×${mod.def.toFixed(2)} 👟×${mod.spd.toFixed(2)} (${turns}턴, 상한 ×${cap})`);
  }
  T.st.statMod = mod;
}

// 🧲 1회용 효과 이동: X(건 쪽) ↔ foe. 옮길 효과가 있으면 true (= 한 번 발동하고 사라져요)
const XFER_BUFFS = ['atkUp', 'defUp', 'spdUp', 'guard', 'regen', 'burst'];
const XFER_DEBUFFS = ['atkDown', 'defDown', 'spdDown', 'healCut'];
const moveKeys = (from, to, keys) => {
  let n = 0;
  for (const k of keys) {
    const v = from.st[k];
    if (!v) continue;
    const cur = to.st[k];
    to.st[k] = cur && v.pct != null && cur.pct != null ? { ...v, pct: cur.pct + v.pct, turns: Math.max(cur.turns, v.turns) } : { ...v };
    delete from.st[k];
    n++;
  }
  return n;
};
function applyXfer(X, foe, mode, log) {
  let n = 0;
  if (mode === 'steal' || mode === 'swap') {
    n += moveKeys(foe, X, XFER_BUFFS);
    if (foe.st.shield > 0) { X.st.shield = (X.st.shield ?? 0) + foe.st.shield; delete foe.st.shield; n++; }
    if (n) log.push(`　🧲 ${foe.name}의 좋은 효과를 ${X.name}(이)가 가로챘어요!`);
  }
  if (mode === 'give' || mode === 'swap') {
    let m = moveKeys(X, foe, XFER_DEBUFFS);
    if (X.st.dots?.length) {
      foe.st.dots = [...(foe.st.dots ?? []).filter((d) => !X.st.dots.some((o) => o.kind === d.kind)), ...X.st.dots];
      X.st.dots = [];
      m++;
    }
    if (X.st.stun) { foe.st.stun = 1; delete X.st.stun; m++; }
    if (m) log.push(`　🎁 ${X.name}의 나쁜 효과를 ${foe.name}에게 떠넘겼어요!`);
    n += m;
  }
  return n > 0;
}

// 🃏 조커 설정: 상대가 조커 카드를 받으면 마나 전부 삭제 + sealTurns 턴 동안 스킬 봉인 / forceGive true 면 조커 카드가 항상 상대에게 가요
export const JOKER_CFG = { sealTurns: 3, forceGive: false };

// 🪢 포획 전문가 · 📈 전투 중 버프 설정 (배치 5)
export const CATCH_PRO_CFG = { duration: 14, topTierDuration: 15 }; // 유효 턴 (최고등급 ★5 는 topTierDuration)
export const catchProTurns = (sk) => (sk.tier >= 5 ? CATCH_PRO_CFG.topTierDuration : CATCH_PRO_CFG.duration);
// 🛠️ 경험치·돈·펫경험치는 겹쳐 쓰면 +100% 까지 올라서 너무 셌어요 → +60% / 장비는 +80%
export const FIGHT_BUFF_CAP = { catch: 0.5, flee: 0.5, exp: 0.6, gold: 0.6, petExp: 0.6, equip: 0.8 }; // 겹쳐도 넘지 못하는 한도
export const FIGHT_BUFF_LABEL = { catch: '🎯 포획률', flee: '🕊️ 도망률', exp: '⭐ 경험치', gold: '💰 돈', petExp: '🐾 펫 경험치', equip: '🎁 장비 획득률' };
export const fightBuffOf = (st, key) => st?.fightBuff?.[key] ?? 0; // 전투 중 버프 값 (없으면 0)
// 전투 중 버프를 글자로: "🎯 포획률 +15% · 🕊️ 도망률 -20%" (keys 로 보여줄 항목만 고를 수 있어요)
export function fightBuffText(fb, keys = null) {
  return Object.entries(fb ?? {})
    .filter(([k, v]) => v > 0 && FIGHT_BUFF_LABEL[k] && (!keys || keys.includes(k)))
    .map(([k, v]) => `${FIGHT_BUFF_LABEL[k]} ${k === 'flee' ? '-' : '+'}${Math.round(v * 100)}%`)
    .join(' · ');
}
// 🪢 야생 펫이 도망치려 할 때 호출해요 (fight = ex.battle). 붙잡았으면 true.
// onlyFirst true 면 아직 한 번도 안 붙잡았을 때만 붙잡아요 (제한 턴 도망이 끝없이 이어지는 걸 막아요)
export function catchProHold(fight, log, { onlyFirst = false } = {}) {
  const cp = fight?.mySt?.catchPro;
  if (!cp) return false;
  if (cp.held && onlyFirst) return false;
  if (!cp.held) {
    cp.held = true;
    fight.extraRounds = (fight.extraRounds ?? 0) + cp.extra;
    log.push(`🪢 도망치려던 야생 펫을 **확정으로 붙잡았어요!** 이번 전투의 제한 턴이 **+${cp.extra}턴** 늘었어요!`);
  } else log.push('🪢 도망치려던 야생 펫을 다시 **붙잡았어요!**');
  return true;
}

// 🧿 저주: 자신에게 거는 디버프 후보 (pct = 1배 위력, dot = 지속피해)
const CURSE_POOL = [
  { k: 'atkDown', pct: 0.25 },
  { k: 'defDown', pct: 0.25 },
  { k: 'spdDown', pct: 0.25 },
  { k: 'healCut', pct: 0.4 },
  { k: 'burn', pct: 0.05, dot: true },
  { k: 'poison', pct: 0.05, dot: true },
  { k: 'bleed', pct: 0.05, dot: true },
];
const CURSE_LABEL = { atkDown: '🔻 공격력↓', defDown: '🔻 방어력↓', spdDown: '🐌 스피드↓', healCut: '🚑 회복감소', burn: '🔥 화상', poison: '☠️ 독', bleed: '🩸 출혈' };
const CURSE_CAP = 0.9; // 능력치 디버프 · 회복감소 최대 비율
const CURSE_DOT_CAP = 0.25; // 지속 피해 최대 비율 (매 턴 최대 체력의)
function putCurse(T, c, mult, turns) {
  if (c.dot) {
    T.st.dots = (T.st.dots ?? []).filter((d) => d.kind !== c.k);
    T.st.dots.push({ kind: c.k, pct: Math.min(CURSE_DOT_CAP, c.pct * mult), turns });
  } else T.st[c.k] = { pct: Math.min(CURSE_CAP, c.pct * mult), turns };
}
// 저주가 끝났는데 칸이 아직 저주부여로 남아 있으면 금단의 저주로 되돌려요 (바뀐 게 있으면 true)
export function revertCurseSlots(skills, st) {
  if (!Array.isArray(skills) || st?.cursed) return false;
  let changed = false;
  for (let i = 0; i < skills.length; i++) if (skills[i] === 'curse_grant') { skills[i] = 'forbidden_curse'; changed = true; }
  return changed;
}

// 🎁 보물 각성: 다음에 얻는 보상 하나를 배수로 (봇이 보상을 줄 때 맨 처음 들어오는 것에 takeLootReserve 를 곱해요)
export const LOOT_RESERVE_MULT = 2;
export function takeLootReserve(st) {
  if (!st?.lootReserve) return 1;
  delete st.lootReserve;
  return LOOT_RESERVE_MULT;
}

// 🏆 최후의 황금: 시전 순간을 저장해 두고, 쓰러지면 그때로 완전히 되돌아가요
export const GOLD_SAVE_CFG = { minHp: 0.25 }; // 되돌아갈 때 체력 최소 비율 (저장 때 체력이 너무 낮으면 바로 또 쓰러져서)
// 되감기에서 건드리지 않는 칸: 전투 진행 기록 + 바깥 능력치(최대마나·최대체력·몸 바꾸기)와 얽힌 칸
const GOLD_KEEP = ['cds', 'hist', 'hitCount', 'snowCount', 'fightBuff', 'catchPro', 'maxBonus', 'manaBonus', 'manaMaxUp', 'manaDown', 'soulSwap', 'swallowSaved', 'prideUsed', 'lastLaughUsed', 'brandStack', 'luck', 'last', 'act', 'goldSave', 'goldUsed', 'lootReserve'];
const jsonCopy = (v) => JSON.parse(JSON.stringify(v));
function snapGold(A) {
  const st = {};
  for (const [k, v] of Object.entries(A.st)) if (!GOLD_KEEP.includes(k) && typeof v !== 'function') st[k] = jsonCopy(v);
  return { hp: A.hp, mana: Math.round(A.mana), st };
}
function goldenRewind(X, log) {
  const g = X.st?.goldSave;
  if (!g || X.hp > 0) return false;
  delete X.st.goldSave;
  X.st.goldUsed = true;
  for (const k of Object.keys(X.st)) if (!GOLD_KEEP.includes(k)) delete X.st[k]; // 현재 상태 싹 지우고
  Object.assign(X.st, jsonCopy(g.st)); // 저장해 둔 상태(버프·디버프 전부)로
  X.hp = clamp(Math.max(g.hp, Math.round(X.max * GOLD_SAVE_CFG.minHp)), 1, X.max);
  X.mana = Math.min(g.mana, X.manaMax ?? g.mana);
  log.push(`🏆 ${X.name}의 몸이 황금빛으로 물들며 **저장해 둔 그 순간으로 되돌아갔어요**! 체력 ${X.hp}/${X.max} · 마나 ${Math.round(X.mana)} · 버프·디버프도 그때 그대로 (1회)`);
  return true;
}

// 🎲 운명 재현: 나에게 일어난 행운을 기록해 뒀다가 가장 값어치 큰 하나를 되살려요
export const FATE_CFG = { keep: 10, dmgCap: 0.35 }; // keep: 기억하는 행운 개수 · dmgCap: 재현 피해 상한(상대 최대 체력 비율)
export function recordLuck(st, kind, score, data = {}) { // kind: crit | jackpot | stun | dot | evade (봇의 기본 공격 급소도 이걸로 기록할 수 있어요)
  if (!st || !(score > 0)) return;
  const L = (st.luck ??= []);
  L.push({ kind, score: Math.round(score), ...data });
  if (L.length > FATE_CFG.keep) { L.sort((a, b) => b.score - a.score); L.length = FATE_CFG.keep; }
}
export function fatePick(st, foeImmune = false) {
  const L = (st?.luck ?? []).filter((e) => !foeImmune || e.kind === 'evade'); // 상대가 스킬 면역이면 내게 쓰는 행운(회피)만
  return L.length ? L.reduce((a, b) => (b.score > a.score ? b : a)) : null;
}
function castFate(A, B, rng, log) {
  const ev = fatePick(A.st, !!B.st.skillImmune);
  if (!ev) return;
  A.st.luck.splice(A.st.luck.indexOf(ev), 1); // 한 번 재현한 행운은 사라져요
  const label = { crit: '💥 급소', jackpot: '🎰 대박', stun: '💫 기절 성공', dot: '☠️ 지속피해 성공', evade: '🌀 회피' }[ev.kind] ?? '🍀 행운';
  log.push(`　🎲 이번 싸움 가장 운 좋았던 순간: **${label}** (값어치 ${ev.score}) — 그대로 재현해요!`);
  if (ev.kind === 'evade') { A.st.evade = (A.st.evade ?? 0) + 1; log.push('　🌀 그때처럼 다음 공격을 한 번 완전히 피해요!'); return; }
  if (B.hp <= 0) return;
  if (ev.kind === 'crit' || ev.kind === 'jackpot') {
    const n = Math.max(1, Math.min(ev.dmg ?? ev.score, Math.round(B.max * FATE_CFG.dmgCap)));
    const hit = mitigate(B, n, rng);
    B.hp = Math.max(0, B.hp - hit.dmg);
    log.push(`　${ev.kind === 'crit' ? '💥' : '🎰'} 그 순간이 다시 ${B.name}에게 꽂혀요! **${hit.dmg}** 데미지${hit.note}`);
    afterHit(B, A, hit.dmg, log, true);
  } else if (ev.kind === 'stun') {
    if (B.st.debuffImmune || B.st.sunCharge) log.push(`　🛡️ ${B.name}은(는) 기절하지 않는 상태라 막혔어요`);
    else { B.st.stun = 1; log.push(`　💫 ${B.name}(이)가 다시 **기절**했어요!`); }
  } else if (ev.kind === 'dot' && ev.dot) {
    if (B.st.debuffImmune) log.push(`　🛡️ ${B.name}은(는) 나쁜 효과에 면역이라 막혔어요`);
    else {
      B.st.dots = (B.st.dots ?? []).filter((d) => d.kind !== ev.dot[0]);
      B.st.dots.push({ kind: ev.dot[0], pct: ev.dot[1], turns: ev.dot[2] });
      log.push(`　${DOT[ev.dot[0]] ?? ev.dot[0]} ${B.name}에게 ${ev.dot[2]}턴 동안 다시!`);
    }
  }
}

// 🪽 부활: 쓰러졌고 부활 효과가 남아 있으면 되살려요 (남은 횟수가 0 이 되면 효과 사라짐)
// 🐛 모래 삼키기: 삼킨 동안 쓰러지기 직전에 전투당 1회 최대 체력이 늘고 체력 비율로 일어나요 (부활이 먼저 쓰이고, 부활이 없을 때 여기로 와요)
function sandLastStand(X, log) {
  const sw = X.st?.swallow;
  if (!sw || X.hp > 0 || X.st.swallowSaved) return false;
  X.st.swallowSaved = true;
  const gain = Math.max(1, Math.round(X.max * sw.maxUp));
  X.max += gain;
  X.st.maxBonus = (X.st.maxBonus ?? 0) + gain;
  X.hp = Math.max(1, Math.round(X.max * sw.hpPct));
  delete X.st.sunrise; delete X.st.sunset;
  X.st.dots = [];
  delete X.st.bomb;
  delete X.st.stun;
  delete X.st.frozen;
  log.push(`🐛 ${X.name}(이)가 쓰러지기 직전, 삼킨 힘으로 **다시 일어났어요**! 최대 체력 +${gain} · 체력 ${X.hp}/${X.max} (전투당 1회)`);
  return true;
}

export function tryRevive(X, log, foe = null) {
  const r = X.st?.revive;
  if (!r || X.hp > 0) return sandLastStand(X, log) || goldenRewind(X, log); // 부활 → 모래 삼키기 → 최후의 황금 순서
  const blast = r.blast;
  const blastElem = r.elem;
  let gain = 0;
  if (r.maxUp) { // ⬆️ 부활: 최대 체력이 먼저 늘고, 늘어난 최대 체력 기준으로 채워요 (늘어난 양은 st.maxBonus 에 적어서 다음 턴에도 이어져요)
    gain = Math.max(1, Math.round(X.max * r.maxUp));
    X.max += gain;
    X.st.maxBonus = (X.st.maxBonus ?? 0) + gain;
  }
  X.hp = Math.max(1, Math.round(X.max * r.pct));
  delete X.st.sunrise; delete X.st.sunset; // 🌅 쓰러지면 일출의 가호 누적이 사라져요
  X.st.dots = [];
  delete X.st.bomb;
  delete X.st.stun;
  delete X.st.frozen;
  if (--r.left <= 0) delete X.st.revive;
  log.push(`🪽 ${X.name}(이)가 **부활**했어요! 체력 ${X.hp}/${X.max}${gain ? ` (⬆️ 최대 체력 +${gain})` : ''}`);
  if (blast) { // 🔥 환생의 불길: 부활하는 순간 폭발 + 내 약화 정화
    delete X.st.atkDown; delete X.st.defDown;
    log.push('　✨ 환생의 불길이 나쁜 효과를 전부 태웠어요');
    if (foe && foe.hp > 0) {
      if (foe.st?.skillImmune) log.push(`　🧿 ${foe.name}은(는) 스킬 면역! 폭발이 막혔어요`);
      else {
        const atk = effAtk(X);
        const base = Math.max(atk * 0.25, atk - effDef(foe) * 0.5) * blast * elemClash(blastElem ?? 'normal', foe, { attacker: X }).mult;
        const hit = mitigate(foe, Math.max(1, Math.round(base)));
        foe.hp = Math.max(0, foe.hp - hit.dmg);
        log.push(`　💥 부활의 폭발! ${foe.name}에게 **${hit.dmg}** 데미지${hit.note}`);
        afterHit(foe, X, hit.dmg, log);
      }
    }
  }
  return true;
}

// ───────── 🆕 7차 개편: 초월 · 신화 · 전설 전용기 ─────────
// 전투당 1회 스킬은 cd 99 로 표시해요 (cd 90 이상 = 이번 전투에서 한 번 쓰면 끝). 쿨타임 초기화·복제에서도 제외돼요.
const FOE_BUFF_KEYS = ['atkUp', 'defUp', 'spdUp', 'guard', 'regen', 'burst', 'priority', 'reflect', 'coinflip', 'atkRegen']; // 상대 "좋은 효과" 칸들
const DEBUFF_KEYS = ['spdDown', 'drowsy', 'mark', 'lamp', 'bomb', 'healCut', 'atkDown', 'defDown', 'powDown', 'manaDown', 'stun', 'dot', 'freeze', 'drainMana', 'stealMana', 'steal', 'stealSpd', 'turnCut', 'buffXfer', 'swapHp', 'joker', 'curseGrant', 'lockSkills', 'winter', 'pharaoh', 'reign']; // 나쁜 효과 면역이 막는 스킬 효과
const PURGE_KEYS = ['atkDown', 'defDown', 'spdDown', 'healCut', 'powDown', 'stun', 'frozen', 'drowsy', 'lamp', 'huntMark', 'bomb', 'frost']; // 정화로 지워지는 상태
const isOnce = (s) => (s?.cd ?? 0) >= 90; // 🔒 전투당 1회 스킬
const keepOnce = (cds) => Object.fromEntries(Object.entries(cds ?? {}).filter(([, n]) => n >= 90)); // 쿨타임을 지워도 "사용함" 표시는 남겨요
const flushQ = (X, log) => { // 🪦 heal() 안에서 쌓아 둔 글(파라오의 저주로 뒤집힌 회복)을 한꺼번에 보여줘요
  if (X.st?.logQ?.length) { for (const m of X.st.logQ) log.push(`　${m}`); delete X.st.logQ; }
};
const pct1 = (x) => `${+(x * 100).toFixed(1)}%`;

// 내 나쁜 효과를 전부 지우고 지운 개수를 돌려줘요
const debuffCount = (st) => new Set((st.dots ?? []).map((d) => d.kind)).size + ['atkDown', 'defDown', 'spdDown', 'powDown', 'manaDown', 'healCut', 'stun', 'frozen'].filter((k) => st[k]).length; // 상대에게 걸린 나쁜 효과 종류 수
function purgeDebuffs(st) {
  let n = new Set((st.dots ?? []).map((d) => d.kind)).size;
  st.dots = [];
  for (const k of PURGE_KEYS) if (st[k]) { delete st[k]; n++; }
  if (st.sealed && !st.sealed.perm) { delete st.sealed; n++; }
  return n;
}
// 상대의 좋은 효과를 전부 지워요 (개수를 돌려줘요)
function clearBuffs(X) {
  let n = 0;
  for (const k of FOE_BUFF_KEYS) if (X.st[k]) { delete X.st[k]; n++; }
  if (X.st.shield > 0) { delete X.st.shield; n++; }
  if (X.st.evade > 0) { delete X.st.evade; n++; }
  return n;
}
// 상대의 좋은 효과를 count 개만 무작위로 깨뜨려요
function destroyBuffs(X, count, rng) {
  const have = FOE_BUFF_KEYS.filter((k) => X.st[k]);
  if (X.st.shield > 0) have.push('shield');
  if (X.st.evade > 0) have.push('evade');
  let n = 0;
  for (let i = 0; i < count && have.length; i++) { delete X.st[have.splice(Math.floor(rng() * have.length), 1)[0]]; n++; }
  return n;
}
// 속임수 패가 복제할 수 있는 상대의 마지막 스킬 (없으면 null)
const trickSrc = (B) => {
  const s = SKILLS[B.st?.last];
  return s && !s.copy && !s.joker && !s.trickster && !s.dud && !s.hidden && !isOnce(s) && !s.catchPro && !s.fightBuff && !s.curseGrant ? s : null;
};

// ❄️ 서리 쌓기 (영원한 겨울): 가득 차면 동결 → 서리 초기화 → 한동안 동결 면역
function addFrost(X, n, log) {
  const w = X.st.winter;
  if (!w || X.st.frostImmune || X.st.debuffImmune) return;
  X.st.frost = { n: (X.st.frost?.n ?? 0) + n, spd: w.spd };
  if (X.st.frost.n >= w.max) {
    X.st.frost.n = 0;
    X.st.frozen = { turns: w.freeze };
    X.st.frostImmune = { turns: w.immune + 1 };
    log.push(`　🧊 서리가 가득 찼어요! ${X.name}(이)가 **꽁꽁 얼어붙었어요**! (최대 ${w.freeze}턴 · 이후 ${w.immune}턴간 동결 면역)`);
  } else log.push(`　❄️ ${X.name}에게 서리 **${X.st.frost.n}/${w.max}** (스피드 -${P100(X.st.frost.n * w.spd)})`);
}

// 🦖 와이번 꼬리독: 독 스택 쌓기 → 가득 차면 맹독 폭발 (Y = 와이번, X = 맞은 쪽)
function addVenom(Y, X, n, log) {
  const v = Y.st.venom;
  X.st.venomN = (X.st.venomN ?? 0) + n;
  const dots = (X.st.dots ?? []).filter((d) => d.kind !== 'poison');
  const pct = v.per * Math.min(v.pop, X.st.venomN);
  if (X.st.venomN >= v.pop) {
    const future = Math.max(1, Math.round(X.max * pct)) * v.dotTurns; // 쌓인 독이 앞으로 줄 피해
    const boom = Math.max(1, Math.round(future * v.popMult));
    X.hp = Math.max(0, X.hp - boom);
    X.st.dots = dots;
    X.st.venomN = 0;
    X.st.healCut = { pct: v.healCut[0], turns: v.healCut[1] };
    log.push(`　☠️💥 **맹독 폭발!** 쌓인 독이 한꺼번에 터져서 ${X.name}에게 **${boom}** 피해 (방어 무시) · 회복 -${P100(v.healCut[0])} (${v.healCut[1]}턴)`);
  } else {
    dots.push({ kind: 'poison', pct, turns: v.dotTurns });
    X.st.dots = dots;
    log.push(`　🦖 독 스택 **${X.st.venomN}/${v.pop}** (☠️ 매 턴 최대 체력의 ${pct1(pct)} · ${v.dotTurns}턴)`);
  }
}

// ☀️ 태양의 심판: 충전이 끝나면 방어를 무시하고 내리쳐요 (X = 쓴 쪽, foe = 맞는 쪽)
function fireSun(X, foe, log) {
  const c = X.st.sunCharge;
  delete X.st.sunCharge;
  if (!foe || foe.hp <= 0) return;
  if (foe.st?.skillImmune) { log.push(`🧿 ${foe.name}은(는) 스킬 면역! ${X.name}의 태양의 심판이 막혔어요`); return; }
  const atk = effAtk(X);
  const cl = elemClash(c.elem ?? 'normal', foe, { attacker: X });
  const stab = c.elem && c.elem !== 'normal' && effElems(X).includes(c.elem) ? ELEM_CFG.stab : 1;
  const hpPart = Math.min(foe.max * c.hp, atk * c.cap); // 최대 체력 비례 피해는 내 공격력의 c.cap 배까지만 (보스에게 터지지 않게)
  const atkPart = atk * c.atk * cl.mult * stab * (0.85 + Math.random() * 0.3); // 방어력은 무시해요
  const hit = mitigate(foe, Math.max(1, Math.round(hpPart + atkPart)));
  foe.hp = Math.max(0, foe.hp - hit.dmg);
  log.push(`☀️ **태양의 심판!** ${X.name}이(가) 모은 햇빛이 ${foe.name}의 방어를 꿰뚫어요! **${hit.dmg}** 데미지${hit.note}${cl.note}`);
  afterHit(foe, X, hit.dmg, log);
  if (foe.hp > 0) {
    foe.st.dots = (foe.st.dots ?? []).filter((d) => d.kind !== 'burn');
    foe.st.dots.push({ kind: 'burn', pct: c.burn[0], turns: c.burn[1] });
    const n = clearBuffs(foe);
    log.push(`　🔥 ${foe.name}에게 ${c.burn[1]}턴 화상!${n ? ` · 좋은 효과 ${n}개가 햇빛에 사라졌어요` : ''}`);
  }
}

// 👼 심판의 나팔: 기다리는 동안 상대가 쓴 스킬이 많을수록 심판이 커져요
function fireTrumpet(X, foe, log) {
  const c = X.st.trumpet;
  delete X.st.trumpet;
  if (!foe || foe.hp <= 0) return;
  if (foe.st?.skillImmune) { log.push(`🧿 ${foe.name}은(는) 스킬 면역! 심판의 나팔이 허공에 울렸어요`); return; }
  const bonus = Math.min(c.cap, (c.seen ?? 0) * c.per);
  const atk = effAtk(X);
  const cl = elemClash(c.elem ?? 'normal', foe, { attacker: X });
  const stab = c.elem && c.elem !== 'normal' && effElems(X).includes(c.elem) ? ELEM_CFG.stab : 1;
  const base = Math.max(atk * 0.25, atk - effDef(foe) * 0.5) * c.pow * (1 + bonus) * cl.mult * stab * (0.85 + Math.random() * 0.3);
  const hit = mitigate(foe, Math.max(1, Math.round(base)));
  foe.hp = Math.max(0, foe.hp - hit.dmg);
  log.push(`👼 **심판의 나팔!** 죄 ${c.seen ?? 0}개 (피해 +${P100(bonus)}) — ${foe.name}에게 **${hit.dmg}** 데미지${hit.note}${cl.note}`);
  afterHit(foe, X, hit.dmg, log);
  if (foe.hp > 0) { const n = clearBuffs(foe); if (n) log.push(`　👼 ${foe.name}의 좋은 효과 ${n}개가 나팔 소리에 사라졌어요`); }
}

// 🂡 속임수 패: 상대의 마지막 스킬을 되돌리고, 상대의 가장 아끼는 카드를 조커 카드로 바꿔요
function castTrickster(sk, A, B, rng, log) {
  const src = trickSrc(B);
  const boost = sk.trickster.boost ?? 1;
  log.push(`　🂡 ${B.name}의 ${src.emoji} **${src.name}** 을(를) 그대로 돌려줘요! (위력 ×${boost})`);
  castSkill({ ...src, name: `${src.name} (속임수)`, cost: 0, cd: 0, copied: true, srcId: src.id, pow: src.pow ? src.pow * boost : src.pow, hitPows: src.hitPows?.map((x) => x * boost) }, A, B, rng, log);
  A.st.last = sk.id;
  if (A.hp > 0 && B.hp > 0) {
    if (B.st.skillImmune) log.push(`　🧿 ${B.name}은(는) 스킬 면역! 카드 바꿔치기가 막혔어요`);
    else if (B.st.debuffImmune) log.push(`　🛡️ ${B.name}은(는) 나쁜 효과에 면역이라 카드 바꿔치기가 막혔어요`);
    else {
      const slots = (B.skills ?? []).map((id, i) => [id, i]).filter(([id]) => SKILLS[id] && !SKILLS[id].dud);
      if (!slots.length) log.push('　💨 바꿔칠 카드가 없었어요…');
      else {
        slots.sort((a, b) => SKILLS[b[0]].cost - SKILLS[a[0]].cost || rng() - 0.5); // 마나가 가장 큰(= 가장 아끼는) 카드
        const [id, i] = slots[0];
        B.skills[i] = 'joker_dud';
        (B.st.cds ??= {}).joker_dud = 9999; // 쿨타임 중인 칸은 버튼이 안 보여요
        log.push(`　🃏 ${B.name}의 ${SKILLS[id].emoji} **${SKILLS[id].name}** 카드가 **조커 카드**로 바뀌었어요! (이번 전투 동안 못 써요)`);
      }
    }
  }
  A.st.cds = Object.fromEntries(Object.entries(A.st.cds ?? {}).filter(([id, n]) => id === sk.id || n >= 90)); // 전투당 1회 스킬의 "사용함" 표시는 남겨요
  log.push('　⏪ 내 스킬 쿨타임이 전부 초기화됐어요!');
}

// ✨ 태초의 숨결: 3턴 전으로 되감기 (지금이 더 좋으면 그대로 · 체력은 상한까지만)
function castRewind(sk, A, log) {
  const c = sk.rewind;
  const h = A.st.hist ?? [];
  const past = h[Math.max(0, h.length - c.back)];
  const hp0 = A.hp;
  const mana0 = Math.round(A.mana);
  A.hp = Math.max(A.hp, Math.min(A.max, past.hp, Math.round(A.max * c.cap)));
  A.mana = Math.min(A.manaMax, Math.max(A.mana, past.mana));
  const n = purgeDebuffs(A.st);
  const longest = Object.entries(A.st.cds ?? {}).filter(([id, v]) => id !== sk.id && v < 90).sort((a, b) => b[1] - a[1]).slice(0, c.cdTop);
  for (const [id] of longest) delete A.st.cds[id];
  A.st.debuffImmune = { turns: c.immune + 1 };
  A.st.priority = { turns: 2 };
  log.push(`　⏪ ${A.name}이(가) **${c.back}턴 전으로** 시간을 되돌렸어요! 체력 ${hp0} → ${A.hp} · 마나 ${mana0} → ${Math.round(A.mana)}`);
  log.push(`　✨ 나쁜 효과 ${n}개 정화${longest.length ? ` · 쿨타임 ${longest.length}개 초기화` : ''} · ${c.immune}턴간 새 나쁜 효과 면역 · 다음 턴 선공`);
}

// 🌌 천지창조: 서로의 속성을 바꾸고 상성을 뒤집어요
function castGenesis(sk, A, B, rng, log) {
  const c = sk.genesis;
  const foeEl = effElems(B).find((e) => e !== 'normal') ?? 'normal';
  const pick = (score) => {
    let best = []; let bv = -Infinity;
    for (const e of ALL_ELEMS) { const v = score(e); if (v > bv + 1e-9) { bv = v; best = [e]; } else if (Math.abs(v - bv) < 1e-9) best.push(e); }
    return best[Math.floor(rng() * best.length)];
  };
  const mine = pick((e) => -elemClash(foeEl, { elems: [e], st: {} }).mult); // 상대 공격 속성에 가장 강한 몸
  A.st.convert = { elem: mine, turns: c.convert };
  log.push(`　🌌 ${A.name}의 속성이 **${elemTag(mine)}** (으)로 다시 태어났어요! (${c.convert}턴)`);
  if (B.st.skillImmune) log.push(`　🧿 ${B.name}은(는) 스킬 면역! 상대 속성은 바뀌지 않았어요`);
  else if (B.st.debuffImmune) log.push(`　🛡️ ${B.name}은(는) 나쁜 효과에 면역이라 속성이 바뀌지 않았어요`);
  else {
    const theirs = pick((e) => elemClash(mine, { elems: [e], st: {} }).mult); // 내 속성 공격에 가장 약한 몸
    B.st.convert = { elem: theirs, turns: c.convert };
    log.push(`　🌌 ${B.name}의 속성이 **${elemTag(theirs)}** (으)로 뒤바뀌었어요! (${c.convert}턴)`);
  }
  A.st.genesis = { turns: c.turns + 1 }; // +1: 이번 턴 끝 감소분
  A.manaMax += c.manaUp;
  A.st.manaBonus = (A.st.manaBonus ?? 0) + c.manaUp;
  A.mana += c.manaUp;
  log.push(`　🌌 ${c.turns}턴 동안 내 공격은 **약점 확정**, 상대 공격의 상성 보너스는 사라져요 · 최대 마나 +${c.manaUp} (이번 전투 동안)`);
}

// 😈 혼돈의 소용돌이: 무작위 효과 N개 (좋은 효과 최소 1개 · 내게 불리한 효과 최대 1개)
function castChaos(sk, A, B, rng, log, immune) {
  const c = sk.chaos;
  const cost = Math.min(Math.max(0, A.hp - 1), Math.round(A.max * c.hp));
  if (cost > 0) { A.hp -= cost; log.push(`　😈 소용돌이가 몸을 깎아요… 체력 -${cost}`); }
  const foeOk = !immune && B.hp > 0 && !B.st.debuffImmune;
  const blocked = () => log.push('　　💨 막혀서 아무 일도 일어나지 않았어요');
  const E = (kind, label, fn) => ({ kind, label, fn });
  const goods = [
    E('good', '💪 공격 +40% (3턴)', () => { A.st.atkUp = { pct: Math.max(A.st.atkUp?.pct ?? 0, 0.4), turns: 3 }; }),
    E('good', '🧱 방어 +40% (3턴)', () => { A.st.defUp = { pct: Math.max(A.st.defUp?.pct ?? 0, 0.4), turns: 3 }; }),
    E('good', '🔰 보호막 20%', () => { A.st.shield = (A.st.shield ?? 0) + Math.round(A.max * 0.2); }),
    E('good', '💖 체력 25% 회복', () => { const n = heal(A, A.max * 0.25); log.push(`　　💖 체력 +${n}`); }),
    E('good', '🔋 마나 +30', () => { A.mana += 30; }),
    E('good', '⏪ 쿨타임 -2', () => { for (const id of Object.keys(A.st.cds ?? {})) if (A.st.cds[id] < 90 && (A.st.cds[id] -= 2) <= 0) delete A.st.cds[id]; }),
    E('good', '👥 분신', () => { A.st.clone = { atk: Math.round(effAtk(A) * 0.5), hp: Math.max(10, Math.round(effDef(A) * 0.6 * CLONE_HP_PER_DEF)), turns: 3, boom: 0 }; }),
    E('good', '⏱️ 선공 2턴', () => { A.st.priority = { turns: 3 }; }),
  ];
  const foes = [
    E('foe', '🔻 상대 약화', () => { if (!foeOk) return blocked(); B.st.atkDown = { pct: 0.3, turns: 3 }; B.st.defDown = { pct: 0.2, turns: 3 }; }),
    E('foe', '💫 상대 기절', () => { if (!foeOk || B.st.sunCharge) return blocked(); B.st.stun = 1; }),
    E('foe', '🔥 화상 3턴', () => { if (!foeOk) return blocked(); B.st.dots = (B.st.dots ?? []).filter((d) => d.kind !== 'burn'); B.st.dots.push({ kind: 'burn', pct: 0.06, turns: 3 }); }),
    E('foe', '☠️ 독 3턴', () => { if (!foeOk) return blocked(); B.st.dots = (B.st.dots ?? []).filter((d) => d.kind !== 'poison'); B.st.dots.push({ kind: 'poison', pct: 0.06, turns: 3 }); }),
    E('foe', '🔽 상대 마나 -30', () => { if (!foeOk) return blocked(); B.mana = Math.max(0, B.mana - 30); }),
  ];
  const bads = [
    E('bad', '💔 내 방어 -25% (2턴)', () => { A.st.defDown = { pct: 0.25, turns: 2 }; }),
    E('bad', '💔 내 공격 -25% (2턴)', () => { A.st.atkDown = { pct: 0.25, turns: 2 }; }),
    E('bad', '💸 내 마나 -20', () => { A.mana = Math.max(0, A.mana - 20); }),
  ];
  const picked = [goods.splice(Math.floor(rng() * goods.length), 1)[0]]; // 좋은 효과 1개는 보장
  const rest = [...goods, ...foes, ...bads];
  let bad = 0;
  while (picked.length < c.count && rest.length) {
    const e = rest.splice(Math.floor(rng() * rest.length), 1)[0];
    if (e.kind === 'bad') { if (bad >= 1) continue; bad++; }
    picked.push(e);
  }
  log.push(`　😈 혼돈이 소용돌이쳐요… **${picked.map((p) => p.label).join(' + ')}**!`);
  for (const p of picked) p.fn();
}

// 스킬 한 번 쓰기. A = 쓰는 쪽, B = 맞는 쪽
export function castSkill(sk, A, B, rng, log) {
  A.mana = Math.max(0, A.mana - sk.cost);
  log.push(`✨ ${A.emoji} ${A.name}의 ${sk.emoji} **${sk.name}**!`);
  // 🆕 배치 4: 못 쓰는 상황이면 마나를 돌려주고 불발 (쿨타임·마지막 스킬 기록 전에 걸러요)
  const fizzle = (why) => { A.mana += sk.cost; log.push(`　💨 ${why} (마나는 돌려받았어요)`); };
  if (sk.cloneBoom && A.st.clone) return fizzle('분신이 아직 남아 있어요…');
  if (sk.joker && (A.fight ?? B.fight)?.jokerUsed) return fizzle('조커는 이번 전투에서 이미 쓰였어요…');
  if (sk.pride && A.st.prideUsed) return fizzle('이번 전투에서 이미 군림했어요…');
  if (sk.lastLaugh && A.st.lastLaughUsed) return fizzle('이번 전투에서 이미 웃었어요…');
  if (sk.devilDeal && A.st.devil) return fizzle('이미 악마와 거래 중이에요…');
  if (sk.burnPact && A.st.burnPact) return fizzle('이미 도화선이 타오르고 있어요…');
  if (sk.soulSwap && (A.st.soulSwap || B.st.soulSwap)) return fizzle('이미 몸이 뒤바뀐 상태예요…');
  if (sk.goldSave && (A.st.goldSave || A.st.goldUsed)) return fizzle('이미 황금 속에 순간을 저장해 뒀어요…');
  if (sk.lootReserve && A.st.lootReserve) return fizzle('이미 보상을 찜해 뒀어요…');
  if (sk.fateReplay && !fatePick(A.st, !!B.st.skillImmune)) return fizzle('재현할 행운이 아직 없어요…');
  if ((sk.catchPro || sk.fightBuff || sk.lootReserve) && !(A.fight && A.st === A.fight.mySt)) return fizzle('이 스킬은 트레이너의 펫만 쓸 수 있어요…'); // 🆕 배치 5: 포획·보상 스킬은 내 쪽만
  if (sk.curseGrant && !A.st.cursed) { revertCurseSlots(A.skills, A.st); return fizzle('부여할 저주가 사라졌어요…'); }
  if (sk.dud) { log.push('　🃏 조커 카드… 아무 일도 일어나지 않아요'); return; }
  if (sk.trickster && !trickSrc(B)) return fizzle('복제할 스킬이 없어요…');
  if (sk.rewind && !A.st.hist?.length) return fizzle('되감을 과거가 아직 없어요…');
  if (sk.dragonFlame && A.hp / A.max <= sk.dragonFlame.minHp) return fizzle('체력이 모자라서 업화를 태울 수 없어요…');
  if (sk.sunVerdict && A.st.sunCharge) return fizzle('이미 햇빛을 모으고 있어요…');
  if (sk.trumpet && A.st.trumpet) return fizzle('나팔이 이미 울리고 있어요…');
  if (A.st.lamp && !sk.copied && !sk.echoed) { // 🕯️ 불빛: 불빛이 달린 쪽이 스킬을 쓸 때마다 고정 피해 + 마나 감소
    const n = Math.max(1, Math.round(A.max * A.st.lamp.pct));
    const m = Math.min(A.mana, A.st.lamp.mana);
    A.hp = Math.max(0, A.hp - n);
    A.mana -= m;
    log.push(`　🕯️ ${A.name}에게 달린 불빛이 깜빡여요! 최대 체력의 ${P100(A.st.lamp.pct)} **${n}** 고정 피해 + 마나 -${m}`);
    if (A.hp <= 0) return;
  }
  if (A.st.mindCtl && sk.pow && !sk.echoed && !sk.copied && !A.st.skillImmune) { // 👽 정신 지배: 공격 스킬이 엉뚱하게 자기 자신을 향해요
    if (--A.st.mindCtl.uses <= 0) delete A.st.mindCtl;
    log.push(`　👽 **정신 지배!** ${A.name}의 ${sk.name}이(가) 엉뚱하게 ${A.name} 자신을 향해요!`);
    B = A;
  }
  if (!sk.echoed) A.st.act = ['heal', 'regen', 'shield', 'guard', 'atkUp', 'defUp', 'burstAtk', 'revive', 'atkRegen', 'evade', 'potion'].some((k) => sk[k]) ? 'read' : 'other'; // 👁️ 내가 마지막에 한 행동 종류 (급강하 폭격의 "읽기"용)
  if (!sk.echoed) A.st.last = sk.copied ? sk.srcId : sk.id; // 🆕 "마지막에 쓴 스킬" 기록 (복사용)
  if (sk.cd && !sk.copied && !sk.echoed) (A.st.cds ??= {})[sk.id] = sk.cd + 1; // ⏳ 쿨타임 시작 (+1: 이번 턴 끝 감소분)
  if (!sk.echoed && !sk.copied && !sk.swallowed) {
    if (A.st.reign && !A.st.skillImmune) { // 👹 화염 군림: 스킬을 쓸 때마다 화상 스택
      const r = A.st.reign;
      r.stacks = Math.min(r.max, r.stacks + 1);
      A.st.dots = (A.st.dots ?? []).filter((d) => d.kind !== 'burn');
      A.st.dots.push({ kind: 'burn', pct: r.pct * r.stacks, turns: 2 });
      log.push(`　👹 군림의 불길! ${A.name}에게 화상 스택 **${r.stacks}/${r.max}** (매 턴 최대 체력의 ${pct1(r.pct * r.stacks)})`);
    }
    if (B.st.trumpet && !sk.trumpet) B.st.trumpet.seen = (B.st.trumpet.seen ?? 0) + 1; // 👼 심판의 나팔: 상대가 쓴 스킬이 죄가 돼요
  }
  if (A.st.venom) A.st.venom.budget = A.st.venom.skill; // 🦖 이번에 쓰는 스킬이 쌓을 수 있는 독 스택
  if (sk.trickster) { castTrickster(sk, A, B, rng, log); finishCast(A, B, log); return; }
  if (sk.rewind) { castRewind(sk, A, log); finishCast(A, B, log); return; }
  if (sk.genesis) { castGenesis(sk, A, B, rng, log); finishCast(A, B, log); return; }
  if (sk.copy) { // 🦜 상대가 마지막에 쓴 스킬을 복사해서 마나 0으로 즉시 사용
    const src = SKILLS[B.st.last];
    if (!src || src.copy || src.joker || src.trickster || src.dud || isOnce(src)) { A.mana += sk.cost; log.push('　💨 복사할 스킬이 없어요… (마나는 돌려받았어요)'); return; }
    log.push(`　🦜 ${B.name}의 ${src.emoji} **${src.name}** 을(를) 복사했어요!`);
    castSkill({ ...src, name: `${src.name} (복사)`, cost: 0, copied: true, srcId: src.id }, A, B, rng, log);
    return;
  }
  const prideHostile = HOSTILE_KEYS.some((k) => sk[k]) && !sk.copied && !sk.echoed && !sk.reflected; // 👿 반사 대상: 상대에게 건 스킬
  // 🧿 스킬 면역: 상대가 면역이면 "적에게 가는 효과"가 전부 사라져요 (내게 쓰는 효과는 그대로)
  let immune = false;
  if (B.st.skillImmune && !sk.swallowed && (HOSTILE_KEYS.some((k) => sk[k]) || sk.archBless || sk.statRoll?.[1] === 'foe')) {
    immune = true;
    sk = { ...sk };
    for (const k of HOSTILE_KEYS) delete sk[k];
    log.push(`　🧿 ${B.name}은(는) **스킬 면역** 상태! 적에게 가는 스킬 효과가 전부 막혔어요`);
  }
  const noDebuff = B.st.debuffImmune ? DEBUFF_KEYS : B.st.sunCharge ? ['stun'] : null; // 🛡️ 태초의 숨결 · ☀️ 충전 중
  if (noDebuff && !sk.swallowed && noDebuff.some((k) => sk[k])) {
    sk = { ...sk };
    for (const k of noDebuff) delete sk[k];
    log.push(`　🛡️ ${B.name}은(는) ${B.st.debuffImmune ? '나쁜 효과에 면역' : '햇빛을 모으는 중이라 기절하지 않는'} 상태! 방해 효과가 막혔어요`);
  }
  if (sk.joker) { // 🃏 조커: 내 스킬 하나 ↔ 상대 스킬 하나 랜덤 맞교환 (전투 안에서만 · 전투당 1번)
    const fight = A.fight ?? B.fight ?? (A.fight = B.fight = {});
    A.fight ??= fight;
    B.fight ??= fight;
    const idxOf = (X) => (X.skills ?? []).map((id, i) => (SKILLS[id] ? i : -1)).filter((i) => i >= 0);
    const ai = idxOf(A);
    const bi = idxOf(B);
    if (!ai.length || !bi.length) return fizzle('맞바꿀 스킬이 없어요…');
    const jokerAt = ai.find((i) => A.skills[i] === sk.id);
    const a = JOKER_CFG.forceGive && jokerAt != null ? jokerAt : ai[Math.floor(rng() * ai.length)];
    const b = bi[Math.floor(rng() * bi.length)];
    const mine = A.skills[a];
    const theirs = B.skills[b];
    A.skills[a] = theirs;
    B.skills[b] = mine;
    fight.jokerUsed = true;
    log.push(`　🃏 **조커!** ${A.name}의 ${SKILLS[mine].emoji} ${SKILLS[mine].name} ↔ ${B.name}의 ${SKILLS[theirs].emoji} ${SKILLS[theirs].name} 맞교환! (이번 전투 동안만)`);
    if (mine === sk.id) { // 조커 카드가 상대 손에 들어갔어요
      const lost = Math.round(B.mana);
      B.mana = 0;
      if (!B.st.sealed?.perm) B.st.sealed = { turns: JOKER_CFG.sealTurns + 1 }; // +1: 이번 턴 끝 감소분 (영구 봉인은 덮어쓰지 않아요)
      log.push(`　😈 ${B.name}(이)가 **조커 카드**를 받았어요! 마나 ${lost} 전부 삭제 + 스킬 ${JOKER_CFG.sealTurns}턴 봉인!`);
    }
  }
  let dealt = 0;
  let landed = 0; // 🆕 실제로 맞은(회피 아닌) 타수 — needHit 용

  // 🌈 속성 상성: 약점(×1.5) / 반감(×0.65) / 같은 속성 보너스(×1.2)
  const skElem = skillElement(sk);
  let elemMul = 1;
  if ((sk.pow || sk.bomb) && !sk.weakElems) {
    const clash = elemClash(skElem, B, { ignoreResist: sk.ignoreResist, attacker: A }); // 🌈 allElem 반영
    const devilWeak = !!A.st.devil && clash.mult < ELEM_CFG.strong; // 😈 악마의 거래: 약점 확정
    const cmult = devilWeak ? ELEM_CFG.strong : clash.mult;
    elemMul = cmult;
    if (sk.weakBonus && cmult > 1) elemMul *= 1 + sk.weakBonus;
    const stab = skElem !== 'normal' && (effElems(A).includes(skElem) || isAllElemAtk(A)) ? ELEM_CFG.stab : 1;
    elemMul *= stab;
    const tags = [];
    if (devilWeak) tags.push(`😈 악마의 거래: 약점 확정! (×${ELEM_CFG.strong})`);
    else if (clash.note) tags.push(clash.note.trim());
    if (sk.weakBonus && cmult > 1) tags.push(`🎯 약점 공략! (+${P100(sk.weakBonus)})`);
    if (stab > 1) tags.push(`🔰 같은 속성 보너스! (×${ELEM_CFG.stab})`);
    if (tags.length) log.push(`　${elemTag(skElem)} 속성 → ${effElems(B).map(elemTag).join(' + ')}: ${tags.join(' ')}`);
  }

  // 🆕 독창 스킬: 이번 한 번의 데미지 배율 (마나 쏟아붓기 · 오기/발악 · 도박이 여기에 곱해져요)
  let mult = elemMul;
  if (sk.overload) {
    const spent = Math.round(A.mana);
    mult *= 1 + spent * sk.overload;
    A.mana = 0;
    log.push(`　🔥 남은 마나 ${spent} 을(를) 전부 쏟아부었어요! (데미지 ×${mult.toFixed(2)})`);
  }
  if (sk.revenge) {
    const lost = Math.max(0, 1 - A.hp / A.max);
    if (lost >= 0.05) {
      const m = 1 + lost * sk.revenge;
      mult *= m;
      log.push(`　😤 아플수록 강해져요! (데미지 ×${m.toFixed(2)})`);
    }
  }
  let jackpot = false;
  if (sk.gamble) {
    if (rng() < sk.gamble[0]) {
      jackpot = true;
      mult *= sk.gamble[1];
      log.push(`　🎲 **대박!** (데미지 ×${sk.gamble[1]})`);
    } else {
      mult *= 0.4;
      const n = Math.max(0, Math.min(A.hp - 1, Math.round(A.max * sk.gamble[2])));
      A.hp -= n;
      log.push(`　🎲 쪽박… 반동으로 -${n}`);
    }
  }
  if (sk.snowball) { // ⛄ 설인의 눈덩이: 이번 전투에서 쓸 때마다 위력이 커져요 (st.snowCount 는 전투가 끝날 때까지 유지)
    const [base, step, cap] = sk.snowball;
    const n = A.st.snowCount ?? 0;
    const m = Math.min(cap, base + step * n);
    A.st.snowCount = n + 1;
    mult *= m;
    log.push(`　⛄ 눈덩이가 ${n + 1}번째로 굴러요! (데미지 ×${+m.toFixed(2)}${m >= cap ? ' · 최대!' : ''})`);
  }
  if (sk.cleanseBoost) { // ✨ 무지갯빛 뿔: 정화 → (회복) → 피해. 지운 개수만큼 위력 증가
    const kinds = new Set((A.st.dots ?? []).map((d) => d.kind));
    let n = kinds.size;
    for (const k of ['atkDown', 'defDown', 'stun']) if (A.st[k]) n++;
    A.st.dots = [];
    delete A.st.atkDown; delete A.st.defDown; delete A.st.stun;
    const used = Math.min(n, sk.cleanseBoost[1]);
    log.push(n ? `　✨ 나쁜 효과 ${n}개를 정화했어요!${used > 0 ? ` (위력 +${P100(used * sk.cleanseBoost[0])})` : ''}` : '　✨ 정화할 나쁜 효과가 없었어요');
    mult *= 1 + used * sk.cleanseBoost[0];
  }
  if (sk.rage) { // 😈 마왕의 포효: 이번 전투에서 맞은 횟수 × 회당 비율
    const cnt = A.st.hitCount ?? 0;
    const bonus = Math.min(sk.rage[1], cnt * sk.rage[0]);
    if (bonus > 0) { mult *= 1 + bonus; log.push(`　😈 지금까지 ${cnt}번 맞은 분노가 폭발! (위력 +${P100(bonus)})`); }
  }
  let dragonBurn = 0;
  if (sk.dragonFlame) { // 🐉 용왕의 업화: 체력을 태워 방어 무시 피해로 · 상대 체력이 낮으면 위력 증가
    const c = sk.dragonFlame;
    dragonBurn = Math.max(1, Math.min(A.hp - 1, Math.round(A.max * c.burn)));
    A.hp -= dragonBurn;
    log.push(`　🔥 체력 **${dragonBurn}** 을(를) 태워 업화를 지폈어요!`);
    if (B.hp / B.max <= c.low) { mult *= c.lowMult; log.push(`　🐉 상대가 약해졌어요! 위력 ×${c.lowMult}`); }
  }
  if (sk.impact) { // ☄️ 혜성 충돌: 내 스피드 ÷ 상대 스피드
    const ratio = clamp(effSpd(A) / Math.max(1, effSpd(B)), sk.impact[0], sk.impact[1]);
    mult *= ratio;
    log.push(`　☄️ 스피드 비율 **${ratio.toFixed(2)}** → 충돌 위력 ×${ratio.toFixed(2)}${ratio >= sk.impact[1] ? ' (최대!)' : ratio <= sk.impact[0] ? ' (최소…)' : ''}`);
  }
  if (sk.trample && !immune) { // ⚔️ 돈가 돌격: 좋은 효과를 짓밟고 개수당 위력 증가
    const k = destroyBuffs(B, sk.trample[0], rng);
    if (k > 0) { mult *= 1 + k * sk.trample[1]; log.push(`　⚔️ ${B.name}의 좋은 효과 ${k}개를 짓밟았어요! (위력 +${P100(k * sk.trample[1])})`); }
    else {
      A.st.defUp = { pct: Math.max(A.st.defUp?.pct ?? 0, 0.25), turns: Math.max(A.st.defUp?.turns ?? 0, 4) };
      log.push('　⚔️ 짓밟을 게 없어서 대신 기세를 올려요! 방어력 +25% (3턴)');
    }
  }
  if (sk.lens) { // ☀️ 태양광선: 단단할수록 더 깊이 꿰뚫어요
    const r = effDef(B) / Math.max(1, effAtk(A));
    const p = Math.min(sk.lens[1], (sk.pierce ?? 0) + r * sk.lens[0]);
    sk = { ...sk, pierce: p };
    log.push(`　☀️ 집광! 상대 방어가 단단한 만큼 더 깊이 꿰뚫어요 (관통 ${P100(p)})`);
  }
  if (sk.coldSnap && sk.stun && B.st.defDown && !immune) { // 🌨️ 눈보라: 방어가 무너진 상대는 얼어붙어요
    sk = { ...sk, stun: 1 };
    log.push(`　🌨️ 방어가 무너진 ${B.name}은(는) 눈보라에 얼어붙어요! 기절 확정`);
  }
  if (sk.coldSnap && !immune && !B.st.defDown && !B.st.debuffImmune) { // 🌨️ 눈보라 1단계: 발을 묶고 방어를 깎아요
    B.st.spdDown = { pct: Math.max(B.st.spdDown?.pct ?? 0, 0.25), turns: Math.max(B.st.spdDown?.turns ?? 0, 4) };
    log.push(`　🌨️ 눈보라에 ${B.name}의 발이 묶여요! 스피드 -25% (3턴) — 방어가 깎인 뒤 다시 맞으면 기절해요`);
  }
  if (sk.allIn) { // 💥 전력투구: 체력이 가득할수록 위력 증가
    const hr = clamp(A.hp / A.max, 0, 1);
    const m = 1 + hr * sk.allIn[0];
    mult *= m;
    log.push(`　💥 전부 쏟아부어요! 체력 ${Math.round(hr * 100)}% → 위력 ×${m.toFixed(2)}`);
  }
  if (sk.deep) { // 🌊 대양의 꼬리치기: 남은 마나가 많을수록 묵직해요
    const m = Math.min(A.mana, 150);
    const dm = 1 + m * sk.deep;
    mult *= dm;
    log.push(`　🌊 수심이 깊어요! 남은 마나 ${Math.round(m)} → 위력 ×${dm.toFixed(2)}`);
  }
  if (sk.flashover && !immune && sk.dot && !(B.st.dots ?? []).some((d) => d.kind === 'burn')) { // 🌋 업화 1단계: 불씨를 깊게 심어요
    sk = { ...sk, dot: [sk.dot[0], sk.dot[1] * 1.5, sk.dot[2] + 1, sk.dot[3]] };
    log.push('　🌋 불씨를 깊게 심어요! (화상 ×1.5 · +1턴) — 다음 업화에서 한꺼번에 폭발해요');
  }
  if (sk.flashover && !immune) { // 🌋 업화: 상대의 화상을 한꺼번에 폭발
    const bd = (B.st.dots ?? []).filter((d) => d.kind === 'burn');
    if (bd.length) {
      const tot = bd.reduce((s, d) => s + B.max * d.pct * d.turns, 0);
      const n = Math.max(1, Math.round(tot * sk.flashover));
      B.st.dots = B.st.dots.filter((d) => d.kind !== 'burn');
      B.hp = Math.max(0, B.hp - n);
      dealt += n;
      log.push(`　🌋 ${B.name}의 화상이 한꺼번에 폭발해요! 방어 무시 **${n}** 피해`);
    }
  }
  if (sk.wash && !immune && !(B.st.shield > 0) && !B.st.debuffImmune) { // 🌊 해일: 보호막이 없으면 파도가 발을 묶어요
    B.st.spdDown = { pct: Math.max(B.st.spdDown?.pct ?? 0, 0.4), turns: Math.max(B.st.spdDown?.turns ?? 0, 4) };
    A.mana = Math.min(A.manaMax ?? A.mana + 15, A.mana + 15);
    log.push(`　🌊 파도가 ${B.name}의 발을 묶어요! 스피드 -40% (3턴) · 내 마나 +15`);
  }
  if (sk.wash && !immune && B.st.shield > 0) { // 🌊 해일: 보호막을 씻어내요
    const s = B.st.shield;
    const n = Math.max(1, Math.round(s * sk.wash));
    B.st.shield = 0;
    B.hp = Math.max(0, B.hp - n);
    dealt += n;
    log.push(`　🌊 ${B.name}의 보호막 ${s}을(를) 씻어냈어요! 방어 무시 **${n}** 피해`);
  }
  if (sk.voidEat && !immune) { // 🕳️ 공허붕괴: 좋은 효과를 전부 삼켜요
    let k = destroyBuffs(B, 9, rng);
    if (B.st.clone) { delete B.st.clone; k++; }
    if (B.st.pigeon) { delete B.st.pigeon; k++; }
    const u = Math.min(k, 5);
    if (u > 0) { mult *= 1 + u * sk.voidEat; log.push(`　🕳️ ${B.name}의 좋은 효과 ${k}개를 공허가 삼켰어요! (위력 +${P100(u * sk.voidEat)})`); }
    else {
      const m = Math.min(B.mana, 30);
      B.mana -= m;
      mult *= 1.1;
      log.push(`　🕳️ 삼킬 효과가 없어서 대신 마나 ${m}을(를) 삼켰어요! (위력 +10%)`);
    }
  }
  if (sk.plagueScale && sk.dot && !immune && debuffCount(B.st) === 0) { // 🦠 나쁜 효과가 없으면 상처가 곪아요
    sk = { ...sk, healCut: [0.3, 3] };
    log.push('　🦠 역병이 상처를 곪게 해요! 회복 -30% (3턴)');
  }
  if (sk.plagueScale && sk.dot && !immune) { // 🦠 대역병: 걸린 나쁜 효과가 많을수록 독이 독해져요
    const c = debuffCount(B.st);
    if (c > 0) {
      const f = 1 + c * sk.plagueScale;
      sk = { ...sk, dot: [sk.dot[0], sk.dot[1] * f, sk.dot[2], sk.dot[3]] };
      log.push(`　🦠 ${B.name}에게 걸린 나쁜 효과 ${c}종이 역병의 먹이가 돼요! 독 피해 ×${f.toFixed(2)}`);
    }
  }
  let pureN = 0;
  if (sk.pureCharge) { // 🌈 순결의 돌진: 나쁜 효과를 전부 떨치고, 지운 개수당 위력 증가
    const c = sk.pureCharge;
    pureN = purgeDebuffs(A.st);
    const used = Math.min(pureN, c.cap);
    if (used > 0) { mult *= 1 + used * c.step; log.push(`　✨ 나쁜 효과 ${pureN}개를 정화했어요! (위력 +${P100(used * c.step)})`); }
    else log.push('　✨ 정화할 나쁜 효과가 없었어요');
  }
  if (sk.manaSiphon && B.mana <= 0) { mult *= 1 + sk.manaSiphon[2]; log.push(`　🌊 흡수할 마나가 없어서 대신 위력 +${P100(sk.manaSiphon[2])}!`); }
  if (B.st.reign && skElem === 'fire' && (B.st.dots ?? []).some((d) => d.kind === 'burn')) { mult *= 1 + B.st.reign.fire; log.push(`　👹 화상 걸린 상대에게 화염 피해 +${P100(B.st.reign.fire)}`); }
  if (sk.venom) { A.st.venom = { ...sk.venom, budget: sk.venom.skill }; log.push(`　🦖 ${sk.venom.turns}턴 동안 내 공격마다 독이 쌓여요! (기본 공격 +${sk.venom.basic} · 스킬 +${sk.venom.skill} · ${sk.venom.pop}스택이면 맹독 폭발)`); }
  let readHit = false;
  if (sk.readBonus) { // 👁️ 급강하 폭격: 상대가 직전에 회복·방어·버프를 썼으면 읽기 성공
    if (B.st.act === 'read') { mult *= sk.readBonus; readHit = true; log.push(`　👁️ **읽기 성공!** ${B.name}의 움직임을 꿰뚫었어요 (위력 ×${sk.readBonus})`); }
    else log.push('　💨 읽기 실패… (상대가 직전에 회복·방어·버프를 쓰지 않았어요)');
  }
  let firstMana = 0;
  if (sk.firstBonus) { // 🦁 사막의 왕 포효: 실제 행동 순서 (스피드 + 선공 스킬 + 속도 역전)
    const first = actsFirst(A, B);
    mult *= first ? sk.firstBonus[0] : sk.firstBonus[1];
    if (first) firstMana = sk.firstBonus[2];
    log.push(first ? `　🦁 **선공!** 먼저 움직여서 위력 ×${sk.firstBonus[0]}` : `　🦁 늦게 움직여서 위력 ×${sk.firstBonus[1]}`);
  }
  const hits = sk.hitsRange ? sk.hitsRange[0] + Math.floor(rng() * (sk.hitsRange[1] - sk.hitsRange[0] + 1)) : (sk.hits ?? 1);
  if (sk.hitsRange && sk.pow) log.push(`　🎰 ${hits}연타가 나왔어요!`);

  let fearBonus = 0;
  if (sk.fear) { // 😱 이번 턴 맞은 피해 × 비율을 내 공격력에 더해요 (안 맞았으면 상대 공격력의 30% × 비율)
    const taken = A.st.turnTaken ?? 0;
    fearBonus = taken > 0 ? taken * sk.fear : effAtk(B) * 0.3 * sk.fear;
    log.push(`　😱 공포가 힘이 돼요! 공격력 **+${Math.round(fearBonus)}**`);
  }
  const bzMul = sk.pow ? berserkMult(A.st, 'skill') : 1; // 🔥 광폭화: 다음 공격 스킬 1회 위력 보너스
  if (bzMul > 1) log.push(`　🔥 광폭화! 이 스킬의 위력 +${P100(bzMul - 1)}`);
  if (sk.pow) {
    for (let i = 0; i < hits && B.hp > 0; i++) {
      const hitPow = (sk.hitPows?.[i] ?? sk.pow) * (1 - (A.st.powDown?.pct ?? 0)) * bzMul; // 🔻 늪 마녀의 저주: 내 스킬 위력 감소
      let hm = 1;
      if (sk.weakElems) { // 💎 수정 폭풍: 타마다 상대의 약점 속성 중 무작위 하나
        const weak = ALL_ELEMS.filter((e) => elemClash(e, B, { attacker: A }).mult > 1);
        const e = weak.length ? weak[Math.floor(rng() * weak.length)] : 'normal';
        const c = elemClash(e, B, { attacker: A });
        hm = c.mult;
        log.push(e === 'normal' ? `　💎 ${i + 1}타는 약점이 없어서 무속성으로!` : `　💎 ${i + 1}타는 ${elemTag(e)} 속성! 약점 적중 (×${+c.mult.toFixed(2)})`);
      } // 🆕 연타마다 위력이 다른 스킬(천마 질주)
      if (B.st.whoIs && rng() < B.st.whoIs.pct) { // 🎭 누구게?: 이 타격이 때린 쪽(A) 자신에게 들어가요
        const sa = effAtk(A) + fearBonus;
        const sd = Math.max(1, Math.round(Math.max(sa * 0.25, sa - effDef(A) * 0.5) * hitPow * (0.85 + rng() * 0.3)));
        const self = mitigate(A, sd, rng);
        if (A.st.transfer) A.st.transfer.pending = 0; // 🕳️ 자기 자신을 때린 건 전이하지 않아요
        A.hp = Math.max(0, A.hp - self.dmg);
        A.st.turnTaken = (A.st.turnTaken ?? 0) + self.dmg;
        log.push(`　🎭 **누구게?** ${hits > 1 ? `${i + 1}타가` : '공격이'} ${B.name}이(가) 아니라 ${A.name}에게 들어갔어요! **${self.dmg}** 데미지${self.note}`);
        if (A.hp <= 0) break;
        continue;
      }
      const atk = effAtk(A) + fearBonus;
      const def = effDef(B) * (1 - (sk.pierce ?? 0));
      let dmg = Math.max(atk * 0.25, atk - def * 0.5) * hitPow * mult * hm * (0.85 + rng() * 0.3);
      const crit = !!A.st.devil || rng() < (A.crit ?? 0.1) + (sk.crit ?? 0); // 😈 악마의 거래 중엔 확정 급소
      if (crit) dmg *= 1.5;
      if (sk.exec && B.hp / B.max <= 0.3) dmg *= sk.exec;
      const evaded = B.st.evade > 0; // 🆕 회피로 완전히 빗나가는지 (needHit 용)
      const hit = mitigate(B, Math.max(1, Math.round(dmg)), rng);
      if (!evaded) landed++;
      if (sk.mercy) {
        const floor = Math.max(1, Math.round(B.max * 0.01));
        if (B.hp - hit.dmg < floor) { hit.dmg = Math.max(0, B.hp - floor); hit.note += ' (🕊 상대가 1%는 버텼어요)'; }
      }
      B.hp = Math.max(0, B.hp - hit.dmg);
      dealt += hit.dmg;
      log.push(`　${hits > 1 ? `${i + 1}타 ` : ''}${crit ? '💥 급소! ' : ''}${B.name}에게 **${hit.dmg}** 데미지${hit.note}`);
      if (crit && !A.st.devil && hit.dmg > 0) recordLuck(A.st, 'crit', hit.dmg, { dmg: hit.dmg }); // 🎲 운명 재현이 기억해요 (악마의 거래 확정 급소는 행운이 아니에요)
      afterHit(B, A, hit.dmg, log, true); // 🆕 반사·받은 피해 기록
    }
  }
  if (jackpot && dealt > 0) recordLuck(A.st, 'jackpot', dealt, { dmg: dealt });
  if (sk.coinRain && landed > 0 && A.fight && A.st === A.fight.mySt) { // 💰 보물 눈사태: 맞힌 타마다 골드 보상이 쌓여요
    const fb = (A.st.fightBuff ??= {});
    fb.gold = Math.min(FIGHT_BUFF_CAP.gold ?? 1, (fb.gold ?? 0) + landed * sk.coinRain);
    log.push(`　💰 금화가 ${landed}번 쏟아졌어요! 이번 전투 골드 보상 **+${P100(landed * sk.coinRain)}** (지금까지 ${fightBuffText(fb, ['gold'])})`);
  }
  if (sk.melt && landed > 0 && B.hp > 0 && !immune && !B.st.debuffImmune) { // ☀️ 태양광선: 맞힐수록 방어력이 녹아내려요
    const cur = B.st.defDown?.pct ?? 0;
    const nxt = Math.min(sk.melt[1], cur + sk.melt[0]);
    B.st.defDown = { pct: nxt, turns: Math.max(B.st.defDown?.turns ?? 0, sk.melt[2] + 1) };
    log.push(`　☀️ ${B.name}의 방어력이 녹아내려요! -${P100(nxt)} (${sk.melt[2]}턴 · 쌓일수록 무너져요)`);
  }
  if (sk.iceArmor && dealt > 0) { // 🏔️ 빙하붕괴: 부서진 얼음이 보호막으로
    const capAmt = Math.round(A.max * 0.3);
    const add = Math.min(capAmt - (A.st.shield ?? 0), Math.round(dealt * sk.iceArmor));
    if (add > 0) { A.st.shield = (A.st.shield ?? 0) + add; log.push(`　🏔️ 부서진 얼음이 내 몸을 감싸요! 🔰 보호막 +${add}`); }
  }
  if (sk.eclipse && !immune && B.st.last && SKILLS[B.st.last]) { // 🌘 일식광선: 방금 쓴 스킬을 어둠으로 덮어요
    const id = B.st.last;
    (B.st.cds ??= {})[id] = (B.st.cds[id] ?? 0) + sk.eclipse;
    log.push(`　🌘 ${B.name}이(가) 방금 쓴 ${SKILLS[id].emoji} **${SKILLS[id].name}**이(가) 어둠에 덮였어요! 쿨타임 +${sk.eclipse}`);
  }
  if (sk.eclipse && !immune && !(B.st.last && SKILLS[B.st.last])) { // 🌘 덮을 스킬이 없으면 마나를 삼켜요
    const m = Math.min(B.mana, 25);
    B.mana -= m;
    log.push(`　🌘 덮을 스킬이 없어서 어둠이 ${B.name}의 마나 ${m}을(를) 삼켰어요`);
  }
  if (sk.shards && !immune && A.hp > 0) { // 🌠 운석낙하: 파편이 뒤따라 떨어져요
    A.st.shards = { pow: sk.shards[0], turns: sk.shards[1] + 1, elem: skElem };
    log.push(`　🌠 하늘에서 운석 파편이 따라 내려와요! ${sk.shards[1]}턴 뒤 한 번 더 떨어져요`);
  }
  if (sk.allIn) { // 💥 전력투구 뒤 탈진
    A.st.atkDown = { pct: Math.max(A.st.atkDown?.pct ?? 0, sk.allIn[1]), turns: sk.allIn[2] + 1 };
    log.push(`　😮‍💨 전부 쏟아부어 탈진했어요… ${sk.allIn[2]}턴 동안 공격력 -${P100(sk.allIn[1])}`);
  }
  if (sk.shock && B.hp > 0 && !immune && B.mana > 0) { // ⚡ 뇌우: 상대 마나를 타고 흐르는 전기
    const m = B.mana;
    const n = Math.max(1, Math.round(Math.min(B.max * sk.shock[1], m * sk.shock[0])));
    const l = Math.round(m * 0.3);
    B.hp = Math.max(0, B.hp - n);
    B.mana = Math.max(0, B.mana - l);
    dealt += n;
    log.push(`　⚡ 마나를 타고 전기가 흘러요! 방어 무시 **${n}** 피해 · 마나 -${l}`);
  }
  if (sk.truePct && B.hp > 0) {
    const n = Math.max(1, Math.round(B.max * sk.truePct));
    B.hp = Math.max(0, B.hp - n);
    dealt += n;
    log.push(`　🎯 방어 무시 고정 피해 **${n}** (최대체력의 ${P100(sk.truePct)})`);
  }
  if (sk.gapTrue && B.hp > 0 && !immune) { // 👑 황금의 포효: 체력 격차만큼 방어 무시 피해
    const [frac, capP, floorP] = sk.gapTrue;
    const gap = Math.max(0, B.hp - A.hp);
    const n = Math.max(1, Math.round(clamp(gap * frac, B.max * floorP, B.max * capP)));
    B.hp = Math.max(0, B.hp - n);
    dealt += n;
    log.push(`　👑 체력 격차 ${gap}를 꿰뚫는 포효! 방어 무시 **${n}** 피해`);
  }
  if (sk.dragonFlame && dragonBurn > 0 && B.hp > 0) { // 🐉 태운 체력의 일부가 방어 무시 피해로
    const n = Math.max(1, Math.round(dragonBurn * sk.dragonFlame.trueMul));
    B.hp = Math.max(0, B.hp - n);
    dealt += n;
    log.push(`　🐉 태운 불꽃이 ${B.name}에게 **${n}** 방어 무시 피해!`);
  }
  const siphonB4 = B.mana;
  if (sk.manaSiphon) { // 🌊 상대 마나 흡수
    const [frac, cap] = sk.manaSiphon;
    const n = Math.min(cap, Math.floor(B.mana * frac));
    if (n > 0) { B.mana -= n; A.mana = Math.min(A.manaMax, A.mana + n); log.push(`　🌊 ${B.name}의 마나 **${n}** 을(를) 파도로 삼켜 내 마나로!`); }
  }
  if (sk.manaShield && !immune) { // 🌀 성운 삼키기: 삼킨 마나가 보호막이 돼요
    const got = Math.max(0, siphonB4 - B.mana);
    if (got > 0) {
      const add = Math.min(Math.round(got * sk.manaShield), Math.round(A.max * 0.35));
      A.st.shield = Math.min(Math.round(A.max * 0.35), (A.st.shield ?? 0) + add);
      log.push(`　🌀 삼킨 마나 ${got}이(가) 별빛 보호막으로! 🔰 +${add}`);
    }
  }
  if (sk.pureCharge && B.hp > 0 && !immune) { // 🌈 상대의 좋은 효과 파괴
    const k = destroyBuffs(B, pureN > 0 ? 1 : sk.pureCharge.noneBreak, rng);
    log.push(k ? `　🌈 ${B.name}의 좋은 효과 ${k}개를 뿔로 깨뜨렸어요!` : '　🌈 깨뜨릴 좋은 효과가 없었어요');
  }
  if (sk.pureCharge) { A.st.defUp = { pct: Math.max(A.st.defUp?.pct ?? 0, sk.pureCharge.def), turns: Math.max(A.st.defUp?.turns ?? 0, 2) }; log.push(`　🧱 돌진 뒤의 자세! 방어력 +${P100(sk.pureCharge.def)} (1턴)`); }
  if (sk.pow && A.hp > 0 && B.hp > 0) berserkFinish(A.st, B, rng, log, true); // 🔥 광폭화 중인 공격 스킬은 확률로 상대 체력을 5로
  if (sk.berserk && A.hp > 0 && B.hp > 0) { // 🔥 공허의 숨결: 상대가 살아 있으면 내게 광폭화 (+1: 이번 턴 끝 감소분)
    A.st.berserk = { turns: sk.berserk + 1, cap: Math.round(A.max * BERSERK_CFG.ignore), atkLeft: true, skillLeft: true };
    log.push(`　🔥 **광폭화**! ${sk.berserk}턴 동안 최대 체력의 ${P100(BERSERK_CFG.ignore)} 이하 피해 무시 (${A.st.berserk.cap} 이하) · 다음 기본 공격·공격 스킬 위력 +${P100(BERSERK_CFG.bonus)} · 공격할 때마다 ${P100(BERSERK_CFG.hpChance)} 확률로 상대 체력 ${BERSERK_CFG.hpTo}`);
  }
  if (sk.feastAtk && dealt > 0) { // 👻 영혼연회: 영혼이 쌓일수록 공격력이 올라요
    const nxt = Math.min(sk.feastAtk[1], (A.st.atkUp?.pct ?? 0) + sk.feastAtk[0]);
    A.st.atkUp = { pct: nxt, turns: Math.max(A.st.atkUp?.turns ?? 0, sk.feastAtk[2] + 1) };
    log.push(`　👻 영혼이 쌓여요! 공격력 +${P100(nxt)} (${sk.feastAtk[2]}턴)`);
  }
  if (sk.drain && dealt > 0) {
    const want = Math.round(dealt * sk.drain * (1 - (A.st.healCut?.pct ?? 0)));
    const n = heal(A, dealt * sk.drain);
    if (n) log.push(`　🩸 체력 +${n}`);
    if (sk.feastMax && want > n) { // 👻 영혼연회: 넘친 영혼은 최대 체력이 돼요
      const used = A.st.feastGain ?? 0;
      const gain = Math.max(0, Math.min(Math.round((want - n) * sk.feastMax[0]), Math.round(A.max * sk.feastMax[1]) - used));
      if (gain > 0) { A.max += gain; A.hp += gain; A.st.maxBonus = (A.st.maxBonus ?? 0) + gain; A.st.feastGain = used + gain; log.push(`　👻 넘친 영혼이 몸이 돼요! 최대 체력 **+${gain}** (이번 전투 동안)`); }
      const sh = Math.min(Math.round(A.max * 0.3) - (A.st.shield ?? 0), Math.round((want - n - gain) * 0.6));
      if (sh > 0) { A.st.shield = (A.st.shield ?? 0) + sh; log.push(`　👻 남은 영혼은 보호막이 돼요! 🔰 +${sh}`); }
    }
  }
  if (readHit && B.hp > 0) {
    let n = 0;
    for (const k of ['atkUp', 'defUp', 'spdUp', 'guard', 'regen', 'burst', 'priority', 'reflect', 'coinflip']) if (B.st[k]) { delete B.st[k]; n++; }
    if (B.st.shield > 0) { delete B.st.shield; n++; }
    if (B.st.evade > 0) { delete B.st.evade; n++; }
    log.push(n ? `　🧹 ${B.name}의 좋은 효과 ${n}개를 전부 지웠어요!` : '　🧹 지울 좋은 효과는 이미 없었어요');
  }
  if (sk.shieldDrain && dealt > 0) { // 🔰 별빛 파도: 실제로 체력에 들어간 피해(상대 보호막이 흡수한 양은 빼고)의 일부를 내 보호막으로
    const [rate, cap] = sk.shieldDrain;
    const capAmt = Math.round(A.max * cap);
    const before = A.st.shield ?? 0;
    const next = Math.max(before, Math.min(capAmt, before + Math.round(dealt * rate)));
    A.st.shield = next;
    log.push(`　🔰 준 피해의 ${P100(rate)}가 보호막으로! +${next - before} (보호막 ${next}/${capAmt})`);
  }
  if (sk.jackBox) { // 🎁 깜짝 상자: 항상 150% 피해 + 카드 1장 (♠폭죽 · ♥선물 · ♦마나 도둑 · ♣깜짝)
    const card = Math.floor(rng() * 4);
    log.push(`　🎁 깜짝 상자를 열어요… **${['♠ 폭죽', '♥ 선물', '♦ 마나 도둑', '♣ 깜짝'][card]}**!`);
    if (card === 1) { const n = heal(A, A.max * 0.35); log.push(`　💖 선물 상자에서 체력이 **+${n}** 올랐어요!`); }
    else if (immune || B.hp <= 0) log.push('　💨 상대가 쓰러졌거나 스킬 면역이라 카드 효과가 흩어졌어요…');
    else if (card === 0) {
      log.push('　🎆 폭죽이 펑! 추가 공격!');
      castSkill({ id: sk.id, name: `${sk.name} (폭죽)`, emoji: sk.emoji, tier: sk.tier, cost: 0, pow: 1.5, elem: sk.elem, echoed: true }, A, B, rng, log);
    } else if (card === 2) {
      const n = Math.min(B.mana, 40);
      B.mana -= n;
      A.mana += n;
      log.push(`　🧤 ${B.name}의 마나 ${n}을(를) 훔쳤어요!`);
    } else { B.st.stun = 1; log.push(`　💫 상자에서 튀어나온 깜짝 인형에 ${B.name}(이)가 **기절**했어요!`); }
  }
  if (sk.recoil) {
    const n = Math.min(A.hp - 1, Math.round(A.max * sk.recoil));
    if (n > 0) { A.hp -= n; log.push(`　💢 반동으로 -${n}`); }
  }
  if (sk.healLost) { // 🐷 양승민의 재림: 잃은 체력의 일부를 회복
    const n = heal(A, (A.max - A.hp) * sk.healLost);
    log.push(`　🐷 잃은 체력의 ${P100(sk.healLost)}를 되찾았어요! 체력 +${n}`);
  }
  if (sk.ironSkin) {
    A.st.ironSkin = { pct: sk.ironSkin[0], turns: sk.ironSkin[1] + 1 };
    log.push(`　💎 **금강불괴!** ${sk.ironSkin[1]}턴 동안 최대 체력의 ${P100(sk.ironSkin[0])} 이하 피해는 튕겨내요`);
  }
  if (sk.hitCap) {
    A.st.hitCap = { pct: sk.hitCap[0], turns: sk.hitCap[1] + 1 };
    log.push(`　👑 **황금 갑옷!** ${sk.hitCap[1]}턴 동안 한 번에 받는 피해가 최대 체력의 ${P100(sk.hitCap[0])}를 넘지 못해요`);
  }
  if (sk.cleanseHeal) { // 🕊️ 불사조의 눈물: 정화될 나쁜 효과마다 추가 회복
    const c = debuffCount(A.st);
    if (c > 0) { const n = heal(A, A.max * sk.cleanseHeal * c); log.push(`　🕊️ 나쁜 효과 ${c}가지가 눈물에 녹아요! 체력 +${n}`); } else { const sh = Math.round(A.max * 0.15); A.st.shield = (A.st.shield ?? 0) + sh; log.push(`　🕊️ 씻어낼 아픔이 없어서 눈물이 보호막이 돼요! 🔰 +${sh}`); }
  }
  if (sk.heal) {
    const want = Math.round(A.max * sk.heal * (1 - (A.st.healCut?.pct ?? 0))); // 회복감소를 먼저 적용해요
    const n = heal(A, A.max * sk.heal);
    log.push(`　💖 체력 +${n}`);
    if (sk.healOverflow && want > n) { // 🔰 넘친 회복량은 보호막으로
      const capAmt = Math.round(A.max * sk.healOverflow);
      const before = A.st.shield ?? 0;
      const next = Math.max(before, Math.min(capAmt, before + (want - n)));
      A.st.shield = next;
      log.push(`　🔰 넘친 회복량이 보호막으로! +${next - before} (보호막 ${next}/${capAmt})`);
    }
  }
  if (sk.archBless) { // 👼 받은 피해(이번 턴, 없으면 지난 턴) × 배율 회복 + 회복량의 일부를 상대에게 추가 피해 (방어 무시)
    const [hr, sr] = sk.archBless;
    const basis = (A.st.turnTaken ?? 0) > 0 ? A.st.turnTaken : (A.st.prevTaken ?? 0);
    if (basis > 0) {
      const intended = Math.round(basis * hr * (1 - (A.st.healCut?.pct ?? 0)));
      const got = heal(A, basis * hr);
      const over = Math.max(0, intended - got); // 체력이 가득 차서 담지 못하고 넘친 회복량
      log.push(`　👼 받은 피해 ${basis}의 ${P100(hr)}를 회복! 체력 +${got}${over > 0 ? ` (넘친 빛 ${over})` : ''}`);
      if (!immune && B.hp > 0) { // 실제 회복량은 sr, 넘친 회복량은 sr × 넘침배수(기본 1) 위력으로 들어가요
        const om = sk.archBless[2] ?? 1;
        const smite = Math.max(1, Math.round(got * sr + over * sr * om));
        B.hp = Math.max(0, B.hp - smite);
        dealt += smite;
        log.push(`　⚡ 축복의 빛이 ${B.name}에게 **${smite}** 추가 피해! (회복량 ${got}의 ${P100(sr)}${over > 0 && om > 1 ? ` + 넘친 ${over}의 ${P100(sr * om)}` : ''})`);
      }
    } else {
      log.push('　💨 아직 받은 피해가 없어서 축복이 흩어졌어요…');
    }
  }
  if (sk.atkRegen) { A.st.atkRegen = { ratio: sk.atkRegen[0], turns: sk.atkRegen[1] }; log.push(`　🔥 ${sk.atkRegen[1]}턴 동안 매 턴 공격력의 ${P100(sk.atkRegen[0])}만큼 회복해요`); }
  if (sk.regen) { A.st.regen = { pct: sk.regen[0], turns: sk.regen[1] }; log.push(`　🌱 ${sk.regen[1]}턴 동안 체력이 차올라요`); }
  if (sk.shield) { A.st.shield = (A.st.shield ?? 0) + Math.round(A.max * sk.shield); log.push(`　🔰 보호막 ${A.st.shield}`); }
  if (sk.guard) { A.st.guard = { pct: sk.guard[0], turns: sk.guard[1] }; log.push(`　🛡️ ${sk.guard[1]}턴 동안 받는 데미지 -${P100(sk.guard[0])}`); }
  if (sk.evade) { A.st.evade = (A.st.evade ?? 0) + sk.evade; log.push(`　🌀 다음 공격 ${A.st.evade}번 회피`); }
  if (sk.atkUp) { A.st.atkUp = { pct: sk.atkUp[0], turns: sk.atkUp[1] }; log.push(`　💪 ${sk.atkUp[1]}턴 동안 공격력 +${P100(sk.atkUp[0])}`); }
  if (sk.defUp) { A.st.defUp = { pct: sk.defUp[0], turns: sk.defUp[1] }; log.push(`　🧱 ${sk.defUp[1]}턴 동안 방어력 +${P100(sk.defUp[0])}`); }
  if (sk.convert) { A.st.convert = { elem: sk.convert[0], turns: sk.convert[1] }; log.push(`　🧬 ${sk.convert[1]}턴 동안 ${A.name}의 속성이 **${elemTag(sk.convert[0])}** 으로 변했어요!`); }
  if (sk.maskSwap) { // 🎭 가면 바꿔쓰기: 상대의 약점 속성 중 하나로 변신 (상대 공격 속성이 내게 반감되는 쪽 우선)
    const foeEl = effElems(B).filter((e) => e !== 'normal');
    if (!foeEl.length) log.push(`　💨 ${B.name}은(는) 약점이 없는 무속성이라 변신이 불발됐어요… (나머지 효과는 그대로예요)`);
    else {
      const weak = ALL_ELEMS.filter((e) => foeEl.some((f) => ELEM_CHART[e].strong.includes(f)));
      const foeAtk = effElems(B)[0];
      const good = weak.filter((e) => ELEM_CHART[foeAtk]?.weak.includes(e));
      const pool = good.length ? good : weak.length ? weak : ALL_ELEMS;
      const e = pool[Math.floor(rng() * pool.length)];
      A.st.convert = { elem: e, turns: sk.maskSwap };
      log.push(`　🎭 ${B.name}의 약점을 읽고 **${elemTag(e)}** 가면으로 바꿔 썼어요! (${sk.maskSwap}턴)`);
    }
  }
  if (sk.shieldCounter) { // 🛡️ 서리 비늘: 보호막이 깨지면 반격 (유효턴이 지나면 반격만 사라져요)
    const [cp, cd, cdt, dur] = sk.shieldCounter;
    A.st.shieldCounter = { pow: cp, def: cd, dturns: cdt, turns: dur + 1, elem: sk.elem };
    log.push(`　❄️ ${dur}턴 안에 보호막이 깨지면 서리 반격이 나가요!`);
  }
  if (sk.transfer) { A.st.transfer = { pct: sk.transfer[0], turns: sk.transfer[1] + 1, pending: 0 }; log.push(`　🕳️ ${sk.transfer[1]}턴 동안 받는 피해의 ${P100(sk.transfer[0])}가 상대에게 전이돼요!`); }
  if (sk.dive) { A.st.dive = { pow: sk.dive[0], pierce: sk.dive[1], stun: sk.dive[2], turns: sk.dive[3], elem: sk.elem }; log.push(`　🦅 하늘로 날아올랐어요! ${sk.dive[3]}번째 턴이 끝날 때 낙하해요`); }
  if (sk.speedRev) { // 🔁 얼음 감옥: 속도 역전 (양쪽 모두에 걸려요 · 상대가 스킬 면역이면 내 쪽에만 걸려도 역전은 그대로예요)
    A.st.speedRev = { turns: sk.speedRev + 1 };
    if (!B.st.skillImmune) B.st.speedRev = { turns: sk.speedRev + 1 };
    log.push(`　🔁 ${sk.speedRev}턴 동안 **속도 역전**! 스피드가 낮은 쪽이 먼저 움직여요`);
  }
  if (sk.ward) { A.st.ward = { turns: sk.ward }; log.push(`　🔮 ${sk.ward}턴 동안 속성 약점을 막아주는 방벽이 쳐졌어요`); }
  // 🆕 12차 확장 (완전 신규 매커니즘 1차 배치):
  if (sk.burnPact) { // 🔥 타오르는 카운트다운: 매 턴 최대 체력 % 자해(멈출 수 없음) 대신 공격력이 턴마다 복리로 불어나요
    A.st.burnPact = { hp: sk.burnPact[0], step: sk.burnPact[1], mult: 1 };
    log.push(`　🔥 **도화선**에 불이 붙었어요! 매 턴 최대 체력의 ${P100(sk.burnPact[0])}씩 타들어가는 대신, 턴마다 공격력이 ${P100(sk.burnPact[1])}씩 복리로 불어나요 (멈출 수 없어요)`);
  }
  if (sk.soulSwap) { // 👽 신체 강탈: N턴 동안 나와 상대의 공격력·방어력·스피드를 완전히 맞바꿔요
    const turns = sk.soulSwap;
    const origA = { atk: A.atk, def: A.def, spd: A.spd };
    const origB = { atk: B.atk, def: B.def, spd: B.spd };
    A.atk = origB.atk; A.def = origB.def; A.spd = origB.spd;
    B.atk = origA.atk; B.def = origA.def; B.spd = origA.spd;
    A.st.soulSwap = { turns: turns + 1, orig: origA };
    B.st.soulSwap = { turns: turns + 1, orig: origB };
    log.push(`　👽 **신체 강탈!** ${turns}턴 동안 ${A.name}과(와) ${B.name}의 공격력·방어력·스피드가 완전히 뒤바뀌어요!`);
  }
  if (sk.crystalVault) { // 💎 굴절 저장소: 기절·약화·지속피해 디버프를 N턴 동안 저장했다가 한 번에 되돌려요
    A.st.crystalVault = { turns: sk.crystalVault[0], stored: 0, mult: sk.crystalVault[1] };
    log.push(`　💎 **굴절 저장소**가 열렸어요! ${sk.crystalVault[0]}턴 동안 들어오는 기절·약화·지속피해가 전부 결정에 저장돼요`);
  }
  if (sk.orbit) { // ☄️ 영구 공전: 이후 interval 턴마다 저절로 낙하해요 (전투가 끝날 때까지)
    const [pow, pierce, stun, interval] = sk.orbit;
    A.st.orbit = { pow, pierce, stun, interval, turns: interval, elem: sk.elem };
    log.push(`　☄️ **귀환 궤도**에 올랐어요! 이후 ${interval}턴마다 저절로 낙하해요 (전투가 끝날 때까지)`);
  }
  if (sk.brandChain) { // 🔗 낙인의 연쇄: 쌓인 스택만큼 지금 터뜨리고, 이번 시전으로 쌓일 화상은 뒤에서 새로 셈
    const bc = sk.brandChain;
    const stack = Math.min(bc.cap, A.st.brandStack ?? 0);
    if (stack > 0 && B.hp > 0 && !B.st.skillImmune) {
      let total = 0;
      for (let i = 0; i < stack && B.hp > 0; i++) {
        const base = Math.max(effAtk(A) * 0.25, effAtk(A) - effDef(B) * 0.5) * bc.hitPow * elemClash(skElem, B, { attacker: A }).mult * (0.85 + rng() * 0.3);
        const hit = mitigate(B, Math.max(1, Math.round(base)));
        B.hp = Math.max(0, B.hp - hit.dmg);
        total += hit.dmg;
        afterHit(B, A, hit.dmg, log);
      }
      log.push(`　🔗 **낙인의 연쇄!** 쌓여 있던 낙인 ${stack}개가 동시에 터져요! ${B.name}에게 총 **${total}** 피해`);
      A.st.brandStack = 0;
    } else if (B.st.skillImmune && (A.st.brandStack ?? 0) > 0) log.push(`　🧿 ${B.name}은(는) 스킬 면역! 쌓인 낙인이 불발됐어요`);
  }
  // 🆕 2차 확장: 마나 늘리기 · 공격력 폭주 · 디버프→버프 · 모아니면도 · 방어력→공격력
  if (sk.manaMaxUp) {
    A.manaMax += sk.manaMaxUp[0];
    A.st.manaMaxUp = { amt: sk.manaMaxUp[0], turns: sk.manaMaxUp[1] };
    log.push(`　🔷 ${sk.manaMaxUp[1]}턴 동안 최대 마나 +${sk.manaMaxUp[0]}`);
  }
  if (sk.manaRegenUp) { A.st.manaRegenUp = { amt: sk.manaRegenUp[0], turns: sk.manaRegenUp[1] }; log.push(`　🔋 ${sk.manaRegenUp[1]}턴 동안 턴마다 차는 마나 +${sk.manaRegenUp[0]}`); }
  if (sk.burstAtk) { A.st.burst = { mult: sk.burstAtk[0], turns: sk.burstAtk[1] }; log.push(`　🔥 다음 ${Math.max(1, sk.burstAtk[1] - 1)}턴 동안 공격력이 **×${sk.burstAtk[0]}배**가 돼요!`); }
  if (sk.debuffToBuff) {
    let n = 0;
    if (A.st.atkDown) { A.st.atkUp = { pct: (A.st.atkUp?.pct ?? 0) + A.st.atkDown.pct, turns: A.st.atkDown.turns }; delete A.st.atkDown; n++; }
    if (A.st.defDown) { A.st.defUp = { pct: (A.st.defUp?.pct ?? 0) + A.st.defDown.pct, turns: A.st.defDown.turns }; delete A.st.defDown; n++; }
    if (A.st.stun) { delete A.st.stun; n++; }
    log.push(n ? '　🔄 나쁜 효과가 전부 좋은 효과로 바뀌었어요!' : '　💨 바꿀 나쁜 효과가 없었어요…');
  }
  if (sk.coinflip) { A.st.coinflip = { turns: sk.coinflip }; log.push(`　🎲 ${sk.coinflip}턴 동안 받는 피해가 50% 확률로 1.5배, 50% 확률로 0이 돼요!`); }
  if (sk.defToAtk) { A.st.defToAtk = { amt: A.def, turns: sk.defToAtk }; log.push(`　⚔️ ${sk.defToAtk}턴 동안 방어력을 전부 공격력으로 바꿨어요!`); }
  if (sk.priority) { A.st.priority = { turns: sk.priority + 1 }; log.push(`　⏱️ 다음 ${sk.priority}턴 동안 무조건 먼저 움직여요!`); } // +1: 이번 턴 끝 감소분
  if (sk.pigeon) { // 🕊️ 비둘기 소환: 체력은 상대 최대 체력 비율, 이번 턴 남은 행동과 다음 턴 동안 대신 맞아요
    const [hpR, share, steal, taunt, turns] = sk.pigeon;
    const hp = Math.max(1, Math.round(B.max * hpR));
    A.st.pigeon = { hp, max: hp, share, steal, taunt, turns };
    log.push(`　🕊️ **비둘기**가 날아왔어요! 체력 ${hp} (상대 최대 체력의 ${P100(hpR)}) · 스킬 피해의 ${P100(share)}를 대신 맞고, 기본 공격은 전부 비둘기가 ×${taunt} 로 맞아요 (${turns}턴 · 매 턴 상대 마나 ${steal} 강탈)`);
  }
  if (sk.clone) {
    const [ar, dr, turns] = sk.clone;
    A.st.clone = { atk: Math.round(effAtk(A) * ar), hp: Math.max(10, Math.round(effDef(A) * dr * CLONE_HP_PER_DEF)), turns, boom: sk.cloneBoom ? Math.round(effAtk(A) * sk.cloneBoom) : 0 };
    log.push(`　👥 분신 소환! (공격력 ${A.st.clone.atk} · 체력 ${A.st.clone.hp} · ${turns}턴) — 같이 공격하고 받는 피해의 ${P100(CLONE_SHARE)}를 대신 맞아요${A.st.clone.boom ? ` · 쓰러지거나 끝나면 ${A.st.clone.boom} 폭발!` : ''}`);
  }
  if (sk.reflect) { A.st.reflect = { pct: sk.reflect[0], turns: sk.reflect[1] }; log.push(`　🪞 ${sk.reflect[1]}턴 동안 받은 피해의 ${P100(sk.reflect[0])}를 되돌려줘요`); }
  if (sk.reflectDebuff) { A.st.reflectDebuff = { turns: sk.reflectDebuff }; log.push(`　🔮 ${sk.reflectDebuff}턴 동안 걸리는 디버프를 상대에게 되돌려요`); }
  if (sk.devilDeal) { // 😈 악마와의 거래: 턴 동안 확정 급소+약점, 못 쓰러뜨리면 준 피해 × 배수를 무효화 불가 피해로 (tickSide 에서 정산)
    A.st.devil = { turns: sk.devilDeal[0] + 1, mult: sk.devilDeal[1], dealt: 0 }; // +1: 이번 턴 끝 감소분
    log.push(`　😈 **악마와 거래했어요!** ${sk.devilDeal[0]}턴 동안 모든 공격이 확정 급소 + 약점! 하지만 못 쓰러뜨리면 준 피해의 ×${sk.devilDeal[1]} 를 무효화 불가 피해로 받아요…`);
  }
  if (sk.allElem) { // 🌈 속성 전체 부여: turns 는 guard·ward 처럼 이번 턴부터 센 턴 수예요
    A.st.allElem = { mode: sk.allElem[0], turns: sk.allElem[1] };
    log.push(`　🌈 ${sk.allElem[1]}턴 동안 ${A.name}에게 ${{ attack: '모든 속성으로 공격하는 힘이', defend: '모든 속성이 깃든 몸이', both: '모든 속성의 힘과 몸이' }[sk.allElem[0]] ?? '모든 속성이'} 생겼어요!`);
  }
  if (sk.sunVerdict) { // ☀️ 태양의 심판: 햇빛 충전 시작
    const c = sk.sunVerdict;
    A.st.sunCharge = { ...c, turns: c.charge, elem: sk.elem };
    log.push(`　☀️ 햇빛을 모으기 시작했어요! ${c.charge}번째 턴이 끝날 때 내리쳐요 (충전 중 받는 피해 -${P100(c.guard)} · 기절하지 않아요)`);
  }
  if (sk.sunrise) { // 🌅 일출의 가호
    const c = sk.sunrise;
    A.st.sunrise = { turns: c.turns, atk: c.step, step: c.step, cap: c.cap, regen: c.regen, guard: c.guard, after: c.after };
    log.push(`　🌅 해가 떠올라요! ${c.turns}턴 동안 공격력이 매 턴 +${P100(c.step)}씩 쌓이고 회복 · 피해 감소가 붙어요 (지금 +${P100(c.step)})`);
  }
  if (sk.trumpet) { // 👼 심판의 나팔
    const c = sk.trumpet;
    A.st.trumpet = { ...c, seen: 0, firstGuard: c.guard, elem: sk.elem };
    log.push(`　👼 나팔이 울려 퍼져요… ${c.turns}번째 턴이 끝날 때 심판이 내려요! (그동안 상대가 쓰는 스킬이 죄가 돼요 · 첫 피해 -${P100(c.guard)})`);
  }
  if (sk.angelRefund) { // 😇 천사의 치유
    const c = sk.angelRefund;
    A.st.angelRefund = { turns: c.turns, rate: c.rate, left: Math.round(A.max * c.cap), shield: c.shield };
    log.push(`　😇 ${c.turns}턴 동안 받은 피해의 ${P100(c.rate)}를 돌려받아요! (총 ${A.st.angelRefund.left}까지 · 넘친 회복은 보호막)`);
  }
  if (sk.chaos) castChaos(sk, A, B, rng, log, immune);
  if (sk.lootReserve) { A.st.lootReserve = true; log.push(`　🎁 **보물 각성!** 이번 전투에서 처음 들어오는 보상이 ${LOOT_RESERVE_MULT}배가 돼요 (이기거나 잡아야 받아요)`); }
  if (sk.goldSave) { A.st.goldSave = snapGold(A); log.push(`　🏆 이 순간을 황금 속에 **저장**했어요! (체력 ${A.hp}/${A.max} · 마나 ${Math.round(A.mana)} · 지금의 버프·디버프) — 쓰러지면 이때로 되돌아가요`); }
  if (sk.fateReplay) castFate(A, B, rng, log);
  if (sk.whoIs) { A.st.whoIs = { pct: sk.whoIs[0], turns: sk.whoIs[1] }; log.push(`　🎭 ${sk.whoIs[1]}턴 동안 상대의 공격이 ${P100(sk.whoIs[0])} 확률로 상대 자신에게 들어가요!`); }
  if (sk.catchPro) { // 🪢 포획 전문가: 유효 턴 동안 도망을 막고 포획률 상승 (붙잡았을 때의 제한 턴 연장은 catchProHold 가 해요)
    const dur = catchProTurns(sk);
    A.st.catchPro = { bonus: sk.catchPro[0], extra: sk.catchPro[1], turns: dur + 1, held: A.st.catchPro?.held ?? false }; // +1: 이번 턴 끝 감소분
    log.push(`　🪢 ${dur}턴 동안 야생 펫이 도망치려 하면 확정으로 붙잡아요! 포획률 **+${P100(sk.catchPro[0])}p**`);
  }
  if (sk.fightBuff) { // 📈 전투 중 버프: 이번 전투가 끝날 때까지 쌓여요 (한도 FIGHT_BUFF_CAP)
    const fb = (A.st.fightBuff ??= {});
    for (const [k, v] of Object.entries(sk.fightBuff)) fb[k] = Math.min(FIGHT_BUFF_CAP[k] ?? 1, (fb[k] ?? 0) + v);
    log.push(`　📈 이번 전투 동안 ${fightBuffText(sk.fightBuff)}! (지금까지 쌓인 효과: ${fightBuffText(fb)})`);
  }
  if (sk.curse) { // 🧿 금단의 저주: 나 자신에게 랜덤 디버프 N개 · 이 칸이 저주부여로 바뀌어요
    const [cnt, turns] = sk.curse;
    const pool = CURSE_POOL.slice();
    const picked = [];
    for (let i = 0; i < cnt && pool.length; i++) picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    for (const c of picked) putCurse(A, c, 1, turns);
    A.st.cursed = { list: picked, turns, dur: turns };
    const slot = (A.skills ?? []).indexOf(sk.id);
    if (slot >= 0) A.skills[slot] = 'curse_grant';
    log.push(`　🧿 ${A.name}에게 저주가 걸렸어요! ${picked.map((c) => CURSE_LABEL[c.k]).join(' · ')} (${turns}턴)${slot >= 0 ? ' — 다음 턴, 이 스킬이 **저주부여**로 바뀌어요' : ''}`);
  }
  if (sk.swallow) { // 🐛 모래 삼키기: 내 공격 스킬 중 위력이 가장 높은 것을 삼켜요
    const [turns, maxUp, hpPct] = sk.swallow;
    const score = (x) => (x.pow ?? 0) * (x.hitsRange ? (x.hitsRange[0] + x.hitsRange[1]) / 2 : (x.hits ?? 1));
    const cand = (A.skills ?? []).map((id) => SKILLS[id]).filter((x) => x && x.id !== sk.id && x.pow > 0 && !x.joker && !x.hidden && !x.swallow && !x.pride && !x.lastLaugh && !x.copy);
    cand.sort((a, b) => score(b) - score(a));
    const eat = cand[0];
    if (eat) {
      A.st.swallow = { id: eat.id, left: turns, fresh: true, maxUp, hpPct };
      log.push(`　🐛 ${eat.emoji} **${eat.name}**을(를) 꿀꺽 삼켰어요! 다음 턴부터 ${turns}턴 동안 매 턴 마나·쿨타임 없이 저절로 터져요 (스킬 면역도 뚫어요)`);
    } else log.push('　🐛 삼킬 만한 공격 스킬이 없었어요…');
  }
  if (sk.pride) { // 👿 군주의 오만: 상대의 방어·스피드·공격력 무시 → 이후 상대 스킬 되돌리기 (전투당 1회)
    const [nullTurns, reflectTurns, reflectMax, times] = sk.pride;
    A.st.prideUsed = true;
    A.st.priority = { turns: nullTurns + 1 };
    if (B.st.skillImmune) log.push(`　🧿 ${B.name}은(는) 스킬 면역! 오만이 상대에게는 통하지 않았어요 (선공만 얻어요)`);
    else { B.st.prideNull = { turns: nullTurns + 1 }; log.push(`　👿 ${nullTurns}턴 동안 ${B.name}의 **방어력·스피드·공격력은 무시**돼요! (내 공격은 방어 관통 · 항상 선공 · 상대의 공격은 최소 피해)`); }
    A.st.prideReflect = { turns: reflectTurns + 1, left: reflectMax, times };
    log.push(`　👿 ${reflectTurns}턴 동안 ${B.name}이(가) 내게 건 스킬을 최대 ${reflectMax}개까지 **${times}번씩 되돌려요** (마나 0)`);
  }
  if (sk.lastLaugh) { // 🃏 광대의 마지막 웃음: 최대마나 확장 → 마나 가득 → 스킬 연속 시전 → 이 칸은 조커로
    const [perHit, maxChain] = sk.lastLaugh;
    A.st.lastLaughUsed = true;
    const add = (A.st.hitCount ?? 0) * perHit;
    if (add > 0) { A.manaMax += add; A.st.manaBonus = (A.st.manaBonus ?? 0) + add; }
    A.mana = A.manaMax;
    log.push(`　🃏 마지막 웃음! 맞은 ${A.st.hitCount ?? 0}번 × ${perHit} = 최대 마나 **+${add}** (${A.manaMax}) · 마나가 가득 찼어요`);
    const slot = (A.skills ?? []).indexOf(sk.id);
    if (slot >= 0) { A.skills[slot] = 'joker'; log.push('　🃏 이 카드는 이제 **조커**로 바뀌었어요 (이번 전투 동안만)'); }
    let n = 0;
    while (n < maxChain && A.hp > 0 && B.hp > 0 && !A.st.sealed) {
      const pool = (A.skills ?? []).map((id) => SKILLS[id]).filter((x) => x && !x.lastLaugh && !x.joker && !x.hidden && !x.catchPro && !x.fightBuff && A.mana >= x.cost && cdLeft(A.st, x.id) <= 0);
      if (!pool.length) break;
      const pick = pool[Math.floor(rng() * pool.length)];
      n++;
      log.push(`　🃏 (${n}/${maxChain}) 연속 시전!`);
      castSkill(pick, A, B, rng, log);
    }
    if (n === 0) log.push('　🃏 …하지만 쓸 수 있는 스킬이 없었어요');
  }
  if (firstMana) { A.mana += firstMana; log.push(`　🔋 선공 보너스 마나 +${firstMana}`); }
  if (sk.mana) { const n = Math.min(sk.mana, SKILL_CFG.manaMax + 1000); A.mana += n; log.push(`　🔋 마나 +${n}`); }
  if (sk.cleanse) {
    A.st.dots = []; delete A.st.atkDown; delete A.st.defDown; delete A.st.stun; delete A.st.frozen;
    log.push('　✨ 나쁜 상태가 사라졌어요');
    if (A.st.parasiteEgg) { // 🥚 불멸의 알: 정화하려는 순간 역으로 터져요
      const egg = A.st.parasiteEgg;
      delete A.st.parasiteEgg;
      const n = Math.max(1, Math.round(A.max * egg.pct));
      A.hp = Math.max(0, A.hp - n);
      log.push(`　🥚 정화하려 하자 숨어 있던 **기생 알**이 즉시 부화해 터졌어요! 방어 무시 **${n}** 피해`);
      afterHit(A, B, n, log);
    }
  }
  if (sk.potion) { // 🧪 마녀의 영약: 6가지 중 서로 다른 N개
    const foeOk = !B.st.skillImmune && B.hp > 0;
    const pool = [
      ['💖 체력 45% 회복', () => { const n = heal(A, A.max * 0.45); log.push(`　　💖 체력 +${n}`); }],
      ['💪 공격 +60% (3턴)', () => { A.st.atkUp = { pct: 0.6, turns: 3 }; log.push('　　💪 3턴 동안 공격력 +60%'); }],
      ['🧱 방어 +50% (3턴)', () => { A.st.defUp = { pct: 0.5, turns: 3 }; log.push('　　🧱 3턴 동안 방어력 +50%'); }],
      ['☠️ 독 8% (3턴)', () => { if (!foeOk) return log.push('　　💨 독이 막혔어요…'); B.st.dots = (B.st.dots ?? []).filter((d) => d.kind !== 'poison'); B.st.dots.push({ kind: 'poison', pct: 0.08, turns: 3 }); log.push(`　　☠️ ${B.name}에게 독 3턴!`); }],
      ['🔋 마나 +40', () => { A.mana += 40; log.push('　　🔋 마나 +40'); }],
      ['💫 상대 기절', () => { if (!foeOk) return log.push('　　💨 기절이 막혔어요…'); B.st.stun = 1; log.push(`　　💫 ${B.name}(이)가 기절했어요!`); }],
    ];
    const picked = [];
    for (let i = 0; i < sk.potion && pool.length; i++) picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    log.push(`　🧪 영약이 보글보글… **${picked.map((p) => p[0]).join(' + ')}**!`);
    for (const p of picked) p[1]();
  }
  // 🆕 배치 3: 쿨타임 삭제 · 부활 · 스킬 면역 · 능력치 룰렛 · 1회용 효과 이동(대기)
  if (sk.cdReset) {
    const had = Object.keys(A.st.cds ?? {}).length;
    if (sk.cdReset >= 99) A.st.cds = keepOnce(A.st.cds);
    else for (const id of Object.keys(A.st.cds ?? {})) if (A.st.cds[id] < 90 && (A.st.cds[id] -= sk.cdReset) <= 0) delete A.st.cds[id];
    log.push(had ? '　⏪ 스킬 쿨타임이 줄어들었어요!' : '　💨 줄일 쿨타임이 없었어요…');
  }
  if (sk.revive) { A.st.revive = { pct: sk.revive[0], turns: sk.revive[1] + 1, left: sk.revive[2] ?? 1, blast: sk.reviveBlast, maxUp: sk.reviveMaxUp, elem: sk.elem }; log.push(`　🪽 ${sk.revive[1]}턴 동안 쓰러져도 ${sk.reviveMaxUp ? `최대 체력 +${P100(sk.reviveMaxUp)}과 함께 ` : ''}체력 ${P100(sk.revive[0])}로 부활해요!`); }
  if (sk.skillImmune) { A.st.skillImmune = { turns: sk.skillImmune + 1 }; log.push(`　🧿 ${sk.skillImmune}턴 동안 스킬로 취급되는 효과를 전혀 받지 않아요!`); }
  if (sk.statRoll && (sk.statRoll[1] !== 'foe' || (!immune && B.hp > 0))) rollStats(sk, sk.statRoll[1] === 'foe' ? B : A, rng, log);
  if (sk.buffXfer && B.hp > 0) { A.st.xfer = { mode: sk.buffXfer[0], turns: sk.buffXfer[1] }; log.push(`　🧲 1회용 효과 이동을 준비했어요! (${sk.buffXfer[1]}턴 안에 한 번 발동)`); }
  // 🆕 독창 스킬: 상태이상 터뜨리기 (새 상태이상을 걸기 전에 먼저 터뜨려요)
  if (sk.detonate && B.hp > 0) {
    const left = (B.st.dots ?? []).reduce((n, d) => n + Math.max(1, Math.round(B.max * d.pct)) * d.turns, 0);
    if (left > 0) {
      const n = Math.max(1, Math.round(left * sk.detonate));
      B.hp = Math.max(0, B.hp - n);
      dealt += n;
      B.st.dots = [];
      log.push(`　💥 ${B.name}의 상태이상이 **폭발**해서 **${n}** 피해!`);
    } else {
      log.push('　💨 터뜨릴 상태이상이 없어요…');
    }
  }
  if (sk.swapHp && B.hp > 0) {
    const ra = A.hp / A.max;
    const rb = B.hp / B.max;
    if (ra < rb) {
      A.hp = Math.min(A.max, Math.max(1, Math.round(A.max * rb)));
      B.hp = Math.max(1, Math.round(B.max * ra));
      log.push(`　🔀 서로의 체력이 뒤바뀌었어요! ${A.name} ${A.hp}/${A.max} · ${B.name} ${B.hp}/${B.max}`);
    } else {
      log.push('　💨 내가 더 건강해서 아무 일도 일어나지 않았어요…');
    }
  }
  if (B.hp > 0) {
    if (sk.lamp) { B.st.lamp = { pct: sk.lamp[0], mana: sk.lamp[1], turns: sk.lamp[2] + 1 }; log.push(`　🕯️ ${B.name}에게 **불빛**을 달았어요! (${sk.lamp[2]}턴 · 스킬을 쓸 때마다 고정 피해 + 마나 감소)`); } // +1: 이번 턴 끝 감소분
    if (sk.mark) { B.st.huntMark = { turns: sk.mark[0] + 1, need: sk.mark[1], pct: sk.mark[2], stack: 0, bursts: 0 }; log.push(`　🎯 ${B.name}에게 **사냥 표식**을 새겼어요! (${sk.mark[0]}턴 · 맞을 때마다 스택, ${sk.mark[1]}스택에 폭발)`); }
    if (sk.bomb) {
      B.st.bomb = { dmg: Math.max(1, Math.round(effAtk(A) * sk.bomb[0] * elemMul)), turns: sk.bomb[1] };
      log.push(`　💣 ${B.name}에게 **시한폭탄**을 달았어요! (${sk.bomb[1]}턴 뒤 폭발)`);
    }
    if (sk.stealMana) {
      const n = Math.min(B.mana, sk.stealMana);
      B.mana -= n;
      A.mana += n;
      log.push(`　🧤 ${B.name}의 마나 ${n}을(를) 훔쳤어요!`);
    }
    if (sk.steal) {
      const [stat, pct, turns] = sk.steal;
      const [upKey, downKey, label] = { atk: ['atkUp', 'atkDown', '공격력'], def: ['defUp', 'defDown', '방어력'], spd: ['spdUp', 'spdDown', '스피드'] }[stat] ?? [];
      if (upKey) {
        A.st[upKey] = { pct: (A.st[upKey]?.pct ?? 0) + pct, turns };
        B.st[downKey] = { pct: (B.st[downKey]?.pct ?? 0) + pct, turns };
        log.push(`　🧲 ${B.name}의 ${label} ${P100(pct)}을(를) 훔쳤어요! (${turns}턴)`);
      }
    }
    if (sk.stealSpd) { // 🎪 불의 링 통과: 상대가 나보다 빠르면 앞의 능력치, 같거나 느리면 뒤의 능력치를 훔쳐요 (시전하는 순간의 스피드로 비교)
      const [fastStat, slowStat, pct, turns] = sk.stealSpd;
      const faster = effSpd(B) > effSpd(A);
      const stat = faster ? fastStat : slowStat;
      const [upKey, downKey, label] = { atk: ['atkUp', 'atkDown', '공격력'], def: ['defUp', 'defDown', '방어력'] }[stat] ?? [];
      if (upKey) {
        A.st[upKey] = { pct: (A.st[upKey]?.pct ?? 0) + pct, turns };
        B.st[downKey] = { pct: (B.st[downKey]?.pct ?? 0) + pct, turns };
        log.push(`　🎪 ${B.name}이(가) 나보다 ${faster ? '**빨라서**' : '**느려서**'} ${label} ${P100(pct)}을(를) 빼앗았어요! (${turns}턴)`);
      }
    }
    if (sk.turnCut) {
      let cut = 0;
      for (const k of ['atkUp', 'defUp', 'guard', 'regen']) {
        if (B.st[k]?.turns) { B.st[k].turns = Math.max(0, B.st[k].turns - sk.turnCut); if (B.st[k].turns <= 0) delete B.st[k]; cut++; }
      }
      log.push(cut ? `　⏳ ${B.name}의 좋은 효과 지속시간이 ${sk.turnCut}턴 줄었어요!` : '　💨 줄일 효과가 없었어요…');
    }
    // 🔮 거울 장막: 디버프를 쓴 쪽에게 되돌려요
    const hasDebuff = sk.winter || sk.pharaoh || sk.reign || sk.freeze || sk.spdDown || sk.drowsy || sk.healCut || sk.atkDown || sk.powDown || sk.manaDown || (sk.defDown && sk.defDown[0] > 0) || sk.stun || sk.dot || sk.drainMana || sk.curseGrant || sk.lockSkills || sk.thorns || sk.mindCtl || sk.swampBloom;
    const T = B.st.reflectDebuff && hasDebuff ? A : B;
    if (T !== B) log.push(`　🔮 ${B.name}의 거울 장막! 디버프가 ${A.name}에게 되돌아가요!`);
    // 💎 굴절 저장소: 기절·약화(공방↓)·지속피해가 T에게 들어오면 적용 대신 결정에 저장
    if (T.st.crystalVault) {
      const vaultKinds = [sk.stun && 'stun', sk.atkDown && 'atkDown', (sk.defDown && sk.defDown[0] > 0) && 'defDown', sk.dot && 'dot'].filter(Boolean);
      if (vaultKinds.length) {
        T.st.crystalVault.stored += vaultKinds.length;
        log.push(`　💎 ${T.name}의 굴절 저장소가 디버프를 흡수했어요! (저장 ${T.st.crystalVault.stored}개)`);
        sk = { ...sk };
        for (const k of vaultKinds) { if (k === 'defDown') sk.defDown = [0, sk.defDown[1]]; else delete sk[k]; }
      }
    }
    if (sk.thorns) { // 🌵 보석 가시
      T.st.thorns = { n: sk.thorns.n, per: sk.thorns.per, turns: sk.thorns.turns + 1 };
      log.push(`　🌵 ${T.name}의 몸에 **보석 가시 ${sk.thorns.n}개**가 박혔어요! ${A.name}을(를) 때릴 때마다 스스로 다쳐요`);
    }
    if (sk.mindCtl) { // 👽 정신 지배
      T.st.mindCtl = { uses: sk.mindCtl[0], turns: sk.mindCtl[1] + 1 };
      log.push(`　👽 ${T.name}의 정신이 흔들려요! ${sk.mindCtl[1]}턴 안에 쓰는 다음 공격 스킬은 자기 자신을 향해요`);
    }
    if (sk.undyingHex) { // 🧟 불멸의 저주: 턴이 아니라 "상대가 나(시전자)를 때린 횟수"로 옅어져요
      const [ap, dp, hits] = sk.undyingHex;
      T.st.undyingHex = { atk: ap, def: dp, hitsLeft: hits };
      log.push(`　🧟 ${T.name}에게 **불멸의 저주**! 공격력 -${P100(ap)} · 방어력 -${P100(dp)} — ${A.name}을(를) **${hits}번** 때려야 풀려요 (턴으로는 안 풀려요)`);
    }
    if (sk.parasiteEgg) { // 🥚 불멸의 알: 상대가 정화를 쓰면 즉시 부화해 터져요
      T.st.parasiteEgg = { pct: sk.parasiteEgg[0], turns: sk.parasiteEgg[1] + 1 };
      log.push(`　🥚 ${T.name}에게 **기생 알**을 심었어요… 정화 효과를 쓰면 즉시 부화해 터져요`);
    }
    if (sk.winter) { // ❄️ 영원한 겨울
      const c = sk.winter;
      T.st.winter = { ...c, hitDone: false };
      T.st.frost = { n: T.st.frost?.n ?? 0, spd: c.spd };
      log.push(`　❄️ ${T.name}에게 **영원한 겨울**이 내려앉아요! (${c.turns}턴 · 매 턴 서리 +1 · 마나 -${c.mana} · 서리 ${c.max}스택이면 동결)`);
    }
    if (sk.reign) { // 👹 화염 군림
      const c = sk.reign;
      T.st.reign = { turns: c.turns, stacks: 0, max: c.max, pct: c.pct, fire: c.fire };
      log.push(`　👹 ${T.name}은(는) ${c.turns}턴 동안 스킬을 쓸 때마다 불타요! (최대 ${c.max}스택)`);
    }
    if (sk.pharaoh) { // ⚰️ 파라오의 저주
      const c = sk.pharaoh;
      T.st.pharaoh = { turns: c.turns, flip: c.flip, rot: c.rot, shield: c.shield, healed: false };
      log.push(`　⚰️ ${T.name}의 회복이 ${c.turns}턴 동안 저주로 뒤집혀요! (회복의 ${P100(c.flip)}가 피해 · 보호막 부식 · 회복 못 하면 저주 피해)`);
    }
    if (sk.healCut) { T.st.healCut = { pct: sk.healCut[0], turns: sk.healCut[1] }; log.push(`　🚑 ${T.name}의 회복 효과 -${P100(sk.healCut[0])} (${sk.healCut[1]}턴)`); }
    if (sk.spdDown) { T.st.spdDown = { pct: sk.spdDown[0], turns: sk.spdDown[1] + 1 }; log.push(`　🐌 ${T.name} 스피드 -${P100(sk.spdDown[0])} (${sk.spdDown[1]}턴)`); } // +1: 이번 턴 끝 감소분
    if (sk.drowsy) {
      if (T.st.stun || T.st.drowsy) log.push(`　💨 ${T.name}은(는) 이미 기절/졸음 상태라 졸음이 불발됐어요`);
      else { T.st.drowsy = { turns: sk.drowsy }; log.push(`　😴 ${T.name}에게 졸음이 몰려와요… (${sk.drowsy}번째 턴이 끝날 때 잠들어요 · 그 전에 맞으면 깨져요)`); }
    }
    if (sk.atkDown) { T.st.atkDown = { pct: sk.atkDown[0], turns: sk.atkDown[1] }; log.push(`　🔻 ${T.name} 공격력 -${P100(sk.atkDown[0])} (${sk.atkDown[1]}턴)`); }
    if (sk.defDown && sk.defDown[0] > 0) { T.st.defDown = { pct: sk.defDown[0], turns: sk.defDown[1] }; log.push(`　🔻 ${T.name} 방어력 -${P100(sk.defDown[0])} (${sk.defDown[1]}턴)`); }
    if (sk.powDown) { T.st.powDown = { pct: sk.powDown[0], turns: sk.powDown[1] }; log.push(`　🔻 ${T.name} 스킬 위력 -${P100(sk.powDown[0])} (${sk.powDown[1]}턴)`); }
    if (sk.manaDown) { // 🔽 늪 마녀의 저주: 지금 마나를 깎고, 기간 동안 최대 마나도 깎아요 (최대 마나는 겹쳐 깎이지 않고 기간만 갱신돼요)
      const before = Math.round(T.mana);
      T.mana = Math.round(T.mana * (1 - sk.manaDown[0]));
      if (T.st.manaDown) T.st.manaDown.turns = sk.manaDown[1];
      else {
        const cut = T.manaMax - Math.max(MANA_DOWN_MIN, Math.round(T.manaMax * (1 - sk.manaDown[0])));
        T.manaMax -= cut;
        T.st.manaDown = { pct: sk.manaDown[0], turns: sk.manaDown[1], cut };
      }
      log.push(`　🔽 ${T.name} 마나 ${before} → ${T.mana} · ${sk.manaDown[1]}턴 동안 최대 마나 ${T.manaMax}`);
    }
    if (sk.stun && rng() < sk.stun) {
      T.st.stun = 1;
      log.push(`　💫 ${T.name}(이)가 **기절**했어요!`);
      if (T === B && sk.stun < 1) recordLuck(A.st, 'stun', effAtk(A) * 1.5);
    }
    if (sk.freeze) { T.st.frozen = { turns: sk.freeze }; log.push(`　🧊 ${T.name}(이)가 **꽁꽁 얼었어요**! (최대 ${sk.freeze}턴 · 행동할 때마다 ${P100(FROZEN_CFG.breakChance)} 확률로 깨져요 · 얼어 있는 동안 받는 피해 ×${FROZEN_CFG.dmgMult})`); }
    if (sk.dot && sk.needHit && landed === 0) log.push(`　💨 한 대도 안 맞아서 ${DOT[sk.dot[0]] ?? sk.dot[0]}은(는) 걸리지 않았어요`);
    else if (sk.dot && rng() < sk.dot[3]) {
      T.st.dots = (T.st.dots ?? []).filter((d) => d.kind !== sk.dot[0]);
      T.st.dots.push({ kind: sk.dot[0], pct: sk.dot[1], turns: sk.dot[2] });
      log.push(`　${DOT[sk.dot[0]] ?? sk.dot[0]} ${T.name}에게 ${sk.dot[2]}턴 동안!`);
      if (T === B && sk.dot[3] < 1) recordLuck(A.st, 'dot', B.max * sk.dot[1] * sk.dot[2], { dot: [...sk.dot.slice(0, 3)] });
      if (sk.brandChain && sk.dot[0] === 'burn') { A.st.brandStack = (A.st.brandStack ?? 0) + 1; log.push(`　🔗 낙인 스택 **${A.st.brandStack}**`); } // 🔗 낙인의 연쇄: 화상을 걸 때마다 스택 적립
    }
    if (sk.swampBloom) { // 🧙 늪 마녀의 저주: 나쁜 효과가 더 오래가고, 많이 걸릴수록 독기가 피어올라요
      let ext = 0;
      for (const k of ['atkDown', 'defDown', 'spdDown', 'powDown', 'manaDown', 'healCut']) if (T.st[k]?.turns) { T.st[k].turns += sk.swampBloom[0]; ext++; }
      for (const d of T.st.dots ?? []) { d.turns += sk.swampBloom[0]; ext++; }
      const c = debuffCount(T.st);
      const n = Math.max(1, Math.round(T.max * sk.swampBloom[1] * c));
      T.hp = Math.max(0, T.hp - n);
      log.push(`　🧙 늪이 깊어져요! ${T.name}의 나쁜 효과 ${ext}개가 +${sk.swampBloom[0]}턴 · 독기가 피어올라 (${c}종) 방어 무시 **${n}** 피해`);
    }
    if (sk.lockSkills) { T.st.sealed = { turns: 9999, perm: true }; log.push(`　🔏 ${T.name}의 스킬이 **이번 전투 동안 영구 봉인**됐어요!`); }
    if (sk.drainMana) { const n = Math.min(T.mana, sk.drainMana); T.mana -= n; if (n) log.push(`　🔻 ${T.name} 마나 -${n}`); }
    if (sk.curseGrant && A.st.cursed) { // 🪬 저주부여: 저주로 받은 디버프를 ×배수 위력으로
      const rec = A.st.cursed;
      for (const c of rec.list) putCurse(T, c, sk.curseGrant, rec.dur);
      log.push(`　🪬 저주가 **×${sk.curseGrant}** 로 커져서 ${T.name}에게! ${rec.list.map((c) => CURSE_LABEL[c.k]).join(' · ')} (${rec.dur}턴)`);
      delete A.st.cursed;
      revertCurseSlots(A.skills, A.st); // 칸이 다시 금단의 저주로
    }
  }
  if (sk.echo) { A.st.echo = { turns: sk.echo }; log.push(`　🔊 ${sk.echo}턴 안에 쓰는 다음 공격 스킬이 메아리쳐요`); }
  // 🆕 메아리: 메아리가 켜진 상태에서 공격 스킬을 쓰면 위력 75% 로 한 번 더 (마나 0)
  if (A.st.echo && sk.pow && !sk.echoed && A.hp > 0 && B.hp > 0) {
    delete A.st.echo;
    log.push('　🔊 메아리가 울려 퍼져요!');
    castSkill({ id: sk.id, name: `${sk.name} (메아리)`, emoji: sk.emoji, tier: sk.tier, cost: 0, pow: sk.pow * 0.75, hitPows: sk.hitPows?.map((x) => x * 0.75), hits: sk.hits, hitsRange: sk.hitsRange, pierce: sk.pierce, crit: sk.crit, exec: sk.exec, elem: sk.elem, weakBonus: sk.weakBonus, ignoreResist: sk.ignoreResist, echoed: true }, A, B, rng, log);
  }
  const pr = B.st.prideReflect; // 👿 군주의 오만: 나(B)를 향한 스킬을 되돌려요 (되돌린 스킬은 다시 반사되지 않아요)
  if (prideHostile && pr && pr.left > 0 && A.hp > 0 && B.hp > 0 && !sk.pride) {
    pr.left--;
    for (let i = 1; i <= pr.times && A.hp > 0 && B.hp > 0; i++) {
      log.push(`　👿 ${B.name}의 오만이 ${sk.emoji} **${sk.name}**을(를) 되돌려요! (${i}/${pr.times})`);
      castSkill({ ...sk, name: `${sk.name} (오만 반사)`, cost: 0, copied: true, reflected: true, srcId: sk.id, cd: 0 }, B, A, rng, log);
    }
    if (pr.left <= 0) delete B.st.prideReflect;
  }
  finishCast(A, B, log);
}
function finishCast(A, B, log) { // 🪽 이번 스킬로 쓰러졌다면 부활 판정 · 뒤집힌 회복 글 · 마나 한도
  tryRevive(A, log, B);
  tryRevive(B, log, A);
  flushQ(A, log); flushQ(B, log);
  A.mana = Math.min(A.mana, A.manaMax);
}

// 턴이 끝날 때 한쪽에게 일어나는 일: 지속 피해 · 회복 · 남은 턴 줄이기 · (gainMana 일 때만) 마나 +manaPerTurn
// gainMana: 이번 턴에 기본 공격을 했을 때만 true 로 넘겨요. 스킬을 쓴 턴에는 마나가 안 차요.
export function tickSide(X, log, gainMana = true, foe = null) {
  const st = X.st;
  const immune = !!st.skillImmune; // 🧿 스킬 면역이면 스킬로 걸린 지속 피해·폭탄은 효과가 없어요
  for (const d of st.dots ?? []) {
    if (immune) log.push(`🧿 ${X.name}은(는) 스킬 면역! ${DOT[d.kind] ?? d.kind} 피해를 안 받아요`);
    else {
      const n = Math.max(1, Math.round(X.max * d.pct));
      X.hp = Math.max(0, X.hp - n);
      log.push(`${DOT[d.kind] ?? d.kind} ${X.name}(이)가 **${n}** 피해`);
    }
    d.turns -= 1;
  }
  st.dots = (st.dots ?? []).filter((d) => d.turns > 0);
  if (st.bomb) {
    st.bomb.turns -= 1;
    if (st.bomb.turns <= 0) {
      if (immune) log.push(`🧿 ${X.name}은(는) 스킬 면역! 시한폭탄이 불발됐어요`);
      else {
        const n = Math.max(1, Math.round(st.bomb.dmg));
        X.hp = Math.max(0, X.hp - n);
        log.push(`💣 ${X.name}에게 **시한폭탄**이 터졌어요! **${n}** 피해`);
      }
      delete st.bomb;
    }
  }
  if (st.burnPact && X.hp > 0) { // 🔥 타오르는 카운트다운: 멈출 수 없는 자해 + 복리로 불어나는 공격력
    const n = Math.max(1, Math.round(X.max * st.burnPact.hp));
    X.hp = Math.max(0, X.hp - n);
    st.burnPact.mult *= 1 + st.burnPact.step;
    log.push(`🔥 타오르는 도화선… ${X.name} 체력 -${n} (공격력 ×${st.burnPact.mult.toFixed(2)})`);
  }
  tryRevive(X, log, foe); // 🪽 지속 피해로 쓰러졌다면 부활
  if (st.dive) { // 🦅 벼락 급강하: 시한폭탄처럼 내 행동과 별개로 낙하 (낙하 전에 쓰러지면 취소)
    if (X.hp <= 0) { delete st.dive; log.push(`🦅 ${X.name}이(가) 쓰러져서 낙하가 취소됐어요`); }
    else if (--st.dive.turns <= 0) {
      const d = st.dive;
      delete st.dive;
      if (!foe || foe.hp <= 0) { /* 상대가 이미 쓰러졌으면 할 일 없음 */ }
      else if (foe.st?.skillImmune) log.push(`🧿 ${foe.name}은(는) 스킬 면역! ${X.name}의 낙하가 빗나갔어요`);
      else {
        const atk = effAtk(X);
        const stab = d.elem && d.elem !== 'normal' && effElems(X).includes(d.elem) ? ELEM_CFG.stab : 1;
        const base = Math.max(atk * 0.25, atk - effDef(foe) * (1 - d.pierce) * 0.5) * d.pow * elemClash(d.elem ?? 'normal', foe, { attacker: X }).mult * stab * (0.85 + Math.random() * 0.3);
        const hit = mitigate(foe, Math.max(1, Math.round(base)));
        foe.hp = Math.max(0, foe.hp - hit.dmg);
        log.push(`🦅 ${X.name}의 **벼락 급강하** 낙하! ${foe.name}에게 **${hit.dmg}** 데미지${hit.note}`);
        afterHit(foe, X, hit.dmg, log);
        if (foe.hp > 0 && Math.random() < d.stun) { foe.st.stun = 1; log.push(`　💫 ${foe.name}(이)가 **기절**했어요!`); }
      }
    }
  }
  if (st.sunCharge) { // ☀️ 태양의 심판: 충전이 끝나면 내리쳐요 (충전 중 쓰러지면 취소)
    if (X.hp <= 0) { delete st.sunCharge; log.push(`☀️ ${X.name}이(가) 쓰러져서 모은 햇빛이 흩어졌어요`); }
    else if (--st.sunCharge.turns <= 0) fireSun(X, foe, log);
  }
  if (st.crystalVault && X.hp > 0) { // 💎 굴절 저장소: 턴이 다 되면 저장된 디버프 개수만큼 방어 무시로 되돌려요
    if (--st.crystalVault.turns <= 0) {
      const v = st.crystalVault;
      delete st.crystalVault;
      if (v.stored <= 0) log.push(`💎 ${X.name}의 굴절 저장소가 조용히 닫혔어요 (저장된 디버프 없음)`);
      else if (!foe || foe.hp <= 0) { /* 상대가 이미 쓰러졌으면 할 일 없음 */ }
      else if (foe.st?.skillImmune) log.push(`🧿 ${foe.name}은(는) 스킬 면역! 굴절 저장소의 반격이 막혔어요`);
      else {
        const n = Math.max(1, Math.round(foe.max * v.mult * v.stored));
        foe.hp = Math.max(0, foe.hp - n);
        log.push(`💎 ${X.name}의 **굴절 저장소**가 터져요! 저장된 디버프 ${v.stored}개 × 방어 무시 **${n}** 피해를 ${foe.name}에게!`);
        afterHit(foe, X, n, log);
      }
    }
  }
  if (st.shards && X.hp > 0 && --st.shards.turns <= 0) { // 🌠 운석낙하: 파편이 한 번 더 떨어져요
    const d = st.shards;
    delete st.shards;
    if (foe && foe.hp > 0) {
      if (foe.st?.skillImmune) log.push(`🧿 ${foe.name}은(는) 스킬 면역! ${X.name}의 운석 파편이 빗나갔어요`);
      else {
        const atk = effAtk(X);
        const base = Math.max(atk * 0.25, atk - effDef(foe) * 0.5) * d.pow * elemClash(d.elem ?? 'normal', foe, { attacker: X }).mult * (0.85 + Math.random() * 0.3);
        const hit = mitigate(foe, Math.max(1, Math.round(base)));
        foe.hp = Math.max(0, foe.hp - hit.dmg);
        log.push(`🌠 ${X.name}의 **운석 파편**이 떨어져요! ${foe.name}에게 **${hit.dmg}** 데미지${hit.note}`);
        afterHit(foe, X, hit.dmg, log);
      }
    }
  }
  if (st.orbit && X.hp > 0 && --st.orbit.turns <= 0) { // ☄️ 귀환 궤도: interval 턴마다 저절로 낙하 (전투가 끝날 때까지 반복)
    const d = st.orbit;
    d.turns = d.interval;
    if (foe && foe.hp > 0) {
      if (foe.st?.skillImmune) log.push(`🧿 ${foe.name}은(는) 스킬 면역! ${X.name}의 궤도가 빗나갔어요`);
      else {
        const atk = effAtk(X);
        const stab = d.elem && d.elem !== 'normal' && effElems(X).includes(d.elem) ? ELEM_CFG.stab : 1;
        const base = Math.max(atk * 0.25, atk - effDef(foe) * (1 - d.pierce) * 0.5) * d.pow * elemClash(d.elem ?? 'normal', foe, { attacker: X }).mult * stab * (0.85 + Math.random() * 0.3);
        const hit = mitigate(foe, Math.max(1, Math.round(base)));
        foe.hp = Math.max(0, foe.hp - hit.dmg);
        log.push(`☄️ ${X.name}의 **귀환 궤도**가 다시 낙하해요! ${foe.name}에게 **${hit.dmg}** 데미지${hit.note}`);
        afterHit(foe, X, hit.dmg, log);
        if (foe.hp > 0 && Math.random() < d.stun) { foe.st.stun = 1; log.push(`　💫 ${foe.name}(이)가 **기절**했어요!`); }
      }
    }
  }
  if (st.parasiteEgg && --st.parasiteEgg.turns <= 0) { delete st.parasiteEgg; log.push(`🥚 ${X.name}의 기생 알이 부화하지 못하고 조용히 사그라들었어요`); } // 🥚 터지지 않고 기간이 다 지나면 그냥 사라져요
  if (st.soulSwap && --st.soulSwap.turns <= 0) { // 👽 신체 강탈 종료: 원래 몸으로 돌아와요
    X.atk = st.soulSwap.orig.atk; X.def = st.soulSwap.orig.def; X.spd = st.soulSwap.orig.spd;
    delete st.soulSwap;
    log.push(`👽 ${X.name}이(가) 원래 몸으로 돌아왔어요!`);
  }
  if (st.trumpet) { // 👼 심판의 나팔
    if (X.hp <= 0) { delete st.trumpet; log.push(`👼 ${X.name}이(가) 쓰러져서 나팔이 멈췄어요`); }
    else if (--st.trumpet.turns <= 0) fireTrumpet(X, foe, log);
  }
  if (st.devil && --st.devil.turns <= 0) { // 😈 악마의 거래 정산: 못 쓰러뜨렸다면 준 피해 × 배수를 "무효화 불가"로 받아요
    const d = st.devil;
    delete st.devil;
    if (X.hp > 0 && foe && foe.hp > 0) {
      if (d.dealt > 0) {
        const toll = Math.max(1, Math.round(d.dealt * d.mult));
        X.hp = Math.max(0, X.hp - toll); // 쉴드·가드·회피·분신·스킬 면역을 거치지 않고 체력에 바로 들어가요
        log.push(`😈 **거래의 대가!** ${X.name}(이)가 준 피해 ${d.dealt}의 ×${d.mult} = **${toll}** 무효화 불가 피해를 받았어요!`);
        if (X.hp <= 0) { delete st.revive; log.push(`😈 부활의 힘도 거래 앞에서는 소용없어요…`); }
      } else log.push(`😈 ${X.name}은(는) 거래 기간 동안 피해를 못 줘서 대가를 치르지 않았어요`);
    }
  }
  if (st.clone && foe && foe.hp > 0 && X.hp > 0 && !foe.st.skillImmune) { // 👥 분신이 같이 공격해요 (상대가 스킬 면역이면 못 때려요)
    const base = Math.max(st.clone.atk * 0.25, st.clone.atk - effDef(foe) * 0.5) * (0.85 + Math.random() * 0.3);
    const hit = mitigate(foe, Math.max(1, Math.round(base)));
    foe.hp = Math.max(0, foe.hp - hit.dmg);
    log.push(`👥 ${X.name}의 분신이 ${foe.name}에게 **${hit.dmg}** 데미지${hit.note}`);
    afterHit(foe, X, hit.dmg, log);
  }
  if (st.xfer && foe && foe.hp > 0 && X.hp > 0) { // 🧲 1회용 효과 이동: 옮길 게 생기면 한 번 발동하고 사라져요
    if (!foe.st.skillImmune && applyXfer(X, foe, st.xfer.mode, log)) delete st.xfer;
    else if (--st.xfer.turns <= 0) { delete st.xfer; log.push(`💨 ${X.name}의 효과 이동이 아무 일 없이 사라졌어요`); }
  }
  if (st.atkRegen && X.hp > 0) { // 🦅 불사의 날갯짓: 공격력 비례 회복
    const n = heal(X, effAtk(X) * st.atkRegen.ratio);
    if (n) log.push(`🔥 ${X.name} 불꽃 재생 체력 +${n}`);
    if (--st.atkRegen.turns <= 0) delete st.atkRegen;
  }
  if (st.swallow && X.hp > 0) { // 🐛 삼킨 스킬이 "스킬이 아닌 공격"으로 저절로 터져요
    const sw = st.swallow;
    if (sw.fresh) sw.fresh = false; // 시전한 턴 끝에는 안 터져요
    else {
      const eat = SKILLS[sw.id];
      if (eat && foe && foe.hp > 0 && !st.stun && !st.frozen) {
        log.push(`🐛 ${X.name}이(가) 삼킨 ${eat.emoji} **${eat.name}**이(가) 터져 나와요!`);
        castSkill({ ...eat, name: `${eat.name} (삼킨 스킬)`, cost: 0, cd: 0, copied: true, swallowed: true, srcId: eat.id }, X, foe, Math.random, log);
      }
      if (--sw.left <= 0) { delete st.swallow; log.push(`🐛 ${X.name}이(가) 삼킨 스킬을 다 쏟아냈어요`); }
    }
  }
  if (st.regen && X.hp > 0) {
    const n = heal(X, X.max * st.regen.pct);
    if (n) log.push(`🌱 ${X.name} 체력 +${n}`);
    if (--st.regen.turns <= 0) delete st.regen;
  }
  if (st.sunset && --st.sunset.turns <= 0) { delete st.sunset; log.push(`🌇 ${X.name}의 일몰이 끝났어요`); } // 🌇 일출의 가호 여운 (이번 턴에 만든 건 줄이지 않아요)
  if (st.sunrise) { // 🌅 일출의 가호: 매 턴 회복 + 공격력 누적
    if (X.hp <= 0) delete st.sunrise;
    else {
      const s = st.sunrise;
      const n = heal(X, X.max * s.regen);
      if (n) log.push(`🌅 ${X.name} 가호의 빛 체력 +${n}`);
      s.atk = Math.min(s.cap, s.atk + s.step);
      if (--s.turns <= 0) {
        st.sunset = { atk: s.atk / 2, turns: s.after };
        delete st.sunrise;
        log.push(`🌇 ${X.name}의 일출이 저물어요… 쌓인 공격력의 절반(+${P100(s.atk / 2)})이 ${s.after}턴 더 남아요`);
      } else log.push(`🌅 ${X.name}의 공격력이 +${P100(s.atk)} 까지 올랐어요 (${s.turns}턴 남음)`);
    }
  }
  if (st.pharaoh && X.hp > 0) { // ⚰️ 파라오의 저주: 보호막 부식 · 회복하지 못한 턴에는 저주 피해
    const p = st.pharaoh;
    if (!immune) {
      if (st.shield > 0) { const cut = Math.floor(st.shield * p.shield); if (cut > 0) { st.shield -= cut; log.push(`⚰️ ${X.name}의 보호막이 저주에 **${cut}** 부식됐어요`); } }
      if (!p.healed) { const n = Math.max(1, Math.round(X.max * p.rot)); X.hp = Math.max(0, X.hp - n); log.push(`⚰️ 회복하지 못한 ${X.name}에게 저주가 스며들어요 **${n}**`); }
    }
    p.healed = false;
  }
  // 🆕 최대마나 증가 효과가 끝나면 늘렸던 만큼 되돌려요
  if (st.manaMaxUp && --st.manaMaxUp.turns <= 0) {
    X.manaMax = Math.max(SKILL_CFG.manaMax, X.manaMax - st.manaMaxUp.amt);
    X.mana = Math.min(X.mana, X.manaMax);
    delete st.manaMaxUp;
  }
  if (st.pigeon) { // 🕊️ 비둘기가 상대 마나를 쪼아 오고, 턴이 지나면 날아가요
    if (foe && foe.hp > 0 && !foe.st?.skillImmune && foe.mana > 0) {
      const n = Math.min(foe.mana, st.pigeon.steal);
      foe.mana -= n;
      X.mana = Math.min(X.manaMax, X.mana + n);
      log.push(`🕊️ 비둘기가 ${foe.name}의 마나 ${n}을(를) 물어 왔어요!`);
    }
    if (--st.pigeon.turns <= 0) { delete st.pigeon; log.push(`🕊️ ${X.name}의 비둘기가 날아갔어요`); }
  }
  if (st.frozen && --st.frozen.turns <= 0) { delete st.frozen; log.push(`🧊 ${X.name}의 얼음이 저절로 녹았어요`); } // 최대 지속 턴이 지나면 자동 해제
  if (st.manaDown && --st.manaDown.turns <= 0) { // 🔽 마나 감소가 끝나면 깎였던 최대 마나를 되돌려요
    X.manaMax += st.manaDown.cut;
    delete st.manaDown;
  }
  if (st.revive && --st.revive.turns <= 0) { delete st.revive; log.push(`🪽 ${X.name}의 부활 효과가 사라졌어요`); }
  if (st.drowsy && --st.drowsy.turns <= 0) { // 😴 졸음: 잠들어요 (다음 행동 1회 불가)
    delete st.drowsy;
    if (X.hp > 0 && !st.stun) { st.stun = 1; log.push(`😴 ${X.name}(이)가 스르르 **잠들었어요**… 다음 행동을 못 해요`); }
  }
  if (st.pendingBoom && foe) { const n = st.pendingBoom; delete st.pendingBoom; cloneBoomOn(X, foe, n, log); } // 🎆 쓰러진 분신의 폭발이 남아 있으면 지금
  if (st.clone?.boom && st.clone.turns <= 1 && foe) { const n = st.clone.boom; st.clone.boom = 0; cloneBoomOn(X, foe, n, log); } // 🎆 분신이 끝나는 순간 폭발
  for (const k of ['atkUp', 'atkDown', 'powDown', 'berserk', 'defUp', 'defDown', 'guard', 'echo', 'convert', 'ward', 'manaRegenUp', 'burst', 'coinflip', 'defToAtk', 'healCut', 'spdUp', 'spdDown', 'priority', 'reflect', 'reflectDebuff', 'clone', 'statMod', 'skillImmune', 'sealed', 'cursed', 'catchPro', 'allElem', 'whoIs', 'lamp', 'huntMark', 'transfer', 'shieldCounter', 'speedRev', 'prideNull', 'prideReflect', 'genesis', 'debuffImmune', 'angelRefund', 'reign', 'pharaoh', 'venom', 'frostImmune', 'thorns', 'hitCap', 'mindCtl', 'ironSkin']) {
    if (st[k] && !st[k].perm && --st[k].turns <= 0) delete st[k]; // perm(영구 봉인)은 줄지 않아요
  }
  for (const id of Object.keys(st.cds ?? {})) if (--st.cds[id] <= 0) delete st.cds[id]; // ⏳ 쿨타임 감소
  if (st.winter) { // ❄️ 영원한 겨울: 매 턴 서리 +1 · 마나 감소 · 마나가 가장 큰 스킬 하나의 쿨타임 +1
    const w = st.winter;
    w.hitDone = false;
    if (X.hp > 0) {
      if (immune) log.push(`🧿 ${X.name}은(는) 스킬 면역! 영원한 겨울이 스며들지 못해요`);
      else {
        const m = Math.min(X.mana, w.mana);
        X.mana -= m;
        log.push(`❄️ 영원한 겨울… ${X.name} 마나 -${m}`);
        const pool = (X.skills ?? []).map((id) => SKILLS[id]).filter((s) => s && !s.dud && s.cost > 0 && (st.cds?.[s.id] ?? 0) < 90).sort((a, b) => b.cost - a.cost);
        if (pool[0]) { (st.cds ??= {})[pool[0].id] = (st.cds[pool[0].id] ?? 0) + 1; log.push(`　⏳ ${pool[0].emoji} ${pool[0].name} 쿨타임 +1`); }
        addFrost(X, 1, log);
      }
    }
    if (--w.turns <= 0) { delete st.winter; delete st.frost; log.push(`❄️ ${X.name}에게 내려앉은 영원한 겨울이 걷혔어요`); }
  }
  if (st.venomN && !foe?.st?.venom) delete st.venomN; // 🦖 와이번의 독이 끝나면 스택도 사라져요
  if (st.huntMark) st.huntMark.bursts = 0; // 🎯 한 턴에 최대 2번 터져요 (턴마다 초기화)
  if (st.transfer) st.transfer.pending = 0; // 🕳️ 공격한 쪽이 없어 못 넘긴 피해는 버려요
  delete st.shieldBroke;
  st.prevTaken = st.turnTaken ?? 0; // 👼 지난 턴 받은 피해 기억 (대천사의 축복용)
  delete st.turnTaken; // 이번 턴 받은 피해는 턴이 끝나면 초기화
  if (gainMana) X.mana = Math.min(X.manaMax, X.mana + SKILL_CFG.manaPerTurn + (st.manaRegenUp?.amt ?? 0));
  flushQ(X, log); // ⚰️ 뒤집힌 회복 글
  if (X.hp > 0) { (st.hist ??= []).push({ hp: X.hp, mana: Math.round(X.mana) }); if (st.hist.length > 6) st.hist.shift(); } // ⏪ 태초의 숨결이 되감을 기록 (턴이 끝났을 때의 체력·마나)
}

// 👑 전설 등급 이상(elite) 야생 펫: 전용기는 항상 들고 나오고, 나머지 스킬 칸은 60% 확률로 ★5 스킬이에요
export const WILD_ELITE_STAR5_CHANCE = 0.6;

// 🆕 야생 펫도 아군처럼 만날 때 랜덤 스킬을 1~3개 배워서 나와요
// elite=true 면: ① 그 펫의 전용기를 전부 먼저 배워요(전용기가 2개면 최소 2칸) ② 남는 칸은 WILD_ELITE_STAR5_CHANCE(60%) 확률로 ★5, 아니면 ★5 가 아닌 스킬이에요
export function rollWildSkills(petId, rng = Math.random, elite = false) {
  const count = 1 + Math.floor(rng() * 3); // 1~3개
  const skills = [];
  if (elite) {
    for (const s of Object.values(SKILLS)) if (s.pet === petId && !s.hidden) skills.push(s.id);
  }
  const want = Math.max(count, skills.length);
  const star5 = Object.values(SKILLS).filter((s) => s.tier === 5).map((s) => s.id);
  // 야생 펫이 전투에서 못 쓰는 스킬(포획 전문가 · 버프 · 스킬 봉인)은 ★5 칸을 낭비하니까 제외해요
  const wildUsable5 = Object.values(SKILLS).filter((s) => s.tier === 5 && !s.hidden && !s.pet && !s.catchPro && !s.fightBuff && !s.lockSkills);
  while (skills.length < want) {
    let id = null;
    if (elite) {
      if (rng() < WILD_ELITE_STAR5_CHANCE) {
        const pool = wildUsable5.filter((s) => !skills.includes(s.id));
        if (pool.length) {
          const mine = petElementsOf(petId).filter((e) => e !== 'normal');
          const aff = SKILL_CFG.elemAffinity ?? 1;
          const w = pool.map((s) => (aff !== 1 && mine.includes(skillElement(s)) ? aff : 1)); // 같은 속성은 더 잘 나와요
          let r = rng() * w.reduce((n, x) => n + x, 0);
          id = pool[pool.length - 1].id;
          for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r < 0) { id = pool[i].id; break; } }
        }
      } else {
        id = rollSkill({ petId }, rng, [...skills, ...star5]);
      }
    } else {
      id = rollSkill({ petId }, rng, skills); // sigChance(1%)로 전용기가 섞여 나올 수도 있어요
    }
    if (!id) break;
    skills.push(id);
  }
  return skills;
}

// 야생 펫의 스킬 고르기: 배운 스킬 중 "지금 상황에 가장 쓸모 있는" 걸 점수로 골라요.
// 마나만 되면 거의 항상 스킬을 써요 (활용률 100%) — 예전처럼 35%로 거르지 않아요.
export function pickWildSkill(skillIds, wild, me, rng = Math.random) {
  if (wild.st?.sealed) return null; // 🔒 조커로 봉인되면 기본 공격만 해요
  const options = (skillIds ?? []).map((id) => SKILLS[id]).filter((sk) => sk && sk.cost <= wild.mana && cdLeft(wild.st, sk.id) <= 0
    && !(sk.joker && wild.fight?.jokerUsed) && !(sk.devilDeal && wild.st?.devil) && !(sk.curseGrant && !wild.st?.cursed) && !sk.catchPro && !sk.fightBuff && !sk.lockSkills
    && !sk.lootReserve && !(sk.goldSave && (wild.st?.goldSave || wild.st?.goldUsed)) && !(sk.fateReplay && !fatePick(wild.st, !!me.st?.skillImmune)));
  if (!options.length) return null; // 배운 스킬이 없거나 마나가 모자라면 기본 공격

  const myRatio = wild.hp / wild.max;
  const foeRatio = me.hp / me.max;

  const score = (sk) => {
    let s = 1 + rng() * 0.5; // 동점일 땐 랜덤하게
    if (myRatio <= 0.4 && (sk.heal || sk.regen || sk.shield || sk.guard || sk.cleanse)) s += 6; // 위험하면 회복·방어 최우선
    if (foeRatio <= 0.3 && (sk.exec || (sk.pow ?? 0) >= 2)) s += 5; // 상대가 빈사면 마무리기 우선
    if (sk.stun || sk.atkDown || sk.defDown || sk.dot) s += 2; // 방해 효과는 언제나 쓸모 있어요
    if (sk.pow) s += sk.pow; // 순수 세기도 반영
    if (sk.pow) { // 🌈 상성이 좋은 스킬을 더 골라요 (약점이면 +2.5, 반감이면 -2)
      const cl = elemClash(skillElement(sk), me, { ignoreResist: sk.ignoreResist, attacker: wild });
      if (cl.mult >= 1.1) s += 2.5;
      else if (cl.mult <= 0.9) s -= 2;
    }
    if (sk.curseGrant) s += 5; // 🪬 저주부여는 기회가 한 번이라 바로 써요
    else if (sk.curse) s -= 2; // 🧿 자기 저주는 살짝 꺼려요
    if (sk.devilDeal || sk.joker) s += 1;
    if (sk.goldSave) s += myRatio >= 0.5 ? 3 : -3; // 🏆 체력이 넉넉할 때 저장해야 값져요
    if (sk.fateReplay) s += 2;
    if (sk.rewind) s += myRatio <= 0.45 ? 7 : -6; // ✨ 위험할 때만 되감아요
    if (sk.angelRefund) s += myRatio <= 0.7 ? 3 : -1;
    if (sk.sunVerdict || sk.trumpet) s += 2.5;
    if (sk.sunrise || sk.genesis) s += 2;
    if (sk.trickster) s += me.st?.last ? 3 : -6;
    if (sk.winter || sk.pharaoh || sk.reign) s += me.st?.[sk.winter ? 'winter' : sk.pharaoh ? 'pharaoh' : 'reign'] ? -5 : 2;
    if (sk.healLost) s += myRatio <= 0.6 ? 4 : -3; // 🐷 많이 다쳤을 때 써요
    if (sk.hitCap) s += wild.st?.hitCap ? -5 : 1.5;
    if (sk.gapTrue) s += me.hp > wild.hp ? 2 : 0; // 👑 상대가 더 튼튼할 때 더 값져요
    if (sk.mindCtl) s += me.st?.mindCtl ? -5 : 2;
    if (sk.thorns) s += me.st?.thorns ? -4 : 2;
    if (sk.impact) s += effSpd(wild) >= effSpd(me) ? 2 : -1;
    if (sk.dragonFlame && myRatio < 0.4) s -= 4;
    if (sk.cost > wild.mana * 0.8) s -= 1; // 너무 비싸면 살짝 아껴요
    return s;
  };

  return options.sort((a, b) => score(b) - score(a))[0];
}

// 상태 줄 글자: "🔥화상 2턴 · 💪공격↑ 3턴"
export function statusText(st = {}) {
  const t = [];
  for (const d of st.dots ?? []) t.push(`${DOT[d.kind] ?? d.kind} ${d.turns}턴`);
  if (st.stun) t.push('💫 기절');
  if (st.pigeon) t.push(`🕊️ 비둘기 ${st.pigeon.hp}/${st.pigeon.max} ${st.pigeon.turns}턴`);
  if (st.frozen) t.push(`🧊 동결 ${st.frozen.turns}턴 (받는 피해 ×${FROZEN_CFG.dmgMult})`);
  if (st.atkUp) t.push(`💪 공격↑ ${st.atkUp.turns}턴`);
  if (st.atkDown) t.push(`🔻 공격↓ ${st.atkDown.turns}턴`);
  if (st.defUp) t.push(`🧱 방어↑ ${st.defUp.turns}턴`);
  if (st.defDown) t.push(`🔻 방어↓ ${st.defDown.turns}턴`);
  if (st.guard) t.push(`🛡️ 방어태세 ${st.guard.turns}턴`);
  if (st.shield > 0) t.push(`🔰 보호막 ${st.shield}`);
  if (st.evade > 0) t.push(`🌀 회피 ${st.evade}회`);
  if (st.atkRegen) t.push(`🔥 불꽃재생 ${st.atkRegen.turns}턴`);
  if (st.regen) t.push(`🌱 재생 ${st.regen.turns}턴`);
  if (st.bomb) t.push(`💣 시한폭탄 ${st.bomb.turns}턴`);
  if (st.echo) t.push(`🔊 메아리 ${st.echo.turns}턴`);
  if (st.convert) t.push(`🧬 ${elemTag(st.convert.elem)} 변신 ${st.convert.turns}턴`);
  if (st.ward) t.push(`🔮 속성방벽 ${st.ward.turns}턴`);
  if (st.manaMaxUp) t.push(`🔷 최대마나+${st.manaMaxUp.amt} ${st.manaMaxUp.turns}턴`);
  if (st.manaRegenUp) t.push(`🔋 마나회복+${st.manaRegenUp.amt} ${st.manaRegenUp.turns}턴`);
  if (st.burst) t.push(`🔥 공격력×${st.burst.mult} ${st.burst.turns}턴`);
  if (st.coinflip) t.push(`🎲 모아니면도 ${st.coinflip.turns}턴`);
  if (st.defToAtk) t.push(`⚔️ 방어→공격 ${st.defToAtk.turns}턴`);
  if (st.healCut) t.push(`🚑 회복감소 ${st.healCut.turns}턴`);
  if (st.powDown) t.push(`🔻 스킬위력↓ ${st.powDown.turns}턴`);
  if (st.berserk) t.push(`🔥 광폭화 ${st.berserk.turns}턴`);
  if (st.manaDown) t.push(`🔽 최대마나 -${st.manaDown.cut} ${st.manaDown.turns}턴`);
  if (st.spdUp) t.push(`👟 스피드↑ ${st.spdUp.turns}턴`);
  if (st.spdDown) t.push(`🐌 스피드↓ ${st.spdDown.turns}턴`);
  if (st.priority) t.push(`⏱️ 선공 ${st.priority.turns}턴`);
  if (st.clone) t.push(`👥 분신 ❤${st.clone.hp} ${st.clone.turns}턴`);
  if (st.reflect) t.push(`🪞 반사 ${st.reflect.turns}턴`);
  if (st.reflectDebuff) t.push(`🔮 디버프반사 ${st.reflectDebuff.turns}턴`);
  if (st.xfer) t.push(`🧲 ${{ steal: '버프 약탈', give: '디버프 떠넘기기', swap: '효과 교환' }[st.xfer.mode] ?? '효과 이동'} 대기 ${st.xfer.turns}턴`);
  if (st.statMod) t.push(`🎰 능력치 ⚔️×${+st.statMod.atk.toFixed(2)} 🧱×${+st.statMod.def.toFixed(2)} 👟×${+st.statMod.spd.toFixed(2)} ${st.statMod.turns}턴`);
  if (st.skillImmune) t.push(`🧿 스킬면역 ${st.skillImmune.turns}턴`);
  if (st.manaBonus) t.push(`🃏 최대마나 +${st.manaBonus}`);
  if (st.prideNull) t.push(`👿 오만에 짓눌림 ${st.prideNull.turns}턴 (방어·공격 무시)`);
  if (st.prideReflect) t.push(`👿 반사 ${st.prideReflect.turns}턴 · 남은 ${st.prideReflect.left}개`);
  if (st.swallow) t.push(`🐛 삼킴 ${SKILLS[st.swallow.id]?.name ?? ''} ${st.swallow.left}턴${st.swallowSaved ? ' (일어서기 사용함)' : ''}`);
  if (st.revive) t.push(`🪽 부활대기 ${st.revive.turns}턴`);
  if (st.maxBonus) t.push(`⬆️ 최대체력 +${st.maxBonus}`);
  if (st.sealed) t.push(st.sealed.perm ? '🔒 스킬 영구봉인' : `🔒 스킬봉인 ${st.sealed.turns}턴`);
  if (st.allElem) t.push(`🌈 전속성(${{ attack: '공격', defend: '방어', both: '공격+방어' }[st.allElem.mode] ?? ''}) ${st.allElem.turns}턴`);
  if (st.whoIs) t.push(`🎭 누구게? ${Math.round(st.whoIs.pct * 100)}% ${st.whoIs.turns}턴`);
  if (st.cursed) t.push(`🧿 저주 ${st.cursed.turns}턴`);
  if (st.catchPro) t.push(`🪢 포획전문가 ${st.catchPro.turns}턴 (포획률 +${Math.round(st.catchPro.bonus * 100)}%p${st.catchPro.held ? ' · 붙잡음' : ''})`);
  if (st.fightBuff && fightBuffText(st.fightBuff)) t.push(`📈 ${fightBuffText(st.fightBuff)}`);
  if (st.devil) t.push(`😈 악마의 거래 ${st.devil.turns}턴 · 준 피해 ${st.devil.dealt} (×${st.devil.mult})`);
  if (st.drowsy) t.push(`😴 졸음 ${st.drowsy.turns}턴`);
  if (st.speedRev) t.push(`🔁 속도 역전 ${st.speedRev.turns}턴`);
  if (st.huntMark) t.push(`🎯 사냥 표식 ${st.huntMark.stack}/${st.huntMark.need} ${st.huntMark.turns}턴`);
  if (st.transfer) t.push(`🕳️ 피해 전이 ${Math.round(st.transfer.pct * 100)}% ${st.transfer.turns}턴`);
  if (st.shieldCounter) t.push(`❄️ 서리 반격 대기 ${st.shieldCounter.turns}턴`);
  if (st.dive) t.push(`🦅 낙하 대기 ${st.dive.turns}턴`);
  if (st.ironSkin) t.push(`💎 금강불괴 (최대 체력의 ${Math.round(st.ironSkin.pct * 100)}% 이하 피해 무효 · ${st.ironSkin.turns}턴)`);
  if (st.shards) t.push(`🌠 운석 파편 ${st.shards.turns}턴 뒤 낙하`);
  if (st.thorns) t.push(`🌵 보석 가시 ${st.thorns.n}개 (${st.thorns.turns}턴 · 때리면 자해)`);
  if (st.hitCap) t.push(`👑 황금 갑옷 (한 번에 최대 ${Math.round(st.hitCap.pct * 100)}% · ${st.hitCap.turns}턴)`);
  if (st.mindCtl) t.push(`👽 정신 지배 (다음 공격 스킬이 나 자신에게 · ${st.mindCtl.turns}턴)`);
  if (st.lamp) t.push(`🕯️ 불빛 ${st.lamp.turns}턴`);
  if (st.hitCount) t.push(`💢 맞은 횟수 ${st.hitCount}`);
  if (st.snowCount) t.push(`⛄ 눈덩이 ${st.snowCount}회`);
  if (st.sunCharge) t.push(`☀️ 햇빛 충전 ${st.sunCharge.turns}턴 (받는 피해 -${P100(st.sunCharge.guard)} · 기절 면역)`);
  if (st.sunrise) t.push(`🌅 일출의 가호 공격 +${P100(st.sunrise.atk)} · ${st.sunrise.turns}턴`);
  if (st.sunset) t.push(`🌇 일몰 공격 +${P100(st.sunset.atk)} · ${st.sunset.turns}턴`);
  if (st.trumpet) t.push(`👼 심판 대기 ${st.trumpet.turns}턴 · 죄 ${st.trumpet.seen ?? 0}개`);
  if (st.angelRefund) t.push(`😇 피해 환급 ${st.angelRefund.turns}턴 (남은 한도 ${st.angelRefund.left})`);
  if (st.debuffImmune) t.push(`🛡️ 나쁜 효과 면역 ${st.debuffImmune.turns}턴`);
  if (st.genesis) t.push(`🌌 천지창조 ${st.genesis.turns}턴 (내 공격 약점 확정 · 받는 약점 무효)`);
  if (st.winter) t.push(`❄️ 영원한 겨울 ${st.winter.turns}턴 · 서리 ${st.frost?.n ?? 0}/${st.winter.max}`);
  if (st.frostImmune) t.push(`🧊 동결 면역 ${st.frostImmune.turns}턴`);
  if (st.reign) t.push(`👹 화염 군림 ${st.reign.turns}턴 · 화상 스택 ${st.reign.stacks}/${st.reign.max}`);
  if (st.pharaoh) t.push(`⚰️ 파라오의 저주 ${st.pharaoh.turns}턴`);
  if (st.venom) t.push(`🦖 맹독 ${st.venom.turns}턴`);
  if (st.venomN) t.push(`☠️ 독 스택 ${st.venomN}`);
  if (st.crystalVault) t.push(`💎 굴절 저장소 ${st.crystalVault.turns}턴 · 저장된 디버프 ${st.crystalVault.stored}개`);
  if (st.burnPact) t.push(`🔥 도화선 공격력 ×${st.burnPact.mult.toFixed(2)} (매 턴 체력 -${Math.round(st.burnPact.hp * 100)}%)`);
  if (st.orbit) t.push(`☄️ 귀환 궤도 · ${st.orbit.turns}턴 뒤 낙하 (${st.orbit.interval}턴 주기)`);
  if (st.soulSwap) t.push(`👽 신체 강탈 ${st.soulSwap.turns}턴 (능력치 맞바뀜)`);
  if (st.brandStack) t.push(`🔗 낙인 스택 ${st.brandStack}`);
  if (st.undyingHex) t.push(`🧟 불멸의 저주 (공격력 -${Math.round(st.undyingHex.atk * 100)}% · 방어력 -${Math.round(st.undyingHex.def * 100)}% · ${st.undyingHex.hitsLeft}번 맞혀야 풀림)`);
  if (st.parasiteEgg) t.push(`🥚 기생 알 ${st.parasiteEgg.turns}턴 (정화하면 터져요)`);
  if (st.lootReserve) t.push(`🎁 보상 예약 (처음 받는 보상 ×${LOOT_RESERVE_MULT})`);
  if (st.goldSave) t.push(`🏆 황금 저장됨 (쓰러지면 체력 ${st.goldSave.hp}로 복귀)`);
  if (st.goldUsed) t.push('🏆 최후의 황금 사용함');
  if (st.luck?.length) t.push(`🎲 기억한 행운 ${st.luck.length}개 (최고 ${Math.max(...st.luck.map((e) => e.score))})`);
  for (const [id, n] of Object.entries(st.cds ?? {})) {
    if (!SKILLS[id]) continue;
    if (n >= 90) t.push(SKILLS[id].dud ? '🃏 스킬 칸 하나가 조커 카드로 바뀜' : `✅ ${SKILLS[id].name} 사용함 (전투당 1회)`);
    else t.push(`⏳ ${SKILLS[id].name} 쿨 ${n}턴`);
  }
  return t.join(' · ');
}

// 펫마다 전용기 목록 (도감·상점 안내용). 예: sigOf('wolf') → [sig_wolf, sig_wolf2]
export const sigOf = (petId) => Object.values(SKILLS).filter((s) => s.pet === petId);