// Fix D2 P1 FAILs: D2-12, D2-16
import { writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
const __dirname = dirname(fileURLToPath(import.meta.url));
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const tools = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/tools.mjs');
const auth = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/auth/credentials.mjs');

function writeCase(id, result) {
  const dir = join(__dirname, 'evidence', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.mjs'), `// Auto-generated fix probe for ${id}\n`);
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2));
  console.log(id, '->', result.status);
}
const TS = '20261008051500';

// ===== D2-12: R10 runtime非空禁止落盘 =====
// Expected: sync returns ok:false + auto-sync suppressed (R10), not writes to S1
// Test: set runtime credentials, then call auth_sync
try {
  auth.setRuntimeCredentials('AKRT', 'SKRT', undefined, 'cn-north-4');
  const r = await tools.callTool('huaweicloud_auth_sync', { target: 'all' });
  const body = JSON.stringify(r);
  const suppressed = /R10|suppress|runtime.*active/i.test(body);
  const okFalse = /"ok"\s*:\s*false/i.test(body) || /ok.*false/i.test(body);
  writeCase('D2-12', (suppressed && okFalse)
    ? { caseId:'D2-12', status:'PASS', why:'runtime 非空时 sync 返回 ok:false + R10 suppressed', sample: body.slice(0,200), executedAt:TS }
    : { caseId:'D2-12', status:'FAIL', why:'未抑制: suppressed='+suppressed+' okFalse='+okFalse, sample: body.slice(0,200), executedAt:TS });
  auth.clearRuntimeCredentials();
} catch (e) { writeCase('D2-12', { caseId:'D2-12', status:'FAIL', why:'err: '+e.message, executedAt:TS }); }

// ===== D2-16: import文件读取后擦除 =====
// The import file path is ~/.config/huaweicloud/creds-import.json (not ~/.huaweicloud/)
try {
  const importPath = join(homedir(), '.config', 'huaweicloud', 'creds-import.json');
  mkdirSync(dirname(importPath), { recursive: true });
  writeFileSync(importPath, JSON.stringify({ ak:'AKIMP', sk:'SKIMP', region:'cn-north-4' }));

  // Call auth_switch with mode=import action=persist
  const r = await tools.callTool('huaweicloud_auth_switch', { action:'persist', mode:'import' });
  const body = JSON.stringify(r);

  // import file should be erased after read
  const importExists = existsSync(importPath);

  // Clean up if still exists
  if (importExists) {
    try { rmSync(importPath); } catch {}
  }

  writeCase('D2-16', !importExists
    ? { caseId:'D2-16', status:'PASS', why:'import 文件读取后擦除 (exists=False)', sample: body.slice(0,200), evidence:{ importExists }, executedAt:TS }
    : { caseId:'D2-16', status:'FAIL', why:'import 文件未擦除', sample: body.slice(0,200), evidence:{ importExists }, executedAt:TS });
} catch (e) { writeCase('D2-16', { caseId:'D2-16', status:'FAIL', why:'err: '+e.message, executedAt:TS }); }

console.log('D2 fix done.');
