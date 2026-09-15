// D3-C4 服务矩阵 探针: 22 服务 list_operations + plan 只读命令冒烟
import { join } from 'node:path';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';

const SRC = join(homedir(), 'devkit-test', 'Hermes', 'hdk', 'plugins', 'huaweicloud-core', 'src');
const tools = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
const { callTool } = tools;

// 22 服务 (KooCLI 服务名)。OBS 走 obsutil 命令族, plan 用 ['obs','ls']。
const SERVICES = [
  'ECS','VPC','OBS','RDS','GaussDB','CCE','FunctionGraph','IAM','CTS','CES',
  'DDS','DCS','SMN','DMS','WAF','CDN','ModelArts','DEW','CBR','EVS','EIP','ELB',
];

const EVID = process.env.EVID_DIR || join(homedir(), 'devkit-test', 'Hermes', 'huaweicloud-devkit-test', 'results', 'Hermes', '2026-09-16-113.44.197.147', 'Linux', 'evidence');

function pickReadOp(stdout) {
  // 从 "Available Operations" 中选一个 List/Show/Describe/Get/Query 读操作
  const re = /^\s*(List[A-Za-z0-9]+|Show[A-Za-z0-9]+|Describe[A-Za-z0-9]+|Get[A-Za-z0-9]+|Query[A-Za-z0-9]+)\s*$/gm;
  const m = (stdout || '').match(re);
  if (m && m.length) return m[0].trim();
  return null;
}

const summary = [];
for (let i = 0; i < SERVICES.length; i++) {
  const svc = SERVICES[i];
  const idx = String(i + 1).padStart(2, '0');
  const lines = [];
  lines.push(`=== EXP-C4-${idx} (${svc}) ===`);
  let lr;
  try {
    lr = await callTool('huaweicloud_list_operations', { service: svc, timeoutMs: 40000 });
  } catch (e) {
    lr = { error: String(e.message) };
  }
  const stdout = String(lr?.result?.stdout || '');
  const ok = Boolean(lr?.result?.ok);
  const unsupported = /Unsupported service|not supported|not found/i.test(stdout + ' ' + String(lr?.result?.stderr || ''));
  lines.push(`list_operations: ok=${ok} unsupported=${unsupported}`);
  lines.push(`  command=${lr?.command || ('hcloud ' + svc + ' --help')}`);

  // plan 只读命令
  let readOp = svc === 'OBS' ? null : pickReadOp(stdout);
  let planArgs, plan;
  if (svc === 'OBS') {
    planArgs = ['obs', 'ls'];
  } else if (readOp) {
    planArgs = [svc, readOp];
  } else {
    planArgs = [svc, 'List' + String(svc === 'GaussDB' ? 'DBInstances' : 'Instances')];
  }
  try {
    plan = await callTool('huaweicloud_plan_cli_command', { args: planArgs });
  } catch (e) {
    plan = { error: String(e.message) };
  }
  const cls = plan?.classification || {};
  const decision = cls.decision || 'unknown';
  const safeToRun = plan?.safeToRun === true;
  lines.push(`plan [${planArgs.join(' ')}]: decision=${decision} safeToRun=${safeToRun} risk=${cls.risk || 'n/a'}`);
  lines.push(`  approvalToken 签发: ${plan?.approvalToken ? 'YES' : 'NO'}`);

  const pass = ok && !unsupported && decision === 'allow' && safeToRun === true;
  lines.push(`RESULT: ${pass ? 'PASS' : 'FAIL'} (list_operations 可路由 + plan 只读=allow)`);

  summary.push({ idx, svc, ok, unsupported, readOp: readOp || planArgs[1], decision, safeToRun, pass });

  // 写 per-service evidence
  const dir = join(EVID, `EXP-C4-${idx}`);
  mkdirSync(dir, { recursive: true });
  const opCount = (String(stdout).match(/^\s*[A-Za-z][A-Za-z0-9]+\s*$/gm) || []).length;
  writeFileSync(join(dir, 'stdout.txt'), lines.join('\n') + `\n  (KooCLI 操作数估算: ${opCount})\n`);
  writeFileSync(join(dir, 'probe.mjs'), `// EXP-C4-${idx} ${svc} list_operations + plan 只读命令 (D3-C4 服务矩阵)\n// status: ${pass ? 'PASS' : 'FAIL'}\n`);
}

// 汇总写入 D3-C4
mkdirSync(join(EVID, 'D3-C4'), { recursive: true });
const sumLines = ['=== D3-C4 服务矩阵汇总 ==='];
let allPass = true;
for (const s of summary) {
  sumLines.push(`EXP-C4-${s.idx} ${s.svc.padEnd(12)} ok=${s.ok} unsupported=${s.unsupported} readOp=${(s.readOp||'').padEnd(22)} plan=${s.decision} safeToRun=${s.safeToRun} => ${s.pass ? 'PASS' : 'FAIL'}`);
  if (!s.pass) allPass = false;
}
sumLines.push('');
sumLines.push(`总: ${summary.filter(s => s.pass).length}/${summary.length} 服务 list+plan 只读冒烟 PASS`);
sumLines.push(`整体: ${allPass ? 'PASS' : 'PARTIAL'}`);
writeFileSync(join(EVID, 'D3-C4', 'stdout.txt'), sumLines.join('\n'));
writeFileSync(join(EVID, 'D3-C4', 'probe.mjs'), '// D3-C4 服务矩阵 (调用 callTool huaweicloud_list_operations + huaweicloud_plan_cli_command)\n');

console.log(sumLines.join('\n'));
console.log('\n[EVID written to]', EVID);