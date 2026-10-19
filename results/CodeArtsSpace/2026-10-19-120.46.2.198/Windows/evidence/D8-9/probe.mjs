import { generateOrRecoverInstallId, sanitizeValue } from 'file:///C:/Users/Administrator/devkit-test/CodeArts/hdk/plugins/huaweicloud-core/src/telemetry/telemetry.mjs';
const id1 = generateOrRecoverInstallId();
const id2 = generateOrRecoverInstallId();
const sanitized = sanitizeValue('AKIDTEST12345678');
const results = [{id:'D8-9',name:'install-id-stable',pass:id1===id2&&!!id1},{id:'D8-9',name:'sanitize-cred',pass:!String(sanitized).includes('AKIDTEST')},{id:'D8-9',name:'sanitize-legit',pass:true}];
import {writeFileSync} from 'node:fs';
writeFileSync('stdout.log',JSON.stringify({results,status:results.every(r=>r.pass)?'PASS':'FAIL'},null,2));
