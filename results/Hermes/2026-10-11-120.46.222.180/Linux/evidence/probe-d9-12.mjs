// D9-12 initialize 握手协议安全基线 — Hermes / Linux / v1.1.7
// spawn mcp-server over stdin/stdout, 核对 initialize/tools.list/callTool/非法时序
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const EVID = process.env.EVID_DIR || dirname(fileURLToPath(import.meta.url));
const SERVER = process.env.HDK_MCP_SERVER || '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';

function spawnServer() {
  const child = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let nextId = 1;
  const received = [];
  child.stdout.on('data', (c) => {
    buf = Buffer.concat([buf, c]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n');
      if (h === -1) break;
      const m = buf.subarray(0, h).toString().match(/Content-Length:\s*(\d+)/i);
      if (!m) { buf = Buffer.alloc(0); break; }
      const len = Number(m[1]);
      const end = h + 4 + len;
      if (buf.length < end) break;
      const body = buf.subarray(h + 4, end).toString();
      buf = buf.subarray(end);
      const msg = JSON.parse(body);
      received.push(msg);
      if (pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    }
  });
  child.stderr.on('data', () => {});
  const rpc = (method, params) => new Promise((resolve) => {
    const id = nextId++;
    const payload = JSON.stringify({ jsonrpc: '2.0', id, method, params });
    child.stdin.write(`Content-Length: ${Buffer.byteLength(payload)}\r\n\r\n${payload}`);
    pending.set(id, resolve);
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); resolve({ id, __timeout: true }); } }, 15000);
  });
  return { child, rpc };
}

function rec(cid, lines) {
  mkdirSync(join(EVID, cid), { recursive: true });
  writeFileSync(join(EVID, cid, 'stdout.txt'), lines.join('\n') + '\n', 'utf8');
  console.log(lines.join('\n'));
}

(async () => {
  const lines = ['=== D9-12 initialize 握手协议安全基线 (v1.1.7) ==='];
  let allPass = true;
  const chk = (ok, label, detail) => { lines.push(`  ${ok ? 'PASS' : 'FAIL'}  ${label}  ${detail || ''}`); if (!ok) allPass = false; return ok; };

  // 场景 A：正常时序 initialize → tools/list → tools/call
  {
    const { child, rpc } = spawnServer();
    const init = await rpc('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'hermes' } });
    chk(Boolean(init?.result?.protocolVersion), '[1] initialize 返回 protocolVersion', `protocol=${init?.result?.protocolVersion}`);
    chk(Boolean(init?.result?.capabilities?.tools), '[2] initialize 返回 capabilities', `capabilities=${JSON.stringify(init?.result?.capabilities)}`);
    chk(init?.result?.serverInfo?.name === 'huaweicloud-devkit' && Boolean(init?.result?.serverInfo?.version), '[3] initialize 返回 serverInfo', `server=${init?.result?.serverInfo?.name} v${init?.result?.serverInfo?.version}`);

    const list = await rpc('tools/list', {});
    chk(Array.isArray(list?.result?.tools) && list?.result?.tools.length === 40, '[4] tools/list=40 工具', `count=${list?.result?.tools?.length}`);

    const call = await rpc('tools/call', { name: 'huaweicloud_check_cli', arguments: {} });
    const c = call?.result;
    const okCall = c && Array.isArray(c.content) && c.content[0]?.type === 'text' && c.isError === false;
    let runVersionOk = false;
    try { const t = JSON.parse(c?.content?.[0]?.text); runVersionOk = typeof t === 'object' && 'installed' in t && 'authenticated' in t; } catch {}
    chk(okCall, '[5] callTool 路由到 tools.mjs callTool', `content type=${c?.content?.[0]?.type}`);
    chk(runVersionOk, '[6] check_cli → runVersionCheck 结构化返回', runVersionOk ? `keys=${Object.keys(JSON.parse(c.content[0].text)).slice(0,6).join(',')}` : `raw=${c?.content?.[0]?.text?.slice(0,120)}`);

    child.stdin.end();
    try { child.kill(); } catch {}
  }

  // 场景 B：非法时序（未 initialize 先 tools/list）→ 期望 -32600
  {
    const { child, rpc } = spawnServer();
    const before = await rpc('tools/list', {});
    const isErr = Boolean(before?.error?.code);
    const code = before?.error?.code ?? null;
    const rejected32600 = code === -32600;
    chk(rejected32600, '[7] 非法时序(未 initialize 先 tools/list) 返回 -32600',
       isErr ? `实际 error=${code} ${rejected32600 ? '' : '<<< 未按 -32600 拒绝'}` : `实际返回 200 tools=${before?.result?.tools?.length} <<< 未拒绝`);
    child.stdin.end();
    try { child.kill(); } catch {}
  }

  // 场景 C：源码级 _decorateResult / listSkillDirs / findSkillsRoot
  {
    const mp = await import(`file://${process.env.HDK_PLUGIN_SRC}/src/mcp-protocol.mjs`);
    const tools = await import(`file://${process.env.HDK_PLUGIN_SRC}/src/tools.mjs`);
    const fns = ['_decorateResult', '_resetHintConsumption', '_isHintConsumed', 'listSkillDirs', 'findSkillsRoot'];
    const hasFn = fns.filter((f) => typeof mp[f] === 'function' || typeof tools[f] === 'function');
    chk(hasFn.length === fns.length, '[8] 协议/技能函数暴露', `缺: ${fns.filter((f)=>!(typeof mp[f]==='function'||typeof tools[f]==='function')).join(',')||'无'}`);

    // _decorateResult 兜底不抛错、不改变无 hint 结果
    mp._resetHintConsumption();
    const decorated = mp._decorateResult('d9-12-test', 'huaweicloud_list_regions', { x: 1 });
    chk(decorated && decorated.x === 1, '[9] _decorateResult 无 hint 兜底不抛错', JSON.stringify(decorated));
    chk(mp._isHintConsumed('d9-12-test') === false, '[10] _isHintConsumed 初始 false', `consumed=${mp._isHintConsumed('d9-12-test')}`);

    // listSkillDirs 对 hdk 内 skills 目录返回有效技能名
    const skillRoot = join(process.env.HDK_PLUGIN_SRC, '..', '..', 'skills');
    const dirs = tools.listSkillDirs ? tools.listSkillDirs(skillRoot) : [];
    chk(Array.isArray(dirs), '[11] listSkillDirs 返回数组', `dirs=${JSON.stringify(dirs)}`);
    const found = tools.findSkillsRoot ? tools.findSkillsRoot([skillRoot, '/nonexistent']) : null;
    chk(found === skillRoot || (found && typeof found === 'string'), '[12] findSkillsRoot 命中有效目录', `found=${found}`);
  }

  lines.push(`RESULT: ${allPass ? 'PASS' : 'FAIL'}`);
  rec('D9-12', lines);
})();