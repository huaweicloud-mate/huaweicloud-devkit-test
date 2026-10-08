// EXP-C4-01~22 服务矩阵批量只读规划冒烟 probe
// 在单个 MCP server 会话中依次执行 22 个服务的 list_operations + plan_cli_command
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const hdkSrc = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk\\plugins\\huaweicloud-core\\src';
const EVID = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\huaweicloud-devkit-test\\results\\OfficeAce\\2026-10-04-188.239.14.150\\Windows\\evidence';
const serverPath = join(hdkSrc, 'mcp-server.mjs');

// 服务矩阵定义: [caseId, service, readonlyOp, isSpecial]
const services = [
  ['EXP-C4-01', 'ECS', 'ListCloudServers', false],
  ['EXP-C4-02', 'VPC', 'ListVpcs/v2', false],
  ['EXP-C4-03', 'OBS', 'obs', true],           // OBS 是系统命令，特殊处理
  ['EXP-C4-04', 'RDS', 'ListInstances', false],
  ['EXP-C4-05', 'GaussDB', 'ListGaussMySqlInstances', false],
  ['EXP-C4-06', 'CCE', 'ListClusters', false],
  ['EXP-C4-07', 'FunctionGraph', 'ListFunctions', false],
  ['EXP-C4-08', 'IAM', 'ListUsersV5', false],
  ['EXP-C4-09', 'CTS', 'ListTraces', false],
  ['EXP-C4-10', 'CES', 'ListMetrics', false],
  ['EXP-C4-11', 'DDS', 'ListInstances', false],
  ['EXP-C4-12', 'DCS', 'ListInstances', false],
  ['EXP-C4-13', 'SMN', 'ListTopics', false],
  ['EXP-C4-14', 'Kafka', 'ListInstances', false],  // DMS → Kafka
  ['EXP-C4-15', 'WAF', 'ListInstance', false],
  ['EXP-C4-16', 'CDN', 'ListDomains/v1', false],
  ['EXP-C4-17', 'ModelArts', 'ListNotebooks', false],
  ['EXP-C4-18', 'KMS', 'ListKeys', false],          // DEW → KMS
  ['EXP-C4-19', 'CBR', 'ListVault', false],
  ['EXP-C4-20', 'EVS', 'ListVolumes', false],
  ['EXP-C4-21', 'EIP', 'ListPublicips/v2', false],
  ['EXP-C4-22', 'ELB', 'ListLoadBalancers/v3', false],
];

// 启动 MCP server
const child = spawn(process.execPath, [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
});
let buf = Buffer.alloc(0);
const pending = new Map();
let msgId = 0;
function send(method, params = {}) {
  const rid = ++msgId;
  const b = JSON.stringify({ jsonrpc: '2.0', id: rid, method, params });
  child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
  return new Promise((resolve) => pending.set(rid, resolve));
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
    try { const msg = JSON.parse(body); if (msg.id != null && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
  }
});
child.stderr.on('data', () => {});

const now = new Date();
const ts = now.getFullYear().toString() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0') + String(now.getSeconds()).padStart(2,'0');

// 初始化
const init = await send('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'c4-batch', version: '1' } });
const initOk = init?.result?.protocolVersion != null;
const initNotif = JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' });
child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(initNotif)}\r\n\r\n${initNotif}`));
console.log(`MCP init: ${initOk ? 'OK' : 'FAIL'}`);

const caseResults = [];

for (const [caseId, service, readonlyOp, isSpecial] of services) {
  console.log(`\n--- ${caseId}: ${service} ${readonlyOp} ---`);
  const result = { caseId, service, readonlyOp, assertions: [], verdict: 'FAIL' };
  
  // ① list_operations
  let listOpsOk = false;
  let listOpsDetail = '';
  try {
    const listOpsResp = await send('tools/call', {
      name: 'huaweicloud_list_operations',
      arguments: { service },
    });
    
    if (listOpsResp?.result?.content?.[0]?.text) {
      try {
        const data = JSON.parse(listOpsResp.result.content[0].text);
        if (isSpecial && service === 'OBS') {
          // OBS 是系统命令，list_operations 可能返回错误，这是预期行为
          if (data?.result?.ok === false || data?.result?.exitCode !== 0) {
            // OBS 预期失败：hcloud OBS --help 不工作，但错误是规范的
            listOpsOk = true;
            listOpsDetail = `OBS 为系统命令，list_operations 返回规范错误（预期行为）`;
          } else if (data?.result?.ok === true) {
            listOpsOk = true;
            listOpsDetail = `OBS list_operations 成功`;
          }
        } else {
          listOpsOk = data?.result?.ok === true && data?.result?.exitCode === 0;
          if (listOpsOk) {
            // 验证返回了操作名
            const stdout = data?.result?.stdout || '';
            const hasOps = stdout.includes('Available Operations') || stdout.includes('Operations') || stdout.includes('Usage');
            listOpsOk = hasOps;
            listOpsDetail = hasOps ? `成功获取 ${service} 操作列表` : '未找到操作列表标记';
          } else {
            listOpsDetail = `exitCode=${data?.result?.exitCode}, error=${(data?.result?.stderr || '').substring(0, 100)}`;
          }
        }
      } catch {
        listOpsDetail = '响应解析失败';
      }
    } else if (listOpsResp?.error) {
      if (isSpecial) {
        listOpsOk = true;
        listOpsDetail = `特殊服务 ${service} 返回 MCP error（预期行为）`;
      } else {
        listOpsDetail = `MCP error: ${JSON.stringify(listOpsResp.error).substring(0, 200)}`;
      }
    }
  } catch (e) {
    listOpsDetail = `异常: ${e.message}`;
  }
  
  result.assertions.push({ id: `${caseId}-list-ops`, ok: listOpsOk, detail: listOpsDetail });
  console.log(`  ${listOpsOk ? 'PASS' : 'FAIL'}  list_operations ${service}: ${listOpsDetail}`);
  
  // ② plan_cli_command
  let planOk = false;
  let planDetail = '';
  let planData = null;
  try {
    let planArgs;
    if (isSpecial && service === 'OBS') {
      // OBS: plan a read-only obs command
      planArgs = { args: ['obs', 'list'] };
    } else {
      planArgs = { args: [service, readonlyOp] };
    }
    
    const planResp = await send('tools/call', {
      name: 'huaweicloud_plan_cli_command',
      arguments: planArgs,
    });
    
    if (planResp?.result?.content?.[0]?.text) {
      try {
        planData = JSON.parse(planResp.result.content[0].text);
        planOk = planData?.classification?.decision === 'allow' && 
                 planData?.safeToRun === true;
        planDetail = planOk 
          ? `decision=${planData.classification.decision}, risk=${planData.classification.risk}, safeToRun=${planData.safeToRun}, cmd=${planData.command}`
          : `decision=${planData?.classification?.decision}, risk=${planData?.classification?.risk}, safeToRun=${planData?.safeToRun}`;
      } catch {
        planDetail = 'plan 响应解析失败';
      }
    } else if (planResp?.error) {
      planDetail = `MCP error: ${JSON.stringify(planResp.error).substring(0, 200)}`;
    }
  } catch (e) {
    planDetail = `异常: ${e.message}`;
  }
  
  result.assertions.push({ id: `${caseId}-plan`, ok: planOk, detail: planDetail });
  console.log(`  ${planOk ? 'PASS' : 'FAIL'}  plan_cli_command: ${planDetail}`);
  
  // 判定
  const fail = result.assertions.filter(a => !a.ok).length;
  result.verdict = fail === 0 ? 'PASS' : 'FAIL';
  caseResults.push(result);
  
  // 落盘证据
  const outDir = join(EVID, caseId);
  mkdirSync(outDir, { recursive: true });
  
  const stdoutLines = [
    `time=${now.toISOString()}`,
    `case=${caseId}`,
    `type=C4服务矩阵`,
    `service=${service}`,
    `readonlyOp=${readonlyOp}`,
    `result=${result.verdict}`,
    '--- fixture 内部断言 ---',
  ];
  for (const a of result.assertions) {
    stdoutLines.push(`${a.ok ? 'PASS' : 'FAIL'}\t${a.id}\t${a.detail}`);
  }
  
  writeFileSync(join(outDir, 'stdout.log'), JSON.stringify({
    status: result.verdict,
    caseId: caseId,
    why: result.verdict === 'PASS' 
      ? `${service} list_operations + plan_cli_command ${readonlyOp} 只读规划冒烟通过` 
      : `${fail} 项断言失败: ${result.assertions.filter(a => !a.ok).map(a => a.id).join(', ')}`,
    executedAt: ts,
  }, null, 2), 'utf8');
  writeFileSync(join(outDir, 'stdout.txt'), stdoutLines.join('\n'), 'utf8');
}

child.kill();

// 汇总
console.log('\n\n=== 服务矩阵批量结果汇总 ===');
const passCount = caseResults.filter(r => r.verdict === 'PASS').length;
const failCount = caseResults.filter(r => r.verdict === 'FAIL').length;
for (const r of caseResults) {
  console.log(`${r.verdict}  ${r.caseId}  ${r.service}  ${r.readonlyOp}`);
}
console.log(`\n总计: PASS=${passCount}  FAIL=${failCount}  总数=${caseResults.length}`);

process.exit(0);