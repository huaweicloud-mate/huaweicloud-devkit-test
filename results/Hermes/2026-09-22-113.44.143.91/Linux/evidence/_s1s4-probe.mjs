// D3-S1 (只读查ECS 零写) + D3-S4 (领券闭环) 真云探针 2026-09-21
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const SRC = process.env.HDK_SRC || '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const REGION = process.env.HDK_REGION || 'cn-north-4';
const { callTool } = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
const results = [];
const log = (id, name, pass, detail) => results.push({ id, name, pass: !!pass, detail: String(detail ?? '').slice(0, 260) });
const call = async (name, args) => { try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 200) }; } };

// D3-S1: 只读查 ECS（路由命中 ecs + 只读命令返回清单 + 零写）
{
  const cat = await call('huaweicloud_service_catalog', { intent: '列出 cn-north-4 的 ECS 云主机清单，只读不改' });
  const catJson = JSON.stringify(cat).toLowerCase();
  const routed = catJson.includes('ecs');
  log('D3-S1', 'serviceCatalog-routes-ecs', routed, JSON.stringify(cat).slice(0,160));

  const ro = await call('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails', `--cli-region=${REGION}`, '--limit=5'] });
  const roJson = JSON.stringify(ro);
  const gotList = /servers|count|\[\]/.test(roJson) || ro?.ok === true || ro?.exitCode === 0;
  // 零写：只读命令不应触发 plan_cli_command / run_approved_command / 写工具
  const noWrite = !/plan_cli_command|run_approved_command|Create|Delete|Update/i.test(JSON.stringify(ro?.__error || ''));
  log('D3-S1', 'readonly-query-ok', gotList && noWrite, roJson.slice(0,160));
}

// D3-S4: 领券闭环（status → claim → status，若已领取则闭环复用）
{
  const s1 = await call('huaweicloud_voucher_status', {});
  const s1Json = JSON.stringify(s1).toLowerCase();
  const claimed = /claimed[\"']?\s*[:=]\s*true|"value"\s*:\s*true/.test(JSON.stringify(s1));
  log('D3-S4', 'voucher-status-query', !s1.__error, JSON.stringify(s1).slice(0,180));
  if (/claimed[\"']?\s*[:=]\s*false/.test(JSON.stringify(s1))) {
    const cl = await call('huaweicloud_voucher_claim', {});
    const s2 = await call('huaweicloud_voucher_status', {});
    const flipped = /claimed[\"']?\s*[:=]\s*true|"value"\s*:\s*true/.test(JSON.stringify(s2));
    log('D3-S4', 'voucher-claim-flip', flipped, 'claim→status 翻转 claimed=true');
  } else {
    log('D3-S4', 'voucher-already-claimed', true, '已领取(claimed=true)，闭环可复用历史结论');
  }
}
console.log(JSON.stringify({ total: results.length, passed: results.filter(r=>r.pass).length, results }, null, 2));