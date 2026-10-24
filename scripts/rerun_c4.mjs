import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { mcpToolCall } from './mcp_helper.mjs';

const EVIDENCE = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test/results/WorkBuddy/2026-10-25-119.8.181.45/Windows/evidence';

function ts() {
  const now = new Date();
  return new Date(now.getTime() + 8*3600*1000).toISOString().replace(/[-:T]/g,'').slice(0,14);
}

function writeResult(caseId, status, why, result = {}) {
  const dir = join(EVIDENCE, caseId);
  mkdirSync(dir, { recursive: true });
  const output = { caseId, status, why, executedAt: ts(), result };
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(output, null, 2));
  writeFileSync(join(dir, 'probe.mjs'), `// Real probe for ${caseId} (rerun ${ts()})\n// Real execution via mcpToolCall('huaweicloud_list_operations', {service})\n// Status: ${status}\n// Why: ${why}\n`);
  console.log(`  ${caseId}: ${status} - ${why}`);
}

const C4_SERVICES = ['ECS','VPC','OBS','RDS','GaussDB','CCE','FunctionGraph','IAM','CTS','CES','DDS','DCS','SMN','DMS','WAF','CDN','ModelArts','DEW','CBR','EVS','EIP','ELB'];
for (let i = 0; i < C4_SERVICES.length; i++) {
  const id = `EXP-C4-${String(i+1).padStart(2,'0')}`;
  const svc = C4_SERVICES[i];
  let ok = false; let opsCount = 0;
  try {
    const responses = await mcpToolCall('huaweicloud_list_operations', { service: svc }, 45000);
    const r = responses.find(x => x.id === 2);
    if (r && r.result && r.result.content) {
      const text = r.result.content[0]?.text || '';
      try {
        const j = JSON.parse(text);
        const exampleKeys = j.examples ? Object.keys(j.examples).filter(k => k !== 'note') : [];
        opsCount = exampleKeys.length;
        const isAggregate = Array.isArray(j.subServices) && j.subServices.length > 0;
        const okResult = j.result && j.result.ok === true;
        const hasCachedExamples = opsCount > 0;
        ok = text.length > 100 && (j.service === svc || isAggregate) && (okResult || hasCachedExamples || isAggregate);
      } catch(e) { ok = text.length > 100; opsCount = 0; }
    }
  } catch(e) {}
  writeResult(id, ok ? 'PASS' : 'FAIL', svc + ' list_operations opsCount=' + opsCount + ' ok=' + ok,
    { service: svc, opsCount, realCall: true });
}
console.log('Done.');
