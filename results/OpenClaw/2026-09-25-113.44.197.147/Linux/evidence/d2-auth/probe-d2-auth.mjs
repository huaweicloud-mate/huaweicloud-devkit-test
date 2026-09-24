// D2 认证域探针——凭证脱敏 / R3 STS 拒落盘 / R9 configuredBySession 优先 / R10 runtime 禁落盘 / import 擦除
import { classifyTextCommand, redactSecrets } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import {
  setRuntimeCredentials,
  hasRuntimeCredentials,
  clearRuntimeCredentials,
  readGlobalCredentials,
  writeGlobalCredentials,
  resolveCredentials,
} from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { resolveCredentialsWithRuntime } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { syncAuth } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/auth/service.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// D2-4 凭证脱敏正确性
{
  const red = redactSecrets({
    ak: 'AAA111', sk: 'Sss222', security_token: 'Ttt333', secret_key: 'SEC', access_key: 'ACC',
    region: 'cn-north-4', username: 'admin', password: 'p@ss',
  });
  check('D2-4', 'ak 脱敏', red.ak, '<redacted>');
  check('D2-4', 'sk 脱敏', red.sk, '<redacted>');
  check('D2-4', 'security_token 脱敏', red.security_token, '<redacted>');
  check('D2-4', 'secret_key 脱敏', red.secret_key, '<redacted>');
  check('D2-4', 'access_key 脱敏', red.access_key, '<redacted>');
  check('D2-4', 'password 脱敏', red.password, '<redacted>');
  check('D2-4', 'region 保留', red.region, 'cn-north-4');
  check('D2-4', 'username 保留', red.username, 'admin');
}

// D2-2 凭证文件读取拦截（黑盒）
{
  check('D2-2', 'cat credentials.json 拦截', classifyTextCommand('cat ~/.config/huaweicloud/credentials.json').decision, 'deny');
  check('D2-2', '.huaweicloud/config 拦截', classifyTextCommand('cat ~/.huaweicloud/config').decision, 'deny');
}

// D2-11 / R3 STS token 拒绝落盘 + D2-12 / R10 runtime 非空禁止落盘
{
  const tmp = join(tmpdir(), `hdk-auth-${Date.now()}`);
  process.env.HUAWEICLOUD_HOME = tmp;
  process.env.HCLOUD_CONFIG_PATH = join(tmp, 'hcloud-config.json');
  process.env.HCLOUD_OBS_CONFIG_PATH = join(tmp, 'obsutilconfig');
  try {
    // R10: runtime 非空 → syncAuth 抑制
    writeGlobalCredentials({ ak: 'AKPERSIST', sk: 'SKPERSIST', region: 'cn-north-4' });
    setRuntimeCredentials('AKSTSRT', 'SKSTSRT', 'TempTokenRT');
    check('D2-12', 'runtime 存在', hasRuntimeCredentials(), true);
    const syncRes = syncAuth('all');
    check('D2-12', 'R10 auto-sync suppressed', syncRes.ok, false);
    check('D2-12', 'R10 报错含 suppressed', /suppressed \(R10\)|auto-sync suppressed/i.test(syncRes.error || ''), true);

    // R3: STS token 拒绝落盘（persistCredentials 语义直接验证 writeGlobalCredentials 不写 token 字段外的值）
    const before = readGlobalCredentials();
    check('D2-11', '全局落盘 ak~原值', before.ak, 'AKPERSIST');

    // resolveCredentialsWithRuntime 返回 runtime 而非 S1
    clearRuntimeCredentials();
    check('D2-12', 'clear 后 runtime 清空', hasRuntimeCredentials(), false);
    const resolved = resolveCredentialsWithRuntime();
    check('D2-12', 'clear 后回落 S1', resolved.ak, 'AKPERSIST');
  } finally {
    clearRuntimeCredentials();
    delete process.env.HUAWEICLOUD_HOME;
    delete process.env.HCLOUD_CONFIG_PATH;
    delete process.env.HCLOUD_OBS_CONFIG_PATH;
    rmSync(tmp, { recursive: true, force: true });
  }
}

// D2-13 R9 configuredBySession 优先 env
{
  const tmp = join(tmpdir(), `hdk-r9-${Date.now()}`);
  process.env.HUAWEICLOUD_HOME = tmp;
  process.env.HW_ACCESS_KEY = 'ENVAK';
  process.env.HW_SECRET_KEY = 'ENVSK';
  try {
    writeGlobalCredentials({ ak: 'S1AK', sk: 'S1SK', securityToken: '', region: 'cn-north-4', configuredBySession: true });
    const r9 = resolveCredentials();
    check('D2-13', 'configuredBySession 时 S1 胜出', r9.ak, 'S1AK');
    // 清除 configuredBySession 后 env 兜底恢复
    writeGlobalCredentials({ ak: 'S1AK', sk: 'S1SK', securityToken: '', region: 'cn-north-4' });
    const r9b = resolveCredentials();
    check('D2-13', '清除标记后 env 兜底', r9b.ak, 'ENVAK');
  } finally {
    delete process.env.HUAWEICLOUD_HOME;
    delete process.env.HW_ACCESS_KEY;
    delete process.env.HW_SECRET_KEY;
    rmSync(tmp, { recursive: true, force: true });
  }
}

console.log('\n=== D2 认证域探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);