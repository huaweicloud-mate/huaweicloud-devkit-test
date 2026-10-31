// D6-7 长会话稳定性 —— 单 MCP 会话持续调用(400 次) + 内存曲线(无泄漏) + hook 全程有效
// 断言: ①持续调用无内存泄漏(RSS 平稳增长) ②持续可服务(零错误/无挂起) ③hook 不失效(PretoolUse 决策全程不变)
//   A. MCP 长会话: 单 server 进程 400 次只读工具调用, 采样 /proc/<pid> VmRSS, 校验增长 & 峰值 & 斜率 & tool 数稳定
//   B. hook 有效性: 长会话期间 6 个检查点各验证 PreToolUse 安全 hook(只读放行/写操作 deny) + 会话内 hook_check_command 一致性
//   C. (补充, 非判据) 真沙箱长会话 sandbox_exec_with_session —— 服务端维护窗口时记 BLOCKED, 不影响 A/B 判据
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { makeServer, stats } from './mcp-client.mjs';

const SRC = process.env.HDK_SRC || '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/dist';
const HOOKS = process.env.HDK_HOOKS || '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/hooks';
const HOOK = join(HOOKS, 'huaweicloud-safety.mjs');
const MCP = join(SRC, 'mcp-server.js');
const N = Number(process.env.D6_7_ITERS || 400);
const WARMUP = 60;
const SAMPLE_EVERY = 20;
const GROWTH_BUDGET_MB = 64;
const DRIFT_BUDGET_MB = 24;
const RSS_CAP_MB = 700;

function vmRssMb(pid) {
  try {
    const st = readFileSync(`/proc/${pid}/status`, 'utf8');
    const m = /VmRSS:\s*(\d+)\s*kB/.exec(st);
    return m ? +m[1] / 1024 : null;
  } catch { return null; }
}

function median(a) {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// ---- PreToolUse 安全 hook 单次判定: 返回 true=deny ----
function checkHook(cmd) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [HOOK], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => { out += d.toString(); });
    child.on('close', () => resolve({ denied: /"permissionDecision":"deny"/.test(out), out: out.slice(0, 200) }));
    child.on('error', () => resolve({ denied: false, error: 'spawn error' }));
    child.stdin.write(JSON.stringify({ tool_input: { command: cmd } }));
    child.stdin.end();
  });
}

const READONLY_CMD = 'hcloud ECS ListServersDetails --cli-region=cn-north-4';
const WRITE_CMD = 'hcloud ECS DeleteServers --servers.1.id=probe';

const ROTATION = [
  { name: 'huaweicloud_search_docs', args: { query: 'ECS 创建指引' } },
  { name: 'huaweicloud_retrieve_skill', args: { name: 'huawei-ecs' } },
  { name: 'huaweicloud_explain_error', args: { errorCode: 'Ecs.0019' } },
  { name: 'huaweicloud_service_catalog', args: { intent: 'create ECS instance', vendorConfirmed: 'use Huawei Cloud sandbox' } },
  { name: 'huaweicloud_hook_check_command', args: { command: WRITE_CMD } },
  { name: 'huaweicloud_list_skills', args: {} },
  { name: 'huaweicloud_list_regions', args: { vendorConfirmed: 'use Huawei Cloud sandbox' } },
];

const out = {
  caseId: 'D6-7',
  title: `长会话稳定性 (单会话 ${N} 次持续调用, 无内存泄漏无 hook 失效)`,
  threshold: `单会话 ${N} 次调用零错误/无挂起; RSS 增长<=${GROWTH_BUDGET_MB}MB 且峰值<=${RSS_CAP_MB}MB; hook 全程有效`,
  env: { HDK_SRC: SRC, node: process.version, iters: N, warmup: WARMUP },
  startedAt: new Date().toISOString(),
};

const srv = makeServer(MCP, { HUAWEICLOUD_VENDOR_CHALLENGE: 'off' });

try {
  const init = await srv.initialize();
  out.serverInfo = init?.result?.serverInfo;
  const pid = srv.child.pid;

  // tool 数基线(会话全程须稳定 -> 服务能力不退化)
  const tl0 = await srv.send({ jsonrpc: '2.0', id: srv.nextId(), method: 'tools/list', params: {} });
  const toolCount0 = (tl0?.result?.tools || []).length;

  // ---- warmup (填充各类缓存, 确立内存基线) ----
  const warmErrs = [];
  for (let i = 0; i < WARMUP; i += 1) {
    const t = ROTATION[i % ROTATION.length];
    const r = await srv.call(t.name, t.args, 30000);
    if (r?.result?.isError) warmErrs.push(`${t.name}: ${JSON.stringify(r.result.content).slice(0, 120)}`);
  }
  const baseRss = vmRssMb(pid);

  // ---- 长会话主循环 ----
  const lat = [];
  const rssSamples = [];
  let errors = 0;
  const errNames = [];
  let hangs = 0;
  const hookChecks = [];
  const hookCheckpoints = [0, Math.floor(N * 0.2), Math.floor(N * 0.4), Math.floor(N * 0.6), Math.floor(N * 0.8), N - 1];
  const t0 = performance.now();
  for (let i = 0; i < N; i += 1) {
    const t = ROTATION[i % ROTATION.length];
    const c0 = performance.now();
    let r;
    try {
      r = await srv.call(t.name, t.args, 15000);
    } catch (e) {
      hangs += 1;
      errors += 1;
      errNames.push(`${t.name}: ${String(e).slice(0, 80)}`);
      continue;
    }
    const dt = performance.now() - c0;
    lat.push(dt);
    if (r?.result?.isError) { errors += 1; errNames.push(`${t.name}: ${JSON.stringify(r.result.content).slice(0, 100)}`); }
    if (i % SAMPLE_EVERY === 0) { const m = vmRssMb(pid); if (m !== null) rssSamples.push(+m.toFixed(1)); }
    if (hookCheckpoints.includes(i)) {
      const ro = await checkHook(READONLY_CMD);
      const wr = await checkHook(WRITE_CMD);
      hookChecks.push({ iter: i, readonlyDenied: ro.denied, writeDenied: wr.denied, writeRaw: wr.out });
    }
  }
  const wallMs = +(performance.now() - t0).toFixed(1);
  const finalRss = vmRssMb(pid);
  const tl1 = await srv.send({ jsonrpc: '2.0', id: srv.nextId(), method: 'tools/list', params: {} });
  const toolCount1 = (tl1?.result?.tools || []).length;

  // ---- 会话内 hook_check_command 一致性(读/写各 20 次, 决策须恒定) ----
  const hcRead = [];
  const hcWrite = [];
  for (let i = 0; i < 20; i += 1) {
    const a = await srv.call('huaweicloud_hook_check_command', { command: READONLY_CMD }, 15000);
    const b = await srv.call('huaweicloud_hook_check_command', { command: WRITE_CMD }, 15000);
    const dec = (r) => { try { return JSON.parse(r.result.content[0].text).decision; } catch { return null; } };
    hcRead.push(dec(a)); hcWrite.push(dec(b));
  }
  const uniq = (arr) => [...new Set(arr)];

  // 稳态内存: 去掉前 2 个沉降样本, 比较前 1/3 与后 1/3 中位数(漂移=泄漏指标)
  const steady = rssSamples.slice(2);
  const third = Math.max(1, Math.floor(steady.length / 3));
  const drift = +(median(steady.slice(-third)) - median(steady.slice(0, third))).toFixed(1);
  const growth = +(finalRss - baseRss).toFixed(1);
  const peak = steady.length ? Math.max(...steady) : finalRss;
  const zeroErr = errors === 0;
  const memStable = growth <= GROWTH_BUDGET_MB && peak <= RSS_CAP_MB && Math.abs(drift) <= DRIFT_BUDGET_MB;
  const toolStable = toolCount0 === toolCount1 && toolCount0 > 0;
  const hookOk = hookChecks.length === 6 && hookChecks.every((h) => h.readonlyDenied === false && h.writeDenied === true);
  const inSessionHookOk = uniq(hcRead).length === 1 && uniq(hcWrite).length === 1 && uniq(hcRead)[0] !== uniq(hcWrite)[0];

  out.partA = {
    name: `A. MCP 长会话 ${N} 次持续调用 (内存/可服务性)`,
    pass: zeroErr && memStable && toolStable,
    iterations: N,
    wallMs,
    latency: stats(lat),
    warmupErrors: warmErrs,
    errors,
    errorNames: uniq(errNames).slice(0, 5),
    hangs,
    baseRssMb: baseRss,
    finalRssMb: finalRss,
    peakRssMb: peak,
    growthMb: growth,
    steadyDriftMb: drift,
    rssSamples,
    memoryStable: memStable,
    zeroError: zeroErr,
    toolCountStart: toolCount0,
    toolCountEnd: toolCount1,
    toolStable,
    detail: `${N} 次调用 零错误=${zeroErr}(err=${errors},hang=${hangs}); RSS 基线=${baseRss}MB→末=${finalRss}MB 增长=${growth}MB(<=${GROWTH_BUDGET_MB}), 峰值=${peak}MB(<=${RSS_CAP_MB}), 稳态漂移=${drift}MB(<=${DRIFT_BUDGET_MB}); tool 数 ${toolCount0}→${toolCount1} 稳定=${toolStable}`,
  };

  out.partB = {
    name: 'B. PreToolUse 安全 hook 长会话全程有效',
    pass: hookOk && inSessionHookOk,
    checkpoints: hookChecks,
    hookChecksPass: hookOk,
    inSessionReadDecisions: uniq(hcRead),
    inSessionWriteDecisions: uniq(hcWrite),
    inSessionHookConsistent: inSessionHookOk,
    detail: `跨会话 ${hookChecks.length} 检查点: 只读放行=${hookChecks.filter((h) => !h.readonlyDenied).length}/${hookChecks.length}, 写拦截=${hookChecks.filter((h) => h.writeDenied).length}/${hookChecks.length}; 会话内 hook_check_command 只读决策=${uniq(hcRead)}, 写决策=${uniq(hcWrite)}`,
  };

  // ---- C. 真沙箱长会话(补充, 非判据) ----
  const c = { name: 'C. 真沙箱长会话 sandbox_exec_with_session (补充)', status: 'BLOCKED', pass: false };
  try {
    const conn = await srv.call('huaweicloud_sandbox_connect', { source: 'CLI', vendorConfirmed: 'use Huawei Cloud sandbox' }, 120000);
    const ctext = JSON.stringify(conn?.result?.content ?? conn);
    c.connectRaw = ctext.slice(0, 300);
    if (conn?.result?.isError || /HDKIT_SANDBOX_MAINTENANCE/.test(ctext)) {
      c.status = 'BLOCKED';
      c.reason = /HDKIT_SANDBOX_MAINTENANCE/.test(ctext)
        ? 'HDKIT_SANDBOX_MAINTENANCE: 沙箱维护窗口, 无法建立长会话(服务端, 非本机可解)'
        : 'sandbox_connect 失败';
    } else {
      const ws = conn?.result?.structuredContent?.workspaceId || null;
      const cmds = [];
      for (let i = 0; i < 30; i += 1) {
        const r = await srv.call('huaweicloud_sandbox_exec_with_session', { workspace_id: ws, command: `echo long-session-${i}` }, 60000);
        cmds.push(r?.result?.isError ? 'ERR' : 'OK');
      }
      c.status = cmds.every((x) => x === 'OK') ? 'PASS' : 'FAIL';
      c.pass = c.status === 'PASS';
      c.execs = cmds.length;
    }
  } catch (e) { c.status = 'BLOCKED'; c.reason = `沙箱不可达/异常: ${e}`; }
  out.partC = c;

  out.verdict = out.partA.pass && out.partB.pass ? 'PASS' : 'FAIL';
  out.assertion = `长会话内存平稳=${out.partA.memoryStable}(增长${growth}MB/峰值${peak}MB), 零错误=${out.partA.zeroError}, hook 全程有效=${out.partB.pass}`;
} catch (e) {
  out.verdict = 'FAIL';
  out.assertion = `探针异常: ${e && e.stack ? e.stack.split('\n')[0] : e}`;
  out.error = String(e);
} finally {
  out.stderrTail = (srv.stderr() || '').slice(0, 800);
  out.finishedAt = new Date().toISOString();
  srv.kill();
}

const text = JSON.stringify(out, null, 2);
console.log(text);
if (process.env.HDK_EVIDENCE) {
  const d = join(process.env.HDK_EVIDENCE, 'D6-7');
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), text, 'utf8');
}
process.exit(out.verdict === 'PASS' ? 0 : 1);
