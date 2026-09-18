// D2-11 R3 STS token拒绝落盘：auth_switch persist + securityToken → {status:error, scope:rejected}，token 永不落盘
import { pathToFileURL } from 'node:url';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SRC = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);

// 隔离 HUAWEICLOUD_HOME，避免污染真实管理员凭证；S2 用 mock hcloud，S3 用隔离 obs 路径
const HOME = mkdtempSync(join(tmpdir(), 'hdktest-d211-'));
mkdirSync(join(HOME, '.config', 'huaweicloud'), { recursive: true });
process.env.HUAWEICLOUD_HOME = HOME;
process.env.HCLOUD_OBS_CONFIG_PATH = join(HOME, 'obsutilconfig');
process.env.HCLOUD_BIN = '/bin/true'; // mock: 任何 configure/sync 都返回成功

const AK = 'AKIA' + 'TESTREADONLY000000000000';   // 假凭证
const SK = 'sktestsktest' + 'sktestsktest00000000';
const TOKEN = 'FakeSTSToken.DoNotPersist.0000000000';
const REGION = 'cn-north-4';

const res = await callTool('huaweicloud_auth_switch', {
  mode: 'memory', action: 'persist', ak: AK, sk: SK, securityToken: TOKEN, region: REGION,
});
console.log('RESULT', JSON.stringify(res));

let s1Token = '';
try { s1Token = JSON.parse(readFileSync(join(HOME,'.config','huaweicloud','credentials.json'),'utf8')).securityToken || ''; } catch {}

const passed = res.status === 'error' && res.scope === 'rejected' && s1Token === '';
console.log('ASSERT status=error:', res.status === 'error');
console.log('ASSERT scope=rejected:', res.scope === 'rejected');
console.log('ASSERT S1.securityToken 留空(不落盘):', s1Token === '');
console.log('VERDICT', passed ? 'PASS' : 'FAIL');
process.exit(passed ? 0 : 1);
