// Real probe for D10-4: ????-?????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
    const rr = await import('file:///' + DIST + '/risk-rule-engine.mjs');
    const raw = rr.loadRiskRules();
    const rules = Array.isArray(raw) ? raw : (raw && raw.rules) || [];
    const deny = rules.filter((r) => r.severity === 'deny').length;
    const warn = rules.filter((r) => r.severity === 'warn').length;
    const del = rr.evaluateCommandRisk('hcloud ECS DeleteServers --server_id=x');
    const read = rr.evaluateCommandRisk('hcloud ECS ListServersDetails');
    const cat = rr.evaluateCommandRisk('type C://Users//Administrator//.hcloud//config.json');
    const ok = deny > 0 && warn > 0 && del.decision === 'warn' && read.decision === 'allow' && cat.decision === 'deny';
    const spec = ok && rules.length === 16 && deny === 9 && warn === 7;
    return {
      status: spec ? 'PASS' : (ok ? 'SPEC-MISMATCH' : 'FAIL'),
      why: '???=' + rules.length + ' ??deny=' + deny + ' warn=' + warn + '????? 16=9+7??delete=' + del.decision + ' read=' + read.decision + ' catCredential=' + cat.decision,
      result: { ruleCount: rules.length, deny, warn, del: del.decision, read: read.decision, credentialRead: cat.decision, version: raw && raw.version },
    };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));
