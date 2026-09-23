// 场景可行性探测：沙箱配额 + 领券状态（用于 D3-S3/S4/S7 判定）
import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';

const OUT = 'file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-24-1.94.218.129/Linux/evidence/d3-scenario-feasibility/stdout.log';
const out = {};

try {
  const r = await callTool('huaweicloud_sandbox_check_user', {});
  out.sandbox_check_user = r;
} catch (e) { out.sandbox_check_user = { error: String(e.message || e) }; }

try {
  const r = await callTool('huaweicloud_voucher_status', {});
  out.voucher_status = r;
} catch (e) { out.voucher_status = { error: String(e.message || e) }; }

writeFileSync(new URL(OUT), JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify(out, null, 2));