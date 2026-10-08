// D2-26: 凭证备份与恢复
import { pathToFileURL } from 'node:url';
const { backupGlobalCredentials, restoreGlobalCredentialsBackup, readGlobalCredentials, writeGlobalCredentials, globalCredentialsPath } =
  await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs').href);
import { existsSync, rmSync } from 'node:fs';

try {
  const original = readGlobalCredentials();
  if (!original?.ak || !original?.sk) {
    console.log(JSON.stringify({
      status: 'BLOCKED',
      caseId: 'D2-26',
      why: 'No real cloud credentials found. Need valid credentials to test backup/restore.',
      executedAt: '20261001103000',
      detail: {},
    }, null, 2));
  } else {
    // Step 1: Backup original credentials
    const bakPath = backupGlobalCredentials();
    const backupCreated = bakPath !== null && existsSync(bakPath);

    // Step 2: Write different credentials
    const modifiedCreds = {
      ak: 'MODIFIEDAKD2X26BACKUP',
      sk: 'MODIFIEDSKD2X26BACKUPSECRETKEY',
      securityToken: '',
      region: 'cn-south-1',
    };
    writeGlobalCredentials(modifiedCreds);
    const afterModify = readGlobalCredentials();
    const modifiedOk = afterModify.ak === modifiedCreds.ak;

    // Step 3: Restore from backup
    const restored = restoreGlobalCredentialsBackup();
    const afterRestore = readGlobalCredentials();

    // Step 4: Verify restored credentials match original
    const restoredOk = afterRestore.ak === original.ak &&
                       afterRestore.sk === original.sk &&
                       afterRestore.region === original.region;

    // Cleanup
    const bakPath2 = `${globalCredentialsPath()}.bak`;
    if (existsSync(bakPath2)) rmSync(bakPath2, { force: true });

    const pass = backupCreated && modifiedOk && restored && restoredOk;
    console.log(JSON.stringify({
      status: pass ? 'PASS' : 'FAIL',
      caseId: 'D2-26',
      why: pass
        ? `backup created, modification applied, restore succeeded, original credentials recovered`
        : `backupCreated=${backupCreated}, modifiedOk=${modifiedOk}, restored=${restored}, restoredOk=${restoredOk}`,
      executedAt: '20261001103000',
      detail: {
        backupCreated, bakPath, modifiedOk, restored, restoredOk,
        originalAk: original.ak?.slice(0, 6),
        restoredAk: afterRestore.ak?.slice(0, 6),
      },
    }, null, 2));
  }
} catch (error) {
  const bakPath3 = `${globalCredentialsPath()}.bak`;
  if (existsSync(bakPath3)) rmSync(bakPath3, { force: true });
  console.log(JSON.stringify({
    status: 'FAIL',
    caseId: 'D2-26',
    why: `test threw error: ${error.message}`,
    executedAt: '20261001103000',
    detail: { error: error.message },
  }, null, 2));
}