// D11-22 KooCLI 首跑隐私协议同意体验（P1）—— 可执行载体
//
// 判据（CSV::预期结果）：返回含中文说明「首次运行需同意隐私协议」且给出两条路径
//   （用户授权后由 Agent 代答 stdin=y / 用户自行在终端执行）；
//   不出现英文 "KooCLI requires accepting its privacy agreement." 与「您输入的是无效字符」裸串。
// 指引来源：hcloud-probe.mjs(privacy_pending) + service.mjs:234-238
//
// 做法：用 hcloud-probe 的纯函数面构造 privacy_pending 态（无需真实 KooCLI 首跑），
// 断言归因分类正确 + 面向用户的下一步指引是否「中文 + 两条路径」。
// 口径：需求验收（UX-R13 首次使用必踩点）。实现前预期 FAIL。
// 用法: node d11-22-koocli-privacy.mjs <hdk src> [--evid <dir>]
import { blocked, finish, importHdk, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-22';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-22-koocli-privacy.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const probe = await importHdk(hdkSrc, 'hcloud-probe.mjs');

// 真实首跑时 KooCLI 会打印中文隐私协议提示（分类器按此识别）
const synthetic = { status: 1, stdout: '同意并继续使用(y)/不同意并退出(N)', stderr: '' };
const classified = probe.classifyHcloudProbe(synthetic);
const nextStep = String(probe.hcloudProbeNextStep({ status: 'privacy_pending' })).trim();

rec('D11-22-classified', 'privacy_pending 归因分类正确',
  classified?.errorCode === 'HCLOUD_PRIVACY_PENDING' || classified?.status === 'privacy_pending',
  { status: classified?.status, errorCode: classified?.errorCode }, 'HCLOUD_PRIVACY_PENDING');
rec('D11-22-zh', '下一步指引含中文说明（首次运行需同意隐私协议）',
  /[\u4e00-\u9fff]/.test(nextStep) && /隐私协议|同意/.test(nextStep), nextStep.slice(0, 130), '含中文「隐私协议」说明');
rec('D11-22-two-paths', '给出两条可执行路径（Agent 代答 stdin=y / 用户自行终端执行）',
  /stdin\s*=\s*y|stdin=y|代答/.test(nextStep) && /终端|terminal/.test(nextStep),
  { 代答路径: /stdin\s*=\s*y|代答/.test(nextStep), 终端路径: /终端|terminal/.test(nextStep) },
  '含 stdin=y 代答 + 用户自行终端执行两条路径');
rec('D11-22-no-en', '不出现英文整句 "KooCLI requires accepting its privacy agreement."（反断言）',
  !/KooCLI requires accepting its privacy agreement/.test(nextStep), nextStep.slice(0, 130), '不含该英文整句');
rec('D11-22-no-invalid-char', '不出现「您输入的是无效字符」裸串（反断言）',
  !/无效字符|invalid character/i.test(nextStep), nextStep.slice(0, 130), '不含无效字符提示');

finish(CASE_ID, evid, '口径: 需求验收（UX-R13）；FAIL = 文案未中文化/缺两条路径，非 harness 问题');
