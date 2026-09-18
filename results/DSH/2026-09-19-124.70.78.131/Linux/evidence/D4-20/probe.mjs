// D4-20 拒绝后零操作：确认流选拒绝(不批准) → 无资源变更、无命令执行
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);
const hc = (a) => spawnSync('hcloud', [...a, '--cli-region=cn-north-4'], { shell:false, stdio:'pipe', timeout:60000 });
const j = (r) => { try { const s=(r.stdout||'').toString(); return JSON.parse(s.slice(s.indexOf('{'))); } catch { return null; } };

const before = j(hc(['VPC','ListVpcs']))?.vpcs || [];
const beforeCount = before.filter(v => String(v.name||'').startsWith('tctest-dsh-')).length;
console.log('拒绝前 tctest-dsh- VPC 计数:', beforeCount);

const args = ['VPC','CreateVpc','--vpc.name=tctest-dsh-d420-noreak','--vpc.cidr=10.254.0.0/16'];
const plan = await callTool('huaweicloud_plan_cli_command', { args });
console.log('plan decision:', plan.classification?.decision, '(写操作需批准)');

// 拒绝路径 1：approvedByUser=false 必须抛错，命令不执行
let denied1 = false;
try { await callTool('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: false }); }
catch (e) { denied1 = /approvedByUser must be true/i.test(String(e.message)); console.log('拒绝(approvedByUser=false) 抛错:', e.message); }

// 拒绝路径 2：不带批准令牌，命令不执行
let denied2 = false;
try { await callTool('huaweicloud_run_approved_command', { args, approvalToken: '', approvedByUser: true }); }
catch (e) { denied2 = /Invalid or expired approval token/i.test(String(e.message)); console.log('拒绝(无有效 token) 抛错:', e.message); }

const after = j(hc(['VPC','ListVpcs']))?.vpcs || [];
const afterCount = after.filter(v => String(v.name||'').startsWith('tctest-dsh-')).length;
console.log('拒绝后 tctest-dsh- VPC 计数:', afterCount);

const passed = denied1 && denied2 && beforeCount === afterCount;
console.log('ASSERT 拒绝后零资源变更(计数不变):', beforeCount === afterCount);
console.log('VERDICT', passed ? 'PASS' : 'FAIL');
process.exit(passed ? 0 : 1);
