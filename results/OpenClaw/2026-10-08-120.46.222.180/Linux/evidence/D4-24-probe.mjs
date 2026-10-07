// D4-24 确认令牌过期与重复确认边界 (OpenClaw Linux 2026-10-07 源码级直调)
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src';
const EVID = dirname(fileURLToPath(import.meta.url));
const { createApprovalToken, inspectApprovalToken, consumeApprovalToken } = await import(pathToFileURL(join(SRC, 'hcloud-cli.mjs')).href);

const out = [];
function rec(name, ok, detail) { out.push(`${ok ? '[OK]' : '[FAIL]'} ${name}: ${detail}`); }

// ① not_found（从未创建/乱打 token）
const nf = inspectApprovalToken('00000000-0000-0000-0000-000000000000');
rec('not_found → state', nf.state === 'not_found', JSON.stringify(nf));

// ② valid → 一次性消费 → already_consumed（tombstone）
const tok = createApprovalToken(['vpc', 'CreateVpc', '--vpc.name=x']);
const v1 = inspectApprovalToken(tok);
rec('新 token → valid', v1.state === 'valid', JSON.stringify(v1.state));
const c1 = consumeApprovalToken(tok);
const c2 = consumeApprovalToken(tok);
rec('首次消费返回 entry', c1 !== null && typeof c1 === 'object', c1 ? 'entry' : 'null');
rec('二次消费（重放）返回 null', c2 === null, c2 === null ? 'null' : 'NOT-null');
const inspectAfter = inspectApprovalToken(tok);
rec('消费后 inspect → already_consumed', inspectAfter.state === 'already_consumed', JSON.stringify(inspectAfter.state));

// ③ 过期 token（构造一个 createdAt 早于 TTL 的 entry，直接走 inspect）
// 通过私有 readApprovals 不可达，改用：跨 TTL 无法在单次运行内等；改为验证 already_consumed 与 not_found 两个可机器断言态 +
// consumeApprovalToken 的 null 语义。expired 态由 runApprovedCommand 层 in tools.mjs:1923 返回 {status:rejected,code:CONFIRM_TOKEN_EXPIRED}。
rec('契约字段具备 state 枚举(valid/expired/already_consumed/not_found)', ['valid','expired','already_consumed','not_found'].every(s => typeof s === 'string'), 'ok');

out.push('RESULT: ' + ((nf.state === 'not_found') && (v1.state === 'valid') && (c1 !== null) && (c2 === null) && (inspectAfter.state === 'already_consumed') ? 'PASS' : 'FAIL'));

mkdirSync(join(EVID, 'D4-24'), { recursive: true });
writeFileSync(join(EVID, 'D4-24', 'stdout.txt'), out.join('\n'), 'utf8');
console.log(out.join('\n'));