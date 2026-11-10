// D4-1 真实探针（由 probe-d4 批量驱动执行，本文件为忠实复现片段）
import { classifyTextCommand, redactSecrets, classifyHcloudArgs } from 'file:///C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-aa791fe63935/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, loadRiskRules } from 'file:///C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-aa791fe63935/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
const rr = loadRiskRules(); console.log('rules', (rr.rules||[]).length);
const r = classifyTextCommand('cat ~/.hcloud/credentials.json'); console.log(JSON.stringify(r));
