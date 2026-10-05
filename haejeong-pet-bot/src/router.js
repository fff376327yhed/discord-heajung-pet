// 들어온 요청을 알맞은 명령어/버튼에게 나눠주는 안내 데스크예요 🧭
import * as start from './commands/start.js';
import * as profile from './commands/profile.js';
import * as places from './commands/places.js';
import { InteractionType, reply } from './utils/discord.js';

// ✨ 새 명령어를 만들면 여기에 한 줄만 추가하면 돼요!
const modules = [start, profile, places];

const commands = new Map(modules.map((m) => [m.data.name, m]));

// 버튼 이름표(custom_id 맨 앞 글자)로 담당 함수를 찾아요
const componentHandlers = new Map();
for (const m of modules) {
  for (const [prefix, fn] of Object.entries(m.components ?? {})) {
    componentHandlers.set(prefix, fn);
  }
}

export const commandDefinitions = modules.map((m) => m.data);

export async function handleInteraction(interaction) {
  switch (interaction.type) {
    case InteractionType.PING:
      return { type: 1 };

    case InteractionType.COMMAND: {
      const cmd = commands.get(interaction.data.name);
      if (!cmd) return reply({ content: '모르는 명령어예요 🤔' }, { ephemeral: true });
      return cmd.execute(interaction);
    }

    case InteractionType.COMPONENT: {
      const [prefix, ...args] = interaction.data.custom_id.split(':');
      const handler = componentHandlers.get(prefix);
      if (!handler) return reply({ content: '이 버튼은 이제 쓸 수 없어요 🥲' }, { ephemeral: true });
      return handler(interaction, args);
    }

    default:
      return reply({ content: '아직 모르는 종류의 요청이에요 🤔' }, { ephemeral: true });
  }
}
