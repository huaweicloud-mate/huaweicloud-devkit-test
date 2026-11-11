import { pathToFileURL } from 'node:url';
const SRC = '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);
const TS = String(Date.now()).slice(-10);
const NAME = `tctest-openclaw-c1-${TS}`;
const args = ['VPC', 'CreateVpc', `--vpc.name=${NAME}-vpc`, '--vpc.cidr=10.199.0.0/16', '--cli-region=cn-north-4'];
const plan = await callTool('huaweicloud_plan_cli_command', { args, allowWrites: true });
console.log('PLAN allowWrites=true:', JSON.stringify({classification: plan.classification, hasToken: !!plan.approvalToken, safeToRun: plan.safeToRun}));
if (plan.classification?.decision === 'allow' && plan.approvalToken) {
  const run = await callTool('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true, timeoutMs: 30000 });
  console.log('RUN:', JSON.stringify({ok: run.ok, stdout: (run.stdout||'').slice(0,200), err: (run.stderr||'').slice(0,200)}));
}
