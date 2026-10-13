#!/usr/bin/env node
/**
 * D11-44 故障注入矩阵（体验级 / 需求验收）
 *
 * 判据（范式④「度量对照」的故障侧 + 范式②「归因正确性」）：注入 4 类网络故障后，
 * 插件必须 **① 有界返回**（不无限挂起）+ **② 归因不误导**（网络故障不得报成「凭证无效」）
 * + **③ 反误导对照**（真 401 必须明确指向 AK/SK）。
 *
 * 注入方式：替换 `globalThis.fetch`（`validateIamCredentials` 走全局 fetch；先清空代理 env
 * 以免走 undici dispatcher 绕过 mock）。模拟 fetch 遵守 `AbortSignal`，与真实行为一致。
 *
 * 覆盖：
 *   ① 网络不可达（ENOTFOUND）      → 有界 + skipped + 不报「凭证无效」
 *   ② 请求挂起                     → 在 timeoutMs 余量内返回（AbortSignal 生效）
 *   ③ HTTP 429（限流）             → 归因含 429 + 不报「凭证无效」
 *   ④ HTTP 404（端点/网络）        → 归因含 404
 *   ⑤ 反误导对照：HTTP 401         → 必须明确指向 AK/SK（真原因不得被弱化）
 *
 * 用法: node d11-44-fault-injection.mjs <hdk src> [--evid <dir>]
 * 退出: 0 全通过 / 1 有 FAIL / 2 BLOCKED（宿主污染）
 */
import { basename } from 'node:path';

import { blocked, contaminatedHost, finish, importHdk, parseArgs, rec } from './ux-common.mjs';

const CASE = 'D11-44';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error(`用法: node ${basename(process.argv[1])} <hdk src> [--evid <dir>]`);
  process.exit(2);
}
const contam = contaminatedHost();
if (contam.length) blocked(CASE, `宿主受污染(${contam.join(', ')})`, evid);

// 清空代理 env：避免 getProxyDispatcher 走 undici 绕过 globalThis.fetch mock
for (const k of ['HTTPS_PROXY', 'HTTP_PROXY', 'ALL_PROXY', 'https_proxy', 'http_proxy', 'all_proxy']) {
  delete process.env[k];
}

const { validateIamCredentials } = await importHdk(hdkSrc, 'auth/credential-validator.mjs');
const CREDS = { ak: 'D11AK0000000000000000', sk: 'D11SK0000000000000000', region: 'cn-north-4' };

function mockFetch(impl) {
  globalThis.fetch = impl;
}
function timed(promise) {
  const t0 = Date.now();
  return promise.then((value) => ({ value, ms: Date.now() - t0 }));
}

// ① 网络不可达
mockFetch(() => {
  const e = new Error('getaddrinfo ENOTFOUND iam.cn-north-4.myhuaweicloud.com');
  e.code = 'ENOTFOUND';
  return Promise.reject(e);
});
const r1 = await timed(validateIamCredentials({ ...CREDS }));
rec(
  `${CASE}-network-bounded`,
  '网络不可达时有界返回且标记 skipped',
  r1.value?.skipped === true && r1.ms < 5000,
  { skipped: r1.value?.skipped, ms: r1.ms },
  { skipped: true, ms: '<5000' },
);
rec(
  `${CASE}-network-attribution`,
  '网络不可达不得归因为「凭证无效」',
  !/AK\/SK is invalid|AK\/SK 无效/i.test(String(r1.value?.error)),
  String(r1.value?.error).slice(0, 96),
  '不出现「AK/SK is invalid」',
  '失败=归因误导（用户会误以为自己 AK/SK 配错）',
);

// ② 请求挂起（模拟 fetch 尊重 AbortSignal，与真实实现一致）
const TIMEOUT = 600;
mockFetch(
  (_url, opts) =>
    new Promise((_resolve, reject) => {
      opts?.signal?.addEventListener('abort', () => {
        const e = new Error('This operation was aborted');
        e.name = 'AbortError';
        reject(e);
      });
    }),
);
const r2 = await timed(validateIamCredentials({ ...CREDS, timeoutMs: TIMEOUT }));
rec(
  `${CASE}-hang-bounded`,
  `请求挂起时在超时余量内返回（timeoutMs=${TIMEOUT}）`,
  r2.ms < TIMEOUT + 2500 && r2.value?.skipped === true,
  { ms: r2.ms, skipped: r2.value?.skipped },
  { ms: `<${TIMEOUT + 2500}`, skipped: true },
  '失败=无上界等待（agent 会长时间无响应）',
);

// ③ 429 限流 / ④ 404 端点
for (const [status, label] of [
  [429, '限流'],
  [404, '端点/网络'],
]) {
  mockFetch(
    () =>
      Promise.resolve({
        status,
        text: () => Promise.resolve(JSON.stringify({ error: { message: `HTTP ${status} synthetic` } })),
      }),
  );
  const r = await timed(validateIamCredentials({ ...CREDS }));
  rec(
    `${CASE}-http-${status}`,
    `HTTP ${status}（${label}）归因含状态码且不误报凭证无效`,
    String(r.value?.error).includes(String(status)) &&
      !/AK\/SK is invalid|AK\/SK 无效/i.test(String(r.value?.error)),
    String(r.value?.error).slice(0, 96),
    `含 ${status} 且不出现「AK/SK is invalid」`,
  );
}

// ⑤ 反误导对照：真 401 必须明确指向 AK/SK（真原因不得被弱化）
mockFetch(
  () =>
    Promise.resolve({
      status: 401,
      text: () => Promise.resolve(JSON.stringify({ error: { message: 'Incorrect IAM authentication information' } })),
    }),
);
const r5 = await timed(validateIamCredentials({ ...CREDS }));
rec(
  `${CASE}-http-401-attribution`,
  'HTTP 401 必须明确指向 AK/SK（真原因不弱化）',
  r5.value?.valid === false && /AK\/SK/i.test(String(r5.value?.error)),
  String(r5.value?.error).slice(0, 96),
  'valid=false 且提及 AK/SK',
);

// ⑥ 可动作性（UX-R7 / 上游 #900）：错误须附可执行 action
rec(
  `${CASE}-actionable`,
  '故障错误须给可执行 action（非纯英文散文）',
  typeof r1.value?.action === 'string' && r1.value.action.length > 0,
  r1.value?.action ?? null,
  '非空 action（如 npx / hcloud 开头）',
  'UX-R7 / 上游 #900——当前错误对象无 action 字段，属已知缺口',
);

globalThis.fetch = undefined;
finish(CASE, evid, '口径: 需求验收（故障注入下有界性与归因正确性）；FAIL=挂起/归因误导/缺可动作项');
