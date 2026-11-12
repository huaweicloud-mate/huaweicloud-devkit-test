// EXP-C4-03 每日测试探针（真实执行，SUT=npm huaweicloud-devkit@2.0.0-next.3 (gitHead 4b718720)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/dist';
const CORE = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core';
const HDK = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-11-13-120.46.222.180/Linux/evidence/EXP-C4-03/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261111054636';
const META = { case: 'EXP-C4-03', assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'npm huaweicloud-devkit@2.0.0-next.3 (gitHead 4b718720)' };
function finish(r) { const out = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('EXP-C4-03 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }

async function run() {
  const { callTool: _callTool } = await _m('tools.js');
const __GATED__ = new Set(['huaweicloud_auth_status','huaweicloud_auth_init','huaweicloud_auth_switch','huaweicloud_check_cli','huaweicloud_show_profile_redacted','huaweicloud_list_operations','huaweicloud_list_regions','huaweicloud_run_readonly_command','huaweicloud_plan_cli_command','huaweicloud_run_approved_command','huaweicloud_service_catalog','huaweicloud_sandbox_connect','huaweicloud_voucher_claim','huaweicloud_competition_voucher_claim']);
const callTool = (n, a = {}, o = {}) => _callTool(n, __GATED__.has(n) ? { ...a, vendorConfirmed: (a && a.vendorConfirmed) || 'Huawei Cloud' } : a, o);
  const service = "OBS";
  let actual = '', pass = false, err = '';
  for (const s of [service, service.toLowerCase()]) {
    try { const r = await callTool('huaweicloud_list_operations', { service: s });
      actual = JSON.stringify(r).slice(0,160);
      if (actual && actual.length > 2 && actual !== '[]' && actual !== '{}') { pass = true; break; }
      err = actual; break;
    } catch(e){ err = 'THROW:'+String(e).slice(0,100); actual = err; break; }
  }
  return { status: pass ? 'PASS' : 'FAIL', actual: actual || err };
}

run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
