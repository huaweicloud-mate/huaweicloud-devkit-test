import { mcpTool, writeEvidence, VC_QUOTE, PKG, HOME } from './lib.mjs';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const svcs = [
  ['EXP-C4-01', 'ECS', 'ListServersDetails'], ['EXP-C4-02', 'VPC', 'ListVpcs'], ['EXP-C4-03', 'OBS', 'ListBuckets'],
  ['EXP-C4-04', 'RDS', 'ListInstances'], ['EXP-C4-05', 'GaussDB', 'ListInstances'], ['EXP-C4-06', 'CCE', 'ListClusters'],
  ['EXP-C4-07', 'FunctionGraph', 'ListFunctions'], ['EXP-C4-08', 'IAM', 'ListUsers'], ['EXP-C4-09', 'CTS', 'ListTraces'],
  ['EXP-C4-10', 'CES', 'ListMetrics'], ['EXP-C4-11', 'DDS', 'ListInstances'], ['EXP-C4-12', 'DCS', 'ListInstances'],
  ['EXP-C4-13', 'SMN', 'ListTopics'], ['EXP-C4-14', 'DMS', 'ListInstances'], ['EXP-C4-15', 'WAF', 'ListPolicies'],
  ['EXP-C4-16', 'CDN', 'ListDomains'], ['EXP-C4-17', 'ModelArts', 'ListNotebooks'], ['EXP-C4-18', 'DEW', 'ListKeys'],
  ['EXP-C4-19', 'CBR', 'ListBackups'], ['EXP-C4-20', 'EVS', 'ListVolumes'], ['EXP-C4-21', 'EIP', 'ListPublicips'],
  ['EXP-C4-22', 'ELB', 'ListLoadBalancers'],
];

for (const [id, svc, op] of svcs) {
  const r = await (async () => {
    try {
      const lo = await mcpTool('huaweicloud_list_operations', { service: svc }, 60000);
      const pl = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: [svc, op], allowWrites: false }, 60000);
      const cls = (pl.parsed && pl.parsed.classification) || {};
      const ok = lo.ok && (lo.text || '').length > 50 && cls.risk === 'read_only' && cls.decision === 'allow';
      return { status: ok ? 'PASS' : 'FAIL', why: svc + '.' + op + ' list_operations=' + lo.ok + '(' + (lo.text || '').length + ') plan risk=' + cls.risk + ' decision=' + cls.decision, result: { service: svc, op, listLen: (lo.text || '').length, classification: cls } };
    } catch (e) { return { status: 'FAIL', why: 'probe exception: ' + e.message, result: {} }; }
  })();
  writeEvidence(id, r);
  const probe = "import { mcpTool, VC_QUOTE } from '../../_runner/lib.mjs';\nconst lo = await mcpTool('huaweicloud_list_operations', { service: '" + svc + "' }, 60000);\nconst pl = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['" + svc + "','" + op + "'], allowWrites: false }, 60000);\nconsole.log(JSON.stringify({ listOk: lo.ok, listLen: (lo.text||'').length, classification: pl.parsed && pl.parsed.classification }, null, 2));\n";
  const { writeFileSync, mkdirSync } = await import('node:fs');
  mkdirSync(join('C:/Users/Administrator/devkit-test/testbot4-codearts1/huaweicloud-devkit-test/results/CodeArtsAgent/2026-11-23-119.8.181.45/Windows/evidence', id), { recursive: true });
  writeFileSync(join('C:/Users/Administrator/devkit-test/testbot4-codearts1/huaweicloud-devkit-test/results/CodeArtsAgent/2026-11-23-119.8.181.45/Windows/evidence', id, 'probe.mjs'), probe, 'utf8');
  console.log(id.padEnd(11), r.status.padEnd(6), '|', String(r.why).slice(0, 160));
}

for (const [id, kind] of [['EXP-D5-3-1', 'manifest'], ['EXP-D5-3-3', 'tools']]) {
  let r;
  if (kind === 'manifest') {
    const root = HOME + '/.workbuddy/huaweicloud-plugins';
    const pkg = existsSync(root + '/package.json') ? JSON.parse(readFileSync(root + '/package.json', 'utf8')) : null;
    const ok = !!pkg && existsSync(root + '/hooks/hooks.json') && existsSync(root + '/rules/huawei-agent-rules.mdc');
    r = { status: ok ? 'PASS' : 'FAIL', why: 'CodeArtsAgent 客户端插件清单发现加载：manifest=' + (!!pkg) + ' version=' + (pkg && pkg.version), result: { pkg } };
  } else {
    const { mcpSession } = await import('./lib.mjs');
    const s = await mcpSession([{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } }, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }], 60000);
    const tools = ((s.responses.find((x) => x.id === 2) || {}).result || {}).tools || [];
    const schemaOk = tools.every((t) => t.name && t.inputSchema && t.inputSchema.type === 'object');
    const ok = tools.length === 49 && schemaOk;
    r = { status: ok ? 'PASS' : 'FAIL', why: 'CodeArtsAgent tools/list 枚举 ' + tools.length + ' 工具，schema完整=' + schemaOk, result: { count: tools.length, schemaOk } };
  }
  writeEvidence(id, r);
  console.log(id.padEnd(12), r.status, '|', r.why);
}

const evalCsv = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/huaweicloud-devkit-test/eval/results/eval-run-20261122211938.csv';
const lines = readFileSync(evalCsv, 'utf8').trim().split('\n').slice(1);
const parsed = lines.map((l) => { const m = l.match(/^"([^"]+)","([^"]*)","([^"]*)","([^"]*)",(\w+)/); return m ? { id: m[1], prompt: m[2], expected: m[3], actual: m[4], verdict: m[5] } : null; }).filter(Boolean);
const hits = parsed.filter((p) => p.verdict === 'HIT').length;
const misses = parsed.filter((p) => p.verdict === 'MISS').length;
const rate = hits + misses ? +(hits * 100 / (hits + misses)).toFixed(1) : 0;
writeEvidence('D10-3', { status: rate >= 90 ? 'PASS' : 'FAIL', why: 'serviceCatalog 路由准确率=' + rate + '%（HIT=' + hits + ' MISS=' + misses + ' 分母=' + (hits + misses) + '，阈值90%）', result: { rate, hits, misses, rows: parsed } });
const { writeFileSync: wf, mkdirSync: mk } = await import('node:fs');
mk('C:/Users/Administrator/devkit-test/testbot4-codearts1/huaweicloud-devkit-test/results/CodeArtsAgent/2026-11-23-119.8.181.45/Windows/evidence/D10-3', { recursive: true });
wf('C:/Users/Administrator/devkit-test/testbot4-codearts1/huaweicloud-devkit-test/results/CodeArtsAgent/2026-11-23-119.8.181.45/Windows/evidence/D10-3/probe.mjs', "// D10-3 路由评测：node eval/harness/run-eval.mjs <mcp-server.mjs>\n// 输出 eval/results/eval-run-*.csv，本目录 stdout.log 为其汇总\n", 'utf8');
console.log('D10-3', rate, '%');
