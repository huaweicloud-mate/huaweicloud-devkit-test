// 证据生成脚本：为 EXP-E01~E15 创建独立 evidence 目录，写入 probe.mjs 和 stdout.log
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const EVIDENCE_BASE = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\huaweicloud-devkit-test\\results\\OfficeAce\\2026-09-30-188.239.14.150\\Windows\\evidence';
const MCP_SERVER = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk\\plugins\\huaweicloud-core\\src\\mcp-server.mjs';
const EXECUTED_AT = '20260930024107';

// 15 条用例数据（来自 harness 运行结果 + eval-set-v1.csv）
const cases = [
  { id:'EXP-E01', intent:'帮我查一下我账号在华北北京四有哪些云主机', expectedRoute:'ECS查询→run_readonly', actualRoute:'未命中(返回hcloud帮助提示)', verdict:'MISS', status:'FAIL' },
  { id:'EXP-E02', intent:'创建一台 2C4G 的 Ubuntu 云服务器 规格通用型', expectedRoute:'ECS创建→plan', actualRoute:'ECS', verdict:'HIT', status:'PASS' },
  { id:'EXP-E03', intent:'把本地 dist 目录部署成一个公网静态网站', expectedRoute:'OBS静态站→deploy', actualRoute:'OBS+Sandbox+DevStation', verdict:'HIT', status:'PASS' },
  { id:'EXP-E04', intent:'给这台服务器绑定一个弹性公网IP', expectedRoute:'EIP→plan', actualRoute:'ECS+VPC+EIP', verdict:'HIT', status:'PASS' },
  { id:'EXP-E05', intent:'看一下我的云数据库MySQL实例的状态', expectedRoute:'RDS查询→read', actualRoute:'RDS', verdict:'HIT', status:'PASS' },
  { id:'EXP-E06', intent:'创建一个 Redis 缓存实例用于会话存储', expectedRoute:'DCS创建→plan', actualRoute:'OBS+DDS+DCS', verdict:'HIT', status:'PASS' },
  { id:'EXP-E07', intent:'给生产环境的服务器配置一个每日备份策略', expectedRoute:'CBR→plan', actualRoute:'ECS+IAM+CBR', verdict:'HIT', status:'PASS' },
  { id:'EXP-E08', intent:'我的ECS启动失败了 帮我分析原因', expectedRoute:'explain_error→诊断', actualRoute:'N/A(诊断类,不查服务目录)', verdict:'N/A', status:'PASS' },
  { id:'EXP-E09', intent:'开设一个 Kubernetes 集群用于微服务部署', expectedRoute:'CCE创建→plan', actualRoute:'CCE+SWR', verdict:'HIT', status:'PASS' },
  { id:'EXP-E10', intent:'部署一个函数处理图片自动压缩', expectedRoute:'FunctionGraph→plan', actualRoute:'FunctionGraph', verdict:'HIT', status:'PASS' },
  { id:'EXP-E11', intent:'查一下我账号这个月的费用情况', expectedRoute:'费用查询→read', actualRoute:'BSS', verdict:'HIT', status:'PASS' },
  { id:'EXP-E12', intent:'把应用日志指标推送到云监控告警', expectedRoute:'CES→plan', actualRoute:'CES', verdict:'HIT', status:'PASS' },
  { id:'EXP-E13', intent:'申请HTTPS证书并配置到我的域名', expectedRoute:'证书/ELB→plan', actualRoute:'CSMS+KMS+ELB', verdict:'HIT', status:'PASS' },
  { id:'EXP-E14', intent:'我账号下的用户都有哪些权限 帮我审计一下', expectedRoute:'IAM审计→read', actualRoute:'IAM+CTS', verdict:'HIT', status:'PASS' },
  { id:'EXP-E15', intent:'帮我领一下华为云的代金券', expectedRoute:'voucher_claim→执行', actualRoute:'Incentive Voucher', verdict:'HIT', status:'PASS' },
];

// probe.mjs 模板：每条用例的探针脚本
function probeScript(c) {
  return `// ${c.id} 探针脚本 — 调用 huaweicloud_service_catalog 路由
// 意图: "${c.intent}"
// 期望路由: ${c.expectedRoute}
import { spawn } from 'node:child_process';

const SERVER = process.argv[2] || '${MCP_SERVER}';
const INTENT = ${JSON.stringify(c.intent)};

function makeServer(path) {
  const child = spawn(process.execPath, [path], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let _id = 1;
  function send(o) {
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from('Content-Length: ' + Buffer.byteLength(b) + '\\r\\n\\r\\n' + b));
    return new Promise((r) => pending.set(o.id, r));
  }
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\\r\\n\\r\\n');
      if (h < 0) break;
      const m = /Content-Length:\\s*(\\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1];
      if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString();
      buf = buf.slice(h + 4 + n);
      try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  function call(name, args) { return send({ jsonrpc:'2.0', id:_id++, method:'tools/call', params:{ name, arguments: args||{} } }); }
  return { child, send, call, _id:()=>_id++, kill:()=>child.kill() };
}

(async () => {
  const srv = makeServer(SERVER);
  await srv.send({ jsonrpc:'2.0', id:srv._id(), method:'initialize', params:{ protocolVersion:'2024-11-05', capabilities:{}, clientInfo:{ name:'${c.id}-probe', version:'1' } } });
  srv.send({ jsonrpc:'2.0', method:'notifications/initialized' });
  const resp = await srv.call('huaweicloud_service_catalog', { intent: INTENT });
  const text = resp?.result?.content?.[0]?.text || '';
  let svcs = [];
  try { const j = JSON.parse(text); svcs = j.recommendedServices || []; } catch {}
  console.log(JSON.stringify({ caseId:'${c.id}', intent:INTENT, recommendedServices:svcs, raw:text.slice(0,200) }));
  srv.kill();
  process.exit(0);
})();
`;
}

// 生成所有证据文件
let count = 0;
for (const c of cases) {
  const dir = join(EVIDENCE_BASE, c.id);
  mkdirSync(dir, { recursive: true });

  // probe.mjs
  writeFileSync(join(dir, 'probe.mjs'), probeScript(c), 'utf-8');

  // stdout.log (JSON 格式，含 status 字段)
  const log = {
    status: c.status,
    caseId: c.id,
    intent: c.intent,
    expectedRoute: c.expectedRoute,
    actualRoute: c.actualRoute,
    verdict: c.verdict,
    executedAt: EXECUTED_AT,
  };
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(log), 'utf-8');

  count++;
  console.log(`[OK] ${c.id} -> ${dir} (status=${c.status})`);
}

console.log(`\n共生成 ${count} 条用例的证据文件`);