import { spawnSync } from 'node:child_process';
import { runNode, writeEvidence, writeProbe, DIST, HOME } from './lib.mjs';
import { existsSync, readFileSync } from 'node:fs';

const cases = [];
const pyHook = HOME + '/.workbuddy/huaweicloud-plugins/hooks/huaweicloud-safety.py';
const mjsHook = HOME + '/.workbuddy/huaweicloud-plugins/hooks/huaweicloud-safety.mjs';
const runPy = (input) => { const r = spawnSync('python', [pyHook], { input, encoding: 'utf8', timeout: 30000, windowsHide: true }); return (r.stdout || '') + (r.stderr || ''); };

cases.push({ id: 'D4-6', title: 'adminPass 回显警告与脱敏', fn: async () => {
  const sp = await import('file:///' + DIST + '/safety-policy.mjs');
  const hc = await import('file:///' + DIST + '/hcloud-cli.mjs');
  const s1 = sp.redactSecrets('create ECS adminPass=MySecret123! region=cn-north-4');
  const out = hc.redactOutput('password: MySecret123! accessKeyId: AK_TEST_PLACEHOLDER_VALUE secretAccessKey: SK_TEST_PLACEHOLDER_VALUE_0000');
  const ok = !s1.includes('MySecret123!') && s1.includes('<redacted>') && !/MySecret123!|SK_TEST_PLACEHOLDER_VALUE_0000/.test(out);
  return { status: ok ? 'PASS' : 'FAIL', why: 'adminPass= 已脱敏=' + !s1.includes('MySecret123!') + '；CLI回显密码/SK已脱敏=' + !/MySecret123!|SK_TEST_PLACEHOLDER_VALUE_0000/.test(out) + '；注：JSON字符串键形式 adminPass 后接引号未命中（潜在改进点）', result: { s1, out } };
} });

cases.push({ id: 'D4-8', title: 'Python/Node 策略一致', fn: async () => {
  const cmds = ['hcloud ECS DeleteServers --server_id=x', 'hcloud ECS ListServersDetails', 'type C://Users//Administrator//.hcloud//config.json'];
  const out = [];
  for (const c of cmds) {
    const input = JSON.stringify({ tool_name: 'Bash', tool_input: { command: c } });
    const n = runNode(mjsHook, [], 30000, null, input);
    const p = runPy(input);
    const nd = /permissionDecision"\s*:\s*"deny"/.test(n.stdout) ? 'deny' : 'allow';
    const pd = /permissionDecision"\s*:\s*"deny"/.test(p) ? 'deny' : 'allow';
    out.push({ cmd: c, node: nd, python: pd, same: nd === pd });
  }
  const ok = out.every((x) => x.same);
  return { status: ok ? 'PASS' : 'FAIL', why: '三条命令双路径判定：' + out.map((x) => x.node + '/' + x.python).join(', '), result: out };
} });

cases.push({ id: 'D4-25', title: 'Python hook 事件遥测分类', fn: async () => {
  const ev = HOME + '/.workbuddy/huaweicloud-plugins/telemetry/hook-events.jsonl';
  const before = existsSync(ev) ? readFileSync(ev, 'utf8').split('\n').filter(Boolean).length : 0;
  const cmds = ['hcloud ECS ListServersDetails', 'hcloud ECS DeleteServers --server_id=x', 'echo hello'];
  for (const c of cmds) runPy(JSON.stringify({ tool_name: 'Bash', tool_input: { command: c } }));
  const lines = existsSync(ev) ? readFileSync(ev, 'utf8').split('\n').filter(Boolean) : [];
  const tail = lines.slice(before).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const caps = tail.map((e) => e.capability || e.value || '');
  const ok = caps.includes('cli:read') && caps.includes('cli:write') && caps.includes('cli:invoke');
  return { status: ok ? 'PASS' : 'FAIL', why: '新增事件=' + tail.length + ' 分类=' + caps.join(','), result: { path: ev, events: tail.slice(-6) } };
} });

cases.push({ id: 'D4-27', title: '双路径输出脱敏', fn: async () => {
  const sp = await import('file:///' + DIST + '/safety-policy.mjs');
  const hc = await import('file:///' + DIST + '/hcloud-cli.mjs');
  const obj = { accessKeyId: 'AK_TEST_PLACEHOLDER_VALUE', secretAccessKey: 'SK_TEST_PLACEHOLDER_VALUE_0000', securityToken: 'token-abc-123', region: 'cn-north-4', name: 'vm1' };
  const a = sp.redactSecrets(obj);
  const b = JSON.parse(hc.redactOutput(JSON.stringify(obj)));
  const bad = (x) => /AK_TEST_PLACEHOLDER_VALUE|SK_TEST_PLACEHOLDER_VALUE_0000|token-abc-123/.test(JSON.stringify(x));
  const ok = !bad(a) && !bad(b) && a.region === 'cn-north-4' && a.name === 'vm1' && b.region === 'cn-north-4' && b.name === 'vm1';
  return { status: ok ? 'PASS' : 'FAIL', why: 'redactSecrets 脱敏=' + !bad(a) + ' redactOutput 脱敏=' + !bad(b) + ' 非敏感字段保留=' + (a.region === 'cn-north-4' && a.name === 'vm1'), result: { a, b } };
} });

cases.push({ id: 'D8-9', title: '安装 ID 与遥测值脱敏', fn: async () => {
  const tel = await import('file:///' + DIST + '/telemetry/telemetry.mjs');
  const id1 = tel.generateOrRecoverInstallId();
  const id2 = tel.generateOrRecoverInstallId();
  const s = tel.sanitizeValue('ak=AK_TEST_PLACEHOLDER_VALUE token=secret-token-123 name=ok-value bad=a\nb');
  const st = String(s);
  const ok = !!id1 && id1 === id2 && !/AK_TEST_PLACEHOLDER_VALUE|secret-token-123/.test(st) && /ok-value/.test(st);
  return { status: ok ? 'PASS' : 'FAIL', why: 'installId 稳定=' + (!!id1 && id1 === id2) + ' 敏感值已脱敏=' + !/AK_TEST_PLACEHOLDER_VALUE|secret-token-123/.test(st) + ' 合法值保留=' + /ok-value/.test(st), result: { id1, id2, sanitized: s } };
} });

for (const c of cases) {
  const t0 = Date.now();
  let r;
  try { r = await c.fn(); } catch (e) { r = { status: 'FAIL', why: 'probe exception: ' + (e && e.message), result: { stack: String((e && e.stack) || '').slice(0, 700) } }; }
  writeEvidence(c.id, r);
  try { writeProbe(c.id, c.title, c.fn); } catch {}
  console.log(c.id.padEnd(8), r.status.padEnd(13), String(Date.now() - t0).padStart(6), 'ms |', String(r.why || '').slice(0, 200));
}
