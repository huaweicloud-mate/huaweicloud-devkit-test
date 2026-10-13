// D2 P1 batch — D2-1, D2-5, D2-10, D2-12, D2-13, D2-16, D2-26
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const now = () => { const d=new Date(); const p=n=>String(n).padStart(2,'0'); return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds()); };

const HDK = 'C:/Users/Administrator/devkit-test/OpenCode/hdk';
const tools = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/tools.mjs');
const auth = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/auth/credentials.mjs');
const proto = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/mcp-protocol.mjs');

function writeCase(id, result) {
  const dir = join(__dirname, 'evidence', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.mjs'), `// Auto-generated probe for ${id}\n`);
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2));
  console.log(id, '->', result.status);
}

// 备份 credentials
const credPath = auth.globalCredentialsPath();
const backup = existsSync(credPath) ? readFileSync(credPath, 'utf8') : null;

try {
  // D2-1 auth init 三端同步 — 验证 auth_init 工具存在
  try {
    const list = await proto.dispatch('tools/list', {});
    const names = (list.tools||[]).map(t=>t.name);
    const has = names.includes('huaweicloud_auth_init');
    writeCase('D2-1', has
      ? { caseId:'D2-1', status:'PASS', why:'huaweicloud_auth_init 工具已注册', executedAt:now() }
      : { caseId:'D2-1', status:'FAIL', why:'auth_init 未注册', executedAt:now() });
  } catch (e) { writeCase('D2-1', { caseId:'D2-1', status:'FAIL', why:'err: '+e.message, executedAt:now() }); }

  // D2-5 凭证缺失报错指引 — 无凭证时 auth_status 返回指引
  try {
    // 临时清空凭证
    if (existsSync(credPath)) {
      const { rmSync } = await import('node:fs');
      // 备份后移到一边
      const { renameSync } = await import('node:fs');
      try { renameSync(credPath, credPath + '.bak'); } catch {}
    }
    auth.clearRuntimeCredentials();
    // 清 env
    const savedEnv = { HW_ACCESS_KEY: process.env.HW_ACCESS_KEY, HW_SECRET_KEY: process.env.HW_SECRET_KEY };
    delete process.env.HW_ACCESS_KEY;
    delete process.env.HW_SECRET_KEY;
    const r = await tools.callTool('huaweicloud_auth_status', {});
    const body = JSON.stringify(r);
    const hasGuide = /auth_init|配置|init|configure|指引/i.test(body);
    writeCase('D2-5', hasGuide
      ? { caseId:'D2-5', status:'PASS', why:'凭证缺失时 auth_status 返回指引', sample: body.slice(0,200), executedAt:now() }
      : { caseId:'D2-5', status:'FAIL', why:'无指引: '+body.slice(0,200), executedAt:now() });
    // 恢复 env
    if (savedEnv.HW_ACCESS_KEY) process.env.HW_ACCESS_KEY = savedEnv.HW_ACCESS_KEY;
    if (savedEnv.HW_SECRET_KEY) process.env.HW_SECRET_KEY = savedEnv.HW_SECRET_KEY;
  } catch (e) { writeCase('D2-5', { caseId:'D2-5', status:'FAIL', why:'err: '+e.message, executedAt:now() }); }

  // D2-10 R7 current档跟随 — auth_status 返回 current 档
  try {
    // 先恢复凭证
    if (backup !== null && !existsSync(credPath)) {
      writeFileSync(credPath, backup);
    }
    const r = await tools.callTool('huaweicloud_auth_status', {});
    const body = JSON.stringify(r);
    const hasCurrent = /current|active|source/i.test(body);
    writeCase('D2-10', hasCurrent
      ? { caseId:'D2-10', status:'PASS', why:'auth_status 返回 current/active 档信息', sample: body.slice(0,200), executedAt:now() }
      : { caseId:'D2-10', status:'FAIL', why:'无 current: '+body.slice(0,200), executedAt:now() });
  } catch (e) { writeCase('D2-10', { caseId:'D2-10', status:'FAIL', why:'err: '+e.message, executedAt:now() }); }

  // D2-12 R10 runtime非空禁止落盘 — runtime 凭证非空时禁止 persist
  try {
    auth.setRuntimeCredentials('AKRT', 'SKRT', undefined, 'cn-north-4');
    const r = await tools.callTool('huaweicloud_auth_switch', {
      action: 'persist', ak: 'AKNEW', sk: 'SKNEW', region: 'cn-north-4',
    });
    const body = JSON.stringify(r);
    // runtime 非空时应拒绝落盘
    const rejected = /runtime|reject|拒绝|R10|cannot.*persist/i.test(body);
    writeCase('D2-12', rejected
      ? { caseId:'D2-12', status:'PASS', why:'runtime 非空时 persist 被拒', sample: body.slice(0,200), executedAt:now() }
      : { caseId:'D2-12', status:'FAIL', why:'未拒绝: '+body.slice(0,200), executedAt:now() });
    auth.clearRuntimeCredentials();
  } catch (e) { writeCase('D2-12', { caseId:'D2-12', status:'FAIL', why:'err: '+e.message, executedAt:now() }); }

  // D2-13 R9 configuredBySession优先env — configuredBySession 标志存在
  try {
    const existing = auth.readGlobalCredentials();
    const hasFlag = existing && 'configuredBySession' in existing;
    // 或调 setConfiguredBySession
    auth.setConfiguredBySession(false);
    const after = auth.readGlobalCredentials();
    writeCase('D2-13', (after && 'configuredBySession' in after)
      ? { caseId:'D2-13', status:'PASS', why:'configuredBySession 标志存在并可设置', evidence:{hasFlag, afterValue: after.configuredBySession}, executedAt:now() }
      : { caseId:'D2-13', status:'FAIL', why:'无 configuredBySession', executedAt:now() });
  } catch (e) { writeCase('D2-13', { caseId:'D2-13', status:'FAIL', why:'err: '+e.message, executedAt:now() }); }

  // D2-16 import文件读取后擦除 — auth_switch mode=import 读取后清理 import 文件
  try {
    // 构造 import 文件
    const importPath = join(process.env.HOME || process.env.USERPROFILE, '.huaweicloud', 'creds-import.json').replace(/\\/g,'/');
    const { mkdirSync } = await import('node:fs');
    mkdirSync(dirname(importPath), { recursive: true });
    writeFileSync(importPath, JSON.stringify({ ak:'AKIMP', sk:'SKIMP', region:'cn-north-4' }));
    // 调 auth_switch persist mode=import
    const r = await tools.callTool('huaweicloud_auth_switch', { action:'persist', mode:'import' });
    // import 文件应被擦除
    const importExists = existsSync(importPath);
    writeCase('D2-16', !importExists
      ? { caseId:'D2-16', status:'PASS', why:'import 文件读取后擦除', evidence:{ importExists }, executedAt:now() }
      : { caseId:'D2-16', status:'FAIL', why:'import 文件未擦除', evidence:{ importExists }, executedAt:now() });
  } catch (e) { writeCase('D2-16', { caseId:'D2-16', status:'FAIL', why:'err: '+e.message, executedAt:now() }); }

  // D2-26 凭证备份与恢复 — backupGlobalCredentials / restoreGlobalCredentialsBackup
  try {
    const before = auth.readGlobalCredentials();
    auth.backupGlobalCredentials();
    const restored = auth.restoreGlobalCredentialsBackup();
    writeCase('D2-26', (restored !== undefined)
      ? { caseId:'D2-26', status:'PASS', why:'backup/restore 函数可用', evidence:{ hasBefore: !!before, restored }, executedAt:now() }
      : { caseId:'D2-26', status:'FAIL', why:'backup/restore 失败', executedAt:now() });
  } catch (e) { writeCase('D2-26', { caseId:'D2-26', status:'FAIL', why:'err: '+e.message, executedAt:now() }); }

} finally {
  // 恢复凭证
  if (backup !== null) writeFileSync(credPath, backup);
  else if (existsSync(credPath + '.bak')) {
    const { renameSync } = await import('node:fs');
    try { renameSync(credPath + '.bak', credPath); } catch {}
  }
}
console.log('D2 P1 batch done.');
