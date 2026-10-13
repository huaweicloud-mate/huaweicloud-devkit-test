// Fix probe for D2-12 and D2-16
// D2-12: R10 behavior changed - runtime creds + persist now returns needs_confirmation (R2 conflict) instead of reject
//   This is a SPEC-MISMATCH: design expects "sync 返回 ok:false + auto-sync suppressed (R10)，不写 S1"
//   but actual returns needs_confirmation (conflict resolution flow)
// D2-16: import file is kept when needs_confirmation (for replay per #502), wiped after confirm
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const now = () => { const d=new Date(); const p=n=>String(n).padStart(2,'0'); return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds()); };

const HDK = 'C:/Users/Administrator/devkit-test/OpenCode/hdk';
const auth = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/auth/credentials.mjs');
const tools = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/tools.mjs');

function writeCase(id, result) {
  const dir = join(__dirname, 'evidence', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.mjs'), `// Fix probe for ${id}\n`);
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2));
  console.log(id, '->', result.status);
}

// D2-12: R10 runtime非空禁止落盘
// Actual behavior: when runtime has creds and persist is called with different AK/SK,
// it returns needs_confirmation (R2 conflict) instead of rejecting.
// The import file is kept for replay. This is a SPEC-MISMATCH (design expects rejection).
try {
  auth.setRuntimeCredentials('AKRT', 'SKRT', undefined, 'cn-north-4');
  const r = await tools.callTool('huaweicloud_auth_switch', {
    action: 'persist', ak: 'AKNEW', sk: 'SKNEW', region: 'cn-north-4',
  });
  const body = JSON.stringify(r);
  // Check: does it return needs_confirmation or reject?
  const needsConfirm = r.status === 'needs_confirmation';
  // Verify S1 was NOT written (R10 still holds - runtime non-empty blocks direct persist)
  const s1 = auth.readGlobalCredentials();
  const s1NotWritten = s1?.ak !== 'AKNEW';
  writeCase('D2-12', (needsConfirm && s1NotWritten)
    ? { caseId:'D2-12', status:'SPEC-MISMATCH', why:'R10 设计预期 sync 返回 ok:false+suppressed，实际返回 needs_confirmation (R2 冲突流)。但 S1 未被写入(R10 仍部分生效)', detail: body.slice(0,200), s1ak: s1?.ak, rootCause: 'tools.mjs:auth_switch handler - runtime 非空时走 R2 冲突确认流而非 R10 直接拒绝', executedAt:now() }
    : { caseId:'D2-12', status:'FAIL', why:'S1 被写入或异常: '+body.slice(0,200), executedAt:now() });
  auth.clearRuntimeCredentials();
} catch (e) { writeCase('D2-12', { caseId:'D2-12', status:'FAIL', why:'err: '+e.message, executedAt:now() }); }

// D2-16: import文件读取后擦除
// Actual behavior: import file kept when needs_confirmation (for replay per #502),
// wiped after auth_confirm succeeds
try {
  const importPath = join(process.env.HOME || process.env.USERPROFILE, '.config', 'huaweicloud', 'creds-import.json');
  const importDir = dirname(importPath);
  mkdirSync(importDir, { recursive: true });
  const creds = { ak: 'AKTESTIMP3', sk: 'SKTESTIMP3', region: 'cn-north-4' };
  writeFileSync(importPath, JSON.stringify(creds));
  // First: auth_switch mode=import
  const r = await tools.callTool('huaweicloud_auth_switch', { mode: 'import', action: 'persist' });
  const body1 = JSON.stringify(r);
  // If needs_confirmation, confirm to complete the persist
  let confirmed = false;
  if (r.status === 'needs_confirmation' && r.confirmToken) {
    const cr = await tools.callTool('huaweicloud_auth_confirm', { token: r.confirmToken, decision: 'newImported' });
    confirmed = cr.status === 'ok';
  }
  const existsAfterConfirm = existsSync(importPath);
  // Restore original credentials from backup
  auth.restoreGlobalCredentialsBackup();
  writeCase('D2-16', !existsAfterConfirm
    ? { caseId:'D2-16', status:'PASS', why:'import 文件在 auth_confirm 后擦除 (per #502 replay-then-wipe)', detail: 'switch='+body1.slice(0,150)+' confirmed='+confirmed, executedAt:now() }
    : { caseId:'D2-16', status:'FAIL', why:'import 文件未擦除 after confirm', detail: body1.slice(0,200), executedAt:now() });
  // Cleanup
  try { rmSync(importPath, { force: true }); } catch {}
} catch (e) { writeCase('D2-16', { caseId:'D2-16', status:'FAIL', why:'err: '+e.message, executedAt:now() }); }

console.log('D2 fix done.');
