import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const PKG = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node_modules/huaweicloud-devkit';
export const MCP = PKG + '/plugins/huaweicloud-core/dist/mcp-server.js';
export const CLI = PKG + '/bin/setup.cjs';
export const DIST = PKG + '/plugins/huaweicloud-core/dist';
export const HOME = 'C:/Users/Administrator';
export const EVID = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/huaweicloud-devkit-test/results/CodeArtsAgent/2026-11-19-119.8.181.45/Windows/evidence';
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
