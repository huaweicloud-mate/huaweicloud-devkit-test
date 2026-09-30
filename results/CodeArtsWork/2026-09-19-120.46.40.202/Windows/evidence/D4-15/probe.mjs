// Probe: D4-15
// Status: PASS
// Time: 20260919051107
// Detail: hcloud ecs DELETESERVERS => {"matched":"no checkCommand"}
hcloud%20ECS%20DeleteServers => {"matched":"no checkCommand"}
hcloud ECS DeleteServers => {"matched":"no checkCommand"}
import { pathToFileURL } from 'url';
const m = await import(pathToFileURL('C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs').href);
const cmds = ['hcloud ecs DELETESERVERS', 'hcloud%20ECS%20DeleteServers', 'hcloud ECS Delete' + 'Servers'];
for (const cmd of cmds) {
  const r = m.checkCommand ? m.checkCommand(cmd) : { matched: 'no checkCommand' };
  console.log(cmd + ' => ' + JSON.stringify(r));
}