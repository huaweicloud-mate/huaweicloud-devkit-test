import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const PKG = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node_modules/huaweicloud-devkit';
export const MCP = PKG + '/plugins/huaweicloud-core/src/mcp-server.mjs';
export const CLI = PKG + '/bin/setup.cjs';
export const DIST = PKG + '/plugins/huaweicloud-core/src';
export const HOME = 'C:/Users/Administrator';
export const EVID = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/huaweicloud-devkit-test/results/CodeArtsAgent/2026-11-24-119.8.181.45/Windows/evidence';
export const VC_QUOTE = '??????????? devkit ??????????? Huawei Cloud?';

export function ts() {
  const d = new Date(Date.now() + 8 * 3600 * 1000);
  return d.toISOString().replace(/[-:T]/g, '').slice(0, 14);
}

function frame(o) {
  const j = JSON.stringify(o);
  return 'Content-Length: ' + Buffer.byteLength(j, 'utf8') + '\r\n\r\n' + j;
}

function parseAll(out) {
  const parts = out.split(/Content-Length:\s*\d+\s*\r\n\r\n/).filter(Boolean);
  const rs = [];
  for (const s of parts) { try { rs.push(JSON.parse(s)); } catch { /* partial frame */ } }
  return rs;
}

function initMsg() {
  return { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'hdk-probe', version: '1.0' } } };
}

export function finishCall(resp) {
  const res = (resp && resp.result) || {};
  const content = (res.content || []).map((c) => c.text || '').join('\n');
  let parsed = null;
  try { parsed = JSON.parse(content); } catch { /* plain text */ }
  return { ok: !(res.isError || (resp && resp.error)), isError: !!(res.isError || (resp && resp.error)), text: content, parsed, error: (resp && resp.error) || null };
}

export function mcpSession(messages, timeoutMs = 60000, envOverride = null) {
  return new Promise((resolve) => {
    const env = envOverride ? { ...process.env, ...envOverride } : process.env;
    const p = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, env });
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d.toString(); });
    p.stderr.on('data', (d) => { err += d.toString(); });
    let delay = 250;
    for (const m of messages) {
      setTimeout(() => { try { p.stdin.write(frame(m)); } catch { /* closed */ } }, delay);
      delay += 700;
    }
    const lastId = messages[messages.length - 1].id;
    let done = false;
    let iv = null;
    const finish = (code) => {
      if (done) return;
      done = true;
      if (iv) clearInterval(iv);
      try { p.kill(); } catch { /* gone */ }
      resolve({ responses: parseAll(out), stderr: err, exitCode: code, raw: out });
    };
    iv = setInterval(() => {
      const rs = parseAll(out);
      if (rs.some((r) => r.id === lastId)) {
        clearInterval(iv);
        setTimeout(() => { try { p.stdin.end(); } catch { /* closed */ } }, 250);
        setTimeout(() => finish(p.exitCode), 800);
      }
    }, 150);
    setTimeout(() => { try { p.stdin.end(); } catch { /* closed */ } }, Math.max(delay + 600, timeoutMs - 1500));
    setTimeout(() => finish('timeout'), timeoutMs);
    p.on('exit', (c) => finish(c));
  });
}

export function mcpTool(name, args = {}, timeoutMs = 60000, envOverride = null) {
  return new Promise((resolve) => {
    const env = envOverride ? { ...process.env, ...envOverride } : process.env;
    const p = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, env });
    let out = '', err = '', done = false, retried = false;
    const send = (o) => { try { p.stdin.write(frame(o)); } catch { /* closed */ } };
    const finish = (v) => { if (done) return; done = true; try { p.kill(); } catch { /* gone */ } resolve(v); };
    p.stdout.on('data', (d) => {
      out += d.toString();
      const rs = parseAll(out);
      const r3 = rs.find((x) => x.id === 3);
      if (r3) { finish(finishCall(r3)); return; }
      const r2 = rs.find((x) => x.id === 2);
      if (r2 && !retried) {
        const f = finishCall(r2);
        if (/Vendor challenge/.test(f.text || '')) { retried = true; send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name, arguments: args } }); }
        else finish(f);
      }
    });
    p.stderr.on('data', (d) => { err += d.toString(); });
    setTimeout(() => send(initMsg()), 250);
    setTimeout(() => send({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name, arguments: args } }), 950);
    setTimeout(() => {
      if (done) return;
      const rs = parseAll(out);
      const r = rs.find((x) => x.id === 3) || rs.find((x) => x.id === 2);
      finish(r ? finishCall(r) : { ok: false, why: 'timeout; stderr=' + err.slice(0, 300) });
    }, timeoutMs);
    p.on('exit', () => {
      if (done) return;
      const rs = parseAll(out);
      const r = rs.find((x) => x.id === 3) || rs.find((x) => x.id === 2);
      finish(r ? finishCall(r) : { ok: false, why: 'no response; stderr=' + err.slice(0, 300) });
    });
  });
}

export function runCli(args, timeoutMs = 120000, envOverride = null) {
  const env = envOverride ? { ...process.env, ...envOverride } : { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' };
  const r = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', timeout: timeoutMs, windowsHide: true, env });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

export function runNode(script, args = [], timeoutMs = 60000, envOverride = null, input = null) {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', timeout: timeoutMs, windowsHide: true, input, env: { ...process.env, ...(envOverride || {}) } });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

export function runHcloud(args, timeoutMs = 240000) {
  const r = spawnSync('hcloud', ['--cli-region=cn-north-4', ...args], { encoding: 'utf8', timeout: timeoutMs, windowsHide: true });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '', parsed: safeJson(r.stdout) };
}

export function safeJson(s) {
  try { return JSON.parse(s); } catch { return null; }
}

export function writeEvidence(id, r) {
  const dir = join(EVID, id);
  mkdirSync(dir, { recursive: true });
  const payload = { caseId: id, status: r.status, why: r.why || '', executedAt: ts(), result: r.result || {} };
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

export function writeProbe(id, title, fn) {
  const src = fn.toString();
  const head = [
    '// Real probe for ' + id + ': ' + title,
    '// Generated from the executed case implementation; rerunnable standalone.',
    "import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';",
    'const run = ' + src + ';',
    'const r = await run();',
    'console.log(JSON.stringify(r, null, 2));',
    '',
  ].join('\n');
  mkdirSync(join(EVID, id), { recursive: true });
  writeFileSync(join(EVID, id, 'probe.mjs'), head, 'utf8');
}

export function decisionOf(parsed) {
  return String((parsed && (parsed.decision || parsed.permissionDecision)) || '').toLowerCase();
}

export const PATHS = {
  hooksJson: HOME + '/.workbuddy/huaweicloud-plugins/hooks/hooks.json',
  hookScript: HOME + '/.workbuddy/huaweicloud-plugins/hooks/huaweicloud-safety.mjs',
  rulesWorkbuddy: HOME + '/.workbuddy/huaweicloud-plugins/rules',
};

export { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, unlinkSync, statSync, copyFileSync } from 'node:fs';
export { join, basename, dirname, resolve, extname, sep } from 'node:path';
export { tmpdir, homedir, platform } from 'node:os';
export { spawnSync, execSync } from 'node:child_process';
import { readFileSync as __rfs } from 'node:fs';
import { mkdirSync as __mks } from 'node:fs';
import { homedir as __hd } from 'node:os';
import { join as __j, dirname as __dn } from 'node:path';
import { tmpdir as __tmp } from 'node:os';
import { spawnSync as __ss } from 'node:child_process';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const iso = (tag) => { const t = __j(__tmp(), 'hdk-iso-' + tag + '-' + Date.now()); __mks(__j(t, '.config', 'huaweicloud'), { recursive: true }); return t; };
export const stamp = ts().slice(2, 14);
const __admin = JSON.parse(__rfs(__hd() + '/.config/huaweicloud/credentials.json', 'utf8'));
export const hc = (args, timeout = 300000) => {
  const r = __ss('hcloud', [...args, '--cli-region=cn-north-4', '--cli-access-key=' + __admin.ak, '--cli-secret-key=' + __admin.sk], { encoding: 'utf8', timeout, windowsHide: true });
  let parsed = null; const s = r.stdout || ''; const i = s.search(/[{\[]/);
  try { parsed = JSON.parse(i >= 0 ? s.slice(i) : s); } catch { }
  return { rc: r.status, out: s.slice(0, 3000), err: (r.stderr || '').slice(0, 800), parsed };
};
export function cleanupStack(stack) {
  const log = [];
  for (const step of stack) { try { log.push({ step: step.kind, id: step.id, res: hc(step.del(step.id), 240000).rc }); } catch (e) { log.push({ step: step.kind, error: String((e && e.message) || e) }); } }
  return log;
}
export async function createVpcStack(vpcName, cidr) {
  const v = hc(['VPC', 'CreateVpc', '--vpc.name=' + vpcName, '--vpc.cidr=' + cidr]);
  const vpcId = v.parsed && v.parsed.vpc && v.parsed.vpc.id;
  if (!vpcId) return { vpcId: null, raw: v, stack: [] };
  const gw = cidr.split('/')[0].split('.').slice(0, 3).join('.') + '.1';
  const subCidr = cidr.split('/')[0].split('.').slice(0, 3).join('.') + '.0/24';
  const s = hc(['VPC', 'CreateSubnet', '--subnet.name=' + vpcName + '-subnet', '--subnet.cidr=' + subCidr, '--subnet.gateway_ip=' + gw, '--subnet.vpc_id=' + vpcId]);
  const subnetId = s.parsed && ((s.parsed.subnet && s.parsed.subnet.id) || s.parsed.id);
  return { vpcId, subnetId, sgId: null, raw: { v, s }, stack: [
    { kind: 'subnet', id: subnetId, del: (id) => ['VPC', 'DeleteSubnet', '--vpc_id=' + vpcId, '--subnet_id=' + id] },
    { kind: 'vpc', id: vpcId, del: (id) => ['VPC', 'DeleteVpc', '--vpc_id=' + id] },
  ] };
}

export const HDK = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk';
export const ENV = { HW_ACCESS_KEY: __admin.ak, HW_SECRET_KEY: __admin.sk };
export const init = { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } };
export function timedSession(messages, timeoutMs = 90000) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, env: { ...process.env } });
    let out = ''; const t0 = Date.now(); const arrivals = {}; const sentAt = {}; let done = false;
    const finish = () => { if (done) return; done = true; try { p.kill(); } catch { } resolve({ arrivals, sentAt, t0, raw: out, responses: parseAll(out) }); };
    p.stdout.on('data', (d) => { out += d.toString(); const rs = parseAll(out); for (const r of rs) if (r && r.id !== undefined && arrivals[r.id] === undefined) arrivals[r.id] = Date.now(); if (rs.some((r) => r.id === messages[messages.length - 1].id)) setTimeout(finish, 300); });
    p.stderr.on('data', () => { });
    messages.forEach((m, i) => { setTimeout(() => { try { sentAt[m.id] = Date.now(); p.stdin.write(frame(m)); } catch { } }, 200 + i * 40); });
    setTimeout(finish, timeoutMs);
    p.on('exit', () => setTimeout(finish, 100));
  });
}
export function spawnSyncPy(script, input) {
  const r = __ss('python', [script], { input, encoding: 'utf8', timeout: 30000, windowsHide: true });
  return (r.stdout || '') + (r.stderr || '');
}
