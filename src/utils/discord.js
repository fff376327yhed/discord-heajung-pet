// 디스코드에게 대답할 때 쓰는 도구 모음 💬
export const InteractionType = { PING: 1, COMMAND: 2, COMPONENT: 3 };
export const ResponseType = { PONG: 1, MESSAGE: 4, UPDATE: 7 };
const EPHEMERAL = 64; // "나한테만 보이는 메시지" 표시

export function reply(data, { ephemeral = false } = {}) {
  return {
    type: ResponseType.MESSAGE,
    data: ephemeral ? { ...data, flags: EPHEMERAL } : data,
  };
}

// 버튼을 누른 그 메시지를 새 내용으로 바꿔요
export function update(data) {
  return { type: ResponseType.UPDATE, data };
}

export function getUser(interaction) {
  return interaction.member?.user ?? interaction.user;
}

export function getOption(interaction, name) {
  return interaction.data.options?.find((o) => o.name === name)?.value;
}

export function button({ label, customId, style = 1, emoji, disabled = false }) {
  const b = { type: 2, style, label, custom_id: customId, disabled };
  if (emoji) b.emoji = { name: emoji };
  return b;
}

export function row(...components) {
  return { type: 1, components };
}

// 드롭다운(선택 메뉴). options: [{ label, value, description?, emoji?, default? }] (최대 25개)
// 사용자가 고른 값은 interaction.data.values 로 들어와요.
export function select({ customId, placeholder, options }) {
  return {
    type: 3,
    custom_id: customId,
    placeholder,
    options: options.map((o) => {
      const opt = { label: o.label, value: o.value, default: o.default === true };
      if (o.description) opt.description = o.description;
      if (o.emoji) opt.emoji = { name: o.emoji };
      return opt;
    }),
  };
}
