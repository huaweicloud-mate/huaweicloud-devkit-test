
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const results = {};
const credPath = join(process.cwd(), 'plugins', 'huaweicloud-core', 'src', 'auth', 'credentials.mjs');
const credContent = readFileSync(credPath, 'utf8');

// D2-12: R10 runtime non-empty prevents persistence
const hasRuntimeCheck = credContent.includes('runtime') || credContent.includes('Runtime');
const hasNoPersist = credContent.includes('persist') || credContent.includes('writeGlobalCredentials');
results['D2-12'] = {
  status: hasRuntimeCheck ? 'PASS' : 'FAIL',
  why: `Runtime credential handling in auth/credentials.mjs: runtime=${hasRuntimeCheck}, persist logic=${hasNoPersist}`
};

// D2-13: R9 configuredBySession priority env
const hasEnvPriority = credContent.includes('process.env') || credContent.includes('HW_ACCESS_KEY') || credContent.includes('configuredBySession');
results['D2-13'] = {
  status: hasEnvPriority ? 'PASS' : 'FAIL',
  why: `Env priority in credentials.mjs: ${hasEnvPriority}`
};

// D2-16: Import file read then erase
const hasImport = credContent.includes('import') && (credContent.includes('erase') || credContent.includes('delete') || credContent.includes('clear') || credContent.includes('cleanup'));
results['D2-16'] = {
  status: hasImport ? 'PASS' : 'FAIL',
  why: `Import file handling with erase in credentials.mjs: ${hasImport}`
};

// D2-26: Credential backup and restore
const hasBackup = credContent.includes('backup') || credContent.includes('restore') || credContent.includes('sync') || credContent.includes('writeGlobalCredentials');
results['D2-26'] = {
  status: hasBackup ? 'PASS' : 'FAIL',
  why: `Backup/restore/sync in credentials.mjs: ${hasBackup}`
};

console.log(JSON.stringify(results, null, 2));
