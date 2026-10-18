// Real probe for D4-23
// Real execution: 20261019050941
import { readFileSync } from 'node:fs';
const path = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/rules/huawei-agent-rules.mdc';
let content = '';
try { content = readFileSync(path, 'utf8'); } catch {}
const exists = content.length > 0;
const hasMust = /MUST|MUST NOT/.test(content);
const hasCsms = /csms|kms|direct/i.test(content);
const status = (exists && hasMust && hasCsms) ? 'PASS' : 'FAIL';
const output = { caseId: 'D4-23', status, why: 'path=' + path + ' exists=' + exists, executedAt: '20261019050941', result: { exists, hasMust, hasCsms, contentLen: content.length } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
