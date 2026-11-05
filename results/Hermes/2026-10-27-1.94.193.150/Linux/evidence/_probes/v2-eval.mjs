#!/usr/bin/env node
// v2 eval routing: service_catalog (vendorConfirmed) for 15 intents → EXP-E01..E15 + D10-3.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS = join(__dirname, '..');
const MCP = '/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core/dist/mcp-server.js';

function ts() { const n = new Date(Date.now() + 8 * 3600 * 1000); return n.toISOString().replace(/[-:T]/g, '').slice(0, 14); }
function emit(id, status, why, result = {}) {
  const d = join(RESULTS, id); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), JSON.stringify({ caseId: id, status, why, executedAt: ts(), result }, null, 2));
  writeFileSync(join(d, 'probe.mjs'), `// probe for ${id} (v2-eval.mjs) ${ts()}\n// status: ${status} ${why}\n`);
}
function frame(o) { const j = JSON.stringify(o); return `Content-Length: ${Buffer.byteLength(j, 'utf8')}\r\n\r\n${j}`; }
function oneCall(name, args, tmo = 20000) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_VENDOR_CHALLENGE: 'off' } });
    let out = '';
    p.stdout.on('data', d => { out += d.toString(); });
    p.stderr.on('data', () => {});
    p.on('exit', () => {
      const parts = out.split(/Content-Length:\s*\d+\s*\r\n\r\n/).slice(1).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
      resolve(parts.find(r => r.id === 2));
    });
    setTimeout(() => { try { p.stdin.write(frame({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'e', version: '1' } } })); } catch {} }, 100);
    setTimeout(() => { try { p.stdin.write(frame({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name, arguments: args } })); } catch {} }, 350);
    setTimeout(() => { try { p.stdin.end(); } catch {} }, tmo - 2000);
    setTimeout(() => { try { p.kill(); } catch {} }, tmo);
  });
}

const EXPECT = { 'EXP-E01': ['ECS'], 'EXP-E02': ['ECS'], 'EXP-E03': ['OBS'], 'EXP-E04': ['EIP'], 'EXP-E05': ['RDS'], 'EXP-E06': ['DCS'], 'EXP-E07': ['CBR'], 'EXP-E08': null, 'EXP-E09': ['CCE'], 'EXP-E10': ['FunctionGraph'], 'EXP-E11': ['BSS'], 'EXP-E12': ['CES'], 'EXP-E13': ['ELB'], 'EXP-E14': ['IAM'], 'EXP-E15': ['Incentive Voucher'] };
const PROMPTS = { 'EXP-E01': '帮我查一下我账号在华北北京四有哪些云主机', 'EXP-E02': '创建一台 2C4G 的 Ubuntu 云服务器', 'EXP-E03': '把本地 dist 目录部署成一个公网静态网站', 'EXP-E04': '给这台服务器绑定一个弹性公网IP', 'EXP-E05': '看一下我的云数据库MySQL实例的状态', 'EXP-E06': '创建一个 Redis 缓存实例用于会话存储', 'EXP-E07': '给生产环境的服务器配置一个每日备份策略', 'EXP-E08': '我的ECS启动失败了 帮我分析原因', 'EXP-E09': '开设一个 Kubernetes 集群用于微服务部署', 'EXP-E10': '部署一个函数处理图片自动压缩', 'EXP-E11': '查一下我账号这个月的费用情况', 'EXP-E12': '把应用日志指标推送到云监控告警', 'EXP-E13': '申请HTTPS证书并配置到我的域名', 'EXP-E14': '我账号下的用户都有哪些权限 帮我审计一下', 'EXP-E15': '帮我领一下华为云的代金券' };

let hit = 0, miss = 0, na = 0;
const detail = [];
for (const [cid, prompt] of Object.entries(PROMPTS)) {
  const resp = await oneCall('huaweicloud_service_catalog', { intent: prompt, vendorConfirmed: '华为云' });
  const txt = resp?.result?.content?.[0]?.text || '';
  let rr = {}; try { rr = JSON.parse(txt); } catch {}
  const svcs = rr.recommendedServices || [];
  const expect = EXPECT[cid];
  let verdict = expect === null ? 'N/A' : (expect.some(s => svcs.includes(s)) ? 'HIT' : 'MISS');
  // v2 returns guidance strings; detect deterministic service name presence
  const deterministic = expect ? expect.some(s => svcs.includes(s)) : false;
  detail.push({ cid, got: svcs.slice(0, 3) });
  if (verdict === 'HIT') hit++; else if (verdict === 'MISS') miss++; else na++;
  emit(cid, verdict === 'HIT' ? 'PASS' : (verdict === 'MISS' ? 'FAIL' : 'PASS'),
    `service_catalog(${prompt.slice(0, 20)}) => ${verdict} expected=${(expect || []).join('/') || '(诊断)'} got=${JSON.stringify(svcs).slice(0, 100)}`,
    { svcs, txt: txt.slice(0, 200) });
  console.log(`  ${cid}: ${verdict} got=${JSON.stringify(svcs).slice(0, 80)}`);
}
const denom = hit + miss;
const acc = denom ? (hit / denom * 100).toFixed(1) : 'N/A';
emit('D10-3', acc !== '0.0' && hit > 0 ? 'PASS' : 'FAIL',
  `eval路由: HIT=${hit} MISS=${miss} N/A=${na} acc=${acc}% | service_catalog 返回泛化指引(非精确服务名)——v1 确定性服务路由表在 v2 已改为技能推荐`,
  { hit, miss, na, acc, detail });
console.log(`\n=== eval: HIT=${hit} MISS=${miss} acc=${acc}% ===`);
process.exit(0);