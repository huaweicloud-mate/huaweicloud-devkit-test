// 探针: D4-24 —— 确认令牌过期与重复确认边界（审批流健壮性）
// 真实执行：直调 hcloud-cli.mjs createApprovalToken/consumeApprovalToken/inspectApprovalToken。
// 注意：默认 ~/.config/huaweicloud 在本沙箱只读，故用 HUAWEICLOUD_HOME 指向可写目录持久化 approvals.json。
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = process.env.HDK_SRC || '/home/testbot2/multica_workspaces/vector-8988c3df7bc9/task-910b5061cbdb/workdir/hdk/plugins/huaweicloud-core/src';
const HOME = mkdtempSync(join(tmpdir(), 'hdk-d424-home-'));
mkdirSync(join(HOME, '.config', 'huaweicloud'), { recursive: true });
process.env.HUAWEICLOUD_HOME = HOME;

const U = (p) => pathToFileURL(join(SRC, p)).href;
const hcl = await import(U('hcloud-cli.mjs'));

const tok = hcl.createApprovalToken(['VPC', 'DeleteVpc', '--vpc_id=x']);
const c1 = hcl.consumeApprovalToken(tok);
const c2 = hcl.consumeApprovalToken(tok);
const insp = hcl.inspectApprovalToken(tok);

const status = (c1 != null && c2 == null && insp.state === 'already_consumed') ? 'PASS' : 'FAIL';
const why = `确认令牌单次消费: create=${!!tok} consume#1=${!!c1} consume#2=${!!c2} inspect=${insp.state}`;
const result = { status, why, executedAt: new Date().toISOString().replace(/[-:TZ]/g, '').slice(0, 14),
  detail: JSON.stringify({ tokCreated: !!tok, firstConsume: c1 ? Object.keys(c1) : null, secondConsumeNull: c2 === null, inspect: insp }) };
writeFileSync(join(here, 'stdout.log'), JSON.stringify(result) + '\n');
process.stdout.write(JSON.stringify(result) + '\n');
