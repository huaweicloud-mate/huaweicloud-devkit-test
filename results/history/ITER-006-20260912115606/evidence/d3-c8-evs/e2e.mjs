#!/usr/bin/env node
// D3-C8 EVS 生命周期（修正版）：查 AZ → 创建(SAS 10G) → ShowVolume → 释放 → 归零
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HDK = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', 'hdk');
const MCP = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
const REGION = 'cn-north-4';
const TAG = `tctest-evs-${Date.now()}`;
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
function parseOuter(t) {
  let o = null; try { o = JSON.parse(t); } catch {}
  let inner = null;
  if (o && typeof o.stdout === 'string') { try { inner = JSON.parse(o.stdout); } catch { inner = null; } }
  return { ok: o?.ok === true, exitCode: o?.exitCode, outer: o, inner, raw: t };
}
async function run(args) {
  const p = await send('tools/call', { name: 'huaweicloud_plan_cli_command', arguments: { args, allowWrites: true } });
  let pj = null; try { pj = JSON.parse(textOf(p)); } catch {}
  const r = await send('tools/call', { name: 'huaweicloud_run_approved_command', arguments: { args, approvalToken: pj?.approvalToken, approvedByUser: true } });
  return { ...parseOuter(textOf(r)), error: r.error };
}
async function runRO(args) {
  const r = await send('tools/call', { name: 'huaweicloud_run_readonly_command', arguments: { args } });
  return { ...parseOuter(textOf(r)), error: r.error };
}
let createdId = null;
(async () => {
  try {
    await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'd3c8c', version: '1' } });
    await send('notifications/initialized', {});
    const az = await runRO(['ECS', 'NovaListAvailabilityZones', `--cli-region=${REGION}`]);
    const azMatch = (az.raw.match(/cn-north-4[a-z]/) || [])[0] || 'cn-north-4a';
    console.log('INFO  可用区=', azMatch);
    const c = await run(['EVS', 'CreateVolume', `--volume.availability_zone=${azMatch}`, '--volume.volume_type=SAS', '--volume.size=10', `--volume.name=${TAG}`, `--cli-region=${REGION}`]);
    const vid = c.inner?.volume_ids?.[0] || c.inner?.volume?.id;
    check('D3-C8 创建 EVS 成功并返回 volume_id', c.ok === true && !!vid, `ok=${c.ok} id=${String(vid || '').slice(0, 12)}...`);
    if (vid) {
      createdId = vid;
      const sv = await runRO(['EVS', 'ShowVolume', `--volume_id=${vid}`, `--cli-region=${REGION}`]);
      const svOk = /SAS|available|creating|error|in-use/i.test(sv.raw) && !/EVS.5404|could not be found/i.test(sv.raw);
      check('D3-C8 ShowVolume 可查(无 not found)', svOk, sv.raw.slice(0, 120).replace(/\n/g, ' '));
      const d = await run(['EVS', 'DeleteVolume', `--volume_id=${vid}`, `--cli-region=${REGION}`]);
      check('D3-C8 释放 EVS 成功', d.ok === true, `ok=${d.ok}`);
      const sv2 = await runRO(['EVS', 'ShowVolume', `--volume_id=${vid}`, `--cli-region=${REGION}`]);
      check('D3-C8 归零(卷不存在 EVS.5404)', /EVS.5404|could not be found|not found/i.test(sv2.raw), '');
      createdId = null;
    }
    console.log(`\n=== D3-C8 EVS 生命周期汇总: ${pass} PASS / ${fail} FAIL ===`);
    child.kill(); process.exit(fail === 0 ? 0 : 1);
  } catch (e) {
    console.error('PROBE_ERROR', e.message);
    if (createdId) { try { await run(['EVS', 'DeleteVolume', `--volume_id=${createdId}`, `--cli-region=${REGION}`]); console.log('CLEANUP 已释放', createdId); } catch {} }
    child.kill(); process.exit(2);
  }
})();
setTimeout(() => { if (createdId) console.log('TIMEOUT 需手动释放', createdId); child.kill(); process.exit(3); }, 300000);