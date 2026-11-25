// Real probe for D4-10: 规则库新增回归
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const rr = await import('file:///' + DIST + '/risk-rule-engine.mjs');
  const raw = rr.loadRiskRules();
  const rules = Array.isArray(raw) ? raw : (raw && raw.rules) || [];
  const read = rr.evaluateCommandRisk('hcloud ECS ListServersDetails');
  const del = rr.evaluateCommandRisk('hcloud ECS DeleteServers --server_id=x');
  const cred = rr.evaluateCommandRisk('type C://Users//Administrator//.hcloud//config.json');
  const ok = rules.length >= 16 && read.decision === 'allow' && del.decision !== 'allow' && cred.decision === 'deny';
  return { status: ok ? 'PASS' : 'FAIL', why: '规则=' + rules.length + ' 只读=' + read.decision + ' 删除=' + del.decision + ' 凭证读取=' + cred.decision, result: { count: rules.length, read: read.decision, del: del.decision, cred: cred.decision } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
