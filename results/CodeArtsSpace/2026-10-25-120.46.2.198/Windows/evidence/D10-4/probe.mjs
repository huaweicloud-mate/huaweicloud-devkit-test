// D10-4: loadRiskRules + evaluateCommandRisk
import {loadRiskRules, evaluateCommandRisk} from 'risk-rule-engine.mjs';
const rules=loadRiskRules(); // 19条(9 deny+10 warn)
// cat凭证=>deny, hcloud ECS ListServers=>allow, hcloud ECS DeleteServers=>warn(需确认)