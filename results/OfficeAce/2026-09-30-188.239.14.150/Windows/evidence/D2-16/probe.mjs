// D2-16: import文件读取后擦除
// auth_switch with mode=import, action=temporary should read creds-import.json then erase it
import { pathToFileURL } from 'node:url';
const { callTool } = await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs').href);
const { globalCredentialsPath, clearRuntimeCredentials } =
  await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs').href);
import { writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';

try {
  // Create creds-import.json
  const importPath = join(dirname(globalCredentialsPath()), 'creds-import.json');
  const importCreds = {
    ak: 'TESTAKD2X16IMPORT',
    sk: 'TESTSKD2X16IMPORTSECRETKEYVALUE',
    securityToken: '',
    region: 'cn-north-4',
  };
  writeFileSync(importPath, JSON.stringify(importCreds, null, 2), 'utf8');

  // Verify file exists before
  const existsBefore = existsSync(importPath);

  // Call auth_switch with mode=import, action=temporary
  const result = await callTool('huaweicloud_auth_switch', { mode: 'import', action: 'temporary' });

  // Verify file is erased after
  const existsAfter = existsSync(importPath);

  // Cleanup
  clearRuntimeCredentials();
  if (existsAfter) rmSync(importPath, { force: true });

  const pass = existsBefore && !existsAfter && result.status === 'ok';
  const output = {
    status: pass ? 'PASS' : 'FAIL',
    caseId: 'D2-16',
    why: pass
      ? `creds-import.json existed before, erased after auth_switch(mode=import, action=temporary). status=${result.status}`
      : `existsBefore=${existsBefore}, existsAfter=${existsAfter}, status=${result.status}`,
    executedAt: '20260930103000',
    detail: { existsBefore, existsAfter, result },
  };
  console.log(JSON.stringify(output, null, 2));
} catch (error) {
  clearRuntimeCredentials();
  const importPath2 = join(dirname(globalCredentialsPath()), 'creds-import.json');
  if (existsSync(importPath2)) rmSync(importPath2, { force: true });
  const output = {
    status: 'FAIL',
    caseId: 'D2-16',
    why: `test threw error: ${error.message}`,
    executedAt: '20260930103000',
    detail: { error: error.message },
  };
  console.log(JSON.stringify(output, null, 2));
}