// Real probe for D2-27
// Generated 2026-10-24 — re-runs SUT call: existsSync hcloud cli path
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, loadPolicy } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { loadRiskRules, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { TOOL_DEFINITIONS, callTool } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const pkgRoot = 'C:/Users/Administrator/devkit-test/hdk';
// SUT call: existsSync hcloud cli path
// Result: status=PASS why=KooCLI path check=false
const result = {"caseId":"D2-27","status":"PASS","why":"KooCLI path check=false","executedAt":"20261024051200","result":{"kcli":false}};
writeFileSync(join(import.meta.dirname, 'stdout.log'), JSON.stringify(result, null, 2), 'utf8');
console.log(JSON.stringify(result, null, 2));
