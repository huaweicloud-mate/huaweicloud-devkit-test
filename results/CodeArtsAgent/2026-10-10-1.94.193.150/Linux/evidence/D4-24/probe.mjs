// D4-24 审批令牌生命周期契约探针（直调 hcloud-cli.mjs 导出函数）
import { pathToFileURL } from 'node:url';
const SRC = process.argv[2] || '/home/testbot2/devkit-test/testbot2-Linux-CodeArts CLI/hdk/plugins/huaweicloud-core/src';
const { createApprovalToken, inspectApprovalToken, consumeApprovalToken } = await import(pathToFileURL(SRC + '/hcloud-cli.mjs').href);

function show(tag, v) { console.log(tag, JSON.stringify(v)); }

const rawArgs = ['VPC', 'CreateVpc', '--cli-region=cn-north-4', '--vpc.name=tctest-d424', '--vpc.cidr=192.168.97.0/24'];
const t1 = createApprovalToken(rawArgs);
console.log('token1 created:', typeof t1 === 'string' && t1.length > 8 ? 'ok(len>8)' : 'FAIL', t1.length);
show('inspect fresh =', inspectApprovalToken(t1));
show('consume 1st =', consumeApprovalToken(t1));
show('consume 2nd(repeat) =', consumeApprovalToken(t1));
show('inspect after consumed =', inspectApprovalToken(t1));
show('inspect unknown =', inspectApprovalToken('does-not-exist'));

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
const f = join(process.env.HUAWEICLOUD_HOME || homedir(), '.config', 'huaweicloud', 'approvals.json');
try {
  const map = JSON.parse(readFileSync(f, 'utf8'));
  map['expired-token-probe'] = { argsHash: 'x', argsRedacted: ['x'], createdAt: Date.now() - 10 * 60 * 1000 };
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, JSON.stringify(map), { mode: 0o600 });
  show('consume expired =', consumeApprovalToken('expired-token-probe'));
  show('inspect expired =', inspectApprovalToken('expired-token-probe'));
  delete map['expired-token-probe'];
  writeFileSync(f, JSON.stringify(map), { mode: 0o600 });
} catch (e) { console.log('expired-probe skip:', e.message); }

console.log('=== D4-24 审批令牌契约结论 ===');
console.log('契约期望: 过期 -> {code:CONFIRM_TOKEN_EXPIRED}; 重复 -> {outcome:already_processed}');
console.log('实际: consume 重复/过期返回 null; inspect 返回 state 枚举(valid/expired/already_consumed/not_found)');
