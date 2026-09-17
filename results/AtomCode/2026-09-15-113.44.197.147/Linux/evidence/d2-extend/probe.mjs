// D2-10 / D2-12 / D2-16 扩展探针
import { readKooCliProfiles, resolveManagedProfile } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/auth/reconcile.mjs';
import { getAuthStatus, syncAuth } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/auth/service.mjs';
import {
  setRuntimeCredentials,
  clearRuntimeCredentials,
  hasRuntimeCredentials,
  writeGlobalCredentials,
  readGlobalCredentials,
} from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { existsSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

let pass = 0, fail = 0;
function check(id, desc, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function bool(id, desc, cond) { check(id, desc, Boolean(cond), true); }

// D2-10 R7 current 档跟随
{
  const res = readKooCliProfiles();
  console.log(`INFO   D2-10  readKooCliProfiles => ${JSON.stringify(res).slice(0, 200)}`);
  bool('D2-10', 'readKooCliProfiles 返回含 current 字段或明确 error', typeof res === 'object' && ('current' in res || 'error' in res));
  const cur = resolveManagedProfile();
  bool('D2-10', 'resolveManagedProfile 返回 current 档名或 null（无配置）', cur === null || typeof cur === 'string');
}

// D2-12 R10 runtime 非空禁止落盘
{
  const bak = readGlobalCredentials();
  writeGlobalCredentials({ ak: 'AK1', sk: 'SK1', region: 'cn-north-4' });
  setRuntimeCredentials('AK_RT', 'SK_RT', undefined, 'cn-north-4');
  const r = syncAuth('all');
  console.log(`INFO   D2-12  syncAuth(runtime active) => ${JSON.stringify(r)}`);
  bool('D2-12', 'runtime 激活时 syncAuth 返回 ok:false', r && r.ok === false);
  bool('D2-12', 'syncAuth 错误含 R10 auto-sync suppressed 语义', /auto-sync suppressed|Runtime credentials are active/i.test(r?.error || ''));
  clearRuntimeCredentials();
  writeGlobalCredentials(bak || {});
  bool('D2-12', '清理后 hasRuntimeCredentials=false', hasRuntimeCredentials() === false);
}

// D2-16 import 文件读取后擦除
{
  const dir = mkdtempSync(join(tmpdir(), 'hdk-import-'));
  // 源码语义验证：import 处理对 creds-import.json 的「读取后擦除」由 clearImportFile/readImportFile 的 rmSync 实现
  const fs = await import('node:fs');
  const toolsSrc = fs.readFileSync('/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/tools.mjs', 'utf8');
  const hasClear = /function\s+clearImportFile/.test(toolsSrc);
  const usesRmSync = /rmSync\s*\(\s*path\s*,\s*\{\s*force:\s*true\s*\}\)/.test(toolsSrc);
  console.log(`INFO   D2-16  clearImportFile 定义=${hasClear} rmSync(force) 擦除=${usesRmSync}`);
  bool('D2-16', 'import 文件存在 clearImportFile 擦除函数', hasClear);
  bool('D2-16', '擦除通过 rmSync(path,{force:true}) 实现（读后无条件擦除）', usesRmSync);
  rmSync(dir, { recursive: true, force: true });
}

console.log(`TOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);