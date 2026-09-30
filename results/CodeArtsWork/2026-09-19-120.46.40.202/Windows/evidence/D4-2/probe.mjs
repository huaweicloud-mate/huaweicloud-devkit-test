// Probe: D4-2
// Status: FAIL
// Time: 20260919051107
// Detail: printenv HW_ACCESS_KEY => {"matched":"no checkCommand"}
echo  => {"matched":"no checkCommand"}
set HW_ACCESS_KEY => {"matched":"no checkCommand"}
echo %HW_SECRET_KEY% => {"matched":"no checkCommand"}
import { pathToFileURL } from 'url';
const m = await import(pathToFileURL('C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs').href);
const cmds = ['printenv HW_ACCESS_KEY', 'echo ', 'set HW_ACCESS_KEY', 'echo %HW_SECRET_KEY%'];
for (const cmd of cmds) {
  const r = m.checkCommand ? m.checkCommand(cmd) : { matched: 'no checkCommand' };
  console.log(cmd + ' => ' + JSON.stringify(r));
}