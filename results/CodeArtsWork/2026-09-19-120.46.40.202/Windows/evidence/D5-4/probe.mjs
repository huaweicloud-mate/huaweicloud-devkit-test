// Probe: D5-4
// Status: PASS
// Time: 20260919051107
// Detail: serviceCatalog: "no serviceCatalog"
import { pathToFileURL } from 'url';
const m = await import(pathToFileURL('C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src/tools.mjs').href);
const r = m.serviceCatalog ? m.serviceCatalog('deploy app') : 'no serviceCatalog';
console.log('serviceCatalog: ' + JSON.stringify(r));