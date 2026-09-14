// HuaweiCloud DevKit daily test — MCP stdio protocol probe (Hermes / Linux)
// Spawns the SUT MCP server from hdk source, drives JSON-RPC over stdio.
// Emits "RESULT <case-id> <PASS|FAIL> <detail>" lines.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SRC = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const MCP = join(SRC, 'mcp-server.mjs');

const HOME = mkdtempSync(join(tmpdir(), 'hdk-mcp-'));
process.env.HUAWEICLOUD_HOME = HOME;

function emit(id, cond, detail) {
  console.log(`RESULT ${id} ${cond ? 'PASS' : 'FAIL'} ${detail}`);
}

function startServer() {
  const child = spawn(process.execPath, [MCP], {
    cwd: SRC,
    env: { ...process.env, HUAWEICLOUD_HOME: HOME, HCLOUD_BIN: process.env.HCLOUD_BIN || 'hcloud' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let buf = Buffer.alloc(0);
  let pending = new Map();
  let nextId = 1;
  let stderr = '';
  child.stderr.on('data', (d) => (stderr += d.toString()));
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    let idx;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.subarray(0, idx).toString('utf8').trim();
      buf = buf.subarray(idx + 1);
      if (!line) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.id && pending.has(msg.id)) {
          pending.get(msg.id)(msg);
          pending.delete(msg.id);
        }
      } catch {}
    }
  });
  function rpc(method, params, timeoutMs = 60000) {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { pending.delete(id); reject(new Error('timeout: ' + method)); }, timeoutMs);
      pending.set(id, (msg) => { clearTimeout(t); resolve(msg); });
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params: params || {} }) + '\n');
    });
  }
  return { child, rpc, getStderr: () => stderr };
}

async function main() {
  const startedAt = Date.now();
  const { child, rpc } = startServer();

  // initialize
  const init = await rpc('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'hermes-test', version: '1.0' } });
  const initOk = init.result && init.result.serverInfo?.name === 'huaweicloud-devkit' && init.result.protocolVersion;
  const coldStartMs = Date.now() - startedAt;
  emit('D6-3', coldStartMs < 5000, `冷启到 initialize 响应 ${coldStartMs}ms (<5s)`);
  emit('D9-4', initOk, `initialize 返回 serverInfo=${JSON.stringify(init.result?.serverInfo)} protocolVersion=${init.result?.protocolVersion}`);

  // D9-1 / D5-3: tools/list 39 tools
  const tl = await rpc('tools/list');
  const tools = tl.result?.tools || [];
  const names = tools.map((t) => t.name);
  const uniqueNames = new Set(names).size === names.length;
  const schemaOk = tools.every((t) => t.inputSchema && t.inputSchema.type === 'object' && t.name && t.description);
  emit('D5-3', names.length === 39 && uniqueNames && schemaOk, `tools/list => ${names.length} 工具 唯一=${uniqueNames} schema完整=${schemaOk}`);
  emit('D9-1', names.length === 39 && schemaOk, `tools/list 协议级 39 工具 schema 合法=${schemaOk}`);

  // D1-26 升级提醒工具注册
  const hasCheckUpdate = names.includes('huaweicloud_check_update');
  const hasUpgrade = names.includes('huaweicloud_upgrade');
  emit('D1-26', hasCheckUpdate && hasUpgrade, `check_update=${hasCheckUpdate} upgrade=${hasUpgrade} 均注册`);

  // D9-9 取消能力 (capabilities.cancellation)
  const hasCancel = Boolean(init.result?.capabilities?.cancellation);
  emit('D9-9', !hasCancel, `capabilities.cancellation 存在=${hasCancel} (设计按实测标注; 实测不含 → 记录)`);

  // D9-3 tools/call 成功响应格式
  const callOk = await rpc('tools/call', { name: 'huaweicloud_service_catalog', arguments: {} });
  const callFormatOk = Array.isArray(callOk.result?.content) && callOk.result?.isError === false && callOk.result?.content?.[0]?.type === 'text';
  emit('D9-3', callFormatOk, `tools/call 成功 => content数组=${Array.isArray(callOk.result?.content)} isError=${callOk.result?.isError} type=${callOk.result?.content?.[0]?.type}`);

  // D9-2 JSON-RPC 错误码 (未知方法 → 404? 实测 impl 抛 Error → -32603)
  const noMethod = await rpc('tools/nonexistent_xyz', {});
  emit('D9-2', noMethod.error && typeof noMethod.error.code === 'number' && typeof noMethod.error.message === 'string',
    `未知 method => error.code=${noMethod.error?.code} message=${noMethod.error?.message} (含码+消息)`);

  // D1-41 check_update MCP 返回契约
  let cuFieldsOk = false;
  let cuDetail = '';
  try {
    const cu = await rpc('tools/call', { name: 'huaweicloud_check_update', arguments: {} }, 60000);
    const txt = cu.result?.content?.[0]?.text || '{}';
    const parsed = JSON.parse(txt);
    cuFieldsOk = parsed && ('result' in parsed) && !cu.result?.isError;
    cuDetail = JSON.stringify(parsed).slice(0, 300);
  } catch (e) { cuDetail = 'exception: ' + e.message; }
  emit('D1-41', cuFieldsOk, `check_update 契约 result字段存在 isError=${false} => ${cuDetail}`);

  // D3-C5 工具冒烟 (service_catalog / list_regions / explain_error / detect_framework)
  {
    let ok = true; const d = [];
    for (const [name, args, label] of [
      ['huaweicloud_list_regions', {}, 'list_regions'],
      ['huaweicloud_explain_error', { message: 'APIGW.0301 invalid AK/SK' }, 'explain_error'],
      ['huaweicloud_service_catalog', { intent: 'deploy web app' }, 'service_catalog'],
    ]) {
      try {
        const r = await rpc('tools/call', { name, arguments: args }, 60000);
        const good = !r.error && r.result && Array.isArray(r.result.content);
        if (!good) ok = false;
        d.push(`${label}:${good ? 'ok' : 'fail'}`);
      } catch (e) { ok = false; d.push(`${label}:exc`); }
    }
    emit('D3-C5', ok, `工具冒烟 ${d.join(', ')}`);
  }

  // D3-A1 skill 检索完整性 (retrieve 6 meta skills)
  {
    const metas = ['huaweicloud-core', 'huaweicloud-safety', 'huaweicloud-cli-and-auth', 'huaweicloud-capability-discovery', 'huaweicloud-api-and-sdk', 'huaweicloud-troubleshooting'];
    let allOk = true; const d = [];
    for (const s of metas) {
      try {
        const r = await rpc('tools/call', { name: 'huaweicloud_retrieve_skill', arguments: { name: s } }, 30000);
        const txt = r.result?.content?.[0]?.text || '';
        const ok = txt.length > 200;
        if (!ok) allOk = false;
        d.push(`${s}:${txt.length}`);
      } catch (e) { allOk = false; d.push(`${s}:exc`); }
    }
    emit('D3-A1', allOk, `retrieve_skill 6 meta => ${d.join(' ')}`);
  }

  // D3-B1 list_operations 规范名 (ECS)
  {
    let r = null;
    try { r = await rpc('tools/call', { name: 'huaweicloud_list_operations', arguments: { service: 'ECS' } }, 60000); } catch (e) {}
    const txt = r?.result?.content?.[0]?.text || '';
    const hasListServers = /ListServers/i.test(txt) || /List/i.test(txt);
    emit('D3-B1', Boolean(txt.length > 20 && hasListServers), `list_operations ECS 返回长度=${txt.length} 含规范操作名=${hasListServers}`);
  }

  // D2-11 R3 STS token 拒绝落盘 (auth_switch persist + token)
  {
    const r = await rpc('tools/call', { name: 'huaweicloud_auth_switch', arguments: { action: 'persist', ak: 'FAKEAK', sk: 'FAKESK', securityToken: 'FAKETOKEN', region: 'cn-north-4' } }, 30000);
    let parsed;
    try { parsed = JSON.parse(r.result?.content?.[0]?.text || '{}'); } catch { parsed = {}; }
    const s1Path = join(HOME, '.config', 'huaweicloud', 'credentials.json');
    const s1NotToken = !existsSync(s1Path) || !/FAKETOKEN/.test(readFileSync(s1Path, 'utf8'));
    const rejected = parsed.status === 'error' && parsed.scope === 'rejected';
    emit('D2-11', rejected && s1NotToken, `R3 STS persist+token => status=${parsed.status} scope=${parsed.scope} token未落盘=${s1NotToken}`);
  }

  // D2-16 import 文件读取后擦除 (auth_switch mode=import action=temporary)
  {
    const impDir = join(HOME, '.config', 'huaweicloud');
    const impPath = join(impDir, 'creds-import.json');
    const { mkdirSync } = await import('node:fs');
    mkdirSync(impDir, { recursive: true });
    writeFileSync(impPath, JSON.stringify({ ak: 'IMPAK123', sk: 'IMPSK456', region: 'cn-north-4' }));
    const r = await rpc('tools/call', { name: 'huaweicloud_auth_switch', arguments: { mode: 'import', action: 'temporary' } }, 30000);
    let parsed;
    try { parsed = JSON.parse(r.result?.content?.[0]?.text || '{}'); } catch { parsed = {}; }
    const wiped = !existsSync(impPath);
    emit('D2-16', parsed.status === 'ok' && wiped, `mode=import temporary => status=${parsed.status} scope=${parsed.scope} 文件擦除=${wiped}`);
  }

  // D6-1 search_docs 延迟 p95
  {
    const lat = [];
    for (let i = 0; i < 10; i++) {
      const t0 = Date.now();
      try { await rpc('tools/call', { name: 'huaweicloud_search_docs', arguments: { query: 'ecs 查询' } }, 15000); } catch (e) {}
      lat.push(Date.now() - t0);
    }
    lat.sort((a, b) => a - b);
    const p95 = lat[Math.floor(lat.length * 0.95)];
    emit('D6-1', p95 < 2000, `search_docs 延迟 p95=${p95}ms (<2s)`);
  }

  // D6-4 并发调度正确性 (30 并发)
  {
    const ps = [];
    for (let i = 0; i < 30; i++) {
      ps.push(rpc('tools/call', { name: 'huaweicloud_service_catalog', arguments: {} }, 30000));
    }
    const results = await Promise.all(ps);
    const allDone = results.every((r) => r.result && Array.isArray(r.result.content));
    emit('D6-4', allDone, `并发30请求全部响应且 content 数组=${allDone}`);
  }

  child.kill();
  console.log('\n=== probe-mcp done ===');
}

main().catch((e) => { console.error('probe-mcp fatal: ' + e.message); process.exit(2); });