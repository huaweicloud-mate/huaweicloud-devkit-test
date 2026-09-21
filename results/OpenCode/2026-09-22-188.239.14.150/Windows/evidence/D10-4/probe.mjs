// D10-4: Safety intervention static rules
import { loadRiskRules, evaluateCommandRisk } from 'C:/Users/Administrator/devkit-test/opencode/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
const rules = loadRiskRules();
console.log('deny:', rules.filter(r=>r.severity==='deny').length);
console.log('warn:', rules.filter(r=>r.severity==='warn').length);
