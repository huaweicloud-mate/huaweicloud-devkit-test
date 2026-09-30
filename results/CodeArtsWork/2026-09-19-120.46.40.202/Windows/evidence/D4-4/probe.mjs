// Probe: D4-4
// Status: PASS
// Time: 20260919051107
// Detail: hcloud ECS ListServers => {"matched":"no checkCommand"}
hcloud VPC ListVpcs => {"matched":"no checkCommand"}
hcloud RDS ListInstances => {"matched":"no checkCommand"}
import { pathToFileURL } from 'url';
const m = await import(pathToFileURL('C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs').href);
const cmds = ['hcloud ECS ListServers', 'hcloud VPC ListVpcs', 'hcloud RDS ListInstances'];
for (const cmd of cmds) {
  const r = m.checkCommand ? m.checkCommand(cmd) : { matched: 'no checkCommand' };
  console.log(cmd + ' => ' + JSON.stringify(r));
}