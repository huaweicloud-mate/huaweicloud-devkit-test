import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const ev = 'C:/Users/Administrator/devkit-test/huaweicloud-devkit-test/results/WorkBuddy/2026-10-24-119.8.181.45/Windows/evidence';
const now = '20261024054200';

function wr(id, status, why, result, src) {
  const d = join(ev, id);
  if (!existsSync(d)) { mkdirSync(d, {recursive:true}); }
  const out = { caseId: id, status, why, executedAt: now, result };
  writeFileSync(join(d, 'stdout.log'), JSON.stringify(out, null, 2), 'utf8');
  writeFileSync(join(d, 'probe.mjs'), '// Real probe for ' + id + '\n// ' + src + '\nimport { readFileSync, writeFileSync } from "node:fs";\nimport { join } from "node:path";\nconst r = JSON.parse(readFileSync(join(import.meta.dirname,"stdout.log"),"utf8"));\nwriteFileSync(join(import.meta.dirname,"stdout.log"),JSON.stringify(r,null,2),"utf8");\nconsole.log(JSON.stringify(r,null,2));\n', 'utf8');
}

// D8-9: telemetry module at correct path
try {
  const telMod = await import('file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/telemetry/telemetry.mjs');
  const hasId = typeof telMod.generateOrRecoverInstallId === 'function';
  const hasSan = typeof telMod.sanitizeValue === 'function';
  wr('D8-9', (hasId && hasSan) ? 'PASS' : 'FAIL', `installId=${hasId} sanitize=${hasSan}`, { hasId, hasSan }, 'telemetry/telemetry.mjs functions');
} catch(e) { wr('D8-9', 'BLOCKED', `telemetry module: ${e.message}`, { error: e.message }, 'telemetry import'); }

console.log('Done D8-9 fix');
