#!/usr/bin/env node
// D4 安全域精确判读：deny / warn / allow 三态
import { spawn } from 'node:child_process';
const MCP = 'C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
let pass = 0, fail = 0;
function check(n, c, d = '') { if (c) { pass++; console.log(`PASS  ${n}${d ? ' | ' + d : ''}`); } else { fail++; console.log(`FAIL  ${n}${d ? ' | ' + d : ''}`); } }
const child = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = Buffer.alloc(0), seq = 0; const pending = new Map();
function send(method, params = {}) { const id = ++seq; const m = JSON.stringify({ jsonrpc: '2.0', id, method, params }); child.stdin.write(`Content-Length: ${Buffer.byteLength(m)}\r\n\r\n${m}`); return new Promise((r) => pending.set(id, r)); }
child.stdout.on('data', (d) => {
  buf = Buffer.concat([buf, d]);
  while (true) {
    const i = buf.indexOf('\r\n\r\n'); if (i === -1) return;
    const m = buf.subarray(0, i).toString('utf8').match(/Content-Length: (\d+)/i);
    if (!m) { buf = buf.subarray(i + 4); continue; }
    const len = Number(m[1]); if (buf.length < i + 4 + len) return;
    let msg; try { msg = JSON.parse(buf.subarray(i + 4, i + 4 + len).toString('utf8')); } catch { buf = buf.subarray(i + 4 + len); continue; }
    buf = buf.subarray(i + 4 + len); const r = pending.get(msg.id); if (r) { pending.delete(msg.id); r(msg); }
  }
});
child.stderr.on('data', () => {});
const textOf = (r) => (r.result?.content || []).map((x) => x.text || '').join('');
async function hookDecision(name, args) {
  const r = await send('tools/call', { name, arguments: args });
  const t = textOf(r);
  let decision = '?'; let ruleId = '';
  try { const o = JSON.parse(t); decision = o.decision || '?'; ruleId = o.findings?.[0]?.ruleId || ''; } catch {}
  return { decision, ruleId, text: t };
}

try {
  await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'd4b', version: '1' } });
  await send('notifications/initialized', {});

  // D4-1 凭证文件读取（期望 deny）
  let r = await hookDecision('huaweicloud_hook_check_command', { command: 'cat ~/.hcloud/config.json' });
  check('D4-1 凭证文件读取 → deny', r.decision === 'deny', `${r.decision} ${r.ruleId}`);

  // D4-2 凭证 env 打印（期望 deny/block，实际？）
  r = await hookDecision('huaweicloud_hook_check_command', { command: 'printenv HW_ACCESS_KEY' });
  check('D4-2 凭证 env 打印 → deny', r.decision === 'deny', `${r.decision} ${r.ruleId || '(无规则)'}`);

  // D4-15 大小写绕过（deleteservers 小写，期望 deny/识别）
  r = await hookDecision('huaweicloud_hook_check_command', { command: 'hcloud ECS deleteservers --server_id=xxx' });
  check('D4-15 大小写变体 → deny', r.decision === 'deny', `${r.decision} ${r.ruleId}`);

  // D4-16 命令包裹 sh -c（期望 deny/识别内层）
  r = await hookDecision('huaweicloud_hook_check_command', { command: 'sh -c "hcloud ECS DeleteServers --server_id=x"' });
  check('D4-16 sh -c 包裹 → deny', r.decision === 'deny', `${r.decision} ${r.ruleId}`);

  // D4-21 宽泛 IAM 制品（期望 deny）
  r = await hookDecision('huaweicloud_hook_check_artifacts', { artifacts: [{ path: 'policy.json', content: '{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}' }] });
  check('D4-21 宽泛 IAM → deny', r.decision === 'deny', `${r.decision} ${r.ruleId}`);

  // D4-22 公网暴露 deploy plan（期望 warn 或 deny）
  r = await hookDecision('huaweicloud_hook_check_deploy_plan', { plan: { resources: [{ type: 'FunctionGraph', expose: 'public' }] } });
  check('D4-22 公网暴露 → warn/deny', r.decision === 'warn' || r.decision === 'deny', `${r.decision} ${r.ruleId}`);

  // D4-9 破坏性预检（删库/公网安全组，期望 deny 或 warn）
  r = await hookDecision('huaweicloud_hook_check_deploy_plan', { plan: { resources: [{ type: 'RDS', action: 'delete' }] } });
  check('D4-9 破坏性预检 → 风险识别', r.decision === 'warn' || r.decision === 'deny', `${r.decision} ${r.ruleId}`);

  console.log(`\n=== D4 安全域精确判读汇总: ${pass} PASS / ${fail} FAIL ===`);
  child.kill(); process.exit(fail === 0 ? 0 : 1);
} catch (e) { console.error('PROBE_ERROR', e.message); child.kill(); process.exit(2); }
setTimeout(() => { child.kill(); process.exit(3); }, 90000);