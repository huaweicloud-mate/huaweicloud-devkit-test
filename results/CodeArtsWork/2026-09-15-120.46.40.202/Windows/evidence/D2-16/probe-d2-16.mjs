// D2-16: import文件读取后擦除 — 源码级直调 callTool
// 预期: 读后无条件擦除（exists=False），密钥不留盘
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { writeFileSync, existsSync, rmSync } from 'node:fs';

const srcBase = 'C:/Users/Administrator/devkit-test/CodeArtsWork/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(srcBase + '/tools.mjs').href);

// Step 1: Create mock creds-import.json
const importFilePath = join(homedir(), '.config', 'huaweicloud', 'creds-import.json');
const mockCreds = {
  ak: 'MOCKAK_D2_16',
  sk: 'MOCKSK_D2_16',
  region: 'cn-north-4'
};

// Ensure directory exists
import { mkdirSync } from 'node:fs';
mkdirSync(join(homedir(), '.config', 'huaweicloud'), { recursive: true });
writeFileSync(importFilePath, JSON.stringify(mockCreds), 'utf8');

const existsBefore = existsSync(importFilePath);

// Step 2: auth_switch mode=import action=temporary (reads file, sets runtime creds, erases file)
const result = await callTool('huaweicloud_auth_switch', {
  action: 'temporary',
  mode: 'import'
});

// Step 3: Check if file was erased
const existsAfter = existsSync(importFilePath);

// Cleanup just in case
try { rmSync(importFilePath, { force: true }); } catch {}

const pass = existsBefore && !existsAfter && result.status === 'ok';
console.log(JSON.stringify({
  case: 'D2-16',
  test: 'import文件读取后擦除',
  input: { action: 'temporary', mode: 'import', file: importFilePath },
  existsBefore,
  existsAfter,
  result,
  pass,
  evidence: `creds-import.json existed before=${existsBefore}, erased after import=${!existsAfter}, auth_switch returned status=${result.status} — file unconditionally erased after read (tools.mjs:1204 clearImportFile())`
}, null, 2));
process.exit(pass ? 0 : 1);
