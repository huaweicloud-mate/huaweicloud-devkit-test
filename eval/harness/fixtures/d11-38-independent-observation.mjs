// D11-38 独立可观测面双轨断言（范式③：不以自述自证）（P1）—— 可执行载体（真机）
//
// 判据（CSV::预期结果）：独立观测面反推的账号标识 == 账号 A 的真实标识，且与 effective.source 结论一致；
//   不得仅以工具自述字段作唯一证据。
//
// 三轨对照（本载体的核心）：
//   ① 自述轨：auth_status 的 effective.fingerprint（插件自己报的）
//   ② 独立文件轨：直接读凭证文件/env 计算 sha256(ak+sk)[:8]（绕过插件自述）
//   ③ 独立连通轨：用真凭证做一次只读调用，确认真实可达（自述「已登录」必须能被外部行为证伪）
//
// 真机口径：需真实凭证（运行器隔离 HOME，故不读 ~/.config 的 S1）——
//   先 `export HW_ACCESS_KEY=... HW_SECRET_KEY=... [HW_SECURITY_TOKEN=...] [HW_REGION=...]` 再跑；
//   无真凭证判 BLOCKED（不计 PASS/FAIL），由真机批次执行。
// 用法: node d11-38-independent-observation.mjs <hdk src> [--evid <dir>]
import { blocked, finish, fingerprint8, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-38';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-38-independent-observation.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const KEYS = ['HW_ACCESS_KEY', 'HW_SECRET_KEY', 'HW_SECURITY_TOKEN', 'HW_REGION', 'HUAWEICLOUD_REGION'];
const REAL = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
const iso = isolateHome('d11-38');
for (const k of KEYS) if (REAL[k]) process.env[k] = REAL[k];

if (!process.env.HW_ACCESS_KEY || !process.env.HW_SECRET_KEY) {
  blocked(CASE_ID,
    '需真机真云凭证：请先 export HW_ACCESS_KEY/HW_SECRET_KEY（运行器隔离 HOME，不读 ~/.config 的 S1）',
    evid);
}

const svc = await importHdk(hdkSrc, 'auth/service.mjs');
const { callTool } = await importHdk(hdkSrc, 'tools.mjs');

// ① 自述轨
const st = svc.getAuthStatus();
const selfFp = st?.effective?.fingerprint ?? st?.credentialPanel?.s1?.fingerprint ?? null;
const selfSource = st?.effective?.source ?? null;

// ② 独立文件/env 轨（不依赖插件自述）
const realFp = fingerprint8(process.env.HW_ACCESS_KEY, process.env.HW_SECRET_KEY);

// ③ 独立连通轨：真实只读调用（自述"已登录"须能被外部行为证实/证伪）
let reachable = false;
let reachNote = '';
try {
  const r = await callTool('huaweicloud_run_readonly_command', { args: ['ecs', 'ListServersDetails'], timeoutMs: 30000 });
  const blob = JSON.stringify(r ?? {});
  reachable = !/error|invalid|unauthor|forbidden/i.test(blob) || blob.includes('servers');
  reachNote = blob.slice(0, 110);
} catch (e) {
  reachNote = String(e?.message ?? e).slice(0, 110);
}

rec('D11-38-self-report', '自述轨给出生效账号指纹与来源（基线对照）',
  typeof selfFp === 'string' && selfFp.length >= 8 && typeof selfSource === 'string',
  { selfFingerprint: selfFp, selfSource }, '指纹 + source');
rec('D11-38-independent-match', '独立观测面（文件/env 反推）与自述指纹一致',
  selfFp === realFp, { 自述: selfFp, 独立反推: realFp }, realFp,
  '范式③：自述不得是唯一证据');
rec('D11-38-cross-track', '独立连通轨证实自述「已登录」为真（外部行为可证伪）',
  reachable, { 只读调用: reachNote }, '只读调用成功');
rec('D11-38-three-track-consistent', '三轨一致（自述 == 文件/env 反推 && 真实连通）',
  selfFp === realFp && reachable, { 自述: selfFp, 反推: realFp, 连通: reachable }, '三轨一致');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R2/R4 范式③ 独立观测）；FAIL = 自述与独立观侧面不一致，非 harness 问题');
