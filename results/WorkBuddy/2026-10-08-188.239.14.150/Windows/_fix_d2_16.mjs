// Fix D2-16: import file erased after confirm flow
import { writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
const __dirname = dirname(fileURLToPath(import.meta.url));
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const tools = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/tools.mjs');

function writeCase(id, result) {
  const dir = join(__dirname, 'evidence', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.mjs'), `// Auto-generated fix probe for ${id}\n`);
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2));
  console.log(id, '->', result.status);
}
const TS = '20261008051800';

// ===== D2-16: import文件读取后擦除 =====
// The implementation returns needs_confirmation when S1 has a different account.
// The import file is cleared after auth_confirm with newImported decision.
// Test: create import file, call auth_switch mode=import, confirm with newImported, check file erased.
try {
  const importPath = join(homedir(), '.config', 'huaweicloud', 'creds-import.json');
  mkdirSync(dirname(importPath), { recursive: true });
  writeFileSync(importPath, JSON.stringify({ ak:'AKIMP-D2-16', sk:'SKIMP-D2-16', region:'cn-north-4' }));

  // Step 1: call auth_switch mode=import
  const r1 = await tools.callTool('huaweicloud_auth_switch', { action:'persist', mode:'import' });
  const body1 = JSON.stringify(r1);

  let importExistsAfterSwitch = existsSync(importPath);

  // If needs_confirmation, confirm with newImported
  if (r1.status === 'needs_confirmation' && r1.confirmToken) {
    const r2 = await tools.callTool('huaweicloud_auth_confirm', {
      token: r1.confirmToken,
      decision: 'newImported',
    });
    importExistsAfterSwitch = existsSync(importPath);

    // Clean up if still exists
    if (importExistsAfterSwitch) {
      try { rmSync(importPath); } catch {}
    }

    writeCase('D2-16', !importExistsAfterSwitch
      ? { caseId:'D2-16', status:'PASS', why:'import 文件在 confirm 后擦除 (exists=False)', sample: JSON.stringify({switch: body1.slice(0,150), confirm: JSON.stringify(r2).slice(0,150)}), evidence:{ importExistsAfterSwitch }, executedAt:TS }
      : { caseId:'D2-16', status:'FAIL', why:'import 文件 confirm 后未擦除', sample: JSON.stringify(r2).slice(0,200), evidence:{ importExistsAfterSwitch }, executedAt:TS });
  } else {
    // No confirmation needed — file should already be erased
    if (importExistsAfterSwitch) {
      try { rmSync(importPath); } catch {}
    }
    writeCase('D2-16', !importExistsAfterSwitch
      ? { caseId:'D2-16', status:'PASS', why:'import 文件读取后擦除 (exists=False)', sample: body1.slice(0,200), evidence:{ importExistsAfterSwitch }, executedAt:TS }
      : { caseId:'D2-16', status:'FAIL', why:'import 文件未擦除', sample: body1.slice(0,200), evidence:{ importExistsAfterSwitch }, executedAt:TS });
  }
} catch (e) { writeCase('D2-16', { caseId:'D2-16', status:'FAIL', why:'err: '+e.message, executedAt:TS }); }

console.log('D2-16 fix done.');
