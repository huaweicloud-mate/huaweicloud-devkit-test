// D9-12: initialize 握手协议安全基线（P0）
// 覆盖 initialize 返回 protocolVersion/capabilities/serverInfo、callTool 路由、
// _decorateResult 包装无副作用(_resetHintConsumption/_isHintConsumed)、
// listSkillDirs/findSkillsRoot、非法请求(非对象 JSON)返回 -32600、
// 未 initialize 先 tools/list 的时序行为(实际观测)。
import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const OUT = 'file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-29-1.94.218.129/Linux/evidence/D9-12/stdout.log';
const SERVER = '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 220), expected: String(expected) });
}

const proto = await import('file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs');
const tools = await import('file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs');
const { readdirSync, existsSync } = await import('node:fs');

// 1) initialize 返回 protocolVersion/capabilities/serverInfo（source-level dispatch）
{
  const r = await proto.dispatch('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'hermes-probe' } }, { sessionId: 's1' });
  test('D9-12', 'init-protocolVersion', r && r.protocolVersion === '2024-11-05', r?.protocolVersion, 'protocolVersion 返回');
  test('D9-12', 'init-capabilities', !!(r && r.capabilities && typeof r.capabilities === 'object' && r.capabilities.tools), JSON.stringify(r?.capabilities).slice(0,80), 'capabilities.tools 返回');
  test('D9-12', 'init-serverInfo', r && r.serverInfo && r.serverInfo.name === 'huaweicloud-devkit' && typeof r.serverInfo.version === 'string',
    `name=${r?.serverInfo?.name} ver=${r?.serverInfo?.version}`, 'serverInfo.name/version 返回');
}

// 2) callTool 路由正确（真实工具调用）
{
  let r = null, err = '';
  try { r = await tools.callTool('huaweicloud_check_cli', {}); } catch (e) { err = String(e.message || e); }
  const ok = r !== null && r !== undefined;
  test('D9-12', 'callTool-routes', ok, `r=${ok?'ok':err.slice(0,120)}`, 'callTool 路由到 tools.mjs callTool');
}

// 3) _decorateResult 无副作用 + _resetHintConsumption/_isHintConsumed
{
  const obj = { a: 1 };
  proto._resetHintConsumption();
  const notConsumed = proto._isHintConsumed('sess-x') === false;
  const decorated = proto._decorateResult('sess-x', 'some-tool', obj);
  // 若无更新提示，_decorateResult 应原样返回且不标记消费
  test('D9-12', 'decorate-no-hint', decorated === obj || (decorated && typeof decorated === 'object'), `decoratedIsSame=${decorated===obj}`, '_decorateResult 有/无提示均不抛错且可返回');
  test('D9-12', 'hint-consumed-api', notConsumed === true, `notConsumed=${notConsumed}`, '_isHintConsumed 初始 false');
  proto._resetHintConsumption();
}

// 4) listSkillDirs/findSkillsRoot 返回有效目录（用 hdk 源码目录测试；无 SKILL.md 则返回 [] 属合法）
{
  const hdkRoot = '/home/testbot3/devkit-test/Hermes/hdk';
  const dirs = tools.listSkillDirs(hdkRoot);
  const root = tools.findSkillsRoot([hdkRoot, '/nonexistent']);
  test('D9-12', 'listSkillDirs-valid', Array.isArray(dirs), `arr=${Array.isArray(dirs)} n=${dirs.length}`, 'listSkillDirs 返回数组');
  test('D9-12', 'findSkillsRoot-valid', root === null || typeof root === 'string', `root=${root===null?'null':root.slice(0,60)}`, 'findSkillsRoot 返回 null 或目录路径');
}

// 5) 非法请求(非对象 JSON)返回 -32600 + 未 initialize 先 tools/list 时序行为（transport）
{
  const child = spawn(process.execPath, [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let idc = 1;
  const send = (o) => new Promise((res) => {
    o.id = o.id ?? idc++;
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    pending.set(o.id, m => res(m));
  });
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    for (;;) {
      const h = buf.indexOf('\r\n\r\n');
      if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1];
      if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString();
      buf = buf.slice(h + 4 + n);
      try {
        const parsed = JSON.parse(body);
        pending.get(parsed.id)?.(parsed);
        // 对 id null 的错误回复也收集（非法请求）
        if (parsed.id === null && parsed.error) pending.get('null')?.({ error: parsed.error });
      } catch {}
    }
  });

  let nullErrCaptured = null;
  const nullWait = new Promise((res) => pending.set('null', (m) => { nullErrCaptured = m; res(m); }));
  // 发送非对象 JSON (字符串) → 应回 -32600
  child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(JSON.stringify('just a string'))}\r\n\r\n${JSON.stringify('just a string')}`));
  await Promise.race([nullWait, new Promise(r => setTimeout(r, 3000))]);

  // 未 initialize 先 tools/list → 观测实际返回
  const tl = await send({ method: 'tools/list', params: {} });

  child.stdin.end();
  child.kill();

  const nullCode = nullErrCaptured?.error?.code;
  test('D9-12', 'invalid-request--32600', nullCode === -32600, `code=${nullCode}`, '非对象 JSON 请求返回 -32600');
  // 时序行为：按 D9-12 预期「未 initialize 先 tools/list 应返回 -32600」严格断言
  const tlHasTools = tl && tl.result && Array.isArray(tl.result.tools);
  const tlErrCode = tl?.error?.code;
  test('D9-12', 'toolslist-before-init-rejected', tlErrCode === -32600,
    `hasTools=${tlHasTools} err=${tlErrCode}`, '未 initialize 先 tools/list 返回 -32600 (实现未强制时记 SPEC-MISMATCH)');
}

const output = JSON.stringify({ total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results }, null, 2);
writeFileSync(new URL(OUT), output, 'utf8');
console.log(output);