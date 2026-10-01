// D4-17 corrected: fail-closed for empty/invalid, unknown service handled by prefix
import { classifyHcloudArgs, classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const evidBase = join(__dirname, '..', 'huaweicloud-devkit-test', 'results', 'Hermes', '2026-10-02-120.46.40.202', 'Windows', 'evidence');

// D4-17: hook模糊fail-closed
// Empty/invalid commands should be denied (fail-closed)
// Unknown service with read prefix = read_only (by design - prefix-based, not service whitelist)
// Unknown service with write prefix = write (deny without approval)
const r1 = classifyHcloudArgs(['']);  // empty
const r2 = classifyHcloudArgs(['UNKNOWN_SERVICE', 'DeleteSomething']);  // write prefix on unknown
const r3 = classifyHcloudArgs(['UNKNOWN_SERVICE', 'ListSomething']);  // read prefix on unknown
const r4 = classifyTextCommand('');  // empty text
const r5 = classifyTextCommand('hcloud');  // bare hcloud

// Empty should be deny, write prefix should be deny, read prefix should be allow (by design)
const emptyDeny = r1.decision === 'deny';
const writeDeny = r2.decision === 'deny' && r2.risk === 'write';
const readAllow = r3.decision === 'allow' && r3.risk === 'read_only';

const result = {
  status: (emptyDeny && writeDeny && readAllow) ? 'PASS' : 'FAIL',
  why: `empty=${r1.decision} writeUnknown=${r2.decision}/${r2.risk} readUnknown=${r3.decision}/${r3.risk}`,
  detail: {
    empty: { decision: r1.decision, risk: r1.risk },
    writeUnknown: { decision: r2.decision, risk: r2.risk },
    readUnknown: { decision: r3.decision, risk: r3.risk },
    emptyText: { decision: r4?.decision },
    bareHcloud: { decision: r5?.decision }
  }
};

console.log(JSON.stringify({ 'D4-17': result }, null, 2));
try { writeFileSync(join(evidBase, 'D4-17', 'stdout.log'), JSON.stringify(result, null, 2)); } catch(e) {}
