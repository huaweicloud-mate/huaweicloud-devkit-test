// Layer 2 契约单测：test-manager/mcp-server.mjs（AI Test Manager 的 MCP 包装）
// 覆盖 docs/test-ai-orchestration-architecture.md §六「MCP 包装待建」补齐后的协议契约：
// 握手 / 工具枚举 / 工具调用 / 错误码语义 / 畸形帧不崩 / 确定性。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const REPO = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const SERVER = join(REPO, 'test-manager', 'mcp-server.mjs');

/** 启动 MCP server（stdio，Content-Length 帧），返回 { call, raw, kill } */
function start() {
  const child = spawn(process.execPath, [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });
  const pending = new Map();
  const errors = [];
  let buf = Buffer.alloc(0);

  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    for (;;) {
      const h = buf.indexOf('\r\n\r\n');
      if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString('utf8'));
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = Number(m[1]);
      if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString('utf8');
      buf = buf.slice(h + 4 + n);
      const msg = JSON.parse(body);
      if (msg.id !== null && msg.id !== undefined && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      } else if (msg.error) {
        errors.push(msg);
      }
    }
  });
  child.stderr.on('data', () => {}); // 诊断信息走 stderr，测试不消费

  let id = 0;
  function raw(text) {
    child.stdin.write(Buffer.from(text, 'utf8'));
  }
  function send(method, params) {
    const myId = ++id;
    const b = Buffer.from(JSON.stringify({ jsonrpc: '2.0', id: myId, method, params }), 'utf8');
    child.stdin.write(Buffer.concat([Buffer.from(`Content-Length: ${b.length}\r\n\r\n`, 'ascii'), b]));
    return new Promise((resolve) => pending.set(myId, resolve));
  }
  return { call: send, raw, errors, kill: () => child.kill() };
}

const scope = { changedFiles: ['safety-policy.mjs'] };

test('initialize 握手：返回协议版本与 serverInfo', async () => {
  const c = start();
  try {
    const r = await c.call('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'ut', version: '1' } });
    assert.equal(r.result.protocolVersion, '2024-11-05');
    assert.equal(r.result.serverInfo.name, 'devkit-test-manager');
    assert.ok(r.result.capabilities.tools);
  } finally {
    c.kill();
  }
});

test('tools/list：4 个工具且 name/description/inputSchema 齐备', async () => {
  const c = start();
  try {
    const r = await c.call('tools/list');
    const names = r.result.tools.map((t) => t.name);
    assert.deepEqual(names.sort(), [
      'tm_analyze_impact',
      'tm_generate_missions',
      'tm_generate_strategy',
      'tm_plan_test_run',
    ]);
    for (const t of r.result.tools) {
      assert.ok(t.name && t.description, `工具 ${t.name} 缺 name/description`);
      assert.equal(t.inputSchema.type, 'object', `工具 ${t.name} 缺 inputSchema`);
    }
  } finally {
    c.kill();
  }
});

test('tools/call tm_analyze_impact：safety-policy.mjs 命中 D4/high', async () => {
  const c = start();
  try {
    const r = await c.call('tools/call', { name: 'tm_analyze_impact', arguments: { changeScope: scope } });
    assert.equal(r.result.isError, false);
    const out = JSON.parse(r.result.content[0].text);
    assert.equal(out.risk, 'high');
    assert.ok(out.affectedDimensions.some((d) => d.dim === 'D4'));
    assert.ok(out.caseCount > 0);
  } finally {
    c.kill();
  }
});

test('tools/call tm_generate_missions：产出使命清单（missionId/domain/priority/scope/qualityCriteria/affectedCases）', async () => {
  const c = start();
  try {
    const r = await c.call('tools/call', { name: 'tm_generate_missions', arguments: { version: 'ut', changeScope: scope } });
    const missions = JSON.parse(r.result.content[0].text);
    assert.ok(Array.isArray(missions) && missions.length >= 1);
    assert.match(missions[0].missionId, /^mission-\d{3}$/);
    for (const k of ['domain', 'priority', 'scope', 'qualityCriteria', 'affectedCases']) {
      assert.ok(k in missions[0], `使命缺字段 ${k}`);
    }
    assert.ok(Array.isArray(missions[0].qualityCriteria) && missions[0].qualityCriteria.length > 0);
  } finally {
    c.kill();
  }
});

test('tools/call tm_plan_test_run：一次返回策略 + 使命', async () => {
  const c = start();
  try {
    const r = await c.call('tools/call', { name: 'tm_plan_test_run', arguments: { version: 'ut', changeScope: scope } });
    const out = JSON.parse(r.result.content[0].text);
    assert.ok(out.strategy && out.missions, '缺 strategy/missions');
    assert.equal(out.strategy.risk, 'high');
  } finally {
    c.kill();
  }
});

test('输出确定性：同入参两次调用逐字相同（引擎 `date` 字段是唯一时间相关项）', async () => {
  const c = start();
  try {
    const a = await c.call('tools/call', { name: 'tm_plan_test_run', arguments: { version: 'ut', changeScope: scope } });
    const b = await c.call('tools/call', { name: 'tm_plan_test_run', arguments: { version: 'ut', changeScope: scope } });
    assert.equal(a.result.content[0].text, b.result.content[0].text);
    const out = JSON.parse(a.result.content[0].text);
    assert.ok(out.strategy.date, '引擎输出的 date 字段应存在（跨日比对需忽略它）');
  } finally {
    c.kill();
  }
});

test('错误码语义：未知方法 -32601、未知工具 -32602', async () => {
  const c = start();
  try {
    const m = await c.call('no/such/method');
    assert.equal(m.error.code, -32601);
    const t = await c.call('tools/call', { name: 'tm_not_exist', arguments: {} });
    assert.equal(t.error.code, -32602);
  } finally {
    c.kill();
  }
});

test('参数非法 fail-closed：changedFiles 非数组 -> isError=true 且写明字段', async () => {
  const c = start();
  try {
    const r = await c.call('tools/call', {
      name: 'tm_analyze_impact',
      arguments: { changeScope: { changedFiles: 'safety-policy.mjs' } },
    });
    assert.equal(r.result.isError, true);
    assert.match(r.result.content[0].text, /changedFiles/);
  } finally {
    c.kill();
  }
});

test('健壮性：畸形帧（无长度头/非法 JSON）不崩，且后续请求仍可服务', async () => {
  const c = start();
  try {
    c.raw('garbage-without-length-header\r\n\r\n');       // 无 Content-Length
    c.raw('Content-Length: 5\r\n\r\n{bad,');              // 非法 JSON
    const r = await c.call('ping');                       // 进程仍在服务
    assert.ok(r.result !== undefined);
  } finally {
    c.kill();
  }
});