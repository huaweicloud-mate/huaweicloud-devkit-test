// D11-11 auth init region 显式化且缺省不报错（P1）—— 可执行载体
//
// 判据（CSV::预期结果）：交互中出现 region 询问且含默认值 "cn-north-4"；
//   S1.region=="cn-north-4"；stderr 不含 "region, ak, and sk are required"。
// 指引来源：setup-cli.mjs:4817 + writeObsConfig(credentials.mjs:205)
// 口径：需求验收（UX-R5 登录流程 region 显式化）。实现前预期 FAIL。
// 用法: node d11-11-region-explicit.mjs <hdk src> [--evid <dir>]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-11';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-11-region-explicit.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const AK = 'D11ELEVENAK00000001';
const SK = 'D11ELEVENSK00000001';
const iso = isolateHome('d11-11');

const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');

// ① 缺 region 时不应抛 "region, ak, and sk are required"（缺省应可回落默认区域）
let obsErr = '';
try {
  creds.writeObsConfig({ ak: AK, sk: SK });
} catch (e) {
  obsErr = String(e?.message || e);
}
rec('D11-11-obs-default', '缺 region 时不报 "region, ak, and sk are required"',
  !/region, ak, and sk are required/i.test(obsErr), obsErr.slice(0, 90) || '（未报错）', '不报该错');

// ② 源码级核对：auth init 是否显式询问 region，且询问提示为中文、带默认值 cn-north-4
const cli = readFileSync(join(hdkSrc, 'setup-cli.mjs'), 'utf8');
const askLines = (cli.match(/[^\n]*(?:readLineQuestion|readSecret)\s*\([^\n]*region[^\n]*/gi) || []);
const defaultRegion = /if\s*\(!region\)\s*region\s*=\s*'cn-north-4'/.test(cli);
const askZh = askLines.some((l) => /[\u4e00-\u9fff]/.test(l));

rec('D11-11-ask-region', 'auth init 显式询问 region（而不是静默硬编码）', askLines.length > 0,
  askLines.length ? askLines[0].trim().slice(0, 80) : '未发现 region 询问语句', '存在 region 询问');
rec('D11-11-ask-zh', 'region 询问提示为中文', askZh,
  askZh ? '含中文' : (askLines[0] || '').trim().slice(0, 60) || '（无该语句）', '提示含中文字符');
rec('D11-11-default-value', '缺省区域显式回落 cn-north-4（默认值可回车跳过）', defaultRegion,
  defaultRegion ? 'cn-north-4' : '未发现默认值逻辑', 'cn-north-4');

// ③ 写入后 S1.region 落到 cn-north-4
creds.writeGlobalCredentials({ ak: AK, sk: SK, region: 'cn-north-4' });
const back = creds.readGlobalCredentials();
rec('D11-11-s1-region', 'S1.region == "cn-north-4"', back?.region === 'cn-north-4', back?.region ?? null, 'cn-north-4');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R5）；FAIL = 需求未实现，非 harness 问题');
