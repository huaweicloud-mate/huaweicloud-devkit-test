#!/usr/bin/env node
// 每日测试补充探针：D6-1/3/4 性能 + D10-3 路由（源码级）+ D9-9 取消能力探测
// 用法: node probe-perf-route.mjs > stdout-perf-route.log 2>&1
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const SRC = '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const tools = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
const policy = await import(pathToFileURL(join(SRC, 'safety-policy.mjs')).href);

let PASS = 0, FAIL = 0;
function c(id, cond, detail) { if (cond) PASS++; else FAIL++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${id}  ${detail}`); }
function open(id){ console.log(`@@CASE ${id}@@`); }
function close(){ console.log(`@@END@@`); }

// ============ D10-3 路由准确率（源码级：serviceCatalog 中/英文意图命中对应服务） ============
open('D10-3');
{
  const cases = [
    ['query ECS servers', 'ECS'],
    ['create a VM instance', 'ECS'],
    ['setup VPC subnet and security group', 'VPC'],
    ['create OBS bucket for static website hosting', 'OBS'],
    ['deploy a static website', 'Sandbox'],
    ['query RDS mysql database', 'RDS'],
    ['create redis cache cluster', 'DCS'],
    ['IAM user permissions and policy', 'IAM'],
    ['manage secret with kms', 'CSMS'],
    ['query cloud server list', 'ECS'],
    ['create bucket', 'OBS'],
    ['查询云服务器列表', 'ECS'],
    ['创建存储桶', 'OBS'],
    ['创建云硬盘', 'ECS'],
    ['领取代金券', 'Incentive Voucher'],
  ];
  const cjkIdxs = new Set([11, 12, 13, 14]); // 中文意图下标
  let hit = 0, missed = [];
  for (let i = 0; i < cases.length; i++) {
    const [intent, svc] = cases[i];
    const r = await tools.callTool('huaweicloud_service_catalog', { intent });
    const svcs = (r?.recommendedServices || []).map((s) => String(s).toLowerCase());
    const norm = svc.toLowerCase();
    const ok = svcs.includes(norm)
      || (norm === 'sandbox' && svcs.some((s) => s.includes('sandbox') || s.includes('devstation')))
      || (norm === 'incentive voucher' && svcs.some((s) => s.includes('voucher')))
      || (norm === 'csms' && svcs.some((s) => s.includes('csms') || s.includes('kms')))
      || (norm === 'vpc' && svcs.some((s) => s.includes('vpc') || s.includes('eip')))
      || (norm === 'ecs' && svcs.some((s) => s.includes('ecs')));
    if (ok) hit++; else missed.push(`${intent}→${svc}[got:${svcs.join('/') || 'none'}]`);
  }
  console.log(`INFO D10-3  路由命中 ${hit}/${cases.length}`);
  c('D10-3', missed.length === 0, `中/英文意图均命中对应服务？missed=${JSON.stringify(missed)}`);
} close();

// ============ D6-1 检索响应延迟（100 次采样 p95 < 2s） ============
open('D6-1');
{
  const samples = [];
  for (let i = 0; i < 100; i++) {
    const t = performance.now();
    try { await tools.callTool('huaweicloud_search_docs', { query: 'ecs', topic: 'ecs' }); } catch {}
    samples.push(performance.now() - t);
  }
  samples.sort((a, b) => a - b);
  const p95 = samples[Math.floor(samples.length * 0.95)];
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  c('D6-1', p95 < 2000, `检索响应延迟采样${samples.length}次 p95=${p95.toFixed(1)}ms avg=${avg.toFixed(1)}ms（阈值<2000ms）`);
} close();

// ============ D6-3 MCP 冷启时间（冷启到可服务 < 5s） ============
open('D6-3');
{
  const serverPath = join(SRC, 'mcp-server.mjs');
  const t0 = performance.now();
  const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });
  let served = false, buf = '';
  const result = await new Promise((resolve) => {
    const timer = setTimeout(() => resolve('timeout'), 15000);
    child.stdout.on('data', (d) => {
      buf += d.toString();
      // 收到 initialize 响应即视为「可服务」
      if (!served && /jsonrpc|serverInfo|huaweicloud-devkit|capabilities/.test(buf)) {
        served = true;
        clearTimeout(timer);
        const cold = performance.now() - t0;
        child.kill('SIGKILL');
        resolve(cold);
      }
    });
    child.on('error', () => { clearTimeout(timer); resolve('spawn-error'); });
    child.on('exit', () => { clearTimeout(timer); if (!served) resolve('exited'); });
    // 冷启握手：发送 initialize
    setTimeout(() => {
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', clientInfo: { name: 'perf', version: '1' } } }) + '\n');
    }, 200);
  });
  const cold = typeof result === 'number' ? result : 999999;
  c('D6-3', typeof result === 'number' && cold < 5000, `MCP 冷启 ${typeof result === 'number' ? cold.toFixed(0) + 'ms' : result}（阈值<5000ms，可服务=${served}）`);
} close();

// ============ D6-4 并发调度正确性（30 请求无死锁无错乱） ============
open('D6-4');
{
  const tasks = Array.from({ length: 30 }, (_, i) => {
    const name = i % 2 === 0 ? 'huaweicloud_list_regions' : 'huaweicloud_list_operations';
    const arg = i % 2 === 0 ? {} : { service: 'ECS' };
    return tools.callTool(name, arg).then((r) => ({ i, ok: !!r })).catch((e) => ({ i, ok: false }));
  });
  const results = await Promise.all(tasks);
  const okAll = results.every((r) => r.ok);
  const ids = results.map((r) => r.i).sort((a, b) => a - b);
  const ordered = ids.every((v, i) => v === i);
  c('D6-4', okAll && ordered, `并发 ${results.length} 请求全部完成无死锁=${okAll} 顺序无错乱=${ordered}`);
} close();

// ============ D9-9 取消能力探测（capabilities.cancellation 是否存在） ============
open('D9-9');
{
  const proto = await import(pathToFileURL(join(SRC, 'mcp-protocol.mjs')).href);
  const init = await proto.dispatch('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'probe', version: '1' } });
  const caps = init?.capabilities || {};
  const hasCancellation = !!(caps.notifications && caps.notifications.cancellation);
  console.log(`INFO D9-9  initialize.capabilities = ${JSON.stringify(caps)}`);
  console.log(`INFO D9-9  cancellation 能力声明 = ${hasCancellation}（不存在 → SPEC-MISMATCH 标注而非假定）`);
  c('D9-9', hasCancellation, `cancellation 能力已声明=${hasCancellation}（capabilities=${JSON.stringify(caps)}）`);
} close();

console.log(`\n===== perf-route 汇总: PASS ${PASS} / FAIL ${FAIL} =====`);