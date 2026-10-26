// Source-level probe for D10-4
// Directly imports loadRiskRules + evaluate from risk-rule-engine.mjs
// Tests rule count (9 deny + 7 warn) + delete=deny + readonly=allow
import { loadRiskRules, evaluate } from 'risk-rule-engine.mjs';
const rules = loadRiskRules();
const deleteResult = evaluate('command', { command: 'hcloud ECS DeleteServers' });
