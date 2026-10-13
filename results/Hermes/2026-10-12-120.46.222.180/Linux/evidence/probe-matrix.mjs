// 服务矩阵(EXP-C4-*) + 中文意图路由(D10-3/EXP-E*) 探针 — Hermes/Linux/1.1.4
import { spawn } from 'node:child_process';
const SERVER = process.env.HDK_MCP_SERVER;
const child = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'inherit'] });
let buf = ''; const pending = new Map(); let nextId = 1;
function rpc(method, params) {
  return new Promise((r) => { const id = nextId++; pending.set(id, r); child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params: params || {} }) + '\n'); });
}
child.stdout.on('data', (d) => {
  buf += d.toString('utf8'); let i;
  while ((i = buf.indexOf('\n')) !== -1) { const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!l) continue; let m; try { m = JSON.parse(l); } catch { continue; } if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } }
});
async function rawText(name, args) {
  const r = await rpc('tools/call', { name, arguments: args });
  if (r.error) return { __error: r.error.code + ' ' + (r.error.message||'').slice(0,80) };
  const c = r.result && r.result.content && r.result.content[0];
  const text = c ? c.text : JSON.stringify(r.result);
  try { return JSON.parse(text); } catch { return { __raw: String(text).slice(0,200) }; }
}

const SERVICES = ['ECS','VPC','OBS','RDS','GaussDB','CCE','FunctionGraph','IAM','CTS','CES','DDS','DCS','SMN','DMS','WAF','CDN','ModelArts','DEW','CBR','EVS','EIP','ELB'];

setTimeout(async () => {
  await rpc('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'hermes' } });

  console.log('===== EXP-C4 服务矩阵 (list_operations + plan 只读) =====');
  for (const svc of SERVICES) {
    const lo = await rawText('huaweicloud_list_operations', { service: svc });
    const pl = await rawText('huaweicloud_plan_cli_command', { args: [svc.toLowerCase(), 'ListSomething'] });
    const loOk = lo && (lo.ok === true || lo.count !== undefined || (Array.isArray(lo.operations)));
    const plDecision = (pl && pl.classification && pl.classification.decision) || (pl && pl.decision) || '?';
    // plan 只读命令应 allow 或 read_only（规划不执行）
    const plOk = plDecision === 'allow' || plDecision === 'read_only' || plDecision === 'deny'; // deny 也说明有路由(识别出写/读)
    const routed = loOk || Object.keys(lo||{}).length > 0 || (Array.isArray(lo.operations));
    console.log(`EXP-C4 ${svc.padEnd(14)} list_ok=${loOk} list_keys=${Object.keys(lo||{}).join(',')} plan_decision=${plDecision}`);
  }

  console.log('\n===== D10-3 / EXP-E 中文意图路由 =====');
  const INTENTS = [
    ['EXP-E01','帮我查一下我账号在华北北京四有哪些云主机'],
    ['EXP-E02','创建一台 2C4G 的 Ubuntu 云服务器'],
    ['EXP-E03','把本地 dist 目录部署成一个公网静态网站'],
    ['EXP-E04','给这台服务器绑定一个弹性公网IP'],
    ['EXP-E05','看一下我的云数据库MySQL实例的状态'],
    ['EXP-E06','创建一个 Redis 缓存实例用于会话存储'],
    ['EXP-E07','给生产环境的服务器配置一个每日备份策略'],
    ['EXP-E08','我的ECS启动失败了, 帮我分析原因'],
    ['EXP-E09','开设一个 Kubernetes 集群用于微服务部署'],
    ['EXP-E10','部署一个函数处理图片自动压缩'],
    ['EXP-E11','查一下我账号这个月的费用情况'],
    ['EXP-E12','把应用日志指标推送到云监控告警'],
    ['EXP-E13','申请HTTPS证书并配置到我的域名'],
    ['EXP-E14','我账号下的用户都有哪些权限, 帮我审计一下'],
    ['EXP-E15','帮我领一下华为云的代金券'],
  ];
  for (const [cid, intent] of INTENTS) {
    const r = await rawText('huaweicloud_service_catalog', { intent });
    const recs = (r && r.recommendedServices) || (r && r.recommendedSkills) || [];
    console.log(`${cid} "${intent}" -> services=${JSON.stringify((r&&r.recommendedServices)||[])} skills=${JSON.stringify((r&&r.recommendedSkills)||[]).slice(0,80)}`);
  }

  child.stdin.end(); setTimeout(() => process.exit(0), 300);
}, 4000);