/**
 * WorkBuddy 每日测试探针 - D9-9 超时/取消 + D1-45 更新兜底提示序列（v1.1.4-next.6）
 * D9-9: capabilities.cancellation 声明核对 + notifications/cancelled 实效（挂起 run_readonly_command）
 *        + 取消后 2s 子进程观察 + 挂起期间并发请求响应 + 挂起调用最终完成 + 重建连接恢复
 * D1-45: _updateInfo 装饰序列（check_update 豁免 / 首个非检查工具附加 / 会话内一次性 / 预热不阻塞）
 *        + applyUpdateHint/_decorateResult 函数级验证（绝不真调 huaweicloud_upgrade 工具——会真实升级运行时）
 *
 * 实测关键事实（2026-09-14, Windows Server 2022 + Node 22.22.2）:
 *  1) update-check.mjs:12-13 NPM_BIN/NPX_BIN = 'npm.cmd'/'npx.cmd'，queryDistTags(:259 spawn)/
 *     queryDistTagsSync(:238 spawnSync)/upgradePackage(:415 spawnFn) 均无 shell:true 调用。
 *     Node ≥ 22 因 CVE-2024-27980 缓解对 .cmd/.bat 无 shell spawn 抛 EINVAL →
 *     Windows 下 check_update 恒 check_failed、_updateInfo 端到端无法触发、upgrade 无法确认版本。
 *  2) runHcloud 的执行是异步 spawn（hcloud-cli.mjs:352+，非 spawnSync）→ 挂起期间事件循环不阻塞，
 *     并发 tools/list 正常响应；但无 notifications/cancelled 处理 → 取消对执行中子进程无效。
 *  3) capabilities 仅 {tools:{}}（mcp-protocol.mjs:63）→ D9-9 按用例指示记 SPEC-MISMATCH。
 */
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SERVER = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-server.mjs';
const UPDATE_CHECK = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/update-check.mjs';
const MCP_PROTOCOL = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-protocol.mjs';

const results = [];
function t(id, name, pass, actual, expected, note) {
  results.push({ case: id, name, pass: pass === null ? null : !!pass, actual: String(actual), expected: String(expected), note: note || '' });
  console.log(`[${pass === null ? 'INFO' : pass ? 'PASS' : 'FAIL'}] ${id} ${name}\n    actual=${actual}\n    expected=${expected}${note ? '\n    note=' + note : ''}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class McpClient {
  constructor() { this.proc = null; this.buf = Buffer.alloc(0); this.nextId = 1; this.pending = new Map(); this.serverDied = false; }
  start(env) {
    this.proc = spawn(process.execPath, [SERVER], { stdio: ['pipe', 'pipe', 'pipe'], env: env || process.env });
    this.proc.stdout.on('data', (d) => this._onData(d));
    this.proc.stderr.on('data', (d) => { this.lastStderr = (this.lastStderr || '') + d; });
    this.proc.on('exit', (c, s) => { this.serverDied = true; this.pending.forEach((p) => { clearTimeout(p.timer); p.resolve({ _died: true, code: c }); }); this.pending.clear(); });
    return this;
  }
  _onData(d) {
    this.buf = Buffer.concat([this.buf, d]);
    while (true) {
      const hEnd = this.buf.indexOf('\r\n\r\n');
      if (hEnd === -1) return;
      const header = this.buf.subarray(0, hEnd).toString('utf-8');
      const m = header.match(/Content-Length:\s*(\d+)/i);
      if (!m) { this.buf = Buffer.alloc(0); return; }
      const bodyStart = hEnd + 4; const bodyEnd = bodyStart + Number(m[1]);
      if (this.buf.length < bodyEnd) return;
      const body = this.buf.subarray(bodyStart, bodyEnd).toString('utf-8');
      this.buf = this.buf.subarray(bodyEnd);
      let msg; try { msg = JSON.parse(body); } catch { msg = { _unparseable: body }; }
      if (msg && msg.id !== undefined && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id); this.pending.delete(msg.id); clearTimeout(p.timer); p.resolve(msg);
      }
    }
  }
  frame(obj) {
    const body = typeof obj === 'string' ? obj : JSON.stringify(obj);
    return `Content-Length: ${Buffer.byteLength(body, 'utf-8')}\r\n\r\n${body}`;
  }
  request(method, params, timeoutMs = 30000, id = null) {
    const rid = id ?? this.nextId++;
    return new Promise((resolve) => {
      const timer = setTimeout(() => { this.pending.delete(rid); resolve({ _timeout: true }); }, timeoutMs);
      this.pending.set(rid, { resolve, timer });
      this.proc.stdin.write(this.frame({ jsonrpc: '2.0', id: rid, method, params }));
    });
  }
  notify(method, params) { this.proc.stdin.write(this.frame({ jsonrpc: '2.0', method, params })); }
  kill() { try { this.proc.kill(); } catch {} }
}

async function handshake(env) {
  const c = new McpClient().start(env);
  const init = await c.request('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1.0' } }, 30000);
  if (init.result) c.notify('notifications/initialized', {});
  return { c, init };
}

function ecsChildAlive() {
  // 统计命令行含 'ECS' 的 node.exe 子进程（即被 runHcloud 启动的假 hcloud 挂起脚本）
  try {
    const out = execFileSync('powershell.exe', ['-NoProfile', '-Command',
      "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -like '*ECS*' } | Measure-Object | Select-Object -ExpandProperty Count"],
      { encoding: 'utf-8', timeout: 15000 });
    const n = Number(String(out).trim());
    return Number.isFinite(n) ? n : null;
  } catch { return null; }
}

async function main() {
  const root = process.cwd();

  // ════════ 根因佐证: Windows 下 npm.cmd/npx.cmd 无 shell spawn 抛 EINVAL ════════
  const evNpm = spawnSync('npm.cmd', ['--version'], { encoding: 'utf8', windowsHide: true });
  const evNpx = spawnSync('npx.cmd', ['--version'], { encoding: 'utf8', windowsHide: true });
  t('D1-45', '根因佐证: Node≥22 对 npm.cmd/npx.cmd 无 shell spawn 抛 EINVAL（CVE-2024-27980 缓解）',
    evNpm.error?.code === 'EINVAL' && evNpx.error?.code === 'EINVAL',
    `npm.cmd=${evNpm.error?.code} npx.cmd=${evNpx.error?.code}`, 'EINVAL=EINVAL',
    'update-check.mjs:12-13 NPM_BIN/NPX_BIN 为 .cmd 且 :238/:259/:415 均无 shell:true → Windows 下更新检查/升级执行结构化失败');

  // ════════ D9-9 会话 A：挂起命令 + notifications/cancelled ════════
  const iso = join(root, 'tmp-d99');
  rmSync(iso, { recursive: true, force: true });
  mkdirSync(iso, { recursive: true });
  // 假 hcloud 挂起脚本: HCLOUD_BIN=<node.exe 绝对路径> → spawn(node, ['ECS','NovaListServers']) → node 解析 cwd 下的 ECS.js，挂起 15s
  writeFileSync(join(iso, 'ECS.js'), [
    "const fs = require('fs');",
    "fs.writeFileSync(__dirname + '/ecs-marker.log', 'started ' + Date.now() + '\\n');",
    "setTimeout(() => {",
    "  fs.appendFileSync(__dirname + '/ecs-marker.log', 'finished ' + Date.now() + '\\n');",
    "  console.log('NovaListServers fake done');",
    "}, 15000);",
    '',
  ].join('\n'));
  const envA = {
    ...process.env,
    HCLOUD_BIN: process.execPath, // findHcloudBin 要求 existsSync 通过（hcloud-probe.mjs:14）
    HUAWEICLOUD_HOME: join(iso, 'home'),
    HCLOUD_CONFIG_PATH: join(iso, 'home', 'koo', 'config'),
    HCLOUD_OBS_CONFIG_PATH: join(iso, 'home', 'obs', 'config'),
  };

  const { c: cA, init: initA } = await handshake(envA);
  const caps = initA.result?.capabilities || {};
  t('D9-9', 'initialize 响应 capabilities 含 cancellation 声明（用例要求）', caps.cancellation !== undefined,
    JSON.stringify(caps), '含 cancellation',
    caps.cancellation === undefined ? 'SPEC-MISMATCH: capabilities 仅 {tools:{}}（mcp-protocol.mjs:63），无 cancellation 声明，亦无 -32000 超时语义' : '');

  // 发起挂起的只读调用（固定 id=500）
  const tCall = Date.now();
  let resA = null;
  const pendA = cA.request('tools/call', {
    name: 'huaweicloud_run_readonly_command',
    arguments: { args: ['ECS', 'NovaListServers'], cwd: iso, timeoutMs: 45000 },
  }, 45000, 500).then((r) => { resA = { at: Date.now() - tCall, r }; return r; });

  await sleep(3000);
  const marker = existsSync(join(iso, 'ecs-marker.log')) ? readFileSync(join(iso, 'ecs-marker.log'), 'utf-8') : '';
  const started = marker.includes('started'); const finishedEarly = marker.includes('finished');
  t('D9-9', '挂起命令实际执行（假 hcloud 子进程启动且未在 3s 内完成）', started && !finishedEarly && !resA,
    `started=${started} finished=${finishedEarly} settled=${!!resA}`, 'started 且未完成');

  // 发送取消通知（id=500）+ 并发探测请求（id=501）
  const tCancel = Date.now();
  cA.notify('notifications/cancelled', { requestId: 500 });
  let resList = null;
  const pendList = cA.request('tools/list', {}, 25000, 501).then((r) => { resList = { at: Date.now() - tCancel, r }; return r; });

  await sleep(2000);
  const aliveAfter2s = ecsChildAlive();
  t('D9-9', '取消通知后 2s 内子进程被中止', aliveAfter2s === 0, `alive=${aliveAfter2s}`, '0（中止）',
    aliveAfter2s > 0 ? 'SPEC-MISMATCH 佐证: 服务端无 notifications/cancelled 处理，取消对执行中的异步 spawn 子进程无效' : '');

  // 挂起期间并发 tools/list 响应（异步 spawn 不阻塞事件循环）
  await pendList;
  const listAt = resList ? resList.at : -1;
  t('D9-9', '挂起期间并发 tools/list 正常响应（异步 spawn 不阻塞事件循环）', Array.isArray(resList?.r?.result?.tools) && listAt < 5000,
    `resolvedAt=${listAt}ms tools=${resList?.r?.result?.tools?.length}`, '<5000ms 响应');

  // 等挂起调用结束
  const rA = await pendA;
  const elapsedA = resA ? resA.at : -1;
  const cAtext = String(rA?.result?.content?.[0]?.text || rA?.error || JSON.stringify(rA).slice(0, 150)).replace(/\n/g, ' ').slice(0, 150);
  t('D9-9', '挂起的 tools/call 最终完成（≈15s，未被取消中断）', !!rA?.result && elapsedA >= 14000 && elapsedA <= 25000,
    `elapsed=${elapsedA}ms isError=${rA?.result?.isError}`, '≈15000ms 完成', `resp=${cAtext}`);

  // 会话 A 服务端仍存活且恢复响应
  const listAfter = await cA.request('tools/list', {}, 15000);
  t('D9-9', '挂起调用结束后服务端恢复响应（无崩溃）', Array.isArray(listAfter.result?.tools) && !cA.serverDied,
    `tools=${listAfter.result?.tools?.length} died=${cA.serverDied}`, '正常响应');
  cA.kill();

  // ════════ D9-9 会话 A2：重建连接（默认 env）恢复验证 ════════
  const { c: cA2, init: initA2 } = await handshake();
  const tlA2 = await cA2.request('tools/list', {}, 15000);
  t('D9-9', '取消异常后重建连接 initialize/tools/list 正常', !!initA2.result && Array.isArray(tlA2.result?.tools),
    `init=${!!initA2.result} tools=${tlA2.result?.tools?.length}`, '正常');
  cA2.kill();

  // ════════ D1-45 会话 B1：预热未完成时立即调用不阻塞 ════════
  const { c: cB1 } = await handshake();
  const tImm = Date.now();
  const rsImm = await cB1.request('tools/call', { name: 'huaweicloud_retrieve_skill', arguments: { name: 'huawei-ecs' } }, 60000);
  const immLat = Date.now() - tImm;
  t('D1-45', 'initialize 后立即调用工具不被更新预热阻塞（<10s）', !!rsImm?.result && immLat < 10000,
    `${immLat}ms isError=${rsImm?.result?.isError}`, '<10000ms',
    `_updateInfo=${rsImm?.result?._updateInfo ? 'present' : 'absent（预热未完成不附加，只消费已缓存提示）'}`);
  cB1.kill();

  // ════════ D1-45 会话 B2：真实 MCP 会话装饰序列（Windows 实况） ════════
  const { c: cB2 } = await handshake();
  const cu = await cB2.request('tools/call', { name: 'huaweicloud_check_update', arguments: {} }, 60000);
  let cuPayload = null; try { cuPayload = JSON.parse(cu.result?.content?.[0]?.text || '{}'); } catch {}
  t('D1-45', 'check_update 响应不附加 _updateInfo（豁免）', cu.result?._updateInfo === undefined,
    `_updateInfo=${JSON.stringify(cu.result?._updateInfo)}`, 'undefined');
  t('D1-45', 'registry 查询成功且可判定更新（真实会话）', cuPayload?.updateAvailable === true,
    `result=${cuPayload?.result} cur=${cuPayload?.currentVersion} latest=${cuPayload?.latestStable}`, 'updateAvailable=true',
    '产品缺陷(Windows): update-check.mjs:12 NPM_BIN=npm.cmd + :259 spawn 无 shell → Node≥22 EINVAL → queryDistTags 恒 null → check_failed，_updateInfo 机制在 Windows 端到端失效');

  const rs1 = await cB2.request('tools/call', { name: 'huaweicloud_retrieve_skill', arguments: { name: 'huawei-ecs' } }, 60000);
  t('D1-45', '首个非检查工具附加 _updateInfo（真实会话）', !!rs1.result?._updateInfo,
    `_updateInfo=${JSON.stringify(rs1.result?._updateInfo)}`, '含 currentVersion/latestVersion',
    '因 registry 查询恒失败 lastHint 永不写入，Windows 真实会话无法触发（根因同上，机制正确性见函数级验证）');
  cB2.kill();

  // ════════ D1-45 函数级: applyUpdateHint 豁免（不真调 huaweicloud_upgrade） ════════
  const uc = await import(pathToFileURL(UPDATE_CHECK).href);
  const hint = { currentVersion: '1.1.4-next.6', targetVersion: '1.1.4', updateAvailable: true };
  const exUp = uc.applyUpdateHint({ ok: true }, 'huaweicloud_upgrade', hint);
  const exCu = uc.applyUpdateHint({ ok: true }, 'huaweicloud_check_update', hint);
  const exTool = uc.applyUpdateHint({ ok: true }, 'huaweicloud_retrieve_skill', hint);
  const exNo = uc.applyUpdateHint({ ok: true }, 'huaweicloud_retrieve_skill', { ...hint, updateAvailable: false });
  t('D1-45', 'applyUpdateHint 豁免 huaweicloud_upgrade（函数级）', exUp._updateInfo === undefined && exUp.ok === true,
    `_updateInfo=${JSON.stringify(exUp._updateInfo)}`, 'undefined（豁免）');
  t('D1-45', 'applyUpdateHint 豁免 huaweicloud_check_update（函数级）', exCu._updateInfo === undefined,
    `_updateInfo=${JSON.stringify(exCu._updateInfo)}`, 'undefined（豁免）');
  t('D1-45', 'applyUpdateHint 对普通工具附加 _updateInfo（函数级）', !!exTool._updateInfo && exTool._updateInfo.latestVersion === '1.1.4',
    JSON.stringify(exTool._updateInfo), '含 currentVersion/latestVersion');
  t('D1-45', 'updateAvailable=false 时不附加（函数级）', exNo._updateInfo === undefined,
    `_updateInfo=${JSON.stringify(exNo._updateInfo)}`, 'undefined');

  // ════════ D1-45 函数级: _decorateResult 会话内一次性 + 跨会话独立（注入 doQuery 填充 lastHint） ════════
  const proto = await import(pathToFileURL(MCP_PROTOCOL).href);
  const tags = { latest: '1.1.4', next: '1.1.4-next.6' };
  const ci = await uc.getCachedUpdateInfo('1.1.4-next.6', { doQuery: async () => tags });
  t('D1-45', '注入 dist-tags 后 getCachedUpdateInfo 判定 update_available', ci?.result === 'update_available' && ci?.updateAvailable === true,
    `result=${ci?.result} target=${ci?.targetVersion}`, 'update_available target=1.1.4');
  const d1 = proto._decorateResult('probe-s1', 'huaweicloud_retrieve_skill', { ok: true });
  const d2 = proto._decorateResult('probe-s1', 'huaweicloud_retrieve_skill', { ok: true });
  const dCu = proto._decorateResult('probe-s2', 'huaweicloud_check_update', { ok: true });
  const d3 = proto._decorateResult('probe-s2', 'huaweicloud_retrieve_skill', { ok: true });
  t('D1-45', '会话内首个非检查工具附加 _updateInfo（函数级）', !!d1._updateInfo && d1._updateInfo.latestVersion === '1.1.4',
    JSON.stringify(d1._updateInfo), '含 currentVersion/latestVersion');
  t('D1-45', '同会话再次调用不再附加（一次性，函数级）', d2._updateInfo === undefined && d2.ok === true,
    `_updateInfo=${JSON.stringify(d2._updateInfo)}`, 'undefined');
  t('D1-45', 'check_update 豁免不影响其他会话首次（跨会话独立，函数级）', dCu._updateInfo === undefined && !!d3._updateInfo,
    `check_update=${JSON.stringify(dCu._updateInfo)} next-tool=${JSON.stringify(d3._updateInfo)}`, '豁免+独立');

  // ════════ 汇总 ════════
  const pass = results.filter((r) => r.pass === true).length;
  const fail = results.filter((r) => r.pass === false).length;
  const info = results.filter((r) => r.pass === null).length;
  console.log(`\n===== SUMMARY: ${pass} PASS / ${fail} FAIL / ${info} INFO =====`);
  writeFileSync('results.json', JSON.stringify({ suite: 'd9-robust2', pass, fail, info, results }, null, 2));
}

main().catch((e) => { console.error('PROBE CRASH:', e); process.exit(1); });
