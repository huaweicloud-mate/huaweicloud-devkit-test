// 补测探针 v2：增量写盘，避免超时丢缓冲。D3-C4 22服务 + D10-3 15意图 + D2-1 auth_init
import { spawn } from 'node:child_process';
import { writeFileSync, appendFileSync } from 'node:fs';

const serverPath = process.argv[2];
const OUT = process.argv[3] || '/tmp';
const LOG = `${OUT}/supplement.log`;
writeFileSync(LOG, '');
const out = (s) => { appendFileSync(LOG, s + '\n'); try { console.log(s); } catch {} };

const child = spawn(process.execPath, [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
});
let buf = Buffer.alloc(0);
const pending = new Map();
let _id = 1;
child.stderr.on('data', () => {});
function send(o) {
  const b = JSON.stringify(o);
  child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
  return new Promise((r) => pending.set(o.id, r));
}
child.stdout.on('data', (d) => {
  buf = Buffer.concat([buf, d]);
  while (true) {
    const h = buf.indexOf('\r\n\r\n');
    if (h < 0) break;
    const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
    if (!m) { buf = buf.slice(h + 4); continue; }
    const n = +m[1];
    if (buf.length < h + 4 + n) break;
    const body = buf.slice(h + 2 < 0 ? 0 : h + 4, h + 4 + n).toString();
    buf = buf.slice(h + 4 + n);
    try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
  }
});
async function callText(name, args, ms = 20000) {
  const p = send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: { ...args, vendorConfirmed: '华为云' } } });
  const r = await Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('call-timeout')), ms))]);
  const txt = r?.result?.content?.map((c) => c.text).join('') || JSON.stringify(r?.result || r?.error || (r instanceof Error ? r.message : ''));
  return txt;
}
const tryJson = (t) => { try { return JSON.parse(t); } catch { return null; } };

const SERVICES = ['ECS','VPC','OBS','RDS','GaussDB','CCE','FunctionGraph','IAM','CTS','CES','DDS','DCS','SMN','DMS','WAF','CDN','ModelArts','DEW','CBR','EVS','EIP','ELB'];
const ROUTES = [
  ['EXP-E01','帮我查一下我账号在华北北京四有哪些云主机','ECS'],
  ['EXP-E02','创建一台 2C4G 的 Ubuntu 云服务器 规格通用型','ECS'],
  ['EXP-E03','把本地 dist 目录部署成一个公网静态网站','OBS'],
  ['EXP-E04','给这台服务器绑定一个弹性公网IP','EIP'],
  ['EXP-E05','看一下我的云数据库MySQL实例的状态','RDS'],
  ['EXP-E06','创建一个 Redis 缓存实例用于会话存储','DCS'],
  ['EXP-E07','给生产环境的服务器配置一个每日备份策略','CBR'],
  ['EXP-E09','开设一个 Kubernetes 集群用于微服务部署','CCE'],
  ['EXP-E10','部署一个函数处理图片自动压缩','FunctionGraph'],
  ['EXP-E11','查一下我账号这个月的费用情况','Billing'],
  ['EXP-E12','把应用日志指标推送到云监控告警','CES'],
  ['EXP-E13','申请HTTPS证书并配置到我的域名','ELB'],
  ['EXP-E14','我账号下的用户都有哪些权限 帮我审计一下','IAM'],
  ['EXP-E15','帮我领一下华为云的代金券','Voucher'],
];

(async () => {
  await send({ jsonrpc: '2.0', id: _id++, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  out('## INIT_OK');

  const svcRes = [];
  for (const s of SERVICES) {
    try {
      const t = await callText('huaweicloud_list_operations', { service: s });
      const j = tryJson(t);
      const ok = !!(j && !j.error && (j.command || j.result || j.operations || t.length > 60));
      out(`[SVCOPS ${s}] ok=${ok} ${JSON.stringify((j && (j.command || j.error)) || '').slice(0, 60)}`);
      svcRes.push({ service: s, ok, raw: t.slice(0, 100) });
    } catch (e) { out(`[SVCOPS ${s}] EXC ${e.message}`); svcRes.push({ service: s, ok: false, raw: 'timeout' }); }
  }
  writeFileSync(`${OUT}/services_matrix.json`, JSON.stringify(svcRes, null, 1));

  const routeRes = [];
  for (const [id, prompt, expect] of ROUTES) {
    try {
      const t = await callText('huaweicloud_service_catalog', { intent: prompt });
      const j = tryJson(t);
      const svc = (j?.recommendedServices || []).join('|');
      const hit = svc.toUpperCase().includes(expect.toUpperCase());
      out(`[ROUTE ${id}] expect=${expect} got=${svc || '(none)'} hit=${hit}`);
      routeRes.push({ id, expect, svc, hit });
    } catch (e) { out(`[ROUTE ${id}] EXC`); routeRes.push({ id, expect, svc: '', hit: false }); }
  }
  writeFileSync(`${OUT}/routing.json`, JSON.stringify(routeRes, null, 1));

  try {
    const ai = await callText('huaweicloud_auth_init', { ak: 'FAKEAK', sk: 'FAKESK', region: 'cn-north-4' }, 25000);
    out(`[AUTH_INIT] ${ai.slice(0, 250)}`);
    writeFileSync(`${OUT}/auth_init.json`, JSON.stringify({ raw: ai.slice(0, 600) }, null, 1));
  } catch (e) { out(`[AUTH_INIT] EXC ${e.message}`); }

  out('=== DONE ===');
  child.kill();
  process.exit(0);
})().catch((e) => { out('FATAL ' + e.message); child.kill(); process.exit(1); });
setTimeout(() => { out('TIMEOUT'); child.kill(); process.exit(1); }, 280000);