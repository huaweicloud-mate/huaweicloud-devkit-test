// D11-34 资源归零体验（P1）—— 可执行载体（真机）
//
// 判据（CSV::预期结果）：清理后返回中文归零报告（逐资源列出「已释放 / 未释放」+ 剩余计数），
//   未释放项附唯一补删命令；只读列表复核返回空（无残留）。
//
// 真机口径：需真实凭证（运行器隔离 HOME，不读 ~/.config 的 S1）——
//   先 `export HW_ACCESS_KEY=... HW_SECRET_KEY=... [HW_SECURITY_TOKEN=...] [HW_REGION=...]` 再跑；
//   无真凭证判 BLOCKED（exit 2，不计入 PASS/FAIL）。
//   创建-销毁（真建真删）由客户端 agent 在真机按同一判据执行并回填归零报告证据；
//   本载体负责「只读复核 + 归零报告契约」这一段，避免在无真机环境虚构资源操作结果。
// 口径：需求验收（UX-R12 资源归零）。实现前预期 FAIL。
// 用法: node d11-34-zeroing-report.mjs <hdk src> [--evid <dir>]
import { blocked, contaminatedHost, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-34';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-34-zeroing-report.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const contam = contaminatedHost();
console.log(`[HOST] ${contam.length ? 'CONTAMINATED' : 'CLEAN'}${contam.length ? ' :: ' + contam.join(', ') : ''}`);
if (contam.length) blocked(CASE_ID, `宿主未隔离：${contam.join(', ')}`, evid);

const KEYS = ['HW_ACCESS_KEY', 'HW_SECRET_KEY', 'HW_SECURITY_TOKEN', 'HW_REGION', 'HUAWEICLOUD_REGION'];
const REAL = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

const iso = isolateHome('d11-34');
for (const k of KEYS) {
  if (REAL[k]) process.env[k] = REAL[k];
}
if (!process.env.HW_ACCESS_KEY || !process.env.HW_SECRET_KEY) {
  blocked(CASE_ID,
    '需真机真云凭证：请先 export HW_ACCESS_KEY/HW_SECRET_KEY（运行器隔离 HOME，不读 ~/.config 的 S1）',
    evid);
}

const { callTool } = await importHdk(hdkSrc, 'tools.mjs');

// 只读复核：三类常见残留资源的列表
const PROBES = [
  ['ECS 云服务器', ['ecs', 'ListServersDetails']],
  ['EIP 弹性公网', ['vpc', 'ListPublicips']],
  ['EVS 云硬盘', ['evs', 'ListVolumes']],
];

const probeResults = [];
let connected = 0;
for (const [label, args] of PROBES) {
  try {
    const r = await callTool('huaweicloud_run_readonly_command', { args, timeoutMs: 60000 });
    const text = typeof r === 'string' ? r : JSON.stringify(r);
    const residual = (() => {
      try {
        const j = typeof r === 'object' ? r : JSON.parse(text);
        const list = j?.servers ?? j?.publicips ?? j?.volumes ?? j?.data ?? null;
        return Array.isArray(list) ? list.length : null;
      } catch { return null; }
    })();
    probeResults.push({ label, ok: true, residual, textLen: text.length });
    connected += 1;
  } catch (e) {
    probeResults.push({ label, ok: false, error: String(e?.message).slice(0, 100) });
  }
}

if (connected === 0) {
  blocked(CASE_ID, `只读复核三次调用均失败（需真机 + KooCLI 已登录）：${JSON.stringify(probeResults).slice(0, 200)}`, evid);
}

const wire = JSON.stringify(probeResults);
const totalResidual = probeResults.reduce((n, p) => n + (typeof p.residual === 'number' ? p.residual : 0), 0);

rec('D11-34-readonly-recheck', '真机只读复核可执行（ECS/EIP/EVS 三类列表）',
  connected === PROBES.length, { 成功: `${connected}/${PROBES.length}`, 明细: probeResults }, `${PROBES.length}/${PROBES.length}`);
rec('D11-34-report-zh', '归零报告为中文且逐资源列出（已释放/未释放 + 剩余计数）',
  /[\u4e00-\u9fff]/.test(wire) && /已释放|未释放|剩余/.test(wire),
  { 命中: (wire.match(/已释放|未释放|剩余[^",]{0,10}/) || ['（无归零报告字段）'])[0] },
  '含中文「已释放/未释放/剩余计数」逐项报告');
rec('D11-34-zero-conclusion', '零残留时给出明确中文结论（无残留 / 已归零）',
  /无残留|已归零|已清空/.test(wire),
  { 当前剩余合计: totalResidual, 结论命中: /无残留|已归零|已清空/.test(wire) }, '含「无残留/已归零」结论');
rec('D11-34-delete-hint', '未释放项附唯一补删命令（可复制执行）',
  /补删|删除命令|请执行[^\n]{0,20}(hcloud|npx)/.test(wire),
  { 命中: /补删|删除命令/.test(wire) }, '含补删命令');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R12，真机）；FAIL = 归零报告未实现，非 harness 问题');
