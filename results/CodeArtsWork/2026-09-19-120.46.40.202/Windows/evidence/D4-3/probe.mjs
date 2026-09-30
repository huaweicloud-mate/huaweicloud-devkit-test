// Probe: D4-3
// Status: FAIL
// Time: 20260919051107
// Detail: hcloud KMS ShowSecret => {"matched":"no checkCommand"}
hcloud DEW ShowSecret => {"matched":"no checkCommand"}
hcloud CSMS ShowSecret => {"matched":"no checkCommand"}
import { pathToFileURL } from 'url';
const m = await import(pathToFileURL('C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs').href);
const cmds = ['hcloud KMS ShowSecret', 'hcloud DEW ShowSecret', 'hcloud CSMS ShowSecret'];
for (const cmd of cmds) {
  const r = m.checkCommand ? m.checkCommand(cmd) : { matched: 'no checkCommand' };
  console.log(cmd + ' => ' + JSON.stringify(r));
}