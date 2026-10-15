// D11-35 沙箱连不通的排障引导（P1）—— 可执行载体（沙箱/devbridge 环境）
//
// 判据（CSV::预期结果）：连接超时返回中文提示 + 下一步（重试 / 换区域 / 查 devbridge 状态）；
//   预览 URL 不可达返回中文排障清单（nginx 状态 / 隧道 / 端口）而非裸错误；两情形各给出唯一可执行动作。
//
// 真机口径：本用例需要沙箱与 devbridge 通道。本载体先探测沙箱可用性，
//   不可用（无沙箱凭证/未连 devbridge）即判 BLOCKED（不计 PASS/FAIL），由真机批次执行。
// 用法: node d11-35-sandbox-unreachable-guide.mjs <hdk src> [--evid <dir>]
import { blocked, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-35';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-35-sandbox-unreachable-guide.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const iso = isolateHome('d11-35');
const { callTool } = await importHdk(hdkSrc, 'tools.mjs');

// 探测沙箱可用性：无凭证/无沙箱环境时工具会以英文/骨架错误返回 → 判 BLOCKED
let probeText = '';
let probeThrew = false;
try {
  const r = await callTool('huaweicloud_sandbox_check_user', {});
  probeText = JSON.stringify(r ?? {});
} catch (e) {
  probeThrew = true;
  probeText = String(e?.message ?? e);
}
const ZH = /[\u4e00-\u9fff]/;
const sandboxReady = probeText.includes('"ok":true') || /sandbox|沙箱/i.test(probeText) && ZH.test(probeText) && !probeThrew;
if (!sandboxReady) {
  blocked(CASE_ID,
    `需沙箱环境：沙箱探针未就绪（threw=${probeThrew}，返回片段=${probeText.slice(0, 90)}）；请由真机批次在具备 devbridge 通道的客户端执行`,
    evid);
}

// ① 连接不可达：用一个不可达目标触发超时/失败路径
let connText = '';
try {
  const r = await callTool('huaweicloud_sandbox_connect', { region: 'cn-north-4', timeoutMs: 8000 });
  connText = JSON.stringify(r ?? {});
} catch (e) {
  connText = String(e?.message ?? e);
}

rec('D11-35-connect-zh', '连接失败返回中文提示',
  ZH.test(connText) && /超时|失败|连不上|不可达/.test(connText), connText.slice(0, 150), '中文失败提示');
rec('D11-35-connect-next', '给出下一步（重试 / 换区域 / 查 devbridge 状态）',
  /重试|重新|换(一个)?区域|devbridge|隧道/.test(connText), connText.slice(0, 150), '含唯一可执行动作');
rec('D11-35-no-naked-error', '不返回裸错误（英文 stack / 原始 JSON 直出）（反断言）',
  !/^\s*\{[^}]*"(error|code)"/.test(connText.trim()) || ZH.test(connText), connText.slice(0, 120), '非裸错误');

// ② 预览 URL 不可达：排障清单
let previewText = '';
try {
  const r = await callTool('huaweicloud_sandbox_deploy_check', {});
  previewText = JSON.stringify(r ?? {});
} catch (e) {
  previewText = String(e?.message ?? e);
}
rec('D11-35-preview-checklist-zh', '预览不可达返回中文排障清单（nginx 状态 / 隧道 / 端口）',
  ZH.test(previewText) && /nginx|隧道|端口/.test(previewText), previewText.slice(0, 150), '含排障清单项');
rec('D11-35-preview-action', '预览排障给出唯一可执行动作',
  /重试|重新部署|检查|npx huaweicloud-devkit/.test(previewText), previewText.slice(0, 150), '含可执行动作');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R12/R14 沙箱排障）；FAIL = 排障引导未中文/不可执行，非 harness 问题');
