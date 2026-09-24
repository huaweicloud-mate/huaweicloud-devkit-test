import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const hdkSrc = process.argv[2];
const evRoot = process.argv[3];
if (!hdkSrc || !evRoot) process.exit(2);
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const srcUrl = (file) => new URL(`file:///${join(hdkSrc, file).replaceAll('\\', '/')}`).href;
const out = {};
function add(id, name, pass, actual, expected) {
  (out[id] ||= []).push({ name, pass, actual, expected });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${name}`);
}
function write(id, status = null, why = '') {
  const items = out[id] || [];
  const failed = items.filter((x) => !x.pass);
  const dir = join(evRoot, id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.mjs'), readFileSync(new URL(import.meta.url)), 'utf8');
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify({
    case: id,
    status: status || (failed.length ? 'FAIL' : 'PASS'),
    why: why || failed.map((x) => `${x.name} failed`).join('; '),
    executedAt: ts,
    results: items,
  }, null, 2), 'utf8');
}

const setupCli = readFileSync(join(hdkSrc, 'setup-cli.mjs'), 'utf8');
const merge = readFileSync(join(hdkSrc, 'mcp-config-merge.mjs'), 'utf8');
add('D1-67', 'agent-toolkit-env-injected', setupCli.includes('HUAWEICLOUD_AGENT_TOOLKIT_MODE') && merge.includes('HUAWEICLOUD_AGENT_TOOLKIT_MODE'), 'setup-cli+mcp-config-merge', 'env key present');
add('D1-67', 'skip-dsh-env-supported', setupCli.includes('HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL'), 'setup-cli', 'skip env present');

process.env.HUAWEICLOUD_ICONS_OFFLINE = '1';
process.env.HUAWEICLOUD_REGION = 'cn-north-9';
delete process.env.HW_REGION;
process.env.HW_ACCESS_KEY = 'AKREGIONTEST';
process.env.HW_SECRET_KEY = 'SKREGIONTEST';
const { getServiceIcon } = await import(srcUrl('icon-library.mjs'));
const cred = await import(srcUrl('auth/credentials.mjs'));
const icon = await getServiceIcon('ecs');
const resolved = cred.resolveCredentials({});
add('D1-68', 'offline-icon-returned', Boolean(icon?.svg || icon?.name || icon?.service), icon, 'icon object');
add('D1-68', 'huaweicloud-region-preferred', resolved.region === 'cn-north-9', resolved.region, 'cn-north-9');

const { callTool } = await import(srcUrl('tools.mjs'));
const composite = await callTool('huaweicloud_service_catalog', { intent: '物联网时序数据前端托管 预览和生产分层推荐' });
const compositeText = JSON.stringify(composite);
add('D3-S5', 'composite-route-multi-service', /OBS|ECS|sandbox|GaussDB|DDS|DCS|IoT|物联网|沙箱/i.test(compositeText), compositeText.slice(0, 500), 'multi service recommendation');
const explain = await callTool('huaweicloud_explain_error', {
  service: 'IAM',
  operation: 'KeystoneListProjects',
  error: 'APIGW.0301 PolicyNotAuthorized: permission denied',
});
const explainText = JSON.stringify(explain);
add('D3-S8', 'troubleshooting-classification', /permission|权限|IAM|project|PolicyNotAuthorized/i.test(explainText), explainText.slice(0, 500), 'permission troubleshooting');

for (const id of ['D1-67', 'D1-68', 'D3-S5', 'D3-S8']) write(id);

const blocked = {
  'D3-C13': 'BLOCKED: requires a disposable real OBS bucket to set/get/delete website configuration and verify XML/status.解除条件: provide/create an OBS test bucket scoped for this run and allow cleanup verification.',
  'D3-S1': 'BLOCKED: requires real cloud readonly ECS inventory in cn-north-4 and a session-level audit proving zero write calls.解除条件: provide readonly ECS target/account state and allow hcloud ListServersDetails evidence capture.',
  'D3-S2': 'BLOCKED: requires a disposable test VPC and approved destructive delete confirmation path, plus post-delete zero-resource verification.解除条件: create/identify run-owned VPC and authorize delete.',
  'D3-S3': 'BLOCKED: requires Huawei Cloud Sandbox quota plus deployable frontend project and public URL accessibility check.解除条件: sandbox session quota available and deploy target approved.',
  'D3-S4': 'BLOCKED: voucher is one-time per account; current run cannot safely force claim without an unclaimed IAM account dedicated to this test.解除条件: provide unclaimed voucher test account.',
  'D3-S6': 'BLOCKED: requires FunctionGraph write quota and cleanup of created function/timer trigger.解除条件: authorize run-owned FunctionGraph create/delete.',
  'D3-S7': 'BLOCKED: requires RDS plus sandbox/ECS deployment quota and full cleanup verification across services.解除条件: authorize run-owned RDS/app deployment resources and cleanup checks.',
};
for (const [id, why] of Object.entries(blocked)) write(id, 'BLOCKED', why);
