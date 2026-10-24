// probe_d169_d428.mjs — D1-69 (CLI help) + D4-28 (Node safety hook chain)
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR;
const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
function rec(id, status, title, expected, actual, detail = '') {
  const d = join(EVID, id); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), JSON.stringify({ status, caseId: id, title, expected, actual, detail, executedAt: now14(), probe: 'probe_d169_d428.mjs' }, null, 2), 'utf8');
  console.log(`${status}\t${id}\t${actual}`);
}

// ---------------- D1-69 CLI help 子命令 ----------------
try {
  const r = spawnSync('huaweicloud-devkit', ['help'], { encoding: 'utf8', timeout: 60000, env: process.env });
  const out = (r.stdout || '') + (r.stderr || '');
  const hasCmds = /install/.test(out) && /uninstall/.test(out) && /doctor/.test(out) && /status/.test(out);
  const ok = r.status === 0 && out.trim().length > 100 && hasCmds;
  rec('D1-69', ok ? 'PASS' : 'FAIL', 'CLI help 子命令',
    'help 子命令输出帮助且有退出码 0，非 TODO/空输出',
    `exit=${r.status} 输出行数=${out.split('\n').length} 含命令列表=${hasCmds}`);
} catch (e) { rec('D1-69', 'FAIL', 'CLI help 子命令', '', 'probe error: ' + e.message); }

// ---------------- D4-28 Node 版安全 hook 链路 ----------------
try {
  const hook = join(HDK, 'hooks/huaweicloud-safety.mjs');
  const hooksJson = readFileSync(join(HDK, 'hooks/hooks.json'), 'utf8');
  const registered = /huaweicloud-safety\.mjs/.test(hooksJson);
  const cases = [
    { label: 'echo-cred', payload: { tool_name: 'Bash', tool_input: { command: 'echo $HW_SECRET_KEY' } }, expectDeny: true },
    { label: 'high-risk-write', payload: { tool_name: 'Bash', tool_input: { command: 'hcloud ECS DeleteServers --server_ids i-123' } }, expectDeny: true },
    { label: 'cred-file', payload: { tool_name: 'Bash', tool_input: { script: 'cat ~/.hcloud/credentials' } }, expectDeny: true },
    { label: 'safe-read', payload: { tool_name: 'Bash', tool_input: { command: 'ls -la' } }, expectDeny: false },
    { label: 'cmd-key', payload: { tool_name: 'Bash', tool_input: { cmd: 'hcloud ECS DeleteServers' } }, expectDeny: true },
  ];
  const results = [];
  for (const c of cases) {
    const r = spawnSync('node', [hook], { input: JSON.stringify(c.payload), encoding: 'utf8', timeout: 20000 });
    const out = (r.stdout || '') + (r.stderr || '');
    const denied = /"permissionDecision"\s*:\s*"deny"/.test(out) || /deny/i.test(out);
    results.push({ label: c.label, denied, expectDeny: c.expectDeny, ok: denied === c.expectDeny, snippet: out.slice(0, 90) });
  }
  const allOk = results.every((x) => x.ok) && registered;
  rec('D4-28', allOk ? 'PASS' : 'FAIL', 'Node 版安全 hook 链路',
    'hooks.json 注册 .mjs；command/cmd/script/args 均被提取；高危 deny 输出 permissionDecision=deny；非高危无 deny',
    `hooks.json注册mjs=${registered}; ${results.map((x) => `${x.label}:${x.denied ? 'deny' : 'allow'}${x.ok ? '' : '(不符)'}`).join(' ')}`);
} catch (e) { rec('D4-28', 'FAIL', 'Node 版安全 hook 链路', '', 'probe error: ' + e.message); }
console.log('probe_d169_d428.mjs DONE');
