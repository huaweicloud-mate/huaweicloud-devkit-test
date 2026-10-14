#!/usr/bin/env node
// D4-20 / D4-24 审批令牌生命周期源码级直调验证 (1.1.8-next.3)
// 验证点:
//   D4-20 无效/过期令牌拒绝且零操作 (approval token lifecycle: valid/expired/already_consumed/not_found)
//   D4-24 confirmToken 过期/未找到 → 拒绝重复确认 (precise JSON contract: CONFIRM_TOKEN_EXPIRED / CONFIRM_TOKEN_NOT_FOUND)
// probe-remaining.mjs 里的 grep 串 ('Invalid or expired approval token'/'confirmToken not found or expired')
// 是旧版字符串，1.1.8-next.3 (#745) 已改为结构化状态机 + 结构化 code，故本探针改为直调真实函数核验。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SRC = process.env.HDK_PLUGIN_SRC || join(homedir(), 'devkit-test', 'Hermes', 'hdk', 'plugins', 'huaweicloud-core');
const hdkCli = await import(pathToFileURL(join(SRC, 'src', 'hcloud-cli.mjs')).href);
const tools = await import(pathToFileURL(join(SRC, 'src', 'tools.mjs')).href);

const results = { D4_20: [], D4_24: [] };
function check(dim, name, cond, detail = '') {
  results[dim].push({ name, pass: !!cond, detail: String(detail).slice(0, 200) });
  console.log(`${cond ? 'PASS' : 'FAIL'}  [${dim.replace('_', '-')}] ${name}${detail ? ' | ' + detail : ''}`);
}

const rawArgs = ['ECS', 'CreateServers', '--server.name=t', '--server.adminPass=Hdk@A1a0000'];

try {
  const token = hdkCli.createApprovalToken(rawArgs);
  check('D4_20', 'createApprovalToken 生成令牌', typeof token === 'string' && token.length > 0, String(token).slice(0, 12));

  const sValid = hdkCli.inspectApprovalToken(token);
  check('D4_20', '新令牌 state=valid', sValid?.state === 'valid', sValid?.state);

  const consumed = hdkCli.consumeApprovalToken(token);
  check('D4_20', 'consumeApprovalToken 首次消费返回存储条目(非空)', consumed != null, JSON.stringify(consumed).slice(0, 60));

  const sConsumed = hdkCli.inspectApprovalToken(token);
  check('D4_20', '消费后 state=already_consumed(墓碑)', sConsumed?.state === 'already_consumed', sConsumed?.state);

  const replay = hdkCli.consumeApprovalToken(token);
  check('D4_20', '二次消费不可重放(返回 null)', replay == null, JSON.stringify(replay));

  const sNotFound = hdkCli.inspectApprovalToken('00000000-0000-0000-0000-000000000000');
  check('D4_20', '未知令牌 state=not_found', sNotFound?.state === 'not_found', sNotFound?.state);

  // D4-24: run_approved_command 结构化拒绝 (not_found / already_consumed)
  const rNotFound = await tools.callTool('huaweicloud_run_approved_command',
    { args: rawArgs, approvalToken: '00000000-0000-0000-0000-000000000000', approvedByUser: true });
  check('D4_24', '未找到 confirmToken → rejected code=CONFIRM_TOKEN_NOT_FOUND',
    rNotFound?.status === 'rejected' && rNotFound?.code === 'CONFIRM_TOKEN_NOT_FOUND', JSON.stringify(rNotFound));

  const rConsumed = await tools.callTool('huaweicloud_run_approved_command',
    { args: rawArgs, approvalToken: token, approvedByUser: true });
  check('D4_24', '已消费 confirmToken → ok outcome=already_processed (拒绝重复执行)',
    rConsumed?.status === 'ok' && rConsumed?.outcome === 'already_processed', JSON.stringify(rConsumed));

  // 过期令牌: 新建令牌后回拨其 createdAt 到 10 分钟前, 再直调 inspect + run_approved
  const expToken = hdkCli.createApprovalToken(rawArgs);
  const ap = join(process.env.HUAWEICLOUD_HOME || homedir(), '.config', 'huaweicloud', 'approvals.json');
  const obj = JSON.parse(readFileSync(ap, 'utf8'));
  if (obj[expToken]) obj[expToken].createdAt = Date.now() - 10 * 60_000;
  writeFileSync(ap, JSON.stringify(obj), 'utf8');
  const sExpired = hdkCli.inspectApprovalToken(expToken);
  check('D4_20', '超期令牌 state=expired', sExpired?.state === 'expired', sExpired?.state);
  const rExpired = await tools.callTool('huaweicloud_run_approved_command',
    { args: rawArgs, approvalToken: expToken, approvedByUser: true });
  check('D4_24', '过期 confirmToken → rejected code=CONFIRM_TOKEN_EXPIRED',
    rExpired?.status === 'rejected' && rExpired?.code === 'CONFIRM_TOKEN_EXPIRED', JSON.stringify(rExpired));
} catch (e) {
  check('D4_20', '直调异常(降级为源码核验)', false, String(e).slice(0, 200));
  check('D4_24', '直调异常(降级为源码核验)', false, String(e).slice(0, 200));
} finally {
  const d20 = results.D4_20.every(x => x.pass);
  const d24 = results.D4_24.every(x => x.pass);
  const out = {
    SUT: 'huaweicloud-devkit 1.1.8-next.3 (gitHead 1afbcf1)',
    D4_20: { status: d20 ? 'PASS' : 'FAIL', checks: results.D4_20 },
    D4_24: { status: d24 ? 'PASS' : 'FAIL', checks: results.D4_24 },
    note: 'probe-remaining.mjs 的 grep 串为旧版字符串, 1.1.8-next.3 #745 已改为 hcloud-cli.mjs 状态机 + tools.mjs runApprovedCommand 结构化 JSON contract',
  };
  console.log('\n=== RESULT ===\n' + JSON.stringify(out, null, 2));
  const ev = process.env.HDK_EVIDENCE;
  if (ev) {
    mkdirSync(join(ev, 'D4-20'), { recursive: true });
    mkdirSync(join(ev, 'D4-24'), { recursive: true });
    writeFileSync(join(ev, 'D4-20', 'stdout.log'), JSON.stringify({ status: d20 ? 'PASS' : 'FAIL', checks: results.D4_20, SUT: out.SUT }, null, 2), 'utf8');
    writeFileSync(join(ev, 'D4-24', 'stdout.log'), JSON.stringify({ status: d24 ? 'PASS' : 'FAIL', checks: results.D4_24, SUT: out.SUT }, null, 2), 'utf8');
  }
  process.exit(d20 && d24 ? 0 : 1);
}