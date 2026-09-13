// D2-11 R3 STS token 拒绝落盘 — 功能探针
// 用法：node probe-auth-switch.mjs（独立 HOME，不触碰真实凭证）
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { mkdtempSync, existsSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const HOME = mkdtempSync(join(tmpdir(), 'hdk-auth-'));

// 重要：必须 BEFORE import tools.mjs，因为 baseHome() 在调用时才读 env
process.env.HUAWEICLOUD_HOME = HOME;

const SRC = '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const tools = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);

const results = [];
const check = (id, cond, detail) => { results.push({ id, cond, detail }); console.log(`${cond ? 'PASS' : 'FAIL'}  ${id}  ${detail}`); };

const r = await tools.callTool('huaweicloud_auth_switch', {
  action: 'persist', ak: 'TESTAK', sk: 'TESTSK', securityToken: 'TESTSTS', region: 'cn-north-4',
});
console.log('auth_switch persist 返回: ' + JSON.stringify(r));

check('D2-11a', r?.status === 'error', `status=error（实际 ${r?.status}）`);
check('D2-11b', r?.scope === 'rejected', `scope=rejected（实际 ${r?.scope}）`);
check('D2-11c', /R3|Temporary STS/.test(String(r?.error || '')), `error 含 R3 说明（实际 ${r?.error}）`);

const credPath = join(HOME, '.config', 'huaweicloud', 'credentials.json');
check('D2-11d', !existsSync(credPath), `token 未落盘（credentials.json 不存在: ${credPath}）`);

// S1 文件是否存在（persist 未执行写，S1 不应出现）
const s1Exists = existsSync(credPath);
check('D2-11e', !s1Exists, `S1 未写入（存在=${s1Exists}）`);

const pass = results.filter((x) => x.cond).length;
const fail = results.filter((x) => !x.cond).length;
console.log(`\n===== D2-11 汇总: ${results.length} 断言 / PASS ${pass} / FAIL ${fail} =====`);

// 清理临时 HOME
rmSync(HOME, { recursive: true, force: true });
process.exitCode = fail > 0 ? 2 : 0;