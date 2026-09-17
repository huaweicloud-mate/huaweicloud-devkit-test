// D2-1 auth init 三端同步 (源码级断言: KooCLI/OBS/凭证库 三端配置落位)
// 隔离 HOME：HUAWEICLOUD_HOME + HCLOUD_OBS_CONFIG_PATH 指向临时目录，不触碰真实凭证文件
import { mkdtempSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const iso = mkdtempSync(join(tmpdir(), 'hdk-d21-'));
mkdirSync(join(iso, '.config', 'huaweicloud'), { recursive: true });
process.env.HUAWEICLOUD_HOME = iso;
process.env.HCLOUD_OBS_CONFIG_PATH = join(iso, '.obsutilconfig');

const {
  writeGlobalCredentials, writeObsConfig,
} = await import('/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs');
const { resolveManagedProfile } = await import('/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/auth/reconcile.mjs');

let pass = 0, fail = 0;
function bool(id, desc, cond) {
  cond ? pass++ : fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${cond}`);
}

// 1) OBS 终端落位 (writeObsConfig -> .obsutilconfig 平铺 key=value + endpoint)
const obsRet = writeObsConfig({ region: 'cn-north-4', ak: 'FAKEAK1234567890123456', sk: 'FAKESK1234567890123456' });
const obsPath = obsRet && obsRet.path;
bool('D2-1', 'OBS 配置落位 (.obsutilconfig 存在)', !!obsPath && existsSync(obsPath));
const obsTxt = obsPath && existsSync(obsPath) ? readFileSync(obsPath, 'utf8') : '';
bool('D2-1', 'OBS 配置为平铺 key=value + endpoint', obsTxt.includes('endpoint=https://obs.cn-north-4.myhuaweicloud.com') && obsTxt.includes('ak=FAKEAK') && obsTxt.includes('sk=FAKESK'));

// 2) 凭证库终端落位 (writeGlobalCredentials -> credentials.json)
const gwPath = writeGlobalCredentials({ ak: 'FAKEAK1234567890123456', sk: 'FAKESK1234567890123456', region: 'cn-north-4' });
bool('D2-1', '凭证库配置落位 (credentials.json 存在)', !!gwPath && existsSync(gwPath) && gwPath.endsWith('credentials.json'));
const gw = gwPath && existsSync(gwPath) ? JSON.parse(readFileSync(gwPath, 'utf8')) : {};
bool('D2-1', '凭证库 JSON 含 ak/sk/region 字段', gw.ak === 'FAKEAK1234567890123456' && gw.sk && gw.region === 'cn-north-4');

// 3) KooCLI 终端：resolveManagedProfile 可解析 current profile（真实 hcloud config）
const prof = resolveManagedProfile();
bool('D2-1', 'KooCLI 终端 profile 可解析 (resolveManagedProfile 返回 current)', typeof prof === 'string' && prof.length > 0);

console.log(`TOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);