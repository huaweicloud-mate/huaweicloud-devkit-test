// D2-16 import 文件读取后擦除 —— 通过 auth_switch mode=import 黑盒验证 creds-import.json 读后擦除
import { callTool } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { globalCredentialsPath, clearRuntimeCredentials } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { mkdirSync, existsSync, writeFileSync, rmSync } from 'node:fs';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

const tmp = join(tmpdir(), `hdk-import-${Date.now()}`);
process.env.HUAWEICLOUD_HOME = tmp;
process.env.HCLOUD_CONFIG_PATH = join(tmp, 'hcloud-config.json');
process.env.HCLOUD_OBS_CONFIG_PATH = join(tmp, 'obsutilconfig');
mkdirSync(join(tmp, '.config', 'huaweicloud'), { recursive: true });
try {
  const importPath = join(dirname(globalCredentialsPath()), 'creds-import.json');
  writeFileSync(importPath, JSON.stringify({ ak: 'IMPAK', sk: 'IMPSK', region: 'cn-north-4' }));
  check('D2-16', 'import 文件已写入', existsSync(importPath), true);

  const r = await callTool('huaweicloud_auth_switch', {
    action: 'temporary', mode: 'import',
  });
  // 读后无条件擦除：exists=False（temporary 路径无条件 clearImportFile）
  check('D2-16', 'import 读后擦除(exists=False)', existsSync(importPath), false);
} finally {
  clearRuntimeCredentials();
  delete process.env.HUAWEICLOUD_HOME;
  delete process.env.HCLOUD_CONFIG_PATH;
  delete process.env.HCLOUD_OBS_CONFIG_PATH;
  rmSync(tmp, { recursive: true, force: true });
}

console.log('\n=== D2-16 import 读后擦除探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);