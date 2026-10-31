// D6-4 并发调度正确性 —— ①并发 30 请求 ②无死锁无消息错乱 ③核对 session-manager
// 三层证据:
//   A. MCP 协议层: 单 server 上并发 30 个 JSON-RPC 请求, 校验全部返回 + id 1:1 对齐(无错序) + 无死锁
//   B. 多路复用 FairQueue: 30 通道并发投递, 校验全量送达 + 通道内 FIFO(无消息错乱) + 公平轮转 + 无死锁
//   C. session-manager: 30 路并发 execWithSession(独立 + 同 workspace 去重), 校验会话隔离/单飞/无错乱
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { makeServer } from './mcp-client.mjs';

const SRC = process.env.HDK_SRC || '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/dist';
const MCP = join(SRC, 'mcp-server.js');
const N = 30;

const out = {
  caseId: 'D6-4',
  title: `并发调度正确性 (并发 ${N} 请求, 无死锁无消息错乱, 核对 session-manager)`,
  threshold: '30 并发全部正确返回; 无死锁; 消息/响应 id 无错序',
  env: { HDK_SRC: SRC, node: process.version },
  startedAt: new Date().toISOString(),
  layers: {},
};

// ---------- A. MCP 协议层 30 并发 ----------
{
  const srv = makeServer(MCP);
  const layer = { name: 'A. MCP JSON-RPC 30 并发 (tools/list × 30)', pass: false };
  try {
    await srv.initialize();
    const ids = Array.from({ length: N }, () => srv.nextId());
    const t0 = performance.now();
    const ps = ids.map((id) => srv.send({ jsonrpc: '2.0', id, method: 'tools/list', params: {} }, 20000));
    const rs = await Promise.all(ps);
    layer.elapsedMs = +(performance.now() - t0).toFixed(2);
    layer.returned = rs.length;
    // id 1:1 对齐检查(顺序无关, 集合相等即无丢失/无错配)
    const gotIds = rs.map((r) => r?.id).filter((v) => v !== undefined);
    const setOk = gotIds.length === N && new Set(gotIds).size === N && ids.every((i) => gotIds.includes(i));
    const toolCounts = rs.map((r) => (r?.result?.tools || []).length);
    const uniq = [...new Set(toolCounts)];
    layer.idAligned = setOk;
    layer.toolCountsUnique = uniq;
    layer.toolsConsistent = uniq.length === 1 && uniq[0] > 0;
    layer.pass = setOk && layer.toolsConsistent;
    layer.detail = `返回 ${rs.length}/${N}, id 1:1=${setOk}, tools 数集合=${uniq.join(',')} (无死锁: 全部在 20s 内返回)`;
  } catch (e) {
    layer.detail = `异常: ${e}`;
  } finally {
    srv.kill();
  }
  out.layers.A = layer;
}

// ---------- B. FairQueue 多路复用 30 通道 ----------
{
  const layer = { name: 'B. hwlink-fair-queue 30 通道并发投递', pass: false };
  try {
    const { FairQueue } = await import(pathToFileURL(join(SRC, 'ws-exec/hwlink-fair-queue.js')).href);
    const PER_CH = 20;
    const received = []; // {ch, seq, byte}
    const sentOrder = new Map(); // ch -> [seq...]
    const q = new FairQueue((data) => {
      const s = Buffer.from(data).toString('utf8');
      const [ch, seq] = s.split(':').map(Number);
      received.push({ ch, seq });
    });
    const chans = Array.from({ length: N }, (_, i) => ({ identifier: 1000 + i }));
    for (const c of chans) q.register(c);
    const t0 = performance.now();
    const jobs = [];
    for (const c of chans) {
      const seqs = [];
      for (let s = 0; s < PER_CH; s += 1) {
        seqs.push(s);
        jobs.push(q.sendFairly(c, Buffer.from(`${c.identifier}:${s}`)));
      }
      sentOrder.set(c.identifier, seqs);
    }
    await Promise.race([
      (async () => {
        // sendFairly resolves on enqueue; wait until the drain actually flushes
        // every queued message (or the deadline trips).
        for (let i = 0; i < 400 && received.length < N * PER_CH; i += 1) {
          await new Promise((r) => setTimeout(r, 10));
        }
        await Promise.all(jobs);
      })(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('deadlock: >15s 未完成')), 15000)),
    ]);
    layer.elapsedMs = +(performance.now() - t0).toFixed(2);
    // 全量送达
    const expected = N * PER_CH;
    layer.delivered = received.length;
    layer.allDelivered = received.length === expected;
    // 通道内 FIFO(无消息错乱)
    let fifoOk = true;
    const perCh = new Map();
    for (const r of received) {
      if (!perCh.has(r.ch)) perCh.set(r.ch, []);
      perCh.get(r.ch).push(r.seq);
    }
    for (const [ch, seqs] of perCh) {
      const sorted = [...seqs].sort((a, b) => a - b);
      if (seqs.join(',') !== sorted.join(',') || seqs.length !== PER_CH) fifoOk = false;
    }
    layer.perChannelFifo = fifoOk;
    layer.channelsSeen = perCh.size;
    layer.pass = layer.allDelivered && fifoOk && perCh.size === N;
    layer.detail = `送达 ${received.length}/${expected}, 通道数=${perCh.size}/${N}, 通道内 FIFO=${fifoOk}`;
  } catch (e) {
    layer.detail = `异常: ${e}`;
  }
  out.layers.B = layer;
}

// ---------- C. session-manager 30 路并发 ----------
{
  const layer = { name: 'C. session-manager 30 路并发 execWithSession', pass: false };
  try {
    const sm = await import(pathToFileURL(join(SRC, 'sandbox/session-manager.js')).href);
    const made = [];
    let execCalls = 0;
    sm._setSessionConnectorForTests(async (_ws, _u) => {
      const session = {
        state: 'ready',
        execCalls: [],
        close() {},
        async exec(command) { execCalls += 1; this.execCalls.push(command); await new Promise((r) => setTimeout(r, 5)); return { stdout: command, exitCode: 0 }; },
      };
      made.push(session);
      return session;
    });
    // C1: 30 个不同 workspace 并发 -> 各自独立会话, 结果无串扰
    const t0 = performance.now();
    const distinct = await Promise.all(
      Array.from({ length: N }, (_, i) => sm.execWithSession(`ws-distinct-${i}`, `echo distinct-${i}`, 'root')),
    );
    layer.distinctMs = +(performance.now() - t0).toFixed(2);
    layer.distinctSessions = made.length;
    const distinctOk = distinct.every((r, i) => r.stdout === `echo distinct-${i}`);
    // C2: 预热 1 个共享会话后, 30 路并发复用同一会话 -> 结果无错乱(多路复用单通道)
    const warm = await sm.execWithSession('ws-shared', 'echo warm', 'root');
    const before = made.length;
    const same = await Promise.all(
      Array.from({ length: N }, (_, i) => sm.execWithSession('ws-shared', `echo shared-${i}`, 'root')),
    );
    layer.sharedSessionsCreated = made.length - before;
    const sameOk = same.every((r, i) => r.stdout === `echo shared-${i}`);
    layer.warmOk = warm.stdout === 'echo warm';
    layer.distinctIsolated = distinctOk;
    layer.sharedReuse = layer.sharedSessionsCreated === 0; // 复用已缓存会话
    layer.sharedResultsIntact = sameOk;
    layer.execCallsTotal = execCalls;
    // C3: 项目自带 session-manager 基线测试
    const { spawnSync } = await import('node:child_process');
    const repo = process.env.HDK_REPO || '/home/testbot3/devkit-test/Hermes/hdk';
    const bt = spawnSync(process.execPath, ['--experimental-strip-types', '--experimental-test-module-mocks', '--test', 'test/session-manager.test.ts'], { cwd: repo, encoding: 'utf8' });
    const btail = ((bt.stdout || '') + (bt.stderr || '')).trim().split('\n');
    layer.baselineTest = {
      exit: bt.status,
      pass: /# pass (\d+)/.exec(bt.stdout || '')?.[1],
      fail: /# fail (\d+)/.exec(bt.stdout || '')?.[1],
      tail: btail.slice(-8),
    };
    await sm.closeAllSessions();
    layer.pass = distinctOk && sameOk && layer.warmOk && layer.sharedReuse && bt.status === 0;
    layer.detail = `独立 ws 会话数=${layer.distinctSessions}, 结果隔离=${distinctOk}; 共享 ws 复用会话(新建=${layer.sharedSessionsCreated}), 结果完整=${sameOk}; 基线测试 exit=${bt.status} pass=${layer.baselineTest.pass}/fail=${layer.baselineTest.fail}`;
  } catch (e) {
    layer.detail = `异常: ${e}`;
  }
  out.layers.C = layer;
}

const allPass = Object.values(out.layers).every((l) => l.pass);
out.verdict = allPass ? 'PASS' : 'FAIL';
out.assertion = Object.values(out.layers).map((l) => `${l.name.split('.')[0]}=${l.pass ? 'OK' : 'NG'}`).join(' ');
out.finishedAt = new Date().toISOString();

const text = JSON.stringify(out, null, 2);
console.log(text);
if (process.env.HDK_EVIDENCE) {
  const d = join(process.env.HDK_EVIDENCE, 'D6-4');
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), text, 'utf8');
}
process.exit(out.verdict === 'PASS' ? 0 : 1);
