// run-l2-eval.mjs — L2 轻量激活评测（11 个长尾技能）
// 二维探测：① service_catalog 路由（意图 → 服务） ② retrieve_skill 激活（精确名 → SKILL.md）
// 零真云成本（确定性，不调 LLM / 不建资源）。复用 run-eval.mjs 的 MCP stdio 客户端模式。
// 用法: node l2/run-l2-eval.mjs
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = process.env.BENCH_MCP_SERVER || 'C:/Users/Administrator/.dsh/huaweicloud-plugins/src/mcp-server.mjs';

// 评测集：skill 名 / 自然语言意图 / service_catalog 期望命中的服务
const L2_SET = [
  ['huawei-cbr', '帮我给云服务器做定期备份，查看备份策略', 'CBR'],
  ['huawei-gaussdb', '创建一个 GaussDB 分布式数据库实例', 'GaussDB'],
  ['huawei-dds-dcs', '创建一个文档数据库 DDS 实例', 'DDS'],
  ['huawei-dew', '创建一个 KMS 密钥用于数据加密', 'KMS'],
  ['huawei-cts', '查询云资源的操作审计日志', 'CTS'],
  ['huawei-cloud-eye', '查看云服务器的监控指标和告警规则', 'CES'],
  ['huawei-waf-aad', '配置 Web 应用防火墙防护策略', 'WAF'],
  ['huawei-apig', '创建一个 API 网关实例', 'APIG'],
  ['huawei-modelarts', '部署一个机器学习模型训练任务', 'ModelArts'],
  ['huawei-voucher', '查看账户里的代金券', 'Incentive Voucher'],
  ['huawei-sandbox', '在沙箱环境临时部署一个网站预览', 'Sandbox'],
  ['huawei-deployment', '帮我创建一个部署任务（CloudDeploy 流水线应用）', 'CodeArtsDeploy'],
];

function makeServer(serverPath) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let _id = 1;
  function send(o) {
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((r) => pending.set(o.id, r));
  }
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
      try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  const call = (name, arguments_) => send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: arguments_ || {} } });
  return { send, call, _id: () => _id++, kill: () => child.kill() };
}

function textOf(resp) { return resp?.result?.content?.[0]?.text || ''; }

const srv = makeServer(serverPath);
await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'run-l2-eval', version: '1' } } });
srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });

const results = [];
for (const [skill, prompt, expectSvc] of L2_SET) {
  // ① service_catalog 路由
  const r1 = await srv.call('huaweicloud_service_catalog', { intent: prompt });
  let rr = {};
  try { rr = JSON.parse(textOf(r1)); } catch {}
  const svcs = rr.recommendedServices || [];
  const routeHit = svcs.some((s) => s.includes(expectSvc) || expectSvc.includes(s));

  // ② retrieve_skill 激活（精确名 → JSON {ok, content}）
  const r2 = await srv.call('huaweicloud_retrieve_skill', { name: skill });
  const t2 = textOf(r2);
  let j2 = null;
  try { j2 = JSON.parse(t2); } catch {}
  const skillHit = !!(j2 && j2.ok === true && j2.content);

  results.push({ skill, expectSvc, route: svcs.join('/') || '(兜底)', routeHit, skillHit });
  console.log(`${skill.padEnd(18)} 路由[${svcs.join(',') || '兜底'}]${routeHit ? ' HIT' : ' MISS'}  激活[${skillHit ? 'OK' : 'MISS'}]`);
}

const routeHit = results.filter((r) => r.routeHit).length;
const skillHit = results.filter((r) => r.skillHit).length;
console.log(`\n=== L2 轻量激活评测汇总（${L2_SET.length} 长尾技能）===`);
console.log(`service_catalog 路由命中=${routeHit}/${L2_SET.length}   retrieve_skill 激活成功=${skillHit}/${L2_SET.length}`);
const missRoute = results.filter((r) => !r.routeHit).map((r) => r.skill);
if (missRoute.length) console.log(`路由未命中的技能: ${missRoute.join(', ')}`);

const outDir = join(__dirname, 'results');
mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
writeFileSync(join(outDir, `l2-eval-${ts}.json`), JSON.stringify({ meta: { ts, mode: 'l2-activation' }, results, routeHit, skillHit }, null, 2), 'utf-8');
console.log(`结果落盘: l2/results/l2-eval-${ts}.json`);

srv.kill();
process.exit(0);