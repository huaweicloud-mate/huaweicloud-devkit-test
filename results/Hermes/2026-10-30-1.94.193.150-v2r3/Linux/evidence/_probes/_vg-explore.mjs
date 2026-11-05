// 探索：v2 vendor-gate 三段式在 callTool 直调下的真实行为
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const HDK = '/home/testbot2/devkit-test/Hermes/hdk';
const SRC = join(HDK, 'plugins', 'huaweicloud-core', 'dist');
const { callTool } = await import(pathToFileURL(join(SRC, 'tools.js')).href);

const QUOTE = '用户要求对华为云执行 v2 版本测试（已确认厂商为华为云）';

async function stage3(name, args) {
  // 1) 不带 vendorConfirmed
  try {
    const r = await callTool(name, args, { sessionId: 'probe-' + name });
    return { s1: 'NO_GATE(returned)', s1r: r };
  } catch (e) {
    var s1 = String(e && e.message || e).slice(0, 80);
  }
  // 2) 带 vendorConfirmed 首次
  try {
    const r = await callTool(name, { ...args, vendorConfirmed: QUOTE }, { sessionId: 'probe-' + name });
    return { s1, s2: 'NO_CHALLENGE(returned)', s2r: r };
  } catch (e) {
    var s2 = String(e && e.message || e).slice(0, 80);
  }
  // 3) retry
  try {
    const r = await callTool(name, { ...args, vendorConfirmed: QUOTE }, { sessionId: 'probe-' + name });
    return { s1, s2, s3: 'RETURNED', s3r: r };
  } catch (e) {
    return { s1, s2, s3: 'ERR ' + String(e && e.message || e).slice(0, 120) };
  }
}

const tools = [
  ['huaweicloud_service_catalog', { intent: '查询云主机' }],
  ['huaweicloud_check_cli', {}],
  ['huaweicloud_auth_status', {}],
  ['huaweicloud_list_regions', {}],
  ['huaweicloud_list_operations', { service: 'ECS' }],
  ['huaweicloud_plan_cli_command', { intent: '查询云主机列表' }],
  ['huaweicloud_show_profile_redacted', {}],
  ['huaweicloud_run_readonly_command', { command: 'hcloud VPC ListVpcs --cli-region=cn-north-4' }],
];

for (const [name, args] of tools) {
  const r = await stage3(name, args);
  const s3r = r.s3r;
  const s3shape = s3r ? (typeof s3r === 'object' ? (s3r.content ? 'MCPStyle' : Object.keys(s3r).join(',')) : typeof s3r) : '-';
  console.log(`\n=== ${name} ===`);
  console.log('  stage1(no confirmed):', r.s1);
  console.log('  stage2(first confirm):', r.s2);
  console.log('  stage3(retry):', r.s3, '| shape:', s3shape);
  if (typeof s3r === 'object' && s3r && s3r.content) {
    const t = (s3r.content[0] && s3r.content[0].text) || JSON.stringify(s3r.content).slice(0, 200);
    console.log('  s3 content:', String(t).slice(0, 180));
  } else if (s3r && typeof s3r === 'object') {
    console.log('  s3 obj:', JSON.stringify(s3r).slice(0, 240));
  }
}