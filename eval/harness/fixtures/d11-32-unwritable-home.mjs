// D11-32 HOME 不可写 / 沙箱 home 失败（错误推测法）（P2）—— 可执行载体
//
// 判据（CSV::预期结果）：返回中文错误（「无法写入凭证目录」或「沙箱环境无法解析用户主目录」）
//   且给出替代路径（HUAWEICLOUD_HOME / env 注入）；不出现英文整句
//   "KooCLI detected but cannot resolve the user home directory in this agent ..."。
// 指引来源：credentials.mjs 写盘分支 + hcloud-probe.mjs(sandbox_home_failure)
//
// 构造：把 HUAWEICLOUD_HOME 指到「父路径是普通文件」的位置 → 任何目录创建/写盘必失败
//   （跨平台可构造，无需 chmod；比只读目录更稳定）。
// 口径：需求验收（UX-R14 环境异常可诊断）。实现前预期 FAIL。
// 用法: node d11-32-unwritable-home.mjs <hdk src> [--evid <dir>]
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { blocked, contaminatedHost, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-32';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-32-unwritable-home.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const contam = contaminatedHost();
console.log(`[HOST] ${contam.length ? 'CONTAMINATED' : 'CLEAN'}${contam.length ? ' :: ' + contam.join(', ') : ''}`);
if (contam.length) blocked(CASE_ID, `宿主未隔离：${contam.join(', ')}`, evid);

const iso = isolateHome('d11-32');
// 用一个普通文件当「目录」的父级 → HUAWEICLOUD_HOME/... 的 mkdir 必报 ENOTDIR
const blocker = join(iso.dir, 'blocker-file');
writeFileSync(blocker, 'not a dir', 'utf8');
process.env.HUAWEICLOUD_HOME = join(blocker, 'creds');

const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');
let err = '';
try {
  creds.writeGlobalCredentials({ ak: 'D11THIRTYTWOAK001', sk: 'D11THIRTYTWOSK001', region: 'cn-north-4' });
} catch (e) {
  err = String(e?.message || e);
}
const ZH = /[\u4e00-\u9fff]/;
const EN_SENTENCE = /KooCLI detected but cannot resolve the user home directory/i;

rec('D11-32-zh-error', '写盘失败时返回中文错误（无法写入凭证目录 / 沙箱无法解析主目录）',
  ZH.test(err) && /无法写入|不可写|无法解析|主目录|凭证目录/.test(err), err.slice(0, 140) || '（未抛错：静默失败）',
  '中文可诊断错误');
rec('D11-32-alt-path', '给出替代路径（HUAWEICLOUD_HOME / env 注入）',
  /HUAWEICLOUD_HOME|环境变量|env/i.test(err), err.slice(0, 140), '含 HUAWEICLOUD_HOME 或 env 注入指引');
rec('D11-32-no-en', '不出现英文整句 "KooCLI detected but cannot resolve the user home directory..."（反断言）',
  !EN_SENTENCE.test(err), err.slice(0, 140) || '（无文本）', '不含该英文整句');

// KooCLI 侧的沙箱 home 失败：用户可见下一步提示
const probe = await importHdk(hdkSrc, 'hcloud-probe.mjs');
const cls = probe.classifyHcloudProbe({ status: 1, stdout: '获取当前用户家目录失败', stderr: '' });
const nextStep = String(probe.hcloudProbeNextStep({ status: 'sandbox_home_failure' })).trim();
rec('D11-32-koocli-classified', '沙箱 home 失败被正确归类',
  cls?.errorCode === 'HCLOUD_SANDBOX_HOME_FAILURE' || cls?.status === 'sandbox_home_failure',
  { status: cls?.status, errorCode: cls?.errorCode }, 'HCLOUD_SANDBOX_HOME_FAILURE');
rec('D11-32-koocli-zh-next', 'KooCLI 沙箱 home 失败的下一步提示为中文且给替代路径',
  ZH.test(nextStep) && /主目录|沙箱|HCLOUD_BIN|终端/.test(nextStep), nextStep.slice(0, 140), '中文 + 替代路径');
rec('D11-32-koocli-no-en', 'KooCLI 侧不得以英文整句作为唯一提示（反断言）',
  !EN_SENTENCE.test(nextStep), nextStep.slice(0, 140), '不含该英文整句');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R14）；FAIL = 异常诊断未中文化/缺替代路径，非 harness 问题');
