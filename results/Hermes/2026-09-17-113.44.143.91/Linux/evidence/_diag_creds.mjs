// 诊断：MCP 层（credentials.json） vs hcloud CLI 层（KooCLI profile）凭证状态
import { pathToFileURL } from 'node:url';
const tools = await import(pathToFileURL('/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs').href);
const { callTool } = tools;

const out = [];
// 1. plan_cli_command 对只读 ListVpcs（MCP 层分类）
const plan = await callTool('huaweicloud_plan_cli_command', {
  command: 'hcloud VPC ListVpcs --cli-region=cn-north-4',
  allowWrites: false,
});
out.push(`plan(ListVpcs 只读): decision=${plan?.classification?.decision}, risk=${plan?.classification?.risk}, token=${plan?.approvalToken ? '有' : '无'}`);

// 2. run_readonly_command 对 ListVpcs（MCP 层真机只读执行）
const ro = await callTool('huaweicloud_run_readonly_command', {
  command: 'hcloud VPC ListVpcs --cli-region=cn-north-4 --limit=3',
});
out.push(`run_readonly(ListVpcs): ok=${ro?.ok}, exitCode=${ro?.exitCode}, stderr=${String(ro?.stderr||ro?.error||'').slice(0,120)}`);

// 3. auth_status（看三端凭证判定）
const st = await callTool('huaweicloud_auth_status', {});
out.push(`auth_status: ${JSON.stringify(st).slice(0, 300)}`);

console.log(out.join('\n'));