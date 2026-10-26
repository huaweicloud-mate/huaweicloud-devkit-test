#!/usr/bin/env node
// probe.mjs — D3-C7 跨区域资源操作引导（区域维度，真云）
// 唯一断言：①plan 命令必须含 --cli-region=ap-southeast-3 ②区域不可用→code=Ecs.0021 ③资源不存在→code=Ecs.0200
// 另：若可创建弹性 IP（最小规格）→命令带 region→立即释放→只读验证归零。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const TARGET = 'ap-southeast-3';
const HOME_REGION = process.env.HW_REGION || 'cn-north-4';
const EVID = process.env.EVID_DIR;
const HDK_SRC = process.env.HDK_SRC || '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const TS = String(Date.now()).slice(-10);
const EIP_NAME = `tctest-hermes-${TS}`;

const { callTool } = await import(pathToFileURL(join(HDK_SRC, 'tools.mjs')).href);
const sh = (cmd) => { const r = spawnSync('hcloud', cmd, { encoding: 'utf8', timeout: 120000 }); return { code: r.status, out: ((r.stdout || '') + (r.stderr || '')).trim() }; };
async function call(n, a) { try { return await callTool(n, a); } catch (e) { return { __error: String(e).slice(0, 260) }; } }
const rec = [];
const log = (name, pass, detail) => { rec.push({ name, pass: !!pass, detail: String(detail).slice(0, 320) }); console.log(`${pass ? 'PASS' : 'FAIL'}\t${name}\t${detail}`); };
const codeOf = (s) => (/"code"\s*:\s*"([^"]+)"/.exec(s || '') || [])[1] || '';

let eipId = null;
try {
  // ①/② plan 只读命令，断言命令含目标 region（参数级断言）
  const args = ['ECS', 'ListServersDetails', `--cli-region=${TARGET}`];
  const plan = await call('huaweicloud_plan_cli_command', { args, allowWrites: false });
  const planStr = JSON.stringify(plan || {});
  log('plan含--cli-region=ap-southeast-3', planStr.includes(`--cli-region=${TARGET}`), planStr.slice(0, 260));

  // ③ get_regional_availability 预查
  const ra = await call('huaweicloud_get_regional_availability', { service: 'ecs', region: TARGET });
  log('get_regional_availability(ecs,ap-southeast-3)', !ra.__error, JSON.stringify(ra).slice(0, 260));

  // ④ 执行只读查询 → 观察错误码
  const run = await call('huaweicloud_run_readonly_command', { args });
  const roCode = codeOf(run?.stdout || JSON.stringify(run));
  log('跨区只读查询', !run?.__error, `code=${roCode} ${JSON.stringify(run).slice(0, 220)}`);

  // ⑤ 资源不存在 / 区域不可用 的精确错误码断言（Ecs.0021 或 Ecs.0200）
  const probe = sh(['ECS', 'ShowServer', '--server_id=00000000-0000-0000-0000-000000000000', `--cli-region=${TARGET}`]);
  const pCode = codeOf(probe.out);
  log('不存在资源精确错误码(Ecs.0200/Ecs.0021)', pCode === 'Ecs.0200' || pCode === 'Ecs.0021', `code=${pCode} ${probe.out.slice(0, 220)}`);

  // ⑥ 若目标区可用则创建最小 EIP → 断言命令带 region → 释放 → 归零
  const listEip = sh(['EIP', 'ListPublicips', `--cli-region=${TARGET}`]);
  const createAttempt = sh(['EIP', 'CreatePublicip', `--publicip.type=5_bgp`, '--publicip.ip_version=4',
    '--bandwidth.name=' + EIP_NAME, '--bandwidth.size=1', '--bandwidth.share_type=PER', '--bandwidth.charge_mode=traffic',
    `--cli-region=${TARGET}`]);
  const cCode = codeOf(createAttempt.out);
  if (/error/i.test(createAttempt.out) || cCode) {
    log('跨区创建EIP', cCode === 'Ecs.0021' || cCode === 'Ecs.0200', `code=${cCode} ${createAttempt.out.slice(0, 220)} (跨区不可用则命中区域错误码，符合契约之一)`);
  } else {
    eipId = (/"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(createAttempt.out) || [])[1] || null;
    log('跨区创建EIP', !!eipId, `id=${eipId}`);
    if (eipId) {
      const del = sh(['EIP', 'DeletePublicip', `--publicip_id=${eipId}`, `--cli-region=${TARGET}`]);
      const after = sh(['EIP', 'ListPublicips', `--cli-region=${TARGET}`]);
      log('释放EIP并归零', del.code === 0 && !after.out.includes(eipId), `del=${del.code} 归零=${!after.out.includes(eipId)}`);
    }
  }
} catch (e) {
  log('probe_error', false, e.message);
} finally {
  if (eipId) { try { sh(['EIP', 'DeletePublicip', `--publicip_id=${eipId}`, `--cli-region=${TARGET}`]); } catch {} }
}

const failed = rec.filter((x) => !x.pass).length;
const out = JSON.stringify({ status: failed === 0 ? 'PASS' : 'FAIL', caseId: 'D3-C7', title: '跨区域资源操作引导（区域维度）',
  expected: '命令含 --cli-region=目标区；区域不可用→Ecs.0021；资源不存在→Ecs.0200；创建资源100%释放归零',
  total: rec.length, passed: rec.length - failed, failed, results: rec,
  executedAt: new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14), probe: 'probe.mjs' }, null, 2);
if (EVID) { const d = join(EVID, 'D3-C7'); mkdirSync(d, { recursive: true }); writeFileSync(join(d, 'stdout.log'), out, 'utf8'); }
console.log('\n' + out);
