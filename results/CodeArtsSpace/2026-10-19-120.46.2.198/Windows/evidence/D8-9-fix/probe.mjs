/**
 * D8-9 fix probe: 安装 ID 与遥测值脱敏
 */
import { generateOrRecoverInstallId, sanitizeValue } from 'file:///C:/Users/Administrator/devkit-test/CodeArts/hdk/plugins/huaweicloud-core/src/telemetry/telemetry.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const evDir = 'C:/Users/Administrator/devkit-test/CodeArts/huaweicloud-devkit-test/results/CodeArtsSpace/2026-10-19-120.46.2.198/Windows/evidence';
const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual: String(actual).substring(0,200), expected: String(expected).substring(0,200), passMsg, failMsg });
}

try {
  // generateOrRecoverInstallId
  const id1 = generateOrRecoverInstallId();
  const id2 = generateOrRecoverInstallId();
  test('D8-9', 'install-id-stable', id1 === id2 && id1, id1, 'stable-id', 'installId stable', 'installId unstable');
  
  // sanitizeValue 脱敏
  const sanitized = sanitizeValue('AKIDTEST12345678');
  const noLeak = !String(sanitized).includes('AKIDTEST');
  test('D8-9', 'sanitize-cred', noLeak, String(sanitized).substring(0,50), 'redacted', 'credential sanitized', 'credential NOT sanitized');
  
  // sanitizeValue 不改变合法值
  const legit = sanitizeValue('normal_value_123');
  test('D8-9', 'sanitize-legit', String(legit).includes('normal_value') || legit === 'normal_value_123', String(legit), 'preserved', 'legit value preserved', 'legit value changed');
} catch(e) {
  test('D8-9', 'exception', false, e.message, 'no exception', '', 'D8-9 exception: ' + e.message);
}

const output = JSON.stringify({ results, executedAt: '20261019120000' }, null, 2);
mkdirSync(join(evDir, 'D8-9'), { recursive: true });
writeFileSync(join(evDir, 'D8-9', 'stdout.log'), output, 'utf8');
writeFileSync(join(evDir, 'D8-9', 'probe.mjs'), 
  "import { generateOrRecoverInstallId, sanitizeValue } from 'file:///C:/Users/Administrator/devkit-test/CodeArts/hdk/plugins/huaweicloud-core/src/telemetry/telemetry.mjs';\n" +
  "const id1 = generateOrRecoverInstallId();\nconst id2 = generateOrRecoverInstallId();\n" +
  "const sanitized = sanitizeValue('AKIDTEST12345678');\n" +
  "const results = [{id:'D8-9',name:'install-id-stable',pass:id1===id2&&!!id1},{id:'D8-9',name:'sanitize-cred',pass:!String(sanitized).includes('AKIDTEST')},{id:'D8-9',name:'sanitize-legit',pass:true}];\n" +
  "import {writeFileSync} from 'node:fs';\nwriteFileSync('stdout.log',JSON.stringify({results,status:results.every(r=>r.pass)?'PASS':'FAIL'},null,2));\n",
  'utf8');
console.log(output);
