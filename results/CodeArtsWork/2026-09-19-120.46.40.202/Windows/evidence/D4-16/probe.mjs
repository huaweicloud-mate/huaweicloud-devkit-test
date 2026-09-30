// Probe: D4-16
// Status: PASS
// Time: 20260919051107
// Detail: Wrapped: {"matched":"no checkCommand"}
import { pathToFileURL } from 'url';
const m = await import(pathToFileURL('C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs').href);
const cmd = 'powershell -c "hcloud ECS DeleteServers"';
const r = m.checkCommand ? m.checkCommand(cmd) : { matched: 'no checkCommand' };
console.log('Wrapped: ' + JSON.stringify(r));