import { pathToFileURL } from 'node:url';
const hdkSrc = pathToFileURL('C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\hdk\\plugins\\huaweicloud-core\\src\\risk-rule-engine.mjs').href;
const { loadRiskRules, evaluateCommandRisk } = await import(hdkSrc);

const r1 = evaluateCommandRisk('hcloud ECS DeleteServers --server-ids xxx');
console.log('DeleteServers:', JSON.stringify(r1, null, 2));

const r2 = evaluateCommandRisk('hcloud ECS DeleteServers --force');
console.log('\nDeleteServers --force:', JSON.stringify(r2, null, 2));

const r3 = evaluateCommandRisk('hcloud ECS NovaListServersDetails');
console.log('\nNovaListServersDetails:', JSON.stringify(r3, null, 2));
