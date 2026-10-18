import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const r = await callTool('huaweicloud_check_cli', {});
const isError = r?.isError === true;
const hasFields = r && (r.installed !== undefined || r.status || r.kooCliVersion || r.authenticated !== undefined);
const status = (!isError && hasFields) ? 'PASS' : 'FAIL';
const output = { caseId: 'D1-41', status, why: 'isError=' + isError + ' hasFields=' + !!hasFields + ' installed=' + r?.installed, executedAt: '20261019051813', result: { isError, hasFields: !!hasFields, installed: r?.installed, status: r?.status, kooCliVersion: r?.kooCliVersion, keys: Object.keys(r||{}).slice(0,10) } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
