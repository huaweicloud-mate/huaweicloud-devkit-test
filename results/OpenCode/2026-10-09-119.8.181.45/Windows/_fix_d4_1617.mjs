// Corrected probes for D4-16 (命令包裹穿透) and D4-17 (hook 模糊 fail-closed).
// Fixes shallow probes that missed: (a) sh -c wrapped credential-dump inner commands,
// (b) hook module fail-open on malformed stdin JSON.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const __dirname = dirname(fileURLToPath(import.meta.url));
const now = () => { const d=new Date(); const p=n=>String(n).padStart(2,'0'); return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds()); };
const HDK = 'C:/Users/Administrator/devkit-test/OpenCode/hdk';
const TS = now();

const tools = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/tools.mjs');
const risk = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/risk-rule-engine.mjs');

function writeCase(id, result, note) {
  const dir = join(__dirname, 'evidence', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.mjs'), `// corrected probe for ${id}\n// ${note}\n`);
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2));
  console.log(id, '->', result.status, '-', result.why);
}

// ===== D4-16: 命令包裹穿透（内层为凭证泄露命令，无写动词）=====
try {
  const cmds = [
    'sh -c "printenv HW_ACCESS_KEY"',
    'sh -c "cat credentials.json"',
    'eval "env"',
  ];
  const details = [];
  let allBlocked = true;
  for (const cmd of cmds) {
    const rd = risk.evaluateCommandRisk ? risk.evaluateCommandRisk(cmd) : null;
    let hook = null;
    try { hook = await tools.callTool('huaweicloud_hook_check_command', { command: cmd }); } catch (e) { hook = { __error: String(e) }; }
    const hookDecision = hook && hook.riskDecision && hook.riskDecision.decision;
    const riskDecision = rd && rd.decision;
    const blocked = hookDecision === 'deny' || riskDecision === 'deny';
    if (!blocked) allBlocked = false;
    details.push({ cmd, riskDecision, hookDecision });
  }
  writeCase('D4-16', allBlocked
    ? { caseId:'D4-16', status:'PASS', why:'包裹内层凭证命令均被拦截(deny)', detail: JSON.stringify(details).slice(0,600), executedAt:TS }
    : { caseId:'D4-16', status:'FAIL', why:'sh -c/eval 包裹凭证泄露命令穿透(risk-rule-engine 未识别内层命令)', detail: JSON.stringify(details).slice(0,600),
        rootCause:'plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:14/35 规则锚点 (^|\\s) 不匹配 sh -c "..." 内层命令；risk-rule-engine.mjs evaluate 未复用 safety-policy.mjs extractInnerCommand', executedAt:TS },
    'corrected: uses credential-dump inner commands');
} catch (e) { writeCase('D4-16', { caseId:'D4-16', status:'FAIL', why:'err: '+e.message, executedAt:TS }, 'corrected'); }

// ===== D4-17: hook 模糊输入 fail-closed =====
try {
  const hookPath = HDK + '/plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs';
  function runHook(input) {
    const r = spawnSync(process.execPath, [hookPath], { input, encoding: 'utf8' });
    return ((r.stdout || '') + (r.stderr || '')).trim();
  }
  const invalidJson = runHook('not-json');
  const truncated = runHook('{"tool_input":');
  const writeDeny = runHook(JSON.stringify({ tool_input: { command: 'hcloud ECS delete-servers --server-ids x' } }));
  const invalidDenies = /permissionDecision"?\s*:\s*"?deny/.test(invalidJson);
  const truncatedDenies = /permissionDecision"?\s*:\s*"?deny/.test(truncated);
  const failClosed = invalidDenies && truncatedDenies;
  writeCase('D4-17', failClosed
    ? { caseId:'D4-17', status:'PASS', why:'非法/截断 JSON 均 fail-closed(deny)', detail: JSON.stringify({ invalidJson: invalidJson.slice(0,120), truncated: truncated.slice(0,120) }), executedAt:TS }
    : { caseId:'D4-17', status:'FAIL', why:'hook 对非法/截断 stdin JSON fail-open(静默 return，不 deny)', detail: JSON.stringify({ invalidJson: invalidJson.slice(0,120), truncated: truncated.slice(0,120), writeDeny: writeDeny.slice(0,120) }),
        rootCause:'plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs:47-49 catch { return; } 未 fail-closed', executedAt:TS },
    'corrected: feeds malformed JSON to hook stdin');
} catch (e) { writeCase('D4-17', { caseId:'D4-17', status:'FAIL', why:'err: '+e.message, executedAt:TS }, 'corrected'); }
