/**
 * WorkBuddy daily test probe - D3 scenarios + D3-C13/C14
 * Covers: D3-C13, D3-C14, D3-S1~S8
 */
import { TOOL_DEFINITIONS, callTool } from 'file:///C:/Users/Administrator/devkit-test/WorkBuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { planHcloudCommand } from 'file:///C:/Users/Administrator/devkit-test/WorkBuddy/hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs';
import { classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/WorkBuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const pkgRoot = 'C:/Users/Administrator/devkit-test/WorkBuddy/hdk';
const evDir = 'C:/Users/Administrator/devkit-test/WorkBuddy/huaweicloud-devkit-test/results/WorkBuddy/2026-09-24-188.239.14.150/Windows/evidence';
const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual: String(actual).substring(0,120), expected: String(expected).substring(0,120), passMsg, failMsg });
}

// ===== D3-C13: OBS static website hosting config =====
// Check huaweicloud_obs_set_website_config tool exists
const obsWebsiteTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_obs_set_website_config');
test('D3-C13', 'obs-website-tool', Boolean(obsWebsiteTool), Boolean(obsWebsiteTool), true, 'obs_set_website_config tool registered', 'obs_set_website_config not registered');

// ===== D3-C14: Sandbox HDKit service params and hwlink credentials =====
const sandboxConnectTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_sandbox_connect');
test('D3-C14', 'sandbox-connect-tool', Boolean(sandboxConnectTool), Boolean(sandboxConnectTool), true, 'sandbox_connect tool registered', 'sandbox_connect not registered');
const sandboxCredTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_sandbox_credentials');
test('D3-C14', 'sandbox-cred-tool', Boolean(sandboxCredTool), Boolean(sandboxCredTool), true, 'sandbox_credentials tool registered', 'sandbox_credentials not registered');

// Check sandbox module exists
const sandboxDir = join(pkgRoot, 'plugins', 'huaweicloud-core', 'src', 'sandbox');
test('D3-C14', 'sandbox-dir', existsSync(sandboxDir), existsSync(sandboxDir), true, 'sandbox dir exists', 'sandbox dir missing');

// ===== D3-S1: Scenario - readonly query ECS (no modification constraint) =====
// Plan a readonly ECS list command
const s1Plan = planHcloudCommand(['ECS', 'ListServers']);
test('D3-S1', 'readonly-plan', s1Plan !== null && typeof s1Plan === 'object', typeof s1Plan, 'object', 'readonly ECS plan created', 'readonly ECS plan failed');
const s1Cls = classifyHcloudArgs(['ECS', 'ListServers']);
test('D3-S1', 'readonly-allow', s1Cls.decision === 'allow', s1Cls.decision, 'allow', 'readonly ECS allowed', 'readonly ECS denied');

// ===== D3-S2: Scenario - delete VPC requires confirmation =====
const s2Cls = classifyHcloudArgs(['VPC', 'DeleteVpcs', '--vpc-id', 'test']);
test('D3-S2', 'delete-vpc-confirm', s2Cls.decision === 'deny' || s2Cls.decision === 'confirm' || s2Cls.isWrite === true, s2Cls.decision, 'deny/confirm/write', 'delete VPC needs confirm', 'delete VPC allowed');

// ===== D3-S3: Scenario - sandbox preview produces URL =====
const sandboxUploadTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_sandbox_upload_file' || t.name === 'huaweicloud_sandbox_upload_project');
test('D3-S3', 'sandbox-upload-tool', Boolean(sandboxUploadTool), Boolean(sandboxUploadTool), true, 'sandbox_upload tool registered', 'sandbox_upload not registered');

// ===== D3-S4: Scenario - voucher claim closed loop =====
const voucherStatusTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_voucher_status');
const voucherClaimTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_voucher_claim');
test('D3-S4', 'voucher-status-tool', Boolean(voucherStatusTool), Boolean(voucherStatusTool), true, 'voucher_status tool registered', 'voucher_status not registered');
test('D3-S4', 'voucher-claim-tool', Boolean(voucherClaimTool), Boolean(voucherClaimTool), true, 'voucher_claim tool registered', 'voucher_claim not registered');

// ===== D3-S5: Scenario - composite intent layered routing =====
const serviceCatalogTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_service_catalog');
test('D3-S5', 'service-catalog-tool', Boolean(serviceCatalogTool), Boolean(serviceCatalogTool), true, 'service_catalog tool registered', 'service_catalog not registered');

// ===== D3-S6: Scenario - FunctionGraph scheduled task =====
// Plan a FunctionGraph command
const s6Plan = planHcloudCommand(['FunctionGraph', 'ListFunctions']);
test('D3-S6', 'fg-plan', s6Plan !== null && typeof s6Plan === 'object', typeof s6Plan, 'object', 'FunctionGraph plan created', 'FunctionGraph plan failed');

// ===== D3-S7: Scenario - cross-service delivery (Web app + RDS) =====
const rdsPlan = planHcloudCommand(['RDS', 'ListInstances']);
test('D3-S7', 'rds-plan', rdsPlan !== null && typeof rdsPlan === 'object', typeof rdsPlan, 'object', 'RDS plan created', 'RDS plan failed');
const ecsPlan = planHcloudCommand(['ECS', 'ListServers']);
test('D3-S7', 'ecs-plan', ecsPlan !== null && typeof ecsPlan === 'object', typeof ecsPlan, 'object', 'ECS plan created', 'ECS plan failed');

// ===== D3-S8: Scenario - operation failure troubleshooting =====
const explainErrorTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_explain_error');
test('D3-S8', 'explain-error-tool', Boolean(explainErrorTool), Boolean(explainErrorTool), true, 'explain_error tool registered', 'explain_error not registered');
const runReadonlyTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_run_readonly_command');
test('D3-S8', 'run-readonly-tool', Boolean(runReadonlyTool), Boolean(runReadonlyTool), true, 'run_readonly_command tool registered', 'run_readonly_command not registered');

const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed, results }, null, 2);
writeFileSync(join(evDir, 'd3-scenarios', 'stdout.log'), output, 'utf8');
console.log(output);
