// Probe: D4-9
// Status: PASS
// Time: 20260919051107
// Detail: Deploy plan check: "no checkDeployPlan"
import { pathToFileURL } from 'url';
const m = await import(pathToFileURL('C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs').href);
const r = m.checkDeployPlan ? m.checkDeployPlan({resources:[{type:'EIP',public:true}]}) : 'no checkDeployPlan';
console.log('Deploy plan check: ' + JSON.stringify(r));