// Probe: D4-1
// Status: PASS
// Time: 20260919051106
// Detail: Command: cat ~/.config/huaweicloud/credentials.json
Result: {"matched":"no checkCommand"}
import { pathToFileURL } from 'url';
const m = await import(pathToFileURL('C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs').href);
const cmd = 'cat ~/.config/huaweicloud/credentials.json';
const r = m.checkCommand ? m.checkCommand(cmd) : { matched: 'no checkCommand' };
console.log('Command: ' + cmd);
console.log('Result: ' + JSON.stringify(r));