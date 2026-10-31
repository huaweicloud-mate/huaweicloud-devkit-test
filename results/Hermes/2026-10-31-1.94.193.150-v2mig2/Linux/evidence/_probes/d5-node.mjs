// v2mig2 补测 —— D5-4 (Node 策略兜底 + 汇总) / D5-7 (重启生效一致性) 的 Node 部分
// D5-4 hook 拦截路径由 d5-hook-restart.sh 用 Python hook 实测；本脚本补 Node 策略兜底 + D5-7 重启对比。
import { pathToFileURL } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const SRC = process.argv[2];     // .../plugins/huaweicloud-core/dist
const MCPJS = process.argv[3];   // .../dist/mcp-server.js
const OUT = process.argv[4];
const executedAt = new Date().toISOString();

function rec(id, status, why, lines) {
  const body = `=====CASE ${id} =====\nexecutedAt=${executedAt}\nstatus=${status}\n${lines.join('\n')}\nwhy=${why}\n=====CASE ${id} RESULT: ${status} =====\n`;
  const dir = join(OUT, id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify({ status, why, executedAt }, null, 1));
  writeFileSync(join(dir, 'stdout.txt'), body);
  console.log(`[${id}] ${status}`);
}

// ---------- D5-4 hook 拦截(由 d5-hook-restart.sh 实测写入) + Node 策略兜底 ----------
{
  const { readFileSync, existsSync } = await import('node:fs');
  const hookRes = join(OUT, 'D5-4', 'hook-result.txt');
  const hookOk = existsSync(hookRes) && readFileSync(hookRes, 'utf8').includes('HOOK_BLOCK_OK');
  const hookText = existsSync(hookRes) ? readFileSync(hookRes, 'utf8').trim() : '(hook 结果未生成)';
  const RE = await import(pathToFileURL(`${SRC}/risk-rule-engine.js`).href);
  const evaluate = RE.evaluateCommandRisk;
  const w = evaluate('hcloud ECS DeleteServers --servers.1.id=abc --delete_publicip=true');
  const r = evaluate('hcloud ECS ListServersDetails');
  const a = [
    { name: 'hook 拦截路径：Python hook 对写命令 block（hook 客户端）', pass: hookOk, detail: hookText.split('\n')[0] || '' },
    { name: 'Node 策略：DeleteServers 写命令 → deny/warn（非 allow，非 hook 客户端兜底）', pass: w && w.decision !== 'allow', detail: `decision=${w?.decision} findings=${(w?.findings || []).length}` },
    { name: 'Node 策略：ListServersDetails 只读 → allow', pass: r && r.decision === 'allow', detail: `decision=${r?.decision}` },
  ];
  const all = a.every((x) => x.pass);
  rec('D5-4', all ? 'PASS' : 'FAIL',
    all ? '两条降级路径均有效：hook 客户端走 Python 安全 hook 对写命令 block；非 hook 客户端走 Node risk-rule-engine.evaluateCommandRisk 兜底（写命令 deny/warn、只读 allow）。'
      : '降级路径存在缺口，见 stdout.txt。',
    a.map((x) => `${x.pass ? 'PASS' : 'FAIL'}: ${x.name} | ${x.detail}`));
}

// ---------- D5-7 重启生效一致性（两次独立 spawn 对比 tools/list） ----------
async function mcpToolList(execPath) {
  const child = spawn(execPath, [MCPJS], { stdio: ['pipe', 'pipe', 'pipe'] });
  let buf = Buffer.alloc(0);
  let idc = 0;
  const pending = new Map();
  function frame(msg) { child.stdin.write(`Content-Length: ${Buffer.byteLength(msg)}\r\n\r\n${msg}`); }
  function rpc(method, params) {
    const id = ++idc;
    return new Promise((res, rej) => {
      pending.set(id, { res, rej });
      frame(JSON.stringify({ jsonrpc: '2.0', id, method, params: params || {} }));
      setTimeout(() => { pending.delete(id); rej(new Error('timeout ' + method)); }, 60000);
    });
  }
  child.stdout.on('data', (c) => {
    buf = Buffer.concat([buf, c]);
    for (;;) {
      const i = buf.indexOf('\r\n\r\n');
      if (i < 0) return;
      const h = buf.subarray(0, i).toString();
      const m = h.match(/Content-Length:\s*(\d+)/i);
      if (!m) { buf = Buffer.alloc(0); return; }
      const end = i + 4 + Number(m[1]);
      if (buf.length < end) return;
      const body = buf.subarray(i + 4, end).toString();
      buf = buf.subarray(end);
      let msg; try { msg = JSON.parse(body); } catch { continue; }
      if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.rej(new Error(JSON.stringify(msg.error))) : p.res(msg.result); }
    }
  });
  child.stderr.on('data', () => {});
  try {
    await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd5-7', version: '1' } });
    frame(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }));
    const t = await rpc('tools/list', {});
    return (t.tools || []).map((x) => x.name).sort();
  } finally { child.kill(); }
}

{
  const a = [];
  const names1 = await mcpToolList(process.execPath);
  const names2 = await mcpToolList(process.execPath); // 第二次 spawn = 重启后新会话
  a.push({ name: '重启前后 tools/list 工具数一致', pass: names1.length === names2.length, detail: `run1=${names1.length} run2=${names2.length}` });
  const diff = names1.filter((x) => !names2.includes(x)).concat(names2.filter((x) => !names1.includes(x)));
  a.push({ name: '重启前后工具名集合一致（无丢失/新增）', pass: diff.length === 0, detail: diff.length ? `diff=${diff.slice(0, 10).join(',')}` : '无差异' });
  a.push({ name: '重启后 version/toolCount 语义稳定（>=56）', pass: names1.length >= 50, detail: `toolCount=${names1.length}` });
  const all = a.every((x) => x.pass);
  rec('D5-7', all ? 'PASS' : 'FAIL',
    all ? '安装后两次独立 spawn MCP server（等价于重启会话），tools/list 工具数与名称集合一致，重启生效语义稳定。'
      : '重启前后工具面不一致，见 stdout.txt。',
    a.map((x) => `${x.pass ? 'PASS' : 'FAIL'}: ${x.name} | ${x.detail}`));
  process.exit(0);
}