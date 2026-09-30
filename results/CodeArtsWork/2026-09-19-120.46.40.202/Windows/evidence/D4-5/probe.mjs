// Probe: D4-5
// Status: FAIL
// Time: 20260919051107
// Detail: hcloud ECS DeleteServers => {"matched":"no checkCommand"}
hcloud VPC DeleteVpc => {"matched":"no checkCommand"}
hcloud RDS DeleteInstance => {"matched":"no checkCommand"}
import { pathToFileURL } from 'url';
const m = await import(pathToFileURL('C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs').href);
const cmds = ['hcloud ECS DeleteServers', 'hcloud VPC DeleteVpc', 'hcloud RDS DeleteInstance'];
for (const cmd of cmds) {
  const r = m.checkCommand ? m.checkCommand(cmd) : { matched: 'no checkCommand' };
  console.log(cmd + ' => ' + JSON.stringify(r));
}