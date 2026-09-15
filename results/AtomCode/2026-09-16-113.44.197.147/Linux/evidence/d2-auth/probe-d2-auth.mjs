// D2 认证域探针 — 凭证脱敏 / 凭证文件读取拦截 / R3 STS 临时凭证不落盘
import { classifyTextCommand, redactSecrets } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { setRuntimeCredentials, hasRuntimeCredentials, clearRuntimeCredentials, readGlobalCredentials, writeGlobalCredentials, globalCredentialsPath } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// D2-4 凭证脱敏正确性（show_profile_redacted 语义）
{
  const red = redactSecrets({ ak: 'AAA111', sk: 'Sss222', security_token: 'Ttt333', region: 'cn-north-4', project_id: 'p-1' });
  check('D2-4', 'ak 脱敏', red.ak, '<redacted>');
  check('D2-4', 'sk 脱敏', red.sk, '<redacted>');
  check('D2-4', 'security_token 脱敏', red.security_token, '<redacted>');
  check('D2-4', 'region 保留', red.region, 'cn-north-4');
}

// D2-11 / R3 STS token 拒绝落盘：运行时 STS 凭证仅存内存，不写入全局 credentials.json
{
  const tmp = join(tmpdir(), `hdk-auth-probe-${Date.now()}`);
  process.env.HUAWEICLOUD_HOME = tmp;
  try {
    setRuntimeCredentials('AKSTS', 'SKSTS', 'TempToken123');
    check('D2-11', 'runtime 凭证存在于内存', hasRuntimeCredentials(), true);
    // R3: 运行时 STS 临时凭证仅存内存，不落盘到全局 credentials.json
    writeGlobalCredentials({ ak: 'AKPERSIST', sk: 'SKPERSIST' });
    const persisted = readGlobalCredentials();
    const credPath = globalCredentialsPath();
    const raw = readFileSync(credPath, 'utf8');
    check('D2-11', '全局落盘不含 STS temp token 值', raw.includes('TempToken123'), false);
    check('D2-11', '全局落盘 securityToken 为空(非 STS 值)', (persisted && persisted.securityToken) === '', true);
    check('D2-11', '全局落盘 ak 正确', persisted.ak, 'AKPERSIST');
    clearRuntimeCredentials();
    check('D2-11', 'clearRuntimeCredentials 后 runtime 清空', hasRuntimeCredentials(), false);
  } finally {
    delete process.env.HUAWEICLOUD_HOME;
    if (existsSync(tmp)) rmSync(tmp, { recursive: true, force: true });
  }
}

// D2-2 凭证文件读取拦截（黑盒）
{
  const r = classifyTextCommand('Get-Content $HOME/.config/huaweicloud/credentials.json');
  check('D2-2', '凭证文件读取拦截(ps)', r.decision, 'deny');
  const r2 = classifyTextCommand('cat /root/.huaweicloud/config');
  check('D2-2', '.huaweicloud/config 拦截', r2.decision, 'deny');
}

console.log('\n=== D2 认证域探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);