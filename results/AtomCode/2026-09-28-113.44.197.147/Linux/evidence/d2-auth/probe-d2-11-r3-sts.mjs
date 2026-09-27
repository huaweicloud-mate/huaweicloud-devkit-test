// D2-11 R3 STS token 拒绝落盘 —— 通过 huaweicloud_auth_switch persist 语义验证（隔离 HOME）
import { callTool } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { readGlobalCredentials, globalCredentialsPath, clearRuntimeCredentials } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, existsSync, readFileSync, rmSync } from 'node:fs';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

const tmp = join(tmpdir(), `hdk-r3-${Date.now()}`);
process.env.HUAWEICLOUD_HOME = tmp;
process.env.HCLOUD_CONFIG_PATH = join(tmp, 'hcloud-config.json');
process.env.HCLOUD_OBS_CONFIG_PATH = join(tmp, 'obsutilconfig');
mkdirSync(join(tmp, '.config', 'huaweicloud'), { recursive: true });
try {
  const r = await callTool('huaweicloud_auth_switch', {
    action: 'persist',
    mode: 'memory',
    ak: 'AKSTSTOKEN',
    sk: 'SKSTSTOKEN',
    securityToken: 'TempTokenSTS123',
    region: 'cn-north-4',
  });
  check('D2-11', 'persist STS 返回 status=error', r?.status, 'error');
  check('D2-11', 'scope=rejected', r?.scope, 'rejected');
  // 断言 token 永不落盘
  const path = globalCredentialsPath();
  const raw = existsSync(path) ? readFileSync(path, 'utf8') : '';
  check('D2-11', '全局落盘不含 STS token 值', raw.includes('TempTokenSTS123'), false);
  check('D2-11', '全局落盘不含 STS ak 值', raw.includes('AKSTSTOKEN'), false);
  const g = readGlobalCredentials();
  check('D2-11', 'S1 未被 STS 覆盖(ak 为空或非 STS)', (g?.ak || '') === 'AKSTSTOKEN', false);
} finally {
  clearRuntimeCredentials();
  delete process.env.HUAWEICLOUD_HOME;
  delete process.env.HCLOUD_CONFIG_PATH;
  delete process.env.HCLOUD_OBS_CONFIG_PATH;
  rmSync(tmp, { recursive: true, force: true });
}

console.log('\n=== D2-11 R3 STS 拒落盘探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);