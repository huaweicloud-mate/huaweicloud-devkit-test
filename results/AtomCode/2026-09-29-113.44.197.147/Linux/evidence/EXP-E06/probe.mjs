// D10-3 路由准确率+混淆矩阵 —— 源码级直调 serviceCatalog() 中文意图→服务路由断言
// 设计断言：serviceCatalog 中/英文意图均命中对应服务（源码级无需 LLM）。
// 本探针走真实 mcp-server 的 huaweicloud_service_catalog 工具，逐条注入 15 条中文评测意图，
// 校验 recommendedServices 是否包含期望服务；另注入英文控制组证明「英文命中/中文未命中」的漂移边界。
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = process.argv[2] || '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';

// 15 条中文评测意图 → 期望服务（与 eval/prompts/eval-set-v1.csv 同源，来源=展开级矩阵 EXP-E01~E15）
const EXPECT = {
  'EXP-E01': ['ECS'], 'EXP-E02': ['ECS'], 'EXP-E03': ['OBS'], 'EXP-E04': ['EIP'],
  'EXP-E05': ['RDS'], 'EXP-E06': ['DCS'], 'EXP-E07': ['CBR'], 'EXP-E08': null,
  'EXP-E09': ['CCE'], 'EXP-E10': ['FunctionGraph'], 'EXP-E11': ['BSS'], 'EXP-E12': ['CES'],
  'EXP-E13': ['ELB'], 'EXP-E14': ['IAM'], 'EXP-E15': ['Incentive Voucher'],
};
const PROMPTS = {
  'EXP-E01': '帮我查一下我账号在华北北京四有哪些云主机',
  'EXP-E02': '创建一台 2C4G 的 Ubuntu 云服务器 规格通用型',
  'EXP-E03': '把本地 dist 目录部署成一个公网静态网站',
  'EXP-E04': '给这台服务器绑定一个弹性公网IP',
  'EXP-E05': '看一下我的云数据库MySQL实例的状态',
  'EXP-E06': '创建一个 Redis 缓存实例用于会话存储',
  'EXP-E07': '给生产环境的服务器配置一个每日备份策略',
  'EXP-E08': '我的ECS启动失败了 帮我分析原因',
  'EXP-E09': '开设一个 Kubernetes 集群用于微服务部署',
  'EXP-E10': '部署一个函数处理图片自动压缩',
  'EXP-E11': '查一下我账号这个月的费用情况',
  'EXP-E12': '把应用日志指标推送到云监控告警',
  'EXP-E13': '申请HTTPS证书并配置到我的域名',
  'EXP-E14': '我账号下的用户都有哪些权限 帮我审计一下',
  'EXP-E15': '帮我领一下华为云的代金券',
};
// 英文控制组（证明 routeMap 英文关键词通路可用，漂移仅限中文意图）
const EN_CTRL = [
  ['en-ecs', 'list my ECS servers in region', ['ECS']],
  ['en-rds', 'check my MySQL database status', ['RDS']],
  ['en-obs', 'host a static website from a bucket', ['OBS']],
];

function makeServer(p) {
  const child = spawn(process.execPath, [p], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let id = 1000;
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
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
  function send(o) { const b = JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise((r) => pending.set(o.id, r)); }
  async function call(name, args) { return send({ jsonrpc: '2.0', id: id++, method: 'tools/call', params: { name, arguments: args || {} } }); }
  return { child, send, call, kill: () => { try { child.kill(); } catch {} } };
}

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

const srv = makeServer(serverPath);
await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe-d10-routing', version: '1' } } });
srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });

let hit = 0, miss = 0, na = 0;
for (const [cid, prompt] of Object.entries(PROMPTS)) {
  const resp = await srv.call('huaweicloud_service_catalog', { intent: prompt });
  const text = resp?.result?.content?.[0]?.text || '';
  let rr = {}; try { rr = text ? JSON.parse(text) : {}; } catch {}
  const svcs = rr.recommendedServices || [];
  const expect = EXPECT[cid];
  let verdict;
  if (expect === null) { verdict = 'N/A'; na++; }
  else {
    verdict = expect.some((s) => svcs.includes(s)) ? 'HIT' : 'MISS';
    verdict === 'HIT' ? hit++ : miss++;
  }
  check('D10-3', `${cid} 中文意图命中期望服务 ${(expect || []).join('/') || '(诊断)'}`, verdict, expect === null ? 'N/A' : 'HIT');
}
for (const [cid, prompt, expect] of EN_CTRL) {
  const resp = await srv.call('huaweicloud_service_catalog', { intent: prompt });
  const text = resp?.result?.content?.[0]?.text || '';
  let rr = {}; try { rr = text ? JSON.parse(text) : {}; } catch {}
  const svcs = rr.recommendedServices || [];
  check('D10-3', `${cid} 英文意图命中期望服务 ${expect.join('/')}`, expect.some((s) => svcs.includes(s)), true);
}
const denom = hit + miss;
check('D10-3', '中文意图路由准确率 ≥ 90%', denom ? ((hit / denom) * 100).toFixed(1) >= 90 : false, true);

console.log('\n=== D10-3 路由准确率+混淆矩阵（源码级 serviceCatalog）探针结果 ===');
for (const line of results) console.log(line);
console.log(`\n中文意图 HIT=${hit} MISS=${miss} N/A=${na} | 准确率=${denom ? ((hit / denom) * 100).toFixed(1) : 'N/A'}% (设计断言≥90%)`);
console.log(`TOTAL pass=${pass} fail=${fail}`);
srv.kill();
process.exit(fail > 0 ? 1 : 0);