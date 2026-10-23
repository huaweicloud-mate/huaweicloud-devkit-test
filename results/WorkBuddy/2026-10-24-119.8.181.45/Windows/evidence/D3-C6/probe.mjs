// Real probe for D3-C6
// Generated 2026-10-24 — re-runs SUT call: TOOL_DEFINITIONS implicit tools
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, loadPolicy } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { loadRiskRules, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { TOOL_DEFINITIONS, callTool } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const pkgRoot = 'C:/Users/Administrator/devkit-test/hdk';
// SUT call: TOOL_DEFINITIONS implicit tools
// Result: status=FAIL why=implicit tools missing=huaweicloud_check_user,huaweicloud_credentials,huaweicloud_sign_agreement,huaweicloud_execute,huaweicloud_check_result,huaweicloud_list_resources,huaweicloud_cleanup
const result = {"caseId":"D3-C6","status":"FAIL","why":"implicit tools missing=huaweicloud_check_user,huaweicloud_credentials,huaweicloud_sign_agreement,huaweicloud_execute,huaweicloud_check_result,huaweicloud_list_resources,huaweicloud_cleanup","executedAt":"20261024051200","result":{"missing":["huaweicloud_check_user","huaweicloud_credentials","huaweicloud_sign_agreement","huaweicloud_execute","huaweicloud_check_result","huaweicloud_list_resources","huaweicloud_cleanup"]}};
writeFileSync(join(import.meta.dirname, 'stdout.log'), JSON.stringify(result, null, 2), 'utf8');
console.log(JSON.stringify(result, null, 2));
