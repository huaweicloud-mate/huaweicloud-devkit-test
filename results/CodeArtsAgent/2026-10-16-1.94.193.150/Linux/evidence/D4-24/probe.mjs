// D4-24 审批令牌契约字段漂移探针（源码级直调）
// 契约（用例预期）：过期令牌 {code:'CONFIRM_TOKEN_EXPIRED', status:'rejected'}；
//   重复确认 {outcome:'already_processed'}。
// 实现：inspectApprovalToken 返回 {state:'valid'|'expired'|'already_consumed'|'not_found'}
//   consumeApprovalToken 返回 entry|null。核对字段契约是否漂移。
import { pathToFileURL } from 'node:url';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SRC = process.argv[2];
const ISO = mkdtempSync(join(tmpdir(), 'd424-'));
process.env.HUAWEICLOUD_HOME = ISO;

const C = await import(pathToFileURL(join(SRC, 'hcloud-cli.mjs')).href);
const APPROVAL_TTL_MS = C.APPROVAL_TTL_MS ?? 60000;

function out(name, ok, detail) { console.log(`${ok ? '[OK]' : '[DRIFT]'} ${name} | ${detail}`); }

const rawArgs = ['ECS', 'CreateServers', '--cli-region=cn-north-4', '--server.name=tctest-d424-probe', '--server.count=1', '--server.flavorRef=c6.large.2'];
const token = C.createApprovalToken(rawArgs);

// ① 过期令牌契约：期望 {code:'CONFIRM_TOKEN_EXPIRED', status:'rejected'}
const st1 = C.inspectApprovalToken(token);
const expiredContract = st1 && (st1.code === 'CONFIRM_TOKEN_EXPIRED' && st1.status === 'rejected');
console.log(`inspectApprovalToken(valid) => ${JSON.stringify(st1)}`);
out('过期令牌契约 {code,status}', expiredContract, `实际返回字段=${Object.keys(st1||{}).join(',')}`);

// 注入时钟推进：把 approvals.json 的 createdAt 改到过期
const ap = join(ISO, '.config', 'huaweicloud', 'approvals.json');
try {
  const d = JSON.parse(readFileSync(ap, 'utf8'));
  if (d[token]) d[token].createdAt = Date.now() - (APPROVAL_TTL_MS + 10000);
  writeFileSync(ap, JSON.stringify(d));
} catch (e) { console.log('注入例外:', e.message); }
const st2 = C.inspectApprovalToken(token);
console.log(`inspectApprovalToken(expired) => ${JSON.stringify(st2)}`);
out('过期令牌实现字段 state=expired', st2 && st2.state === 'expired', `state=${st2?.state}`);
out('过期令牌契约字段存在', st2 && st2.code === 'CONFIRM_TOKEN_EXPIRED' && st2.status === 'rejected', `code=${st2?.code} status=${st2?.status}`);

// ② 重复确认契约：期望 {outcome:'already_processed'}
const consumed1 = C.consumeApprovalToken(token);
const st3 = C.inspectApprovalToken(token);
console.log(`consumeApprovalToken(首次) => ${JSON.stringify(consumed1)}`);
console.log(`inspectApprovalToken(已消费) => ${JSON.stringify(st3)}`);
out('重复确认实现字段 state=already_consumed', st3 && st3.state === 'already_consumed', `state=${st3?.state}`);
out('重复确认契约字段 outcome=already_processed', st3 && st3.outcome === 'already_processed', `outcome=${st3?.outcome}`);

const contractDrift = !(expiredContract) || !(st2?.code === 'CONFIRM_TOKEN_EXPIRED') || !(st3?.outcome === 'already_processed');
console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ caseId: 'D4-24', verdict: contractDrift ? 'SPEC-MISMATCH' : 'PASS',
  rootCause: 'hcloud-cli.mjs:inspectApprovalToken 返回 state 字段(valid/expired/already_consumed/not_found)，契约要求 {code,status}/{outcome} 字段', }, null, 2));
rmSync(ISO, { recursive: true, force: true });
process.exit(0);
