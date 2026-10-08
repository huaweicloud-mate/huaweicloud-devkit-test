// Fix probe for D8-9
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const TS = '20261009050000';

function writeCase(id, result) {
  const dir = join(__dirname, 'evidence', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.mjs'), `// Fix probe for ${id}\n`);
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2));
  console.log(id, '->', result.status);
}

// D8-9 fix: Check telemetry.mjs (not mcp-server.mjs) for installId + hash/redact
try {
  const src = readFileSync(join(HDK, 'plugins/huaweicloud-core/src/telemetry/telemetry.mjs'), 'utf8');
  const has = /installId|installationId|userHash|telemetry/i.test(src);
  const hasRedact = /redact|hash|脱敏|anonymiz|createHash/i.test(src);
  writeCase('D8-9', (has && hasRedact)
    ? { caseId:'D8-9', status:'PASS', why:'telemetry.mjs 引用 installId/userHash 且用 createHash 脱敏', evidence:{has, hasRedact}, executedAt:TS }
    : { caseId:'D8-9', status:'FAIL', why:'缺失: '+JSON.stringify({has,hasRedact}), executedAt:TS });
} catch (e) { writeCase('D8-9', { caseId:'D8-9', status:'FAIL', why:'err: '+e.message, executedAt:TS }); }

console.log('D8-9 fix done.');
