#!/usr/bin/env node
/**
 * D11-41 误导性归因矩阵（体验级 / 需求验收）
 *
 * 判据（范式②「回放差异分类」的归因正确性侧）：同一 SUT 在**不同故障场景**下的
 * 归因必须指向**真正原因**，且不得把「未配置 / 过期 / 沙箱不可用 / 未就绪」误报成
 * 「凭证无效」或「服务不可用」——用户凭错误文案就能判断下一步该做什么。
 *
 * 覆盖 4 个高频误报场景 + 2 个反误导断言：
 *   ① 占位符遮蔽（#570 类：<HW_ACCESS_KEY> / ${HW_SECRET_KEY} 被当有效凭证）
 *   ② STS 过期（不得误导成「AK 无效」）
 *   ③ KooCLI 未装 / 隐私待同意 / 沙箱 home 失败（三态归因分类）
 *   ④ 反误导：KooCLI 正常输出不得被判成故障
 *   ⑤ nextStep 可动作性（UX-R7，关联上游 #900）
 *
 * 用法: node d11-41-misleading-attribution.mjs <hdk src> [--evid <dir>]
 * 退出: 0 全通过 / 1 有 FAIL / 2 BLOCKED（宿主污染）
 */
import { rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';

import { blocked, contaminatedHost, finish, importHdk, parseArgs, rec } from './ux-common.mjs';

const CASE = 'D11-41';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error(`用法: node ${basename(process.argv[1])} <hdk src> [--evid <dir>]`);
  process.exit(2);
}

const contam = contaminatedHost();
if (contam.length) {
  blocked(CASE, `宿主受污染(${contam.join(', ')})——占位符/未配置场景需干净隔离宿主`, evid);
}

const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');
const probe = await importHdk(hdkSrc, 'hcloud-probe.mjs');

// ① 仅占位符 env、无 S1 → 必须判「未配置」，不得误报可用（#570 占位符遮蔽类防退化）
process.env.HW_ACCESS_KEY = '<HW_ACCESS_KEY>';
process.env.HW_SECRET_KEY = '${HW_SECRET_KEY}';
let missCode = null;
try {
  creds.resolveCredentials();
} catch (err) {
  missCode = err?.code ?? null;
}
rec(
  `${CASE}-placeholder-only`,
  '仅占位符 env 时判「未配置」（不得误报可用）',
  missCode === 'HDKIT_CRED_MISSING',
  missCode,
  'HDKIT_CRED_MISSING',
  '前置: #570「占位符遮蔽报连接成功」类缺陷防退化',
);

// ② 占位符 env + 真实 S1 → 必须采用 S1（占位符不得遮蔽真实凭证）
creds.writeGlobalCredentials({
  ak: 'D11REALAK000000000000',
  sk: 'D11REALSK000000000000',
  region: 'cn-north-4',
});
const resolved = creds.resolveCredentials();
rec(
  `${CASE}-placeholder-shadow`,
  '占位符 env 不得遮蔽真实 S1',
  resolved?.ak === 'D11REALAK000000000000',
  resolved?.ak,
  'D11REALAK000000000000',
);
delete process.env.HW_ACCESS_KEY;
delete process.env.HW_SECRET_KEY;

// ③ STS 过期：能解析出「已过期」，不得误导为「AK 无效」
// 注：parseStsExpiry 返回**毫秒**时间戳（credentials.mjs:120）。
const pastMs = Date.now() - 3600 * 1000;
const jwt = `x.${Buffer.from(JSON.stringify({ exp: Math.floor(pastMs / 1000) })).toString('base64url')}.y`;
const expiry = creds.parseStsExpiry({ securityToken: jwt, expiresAtEnv: '' });
rec(
  `${CASE}-sts-expiry`,
  'STS 过期可由 token 解析（不误导为 AK 无效）',
  typeof expiry === 'number' && expiry < Date.now(),
  expiry,
  `早于当前时间(ms)=${Date.now()}`,
);

// ④ KooCLI 三态归因分类（纯函数，确定性）
const probeCases = [
  ['not_found', { status: null, error: { code: 'ENOENT' }, stdout: '', stderr: '' }, 'HCLOUD_NOT_FOUND'],
  ['privacy_pending', { status: 1, stdout: '同意并继续使用', stderr: '' }, 'HCLOUD_PRIVACY_PENDING'],
  [
    'sandbox_home_failure',
    { status: 1, stdout: '', stderr: '获取当前用户家目录失败' },
    'HCLOUD_SANDBOX_HOME_FAILURE',
  ],
];
for (const [name, synthetic, expectedCode] of probeCases) {
  const classified = probe.classifyHcloudProbe(synthetic);
  rec(
    `${CASE}-koocli-${name}`,
    `KooCLI「${name}」归因分类正确`,
    classified.errorCode === expectedCode,
    classified.errorCode,
    expectedCode,
  );
}

// ⑤ 反误导：KooCLI 正常输出不得被判成故障
const okProbe = probe.classifyHcloudProbe({ status: 0, stdout: 'KooCLI version 7.2.12', stderr: '' });
rec(
  `${CASE}-koocli-ok`,
  'KooCLI 正常不得误报故障',
  okProbe.status === 'ok' || okProbe.status === 'version_mismatch',
  okProbe.status,
  'ok',
);

// ⑥ nextStep 可动作性（UX-R7 / 上游 #900）
const nextStep = String(probe.hcloudProbeNextStep({ status: 'not_found' })).trim();
rec(
  `${CASE}-nextstep-actionable`,
  'nextStep 为可直接执行的命令（非英文散文）',
  /^(npx |hcloud )/.test(nextStep),
  nextStep.slice(0, 72),
  '以 npx / hcloud 开头',
  'UX-R7 / 上游 #900——当前为英文长句，属已知缺口',
);

// 自清理：本夹具会写入 S1 凭证（② 占位符遮蔽场景）；删掉以免污染后续夹具/共享 HOME
rmSync(join(homedir(), '.config'), { recursive: true, force: true });

finish(CASE, evid, '口径: 需求验收（误导性归因 + 可动作性）；FAIL=归因/引导不达标（对齐上游 #900）');
