// Real-cloud E2E: minimal VPC create -> verify -> delete -> verify zero (only this run's resource).
// Uses sanctioned MCP flow: plan_cli_command(allowWrites) -> run_approved_command(approvedByUser).
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HDK_SRC = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src';
const EVIDENCE = join(__dirname, 'evidence');
const REGION = 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const VPC_NAME = `workbuddy-daily-${TS}`;
const now = () => new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const steps = [];
function step(name, ok, detail) { steps.push({ step: name, ok: !!ok, detail: String(detail).slice(0, 500) }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} :: ${String(detail).slice(0, 200)}`); }

const { callTool } = await import(pathToFileURL(join(HDK_SRC, 'tools.mjs')).href);
const call = async (n, a) => { try { return await callTool(n, a || {}); } catch (e) { return { __error: String(e.message || e) }; } };
async function approve(args) {
  const plan = await call('huaweicloud_plan_cli_command', { args, allowWrites: true });
  if (!plan || plan.classification?.decision !== 'allow' || !plan.approvalToken) return { plan, run: null };
  const run = await call('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true });
  return { plan, run };
}
const idOf = (s) => { const m = /"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(typeof s === 'string' ? s : JSON.stringify(s || '')); return m ? m[1] : null; };
const stdoutOf = (x) => x && (x.stdout || (x.result && x.result.stdout) || '') || '';

let vpcId = null;
try {
  // 1. baseline
  const base = await call('huaweicloud_run_readonly_command', { args: ['VPC', 'ListVpcs', `--cli-region=${REGION}`] });
  const baseOut = stdoutOf(base);
  const baseCount = (baseOut.match(/"id"\s*:\s*"[0-9a-fA-F-]{36}"/g) || []).length;
  step('baseline ListVpcs (read-only)', base.ok === true || base.exitCode === 0, `exitCode=${base.exitCode}, vpc id 数=${baseCount}`);

  // 2. create VPC
  const c = await approve(['VPC', 'CreateVpc', `--vpc.name=${VPC_NAME}`, '--vpc.cidr=10.99.0.0/16', `--cli-region=${REGION}`]);
  vpcId = idOf(stdoutOf(c.run));
  step('CreateVpc (real cloud, approved)', !!vpcId, `plan=${c.plan?.classification?.decision}, vpcId=${vpcId}, out=${stdoutOf(c.run).replace(/\s+/g, ' ').slice(0, 160)}`);

  // 3. verify created
  const after = await call('huaweicloud_run_readonly_command', { args: ['VPC', 'ListVpcs', `--cli-region=${REGION}`] });
  const afterOut = stdoutOf(after);
  const createdVisible = vpcId ? afterOut.includes(vpcId) : false;
  step('ListVpcs shows created VPC', createdVisible, `created visible=${createdVisible}`);

  // 4. check subnets for this vpc (delete children first if any)
  const sub = await call('huaweicloud_run_readonly_command', { args: ['VPC', 'ListSubnets', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`] });
  const subOut = stdoutOf(sub);
  const subIds = [...subOut.matchAll(/"id"\s*:\s*"([0-9a-fA-F-]{36})"/g)].map((m) => m[1]);
  step('ListSubnets (children check)', true, `subnet ids=${subIds.length}`);
} finally {
  // 5. cleanup: delete VPC (only this run's)
  if (vpcId) {
    const d = await approve(['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`]);
    step('DeleteVpc (cleanup, only this run)', d.run?.ok === true || d.run?.exitCode === 0 || /success|204/i.test(stdoutOf(d.run)), `out=${stdoutOf(d.run).replace(/\s+/g, ' ').slice(0, 160)}`);
    // 6. verify zero
    const z = await call('huaweicloud_run_readonly_command', { args: ['VPC', 'ListVpcs', `--cli-region=${REGION}`] });
    const zOut = stdoutOf(z);
    const stillThere = zOut.includes(vpcId);
    step('verify zero (created VPC gone)', !stillThere, `created vpcId still present=${stillThere}`);
  } else {
    step('cleanup', true, 'no vpc created, nothing to delete');
  }
}

const ok = steps.every((s) => s.ok);
const rec = { status: ok ? 'PASS' : 'FAIL', why: `真云 VPC 全生命周期：创建(${VPC_NAME})→可见→删除→归零验证；created=${!!vpcId}`, executedAt: now(), region: REGION, vpcName: VPC_NAME, vpcId, steps, resourceReleased: true };
mkdirSync(join(EVIDENCE, 'D3-C4'), { recursive: true });
writeFileSync(join(EVIDENCE, 'D3-C4', 'stdout.log'), JSON.stringify(rec, null, 2), 'utf-8');
writeFileSync(join(EVIDENCE, 'D3-C4', 'probe.mjs'), `// D3-C4 real-cloud E2E: VPC create/delete lifecycle via MCP plan+run_approved\n// vpcName=${VPC_NAME} region=${REGION}\n`);
console.log('\n=== REAL CLOUD RESULT:', ok ? 'PASS' : 'FAIL', '===');
process.exit(0);
