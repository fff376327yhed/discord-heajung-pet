// 관리자 설정 관리자 🛠️
// 게임 설정(숫자·펫·아이템·지역·표)을 "기본값 + 관리자가 바꾼 값(overrides)"으로 합쳐서
// 봇이 쓰는 객체에 그대로 덮어써요. 저장은 store(Firestore 한 문서)가 맡아요.
//
// overrides 모양:
//   { scalars: { NAME: 값 }, tables: { NAME: 통째로 교체할 값 },
//     pets: { id: 펫 }, items: { id: 아이템 }, locations: { id: 지역 } }

const clone = (v) => JSON.parse(JSON.stringify(v));
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const ID_RE = /^[a-z0-9_]{2,40}$/;

export function createConfigManager({ scalars, tables, entities, refresh, store, ttlMs = 20000 }) {
  // scalars: { NAME: { get, set, section, desc } }   tables: { NAME: 객체|배열 }
  // entities: { pets: PETS, items: ITEMS, locations: LOCATIONS }
  const defaults = {
    scalars: Object.fromEntries(Object.entries(scalars).map(([k, s]) => [k, s.get()])),
    tables: clone(tables),
    pets: clone(entities.pets),
    items: clone(entities.items),
    locations: clone(entities.locations),
  };
  const meta = { scalars: Object.fromEntries(Object.entries(scalars).map(([k, s]) => [k, { section: s.section, desc: s.desc }])) };

  let overrides = { scalars: {}, tables: {}, pets: {}, items: {}, locations: {} };
  let loadedAt = 0;
  let loading = null;

  // 기본값 + overrides → 완성본 (검증 전용 복사본)
  function merge(ov) {
    const out = clone(defaults);
    Object.assign(out.scalars, ov.scalars ?? {});
    for (const [k, v] of Object.entries(ov.tables ?? {})) if (k in out.tables) out.tables[k] = clone(v);
    for (const kind of ['pets', 'items', 'locations']) {
      for (const [id, v] of Object.entries(ov[kind] ?? {})) out[kind][id] = { ...clone(v), id };
    }
    return out;
  }

  const num = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

  // 문제가 있으면 한국어 글자 목록을 돌려줘요 (비어 있으면 통과)
  function validate(ov) {
    const errs = [];
    if (!isObj(ov)) return ['설정 형식이 올바르지 않아요'];
    for (const [k, v] of Object.entries(ov.scalars ?? {})) {
      if (!(k in defaults.scalars)) errs.push(`알 수 없는 설정: ${k}`);
      else if (typeof v !== typeof defaults.scalars[k]) errs.push(`${k}: 값 종류가 달라요`);
      else if (typeof v === 'number' && !num(v, -1e9, 1e12)) errs.push(`${k}: 숫자 범위를 벗어났어요`);
    }
    for (const [k, v] of Object.entries(ov.tables ?? {})) {
      if (!(k in defaults.tables)) errs.push(`알 수 없는 표: ${k}`);
      else if (Array.isArray(v) !== Array.isArray(defaults.tables[k])) errs.push(`${k}: 표 모양이 달라요`);
      else if (JSON.stringify(v).length > 20000) errs.push(`${k}: 너무 커요`);
    }
    for (const kind of ['pets', 'items', 'locations']) {
      for (const [id, v] of Object.entries(ov[kind] ?? {})) {
        if (!ID_RE.test(id)) errs.push(`${kind} id 는 영어 소문자·숫자·_ 2~40자예요: ${id}`);
        if (!isObj(v)) errs.push(`${kind}/${id}: 형식 오류`);
        if (v === null) errs.push(`${kind}/${id}: 삭제는 지원하지 않아요 (저장된 유저 데이터가 깨질 수 있어요)`);
      }
    }
    if (errs.length) return errs;

    const m = merge(ov);
    const grades = m.tables.GRADES ?? {};
    for (const [id, p] of Object.entries(m.pets)) {
      const t = `펫 ${id}`;
      if (typeof p.name !== 'string' || !p.name.trim() || p.name.length > 30) errs.push(`${t}: 이름은 1~30자`);
      if (!(p.grade in grades)) errs.push(`${t}: 없는 등급 ${p.grade}`);
      for (const s of ['hp', 'atk', 'def', 'spd']) if (!num(p.baseStats?.[s], 1, 100000)) errs.push(`${t}: ${s} 는 1 이상 숫자`);
      if (!num(p.expYield, 0, 1e7)) errs.push(`${t}: expYield 오류`);
      if (!num(p.catchRate, 0, 1)) errs.push(`${t}: catchRate 는 0~1`);
    }
    if (!Object.values(m.pets).some((p) => p.starter)) errs.push('스타팅 펫이 최소 1마리 있어야 해요');
    for (const [id, it] of Object.entries(m.items)) {
      if (typeof it.name !== 'string' || !it.name.trim()) errs.push(`아이템 ${id}: 이름이 비었어요`);
      if (it.price != null && !num(it.price, 0, 1e9)) errs.push(`아이템 ${id}: 가격 오류`);
      if (it.heal != null && !num(it.heal, 1, 1e6)) errs.push(`아이템 ${id}: heal 오류`);
    }
    if (!m.items.haejeong_ball) errs.push('haejeong_ball(해정볼) 아이템은 꼭 있어야 해요');
    const locs = Object.values(m.locations);
    if (!locs.length) errs.push('지역이 최소 1개 있어야 해요');
    for (const l of locs) {
      const t = `지역 ${l.id}`;
      if (typeof l.name !== 'string' || !l.name.trim()) errs.push(`${t}: 이름이 비었어요`);
      if (!num(l.minLevel, 1, 1000)) errs.push(`${t}: minLevel 오류`);
      if (!num(l.expMultiplier, 0, 1000)) errs.push(`${t}: expMultiplier 오류`);
      if (!Array.isArray(l.spawns) || !l.spawns.length) errs.push(`${t}: 나오는 펫이 최소 1마리 있어야 해요`);
      for (const s of l.spawns ?? []) {
        if (!m.pets[s.petId]) errs.push(`${t}: 없는 펫 ${s.petId}`);
        else if (m.pets[s.petId].starter) errs.push(`${t}: 스타팅 펫(${s.petId})은 야생에 못 나와요`);
        if (!num(s.weight, 0, 1e6)) errs.push(`${t}: weight 오류`);
        if (!Array.isArray(s.lv) || !num(s.lv[0], 1, 100) || !num(s.lv[1], 1, 100) || s.lv[0] > s.lv[1]) errs.push(`${t}: 레벨 범위 오류 (1~100, 최소≤최대)`);
      }
      if ((l.spawns ?? []).length && l.spawns.every((s) => !(s.weight > 0))) errs.push(`${t}: weight 가 모두 0 이에요`);
    }
    return errs.slice(0, 20);
  }

  // 살아 있는 객체를 "그 자리에서" 바꿔요 (다른 곳에서 잡고 있는 참조가 유지돼요)
  function replaceInPlace(live, next) {
    if (Array.isArray(live)) return void live.splice(0, live.length, ...clone(next));
    for (const k of Object.keys(live)) delete live[k];
    Object.assign(live, clone(next));
  }

  function apply(ov) {
    const m = merge(ov);
    for (const [k, v] of Object.entries(m.scalars)) scalars[k].set(v);
    for (const [k, v] of Object.entries(m.tables)) replaceInPlace(tables[k], v);
    for (const kind of ['pets', 'items', 'locations']) {
      const live = entities[kind];
      for (const id of Object.keys(live)) if (!(id in m[kind])) delete live[id];
      for (const [id, v] of Object.entries(m[kind])) {
        if (live[id]) replaceInPlace(live[id], v);
        else live[id] = clone(v);
      }
    }
    overrides = clone({ scalars: {}, tables: {}, pets: {}, items: {}, locations: {}, ...ov });
    refresh();
  }

  async function reload() {
    try {
      const doc = await store.load();
      const ov = doc?.json ? JSON.parse(doc.json) : {};
      if (validate(ov).length === 0) apply(ov);
      else console.error('저장된 관리자 설정이 올바르지 않아 기본값을 써요');
      loadedAt = Date.now();
    } catch (error) {
      console.error('관리자 설정 불러오기 실패 (이전 설정 유지):', error);
      loadedAt = Date.now() - ttlMs + 5000; // 5초 뒤 다시 시도
    }
  }

  return {
    // 요청 처리 전에 불러요. ttl 안에는 다시 읽지 않아서 빨라요 (동시 요청은 한 번만 읽어요)
    async ensure() {
      if (Date.now() - loadedAt < ttlMs) return;
      loading ??= reload().finally(() => (loading = null));
      await loading;
    },
    async getAll() {
      await reload();
      return { defaults, overrides, meta };
    },
    async save(ov) {
      const errs = validate(ov);
      if (errs.length) return { ok: false, errors: errs };
      await store.save({ json: JSON.stringify(ov), updatedAt: Date.now() });
      apply(ov);
      loadedAt = Date.now();
      return { ok: true };
    },
    validate,
  };
}
