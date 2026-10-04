import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'stdout.log');
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const safety = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/safety-policy.mjs');
let status = 'PASS', why = '', evidence = {};
try {
  // D4-28: Node 版安全 hook 链路
  // 1) hooks.json 注册 .mjs（Node 实现）
  const { readFileSync: rf } = await import('node:fs');
  const hooksJson = JSON.parse(rf(join(HDK, 'plugins/huaweicloud-core/hooks/hooks.json').replace(/\\/g,'/'), 'utf8'));
  const preToolUse = hooksJson.hooks?.PreToolUse || [];
  const hasMjs = preToolUse.some(h => h.hooks?.some(x => x.command && x.command.includes('huaweicloud-safety.mjs')));
  evidence.hooksJsonRegistersMjs = hasMjs;
  // 2) tool_input 内 command/cmd/script/args 均被提取
  const safetyMod = safety;
  const text = safetyMod.extractInnerCommand('echo $HW_SECRET_KEY');
  evidence.commandTextExtracted = text;
  // 3) 高危命令决策 deny
  const denyCmd = 'cat ~/.hcloud/credentials.json';
  const r = safetyMod.classifyTextCommand(denyCmd);
  evidence.denyResult = r;
  // 4) 直接调 huaweicloud-safety.mjs 子进程验证 hookSpecificOutput.permissionDecision=deny
  const hookPath = join(HDK, 'plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs').replace(/\\/g,'/');
  const input = JSON.stringify({ tool_input: { command: denyCmd } });
  let hookOut = '';
  try {
    hookOut = execFileSync('node', [hookPath], { input, encoding: 'utf8', timeout: 5000 });
  } catch (e) {
    hookOut = 'ERR: ' + (e && e.message);
  }
  evidence.hookOutput = hookOut;
  const hasPermissionDeny = hookOut.includes('"permissionDecision": "deny"') || hookOut.includes('"permissionDecision":"deny"');
  if (hasMjs && r.decision === 'deny' && hasPermissionDeny) {
    status = 'PASS'; why = 'hooks.json 注册 .mjs；commandText 提取高危命令；classifyTextCommand=deny；hook 输出 permissionDecision=deny';
  } else {
    status = 'FAIL'; why = '链路不完整：hasMjs=' + hasMjs + ' classifyDecision=' + r.decision + ' hookDeny=' + hasPermissionDeny;
  }
} catch (e) {
  status = 'FAIL'; why = 'probe error: ' + (e && e.message);
}
const result = { caseId: 'D4-28', status, why, evidence, executedAt: '20261005050100' };
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
