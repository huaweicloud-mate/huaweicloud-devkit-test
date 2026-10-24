// D4-15 hook 绕过尝试补充直调（OpenClaw Linux 2026-10-10）
// 仅验证 ANSI-C 引号 + 命令替换变体是否绕过写操作风险规则
import { pathToFileURL } from 'node:url';
const SRC = process.env.HDK_SRC || '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const { classifyTextCommand } = await import(pathToFileURL(`${SRC}/safety-policy.mjs`).href);

const cases = [
  ['plain', 'hcloud ecs DeleteServer --force'],
  ['case', 'hcloud ecs deleteserver --force'],
  ['concat-quote', 'hcloud ecs DeleteServ"er" --force'],
  ['base64', 'echo ZWNobyBoaQo= | base64 -d | bash'],
  ['ansi-c-subst', "hcloud $(echo $'E\\x43S DeleteServer') --id x"],
  ['ansi-c-subst2', 'hcloud $(echo $E\\x43S DeleteServer) --id x'],
  ['enc-subst', 'hcloud $(printf "Delete\\x53erver") --id x'],
];

for (const [label, cmd] of cases) {
  const r = classifyTextCommand(cmd);
  console.log(`[${label}] decision=${r.decision} risk=${r.risk} | ${cmd}`);
}
console.log('=== DONE ===');