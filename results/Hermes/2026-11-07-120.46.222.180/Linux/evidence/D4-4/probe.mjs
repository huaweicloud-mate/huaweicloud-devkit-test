// D4-4 写操作审批门（统一定义）探针 —— Hermes Linux 2026-10-29 真机重跑
// 断言：所有写操作（Create/Delete/Change*）均须经审批门拦截（plan 判 deny + 审批 token），
//       无审批不可执行。重点覆盖 Change* 写动词漏拦截缺口。
// 根因（FAIL）：safety/policy.json:27 writeOperationPrefixes 缺 "Change"/"Modify" 等前缀，
//   ChangeServerOs*/ChangeVpc/ChangeInstanceConfiguration/ChangeVolumeType 判 allow(risk=unknown_read)。
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SRC = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
const EVID = dirname(fileURLToPath(import.meta.url));
const sp = await import('file://' + SRC);
const { classifyTextCommand, classifyHcloudArgs } = sp;

const lines = [];
const records = [];

function dec(fn) { try { return fn().decision; } catch (e) { return 'THROW:' + e.message; } }
function risk(fn) { try { return fn().risk; } catch (e) { return 'THROW'; } }

function t(id, name, got, expected, detail) {
  const pass = got === expected;
  records.push({ id, name, pass, actual: got, expected, detail });
  lines.push(`  [${pass ? 'OK' : '<<< 漏拦截'}] ${name} -> ${got} (exp ${expected})`);
  return pass;
}

lines.push('=== D4-4 写操作审批门（含 Change* 漏拦截检测）===');

// 1) 基线：Create/Delete 应被 deny（写操作）
let baselineOk = true;
for (const [args, exp] of [["hcloud ecs CreateServers --server.name x", 'deny'], ["hcloud vpc DeleteVpc --vpc_id x", 'deny']]) {
  baselineOk = t('D4-4-baseline', args, dec(() => classifyTextCommand(args)), exp, 'create/delete 基线') && baselineOk;
}

// 2) Change* 写动词（当前 writeOperationPrefixes 缺 Change，会漏拦截为 allow）
const changeCases = [
  ['hcloud ecs ChangeServerOsWithoutCloudInit --server_id x', 'deny'],
  ['hcloud ecs ChangeServerOsWithCloudInit --server_id x', 'deny'],
  ['hcloud vpc ChangeVpc --vpc_id x', 'deny'],
  ['hcloud rds ChangeInstanceConfiguration --instance_id x', 'deny'],
  ['hcloud evs ChangeVolumeType --volume_id x', 'deny'],
];
let changeBlocked = 0;
for (const [cmd, exp] of changeCases) {
  const got = dec(() => classifyTextCommand(cmd));
  const gd = t('D4-4-change', cmd, got, exp, classifyTextCommand(cmd) ? JSON.stringify(classifyTextCommand(cmd)) : '');
  if (got === 'deny') changeBlocked++;
}

// 3) classifyHcloudArgs 直调（写动词按 args 分类）——同样覆盖 Change*
for (const [args, expDec, expRisk] of [
  [['ecs', 'ChangeServerOsWithoutCloudInit'], 'deny', 'write'],
  [['vpc', 'ChangeVpc'], 'deny', 'write'],
  [['rds', 'ChangeInstanceConfiguration'], 'deny', 'write'],
]) {
  const r = classifyHcloudArgs(args, {});
  records.push({ id: 'D4-4-args', name: `hcloud ${args.join(' ')}`, pass: r.decision === expDec && r.risk === expRisk, actual: `${r.decision}/${r.risk}`, expected: `${expDec}/${expRisk}`, detail: '' });
  lines.push(`  [${(r.decision === expDec && r.risk === expRisk) ? 'OK' : '<<< 误判'}] hcloud ${args.join(' ')} -> decision=${r.decision} risk=${r.risk} (exp ${expDec}/${expRisk})`);
  if (r.decision === 'deny') changeBlocked++;
}

const totalChange = changeCases.length + 3; // 5 text + 3 args
const pass = baselineOk && changeBlocked === totalChange;
lines.push(`RESULT: ${pass ? 'PASS' : 'FAIL'}  Change* 拦截 ${changeBlocked}/${totalChange}; 基线 Create/Delete ${baselineOk ? 'deny' : '异常'}`);
lines.push('根因: safety/policy.json:27 writeOperationPrefixes 缺 Change 前缀 -> Change* 判 allow(risk=unknown_read)');

const out = lines.join('\n') + '\n';
writeFileSync(join(EVID, 'stdout.txt'), out, 'utf8');

const status = pass ? 'PASS' : 'FAIL';
const why = 'safety/policy.json:27 writeOperationPrefixes 缺 Change 前缀，ChangeServerOs*/ChangeVpc/ChangeInstanceConfiguration/ChangeVolumeType 判 allow(risk=unknown_read)，写操作审批门漏拦截';
const executedAt = new Date().toISOString().replace(/[-:TZ]/g, '').slice(0, 14);
writeFileSync(join(EVID, 'stdout.log'), JSON.stringify({ status, executedAt, why }, null, 2), 'utf8');

console.log(out);
console.log(`[D4-4] status=${status} changeBlocked=${changeBlocked}/${totalChange}`);
process.exit(0);