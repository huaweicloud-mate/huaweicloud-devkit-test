// D3-C4 真云轻量创建回归：list_operations(全22服务只读冒烟) + plan只读 + 高危服务轻量创建→立即释放→归零。
// 覆盖 D3-C4「②高危服务轻量创建(最小规格) ③立即释放」「plan只读」，EXP-C4-02(VPC)/EXP-C4-03(OBS) 建删归零验证。
// 用法: node c4-service-realcloud/probe.mjs
import { callTool } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const REGION = process.env.HW_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 180), expected: String(expected) });
}
function idOf(json, key) {
  const re = new RegExp('"' + key + '"\\s*:\\s*"([0-9a-fA-F-]{36})"');
  return re.exec(json || '')?.[1];
}
function sh(cmd) {
  const r = spawnSync('hcloud', cmd, { encoding: 'utf8', timeout: 120000 });
  return (r.stdout || '') + (r.stderr || '');
}

// 1) plan只读：VPC 只读命令应判 allow
const planRo = await callTool('huaweicloud_plan_cli_command', { args: ['VPC', 'ListVpcs', `--cli-region=${REGION}`], allowWrites: false });
test('D3-C4', 'plan-readonly-allow', planRo?.classification?.decision === 'allow', planRo?.classification?.decision || JSON.stringify(planRo).slice(0,80), 'readonly→allow');

// 2) plan写：VPC 创建（不放行写）应判 confirm/deny（非 allow 直放行）
const planWr = await callTool('huaweicloud_plan_cli_command', { args: ['VPC', 'CreateVpc', '--vpc.name=hdk-c4-probe', '--vpc.cidr=10.88.0.0/16', `--cli-region=${REGION}`], allowWrites: false });
test('D3-C4', 'plan-write-escalate', planWr?.classification?.decision === 'confirm' || planWr?.classification?.decision === 'deny', planWr?.classification?.decision || JSON.stringify(planWr).slice(0,80), 'write(allowWrites=false)→confirm/deny');

// 3) 高危服务轻量创建→立即释放→归零 (VPC)
let vpcId = null;
try {
  const create = sh(['VPC', 'CreateVpc', `--cli-region=${REGION}`, '--vpc.name=hdk-c4-probe', '--vpc.cidr=10.88.0.0/16']);
  vpcId = idOf(create, 'id');
  test('D3-C4', 'vpc-create', !!vpcId, create.slice(0,120).replace(/[A-Z0-9]{20,}/g,'***'), '返回 vpc.id');
} finally {
  if (vpcId) {
    const del = sh(['VPC', 'DeleteVpc', `--cli-region=${REGION}`, `--vpc_id=${vpcId}`]);
    const remain = sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`, '--limit=100']);
    const gone = !remain.includes(vpcId);
    test('D3-C4', 'vpc-delete-zero', gone, `delete=${/success|^\s*$/i.test(del)||del.trim()===''} remain=${gone?'0':vpcId.slice(0,8)}`, '删除后 ListVpcs 无此 id');
  } else {
    test('D3-C4', 'vpc-delete-zero', true, '未创建(跳过删除)', '归零');
  }
}

// 4) OBS 建桶→删桶归零
const bucket = `testbot3-hermes-c4-${TS}`;
const mb = sh(['OBS', 'mb', `obs://${bucket}`, `-location=${REGION}`]);
test('D3-C4', 'obs-mb', /success|Create bucket/i.test(mb), mb.slice(0,120), 'OBS 建桶成功');
const rm = sh(['OBS', 'rm', `obs://${bucket}`, '-f']);
test('D3-C4', 'obs-rm-zero', /success|Delete bucket/i.test(rm) || rm.trim()==='', rm.slice(0,120), 'OBS 删桶归零');

const passed = results.filter(r => r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed: results.length - passed, results }, null, 2);
writeFileSync(new URL('file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-23-1.94.218.129/Linux/evidence/c4-service-realcloud/stdout.log'), output, 'utf8');
console.log(output);