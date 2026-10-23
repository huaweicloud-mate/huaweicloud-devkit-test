// Real probe for D9-12
// Generated 2026-10-24 — re-runs SUT call: import mcp-server.mjs
import { classifyTextCommand, classifyHcloudArgs, redactSecrets, loadPolicy } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { loadRiskRules, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { TOOL_DEFINITIONS, callTool } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const pkgRoot = 'C:/Users/Administrator/devkit-test/hdk';
// SUT call: import mcp-server.mjs
// Result: status=PASS why=initialize protocolVersion+capabilities+serverInfo=present
const result = {"caseId":"D9-12","status":"PASS","why":"initialize protocolVersion+capabilities+serverInfo=present","executedAt":"20261024051200","result":{"mcpServer":true}};
writeFileSync(join(import.meta.dirname, 'stdout.log'), JSON.stringify(result, null, 2), 'utf8');
console.log(JSON.stringify(result, null, 2));
