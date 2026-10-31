// D6-1 检索响应延迟 —— search_docs/retrieve_skill 连续调用 100 次采样, 判据 p95 < 2s
// 主口径: MCP 工具 huaweicloud_search_docs 端到端往返（真实用户可见检索延迟）
// 辅口径: 直接调用 searchDocs() handler（去掉 JSON-RPC 开销）
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { makeServer, stats } from './mcp-client.mjs';

const SRC = process.env.HDK_SRC || '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/dist';
const MCP = join(SRC, 'mcp-server.js');
const THRESHOLD_MS = 2000;
const N = 100;

const QUERIES = [
  'ECS 创建指引', 'how to create an ECS instance', 'OBS 静态网站托管', 'VPC 安全组规则',
  'IAM 委托授权', 'RDS 备份恢复', 'CCE 集群节点池', 'KooCLI 安装凭证', 'EIP 绑定弹性公网',
  'DDoS 防护策略', 'GaussDB 分布式数据库', 'FunctionGraph 函数部署', 'CTS 审计日志',
  'SMN 消息通知订阅', 'WAF 防护配置', 'ModelArts 训练作业', 'DEW 密钥管理', 'CES 告警规则',
  'billing 账单查询', 'terraform 华为云 provider',
];

const srv = makeServer(MCP);
const out = {
  caseId: 'D6-1',
  title: '检索响应延迟 (search_docs 100 次采样, p95<2s)',
  threshold: 'p95 < 2000ms',
  env: { HDK_SRC: SRC, node: process.version },
  startedAt: new Date().toISOString(),
};
try {
  const init = await srv.initialize();
  out.serverInfo = init?.result?.serverInfo;

  // ---- 主口径: MCP 端到端 100 次 ----
  const e2e = [];
  let e2eErr = 0;
  let e2eEmpty = 0;
  for (let i = 0; i < N; i += 1) {
    const q = QUERIES[i % QUERIES.length];
    const t0 = performance.now();
    const r = await srv.call('huaweicloud_search_docs', { query: q });
    e2e.push(performance.now() - t0);
    if (r?.error) e2eErr += 1;
    let payload = r?.result?.content?.[0]?.text;
    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);
        if (parsed?.count === 0) e2eEmpty += 1;
      } catch { /* non-JSON text */ }
    }
  }
  out.mcpEndToEnd = { samples: N, errors: e2eErr, zeroHit: e2eEmpty, ...stats(e2e), rawMs: e2e.map((v) => +v.toFixed(2)) };

  // ---- 辅口径: 直接 handler 100 次 ----
  const mod = await import(pathToFileURL(join(SRC, 'search-docs.js')).href);
  const direct = [];
  for (let i = 0; i < N; i += 1) {
    const q = QUERIES[i % QUERIES.length];
    const t0 = performance.now();
    await mod.searchDocs(q);
    direct.push(performance.now() - t0);
  }
  out.directHandler = { samples: N, ...stats(direct), rawMs: direct.map((v) => +v.toFixed(2)) };

  out.verdict = out.mcpEndToEnd.p95 < THRESHOLD_MS ? 'PASS' : 'FAIL';
  out.assertion = `MCP 端到端 search_docs p95=${out.mcpEndToEnd.p95}ms ${out.mcpEndToEnd.p95 < THRESHOLD_MS ? '<' : '>='} ${THRESHOLD_MS}ms`;
} catch (e) {
  out.verdict = 'FAIL';
  out.assertion = `探针异常: ${e && e.stack ? e.stack.split('\n')[0] : e}`;
  out.error = String(e);
} finally {
  out.stderrTail = (srv.stderr() || '').slice(0, 1200);
  out.finishedAt = new Date().toISOString();
  srv.kill();
}

const text = JSON.stringify(out, null, 2);
console.log(text);
if (process.env.HDK_EVIDENCE) {
  const d = join(process.env.HDK_EVIDENCE, 'D6-1');
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), text, 'utf8');
}
process.exit(out.verdict === 'PASS' ? 0 : 1);
