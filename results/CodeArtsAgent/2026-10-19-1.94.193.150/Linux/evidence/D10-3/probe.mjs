// D10-3 路由准确率（源码级）探针（Hermes Linux 每日回归）
// 通过 MCP tools/call huaweicloud_service_catalog 直调 serviceCatalog(intent)，
// 核对「中/英文意图 → 服务路由映射」是否命中。重点：routeMap 仅有 sandbox/voucher 两条
// 含中文(CJK)关键字，其余服务仅英文关键字 → 中文意图命中应为观察点。
import { spawn } from 'node:child_process';

const serverPath = process.argv[2];
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
    const body = buf.slice(h + 4, h + 4 + n).toString();
    buf = buf.slice(h + 4 + n);
    try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
  }
});

(async () => {
  await send({ jsonrpc: '2.0', id: _id++, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });

  const cases = [
    ['英文: create ecs server', 'create an ecs server instance'],
    ['英文: upload obs bucket', 'upload files to an obs bucket'],
    ['英文: iam role management', 'create an iam role and attach permission policy'],
    ['英文: deploy website', 'deploy my static website'],
    ['中文: 创建云服务器(ECS)', '创建云服务器'],
    ['中文: 对象存储桶(OBS)', '对象存储桶上传对象'],
    ['中文: 权限管理(IAM)', '权限管理 角色 策略'],
    ['中文: 部署网站(sandbox)', '部署网站'],
    ['中文: 领取代金券(voucher)', '领取代金券'],
  ];

  for (const [label, intent] of cases) {
    const r = await send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name: 'huaweicloud_service_catalog', arguments: { intent } } });
    const txt = r?.result?.content?.map((c) => c.text).join('') || JSON.stringify(r?.result || r?.error);
    let svc = '', sk = '';
    try {
      const j = JSON.parse(txt);
      svc = (j.recommendedServices || []).join('|');
      sk = (j.recommendedSkills || []).join('|');
    } catch { svc = txt.slice(0, 120); }
    console.log(`[${label}] intent=${JSON.stringify(intent)}`);
    console.log(`    recommendedServices = ${svc}`);
    console.log(`    recommendedSkills   = ${sk}`);
  }

  console.log('=== DONE ===');
  child.kill();
  process.exit(0);
})().catch((e) => { console.log('ERR', e.message); child.kill(); process.exit(1); });
setTimeout(() => { console.log('TIMEOUT'); child.kill(); process.exit(1); }, 60000);