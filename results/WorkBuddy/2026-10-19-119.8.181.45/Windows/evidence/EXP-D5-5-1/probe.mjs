// Real probe for EXP-D5-5-1
// Real execution: 20261019051152
import { writeFileSync } from 'node:fs';
import { existsSync, readFileSync } from 'node:fs';
const manifestPath = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/openclaw.plugin.json';
let exists = false, manifest = null;
try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')); exists = true; } catch {}
const status = (exists && manifest && manifest.name) ? 'PASS' : 'FAIL';
const output = { caseId: 'EXP-D5-5-1', status, why: 'manifest exists=' + exists, executedAt: '20261019051152', result: { exists, name: manifest?.name } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
