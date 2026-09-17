// D4-13 最小权限凭证通过率 探针
// 执行: python scripts/run-as-readonly.py node evidence/D4-13/probe.mjs
import { join } from 'node:path';
import { homedir } from 'node:os';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SRC = join(homedir(), 'devkit-test', 'Hermes', 'hdk', 'plugins', 'huaweicloud-core', 'src');
const creds = await import(pathToFileURL(join(SRC, 'auth', 'credentials.mjs')).href);
const reconcile = await import(pathToFileURL(join(SRC, 'auth', 'reconcile.mjs')).href);
const validator = await import(pathToFileURL(join(SRC, 'auth', 'credential-validator.mjs')).href);
const { resolveCredentials } = creds;
const { fingerprint } = reconcile;
const { validateIamCredentials } = validator;

const ro = JSON.parse(readFileSync(join(homedir(), '.config', 'huaweicloud', 'credentials.readonly.json'), 'utf8'));
const admin = JSON.parse(readFileSync(join(homedir(), '.config', 'huaweicloud', 'credentials.json'), 'utf8'));

const resolved = resolveCredentials();
const resolvedFp = fingerprint(resolved.ak, resolved.sk);
const roFp = fingerprint(ro.ak, ro.sk);
const adminFp = fingerprint(admin.ak, admin.sk);

console.log('=== D4-13 ===');
console.log('[1] run-as-readonly env 注入生效: resolveCredentials 命中的账号指纹 =', resolvedFp);
console.log('    只读账号(test001)指纹 =', roFp, '| 管理员指纹 =', adminFp);
console.log('    resolved==readonly ?', resolvedFp === roFp ? 'YES (env 覆盖文件, 动态切换成功)' : 'NO');
console.log('    resolved!=admin ?', resolvedFp !== adminFp ? 'YES (未误用管理员)' : 'NO (误用管理员, 即为缺陷)');

const v = await validateIamCredentials({ ak: ro.ak, sk: ro.sk, region: ro.region });
console.log('[2] 只读账号 validateIamCredentials (IAM KeystoneListProjects 只读):');
console.log('    valid =', v.valid, '| projectId =', (v.projectId || '(none)').slice(0, 8) + '...', '| warning =', v.warning || null, '| error =', (v.error || '').slice(0, 100));
console.log('    结论:', v.valid ? '凭证有效(可签名, 非 APIGW.0301 / 非 401)' : '凭证无效');

console.log('[3] 只读规划类操作(list_operations)为本地 KooCLI --help, 不依赖云端 API 凭证, 预期可用');
console.log('    (见 D3-C4/EXP-C4 证据: 22 服务 list_operations 全可路由)');