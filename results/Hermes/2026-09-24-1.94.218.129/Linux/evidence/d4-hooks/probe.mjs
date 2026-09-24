// D4-28 (P0): Node 版安全 hook 链路 + D4-25: Python hook 事件遥测分类
// spawn 真实驱动 hooks/huaweicloud-safety.{mjs,py}
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const CORE = '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
const PLUGINS = '/home/testbot3/devkit-test/Hermes/hdk/plugins';
const NODE_HOOK = `${CORE}/hooks/huaweicloud-safety.mjs`;
const PY_HOOK = `${CORE}/hooks/huaweicloud-safety.py`;
const EVENTS = `${PLUGINS}/telemetry/hook-events.jsonl`;
const OUT = 'file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-24-1.94.218.129/Linux/evidence/d4-hooks/stdout.log';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 240), expected: String(expected) });
}

// ===== D4-28: Node hook =====
function runNodeHook(toolInput) {
  const r = spawnSync(process.execPath, [NODE_HOOK], {
    input: JSON.stringify({ tool_input: toolInput }),
    encoding: 'utf8', timeout: 15000,
  });
  return (r.stdout || '') + (r.stderr || '');
}
{
  const outDeny = runNodeHook({ command: 'printenv HUAWEICLOUD_ACCESS_KEY_ID' });
  test('D4-28', 'node-hook-deny', /permissionDecision":\s*"deny"/.test(outDeny), outDeny.slice(0, 180), '高危命令 → permissionDecision=deny');
  const outCmdField = runNodeHook({ cmd: 'hcloud ECS CreateServers --adminPass=x' });
  test('D4-28', 'node-hook-cmd-field', /permissionDecision":\s*"deny"/.test(outCmdField), outCmdField.slice(0, 180), 'cmd 字段被提取并 deny');
  const outSafe = runNodeHook({ command: 'echo hello world' });
  test('D4-28', 'node-hook-safe-no-deny', !/permissionDecision/.test(outSafe), JSON.stringify(outSafe).slice(0, 80), '非高危无 deny 输出');
  let hooksJson = '';
  try { hooksJson = readFileSync(`${CORE}/hooks/hooks.json`, 'utf8'); } catch {}
  test('D4-28', 'hooks-json-node-registered', /huaweicloud-safety\.mjs/.test(hooksJson), hooksJson.slice(0, 60), 'hooks.json 注册 Node .mjs 实现');
}

// ===== D4-25: Python hook 遥测三键分类 =====
{
  const baseline = existsSync(EVENTS) ? readFileSync(EVENTS, 'utf8') : null;
  const runPy = (toolInput) => spawnSync('python3', [PY_HOOK], {
    input: JSON.stringify({ tool_name: 'Bash', tool_input: toolInput }),
    encoding: 'utf8', timeout: 15000,
  });
  runPy({ command: 'hcloud ECS ListServersDetails --cli-region=cn-north-4' });   // read
  runPy({ command: 'hcloud ECS CreateServers --vpcid=x --adminPass=y' });         // write
  runPy({ command: 'hcloud version' });                                            // other
  let after = existsSync(EVENTS) ? readFileSync(EVENTS, 'utf8') : '';
  if (baseline != null) after = after.slice(baseline.length);
  const lines = after.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const byValue = {};
  for (const e of lines) byValue[e.key] = (byValue[e.key] || 0) + 1;
  test('D4-25', 'cli-read-classified', (byValue['cli:read'] || 0) >= 1, JSON.stringify(byValue), '只读 → cli:read');
  test('D4-25', 'cli-write-classified', (byValue['cli:write'] || 0) >= 1, JSON.stringify(byValue), '写 → cli:write');
  test('D4-25', 'cli-invoke-classified', (byValue['cli:invoke'] || 0) >= 1, JSON.stringify(byValue), '其他 hcloud → cli:invoke');
  // 清理：恢复 baseline（不在 hdk 源库留 hook-events.jsonl）
  try {
    if (baseline == null) { if (existsSync(EVENTS)) require('node:fs').unlinkSync(EVENTS); }
    else writeFileSync(EVENTS, baseline, 'utf8');
  } catch {}
}

const output = JSON.stringify({ total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results }, null, 2);
writeFileSync(new URL(OUT), output, 'utf8');
console.log(output);