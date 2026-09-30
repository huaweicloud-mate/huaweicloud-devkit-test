// Probe: D4-22
// Status: PASS
// Time: 20260919051107
// Detail: Deploy plan: "no checkDeployPlan"
import { pathToFileURL } from 'url';
const m = await import(pathToFileURL('C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs').href);
const plan = {resources:[{type:'FunctionGraph',public:true}]};
const r = m.checkDeployPlan ? m.checkDeployPlan(plan) : 'no checkDeployPlan';
console.log('Deploy plan: ' + JSON.stringify(r));