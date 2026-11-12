// EXP-E05 每日测试探针（真实执行，SUT=npm huaweicloud-devkit@2.0.0-next.3 (gitHead 4b718720)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/dist';
const CORE = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core';
const HDK = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-11-13-120.46.222.180/Linux/evidence/EXP-E05/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261113060346';
const META = { case: 'EXP-E05', assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'npm huaweicloud-devkit@2.0.0-next.3 (gitHead 4b718720)' };
function finish(r) { const out = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('EXP-E05 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }

async function run() {
  const { callTool: _callTool } = await _m('tools.js');
const __GATED__ = new Set(['huaweicloud_auth_status','huaweicloud_auth_init','huaweicloud_auth_switch','huaweicloud_check_cli','huaweicloud_show_profile_redacted','huaweicloud_list_operations','huaweicloud_list_regions','huaweicloud_run_readonly_command','huaweicloud_plan_cli_command','huaweicloud_run_approved_command','huaweicloud_service_catalog','huaweicloud_sandbox_connect','huaweicloud_voucher_claim','huaweicloud_competition_voucher_claim']);
const callTool = (n, a = {}, o = {}) => _callTool(n, __GATED__.has(n) ? { ...a, vendorConfirmed: (a && a.vendorConfirmed) || 'Huawei Cloud' } : a, o);
  const intent = "\u770b\u4e00\u4e0b\u6211\u7684\u4e91\u6570\u636e\u5e93MySQL\u5b9e\u4f8b\u7684\u72b6\u6001";
  if (!intent) return { status: 'BLOCKED', why: 'eval-set 未提供该意图文本', actual: 'no-intent' };
  const r = await callTool('huaweicloud_service_catalog', { intent });
  const svcs = Array.isArray(r?.recommendedServices) ? r.recommendedServices.map(String) : [];
  const actual = svcs.join(', ');
  const pass = !actual.includes('Run hcloud --help') && actual.length > 0;
  return { status: pass ? 'PASS' : 'FAIL', actual: actual.slice(0,180) };
}

run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
